import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadTypeScript } from "../../../../tests/load-typescript.mjs";
const load = (file) => loadTypeScript(fileURLToPath(new URL(file, import.meta.url)));
const { getLayoutElements, getLayoutSelection, resolveGroupSelection } = load("./layout-elements.ts");
const { calculateAlign, calculateDistribute, calculateSpacing } = load("./alignment.ts");
const { calculateSnapping, calculateResizeSnapping } = load("../canvas/snap-engine.ts");
const { patchElements } = load("./element-updates.ts");
const { createHistory, appendHistory, moveHistory } = load("./history.ts");
const { createBlockTemplateGroup, BLOCK_TEMPLATE_TYPES } = load("../library/block-templates.ts");
const el = (id, x, y, width = 100, height = 40, extra = {}) => ({ id, type: "rectangle", name: id, x, y, width, height, rotation: 0, opacity: 1, visible: true, locked: false, parentId: null, children: [], props: {}, autoLayout: null, ...extra });
const plain = (value) => JSON.parse(JSON.stringify(value));

test("nested and flat input resolve once, and hidden/locked ancestors propagate", () => {
  const child = el("child", 20, 30, 100, 40, { parentId: "group" });
  const group = el("group", 500, 200, 300, 300, { children: [child], visible: false, locked: true });
  const world = getLayoutElements([group, child]);
  assert.equal(world.length, 2);
  assert.deepEqual(plain(world[1]), { ...child, x: 520, y: 230, visible: false, locked: true });
  assert.equal(getLayoutElements([group, child], ["group"]).length, 0);
});

test("cross-container alignment follows visible positions and stores local coordinates", () => {
  const a = el("a", 20, 30, 100, 40, { parentId: "g1" });
  const b = el("b", 10, 40, 80, 40, { parentId: "g2" });
  const roots = [el("g1", 500, 200, 300, 300, { children: [a] }), el("g2", 800, 100, 300, 300, { children: [b] })];
  const patches = calculateAlign([a, b], "left", null, undefined, roots);
  assert.deepEqual(plain(patches), [{ id: "b", patch: { x: -280 } }]);
  assert.equal(getLayoutElements(patchElements(roots, patches)).find((e) => e.id === "b").x, 520);
  assert.equal(a.x, 20);
});

test("a lone object on an infinite canvas never aligns to an imaginary artboard", () => {
  assert.equal(calculateAlign([el("a", 500, 300)], "horizontal-center").length, 0);
  const child = el("a", 50, 20, 100, 40, { parentId: "g" });
  const group = el("g", 600, 400, 300, 200, { children: [child] });
  assert.equal(calculateAlign([child], "horizontal-center", group)[0].patch.x, 100);
  assert.equal(calculateAlign([child], "left", { ...group, locked: true }, undefined, [{ ...group, locked: true }]).length, 0);
});

test("selecting parent and child cannot apply movement twice", () => {
  const a = el("a", 10, 20, 100, 40, { parentId: "g" });
  const g = el("g", 500, 200, 300, 300, { children: [a] });
  const b = el("b", 1000, 400);
  assert.deepEqual(plain(getLayoutSelection([a, g, b], [g, b]).map((e) => e.id)), ["g", "b"]);
  assert.deepEqual(plain(calculateAlign([a, g, b], "left", null, undefined, [g, b])), [{ id: "b", patch: { x: 500 } }]);
});

test("distribution equalizes edge gaps for different sizes and preserves both endpoints", () => {
  const nodes = [el("a", 0, 0, 80), el("b", 95, 0, 30), el("c", 140, 0, 50), el("d", 301, 0, 90)];
  const next = patchElements(nodes, calculateDistribute(nodes, "horizontal"));
  assert.equal(next[0].x, 0);
  assert.equal(next[3].x, 301);
  const gaps = next.slice(1).map((e, i) => e.x - next[i].x - next[i].width);
  assert.ok(Math.max(...gaps) - Math.min(...gaps) < 0.002);
});

test("explicit spacing supports two objects, nested coordinates, and one undo step", () => {
  const child = el("child", 10, 20, 60, 40, { parentId: "g" });
  const other = el("other", 800, 20, 90);
  const roots = [el("g", 500, 0, 200, 200, { children: [child] }), other];
  const next = patchElements(roots, calculateSpacing([child, other], "horizontal", 16, roots));
  assert.equal(next[1].x, 586);
  assert.equal(next[0].children[0].x, 10);
  const history = appendHistory(createHistory(roots), next);
  assert.equal(moveHistory(history, -1).snapshots[0], roots);
  assert.equal(moveHistory(moveHistory(history, -1), 1).snapshots[1], next);
});

test("locked items never silently disappear from spacing constraints", () => {
  const nodes = [el("a", 0, 0), el("b", 120, 0, 100, 40, { locked: true }), el("c", 300, 0)];
  assert.equal(calculateDistribute(nodes, "horizontal").length, 0);
  assert.equal(calculateSpacing(nodes, "horizontal", 16).length, 0);
  assert.equal(calculateSpacing(nodes.map((e) => ({ ...e, locked: false })), "vertical", NaN).length, 0);
});

test("nested move and resize snap to canvas-space sibling edges", () => {
  const child = el("child", 20, 20, 100, 40, { parentId: "g" });
  const sibling = el("sibling", 150, 90, 100, 40, { parentId: "g" });
  const g = el("g", 500, 200, 300, 300, { children: [child, sibling] });
  const targets = getLayoutElements([g], [child.id]);
  assert.equal(calculateSnapping(child.id, 647, 225, 100, 40, targets).x, 650);
  const resized = calculateResizeSnapping(child.id, "e", { x: 520, y: 220, width: 127, height: 40 }, targets);
  assert.equal(resized.width, 130);
  assert.equal(resized.x, 520);
});

test("dragging a template cannot snap back to its own descendants", () => {
  const child = el("child", 0, 0, 100, 40, { parentId: "g" });
  const g = el("g", 0, 0, 100, 40, { children: [child] });
  const targets = getLayoutElements([g, child], ["g"]);
  const result = calculateSnapping("g", 3, 4, 100, 40, targets);
  assert.equal(result.x, 3);
  assert.equal(result.y, 4);
  assert.equal(result.guides.length, 0);
});

test("snap tolerance stays six screen pixels at multiple zoom levels and Alt bypasses it", () => {
  for (const zoom of [0.1, 0.25, 0.5, 1, 2, 4]) {
    const targets = [el("target", 1000, 1000, 1000, 40)];
    const inside = 1000 - 5 / zoom;
    assert.equal(calculateSnapping("a", inside, 500, 1000, 40, targets, zoom).x, 1000);
    const outside = 1000 - 7 / zoom;
    assert.equal(calculateSnapping("a", outside, 500, 1000, 40, targets, zoom).x, outside);
    assert.equal(calculateSnapping("a", inside, 500, 1000, 40, targets, zoom, null, true).x, inside);
  }
});

test("dragging repeats horizontal and vertical edge gaps, including unequal sizes", () => {
  const row = [el("a", 0, 0, 80), el("b", 100, 0, 60)];
  const result = calculateSnapping("c", 183, 0, 100, 40, row);
  assert.equal(result.x, 180);
  const guides = result.guides.filter((g) => g.id.startsWith("equal-gap"));
  assert.equal(guides.length, 2);
  assert.ok(guides.every((g) => g.label === 20));
  const column = [el("a", 0, 0, 100, 80), el("b", 0, 100, 100, 60)];
  assert.equal(calculateSnapping("c", 0, 183, 100, 100, column).y, 180);
});

test("dragging between neighbours offers balanced spacing without resizing", () => {
  const result = calculateSnapping("c", 153, 0, 80, 40, [el("a", 0, 0, 80), el("b", 300, 0, 80)]);
  assert.equal(result.x, 150);
  assert.ok(result.guides.some((g) => g.id.startsWith("equal-gap") && g.label === 70));
});

test("group selection stays inside the template after selecting a child", () => {
  const a = el("a", 10, 10, 100, 40, { parentId: "g" });
  const b = el("b", 10, 80, 100, 40, { parentId: "g" });
  const g = el("g", 500, 200, 300, 300, { type: "group", children: [a, b] });
  const all = [g, a, b];
  assert.equal(resolveGroupSelection("a", [], all), "g");
  assert.equal(resolveGroupSelection("a", ["a"], all), "a");
  assert.equal(resolveGroupSelection("b", ["a"], all), "b");
  assert.equal(resolveGroupSelection("b", ["g"], all), "g");
  assert.equal(resolveGroupSelection("b", ["a", "b"], all), "b");
});

test("every real block template has individually editable children with stable parent links", () => {
  for (const type of BLOCK_TEMPLATE_TYPES) {
    const template = createBlockTemplateGroup(type, 500, 300);
    assert.ok(template, type);
    assert.ok(template.children.length > 0, type);
    const all = getLayoutElements([template]);
    assert.equal(new Set(all.map((e) => e.id)).size, all.length);
    for (const child of template.children) assert.equal(child.parentId, template.id, type);
    const child = template.children[0];
    const updated = patchElements([template], [{ id: child.id, patch: { name: "Edited child" } }]);
    assert.equal(updated[0].children[0].name, "Edited child");
    assert.equal(updated[0].id, template.id);
    assert.equal(updated[0].children.length, template.children.length);
  }
});
