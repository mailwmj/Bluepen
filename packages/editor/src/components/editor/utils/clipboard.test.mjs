import assert from "node:assert/strict";
import test from "node:test";
import {
  serializeElementsForClipboard,
  parseElementsFromClipboard,
  cloneElementsForPaste,
  getTopLevelSelectedElements,
  BLUEPEN_CLIPBOARD_TYPE,
  setInternalClipboard,
  getInternalClipboard,
} from "./clipboard.ts";

test("serializeElementsForClipboard generates valid Bluepen JSON payload", () => {
  const elements = [
    {
      id: "rect-1",
      type: "rectangle",
      name: "矩形 1",
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      autoLayout: null,
      children: [],
      props: { fill: "#ffffff" },
      parentId: null,
    },
  ];

  const serialized = serializeElementsForClipboard(elements);
  assert.ok(typeof serialized === "string");
  const parsed = JSON.parse(serialized);
  assert.equal(parsed.type, BLUEPEN_CLIPBOARD_TYPE);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.elements.length, 1);
  assert.equal(parsed.elements[0].name, "矩形 1");
});

test("parseElementsFromClipboard handles Bluepen payload, direct array, and single element", () => {
  const el = {
    id: "el-1",
    type: "text",
    name: "文本",
    x: 50,
    y: 60,
    width: 120,
    height: 36,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {},
    parentId: null,
  };

  // Format 1: Bluepen payload
  const payload = JSON.stringify({
    type: BLUEPEN_CLIPBOARD_TYPE,
    version: 1,
    copiedAt: Date.now(),
    elements: [el],
  });
  const res1 = parseElementsFromClipboard(payload);
  assert.ok(res1);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].id, "el-1");

  // Format 2: Direct array
  const res2 = parseElementsFromClipboard(JSON.stringify([el]));
  assert.ok(res2);
  assert.equal(res2.length, 1);

  // Format 3: Single element object
  const res3 = parseElementsFromClipboard(JSON.stringify(el));
  assert.ok(res3);
  assert.equal(res3.length, 1);

  // Invalid JSON or non-element JSON returns null
  assert.equal(parseElementsFromClipboard("not json"), null);
  assert.equal(parseElementsFromClipboard(JSON.stringify({ someKey: "value" })), null);
  assert.equal(parseElementsFromClipboard(""), null);
  assert.equal(parseElementsFromClipboard(null), null);
});

test("cloneElementsForPaste regenerates unique IDs and preserves hierarchy and parentId", () => {
  const groupId = "group-1";
  const child1Id = "child-1";
  const child2Id = "child-2";

  const groupElement = {
    id: groupId,
    type: "group",
    name: "组合 1",
    x: 100,
    y: 100,
    width: 300,
    height: 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    parentId: null,
    props: {},
    children: [
      {
        id: child1Id,
        type: "rectangle",
        name: "矩形",
        x: 10,
        y: 10,
        width: 100,
        height: 50,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        children: [],
        props: {},
        parentId: groupId,
      },
      {
        id: child2Id,
        type: "text",
        name: "文本",
        x: 120,
        y: 20,
        width: 80,
        height: 30,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        children: [],
        props: {},
        parentId: groupId,
      },
    ],
  };

  const { clonedElements, newSelectedIds } = cloneElementsForPaste([groupElement], undefined, 0);

  assert.equal(clonedElements.length, 1);
  const clonedGroup = clonedElements[0];

  // Group ID must be new
  assert.notEqual(clonedGroup.id, groupId);
  assert.deepEqual(newSelectedIds, [clonedGroup.id]);

  // Position offset by 20px
  assert.equal(clonedGroup.x, 120);
  assert.equal(clonedGroup.y, 120);

  // Children must have new IDs and updated parentId pointing to new Group ID
  assert.equal(clonedGroup.children.length, 2);
  const clonedC1 = clonedGroup.children[0];
  const clonedC2 = clonedGroup.children[1];

  assert.notEqual(clonedC1.id, child1Id);
  assert.equal(clonedC1.parentId, clonedGroup.id);
  assert.equal(clonedC1.x, 10); // relative x preserved

  assert.notEqual(clonedC2.id, child2Id);
  assert.equal(clonedC2.parentId, clonedGroup.id);
  assert.equal(clonedC2.x, 120); // relative x preserved
});

test("cloneElementsForPaste remaps connector endpoint IDs when connected elements are cloned together", () => {
  const nodeA = {
    id: "node-a",
    type: "flow-process",
    name: "流程 A",
    x: 50,
    y: 50,
    width: 120,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {},
    parentId: null,
  };

  const nodeB = {
    id: "node-b",
    type: "flow-decision",
    name: "判断 B",
    x: 300,
    y: 50,
    width: 120,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {},
    parentId: null,
  };

  const connector = {
    id: "conn-1",
    type: "connector",
    name: "连接线",
    x: 170,
    y: 80,
    width: 130,
    height: 20,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {
      startElementId: "node-a",
      endElementId: "node-b",
      startPort: "right",
      endPort: "left",
    },
    parentId: null,
  };

  const { clonedElements } = cloneElementsForPaste([nodeA, nodeB, connector], { x: 200, y: 300 });

  assert.equal(clonedElements.length, 3);
  const clonedA = clonedElements.find((e) => e.name === "流程 A");
  const clonedB = clonedElements.find((e) => e.name === "判断 B");
  const clonedConn = clonedElements.find((e) => e.type === "connector");

  assert.ok(clonedA && clonedB && clonedConn);
  assert.notEqual(clonedA.id, "node-a");
  assert.notEqual(clonedB.id, "node-b");
  assert.notEqual(clonedConn.id, "conn-1");

  // Verify connector startElementId and endElementId remapped to new cloned IDs
  assert.equal(clonedConn.props.startElementId, clonedA.id);
  assert.equal(clonedConn.props.endElementId, clonedB.id);

  // Verify bounding box alignment (minX was 50, minY was 50 -> targetPos is 200, 300)
  assert.equal(clonedA.x, 200);
  assert.equal(clonedA.y, 300);
});

test("cloneElementsForPaste supports repeated paste cascading offsets", () => {
  const el = {
    id: "el-1",
    type: "rectangle",
    name: "矩形",
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {},
    parentId: null,
  };

  const paste1 = cloneElementsForPaste([el], undefined, 0);
  assert.equal(paste1.clonedElements[0].x, 120); // +20
  assert.equal(paste1.clonedElements[0].y, 120);

  const paste2 = cloneElementsForPaste([el], undefined, 1);
  assert.equal(paste2.clonedElements[0].x, 140); // +40
  assert.equal(paste2.clonedElements[0].y, 140);

  const paste3 = cloneElementsForPaste([el], undefined, 2);
  assert.equal(paste3.clonedElements[0].x, 160); // +60
  assert.equal(paste3.clonedElements[0].y, 160);
});

test("getTopLevelSelectedElements filters out children when parent is also selected", () => {
  const tree = [
    {
      id: "parent-1",
      type: "group",
      name: "Group",
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      autoLayout: null,
      parentId: null,
      props: {},
      children: [
        {
          id: "child-1",
          type: "rectangle",
          name: "Child",
          x: 10,
          y: 10,
          width: 50,
          height: 50,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          autoLayout: null,
          children: [],
          props: {},
          parentId: "parent-1",
        },
      ],
    },
    {
      id: "standalone-1",
      type: "text",
      name: "Standalone",
      x: 300,
      y: 300,
      width: 100,
      height: 30,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      autoLayout: null,
      children: [],
      props: {},
      parentId: null,
    },
  ];

  // If both parent-1 and child-1 are in selectedIds, only parent-1 should be returned
  const selected1 = getTopLevelSelectedElements(["parent-1", "child-1", "standalone-1"], tree);
  assert.equal(selected1.length, 2);
  assert.equal(selected1[0].id, "parent-1");
  assert.equal(selected1[1].id, "standalone-1");

  // If only child-1 is selected, child-1 is returned with absolute world coordinates and parentId null
  const selected2 = getTopLevelSelectedElements(["child-1"], tree);
  assert.equal(selected2.length, 1);
  assert.equal(selected2[0].id, "child-1");
  assert.equal(selected2[0].parentId, null);
  assert.equal(selected2[0].x, 10); // 0 + 10
  assert.equal(selected2[0].y, 10); // 0 + 10
});

test("getTopLevelSelectedElements computes absolute coordinates for nested group children", () => {
  const tree = [
    {
      id: "outer-group",
      type: "group",
      name: "外层组合",
      x: 300,
      y: 400,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      autoLayout: null,
      parentId: null,
      props: {},
      children: [
        {
          id: "inner-group",
          type: "group",
          name: "内层组合",
          x: 50,
          y: 60,
          width: 100,
          height: 100,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          autoLayout: null,
          parentId: "outer-group",
          props: {},
          children: [
            {
              id: "deep-child",
              type: "button",
              name: "按钮",
              x: 20,
              y: 25,
              width: 60,
              height: 30,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
              autoLayout: null,
              parentId: "inner-group",
              props: {},
              children: [],
            },
          ],
        },
      ],
    },
  ];

  const extracted = getTopLevelSelectedElements(["deep-child"], tree);
  assert.equal(extracted.length, 1);
  assert.equal(extracted[0].id, "deep-child");
  assert.equal(extracted[0].parentId, null);
  assert.equal(extracted[0].x, 300 + 50 + 20); // 370
  assert.equal(extracted[0].y, 400 + 60 + 25); // 485
});

test("cloneElementsForPaste returns all new top-level IDs for multi-selection", () => {
  const el1 = {
    id: "el-1",
    type: "rectangle",
    name: "矩形 1",
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {},
    parentId: null,
  };
  const el2 = {
    id: "el-2",
    type: "rectangle",
    name: "矩形 2",
    x: 200,
    y: 100,
    width: 50,
    height: 50,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {},
    parentId: null,
  };

  const { clonedElements, newSelectedIds } = cloneElementsForPaste([el1, el2], undefined, 0);
  assert.equal(clonedElements.length, 2);
  assert.equal(newSelectedIds.length, 2);
  assert.equal(newSelectedIds[0], clonedElements[0].id);
  assert.equal(newSelectedIds[1], clonedElements[1].id);
  assert.notEqual(clonedElements[0].id, "el-1");
  assert.notEqual(clonedElements[1].id, "el-2");
});

test("cloneElementsForPaste centers in visible viewport if original is offscreen", () => {
  const el = {
    id: "el-1",
    type: "rectangle",
    name: "矩形",
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {},
    parentId: null,
  };

  // Viewport is far away at (2000, 2000) to (3000, 3000)
  const viewportBounds = { minX: 2000, minY: 2000, maxX: 3000, maxY: 3000 };
  const { clonedElements } = cloneElementsForPaste([el], undefined, 0, viewportBounds);

  // Center of viewport is (2500, 2500). el is 100x100 -> placed around (2450, 2450)
  assert.equal(clonedElements[0].x, 2450);
  assert.equal(clonedElements[0].y, 2450);
});

test("Internal clipboard cache stores and retrieves deep clone", () => {
  const el = {
    id: "cached-1",
    type: "circle",
    name: "圆形",
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {},
    parentId: null,
  };

  setInternalClipboard([el]);
  const retrieved = getInternalClipboard();
  assert.ok(retrieved);
  assert.equal(retrieved.length, 1);
  assert.equal(retrieved[0].id, "cached-1");

  // Modifying retrieved does not mutate internal cache
  retrieved[0].name = "Modified";
  const fresh = getInternalClipboard();
  assert.equal(fresh[0].name, "圆形");
});
