"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Page } from "../types";
import { showToast } from "./use-toast";
import { getProjectsDir, projectFileName } from "./local-store";

export function isDesktop() {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window;
}

export function confirmLocal(message: string): Promise<boolean> {
  if (isDesktop()) {
    return import("@tauri-apps/plugin-dialog").then(({ ask }) =>
      ask(message, { title: "Outlin", kind: "warning" }),
    );
  }
  return Promise.resolve(window.confirm(message));
}

export interface DesktopFileApi {
  openFile: () => void;
  saveFile: () => Promise<boolean>;
  saveFileAs: () => Promise<boolean>;
}

export function useDesktop(
  getProject: () => { pages: Page[]; name: string },
  onLoadProject: (data: { pages: Page[]; name: string }) => void,
) {
  const [isTauri, setIsTauri] = useState(false);
  const [windowMaximized, setWindowMaximized] = useState(false);
  const [windowFullscreen, setWindowFullscreen] = useState(false);
  const getProjectRef = useRef(getProject);
  getProjectRef.current = getProject;
  const onLoadProjectRef = useRef(onLoadProject);
  onLoadProjectRef.current = onLoadProject;

  const [fileApi, setFileApi] = useState<DesktopFileApi | null>(null);

  useEffect(() => {
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

      const openFile = async () => {
        try {
          const projectsDir = await getProjectsDir();
          const path = await open({
            defaultPath: projectsDir,
            multiple: false,
            filters: [{ name: "Outlin Project", extensions: ["outlin", "json"] }],
          });
          if (typeof path !== "string") return;
          const content = await readTextFile(path);
          const data = JSON.parse(content);
          const baseName = path.split("/").pop()?.replace(/\.(outlin|json)$/, "") || "Untitled";
          onLoadProjectRef.current({ pages: data.pages ?? [], name: data.name ?? baseName });
          showToast({ type: "success", title: "Project opened", description: baseName, id: "open-file" });
        } catch (e) {
          console.error("Failed to open file:", e);
          showToast({ type: "error", title: "Could not open file", id: "open-file-error" });
        }
      };

      const saveFile = async (): Promise<boolean> => {
        try {
          const data = getProjectRef.current();
          const projectsDir = await getProjectsDir();
          const path = await save({
            defaultPath: `${projectsDir}/${projectFileName(data.name || "Untitled")}`,
            filters: [{ name: "Outlin Project", extensions: ["outlin", "json"] }],
          });
          if (typeof path !== "string") return false;
          await writeTextFile(path, JSON.stringify(data, null, 2));
          return true;
        } catch (e) {
          console.error("Failed to save file:", e);
          return false;
        }
      };

      const saveFileAs = saveFile;

      setFileApi({ openFile: () => void openFile(), saveFile, saveFileAs });

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

  return { isTauri, fileApi, windowMaximized, windowFullscreen, windowControls, toggleFullscreen };
}
