// Rasterize the actual component DOM. No second, approximate drawing implementation.
const properties = [
  "display", "position", "box-sizing", "width", "height", "min-width", "min-height", "max-width", "max-height",
  "top", "right", "bottom", "left", "margin", "padding", "overflow", "overflow-x", "overflow-y", "z-index",
  "color", "background-color", "background-image", "background-size", "background-position", "background-repeat", "background-clip",
  "border-top", "border-right", "border-bottom", "border-left", "border-radius", "outline", "box-shadow",
  "opacity", "visibility", "transform", "transform-origin", "translate", "rotate", "scale", "clip-path",
  "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "text-transform",
  "text-decoration", "text-indent", "text-overflow", "white-space", "word-break", "overflow-wrap", "vertical-align",
  "flex", "flex-direction", "flex-wrap", "align-items", "align-self", "align-content", "justify-content", "justify-items", "justify-self",
  "gap", "row-gap", "column-gap", "order", "grid-template-columns", "grid-template-rows", "grid-auto-flow", "grid-column", "grid-row",
  "object-fit", "object-position", "aspect-ratio", "list-style", "border-collapse", "border-spacing", "table-layout",
  "fill", "fill-opacity", "stroke", "stroke-width", "stroke-opacity", "stroke-linecap", "stroke-linejoin", "stroke-dasharray",
  "stroke-dashoffset", "paint-order", "marker-start", "marker-end", "filter", "-webkit-line-clamp", "-webkit-box-orient",
];

const readDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob);
});

export async function exportArtworkPng(artwork: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  const assets = new Map<string, Promise<string>>();
  const usedFonts = new Set<string>();
  const embed = (source: string): Promise<string> => {
    if (source.startsWith("data:") || source.startsWith("#")) return Promise.resolve(source);
    const url = new URL(source, document.baseURI).href;
    let value = assets.get(url);
    if (!value) {
      value = fetch(url, { signal: AbortSignal.timeout(15000) }).then(response => {
        if (!response.ok) throw new Error("图片或字体加载失败，请检查网络后重试");
        return response.blob();
      }).then(readDataUrl);
      assets.set(url, value);
    }
    return value;
  };
  const embedUrls = async (value: string, base = document.baseURI): Promise<string> => {
    const matches = [...value.matchAll(/url\(["']?([^"')]+)["']?\)/g)];
    for (const match of matches) {
      // SVG markers reference definitions in this same exported document.
      const url = match[1];
      if (url.startsWith("#") || (url.includes("#") && url.split("#")[0] === location.href.split("#")[0])) {
        value = value.replace(match[0], `url(#${url.split("#").at(-1)})`);
      } else value = value.replace(match[0], `url("${await embed(new URL(url, base).href)}")`);
    }
    return value;
  };
  const clone = async (source: Element): Promise<Element> => {
    const target = source.cloneNode(false) as HTMLElement | SVGElement;
    target.removeAttribute("class"); target.removeAttribute("style");
    const style = getComputedStyle(source);
    for (const family of style.fontFamily.split(",")) usedFonts.add(family.trim().replaceAll('"', "").replaceAll("'", ""));
    for (const property of properties) {
      const value = style.getPropertyValue(property);
      if (value) target.style.setProperty(property, value.includes("url(") ? await embedUrls(value) : value);
    }
    target.style.setProperty("animation", "none"); target.style.setProperty("transition", "none");
    if (source instanceof HTMLImageElement) {
      (target as HTMLImageElement).src = await embed(source.currentSrc || source.src);
      target.removeAttribute("srcset"); target.removeAttribute("loading");
    }
    if (source instanceof HTMLInputElement) target.setAttribute("value", source.value);
    if (source instanceof HTMLTextAreaElement) target.textContent = source.value;
    else for (const child of source.childNodes) {
      target.appendChild(child instanceof Element ? await clone(child) : child.cloneNode(true));
    }
    return target;
  };
  const origin = artwork.getBoundingClientRect();
  const bounds = [...artwork.querySelectorAll("[data-element]")].filter(node => {
    const style = getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden";
  }).map(node => node.getBoundingClientRect());
  if (!bounds.length) throw new Error("当前页面没有可导出的可见内容");
  // Include strokes and connector arrowheads at the document edges.
  const left = Math.floor(Math.min(...bounds.map(rect => rect.left)) - origin.left) - 8;
  const top = Math.floor(Math.min(...bounds.map(rect => rect.top)) - origin.top) - 8;
  const width = Math.ceil(Math.max(...bounds.map(rect => rect.right)) - origin.left - left) + 8;
  const height = Math.ceil(Math.max(...bounds.map(rect => rect.bottom)) - origin.top - top) + 8;
  const scale = 2;
  if (width * scale > 16384 || height * scale > 16384 || width * height * scale * scale > 64000000) {
    throw new Error("页面过大，无法导出 PNG。请将内容拆分到多个页面后重试。");
  }
  const copy = await clone(artwork) as HTMLElement;
  copy.style.transform = `translate(${-left}px, ${-top}px)`;
  copy.style.transformOrigin = "0 0";
  // Bundle loaded fonts so SVG image decoding needs no external requests.
  const fonts: string[] = [];
  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules) if (rule instanceof CSSFontFaceRule && usedFonts.has(rule.style.fontFamily.replaceAll('"', "").replaceAll("'", ""))) {
      fonts.push(await embedUrls(rule.cssText, sheet.href || document.baseURI));
    }
  }
  const wrapper = document.createElement("div");
  wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  wrapper.style.cssText = `position:relative;width:${width}px;height:${height}px;overflow:hidden;background:${getComputedStyle(artwork).getPropertyValue("--background") || "#fff"};`;
  const fontStyle = document.createElement("style"); fontStyle.textContent = fonts.join("\n"); wrapper.append(fontStyle, copy);
  const markup = new XMLSerializer().serializeToString(wrapper);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}"><foreignObject x="0" y="0" width="${width}" height="${height}">${markup}</foreignObject></svg>`;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("图片渲染超时，请重试")), 15000);
    img.onload = () => { clearTimeout(timeout); resolve(); };
    img.onerror = () => { clearTimeout(timeout); reject(new Error("当前浏览器无法渲染此页面的 PNG，请使用 Chrome 或桌面客户端重试")); };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  const canvas = document.createElement("canvas"); canvas.width = width * scale; canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法创建图片画布");
  context.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("无法编码 PNG，请重试")), "image/png"));
}
