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

test("Web Library is structured with 5 user-centric workflow categories and navigation primitives", () => {
  const categories = new Set(webLibrary.map((c) => c.category));
  assert.ok(categories.has("Web导航"), "Has Web导航");
  assert.ok(categories.has("Web表单"), "Has Web表单");
  assert.ok(categories.has("Web展示"), "Has Web展示");
  assert.ok(categories.has("Web反馈"), "Has Web反馈");
  assert.ok(categories.has("Web模版"), "Has Web模版");

  // Verify navigation priority and completeness
  const webNavItems = webLibrary.filter((c) => c.category === "Web导航");
  const navTypes = new Set(webNavItems.map((c) => c.type));
  assert.ok(navTypes.has("web-top-nav"), "Web has top nav");
  assert.ok(navTypes.has("web-menu"), "Web has sidebar menu");
  assert.ok(navTypes.has("web-page-header"), "Web has page header");
  assert.ok(navTypes.has("web-breadcrumb"), "Web has breadcrumb");
  assert.ok(navTypes.has("web-tabs"), "Web has tabs");
  assert.ok(navTypes.has("web-segmented"), "Web has segmented control");
  assert.ok(navTypes.has("web-steps"), "Web has steps");
  assert.ok(navTypes.has("web-pagination"), "Web has pagination");
  assert.ok(navTypes.has("web-dropdown"), "Web has dropdown");

  const pageHeader = webNavItems.find((c) => c.type === "web-page-header");
  assert.equal(pageHeader.label, "页头标题栏");
  assert.equal(pageHeader.defaultWidth, 960);
  assert.equal(pageHeader.defaultHeight, 96);

  const segmented = webNavItems.find((c) => c.type === "web-segmented");
  assert.equal(segmented.label, "分段切换器");
  assert.equal(segmented.defaultWidth, 260);
  assert.equal(segmented.defaultHeight, 36);

  // Verify redundant primitives (hotspot, browser-frame) are removed from Web library
  const allWebTypes = new Set(webLibrary.map((c) => c.type));
  assert.ok(!allWebTypes.has("hotspot"), "Web does not duplicate hotspot");
  assert.ok(!allWebTypes.has("browser-frame"), "Web does not duplicate browser-frame");
});

test("Agent Library is structured with user-frequency hierarchy and clean atomic layers", () => {
  const categories = new Set(agentLibrary.map((c) => c.category));
  assert.ok(categories.has("Agent基础图元"), "Has Agent基础图元");
  assert.ok(categories.has("Agent框架容器"), "Has Agent框架容器");
  assert.ok(categories.has("Agent结构与数据"), "Has Agent结构与数据");
  assert.ok(categories.has("Agent核心交互"), "Has Agent核心交互");
  assert.ok(categories.has("Agent场景模版"), "Has Agent场景模版");

  // Verify atomic primitives are prioritized and clearly named
  const agentBaseItems = agentLibrary.filter((c) => c.category === "Agent基础图元");
  const baseTypes = new Set(agentBaseItems.map((c) => c.type));
  assert.ok(baseTypes.has("rectangle"), "Agent has rectangle");
  assert.ok(baseTypes.has("text"), "Agent has text");
  assert.ok(baseTypes.has("line"), "Agent has line");
  assert.ok(baseTypes.has("button-primary"), "Agent has button-primary");
  assert.ok(baseTypes.has("button"), "Agent has button");
  assert.ok(baseTypes.has("image"), "Agent has image");
  assert.ok(baseTypes.has("agent-status-badge"), "Agent has agent-status-badge in Agent基础图元");

  const rect = agentBaseItems.find((c) => c.type === "rectangle");
  assert.equal(rect.label, "矩形");
  const text = agentBaseItems.find((c) => c.type === "text");
  assert.equal(text.label, "文字");
  const statusBadge = agentBaseItems.find((c) => c.type === "agent-status-badge");
  assert.equal(statusBadge.label, "状态徽标");

  // Verify redundant widgets (status dot, empty browser frame) are removed
  assert.ok(!baseTypes.has("pin-note"), "Agent removed redundant pin-note / status dot");
  assert.ok(!baseTypes.has("browser-frame"), "Agent removed redundant browser-frame");

  // Verify framework and tree additions
  const frameItems = agentLibrary.filter((c) => c.category === "Agent框架容器");
  assert.ok(frameItems.some((c) => c.type === "agent-client-home"), "Agent has agent-client-home");
  assert.ok(frameItems.some((c) => c.type === "agent-client-chat"), "Agent has agent-client-chat");
  assert.ok(frameItems.some((c) => c.type === "agent-client-split"), "Agent has agent-client-split");
  assert.ok(frameItems.some((c) => c.type === "agent-desktop-frame"), "Agent has agent-desktop-frame");

  // Verify unified outer frame dimensions for all Agent client components (1280 x 800)
  for (const clientType of ["agent-client-home", "agent-client-chat", "agent-client-split", "agent-desktop-frame"]) {
    const item = frameItems.find((c) => c.type === clientType);
    assert.equal(item.defaultWidth, 1280, `${clientType} has unified width 1280`);
    assert.equal(item.defaultHeight, 800, `${clientType} has unified height 800`);
  }

  const structItems = agentLibrary.filter((c) => c.category === "Agent结构与数据");
  assert.ok(structItems.some((c) => c.type === "agent-directory-tree"), "Agent has agent-directory-tree");
  assert.ok(structItems.some((c) => c.type === "agent-filter-bar"), "Agent has agent-filter-bar");
  assert.ok(structItems.some((c) => c.type === "file-list"), "Agent has file-list");

  const interactItems = agentLibrary.filter((c) => c.category === "Agent核心交互");
  const attachmentComp = interactItems.find((c) => c.type === "agent-file-attachments");
  assert.ok(attachmentComp, "Agent has agent-file-attachments in Agent核心交互");
  assert.equal(attachmentComp.label, "附件组件");
});

test("All libraries have valid metadata and positive dimensions", () => {
  const allLibraries = [...baseLibrary, ...webLibrary, ...agentLibrary];
  assert.ok(allLibraries.length > 40, "Combined library contains all components");

  for (const item of allLibraries) {
    assert.ok(item.type, "Item must have type");
    assert.ok(item.label, `Item ${item.type} must have label`);
    assert.ok(item.category, `Item ${item.type} must have category`);
    assert.ok(item.icon, `Item ${item.type} must have icon`);
    assert.ok(item.defaultWidth > 0, `Item ${item.type} must have positive width`);
    assert.ok(item.defaultHeight > 0, `Item ${item.type} must have positive height`);
  }
});

test("Unified file-list is present across Base, Web, and Agent libraries with scenario-specific presets", () => {
  const baseFileList = baseLibrary.find((c) => c.type === "file-list");
  assert.ok(baseFileList, "file-list exists in baseLibrary");
  assert.equal(baseFileList.category, "结构容器");
  assert.equal(baseFileList.label, "文件列表");

  const webFileList = webLibrary.find((c) => c.type === "file-list");
  assert.ok(webFileList, "file-list exists in webLibrary");
  assert.equal(webFileList.category, "Web展示");
  assert.equal(webFileList.label, "文件资源列表");

  const agentFileList = agentLibrary.find((c) => c.type === "file-list");
  assert.ok(agentFileList, "file-list exists in agentLibrary");
  assert.equal(agentFileList.category, "Agent结构与数据");
  assert.equal(agentFileList.label, "文件资源列表");

  // Check template additions
  const webLayout = webLibrary.find((c) => c.type === "web-file-manager-layout");
  assert.ok(webLayout, "web-file-manager-layout exists in webLibrary");
  assert.equal(webLayout.category, "Web模版");

  const agentLayout = agentLibrary.find((c) => c.type === "agent-knowledge-base-layout");
  assert.ok(agentLayout, "agent-knowledge-base-layout exists in agentLibrary");
  assert.equal(agentLayout.category, "Agent场景模版");
});
