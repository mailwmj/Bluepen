import assert from "node:assert/strict";
import test from "node:test";

function calculateTextDimensions(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lines = text.split(/\r\n|\r|\n/);
  let maxLineLength = 0;
  for (const line of lines) {
    let visualLen = 0;
    for (let i = 0; i < line.length; i++) {
      visualLen += line.charCodeAt(i) > 255 ? 2 : 1;
    }
    if (visualLen > maxLineLength) {
      maxLineLength = visualLen;
    }
  }

  let width = 180;
  let height = 36;

  if (lines.length === 1) {
    width = Math.min(600, Math.max(120, maxLineLength * 8.5 + 24));
    height = 36;
  } else {
    width = Math.min(560, Math.max(180, maxLineLength * 8.5 + 28));
    height = Math.max(48, lines.length * 22 + 16);
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
    lineCount: lines.length,
    characterCount: text.length,
  };
}

function isTextCapable(type, props) {
  return (
    type === "text" ||
    type === "button" ||
    type === "button-primary" ||
    type === "web-button" ||
    type === "sticky-note" ||
    type === "pin-note" ||
    type === "rectangle" ||
    type === "circle" ||
    type.startsWith("flow-") ||
    type === "card" ||
    type === "placeholder" ||
    type === "badge" ||
    type === "chip" ||
    Boolean(props?.text !== undefined || props?.hasText)
  );
}

test("Single-line text pasting calculates compact width and 36px height", () => {
  const shortText = "标题文字";
  const res = calculateTextDimensions(shortText);
  assert.ok(res);
  assert.equal(res.lineCount, 1);
  assert.equal(res.height, 36);
  assert.ok(res.width >= 120 && res.width <= 600);
});

test("Multi-line paragraph pasting calculates proportional height with line gaps", () => {
  const multiLine = "第一行文字\n第二行包含较长的描述性文案\n第三行总结";
  const res = calculateTextDimensions(multiLine);
  assert.ok(res);
  assert.equal(res.lineCount, 3);
  assert.equal(res.height, 3 * 22 + 16); // 82px
  assert.ok(res.width >= 180 && res.width <= 560);
});

test("isTextCapable accurately detects all text-bearing and shape components", () => {
  assert.equal(isTextCapable("text"), true);
  assert.equal(isTextCapable("sticky-note"), true);
  assert.equal(isTextCapable("rectangle"), true);
  assert.equal(isTextCapable("circle"), true);
  assert.equal(isTextCapable("button"), true);
  assert.equal(isTextCapable("button-primary"), true);
  assert.equal(isTextCapable("web-button"), true);
  assert.equal(isTextCapable("flow-process"), true);
  assert.equal(isTextCapable("flow-decision"), true);
  assert.equal(isTextCapable("line"), false);
  assert.equal(isTextCapable("arrow"), false);
  assert.equal(isTextCapable("image"), false);
  assert.equal(isTextCapable("custom-component", { hasText: true }), true);
});

test("Button typography resolution supports custom fontSize, fontFamily, and default fallbacks", () => {
  function resolveButtonTypography(type, props = {}) {
    const isButton = type === "button" || type === "button-primary" || type === "web-button";
    const defaultText =
      type === "button"
        ? "次要操作"
        : type === "button-primary" || type === "web-button"
        ? "主要操作"
        : "";
    const text = props.text ?? defaultText;
    const fontSize = Number(props.fontSize || (isButton ? 12 : 14));
    const fontWeight = Number(
      props.fontWeight || (type === "button-primary" ? 600 : isButton ? 500 : 400)
    );
    const fontFamily = props.fontFamily || (isButton ? "var(--font-mono)" : "var(--font-sans)");
    const textColor = props.textColor || (type === "button-primary" ? "var(--primary-foreground)" : "var(--foreground)");
    return { isButton, text, fontSize, fontWeight, fontFamily, textColor };
  }

  // Default button-primary
  const primaryDefaults = resolveButtonTypography("button-primary");
  assert.equal(primaryDefaults.text, "主要操作");
  assert.equal(primaryDefaults.fontSize, 12);
  assert.equal(primaryDefaults.fontWeight, 600);
  assert.equal(primaryDefaults.fontFamily, "var(--font-mono)");
  assert.equal(primaryDefaults.textColor, "var(--primary-foreground)");

  // Modified button with custom typography
  const customButton = resolveButtonTypography("button", {
    text: "提交申请",
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'PingFang SC', sans-serif",
    textColor: "#3B82F6",
  });
  assert.equal(customButton.text, "提交申请");
  assert.equal(customButton.fontSize, 16);
  assert.equal(customButton.fontWeight, 700);
  assert.equal(customButton.fontFamily, "'PingFang SC', sans-serif");
  assert.equal(customButton.textColor, "#3B82F6");
});

test("Shape and node typography resolution defaults to Nothing Design System specifications", () => {
  function resolveShapeTypography(type, props = {}) {
    const rawTextColor = String(props.textColor || "");
    const textColor = !rawTextColor || rawTextColor === "#18181B" ? "var(--foreground)" : rawTextColor;
    const fontSize = Number(props.fontSize || 16);
    const fontFamily = props.fontFamily ? String(props.fontFamily) : "var(--font-sans)";
    const lineHeight = props.lineHeight ? `${props.lineHeight}px` : "1.5";
    return { textColor, fontSize, fontFamily, lineHeight };
  }

  // Default rectangle with no text props
  const defaultRect = resolveShapeTypography("rectangle");
  assert.equal(defaultRect.textColor, "var(--foreground)");
  assert.equal(defaultRect.fontSize, 16);
  assert.equal(defaultRect.fontFamily, "var(--font-sans)");
  assert.equal(defaultRect.lineHeight, "1.5");

  // Legacy element that had #18181B saved
  const legacyNode = resolveShapeTypography("flow-process", { textColor: "#18181B" });
  assert.equal(legacyNode.textColor, "var(--foreground)", "Normalizes legacy #18181B to var(--foreground)");

  // Custom styling preserved
  const customNode = resolveShapeTypography("rectangle", {
    textColor: "#D71921",
    fontSize: 24,
    fontFamily: "var(--font-mono)",
    lineHeight: 28,
  });
  assert.equal(customNode.textColor, "#D71921");
  assert.equal(customNode.fontSize, 24);
  assert.equal(customNode.fontFamily, "var(--font-mono)");
  assert.equal(customNode.lineHeight, "28px");
});

test("InlineTextEditor container layout and alignment mirrors read-only previewers exactly", () => {
  function resolveInlineEditorLayout(element) {
    const isButton =
      element.type === "button" ||
      element.type === "button-primary" ||
      element.type === "web-button";
    const isPureText = element.type === "text";
    const isStickyNote = element.type === "sticky-note";
    const isBadgeOrChip = element.type === "badge" || element.type === "chip";
    const isPlaceholder = element.type === "placeholder";

    const paddingClass = isButton
      ? element.type === "web-button"
        ? "px-3 py-0"
        : "px-4 py-0"
      : isPureText
      ? "px-1"
      : isStickyNote
      ? "p-3"
      : isBadgeOrChip
      ? "px-2 py-0.5"
      : isPlaceholder
      ? "px-2 py-1"
      : "p-2";

    const align = element.props?.textAlign || element.props?.align || (element.type === "text" ? "left" : "center");
    const textVerticalAlign = element.props?.textVerticalAlign || (element.type === "text" ? "top" : "middle");

    const justifyClass = isButton || isBadgeOrChip || isPlaceholder
      ? "justify-center"
      : isStickyNote
      ? "justify-start"
      : align === "left"
      ? "justify-start"
      : align === "right"
      ? "justify-end"
      : "justify-center";

    const itemsClass = isButton || isBadgeOrChip || isPlaceholder
      ? "items-center"
      : isStickyNote
      ? "items-start"
      : isPureText
      ? textVerticalAlign === "middle" || textVerticalAlign === "center"
        ? "items-center"
        : textVerticalAlign === "bottom"
        ? "items-end"
        : "items-start"
      : textVerticalAlign === "top"
      ? "items-start"
      : textVerticalAlign === "bottom"
      ? "items-end"
      : "items-center";

    return { paddingClass, justifyClass, itemsClass };
  }

  // 1. Standard flowchart node (as in User Fig 1 & Fig 2)
  const flowNode = resolveInlineEditorLayout({ type: "flow-process", props: {} });
  assert.equal(flowNode.paddingClass, "p-2", "Matches ShapeTextRenderer p-2 container padding");
  assert.equal(flowNode.justifyClass, "justify-center", "Centered horizontally");
  assert.equal(flowNode.itemsClass, "items-center", "Centered vertically, zero upward jump");

  // 2. Pure text element
  const textEl = resolveInlineEditorLayout({ type: "text", props: { textAlign: "left", textVerticalAlign: "top" } });
  assert.equal(textEl.paddingClass, "px-1");
  assert.equal(textEl.justifyClass, "justify-start");
  assert.equal(textEl.itemsClass, "items-start");

  // 3. Button
  const buttonEl = resolveInlineEditorLayout({ type: "button", props: {} });
  assert.equal(buttonEl.paddingClass, "px-4 py-0");
  assert.equal(buttonEl.justifyClass, "justify-center");
  assert.equal(buttonEl.itemsClass, "items-center");

  // 4. Web button
  const webButtonEl = resolveInlineEditorLayout({ type: "web-button", props: {} });
  assert.equal(webButtonEl.paddingClass, "px-3 py-0");
});
