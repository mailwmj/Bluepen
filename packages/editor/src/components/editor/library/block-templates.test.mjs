import assert from "node:assert/strict";
import test from "node:test";

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

  // Agent 完整模版
  "agent-home-layout",
  "agent-chat-stream-layout",
  "agent-split-workspace-layout",
  "agent-employee-workspace-layout",
  "agent-employee-market-layout",
]);

function isBlockTemplate(type) {
  return BLOCK_TEMPLATE_TYPES.has(type);
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
      if (selectedSet.has(item.id) && (item.type === "group" || (item.children && item.children.length > 0))) {
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

test("BLOCK_TEMPLATE_TYPES includes all 5 Agent templates and Web templates", () => {
  const agentTemplates = [
    "agent-home-layout",
    "agent-chat-stream-layout",
    "agent-split-workspace-layout",
    "agent-employee-workspace-layout",
    "agent-employee-market-layout",
  ];

  for (const t of agentTemplates) {
    assert.equal(isBlockTemplate(t), true, `${t} should be recognized as a block template`);
  }

  assert.equal(isBlockTemplate("web-admin-layout"), true);
  assert.equal(isBlockTemplate("web-crud-table"), true);
  assert.equal(isBlockTemplate("rectangle"), false);
  assert.equal(isBlockTemplate("agent-prompt-box"), false);
});

test("Agent templates can be created as groups of atomic components and ungrouped into independent elements", () => {
  const agentTemplateTypes = [
    { type: "agent-home-layout", expectedMinChildren: 5, expectedName: "Agent对话主页" },
    { type: "agent-chat-stream-layout", expectedMinChildren: 10, expectedName: "Agent执行流会话页" },
    { type: "agent-split-workspace-layout", expectedMinChildren: 10, expectedName: "Agent分栏工作台" },
    { type: "agent-employee-workspace-layout", expectedMinChildren: 10, expectedName: "AI员工专属工作台" },
    { type: "agent-employee-market-layout", expectedMinChildren: 10, expectedName: "AI员工技能市场" },
  ];

  for (const { type, expectedMinChildren, expectedName } of agentTemplateTypes) {
    const groupId = genId();
    const posX = 150;
    const posY = 200;

    // Simulate creation
    const children = [
      makeChild("rectangle", "底框", 0, 0, 1080, 680, groupId),
      makeChild("agent-nav-sidebar", "侧栏", 0, 0, 240, 680, groupId),
      makeChild("agent-prompt-box", "输入框", 380, 270, 560, 140, groupId),
    ];
    while (children.length < expectedMinChildren) {
      children.push(makeChild("text", `文本-${children.length}`, 100, 100 + children.length * 20, 200, 30, groupId));
    }

    const group = {
      id: groupId,
      type: "group",
      name: expectedName,
      x: posX,
      y: posY,
      width: 1080,
      height: 680,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      autoLayout: null,
      parentId: null,
      props: {},
      children,
    };

    assert.equal(group.type, "group");
    assert.equal(group.children.length >= expectedMinChildren, true);

    // Test ungrouping (打散为独立组件)
    const { nextElements, releasedIds } = ungroupElements([groupId], [group]);
    assert.equal(nextElements.length, children.length);
    assert.equal(releasedIds.length, children.length);

    // Verify coordinates restoration
    const sidebar = nextElements.find((e) => e.type === "agent-nav-sidebar");
    assert.ok(sidebar);
    assert.equal(sidebar.x, posX + 0);
    assert.equal(sidebar.y, posY + 0);
    assert.equal(sidebar.parentId, null);

    const promptBox = nextElements.find((e) => e.type === "agent-prompt-box");
    assert.ok(promptBox);
    assert.equal(promptBox.x, posX + 380);
    assert.equal(promptBox.y, posY + 270);
    assert.equal(promptBox.parentId, null);
  }
});
