"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { EditorElement, ComponentType, Page } from "./types";
import { Canvas } from "./canvas/index";
import { TopBar } from "./top-bar";
import { TitleBar } from "./title-bar";
import { LeftSidebar } from "./left-sidebar";
import { RightPanel } from "./right-panel";
import { useDesktop } from "./hooks/use-desktop";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPopup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@outlin/editor/components/ui/context-menu";
import {
  Copy, Trash2, Lock, EyeOff, Square, Maximize2, ClipboardPaste,
  MousePointer2, Hand, FrameIcon, Type,
} from "lucide-react";
import {
  Toolbar as CossToolbar,
  ToolbarGroup,
  ToolbarButton,
  ToolbarSeparator,
} from "@outlin/editor/components/ui/toolbar";
import { useKeyboard } from "./hooks/use-keyboard";
import { library } from "./library/index";
import { confirmLocal } from "./hooks/use-desktop";
import { showToast } from "./hooks/use-toast";
import { loadProjectLocal, saveProjectLocal, loadSettingsLocal, saveSettingsLocal } from "./hooks/local-store";
import { cn } from "@outlin/editor/lib/utils";

let nextId = 1;
function genId() {
  return `el-${nextId++}`;
}

function makeElement(type: ComponentType, name: string, x: number, y: number, width: number, height: number, locked = false): EditorElement {
  return {
    id: genId(), type, name,
    x, y, width, height,
    rotation: 0, opacity: 1, visible: true, locked,
    autoLayout: null, children: [], props: {}, parentId: null,
  };
}

const templatePages: Page[] = [
  {
    id: "landing",
    name: "Landing Page",
    elements: [
      makeElement("navbar", "Navbar", 0, 0, 1440, 64, true),
      makeElement("hero", "Hero Section", 0, 64, 1440, 480),
      makeElement("features", "Features Section", 0, 544, 1440, 300),
      makeElement("faq", "FAQ Section", 0, 844, 1440, 300),
      makeElement("testimonials", "Testimonial Section", 0, 1144, 1440, 300),
      makeElement("footer", "Footer", 0, 1444, 1440, 200),
    ],
  },
  { id: "dashboard", name: "Dashboard", elements: [] },
];

const defaultPages: Page[] = [
  { id: "page-1", name: "Page 1", elements: [] },
];

export function Editor() {
  const [pages, setPages] = useState<Page[]>(defaultPages);
  const [activePageId, setActivePageId] = useState("page-1");
  const [history, setHistory] = useState<EditorElement[][]>([defaultPages[0].elements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<string>("select");
  const [contextTarget, setContextTarget] = useState<"element" | "canvas">("canvas");
  const [contextElementId, setContextElementId] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0] || null;
  const elements = activePage?.elements ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = elements.find((el) => el.id === selectedId) ?? null;
  const [projectName, setProjectName] = useState("Untitled");
  const [dirty, setDirty] = useState(false);

  // Hydrate from local persistence on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [project, settings] = await Promise.all([
        loadProjectLocal(),
        loadSettingsLocal(),
      ]);
      if (cancelled) return;
      if (project && project.pages.length > 0) {
        setPages(project.pages);
        setProjectName(project.name || "Untitled");
        const first = project.pages[0];
        if (first) {
          setActivePageId(first.id);
          setHistory([JSON.parse(JSON.stringify(first.elements))]);
          setHistoryIndex(0);
        }
      }
      if (settings) {
        setZoom(settings.zoom ?? 1);
        setShowGrid(settings.showGrid ?? true);
      }
      setDirty(false);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-save project (debounced) when changes happen
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      void saveProjectLocal({
        version: 3,
        name: projectName,
        pages,
        savedAt: Date.now(),
      }).then(() => setDirty(false));
    }, 600);
    return () => clearTimeout(t);
  }, [pages, projectName, hydrated]);

  // Auto-save settings (debounced)
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      void saveSettingsLocal({ zoom, showGrid });
    }, 600);
    return () => clearTimeout(t);
  }, [zoom, showGrid, hydrated]);

  const pushHistory = useCallback(
    (next: EditorElement[]) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        trimmed.push(JSON.parse(JSON.stringify(next)));
        return trimmed;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const setElements = useCallback(
    (next: EditorElement[]) => {
      setPages((prev) =>
        prev.map((p) => (p.id === activePageId ? { ...p, elements: next } : p)),
      );
      setDirty(true);
    },
    [activePageId],
  );

  const commit = useCallback(
    (next: EditorElement[]) => {
      setElements(next);
      pushHistory(next);
    },
    [setElements, pushHistory],
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<EditorElement>) => {
      const el = elements.find((e) => e.id === id);
      if (!el) return;
      const dx = typeof patch.x === "number" ? patch.x - el.x : 0;
      const dy = typeof patch.y === "number" ? patch.y - el.y : 0;
      const affected = new Set<string>([id]);
      const collect = (node: EditorElement) =>
        node.children.forEach((c) => {
          affected.add(c.id);
          collect(c);
        });
      collect(el);
      const next = elements.map((e) => {
        if (e.id === id) return { ...e, ...patch };
        if (affected.has(e.id)) return { ...e, x: e.x + dx, y: e.y + dy };
        return e;
      });
      setElements(next);
    },
    [elements, setElements],
  );

  const deleteElement = useCallback(
    (id: string) => {
      const el = elements.find((e) => e.id === id);
      if (!el) return;
      const doomed = new Set<string>([id]);
      const collect = (node: EditorElement) =>
        node.children.forEach((c) => {
          doomed.add(c.id);
          collect(c);
        });
      collect(el);
      const next = elements
        .filter((e) => !doomed.has(e.id))
        .map((e) =>
          e.children.length > 0
            ? { ...e, children: e.children.filter((c) => !doomed.has(c.id)) }
            : e,
        );
      commit(next);
      if (selectedId && doomed.has(selectedId)) setSelectedId(null);
    },
    [elements, commit, selectedId],
  );

  const addElement = useCallback(
    (type: ComponentType, x: number, y: number, parentId: string | null = null) => {
      const lib = library.find((c) => c.type === type);
      const el: EditorElement = {
        id: genId(),
        type,
        name: lib?.label || type,
        x, y,
        width: lib?.defaultWidth || 200,
        height: lib?.defaultHeight || 100,
        rotation: 0, opacity: 1, visible: true, locked: false,
        autoLayout: null,
        children: [],
        props: { ...(lib?.defaultProps ?? {}) },
        parentId,
      };
      const next = parentId
        ? elements.map((e) =>
            e.id === parentId ? { ...e, children: [...e.children, el] } : e,
          )
        : elements;
      commit([...next, el]);
      setSelectedId(el.id);
    },
    [elements, commit],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    deleteElement(selectedId);
  }, [selectedId, deleteElement]);

  const duplicate = useCallback(() => {
    if (!selectedId) return;
    const el = elements.find((e) => e.id === selectedId);
    if (!el) return;
    const idMap = new Map<string, string>();
    const cloneNode = (node: EditorElement): EditorElement => {
      const newId = genId();
      idMap.set(node.id, newId);
      return {
        ...JSON.parse(JSON.stringify(node)),
        id: newId,
        name: `${node.name} copy`,
        x: node.x + 20, y: node.y + 20,
        parentId: node.parentId ? (idMap.get(node.parentId) ?? node.parentId) : null,
        children: node.children.map(cloneNode),
      };
    };
    const copy = cloneNode(el);
    const next = copy.parentId
      ? elements.map((e) =>
          e.id === copy.parentId ? { ...e, children: [...e.children, copy] } : e,
        )
      : elements;
    commit([...next, copy]);
    setSelectedId(copy.id);
  }, [selectedId, elements, commit]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(JSON.parse(JSON.stringify(history[newIndex])));
    }
  }, [historyIndex, history, setElements]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(JSON.parse(JSON.stringify(history[newIndex])));
    }
  }, [historyIndex, history, setElements]);

  const handleCanvasClick = useCallback(
    (_e: React.MouseEvent, canvasX: number, canvasY: number) => {
      if (activeTool === "frame" || activeTool === "rectangle" || activeTool === "text") {
        const snap = (v: number) => Math.round(v / 20) * 20;
        let parentId: string | null = null;
        let px = snap(canvasX);
        let py = snap(canvasY);
        const frame = [...elements]
          .reverse()
          .find(
            (el) =>
              el.type === "frame" &&
              canvasX >= el.x && canvasX <= el.x + el.width &&
              canvasY >= el.y && canvasY <= el.y + el.height,
          );
        if (frame) {
          parentId = frame.id;
          px = snap(canvasX - frame.x);
          py = snap(canvasY - frame.y);
        }
        addElement(activeTool as ComponentType, px, py, parentId);
        setActiveTool("select");
      }
    },
    [activeTool, addElement, elements],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (previewing) return;
      const target = e.target as HTMLElement;
      const elTarget = target.closest("[data-element]");
      const elId = elTarget?.getAttribute("data-element-id");
      if (elId) {
        setSelectedId(elId);
        setContextTarget("element");
        setContextElementId(elId);
      } else {
        setSelectedId(null);
        setContextTarget("canvas");
      }
    },
    [],
  );

  useKeyboard({
    "Ctrl+Z": undo,
    "Ctrl+Shift+Z": redo,
    "Delete": deleteSelected,
    "Backspace": deleteSelected,
    "Ctrl+D": duplicate,
    "Escape": () => {
      if (previewing) {
        setPreviewing(false);
        showToast({ title: "Editing mode", id: "exit-preview" });
      } else {
        setSelectedId(null);
      }
    },
    "Ctrl+G": () => {},
    "Ctrl+Shift+G": () => {},
    "Ctrl+A": () => {},
  });

  const handleSidebarAdd = useCallback(
    (type: ComponentType) => {
      let parentId: string | null = null;
      let px = 120;
      let py = 120;
      const parent = elements.find((el) => el.id === selectedId && el.type === "frame");
      if (parent) {
        parentId = parent.id;
        px = 24 + (parent.children.length % 5) * 24;
        py = 24 + (parent.children.length % 5) * 24;
      } else {
        const offset = (elements.length % 6) * 24;
        px = 120 + offset;
        py = 120 + offset;
      }
      addElement(type, px, py, parentId);
    },
    [addElement, elements, selectedId],
  );

  const handlePageSelect = useCallback(
    (id: string) => {
      setActivePageId(id);
      const page = pages.find((p) => p.id === id);
      if (page) {
        setHistory([JSON.parse(JSON.stringify(page.elements))]);
        setHistoryIndex(0);
        setSelectedId(null);
      }
    },
    [pages],
  );

  const handlePageAdd = useCallback(() => {
    const newPage: Page = { id: genId(), name: `Page ${pages.length + 1}`, elements: [] };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedId(null);
    setDirty(true);
  }, [pages.length]);

  const handlePageDelete = useCallback(
    (id: string) => {
      const next = pages.filter((p) => p.id !== id);
      setPages(next);
      if (activePageId === id) {
        const first = next[0];
        setActivePageId(first ? first.id : "");
        setHistory(first ? [JSON.parse(JSON.stringify(first.elements))] : [[]]);
        setHistoryIndex(0);
        setSelectedId(null);
      }
      setDirty(true);
    },
    [pages, activePageId],
  );

  const getProject = useCallback(
    () => ({ pages, name: projectName }),
    [pages, projectName],
  );

  const loadProject = useCallback(
    (data: { pages: Page[]; name: string }) => {
      const loadedPages = data.pages ?? [];
      setPages(loadedPages);
      setProjectName(data.name || "Untitled");
      if (loadedPages[0]) {
        setActivePageId(loadedPages[0].id);
        setHistory([JSON.parse(JSON.stringify(loadedPages[0].elements))]);
      } else {
        setActivePageId("");
        setHistory([[]]);
      }
      setHistoryIndex(0);
      setSelectedId(null);
      setDirty(false);
    },
    [],
  );

  const handleLoadTemplate = useCallback(() => {
    void confirmLocal("Replace the current project with the example template?").then(
      (ok) => {
        if (ok) {
          loadProject({ pages: templatePages, name: projectName });
          showToast({
            type: "success",
            title: "Template inserted",
            description: "Landing Page & Dashboard",
            id: "template",
          });
        }
      },
    );
  }, [loadProject, projectName]);

  const saveProjectRef = useRef<() => Promise<void>>(async () => {});

  const { isTauri, fileApi, toggleFullscreen, windowControls, windowMaximized, windowFullscreen } = useDesktop(
    getProject,
    loadProject,
  );

  const saveProject = useCallback(async () => {
    if (!fileApi) return;
    const ok = await fileApi.saveFile();
    if (ok) {
      setDirty(false);
      showToast({ type: "success", title: "Project saved", id: "save-file" });
    }
  }, [fileApi]);

  saveProjectRef.current = saveProject;

  const handleSaveShortcut = useCallback(() => {
    if (isTauri) {
      void saveProject();
    } else {
      const blob = new Blob([JSON.stringify(getProject(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName || "Untitled"}.outlin`;
      a.click();
      URL.revokeObjectURL(url);
      setDirty(false);
      showToast({ type: "success", title: "Project downloaded", id: "save-file" });
    }
  }, [isTauri, saveProject, getProject, projectName]);

  const handleNewShortcut = useCallback(() => {
    loadProject({ pages: [], name: "Untitled" });
    showToast({ title: "New project created", id: "new-project" });
  }, [loadProject]);

  const handleOpenShortcut = useCallback(() => {
    if (isTauri) fileApi?.openFile();
  }, [isTauri, fileApi]);

  const handleSaveAsShortcut = useCallback(() => {
    if (isTauri) void fileApi?.saveFileAs();
  }, [isTauri, fileApi]);

  const exportPng = useCallback(async () => {
    const flat: { el: EditorElement; x: number; y: number }[] = [];
    const walk = (el: EditorElement, ax: number, ay: number) => {
      flat.push({ el, x: el.x + ax, y: el.y + ay });
      el.children.forEach((c) => walk(c, el.x + ax, el.y + ay));
    };
    elements.filter((e) => !e.parentId).forEach((e) => walk(e, 0, 0));
    const visible = flat.filter(({ el }) => el.visible);
    let minX = 0, minY = 0, maxX = 1440, maxY = 900;
    if (visible.length > 0) {
      minX = Math.min(...visible.map(({ x }) => x));
      minY = Math.min(...visible.map(({ y }) => y));
      maxX = Math.max(...visible.map(({ x, el }) => x + el.width));
      maxY = Math.max(...visible.map(({ y, el }) => y + el.height));
    }
    const scale = 2;
    const width = Math.max(1, Math.round((maxX - minX) * scale));
    const height = Math.max(1, Math.round((maxY - minY) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    for (const { el, x, y } of visible) {
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate((x - minX) * scale, (y - minY) * scale);
      ctx.rotate((el.rotation * Math.PI) / 180);
      const w = el.width * scale;
      const h = el.height * scale;
      if (el.type === "text") {
        ctx.fillStyle = "#d4d4d8";
        const barH = Math.max(4, 6 * scale);
        const bars = [0.72, 0.5, 0.34];
        bars.forEach((frac, i) => {
          ctx.fillRect(0, i * 16 * scale, Math.max(20, w * frac), barH);
        });
      } else {
        ctx.fillStyle = "#f5f5f4";
        ctx.strokeStyle = "#a8a29e";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 4 * scale);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#737373";
        ctx.font = `${11 * scale}px system-ui, sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(el.name, 8 * scale, 8 * scale, w - 16 * scale);
      }
      ctx.restore();
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const baseName = (projectName || "Untitled").replace(/\.(outlin|json)$/, "");
    if (isTauri) {
      try {
        const { getProjectsDir } = await import("./hooks/local-store");
        const dir = await getProjectsDir();
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeFile } = await import("@tauri-apps/plugin-fs");
        const path = await save({
          defaultPath: `${dir}/${baseName}.png`,
          filters: [{ name: "PNG Image", extensions: ["png"] }],
        });
        if (typeof path !== "string") return;
        await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
      } catch (e) {
        console.error("Failed to export:", e);
        showToast({ type: "error", title: "Could not export image", id: "export-error" });
        return;
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    showToast({ type: "success", title: "Image exported", description: `${baseName}.png`, id: "export-png" });
  }, [elements, isTauri, projectName]);

  useKeyboard({
    "Ctrl+S": handleSaveShortcut,
    "Ctrl+Shift+S": handleSaveAsShortcut,
    "Ctrl+O": handleOpenShortcut,
    "Ctrl+N": handleNewShortcut,
    "F11": toggleFullscreen,
    "V": () => setActiveTool("select"),
    "H": () => setActiveTool("hand"),
    "F": () => setActiveTool("frame"),
    "R": () => setActiveTool("rectangle"),
    "T": () => setActiveTool("text"),
  });

  const toolClass = (tool: string) =>
    `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all duration-150 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 ${
      activeTool === tool
        ? "bg-foreground text-background"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    }`;

  const content = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-neutral-50">
      <TopBar
        projectName={projectName}
        dirty={dirty}
        zoom={zoom}
        showGrid={showGrid}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        activeTool={activeTool}
        previewing={previewing}
        demo={!isTauri}
        onUndo={undo}
        onRedo={redo}
        onSelectTool={() => setActiveTool("select")}
        onFrameTool={() => setActiveTool("frame")}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onZoomIn={() => setZoom((z) => Math.min(4, z + 0.1))}
        onZoomOut={() => setZoom((z) => Math.max(0.1, z - 0.1))}
        onZoomTo={(z) => setZoom(Math.min(4, Math.max(0.1, z)))}
        onSave={isTauri ? () => void saveProject() : handleSaveShortcut}
        onNew={handleNewShortcut}
        onOpen={handleOpenShortcut}
        onTemplate={handleLoadTemplate}
        onPreview={() => {
          const next = !previewing;
          setPreviewing(next);
          setSelectedId(null);
          showToast({ title: next ? "Preview mode" : "Editing mode", id: "preview-toggle" });
        }}
        onExport={() => void exportPng()}
      />

      {previewing ? (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Canvas
            elements={elements}
            selectedId={null}
            showGrid={false}
            activeTool={activeTool}
            zoom={zoom}
            previewing
            onZoomChange={setZoom}
            onSelect={setSelectedId}
            onUpdateElement={updateElement}
            onCommitMove={() => pushHistory(elements)}
            onDelete={deleteSelected}
            onCanvasClick={handleCanvasClick}
          />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          pages={pages}
          activePageId={activePageId}
          onPageSelect={handlePageSelect}
          onPageAdd={handlePageAdd}
          onPageDelete={handlePageDelete}
          elements={elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
          onAddAsset={handleSidebarAdd}
        />

        <div className="relative flex flex-1">
          <ContextMenu open={contextOpen} onOpenChange={setContextOpen}>
            <ContextMenuTrigger className="flex flex-1 overflow-hidden" onContextMenu={handleContextMenu}>
              <Canvas
                elements={elements}
                selectedId={selectedId}
                showGrid={showGrid}
                activeTool={activeTool}
                zoom={zoom}
                previewing={false}
                onZoomChange={setZoom}
                onSelect={setSelectedId}
                onUpdateElement={updateElement}
                onCommitMove={() => pushHistory(elements)}
                onDelete={deleteSelected}
                onCanvasClick={handleCanvasClick}
              />
            </ContextMenuTrigger>
            <ContextMenuPopup>
              {contextTarget === "element" && contextElementId && elements.find(e => e.id === contextElementId) ? (
                <>
                  <ContextMenuItem closeOnClick onClick={duplicate}>
                    <Copy aria-hidden="true" className="opacity-80" />
                    Duplicate
                    <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={deleteSelected} variant="destructive">
                    <Trash2 aria-hidden="true" className="opacity-80" />
                    Delete
                    <ContextMenuShortcut>⌫</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={() => updateElement(contextElementId, { locked: true })}>
                    <Lock aria-hidden="true" className="opacity-80" />
                    Lock
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={() => updateElement(contextElementId, { visible: false })}>
                    <EyeOff aria-hidden="true" className="opacity-80" />
                    Hide
                  </ContextMenuItem>
                </>
              ) : (
                <>
                  <ContextMenuItem closeOnClick onClick={() => {}}>
                    <ClipboardPaste aria-hidden="true" className="opacity-80" />
                    Paste here
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={() => addElement("frame", 100, 100)}>
                    <Square aria-hidden="true" className="opacity-80" />
                    Create Frame
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={() => setZoom(1)}>
                    <Maximize2 aria-hidden="true" className="opacity-80" />
                    Fit to view
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuPopup>
          </ContextMenu>
        </div>

        <RightPanel
          element={selected}
          parent={selected?.parentId ? elements.find((e) => e.id === selected.parentId) ?? null : null}
          onUpdate={updateElement}
          onDelete={deleteSelected}
        />
      </div>
      )}

      {/* Floating toolbar */}
      {!previewing && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
        <div className="animate-fade-up">
          <CossToolbar className="rounded-full border bg-background/70 p-1 shadow-[0_10px_40px_-10px_rgb(0,0,0,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <ToolbarGroup>
            <ToolbarButton className={toolClass("select")} onClick={() => setActiveTool("select")}>
              <MousePointer2 aria-hidden="true" className="size-3.5" />
              Select
            </ToolbarButton>
            <ToolbarButton className={toolClass("hand")} onClick={() => setActiveTool("hand")}>
              <Hand aria-hidden="true" className="size-3.5" />
              Hand
            </ToolbarButton>
            <ToolbarButton className={toolClass("frame")} onClick={() => setActiveTool("frame")}>
              <FrameIcon aria-hidden="true" className="size-3.5" />
              Frame
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <ToolbarButton className={toolClass("rectangle")} onClick={() => setActiveTool("rectangle")}>
              <Square aria-hidden="true" className="size-3.5" />
              Rectangle
            </ToolbarButton>
            <ToolbarButton className={toolClass("text")} onClick={() => setActiveTool("text")}>
              <Type aria-hidden="true" className="size-3.5" />
              Text
            </ToolbarButton>
          </ToolbarGroup>
          </CossToolbar>
        </div>
      </div>
      )}
    </div>
    );

  if (!isTauri) {
    return <div className="h-svh overflow-hidden">{content}</div>;
  }

  const framed = !windowMaximized && !windowFullscreen;

  return (
    <div className={cn("h-svh bg-transparent", framed && "p-1.5")}>
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden bg-neutral-800",
          framed && "rounded-xl shadow-[0_20px_70px_-15px_rgb(0,0,0,0.5)] ring-1 ring-black/40",
        )}
      >
        <TitleBar
          maximized={windowMaximized}
          onMinimize={() => windowControls("minimize")}
          onMaximize={() => windowControls("maximize")}
          onClose={() => windowControls("close")}
        />
        <div className={cn("flex min-h-0 flex-1 overflow-hidden bg-neutral-50", framed && "mx-1.5 mb-1.5 rounded-lg")}>
          {content}
        </div>
      </div>
    </div>
  );
}
