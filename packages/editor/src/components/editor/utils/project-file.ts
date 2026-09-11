import type { AutoLayout, EditorElement, Page } from "../types";

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Validate the entire file before replacing any part of the current document. */
export function parseProjectFile(text: string, fallbackName = "Untitled"): { id?: string; name: string; pages: Page[] } {
  const data: unknown = JSON.parse(text);
  if (!record(data) || !Array.isArray(data.pages)) throw new Error("项目文件格式无效：缺少页面列表");
  const pageIds = new Set<string>();
  const elementIds = new Set<string>();
  let count = 0;
  const element = (raw: unknown, parentId: string | null, depth: number): EditorElement => {
    if (!record(raw) || depth > 100 || ++count > 50000) throw new Error("项目图层格式无效或层级过深");
    if (typeof raw.id !== "string" || !raw.id || elementIds.has(raw.id)) throw new Error("项目存在缺失或重复的图层 ID");
    elementIds.add(raw.id);
    if (typeof raw.type !== "string" || !raw.type) throw new Error("项目图层缺少组件类型");
    for (const key of ["x", "y", "width", "height"] as const) {
      if (typeof raw[key] !== "number" || !Number.isFinite(raw[key]) || ((key === "width" || key === "height") && raw[key] < 0)) {
        throw new Error("项目图层的位置或尺寸无效");
      }
    }
    if (raw.children !== undefined && !Array.isArray(raw.children)) throw new Error("项目子图层列表无效");
    if (raw.props !== undefined && !record(raw.props)) throw new Error("项目组件属性无效");
    const props = raw.props ?? {};
    if (!Object.values(props).every(value => ["string", "boolean"].includes(typeof value) || (typeof value === "number" && Number.isFinite(value)))) {
      throw new Error("项目组件属性值无效");
    }
    let autoLayout: AutoLayout | null = null;
    if (raw.autoLayout != null) {
      const layout = raw.autoLayout;
      if (!record(layout) || !["horizontal", "vertical"].includes(String(layout.direction)) ||
        !["left", "center", "right", "stretch"].includes(String(layout.horizontalAlign)) ||
        !["top", "center", "bottom", "stretch"].includes(String(layout.verticalAlign)) ||
        !["hug", "fill", "fixed"].includes(String(layout.widthMode)) || !["hug", "fill", "fixed"].includes(String(layout.heightMode)) ||
        !["gap", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"].every(key => typeof layout[key] === "number" && Number.isFinite(layout[key]))) {
        throw new Error("项目自动布局参数无效");
      }
      autoLayout = layout as unknown as AutoLayout;
    }
    return {
      id: raw.id, type: raw.type as EditorElement["type"], name: typeof raw.name === "string" ? raw.name : raw.type,
      x: raw.x as number, y: raw.y as number, width: raw.width as number, height: raw.height as number,
      rotation: typeof raw.rotation === "number" && Number.isFinite(raw.rotation) ? raw.rotation : 0,
      opacity: typeof raw.opacity === "number" && Number.isFinite(raw.opacity) ? Math.max(0, Math.min(1, raw.opacity)) : 1,
      visible: raw.visible !== false, locked: raw.locked === true,
      props: props as EditorElement["props"], autoLayout,
      parentId: parentId ?? (typeof raw.parentId === "string" ? raw.parentId : null),
      children: ((raw.children ?? []) as unknown[]).map(child => element(child, raw.id as string, depth + 1)),
    };
  };
  const pages = data.pages.map((raw): Page => {
    if (!record(raw) || typeof raw.id !== "string" || !raw.id || pageIds.has(raw.id) || !Array.isArray(raw.elements)) {
      throw new Error("项目页面格式无效，或存在重复的页面 ID");
    }
    pageIds.add(raw.id);
    return { id: raw.id, name: typeof raw.name === "string" ? raw.name : "Page", elements: raw.elements.map(node => element(node, null, 0)) };
  });
  return { id: typeof data.id === "string" ? data.id : undefined, name: typeof data.name === "string" && data.name.trim() ? data.name : fallbackName, pages };
}

export function nextPageName(pages: Pick<Page, "name">[]): string {
  const names = new Set(pages.map(page => page.name));
  let number = 1;
  while (names.has(`Page ${number}`)) number++;
  return `Page ${number}`;
}
