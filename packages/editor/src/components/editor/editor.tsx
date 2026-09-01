"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
} from "@bluepen/editor/components/ui/context-menu";
import {
  Copy, Trash2, Lock, EyeOff, Square, Maximize2, ClipboardPaste,
  MousePointer2, Hand, Type, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine,
  Boxes, Ungroup,
} from "lucide-react";
import {
  Toolbar as CossToolbar,
  ToolbarGroup,
  ToolbarButton,
  ToolbarSeparator,
} from "@bluepen/editor/components/ui/toolbar";
import { useKeyboard } from "./hooks/use-keyboard";
import { library } from "./library/index";
import { webLibrary } from "./library/web-components";
import { groupElements, ungroupElements, canGroupElements, canUngroupElements } from "./utils/grouping";
import { isBlockTemplate, createBlockTemplateGroup } from "./library/block-templates";
import { confirmLocal } from "./hooks/use-desktop";
import { showToast } from "./hooks/use-toast";
import { loadProjectLocal, saveProjectLocal, loadSettingsLocal, saveSettingsLocal } from "./hooks/local-store";
import { processImageFile, extractImageFromClipboardData } from "./utils/image";
import { cn } from "@bluepen/editor/lib/utils";

function genId() {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureUniqueIds(pages: Page[]): Page[] {
  const seen = new Set<string>();
  const fixNode = (node: EditorElement): EditorElement => {
    let id = node.id;
    if (!id || seen.has(id)) {
      id = genId();
    }
    seen.add(id);
    return {
      ...node,
      id,
      children: (node.children || []).map(fixNode),
    };
  };
  return pages.map((p) => ({
    ...p,
    elements: (p.elements || []).map(fixNode),
  }));
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedId = selectedIds[selectedIds.length - 1] ?? null;

  const allElementsFlat = useMemo(() => {
    const flat: EditorElement[] = [];
    const walk = (nodes: EditorElement[]) => {
      for (const node of nodes) {
        flat.push(node);
        if (node.children && node.children.length > 0) {
          walk(node.children);
        }
      }
    };
    walk(elements);
    return flat;
  }, [elements]);

  const selectedElements = useMemo(() => {
    return allElementsFlat.filter((el: EditorElement) => selectedIds.includes(el.id));
  }, [allElementsFlat, selectedIds]);

  const selected = useMemo(() => {
    return allElementsFlat.find((el: EditorElement) => el.id === selectedId) ?? null;
  }, [allElementsFlat, selectedId]);

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIds(id ? [id] : []);
  }, []);
  const [projectName, setProjectName] = useState("Untitled");
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [leftDrawerCollapsed, setLeftDrawerCollapsed] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  const toggleLeftDrawer = useCallback(() => {
    setLeftDrawerCollapsed((prev) => !prev);
  }, []);

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
        const uniquePages = ensureUniqueIds(project.pages);
        setPages(uniquePages);
        setProjectName(project.name || "Untitled");
        if (project.filePath) {
          setCurrentFilePath(project.filePath);
        }
        const first = uniquePages[0];
        if (first) {
          setActivePageId(first.id);
          setHistory([JSON.parse(JSON.stringify(first.elements))]);
          setHistoryIndex(0);
        }
      }
      if (settings) {
        setZoom(settings.zoom ?? 1);
        setShowGrid(settings.showGrid ?? true);
        if (typeof settings.leftDrawerCollapsed === "boolean") {
          setLeftDrawerCollapsed(settings.leftDrawerCollapsed);
        }
        if (settings.theme === "dark" || settings.theme === "light") {
          setTheme(settings.theme);
          document.documentElement.classList.toggle("dark", settings.theme === "dark");
        } else {
          const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
          setTheme(isDark ? "dark" : "light");
        }
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
      }, currentFilePath).then(() => setDirty(false));
    }, 600);
    return () => clearTimeout(t);
  }, [pages, projectName, currentFilePath, hydrated]);

  // Auto-save settings (debounced)
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      void saveSettingsLocal({
        zoom,
        showGrid,
        theme,
        leftDrawerCollapsed,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [zoom, showGrid, theme, leftDrawerCollapsed, hydrated]);

  const latestElementsRef = useRef(elements);
  latestElementsRef.current = elements;

  const pushHistory = useCallback(
    (next: EditorElement[]) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        const snapshot =
          typeof structuredClone === "function"
            ? structuredClone(next)
            : JSON.parse(JSON.stringify(next));
        trimmed.push(snapshot);
        if (trimmed.length > 50) {
          trimmed.shift();
        }
        return trimmed;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 50));
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

  // Live update for dragging, resizing, rotating on canvas (does not push history on every tick)
  const updateElementLive = useCallback(
    (id: string, patch: Partial<EditorElement>) => {
      const updateRecursive = (list: EditorElement[]): EditorElement[] => {
        return list.map((node) => {
          if (node.id === id) {
            return { ...node, ...patch };
          }
          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: updateRecursive(node.children),
            };
          }
          return node;
        });
      };
      setElements(updateRecursive(latestElementsRef.current));
    },
    [setElements],
  );

  // Discrete element updates (e.g. from RightPanel/Sidebar/Context-Menu), commits to history
  const updateElement = useCallback(
    (id: string, patch: Partial<EditorElement>) => {
      const updateRecursive = (list: EditorElement[]): EditorElement[] => {
        return list.map((node) => {
          if (node.id === id) {
            return { ...node, ...patch };
          }
          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: updateRecursive(node.children),
            };
          }
          return node;
        });
      };
      const next = updateRecursive(latestElementsRef.current);
      commit(next);
    },
    [commit],
  );

  // Live batch update for multi-element dragging/moving on canvas
  const batchUpdateElementsLive = useCallback(
    (patches: Array<{ id: string; patch: Partial<EditorElement> }>) => {
      if (!patches || patches.length === 0) return;
      const patchMap = new Map(patches.map((p) => [p.id, p.patch]));
      const updateRecursive = (list: EditorElement[]): EditorElement[] => {
        return list.map((node) => {
          const patch = patchMap.get(node.id);
          const updated = patch ? { ...node, ...patch } : node;
          if (node.children && node.children.length > 0) {
            return {
              ...updated,
              children: updateRecursive(node.children),
            };
          }
          return updated;
        });
      };
      setElements(updateRecursive(latestElementsRef.current));
    },
    [setElements],
  );

  const commitBatchUpdateElements = useCallback(
    (patches: Array<{ id: string; patch: Partial<EditorElement> }>) => {
      if (!patches || patches.length === 0) return;
      const patchMap = new Map(patches.map((p) => [p.id, p.patch]));
      const updateRecursive = (list: EditorElement[]): EditorElement[] => {
        return list.map((node) => {
          const patch = patchMap.get(node.id);
          const updated = patch ? { ...node, ...patch } : node;
          if (node.children && node.children.length > 0) {
            return {
              ...updated,
              children: updateRecursive(node.children),
            };
          }
          return updated;
        });
      };
      const next = updateRecursive(latestElementsRef.current);
      commit(next);
    },
    [commit],
  );

  const handleCommitCanvasGesture = useCallback(() => {
    pushHistory(latestElementsRef.current);
  }, [pushHistory]);

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
      setSelectedIds((prev) => prev.filter((item) => !doomed.has(item)));
    },
    [elements, commit, selectedId],
  );

  const addElement = useCallback(
    (
      type: ComponentType,
      x: number,
      y: number,
      parentId: string | null = null,
      width?: number,
      height?: number,
      rotation = 0,
      customProps?: Record<string, string | number | boolean>,
    ) => {
      // 业务区块模版：生成由真实原子组件构成的 Group 组合
      if (isBlockTemplate(type)) {
        const groupEl = createBlockTemplateGroup(type, x, y, parentId);
        if (groupEl) {
          const next = parentId
            ? elements.map((e) =>
                e.id === parentId ? { ...e, children: [...e.children, groupEl] } : e,
              )
            : [...elements, groupEl];
          commit(next);
          setSelectedId(groupEl.id);
          setSelectedIds([groupEl.id]);
          return;
        }
      }

      const lib = library.find((c) => c.type === type) || webLibrary.find((c) => c.type === type);
      const el: EditorElement = {
        id: genId(),
        type,
        name: lib?.label || (type === "connector" ? "连接线" : type === "group" ? "组合" : type),
        x,
        y,
        width: width ?? (lib?.defaultWidth || (type === "connector" ? 160 : 200)),
        height: height ?? (lib?.defaultHeight || (type === "connector" ? 80 : 100)),
        rotation,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        children: [],
        props: { ...(lib?.defaultProps ?? {}), ...(customProps ?? {}) },
        parentId,
      };
      const next = parentId
        ? elements.map((e) =>
            e.id === parentId ? { ...e, children: [...e.children, el] } : e,
          )
        : elements;
      commit([...next, el]);
      setSelectedId(el.id);
      setSelectedIds([el.id]);
    },
    [elements, commit],
  );

  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const { nextElements, groupId } = groupElements(selectedIds, elements);
    if (groupId) {
      commit(nextElements);
      setSelectedId(groupId);
      setSelectedIds([groupId]);
      showToast({
        type: "success",
        title: "已创建组合",
        description: `已将选中的 ${selectedIds.length} 个图层组合为一个整体`,
        id: "group-success",
      });
    }
  }, [selectedIds, elements, commit]);

  const ungroupSelected = useCallback(() => {
    const targetIds = contextElementId ? [contextElementId] : selectedIds;
    if (targetIds.length === 0) return;
    const { nextElements, releasedIds } = ungroupElements(targetIds, elements);
    if (releasedIds.length > 0) {
      commit(nextElements);
      setSelectedIds(releasedIds);
      if (releasedIds[0]) setSelectedId(releasedIds[0]);
      showToast({
        type: "success",
        title: "已打散组合",
        description: `已解组释放为 ${releasedIds.length} 个独立组件`,
        id: "ungroup-success",
      });
    }
  }, [contextElementId, selectedIds, elements, commit]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const deleteIds = new Set(selectedIds);
    const filterOut = (list: EditorElement[]): EditorElement[] => {
      return list
        .filter((e) => !deleteIds.has(e.id))
        .map((e) => ({
          ...e,
          children: filterOut(e.children),
        }));
    };
    const next = filterOut(elements);
    commit(next);
    setSelectedIds([]);
  }, [selectedIds, elements, commit]);

  const bringToFront = useCallback(() => {
    const targetIds = contextElementId
      ? (selectedIds.includes(contextElementId) ? selectedIds : [contextElementId])
      : selectedIds;
    if (targetIds.length === 0) return;
    const selectedSet = new Set(targetIds);
    const moving = elements.filter((e) => selectedSet.has(e.id));
    const rest = elements.filter((e) => !selectedSet.has(e.id));
    commit([...rest, ...moving]);
  }, [contextElementId, selectedIds, elements, commit]);

  const sendToBack = useCallback(() => {
    const targetIds = contextElementId
      ? (selectedIds.includes(contextElementId) ? selectedIds : [contextElementId])
      : selectedIds;
    if (targetIds.length === 0) return;
    const selectedSet = new Set(targetIds);
    const moving = elements.filter((e) => selectedSet.has(e.id));
    const rest = elements.filter((e) => !selectedSet.has(e.id));
    commit([...moving, ...rest]);
  }, [contextElementId, selectedIds, elements, commit]);

  const bringForward = useCallback(() => {
    const targetId = contextElementId || selectedId;
    if (!targetId) return;
    const idx = elements.findIndex((e) => e.id === targetId);
    if (idx === -1 || idx === elements.length - 1) return;
    const next = [...elements];
    const temp = next[idx];
    next[idx] = next[idx + 1];
    next[idx + 1] = temp;
    commit(next);
  }, [contextElementId, selectedId, elements, commit]);

  const sendBackward = useCallback(() => {
    const targetId = contextElementId || selectedId;
    if (!targetId) return;
    const idx = elements.findIndex((e) => e.id === targetId);
    if (idx === -1 || idx === 0) return;
    const next = [...elements];
    const temp = next[idx];
    next[idx] = next[idx - 1];
    next[idx - 1] = temp;
    commit(next);
  }, [contextElementId, selectedId, elements, commit]);

  const duplicate = useCallback(() => {
    const targetIds = contextElementId
      ? (selectedIds.includes(contextElementId) ? selectedIds : [contextElementId])
      : selectedIds;
    if (targetIds.length === 0) return;

    const newCreatedIds: string[] = [];
    let next = [...elements];

    targetIds.forEach((targetId) => {
      const el = next.find((e) => e.id === targetId);
      if (!el) return;
      const idMap = new Map<string, string>();
      const cloneNode = (node: EditorElement): EditorElement => {
        const newId = genId();
        idMap.set(node.id, newId);
        return {
          ...JSON.parse(JSON.stringify(node)),
          id: newId,
          name: `${node.name} copy`,
          x: node.x + 20,
          y: node.y + 20,
          parentId: node.parentId ? idMap.get(node.parentId) ?? node.parentId : null,
          children: node.children.map(cloneNode),
        };
      };
      const copy = cloneNode(el);
      newCreatedIds.push(copy.id);
      next = copy.parentId
        ? next.map((e) =>
            e.id === copy.parentId ? { ...e, children: [...e.children, copy] } : e,
          )
        : [...next, copy];
    });

    commit(next);
    setSelectedIds(newCreatedIds);
  }, [contextElementId, selectedIds, elements, commit]);

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
      const wireframeTools = [
        "rectangle", "text", "circle", "line", "arrow", "hotspot", "placeholder", "sticky-note", "pin-note",
        "flow-process", "flow-decision", "flow-start-end", "flow-document", "flow-data",
        "flow-subprocess", "flow-external-data", "flow-internal-storage", "flow-queue",
        "flow-database", "flow-manual-input", "flow-card", "flow-tape",
        "flow-display", "flow-manual-op", "flow-preparation", "flow-loop-limit",
      ];
      if (wireframeTools.includes(activeTool)) {
        const snap = (v: number) => Math.round(v / 20) * 20;
        let parentId: string | null = null;
        let px = snap(canvasX);
        let py = snap(canvasY);
        const container = [...elements]
          .reverse()
          .find(
            (el) =>
              (el.type === "mobile-frame" || el.type === "browser-frame") &&
              canvasX >= el.x && canvasX <= el.x + el.width &&
              canvasY >= el.y && canvasY <= el.y + el.height,
          );
        if (container) {
          parentId = container.id;
          px = snap(canvasX - container.x);
          py = snap(canvasY - container.y);
        }
        addElement(activeTool as ComponentType, px, py, parentId);
        setActiveTool("select");
      }
    },
    [activeTool, addElement, elements],
  );

  const lastCanvasPointerPosRef = useRef<{ x: number; y: number }>({ x: 200, y: 200 });

  const insertImageFile = useCallback(
    async (file: Blob | File, targetCanvasX?: number, targetCanvasY?: number) => {
      try {
        const processed = await processImageFile(file);

        const snap = (v: number) => Math.round(v / 20) * 20;

        let posX = targetCanvasX !== undefined ? targetCanvasX : lastCanvasPointerPosRef.current.x;
        let posY = targetCanvasY !== undefined ? targetCanvasY : lastCanvasPointerPosRef.current.y;

        if (targetCanvasX === undefined) {
          const offset = (elements.length % 6) * 24;
          posX = 140 + offset;
          posY = 140 + offset;
        }

        let cx = snap(posX - processed.width / 2);
        let cy = snap(posY - processed.height / 2);

        let parentId: string | null = null;
        const container = [...elements]
          .reverse()
          .find(
            (el) =>
              (el.type === "mobile-frame" || el.type === "browser-frame") &&
              posX >= el.x && posX <= el.x + el.width &&
              posY >= el.y && posY <= el.y + el.height,
          );

        if (container) {
          parentId = container.id;
          cx = snap(posX - container.x - processed.width / 2);
          cy = snap(posY - container.y - processed.height / 2);
        }

        addElement(
          "image",
          cx,
          cy,
          parentId,
          processed.width,
          processed.height,
          0,
          {
            src: processed.dataUrl,
            naturalWidth: processed.naturalWidth,
            naturalHeight: processed.naturalHeight,
            fit: "cover",
            label: processed.name || "图片",
          },
        );

        showToast({
          type: "success",
          title: "图片已置入画布",
          description: `${processed.naturalWidth} × ${processed.naturalHeight} PX`,
          id: "insert-image",
        });
      } catch (err) {
        console.error("Failed to insert image:", err);
        showToast({
          type: "error",
          title: "无法读取图片数据",
          id: "insert-image-error",
        });
      }
    },
    [elements, addElement],
  );

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        if (target.isContentEditable) return;
        const tag = target.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
      }

      const imageFile = extractImageFromClipboardData(e.clipboardData);
      if (imageFile) {
        e.preventDefault();
        await insertImageFile(imageFile);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [insertImageFile]);

  const handlePasteAtContextPos = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith("image/"));
          if (imageType) {
            const blob = await item.getType(imageType);
            await insertImageFile(blob);
            return;
          }
        }
      }
      showToast({ title: "剪贴板中未发现图片", id: "no-clipboard-img" });
    } catch {
      showToast({ title: "请按 Ctrl+V 快捷键进行粘贴", id: "clipboard-key-hint" });
    }
  }, [insertImageFile]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (previewing) return;
      const target = e.target as HTMLElement;
      const elTarget = target.closest("[data-element]");
      const elId = elTarget?.getAttribute("data-element-id");
      const isMultiSelectionBox = Boolean(
        target.closest("[data-multi-selection-box]") ||
        target.closest("[data-selection-box]")
      );

      if (elId) {
        let targetId = elId;
        const el = allElementsFlat.find((item) => item.id === elId);
        if (el?.parentId && !e.metaKey && !e.ctrlKey) {
          let curr = el;
          let groupAncestor: EditorElement | null = null;
          while (curr.parentId) {
            const parent = allElementsFlat.find((p) => p.id === curr.parentId);
            if (!parent) break;
            if (parent.type === "group") {
              groupAncestor = parent;
            }
            curr = parent;
          }
          if (groupAncestor && !selectedIds.includes(elId)) {
            targetId = groupAncestor.id;
          }
        }

        if (!selectedIds.includes(targetId) && !selectedIds.includes(elId)) {
          setSelectedId(targetId);
          setSelectedIds([targetId]);
        }
        setContextTarget("element");
        setContextElementId(targetId);
      } else if (isMultiSelectionBox && selectedIds.length > 0) {
        setContextTarget("element");
        setContextElementId(selectedIds[0] ?? null);
      } else {
        setSelectedId(null);
        setSelectedIds([]);
        setContextTarget("canvas");
        setContextElementId(null);
      }
      setContextOpen(true);
    },
    [previewing, selectedIds, allElementsFlat],
  );

  const nudgeMove = useCallback(
    (dx: number, dy: number) => {
      if (selectedIds.length === 0) return;
      const selectedSet = new Set(selectedIds);
      const moveRecursive = (list: EditorElement[]): EditorElement[] => {
        return list.map((el) => {
          if (selectedSet.has(el.id) && !el.locked) {
            return {
              ...el,
              x: el.x + dx,
              y: el.y + dy,
              children: el.children ? moveRecursive(el.children) : [],
            };
          }
          if (el.children && el.children.length > 0) {
            return {
              ...el,
              children: moveRecursive(el.children),
            };
          }
          return el;
        });
      };
      const next = moveRecursive(elements);
      commit(next);
    },
    [selectedIds, elements, commit],
  );

  const nudgeResize = useCallback(
    (dw: number, dh: number) => {
      if (selectedIds.length === 0) return;
      const selectedSet = new Set(selectedIds);
      const resizeRecursive = (list: EditorElement[]): EditorElement[] => {
        return list.map((el) => {
          if (selectedSet.has(el.id) && !el.locked) {
            return {
              ...el,
              width: Math.max(1, el.width + dw),
              height: Math.max(1, el.height + dh),
              children: el.children ? resizeRecursive(el.children) : [],
            };
          }
          if (el.children && el.children.length > 0) {
            return {
              ...el,
              children: resizeRecursive(el.children),
            };
          }
          return el;
        });
      };
      const next = resizeRecursive(elements);
      commit(next);
    },
    [selectedIds, elements, commit],
  );

  useKeyboard({
    "Ctrl+Z": undo,
    "Ctrl+Shift+Z": redo,
    "Delete": deleteSelected,
    "Backspace": deleteSelected,
    "Ctrl+D": duplicate,
    "Ctrl+]": bringForward,
    "Ctrl+[": sendBackward,
    "Ctrl+Shift+]": bringToFront,
    "Ctrl+Shift+[": sendToBack,
    "Ctrl+=": () => setZoom((z) => Math.min(4, z + 0.1)),
    "Ctrl++": () => setZoom((z) => Math.min(4, z + 0.1)),
    "Ctrl+-": () => setZoom((z) => Math.max(0.1, z - 0.1)),
    "Ctrl+0": () => setZoom(1),
    "Escape": () => {
      if (previewing) {
        setPreviewing(false);
        showToast({ title: "Editing mode", id: "exit-preview" });
      } else {
        setSelectedId(null);
        setActiveTool("select");
      }
    },
    "Ctrl+G": groupSelected,
    "Ctrl+Shift+G": ungroupSelected,
    "Ctrl+A": () => {
      setSelectedIds(elements.filter((e) => e.visible).map((e) => e.id));
    },
    // Directional Nudge (1px micro-adjustment)
    "ArrowUp": () => nudgeMove(0, -1),
    "ArrowDown": () => nudgeMove(0, 1),
    "ArrowLeft": () => nudgeMove(-1, 0),
    "ArrowRight": () => nudgeMove(1, 0),
    // Shift + Directional Nudge (10px step)
    "Shift+ArrowUp": () => nudgeMove(0, -10),
    "Shift+ArrowDown": () => nudgeMove(0, 10),
    "Shift+ArrowLeft": () => nudgeMove(-10, 0),
    "Shift+ArrowRight": () => nudgeMove(10, 0),
    // Alt + Directional Resize (1px micro-adjustment)
    "Alt+ArrowUp": () => nudgeResize(0, -1),
    "Alt+ArrowDown": () => nudgeResize(0, 1),
    "Alt+ArrowLeft": () => nudgeResize(-1, 0),
    "Alt+ArrowRight": () => nudgeResize(1, 0),
    // Alt + Shift + Directional Resize (10px step)
    "Alt+Shift+ArrowUp": () => nudgeResize(0, -10),
    "Alt+Shift+ArrowDown": () => nudgeResize(0, 10),
    "Alt+Shift+ArrowLeft": () => nudgeResize(-10, 0),
    "Alt+Shift+ArrowRight": () => nudgeResize(10, 0),
  });

  const handleSidebarAdd = useCallback(
    (type: ComponentType) => {
      let parentId: string | null = null;
      let px = 120;
      let py = 120;
      const parent = elements.find((el) => el.id === selectedId && (el.type === "mobile-frame" || el.type === "browser-frame"));
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
    (data: { pages: Page[]; name: string; filePath?: string | null }) => {
      const initialPages = data.pages && data.pages.length > 0
        ? data.pages
        : [{ id: genId(), name: "Page 1", elements: [] }];
      const loadedPages = ensureUniqueIds(initialPages);
      setPages(loadedPages);
      setProjectName(data.name || "Untitled");
      setCurrentFilePath(data.filePath ?? null);
      if (loadedPages[0]) {
        setActivePageId(loadedPages[0].id);
        setHistory([JSON.parse(JSON.stringify(loadedPages[0].elements))]);
      } else {
        setActivePageId("");
        setHistory([[]]);
      }
      setHistoryIndex(0);
      setSelectedId(null);
      setSelectedIds([]);
      setDirty(false);
    },
    [],
  );

  const handleLoadTemplate = useCallback(() => {
    void confirmLocal("Replace the current project with the example template?").then(
      (ok) => {
        if (ok) {
          loadProject({ pages: templatePages, name: projectName, filePath: currentFilePath });
          showToast({
            type: "success",
            title: "Template inserted",
            description: "Landing Page & Dashboard",
            id: "template",
          });
        }
      },
    );
  }, [loadProject, projectName, currentFilePath]);

  const { isTauri, fileApi, toggleFullscreen, windowControls, windowMaximized, windowFullscreen } = useDesktop(
    getProject,
    loadProject,
  );

  const handleSaveShortcut = useCallback(async () => {
    if (isTauri) {
      if (!fileApi) return;
      const res = await fileApi.saveFile(currentFilePath);
      if (res.ok) {
        if (res.path) {
          setCurrentFilePath(res.path);
          const baseName = res.path.split(/[\\/]/).pop()?.replace(/\.(bluepen|json)$/, "");
          if (baseName) setProjectName(baseName);
        }
        setDirty(false);
        showToast({ type: "success", title: "Project saved", id: "save-file" });
      }
    } else {
      const blob = new Blob([JSON.stringify(getProject(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName || "Untitled"}.bluepen`;
      a.click();
      URL.revokeObjectURL(url);
      setDirty(false);
      showToast({ type: "success", title: "Project downloaded", id: "save-file" });
    }
  }, [isTauri, fileApi, currentFilePath, getProject, projectName]);

  const handleSaveAsShortcut = useCallback(async () => {
    if (isTauri) {
      if (!fileApi) return;
      const res = await fileApi.saveFileAs();
      if (res.ok && res.path) {
        setCurrentFilePath(res.path);
        const baseName = res.path.split(/[\\/]/).pop()?.replace(/\.(bluepen|json)$/, "");
        if (baseName) setProjectName(baseName);
        setDirty(false);
        showToast({ type: "success", title: "Project saved as", description: baseName, id: "save-file-as" });
      }
    } else {
      void handleSaveShortcut();
    }
  }, [isTauri, fileApi, handleSaveShortcut]);

  const handleNewShortcut = useCallback(async () => {
    if (dirty) {
      const ok = await confirmLocal("Current project has unsaved changes. Create a new project anyway?");
      if (!ok) return;
    }
    loadProject({
      pages: [{ id: genId(), name: "Page 1", elements: [] }],
      name: "Untitled",
      filePath: null,
    });
    showToast({ title: "New project created", id: "new-project" });
  }, [dirty, loadProject]);

  const handleOpenShortcut = useCallback(async () => {
    if (dirty) {
      const ok = await confirmLocal("Current project has unsaved changes. Open another project anyway?");
      if (!ok) return;
    }
    if (isTauri) {
      await fileApi?.openFile();
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".bluepen,.json";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (!data || !Array.isArray(data.pages)) {
            showToast({ type: "error", title: "Invalid project file", id: "open-file-invalid" });
            return;
          }
          const baseName = file.name.replace(/\.(bluepen|json)$/, "") || "Untitled";
          loadProject({
            pages: data.pages,
            name: data.name ?? baseName,
            filePath: null,
          });
          showToast({ type: "success", title: "Project opened", description: baseName, id: "open-file" });
        } catch (err) {
          console.error("Failed to parse project file:", err);
          showToast({ type: "error", title: "Could not parse project file", id: "open-file-error" });
        }
      };
      input.click();
    }
  }, [dirty, isTauri, fileApi, loadProject]);

  const handleDropFile = useCallback(
    async (file: File, x?: number, y?: number) => {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".bluepen") || (fileName.endsWith(".json") && !file.type.startsWith("image/"))) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data && Array.isArray(data.pages)) {
            if (dirty) {
              const ok = await confirmLocal("Current project has unsaved changes. Open dropped project anyway?");
              if (!ok) return;
            }
            const baseName = file.name.replace(/\.(bluepen|json)$/, "") || "Untitled";
            loadProject({
              pages: data.pages,
              name: data.name ?? baseName,
              filePath: null,
            });
            showToast({ type: "success", title: "Project opened", description: baseName, id: "open-file" });
            return;
          }
        } catch (err) {
          console.error("Failed to parse dropped project:", err);
          showToast({ type: "error", title: "Could not parse project file", id: "open-file-error" });
          return;
        }
      }
      await insertImageFile(file, x, y);
    },
    [dirty, loadProject, insertImageFile],
  );

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

      if (el.type === "image" && el.props?.src) {
        const imgSrc = String(el.props.src);
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = imgSrc;
          });
          const rad = Number(el.props.radius || 0) * scale;
          if (rad > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, rad);
            ctx.clip();
            ctx.drawImage(img, 0, 0, w, h);
            ctx.restore();
          } else {
            ctx.drawImage(img, 0, 0, w, h);
          }
        } catch {
          // Ignore image load failure
        }
      } else if (el.type === "text") {
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
    const baseName = (projectName || "Untitled").replace(/\.(bluepen|json)$/, "");
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
    "Ctrl+B": toggleLeftDrawer,
    "F11": toggleFullscreen,
    "V": () => setActiveTool("select"),
    "H": () => setActiveTool("hand"),
    "R": () => setActiveTool("rectangle"),
    "T": () => setActiveTool("text"),
    "E": () => setActiveTool("connector"),
    "O": () => setActiveTool("circle"),
    "L": () => setActiveTool("line"),
    "N": () => setActiveTool("sticky-note"),
    "W": () => setActiveTool("pin-note"),
    "U": () => setActiveTool("hotspot"),
  });

  const toolClass = (tool: string) =>
    `inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium tracking-wider uppercase transition-colors duration-150 focus-visible:outline-none select-none ${
      activeTool === tool
        ? "bg-primary text-primary-foreground font-bold"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const content = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
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
        theme={theme}
        onToggleTheme={toggleTheme}
        onUndo={undo}
        onRedo={redo}
        onSelectTool={() => setActiveTool("select")}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onZoomIn={() => setZoom((z) => Math.min(4, z + 0.1))}
        onZoomOut={() => setZoom((z) => Math.max(0.1, z - 0.1))}
        onZoomTo={(z) => setZoom(Math.min(4, Math.max(0.1, z)))}
        onSave={handleSaveShortcut}
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
            onUpdateElement={updateElementLive}
            onCommitMove={handleCommitCanvasGesture}
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
            selectedIds={selectedIds}
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onSelect={setSelectedId}
            onSelectIds={setSelectedIds}
            onUpdateElement={updateElement}
            onDeleteElement={deleteElement}
            onAddAsset={handleSidebarAdd}
            drawerCollapsed={leftDrawerCollapsed}
            onToggleDrawer={toggleLeftDrawer}
          />

        <div className="relative flex flex-1 min-w-0 overflow-hidden">
          <ContextMenu open={contextOpen} onOpenChange={setContextOpen}>
            <ContextMenuTrigger className="flex flex-1 overflow-hidden" onContextMenu={handleContextMenu}>
              <Canvas
                elements={elements}
                selectedId={selectedId}
                selectedIds={selectedIds}
                showGrid={showGrid}
                activeTool={activeTool}
                zoom={zoom}
                previewing={false}
                onZoomChange={setZoom}
                onSelect={setSelectedId}
                onSelectIds={setSelectedIds}
                onSelectTool={setActiveTool}
                onUpdateElement={updateElementLive}
                onBatchUpdateElements={batchUpdateElementsLive}
                onCreateElement={(type, x, y, width, height, rotation, parentId, customProps) =>
                  addElement(type, x, y, parentId, width, height, rotation ?? 0, customProps)
                }
                onCommitMove={handleCommitCanvasGesture}
                onDelete={deleteSelected}
                onCanvasClick={handleCanvasClick}
                onDropAsset={(type, x, y) => addElement(type, x, y)}
                onDropFile={(file, x, y) => void handleDropFile(file, x, y)}
              />
            </ContextMenuTrigger>
            <ContextMenuPopup>
              {contextTarget === "element" && ((contextElementId && allElementsFlat.some((e: EditorElement) => e.id === contextElementId)) || selectedIds.length > 0) ? (
                <>
                  <ContextMenuItem closeOnClick onClick={duplicate}>
                    <Copy aria-hidden="true" className="opacity-80" />
                    克隆
                    <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
                  </ContextMenuItem>
                  {canGroupElements(selectedIds, elements) && (
                    <ContextMenuItem closeOnClick onClick={groupSelected}>
                      <Boxes aria-hidden="true" className="opacity-80" />
                      组合
                      <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
                    </ContextMenuItem>
                  )}
                  {canUngroupElements(contextElementId ? [contextElementId] : selectedIds, elements) && (
                    <ContextMenuItem closeOnClick onClick={ungroupSelected}>
                      <Ungroup aria-hidden="true" className="opacity-80" />
                      打散
                      <ContextMenuShortcut>Ctrl+Shift+G</ContextMenuShortcut>
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={bringForward}>
                    <ArrowUp aria-hidden="true" className="opacity-80" />
                    上移一层
                    <ContextMenuShortcut>Ctrl+]</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={sendBackward}>
                    <ArrowDown aria-hidden="true" className="opacity-80" />
                    下移一层
                    <ContextMenuShortcut>Ctrl+[</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={bringToFront}>
                    <ArrowUpToLine aria-hidden="true" className="opacity-80" />
                    置于顶层
                    <ContextMenuShortcut>Ctrl+Shift+]</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={sendToBack}>
                    <ArrowDownToLine aria-hidden="true" className="opacity-80" />
                    置于底层
                    <ContextMenuShortcut>Ctrl+Shift+[</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={deleteSelected} variant="destructive">
                    <Trash2 aria-hidden="true" className="opacity-80" />
                    删除
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    closeOnClick
                    onClick={() => {
                      const ids = selectedIds.length > 0 ? selectedIds : (contextElementId ? [contextElementId] : []);
                      ids.forEach((id) => updateElement(id, { locked: true }));
                    }}
                  >
                    <Lock aria-hidden="true" className="opacity-80" />
                    锁定
                  </ContextMenuItem>
                  <ContextMenuItem
                    closeOnClick
                    onClick={() => {
                      const ids = selectedIds.length > 0 ? selectedIds : (contextElementId ? [contextElementId] : []);
                      ids.forEach((id) => updateElement(id, { visible: false }));
                    }}
                  >
                    <EyeOff aria-hidden="true" className="opacity-80" />
                    隐藏
                  </ContextMenuItem>
                </>
              ) : (
                <>
                  <ContextMenuItem closeOnClick onClick={() => addElement("rectangle", lastCanvasPointerPosRef.current.x, lastCanvasPointerPosRef.current.y)}>
                    <Square aria-hidden="true" className="opacity-80" />
                    新建矩形
                    <ContextMenuShortcut>R</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={() => addElement("text", lastCanvasPointerPosRef.current.x, lastCanvasPointerPosRef.current.y)}>
                    <Type aria-hidden="true" className="opacity-80" />
                    新建文本
                    <ContextMenuShortcut>T</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={() => void handlePasteAtContextPos()}>
                    <ClipboardPaste aria-hidden="true" className="opacity-80" />
                    粘贴到此处
                    <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={() => setZoom(1)}>
                    <Maximize2 aria-hidden="true" className="opacity-80" />
                    重置缩放 (100%)
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuPopup>
          </ContextMenu>
        </div>

        <RightPanel
          element={selected}
          selectedElements={selectedElements}
          parent={selected?.parentId ? allElementsFlat.find((e: EditorElement) => e.id === selected.parentId) ?? null : null}
          pages={pages}
          onUpdate={updateElement}
          onBatchUpdate={commitBatchUpdateElements}
          onDelete={deleteSelected}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onDuplicate={duplicate}
          onGroup={groupSelected}
          onUngroup={ungroupSelected}
        />
      </div>
      )}

      {/* Floating toolbar */}
      {!previewing && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 select-none">
        <div className="animate-fade-up">
          <CossToolbar className="rounded-full border border-border-visible bg-surface/90 px-1.5 py-1 shadow-2xs backdrop-blur-md">
          <ToolbarGroup>
            <ToolbarButton className={toolClass("select")} onClick={() => setActiveTool("select")} title="选择 (V)">
              <MousePointer2 aria-hidden="true" className="size-3" />
              SELECT
            </ToolbarButton>
            <ToolbarButton className={toolClass("hand")} onClick={() => setActiveTool("hand")} title="抓手 (H / 空格)">
              <Hand aria-hidden="true" className="size-3" />
              HAND
            </ToolbarButton>
            <ToolbarButton className={toolClass("connector")} onClick={() => setActiveTool("connector")} title="连接线 (E)">
              <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="4" cy="5" r="2.5" fill="currentColor" />
                <path d="M 4 5 H 12 Q 16 5 16 9 V 15 Q 16 19 12 19 H 20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 17 16 L 20 19 L 17 22" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              FLOW
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarSeparator className="mx-1 h-3.5 bg-border" />
          <ToolbarGroup>
            <ToolbarButton className={toolClass("rectangle")} onClick={() => setActiveTool("rectangle")} title="矩形 (R)">
              <Square aria-hidden="true" className="size-3" />
              RECT
            </ToolbarButton>
            <ToolbarButton className={toolClass("text")} onClick={() => setActiveTool("text")} title="文字 (T)">
              <Type aria-hidden="true" className="size-3" />
              TEXT
            </ToolbarButton>
          </ToolbarGroup>
          </CossToolbar>
        </div>
      </div>
      )}
    </div>
    );

  if (!isTauri) {
    return <div className="h-svh overflow-hidden bg-background text-foreground">{content}</div>;
  }

  const framed = !windowMaximized && !windowFullscreen;

  return (
    <div className={cn("h-svh bg-background text-foreground", framed && "p-1.5")}>
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden bg-surface text-foreground border border-border",
          framed && "rounded-lg shadow-2xs",
        )}
      >
        <TitleBar
          maximized={windowMaximized}
          onMinimize={() => windowControls("minimize")}
          onMaximize={() => windowControls("maximize")}
          onClose={() => windowControls("close")}
        />
        <div className={cn("flex min-h-0 flex-1 overflow-hidden bg-background", framed && "mx-1 mb-1 rounded-md")}>
          {content}
        </div>
      </div>
    </div>
  );
}
