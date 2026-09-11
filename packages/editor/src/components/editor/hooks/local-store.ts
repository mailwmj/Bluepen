"use client";

import type { Page } from "../types";
import { isDesktop } from "./use-desktop";

export interface StoredProject {
  id?: string;
  version: number;
  name: string;
  pages: Page[];
  savedAt: number;
  filePath?: string;
}

export interface StoredSettings {
  zoom: number;
  showGrid: boolean;
  theme?: "dark" | "light" | "system";
  lastFile?: string;
  leftDrawerCollapsed?: boolean;
  libraryTab?: "pages" | "components" | "web" | "agent";
  activePageId?: string;
}

const STORE_FILE = "bluepen.json";
const PROJECT_VERSION = 3;
const LS_PROJECT_KEY = "bluepen:project";
const LS_SETTINGS_KEY = "bluepen:settings";
const PROJECTS_DIR = "Bluepen";

const IDB_NAME = "bluepen_db";
const IDB_VERSION = 1;
const IDB_STORE = "bluepen_store";

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB is not available"));
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIndexedDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      tx.oncomplete = () => { db.close(); resolve((req.result as T) ?? null); };
      tx.onabort = () => { db.close(); reject(tx.error ?? new Error("读取本地数据失败")); };
      tx.onerror = () => { db.close(); reject(tx.error ?? req.error); };
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req = store.put(value, key);
    // A successful request can still be rolled back by its transaction.
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error("本地保存事务被取消")); };
    tx.onerror = () => { db.close(); reject(tx.error ?? req.error); };
  });
}

let storePromise: Promise<{
  get: (k: string) => Promise<unknown>;
  set: (k: string, v: unknown) => Promise<void>;
  save: () => Promise<void>;
}> | null = null;

function getTauriStore() {
  if (!storePromise) {
    storePromise = (async () => {
      const { load } = await import("@tauri-apps/plugin-store");
      const store = await load(STORE_FILE, { autoSave: false });
      return {
        get: (k: string) => store.get(k),
        set: (k: string, v: unknown) => store.set(k, v),
        save: () => store.save(),
      };
    })().catch((error) => {
      storePromise = null;
      throw error;
    });
  }
  return storePromise;
}

function sanitizeName(name: string): string {
  const clean = name.replace(/[\\/:*?"<>|]/g, "-").trim();
  return clean || "Untitled";
}

export async function getProjectsDir(): Promise<string> {
  const { documentDir, join } = await import("@tauri-apps/api/path");
  return join(await documentDir(), PROJECTS_DIR);
}

export function projectFileName(name: string): string {
  return `${sanitizeName(name)}.bluepen`;
}

async function ensureProjectsDir(): Promise<void> {
  const { mkdir, BaseDirectory } = await import("@tauri-apps/plugin-fs");
  await mkdir(PROJECTS_DIR, { baseDir: BaseDirectory.Document, recursive: true });
}

async function getStoredSettings(): Promise<StoredSettings | null> {
  try {
    const store = await getTauriStore();
    const raw = await store.get("settings");
    if (raw && typeof raw === "object") return raw as StoredSettings;
  } catch (e) {
    console.error("Failed to read settings:", e);
  }
  return null;
}

export async function loadProjectLocal(): Promise<StoredProject | null> {
  try {
    if (isDesktop()) {
      const { readTextFile, exists } = await import("@tauri-apps/plugin-fs");
      const settings = await getStoredSettings();
      const lastFile = settings?.lastFile;
      if (lastFile && (await exists(lastFile))) {
        const content = await readTextFile(lastFile);
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.pages)) {
          return { ...parsed, version: PROJECT_VERSION, filePath: lastFile };
        }
      }
      const store = await getTauriStore();
      const raw = await store.get("project");
      if (raw && typeof raw === "object" && (raw as StoredProject).version === PROJECT_VERSION) {
        return raw as StoredProject;
      }
    } else {
      // 1. Try IndexedDB (handles large projects with images seamlessly)
      const idbProject = await idbGet<StoredProject>(LS_PROJECT_KEY);
      // A fallback write may be newer than the last successful IndexedDB write.
      try {
        const raw = localStorage.getItem(LS_PROJECT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoredProject;
          if (parsed.version === PROJECT_VERSION && (!idbProject || parsed.savedAt > idbProject.savedAt)) {
            try {
              await idbSet(LS_PROJECT_KEY, parsed);
              localStorage.removeItem(LS_PROJECT_KEY);
            } catch {
              // Retain the only recoverable copy if migration cannot commit.
            }
            return parsed;
          }
        }
      } catch {
        // Ignore localStorage errors
      }
      if (idbProject && idbProject.version === PROJECT_VERSION) return idbProject;
    }
  } catch (e) {
    console.error("Failed to load project:", e);
  }
  return null;
}

// Serialize file writes and settings merges; a slow older save must never win.
let writeQueue: Promise<unknown> = Promise.resolve();
function enqueueWrite<T>(write: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(write, write);
  writeQueue = result.catch(() => {});
  return result;
}

export function saveProjectLocal(project: StoredProject, explicitFilePath?: string | null): Promise<string | null> {
  return enqueueWrite(async () => {
    if (isDesktop()) {
      const { writeTextFile, exists } = await import("@tauri-apps/plugin-fs");
      let savedFullPath: string;

      if (explicitFilePath) {
        // Save directly to the explicitly bound file path
        await writeTextFile(explicitFilePath, JSON.stringify(project, null, 2));
        savedFullPath = explicitFilePath;
      } else {
        // Bind each new project to its own file, even when names are identical.
        await ensureProjectsDir();
        const directory = await getProjectsDir();
        savedFullPath = `${directory}/${projectFileName(project.name)}`;
        let suffix = 2;
        while (await exists(savedFullPath)) {
          savedFullPath = `${directory}/${projectFileName(`${project.name} (${suffix++})`)}`;
        }
        await writeTextFile(savedFullPath, JSON.stringify(project, null, 2));
      }

      const settings = await getStoredSettings();
      const store = await getTauriStore();
      await store.set("settings", {
        ...(settings ?? { zoom: 1, showGrid: true }),
        lastFile: savedFullPath,
      });
      await store.save();
      return savedFullPath;
    } else {
      try {
        await idbSet(LS_PROJECT_KEY, project);
        try { localStorage.removeItem(LS_PROJECT_KEY); } catch { /* Optional legacy cleanup. */ }
      } catch (err) {
        console.warn("IndexedDB save failed, fallback to localStorage:", err);
        // Propagate quota/permission failures so the editor keeps its unsaved state.
        localStorage.setItem(LS_PROJECT_KEY, JSON.stringify(project));
      }
      return null;
    }
  });
}

export async function loadSettingsLocal(): Promise<StoredSettings | null> {
  try {
    if (isDesktop()) {
      return await getStoredSettings();
    } else {
      const fromIdb = await idbGet<StoredSettings>(LS_SETTINGS_KEY);
      if (fromIdb) return fromIdb;
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (raw) return JSON.parse(raw) as StoredSettings;
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return null;
}

export async function saveSettingsLocal(settings: StoredSettings): Promise<void> {
  return enqueueWrite(async () => {
    try {
      if (isDesktop()) {
        const store = await getTauriStore();
        const existing = await getStoredSettings();
        await store.set("settings", { ...(existing ?? {}), ...settings });
        await store.save();
      } else {
        await idbSet(LS_SETTINGS_KEY, settings).catch(() => {});
        try {
          localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
        } catch {
          // Settings must not interrupt editing when browser storage is unavailable.
        }
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  });
}
