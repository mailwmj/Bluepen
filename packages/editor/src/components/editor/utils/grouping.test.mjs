import assert from "node:assert/strict";
import test from "node:test";

// Simulate grouping algorithm
function genId() {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function groupElements(selectedIds, elements, groupName) {
  if (!selectedIds || selectedIds.length < 1) {
    return { nextElements: elements, groupId: null };
  }

  const selectedSet = new Set(selectedIds);
  let createdGroupId = null;

  const processLevel = (list) => {
    const selectedAtLevel = list.filter((el) => selectedSet.has(el.id));

    if (selectedAtLevel.length >= 1 && selectedAtLevel.length === selectedIds.length) {
      const minX = Math.min(...selectedAtLevel.map((el) => el.x));
      const minY = Math.min(...selectedAtLevel.map((el) => el.y));
      const maxX = Math.max(...selectedAtLevel.map((el) => el.x + el.width));
      const maxY = Math.max(...selectedAtLevel.map((el) => el.y + el.height));

      const groupId = genId();
      createdGroupId = groupId;
      const commonParentId = selectedAtLevel[0]?.parentId ?? null;

      const groupElement = {
        id: groupId,
        type: "group",
        name: groupName || "组合",
        x: minX,
        y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId: commonParentId,
        props: {},
        children: selectedAtLevel.map((child) => ({
          ...child,
          x: child.x - minX,
          y: child.y - minY,
          parentId: groupId,
        })),
      };

      let inserted = false;
      const result = [];

      for (const item of list) {
        if (selectedSet.has(item.id)) {
          if (!inserted) {
            result.push(groupElement);
            inserted = true;
          }
        } else {
          result.push({
            ...item,
            children: item.children ? processLevel(item.children) : [],
          });
        }
      }

      return result;
    }

    return list.map((item) => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: processLevel(item.children),
        };
      }
      return item;
    });
  };

  const nextElements = processLevel(elements);
  return { nextElements, groupId: createdGroupId };
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

test("Group action creates a bounding container and converts relative coordinates", () => {
  const el1 = { id: "a", type: "rectangle", name: "矩形 1", x: 100, y: 100, width: 100, height: 50, rotation: 0, opacity: 1, visible: true, locked: false, autoLayout: null, props: {}, children: [], parentId: null };
  const el2 = { id: "b", type: "text", name: "文本 1", x: 150, y: 200, width: 80, height: 40, rotation: 0, opacity: 1, visible: true, locked: false, autoLayout: null, props: {}, children: [], parentId: null };
  const elements = [el1, el2];

  const { nextElements, groupId } = groupElements(["a", "b"], elements, "测试组合");

  assert.ok(groupId, "groupId should be generated");
  assert.equal(nextElements.length, 1);
  const group = nextElements[0];
  assert.equal(group.type, "group");
  assert.equal(group.name, "测试组合");
  assert.equal(group.x, 100);
  assert.equal(group.y, 100);
  assert.equal(group.width, 130); // max(100+100, 150+80) - 100 = 230 - 100 = 130
  assert.equal(group.height, 140); // max(100+50, 200+40) - 100 = 240 - 100 = 140
  assert.equal(group.children.length, 2);

  // Check child relative coordinates
  const child1 = group.children[0];
  assert.equal(child1.id, "a");
  assert.equal(child1.x, 0); // 100 - 100
  assert.equal(child1.y, 0); // 100 - 100
  assert.equal(child1.parentId, groupId);

  const child2 = group.children[1];
  assert.equal(child2.id, "b");
  assert.equal(child2.x, 50); // 150 - 100
  assert.equal(child2.y, 100); // 200 - 100
  assert.equal(child2.parentId, groupId);
});

test("Ungroup action restores absolute coordinates seamlessly and releases children", () => {
  const groupId = "grp-1";
  const group = {
    id: groupId,
    type: "group",
    name: "组合 1",
    x: 200,
    y: 300,
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
      { id: "c1", type: "rectangle", name: "矩形", x: 20, y: 30, width: 80, height: 40, rotation: 0, opacity: 1, visible: true, locked: false, autoLayout: null, props: {}, children: [], parentId: groupId },
      { id: "c2", type: "text", name: "文本", x: 120, y: 80, width: 60, height: 20, rotation: 0, opacity: 1, visible: true, locked: false, autoLayout: null, props: {}, children: [], parentId: groupId },
    ],
  };

  const { nextElements, releasedIds } = ungroupElements([groupId], [group]);

  assert.equal(nextElements.length, 2);
  assert.deepEqual(releasedIds, ["c1", "c2"]);

  const r1 = nextElements.find((e) => e.id === "c1");
  assert.ok(r1);
  assert.equal(r1.x, 220); // 200 + 20
  assert.equal(r1.y, 330); // 300 + 30
  assert.equal(r1.parentId, null);

  const r2 = nextElements.find((e) => e.id === "c2");
  assert.ok(r2);
  assert.equal(r2.x, 320); // 200 + 120
  assert.equal(r2.y, 380); // 300 + 80
  assert.equal(r2.parentId, null);
});
