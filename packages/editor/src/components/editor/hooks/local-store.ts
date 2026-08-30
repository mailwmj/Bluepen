"use client";

import type { Page } from "../types";
import { isDesktop } from "./use-desktop";

export interface StoredProject {
  version: number;
  name: string;
  pages: Page[];
  savedAt: number;
}

export interface StoredSettings {
  zoom: number;
  showGrid: boolean;
  lastFile?: string;
}

const STORE_FILE = "outlin.json";
const PROJECT_VERSION = 3;
const LS_PROJECT_KEY = "outlin:project";
const LS_SETTINGS_KEY = "outlin:settings";
const PROJECTS_DIR = "Outlin";

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
    })();
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
  return `${sanitizeName(name)}.outlin`;
}

async function ensureProjectsDir(): Promise<void> {
  const { mkdir, BaseDirectory } = await import("@tauri-apps/plugin-fs");
  await mkdir(PROJECTS_DIR, { baseDir: BaseDirectory.Document, recursive: true }).catch(() => {});
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
          return { ...parsed, version: PROJECT_VERSION };
        }
      }
      const store = await getTauriStore();
      const raw = await store.get("project");
      if (raw && typeof raw === "object" && (raw as StoredProject).version === PROJECT_VERSION) {
        return raw as StoredProject;
      }
    } else {
      const raw = localStorage.getItem(LS_PROJECT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredProject;
        if (parsed.version === PROJECT_VERSION) return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load project:", e);
  }
  return null;
}

export async function saveProjectLocal(project: StoredProject): Promise<void> {
  try {
    if (isDesktop()) {
      await ensureProjectsDir();
      const { writeTextFile, remove, BaseDirectory } = await import("@tauri-apps/plugin-fs");
      const fileName = projectFileName(project.name);
      const fullPath = `${await getProjectsDir()}/${fileName}`;
      await writeTextFile(`${PROJECTS_DIR}/${fileName}`, JSON.stringify(project, null, 2), {
        baseDir: BaseDirectory.Document,
      });
      const settings = await getStoredSettings();
      if (settings?.lastFile && settings.lastFile !== fullPath) {
        await remove(settings.lastFile).catch(() => {});
      }
      const store = await getTauriStore();
      await store.set("settings", {
        ...(settings ?? { zoom: 1, showGrid: true }),
        lastFile: fullPath,
      });
      await store.save();
    } else {
      localStorage.setItem(LS_PROJECT_KEY, JSON.stringify(project));
    }
  } catch (e) {
    console.error("Failed to save project:", e);
  }
}

export async function loadSettingsLocal(): Promise<StoredSettings | null> {
  try {
    if (isDesktop()) {
      return await getStoredSettings();
    } else {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (raw) return JSON.parse(raw) as StoredSettings;
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return null;
}

export async function saveSettingsLocal(settings: StoredSettings): Promise<void> {
  try {
    if (isDesktop()) {
      const store = await getTauriStore();
      const existing = await getStoredSettings();
      await store.set("settings", { ...(existing ?? {}), ...settings });
      await store.save();
    } else {
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}
