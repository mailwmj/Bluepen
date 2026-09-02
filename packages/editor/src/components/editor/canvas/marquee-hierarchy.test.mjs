import assert from "node:assert/strict";
import test from "node:test";

// Helpers under test
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
  "card", "group", "modal-dialog", "mobile-frame", "browser-frame", "sidebar", "header", "footer"
]);

function isContainerElement(el) {
  return (
    CONTAINER_TYPES.has(el.type) ||
    (Boolean(el.children) && el.children.length > 0)
  );
}

function isRectEnclosedIn(inner, outer, tolerance = 6) {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

function getElementDynamicBounds(el, allElementsFlat) {
  let curX = el.x;
  let curY = el.y;
  let parentId = el.parentId;

  if (allElementsFlat && parentId) {
    const visited = new Set([el.id]);
    while (parentId) {
      if (visited.has(parentId)) break;
      visited.add(parentId);
      const parent = allElementsFlat.find((p) => p.id === parentId);
      if (!parent) break;
      curX += parent.x;
      curY += parent.y;
      parentId = parent.parentId;
    }
  }

  return {
    x: curX,
    y: curY,
    width: el.width,
    height: el.height,
  };
}

function filterOutDescendantIds(ids, allElementsFlat) {
  if (!ids || ids.length <= 1) return ids;
  const idSet = new Set(ids);
  const elementMap = new Map(allElementsFlat.map((el) => [el.id, el]));

  return ids.filter((id) => {
    let curr = elementMap.get(id);
    if (!curr) return true;
    const visited = new Set([id]);
    while (curr && curr.parentId) {
      if (visited.has(curr.parentId)) break;
      visited.add(curr.parentId);
      if (idSet.has(curr.parentId)) {
        return false;
      }
      curr = elementMap.get(curr.parentId);
    }
    return true;
  });
}

function filterOutDescendantElements(elementsList, allElementsFlat) {
  if (!elementsList || elementsList.length <= 1) return elementsList;
  const idSet = new Set(elementsList.map((el) => el.id));
  const elementMap = new Map(allElementsFlat.map((el) => [el.id, el]));

  return elementsList.filter((el) => {
    let curr = el;
    const visited = new Set([el.id]);
    while (curr && curr.parentId) {
      if (visited.has(curr.parentId)) break;
      visited.add(curr.parentId);
      if (idSet.has(curr.parentId)) {
        return false;
      }
      curr = elementMap.get(curr.parentId);
    }
    return true;
  });
}

function getMarqueeHitElementIds(marqueeBox, allElementsFlat, options) {
  const candidates = allElementsFlat.filter((el) => {
    if (!el.visible || isElementLocked(el, allElementsFlat)) return false;
    const bounds = getElementDynamicBounds(el, allElementsFlat);
    return rectsIntersect(marqueeBox, bounds);
  });

  if (candidates.length === 0) return [];

  const marqueeArea = marqueeBox.width * marqueeBox.height;
  const enclosingContainerIds = new Set();

  if (options?.containerClickTargetId) {
    enclosingContainerIds.add(options.containerClickTargetId);
  }

  for (const el of candidates) {
    if (isContainerElement(el)) {
      const bounds = getElementDynamicBounds(el, allElementsFlat);
      const containerArea = bounds.width * bounds.height;
      if (
        isRectEnclosedIn(marqueeBox, bounds, 8) &&
        marqueeArea < containerArea * 0.95
      ) {
        enclosingContainerIds.add(el.id);
      }
    }
  }

  const activeCandidates = candidates.filter((el) => !enclosingContainerIds.has(el.id));
  if (activeCandidates.length === 0) return [];

  if (options?.isDeepSelect) {
    const leafOnly = activeCandidates.filter((el) => {
      if (isContainerElement(el)) {
        return !activeCandidates.some((other) => {
          let curr = other;
          const visited = new Set([other.id]);
          while (curr && curr.parentId) {
            if (visited.has(curr.parentId)) break;
            visited.add(curr.parentId);
            if (curr.parentId === el.id) return true;
            curr = allElementsFlat.find((p) => p.id === curr.parentId);
          }
          return false;
        });
      }
      return true;
    });
    return leafOnly.map((el) => el.id);
  }

  const candidateIds = activeCandidates.map((el) => el.id);
  return filterOutDescendantIds(candidateIds, allElementsFlat);
}

test("filterOutDescendantIds removes child IDs when parent ID is present", () => {
  const allElements = [
    { id: "group-1", parentId: null },
    { id: "child-1", parentId: "group-1" },
    { id: "child-2", parentId: "group-1" },
    { id: "grandchild-1", parentId: "child-1" },
    { id: "other-root", parentId: null },
  ];

  const inputIds = ["group-1", "child-1", "child-2", "grandchild-1", "other-root"];
  const filtered = filterOutDescendantIds(inputIds, allElements);

  assert.deepEqual(filtered, ["group-1", "other-root"], "Should keep only top-level selected items");
});

test("filterOutDescendantElements removes child element objects when parent is present", () => {
  const group1 = { id: "group-1", parentId: null };
  const child1 = { id: "child-1", parentId: "group-1" };
  const otherRoot = { id: "other-root", parentId: null };

  const allElements = [group1, child1, otherRoot];
  const selected = [group1, child1, otherRoot];

  const filtered = filterOutDescendantElements(selected, allElements);
  assert.deepEqual(filtered, [group1, otherRoot], "Should keep only top-level selected element objects");
});

test("getMarqueeHitElementIds selects only the Group when crossing into group boundaries", () => {
  const group = {
    id: "group-1",
    type: "group",
    x: 200,
    y: 600,
    width: 900,
    height: 500,
    visible: true,
    locked: false,
    parentId: null,
  };
  const child1 = {
    id: "sidebar-1",
    type: "sidebar",
    x: 0,
    y: 0,
    width: 200,
    height: 500,
    visible: true,
    locked: false,
    parentId: "group-1",
  };
  const child2 = {
    id: "table-1",
    type: "table",
    x: 220,
    y: 50,
    width: 600,
    height: 400,
    visible: true,
    locked: false,
    parentId: "group-1",
  };

  const allElements = [group, child1, child2];

  // Marquee starts outside the group at x=100 and crosses into the group
  const marqueeBox = {
    x: 100,
    y: 580,
    width: 400,
    height: 300,
  };

  const hitIds = getMarqueeHitElementIds(marqueeBox, allElements);
  assert.deepEqual(hitIds, ["group-1"], "Should return ONLY the group, not the group and all its children");
});

test("getMarqueeHitElementIds selects only inner elements when marquee is inside an enclosing container", () => {
  const card = {
    id: "card-container",
    type: "card",
    x: 100,
    y: 100,
    width: 800,
    height: 600,
    visible: true,
    locked: false,
    parentId: null,
  };
  const btn1 = {
    id: "btn-1",
    type: "button",
    x: 20,
    y: 20,
    width: 100,
    height: 36,
    visible: true,
    locked: false,
    parentId: "card-container",
  };
  const btn2 = {
    id: "btn-2",
    type: "button",
    x: 140,
    y: 20,
    width: 100,
    height: 36,
    visible: true,
    locked: false,
    parentId: "card-container",
  };

  const allElements = [card, btn1, btn2];

  // Marquee box inside the card (around btn1 and btn2)
  const marqueeBox = {
    x: 110,
    y: 110,
    width: 250,
    height: 60,
  };

  const hitIds = getMarqueeHitElementIds(marqueeBox, allElements, {
    containerClickTargetId: "card-container",
  });

  assert.deepEqual(hitIds, ["btn-1", "btn-2"], "Should return the 2 inner buttons and exclude the enclosing card");
});
