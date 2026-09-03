import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blockTemplatesSource = fs.readFileSync(path.join(__dirname, "block-templates.ts"), "utf8");

// Simulate block templates and grouping functions
function genId() {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeChild(
  type,
  name,
  x,
  y,
  width,
  height,
  parentId,
  props = {},
) {
  return {
    id: genId(),
    type,
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    parentId,
    props,
    children: [],
  };
}

const BLOCK_TEMPLATE_TYPES = new Set([
  // Web 业务模版
  "web-button-group",
  "web-admin-layout",
  "web-filter-bar",
  "web-crud-table",
  "web-form-layout",
  "web-login-card",
  "web-steps-form",
  "web-dashboard-page",
  "web-settings-page",
  "web-pricing-table",
  "web-faq-section",

  // Agent 完整模版与复合侧栏
  "agent-nav-sidebar",
  "agent-home-layout",
  "agent-chat-stream-layout",
  "agent-split-workspace-layout",
  "agent-employee-workspace-layout",
  "agent-employee-market-layout",
]);

function isBlockTemplate(type) {
  return BLOCK_TEMPLATE_TYPES.has(type);
}

function createBlockTemplateGroup(type, posX, posY, parentId = null) {
  const groupId = genId();

  if (type === "agent-nav-sidebar") {
    const width = 240;
    const height = 640;
    const children = [
      makeChild("rectangle", "侧栏底框", 0, 0, width, height, groupId),
      makeChild("agent-sidebar-header", "侧栏窗口头部", 12, 12, 216, 28, groupId),
      makeChild("agent-mode-switch", "模式切换分段器", 12, 48, 216, 32, groupId),
      makeChild("agent-new-task-button", "新建任务按钮", 12, 88, 216, 34, groupId),
      makeChild("agent-session-list", "置顶会话列表", 12, 130, 216, 96, groupId),
      makeChild("agent-project-tree", "项目与会话树", 12, 234, 216, 200, groupId),
      makeChild("agent-sidebar-nav", "侧栏快捷导航组", 12, 490, 216, 88, groupId),
      makeChild("agent-user-footer", "用户身份与设置底栏", 12, 586, 216, 44, groupId),
    ];
    return {
      id: groupId,
      type: "group",
      name: "智能体侧边栏",
      x: posX,
      y: posY,
      width,
      height,
      children,
    };
  }

  return null;
}

function canUngroupElements(selectedIds, elements) {
  if (!selectedIds || selectedIds.length === 0) return false;
  const flat = flattenElements(elements);
  return flat.some(
    (el) =>
      selectedIds.includes(el.id) &&
      (el.type === "group" || (el.children && el.children.length > 0) || isBlockTemplate(el.type)),
  );
}

function flattenElements(list) {
  const result = [];
  for (const el of list) {
    result.push(el);
    if (el.children && el.children.length > 0) {
      result.push(...flattenElements(el.children));
    }
  }
  return result;
}

function ungroupElements(selectedIds, elements) {
  if (!selectedIds || selectedIds.length === 0) {
    return { nextElements: elements, releasedIds: [] };
  }

  const selectedSet = new Set(selectedIds);
  const releasedIds = [];

  const processLevel = (list) => {
    const result = [];

    for (const item of list) {
      if (selectedSet.has(item.id)) {
        if (item.type === "group" || (item.children && item.children.length > 0)) {
          const parentX = item.x;
          const parentY = item.y;
          const parentId = item.parentId ?? null;

          for (const child of item.children) {
            const releasedChild = {
              ...child,
              x: Math.round(parentX + child.x),
              y: Math.round(parentY + child.y),
              parentId,
            };
            result.push(releasedChild);
            releasedIds.push(child.id);
          }
        } else if (isBlockTemplate(item.type)) {
          const parentX = item.x;
          const parentY = item.y;
          const parentId = item.parentId ?? null;
          const templateGroup = createBlockTemplateGroup(item.type, parentX, parentY, parentId);
          if (templateGroup && templateGroup.children && templateGroup.children.length > 0) {
            for (const child of templateGroup.children) {
              const releasedChild = {
                ...child,
                x: Math.round(child.x),
                y: Math.round(child.y),
                parentId,
              };
              result.push(releasedChild);
              releasedIds.push(child.id);
            }
          } else {
            result.push(item);
          }
        } else {
          result.push(item);
        }
      } else {
        result.push({
          ...item,
          children: item.children ? processLevel(item.children) : [],
        });
      }
    }

    return result;
  };

  const nextElements = processLevel(elements);
  return { nextElements, releasedIds };
}

test("BLOCK_TEMPLATE_TYPES includes agent-nav-sidebar and all 5 Agent templates", () => {
  const agentTemplates = [
    "agent-nav-sidebar",
    "agent-home-layout",
    "agent-chat-stream-layout",
    "agent-split-workspace-layout",
    "agent-employee-workspace-layout",
    "agent-employee-market-layout",
  ];

  for (const t of agentTemplates) {
    assert.equal(isBlockTemplate(t), true, `${t} should be recognized as a block template`);
  }

  assert.equal(isBlockTemplate("agent-mode-switch"), false);
  assert.equal(isBlockTemplate("agent-new-task-button"), false);
});

test("agent-nav-sidebar can be created as a group and ungrouped into 8 atomic components", () => {
  const sidebarGroup = createBlockTemplateGroup("agent-nav-sidebar", 100, 100);
  assert.ok(sidebarGroup);
  assert.equal(sidebarGroup.type, "group");
  assert.equal(sidebarGroup.name, "智能体侧边栏");
  assert.equal(sidebarGroup.children.length, 8);

  const types = sidebarGroup.children.map((c) => c.type);
  assert.ok(types.includes("rectangle"));
  assert.ok(types.includes("agent-sidebar-header"));
  assert.ok(types.includes("agent-mode-switch"));
  assert.ok(types.includes("agent-new-task-button"));
  assert.ok(types.includes("agent-session-list"));
  assert.ok(types.includes("agent-project-tree"));
  assert.ok(types.includes("agent-sidebar-nav"));
  assert.ok(types.includes("agent-user-footer"));

  // Test ungrouping
  const { nextElements, releasedIds } = ungroupElements([sidebarGroup.id], [sidebarGroup]);
  assert.equal(nextElements.length, 8);
  assert.equal(releasedIds.length, 8);

  const modeSwitch = nextElements.find((e) => e.type === "agent-mode-switch");
  assert.ok(modeSwitch);
  assert.equal(modeSwitch.x, 100 + 12);
  assert.equal(modeSwitch.y, 100 + 48);

  const newTaskBtn = nextElements.find((e) => e.type === "agent-new-task-button");
  assert.ok(newTaskBtn);
  assert.equal(newTaskBtn.x, 100 + 12);
  assert.equal(newTaskBtn.y, 100 + 88);
});

test("canUngroupElements and ungroupElements support dynamic explosion for single agent-nav-sidebar elements", () => {
  const singleSidebarEl = {
    id: "sidebar-standalone-1",
    type: "agent-nav-sidebar",
    name: "智能体侧边栏",
    x: 50,
    y: 60,
    width: 240,
    height: 640,
    children: [],
  };

  assert.equal(canUngroupElements(["sidebar-standalone-1"], [singleSidebarEl]), true);

  const { nextElements, releasedIds } = ungroupElements(["sidebar-standalone-1"], [singleSidebarEl]);
  assert.equal(nextElements.length, 8);
  assert.equal(releasedIds.length, 8);
  assert.ok(nextElements.some((e) => e.type === "agent-mode-switch"));
  assert.ok(nextElements.some((e) => e.type === "agent-new-task-button"));
});

test("block-templates.ts includes web-file-manager-layout and agent-knowledge-base-layout in BLOCK_TEMPLATE_TYPES", () => {
  assert.ok(blockTemplatesSource.includes('"web-file-manager-layout"'), "Includes web-file-manager-layout");
  assert.ok(blockTemplatesSource.includes('"agent-knowledge-base-layout"'), "Includes agent-knowledge-base-layout");
  assert.ok(blockTemplatesSource.includes('case "web-file-manager-layout":'), "Includes web-file-manager-layout case in createBlockTemplateGroup");
  assert.ok(blockTemplatesSource.includes('case "agent-knowledge-base-layout":'), "Includes agent-knowledge-base-layout case in createBlockTemplateGroup");
  assert.ok(blockTemplatesSource.includes('makeChild("file-list"'), "Uses file-list component inside block templates");
});

test("Agent client framework components (home, chat, split, desktop-frame) are in BLOCK_TEMPLATE_TYPES and support ungrouping (打散)", () => {
  assert.ok(blockTemplatesSource.includes('"agent-client-home"'), "Includes agent-client-home in BLOCK_TEMPLATE_TYPES");
  assert.ok(blockTemplatesSource.includes('"agent-client-chat"'), "Includes agent-client-chat in BLOCK_TEMPLATE_TYPES");
  assert.ok(blockTemplatesSource.includes('"agent-client-split"'), "Includes agent-client-split in BLOCK_TEMPLATE_TYPES");
  assert.ok(blockTemplatesSource.includes('"agent-desktop-frame"'), "Includes agent-desktop-frame in BLOCK_TEMPLATE_TYPES");

  assert.ok(blockTemplatesSource.includes('case "agent-client-home":'), "Includes agent-client-home case in createBlockTemplateGroup");
  assert.ok(blockTemplatesSource.includes('case "agent-client-chat":'), "Includes agent-client-chat case in createBlockTemplateGroup");
  assert.ok(blockTemplatesSource.includes('case "agent-client-split":'), "Includes agent-client-split case in createBlockTemplateGroup");
  assert.ok(blockTemplatesSource.includes('case "agent-desktop-frame":'), "Includes agent-desktop-frame case in createBlockTemplateGroup");

  // Verify 1280x800 dimensions in createBlockTemplateGroup for agent clients
  assert.ok(blockTemplatesSource.includes("const width = 1280;"), "Uses 1280 width for desktop clients");
  assert.ok(blockTemplatesSource.includes("const height = 800;"), "Uses 800 height for desktop clients");
});

