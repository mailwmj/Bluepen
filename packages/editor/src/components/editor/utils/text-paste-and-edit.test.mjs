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
