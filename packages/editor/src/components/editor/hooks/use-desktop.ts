"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Page } from "../types";
import { showToast } from "./use-toast";
import { getProjectsDir, projectFileName } from "./local-store";

export function isDesktop() {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window;
}

export type Platform = "macos" | "windows" | "linux" | "web";

export function getPlatform(): Platform {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  if (/Mac|iPhone|iPod|iPad/i.test(ua) || /Mac/i.test(platform)) return "macos";
  if (/Win/i.test(ua) || /Win/i.test(platform)) return "windows";
  if (/Linux/i.test(ua) || /Linux/i.test(platform)) return "linux";
  return "web";
}

export function isMac(): boolean {
  return getPlatform() === "macos";
}

export function isWindows(): boolean {
  return getPlatform() === "windows";
}

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("web");
  useEffect(() => {
    setPlatform(getPlatform());
  }, []);
  return platform;
}

export function useIsMac(): boolean {
  const [isMacPlatform, setIsMacPlatform] = useState(false);
  useEffect(() => {
    setIsMacPlatform(isMac());
  }, []);
  return isMacPlatform;
}

export function confirmLocal(message: string): Promise<boolean> {
  if (isDesktop()) {
    return import("@tauri-apps/plugin-dialog").then(({ ask }) =>
      ask(message, { title: "Bluepen", kind: "warning" }),
    );
  }
  return Promise.resolve(window.confirm(message));
}

export interface DesktopFileApi {
  openFile: () => Promise<void>;
  saveFile: (currentFilePath?: string | null) => Promise<{ ok: boolean; path?: string }>;
  saveFileAs: () => Promise<{ ok: boolean; path?: string }>;
}

export function useDesktop(
  getProject: () => { pages: Page[]; name: string },
  onLoadProject: (data: { pages: Page[]; name: string; filePath?: string }) => void,
) {
  const [isTauri, setIsTauri] = useState(false);
  const [platform, setPlatform] = useState<Platform>("web");
  const [windowMaximized, setWindowMaximized] = useState(false);
  const [windowFullscreen, setWindowFullscreen] = useState(false);
  const getProjectRef = useRef(getProject);
  getProjectRef.current = getProject;
  const onLoadProjectRef = useRef(onLoadProject);
  onLoadProjectRef.current = onLoadProject;

  const [fileApi, setFileApi] = useState<DesktopFileApi | null>(null);

  useEffect(() => {
    setPlatform(getPlatform());
    if (!isDesktop()) return;
    setIsTauri(true);

    let cancelled = false;
    let unlistenFns: Array<() => void> = [];

    (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const { listen } = await import("@tauri-apps/api/event");
      const { open, save } = await import("@tauri-apps/plugin-dialog");
      const { readTextFile, writeTextFile } = await import("@tauri-apps/plugin-fs");

      const appWindow = getCurrentWindow();

      const saveFileAs = async (): Promise<{ ok: boolean; path?: string }> => {
        try {
          const data = getProjectRef.current();
          const projectsDir = await getProjectsDir();
          const path = await save({
            defaultPath: `${projectsDir}/${projectFileName(data.name || "Untitled")}`,
            filters: [{ name: "Bluepen Project", extensions: ["bluepen", "json"] }],
          });
          if (typeof path !== "string") return { ok: false };
          await writeTextFile(path, JSON.stringify(data, null, 2));
          return { ok: true, path };
        } catch (e) {
          console.error("Failed to save file as:", e);
          showToast({ type: "error", title: "Could not save file", id: "save-file-error" });
          return { ok: false };
        }
      };

      const saveFile = async (currentFilePath?: string | null): Promise<{ ok: boolean; path?: string }> => {
        if (!currentFilePath) {
          return saveFileAs();
        }
        try {
          const data = getProjectRef.current();
          await writeTextFile(currentFilePath, JSON.stringify(data, null, 2));
          return { ok: true, path: currentFilePath };
        } catch (e) {
          console.error("Failed to save file:", e);
          showToast({ type: "error", title: "Could not save file", id: "save-file-error" });
          return { ok: false };
        }
      };

      const openFile = async () => {
        try {
          const projectsDir = await getProjectsDir();
          const path = await open({
            defaultPath: projectsDir,
            multiple: false,
            filters: [{ name: "Bluepen Project", extensions: ["bluepen", "json"] }],
          });
          if (typeof path !== "string") return;
          const content = await readTextFile(path);
          const data = JSON.parse(content);
          const baseName = path.split(/[\\/]/).pop()?.replace(/\.(bluepen|json)$/, "") || "Untitled";
          onLoadProjectRef.current({
            pages: data.pages ?? [],
            name: data.name ?? baseName,
            filePath: path,
          });
          showToast({ type: "success", title: "Project opened", description: baseName, id: "open-file" });
        } catch (e) {
          console.error("Failed to open file:", e);
          showToast({ type: "error", title: "Could not open file", id: "open-file-error" });
        }
      };

      setFileApi({ openFile, saveFile, saveFileAs });

      if (!cancelled) {
        setWindowMaximized(await appWindow.isMaximized());
        setWindowFullscreen(await appWindow.isFullscreen());
      }

      const unlistenResize = await listen("tauri://resize", () => {
        void appWindow.isMaximized().then((m) => { if (!cancelled) setWindowMaximized(m); });
        void appWindow.isFullscreen().then((f) => { if (!cancelled) setWindowFullscreen(f); });
      });
      unlistenFns.push(unlistenResize);
    })();

    return () => {
      cancelled = true;
      unlistenFns.forEach((fn) => fn());
    };
  }, []);

  const windowControls = useCallback((action: "minimize" | "maximize" | "close") => {
    void (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      if (action === "minimize") await appWindow.minimize();
      else if (action === "maximize") {
        if (await appWindow.isMaximized()) await appWindow.unmaximize();
        else await appWindow.maximize();
        setWindowMaximized(await appWindow.isMaximized());
      } else await appWindow.close();
    })();
  }, []);

  const toggleFullscreen = useCallback(() => {
    void (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.setFullscreen(!(await appWindow.isFullscreen()));
    })();
  }, []);

  const isMacOS = platform === "macos";
  const isWin = platform === "windows";

  return {
    isTauri,
    platform,
    isMac: isMacOS,
    isWindows: isWin,
    fileApi,
    windowMaximized,
    windowFullscreen,
    windowControls,
    toggleFullscreen,
  };
}
