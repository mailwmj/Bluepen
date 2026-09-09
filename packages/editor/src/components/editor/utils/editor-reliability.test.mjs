import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadTypeScript } from "../../../../tests/load-typescript.mjs";

const load = (file) => loadTypeScript(fileURLToPath(new URL(file, import.meta.url)));
const { createHistory, appendHistory, moveHistory } = load("./history.ts");
const { patchElements } = load("./element-updates.ts");
const { fitBounds } = load("./viewport.ts");
const { matchesShortcut } = load("../hooks/use-keyboard.ts");
const { libraryModes, searchLibrary, groupLibrary } = load("../library/catalog.ts");

test("100 consecutive edits remain undoable and redoable at the history limit", () => {
  let history = createHistory(0);
  for (let value = 1; value <= 100; value++) history = appendHistory(history, value);
  assert.equal(history.snapshots.length, 50);
  assert.equal(history.index, 49);
  for (let value = 99; value >= 51; value--) {
    history = moveHistory(history, -1);
    assert.equal(history.snapshots[history.index], value);
  }
  assert.equal(moveHistory(history, -1), history);
  for (let value = 52; value <= 100; value++) {
    history = moveHistory(history, 1);
    assert.equal(history.snapshots[history.index], value);
  }
  assert.equal(moveHistory(history, 1), history);
});

test("editing after undo discards only the abandoned redo branch", () => {
  let history = appendHistory(appendHistory(createHistory("initial"), "one"), "two");
  history = appendHistory(moveHistory(history, -1), "replacement");
  assert.equal(history.snapshots.join(","), "initial,one,replacement");
  assert.equal(moveHistory(history, 1), history);
  assert.equal(appendHistory(history, "replacement"), history);
});

test("moving a nested element preserves other branches and older history snapshots", () => {
  const child = Object.freeze({ id: "child", x: 0, children: Object.freeze([]) });
  const unaffected = Object.freeze({ id: "other", x: 100, children: Object.freeze([]) });
  const original = Object.freeze([{ id: "group", children: Object.freeze([child]) }, unaffected]);
  const next = patchElements(original, [{ id: "child", patch: { x: 20 } }]);
  assert.equal(next[0].children[0].x, 20);
  assert.equal(original[0].children[0].x, 0);
  assert.equal(next[1], unaffected);
  assert.equal(patchElements(next, [{ id: "missing", patch: { x: 1 } }]), next);
  assert.equal(patchElements(next, [{ id: "child", patch: { x: 20 } }]), next);
});

test("a large offscreen template fits inside the visible viewport", () => {
  const bounds = { x: 5000, y: -2400, width: 1440, height: 900 };
  const viewport = { width: 720, height: 600 };
  const { zoom, pan } = fitBounds(bounds, viewport);
  assert.ok(zoom < 1);
  const left = pan.x + bounds.x * zoom;
  const top = pan.y + bounds.y * zoom;
  assert.ok(left >= 47.99 && top >= 47.99);
  assert.ok(left + bounds.width * zoom <= viewport.width - 47.99);
  assert.ok(top + bounds.height * zoom <= viewport.height - 47.99);
});

const key = (overrides) => ({ key: "ArrowUp", code: "ArrowUp", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...overrides });
test("resize and large nudge shortcuts cannot be stolen by plain arrow keys", () => {
  assert.equal(matchesShortcut("ArrowUp", key({ altKey: true })), false);
  assert.equal(matchesShortcut("Alt+ArrowUp", key({ altKey: true })), true);
  assert.equal(matchesShortcut("ArrowUp", key({ shiftKey: true })), false);
  assert.equal(matchesShortcut("Shift+ArrowUp", key({ shiftKey: true })), true);
  assert.equal(matchesShortcut("R", key({ key: "r", code: "KeyR", metaKey: true })), false);
});

test("macOS redo and shifted digit shortcuts match their displayed actions", () => {
  assert.equal(matchesShortcut("Ctrl+Shift+Z", key({ key: "y", code: "KeyY", metaKey: true })), true);
  assert.equal(matchesShortcut("Shift+1", key({ key: "!", code: "Digit1", shiftKey: true })), true);
});

test("all three libraries tolerate whitespace and support multi-term search", () => {
  for (const mode of Object.values(libraryModes)) assert.equal(searchLibrary(mode.items, "   "), mode.items);
  assert.ok(searchLibrary(libraryModes.web.items, " WEB   TABLE ").length > 0);
  assert.ok(searchLibrary(libraryModes.agent.items, "场景模板").length > 0);
  assert.equal(searchLibrary(libraryModes.components.items, "不存在的组件zz").length, 0);
});

test("template categories come first and new categories never disappear", () => {
  for (const mode of [libraryModes.web, libraryModes.agent]) {
    assert.match(groupLibrary(mode.items, mode.categories)[0].category, /模版/);
  }
  const mode = libraryModes.web;
  const future = { ...mode.items[0], category: "新增分类" };
  const groups = groupLibrary([...mode.items, future], mode.categories);
  assert.ok(groups.some((group) => group.category === "新增分类"));
});
