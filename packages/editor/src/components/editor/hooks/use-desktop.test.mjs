import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadTypeScript } from "../../../../tests/load-typescript.mjs";

async function mountDesktop({ getProject, saveDialog = async () => "/documents/project.bluepen", beforeClose = async () => true }) {
  const effects = [];
  const writes = [];
  let closeHandler;
  let closeCount = 0;
  let ready;
  const fileApiReady = new Promise((resolve) => { ready = resolve; });
  const windowApi = {
    onCloseRequested: async (handler) => { closeHandler = handler; return () => {}; },
    destroy: async () => { closeCount++; },
    isMaximized: async () => false,
    isFullscreen: async () => false,
  };
  const react = {
    useRef: (value) => ({ current: value }),
    useCallback: (callback) => callback,
    useEffect: (effect) => effects.push(effect),
    useState: (value) => [value, (next) => { if (next?.openFile) ready(next); }],
  };
  const { useDesktop } = loadTypeScript(fileURLToPath(new URL("./use-desktop.ts", import.meta.url)), {
    globals: { window: { __TAURI_INTERNALS__: {} }, navigator: { platform: "MacIntel", userAgent: "Mac" } },
    mocks: {
      react,
      "./use-toast": { showToast() {} },
      "./local-store": { getProjectsDir: async () => "/documents", projectFileName: (name) => `${name}.bluepen`, saveProjectLocal: async (project, path) => writes.push({ project, path }) },
      "@tauri-apps/api/window": { getCurrentWindow: () => windowApi },
      "@tauri-apps/api/event": { listen: async () => () => {} },
      "@tauri-apps/plugin-dialog": { open: async () => null, save: saveDialog },
      "@tauri-apps/plugin-fs": { readTextFile: async () => "" },
    },
  });
  useDesktop(getProject, () => {}, beforeClose);
  effects.forEach((effect) => effect());
  const fileApi = await fileApiReady;
  return { fileApi, writes, requestClose: () => closeHandler({ preventDefault() {} }), closeCount: () => closeCount };
}

test("Save As includes changes made while the file chooser is open", async () => {
  let current = { name: "project", pages: [{ id: "before" }] };
  let choosePath;
  const dialog = new Promise((resolve) => { choosePath = resolve; });
  const desktop = await mountDesktop({ getProject: () => current, saveDialog: () => dialog });
  const saving = desktop.fileApi.saveFileAs();
  current = { name: "project", pages: [{ id: "latest" }] };
  choosePath("/documents/project.bluepen");
  const result = await saving;
  assert.equal(result.project, current);
  assert.equal(desktop.writes[0].project.pages, current.pages);
  assert.equal(desktop.writes[0].project.version, 3);
});

test("cancelling the unsaved-changes close request keeps the desktop window open", async () => {
  let allowClose = false;
  const desktop = await mountDesktop({ getProject: () => ({ name: "project", pages: [] }), beforeClose: async () => allowClose });
  await desktop.requestClose();
  assert.equal(desktop.closeCount(), 0);
  allowClose = true;
  await desktop.requestClose();
  assert.equal(desktop.closeCount(), 1);
});

test("isDesktop and isMac correctly report platform from window and navigator", () => {
  const { isDesktop, isMac } = loadTypeScript(fileURLToPath(new URL("./use-desktop.ts", import.meta.url)), {
    globals: { window: { __TAURI_INTERNALS__: {} }, navigator: { platform: "MacIntel", userAgent: "Mac" } },
    mocks: {
      react: { useRef: () => ({ current: null }), useCallback: (fn) => fn, useEffect: () => {}, useState: (v) => [v, () => {}] },
      "./use-toast": { showToast() {} },
      "./local-store": { getProjectsDir: async () => "", projectFileName: () => "", saveProjectLocal: async () => {} },
      "@tauri-apps/api/window": { getCurrentWindow: () => ({}) },
      "@tauri-apps/api/event": { listen: async () => () => {} },
      "@tauri-apps/plugin-dialog": { open: async () => null, save: async () => null },
      "@tauri-apps/plugin-fs": { readTextFile: async () => "" },
    },
  });
  assert.equal(isDesktop(), true);
  assert.equal(isMac(), true);
});
