import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseLibrary(filename, varName) {
  const content = fs.readFileSync(path.join(__dirname, filename), "utf8");
  // Extract the array block: export const <varName>: LibraryComponent[] = [ ... ];
  const match = content.match(new RegExp(`export const ${varName}(?:: LibraryComponent\\[\\])? = ([\\s\\S]*?);\\n`));
  if (!match) {
    throw new Error(`Could not find ${varName} in ${filename}`);
  }
  return new Function(`return ${match[1]}`)();
}

const baseLibrary = parseLibrary("base-components.ts", "baseLibrary");
const webLibrary = parseLibrary("web-components.ts", "webLibrary");
const agentLibrary = parseLibrary("agent-components.ts", "agentLibrary");

test("Base Library has correct atomic categories and self-contained controls", () => {
  const categories = new Set(baseLibrary.map((c) => c.category));
  assert.ok(categories.has("基础图元"), "Has 基础图元");
  assert.ok(categories.has("基础控件"), "Has 基础控件");
  assert.ok(categories.has("流程图元"), "Has 流程图元");
  assert.ok(categories.has("结构容器"), "Has 结构容器");

  const types = new Set(baseLibrary.map((c) => c.type));
  assert.ok(types.has("rectangle"), "Has rectangle");
  assert.ok(types.has("text"), "Has text");
  assert.ok(types.has("button"), "Has button");
  assert.ok(types.has("button-primary"), "Has button-primary");
  assert.ok(types.has("input"), "Has input");
  assert.ok(types.has("textarea"), "Has textarea");
  assert.ok(types.has("select"), "Has select");
  assert.ok(types.has("radio"), "Has radio");
  assert.ok(types.has("checkbox"), "Has checkbox");
  assert.ok(types.has("switch"), "Has switch");
  assert.ok(types.has("connector"), "Has connector");
  assert.ok(types.has("flow-process"), "Has flow-process");
});

test("Web Library is self-contained with atomic design layers and primitives", () => {
  const categories = new Set(webLibrary.map((c) => c.category));
  assert.ok(categories.has("Web结构"), "Has Web结构");
  assert.ok(categories.has("Web表单"), "Has Web表单");
  assert.ok(categories.has("Web复合"), "Has Web复合");
  assert.ok(categories.has("Web展示与反馈"), "Has Web展示与反馈");
  assert.ok(categories.has("Web模版"), "Has Web模版");

  // Verify atomic reuse
  const webStructureItems = webLibrary.filter((c) => c.category === "Web结构");
  const structTypes = new Set(webStructureItems.map((c) => c.type));
  assert.ok(structTypes.has("rectangle"), "Web has rectangle for card surface");
  assert.ok(structTypes.has("text"), "Web has text for typography");
  assert.ok(structTypes.has("line"), "Web has line for divider");
  assert.ok(structTypes.has("browser-frame"), "Web has browser-frame for viewport");

  const cardSurface = webStructureItems.find((c) => c.type === "rectangle");
  assert.equal(cardSurface.label, "卡片底板");
  assert.equal(cardSurface.defaultWidth, 360);
  assert.equal(cardSurface.defaultHeight, 240);
});

test("Agent Library is self-contained with desktop client atomic layers", () => {
  const categories = new Set(agentLibrary.map((c) => c.category));
  assert.ok(categories.has("Agent基础"), "Has Agent基础");
  assert.ok(categories.has("Agent分子"), "Has Agent分子");
  assert.ok(categories.has("Agent功能舱"), "Has Agent功能舱");
  assert.ok(categories.has("Agent模版"), "Has Agent模版");

  // Verify atomic reuse
  const agentBaseItems = agentLibrary.filter((c) => c.category === "Agent基础");
  const baseTypes = new Set(agentBaseItems.map((c) => c.type));
  assert.ok(baseTypes.has("browser-frame"), "Agent has desktop window frame");
  assert.ok(baseTypes.has("rectangle"), "Agent has panel container");
  assert.ok(baseTypes.has("text"), "Agent has explanation text");
  assert.ok(baseTypes.has("line"), "Agent has section divider");
  assert.ok(baseTypes.has("pin-note"), "Agent has status dot indicator");
  assert.ok(baseTypes.has("button-primary"), "Agent has pill action button");

  const panelContainer = agentBaseItems.find((c) => c.type === "rectangle");
  assert.equal(panelContainer.label, "面板容器底板");
  assert.equal(panelContainer.defaultWidth, 320);
  assert.equal(panelContainer.defaultHeight, 480);
});

test("All libraries have valid metadata and positive dimensions", () => {
  const allLibraries = [...baseLibrary, ...webLibrary, ...agentLibrary];
  assert.ok(allLibraries.length > 50, "Combined library contains all components");

  for (const item of allLibraries) {
    assert.ok(item.type, "Item must have type");
    assert.ok(item.label, `Item ${item.type} must have label`);
    assert.ok(item.category, `Item ${item.type} must have category`);
    assert.ok(item.icon, `Item ${item.type} must have icon`);
    assert.ok(item.defaultWidth > 0, `Item ${item.type} must have positive width`);
    assert.ok(item.defaultHeight > 0, `Item ${item.type} must have positive height`);
  }
});
