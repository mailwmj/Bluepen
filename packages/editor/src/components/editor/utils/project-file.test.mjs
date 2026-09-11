import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadTypeScript } from "../../../../tests/load-typescript.mjs";

const { parseProjectFile, nextPageName } = loadTypeScript(fileURLToPath(new URL("./project-file.ts", import.meta.url)));
const node = { id: "title", type: "text", x: 10, y: 20, width: 200, height: 40, props: { text: "中文标题" } };
const project = (elements = [node]) => ({ name: "登录原型", pages: [{ id: "page-1", name: "首页", elements }] });

test("older files keep Chinese content and receive safe optional defaults", () => {
  const result = parseProjectFile(JSON.stringify(project()));
  assert.equal(result.name, "登录原型");
  const title = result.pages[0].elements[0];
  assert.equal(title.props.text, "中文标题");
  assert.equal(title.visible, true);
  assert.equal(title.children.length, 0);
  assert.equal(title.opacity, 1);
});

test("invalid pages and nested nodes are rejected before replacing a document", () => {
  for (const data of [{ pages: [null] }, { pages: [{ id: "one", elements: "bad" }] }, project([{ ...node, children: [null] }]), project([{ ...node, width: "200" }]), project([{ ...node, props: [] }])]) {
    assert.throws(() => parseProjectFile(JSON.stringify(data)), /项目/);
  }
});

test("duplicate identities cannot merge unrelated pages or layers", () => {
  assert.throws(() => parseProjectFile(JSON.stringify(project([node, node]))), /重复/);
  const data = project(); data.pages.push(data.pages[0]);
  assert.throws(() => parseProjectFile(JSON.stringify(data)), /重复/);
});

test("nested nodes retain their real parent and layout", () => {
  const result = parseProjectFile(JSON.stringify(project([{ ...node, id: "group", type: "group", children: [node] }])));
  assert.equal(result.pages[0].elements[0].children[0].parentId, "group");
});

test("adding pages after deleting an earlier page does not repeat a name", () => {
  assert.equal(nextPageName([{ name: "Page 1" }, { name: "Page 3" }]), "Page 2");
  assert.equal(nextPageName([{ name: "登录" }, { name: "Page 1" }]), "Page 2");
});
