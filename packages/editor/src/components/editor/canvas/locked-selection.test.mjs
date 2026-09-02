import assert from "node:assert/strict";
import test from "node:test";

// Simulate isElementLocked helper
function isElementLocked(el, allElementsFlat) {
  if (el.locked) return true;
  if (!allElementsFlat || !el.parentId) return false;
  let curr = el;
  const visited = new Set();
  while (curr.parentId) {
    if (visited.has(curr.parentId)) break;
    visited.add(curr.parentId);
    const parent = allElementsFlat.find((p) => p.id === curr.parentId);
    if (!parent) break;
    if (parent.locked) return true;
    curr = parent;
  }
  return false;
}

function rectsIntersect(r1, r2) {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

const CONTAINER_TYPES = new Set([
  "card",
  "group",
  "modal-dialog",
  "mobile-frame",
  "browser-frame",
  "agent-profile-layout",
  "agent-employee-workspace-layout",
  "agent-employee-market-layout",
  "agent-employee-card",
  "agent-template-card",
  "sidebar",
  "header",
  "footer",
]);

function isContainerElement(el) {
  return (
    CONTAINER_TYPES.has(el.type) ||
    (Boolean(el.children) && el.children.length > 0)
  );
}

function isRectEnclosedIn(inner, outer, tolerance = 4) {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

function getElementDynamicBounds(el) {
  return {
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
  };
}

function getMarqueeHitElementIds(marqueeBox, allElementsFlat) {
  // 1. First find all candidate visible, non-locked elements that intersect the marquee
  const candidates = allElementsFlat.filter((el) => {
    if (!el.visible || isElementLocked(el, allElementsFlat)) return false;
    const bounds = getElementDynamicBounds(el);
    return rectsIntersect(marqueeBox, bounds);
  });

  if (candidates.length === 0) return [];

  // 2. Identify enclosing background containers (containers that completely enclose the marqueeBox)
  const marqueeArea = marqueeBox.width * marqueeBox.height;
  const enclosingContainerIds = new Set();

  for (const el of candidates) {
    if (isContainerElement(el)) {
      const bounds = getElementDynamicBounds(el);
      const containerArea = bounds.width * bounds.height;
      if (
        isRectEnclosedIn(marqueeBox, bounds) &&
        marqueeArea < containerArea * 0.95
      ) {
        enclosingContainerIds.add(el.id);
      }
    }
  }

  // 3. Filter out enclosing containers
  const filtered = candidates.filter((el) => !enclosingContainerIds.has(el.id));
  return filtered.map((el) => el.id);
}

test("isElementLocked correctly identifies direct and ancestor locks", () => {
  const elements = [
    { id: "parent-locked", locked: true, parentId: null },
    { id: "child-unlocked", locked: false, parentId: "parent-locked" },
    { id: "grandchild", locked: false, parentId: "child-unlocked" },
    { id: "standalone-unlocked", locked: false, parentId: null },
  ];

  assert.equal(isElementLocked(elements[0], elements), true, "Parent locked should be locked");
  assert.equal(isElementLocked(elements[1], elements), true, "Child of locked parent should be locked");
  assert.equal(isElementLocked(elements[2], elements), true, "Grandchild of locked parent should be locked");
  assert.equal(isElementLocked(elements[3], elements), false, "Standalone unlocked element should be unlocked");
});

test("Marquee drag over locked background selects only unlocked children/widgets", () => {
  const lockedBackground = {
    id: "locked-bg-card",
    type: "card",
    name: "Locked Background Frame",
    x: 100,
    y: 100,
    width: 800,
    height: 600,
    visible: true,
    locked: true,
    parentId: null,
  };

  const unlockedTitle = {
    id: "title-text",
    type: "text",
    name: "共享知识库",
    x: 140,
    y: 140,
    width: 200,
    height: 30,
    visible: true,
    locked: false,
    parentId: null,
  };

  const unlockedTable = {
    id: "table-widget",
    type: "table",
    name: "文件列表",
    x: 140,
    y: 220,
    width: 600,
    height: 300,
    visible: true,
    locked: false,
    parentId: null,
  };

  const allElements = [lockedBackground, unlockedTitle, unlockedTable];

  // Marquee box inside the locked container, intersecting both title and table
  const marqueeBox = {
    x: 120,
    y: 120,
    width: 650,
    height: 450,
  };

  const hitIds = getMarqueeHitElementIds(marqueeBox, allElements);

  assert.equal(hitIds.length, 2, "Should hit the 2 unlocked elements");
  assert.ok(hitIds.includes("title-text"), "Should include title-text");
  assert.ok(hitIds.includes("table-widget"), "Should include table-widget");
  assert.ok(!hitIds.includes("locked-bg-card"), "Must NEVER include locked-bg-card");
});

test("PointerUp logic distinguishes click vs drag on locked element", () => {
  function resolvePointerUp(curInter, allElementsFlat) {
    const { startX, startY, currentX, currentY, shiftHeld, initialSelected, lockedClickTargetId } = curInter;
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    if (w >= 3 || h >= 3) {
      const marqueeBox = {
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width: w,
        height: h,
      };
      const hitIds = getMarqueeHitElementIds(marqueeBox, allElementsFlat);
      if (shiftHeld) {
        return { selectedIds: Array.from(new Set([...initialSelected, ...hitIds])), isDrag: true };
      }
      return { selectedIds: hitIds, isDrag: true };
    }

    // Click without drag
    if (lockedClickTargetId) {
      if (shiftHeld) {
        const next = initialSelected.includes(lockedClickTargetId)
          ? initialSelected.filter((id) => id !== lockedClickTargetId)
          : [...initialSelected, lockedClickTargetId];
        return { selectedIds: next, isDrag: false };
      }
      return { selectedIds: [lockedClickTargetId], isDrag: false };
    }

    return { selectedIds: [], isDrag: false };
  }

  const allElements = [
    { id: "locked-card", type: "card", x: 50, y: 50, width: 500, height: 400, visible: true, locked: true },
    { id: "btn-1", type: "button", x: 100, y: 100, width: 80, height: 32, visible: true, locked: false },
  ];

  // Case 1: Single Click on locked element (movement = 1px < 3px threshold)
  const clickInter = {
    type: "marquee",
    startX: 150,
    startY: 150,
    currentX: 151,
    currentY: 150,
    shiftHeld: false,
    initialSelected: [],
    lockedClickTargetId: "locked-card",
  };
  const clickRes = resolvePointerUp(clickInter, allElements);
  assert.equal(clickRes.isDrag, false, "Click should not be treated as drag");
  assert.deepEqual(clickRes.selectedIds, ["locked-card"], "Click should select the locked card");

  // Case 2: Drag on locked element to marquee select the button (movement = 100px >= 3px)
  const dragInter = {
    type: "marquee",
    startX: 80,
    startY: 80,
    currentX: 200,
    currentY: 160,
    shiftHeld: false,
    initialSelected: [],
    lockedClickTargetId: "locked-card",
  };
  const dragRes = resolvePointerUp(dragInter, allElements);
  assert.equal(dragRes.isDrag, true, "Drag should be treated as drag");
  assert.deepEqual(dragRes.selectedIds, ["btn-1"], "Drag should marquee-select only the unlocked button");
});
