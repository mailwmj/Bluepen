import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadTypeScript } from "../../../../tests/load-typescript.mjs";

const filename = fileURLToPath(new URL("./local-store.ts", import.meta.url));
const project = (name = "Untitled", savedAt = 1) => ({ version: 3, name, pages: [{ id: "p1", name: "Page 1", elements: [] }], savedAt });
function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}
function fakeIndexedDB({ failOpen = false, abortWrite = false, initial = {} } = {}) {
  const values = new Map(Object.entries(initial));
  const state = { closed: 0, values, abortWrite };
  const indexedDB = {
    open() {
      if (failOpen) throw new Error("IndexedDB unavailable");
      const request = {};
      request.result = {
        close() { state.closed++; },
        transaction(_name, mode) {
          const tx = {};
          let key, value;
          const result = {};
          tx.objectStore = () => ({
            get(k) { key = k; result.result = values.get(k); return result; },
            put(v, k) { value = v; key = k; return result; },
          });
          queueMicrotask(() => {
            result.onsuccess?.();
            if (mode === "readwrite" && state.abortWrite) {
              tx.error = new Error("transaction aborted after request success");
              tx.onabort?.();
            } else {
              if (mode === "readwrite") values.set(key, value);
              tx.oncomplete?.();
            }
          });
          return tx;
        },
      };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    },
  };
  return { indexedDB, state };
}
const quietConsole = { error() {}, warn() {} };
function webStore(idb, localStorage) {
  return loadTypeScript(filename, { mocks: { "./use-desktop": { isDesktop: () => false } },
    globals: { window: {}, indexedDB: idb, localStorage, console: quietConsole } });
}

test("failed IndexedDB migration retains the existing localStorage project", async () => {
  const storage = memoryStorage({ "bluepen:project": JSON.stringify(project("legacy")) });
  const { indexedDB } = fakeIndexedDB({ abortWrite: true });
  const store = webStore(indexedDB, storage);
  assert.equal((await store.loadProjectLocal()).name, "legacy");
  assert.ok(storage.getItem("bluepen:project"));
});

test("a newer fallback save wins over a stale IndexedDB project", async () => {
  const storage = memoryStorage({ "bluepen:project": JSON.stringify(project("latest", 20)) });
  const { indexedDB, state } = fakeIndexedDB({ initial: { "bluepen:project": project("old", 10) } });
  const store = webStore(indexedDB, storage);
  assert.equal((await store.loadProjectLocal()).name, "latest");
  assert.equal(state.values.get("bluepen:project").name, "latest");
  assert.equal(storage.getItem("bluepen:project"), null);
  assert.equal(state.closed, 2);
});

test("request success followed by transaction rollback never reports saved", async () => {
  const { indexedDB, state } = fakeIndexedDB({ abortWrite: true });
  const storage = memoryStorage();
  storage.setItem = () => { throw new Error("localStorage quota exceeded"); };
  const store = webStore(indexedDB, storage);
  await assert.rejects(store.saveProjectLocal(project()), /quota exceeded/);
  assert.equal(state.values.size, 0);
  assert.equal(state.closed, 1);
  state.abortWrite = false;
  await store.saveProjectLocal(project("retry"));
  assert.equal(state.values.get("bluepen:project").name, "retry");
});

test("localStorage fallback is recoverable when IndexedDB is unavailable", async () => {
  const storage = memoryStorage();
  const { indexedDB } = fakeIndexedDB({ failOpen: true });
  const store = webStore(indexedDB, storage);
  await store.saveProjectLocal(project("fallback"));
  assert.equal((await store.loadProjectLocal()).name, "fallback");
});

function desktopStore({ files = new Map(), write = async (path, value) => files.set(path, value) } = {}) {
  const settings = new Map();
  const tauriStore = { get: async (key) => settings.get(key), set: async (key, value) => settings.set(key, value), save: async () => {} };
  const store = loadTypeScript(filename, { mocks: {
    "./use-desktop": { isDesktop: () => true },
    "@tauri-apps/api/path": { documentDir: async () => "/documents", join: async (...parts) => parts.join("/") },
    "@tauri-apps/plugin-fs": { mkdir: async () => {}, exists: async (path) => files.has(path), writeTextFile: write, BaseDirectory: { Document: "document" } },
    "@tauri-apps/plugin-store": { load: async () => tauriStore },
  }, globals: { console: quietConsole } });
  return { ...store, files, settings };
}

test("new projects with the same name never overwrite an existing project", async () => {
  const existingPath = "/documents/Bluepen/Untitled.bluepen";
  const files = new Map([[existingPath, "existing project"]]);
  const store = desktopStore({ files });
  const first = await store.saveProjectLocal(project());
  const second = await store.saveProjectLocal(project());
  assert.notEqual(first, second);
  assert.notEqual(first, existingPath);
  assert.equal(files.get(existingPath), "existing project");
  assert.equal(files.size, 3);
});

test("slow saves stay ordered and settings updates preserve the last project path", async () => {
  const writes = [];
  let release;
  let entered;
  const started = new Promise((resolve) => { entered = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  const store = desktopStore({ write: async (_path, value) => {
    writes.push(JSON.parse(value).name);
    if (writes.length === 1) { entered(); await gate; }
  } });
  const file = "/documents/project.bluepen";
  const first = store.saveProjectLocal(project("older"), file);
  const second = store.saveProjectLocal(project("newer"), file);
  const settings = store.saveSettingsLocal({ zoom: 0.5, showGrid: false, theme: "light" });
  await started;
  assert.deepEqual(writes, ["older"]);
  release();
  await Promise.all([first, second, settings]);
  assert.deepEqual(writes, ["older", "newer"]);
  assert.equal(store.settings.get("settings").lastFile, file);
  assert.equal(store.settings.get("settings").theme, "light");
});
