"use client";

import { useState, useCallback, useRef, useEffect, useMemo, useSyncExternalStore } from "react";
import type { EditorElement, ComponentType, Page } from "./types";
import { Canvas, type CanvasHandle } from "./canvas/index";
import { TopBar } from "./top-bar";
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
  Copy, CopyPlus, Scissors, Trash2, Lock, Unlock, EyeOff, Square, Maximize2, ClipboardPaste,
  MousePointer2, Hand, Type, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine,
  Boxes, Ungroup, X,
  WandSparkles,
} from "lucide-react";
import {
  Toolbar as CossToolbar,
  ToolbarGroup,
  ToolbarButton,
  ToolbarSeparator,
} from "@bluepen/editor/components/ui/toolbar";
import { useKeyboard } from "./hooks/use-keyboard";
import { library, type LibraryComponent } from "./library/index";
import { groupElements, ungroupElements, canGroupElements, canUngroupElements } from "./utils/grouping";
import { isBlockTemplate, createBlockTemplateGroup } from "./library/block-templates";
import { confirmLocal } from "./hooks/use-desktop";
import { showToast, useEditorNotice, dismissEditorNotice } from "./hooks/use-toast";
import { loadProjectLocal, saveProjectLocal, loadSettingsLocal, saveSettingsLocal } from "./hooks/local-store";
import { processImageFile, extractImageFromClipboardData, dataUrlToBlob } from "./utils/image";
import {
  BLUEPEN_CLIPBOARD_MIME,
  serializeElementsForClipboard,
  parseElementsFromClipboard,
  cloneElementsForPaste,
  getTopLevelSelectedElements,
  setInternalClipboard,
  getInternalClipboard,
  isEditableTarget,
} from "./utils/clipboard";
import { patchElements } from "./utils/element-updates";
import { createHistory, appendHistory, moveHistory, type EditHistory } from "./utils/history";
import { Button } from "@bluepen/editor/components/ui/button";
import { libraryModes, type LibraryMode } from "./library/catalog";
import { cn } from "@bluepen/editor/lib/utils";
import { AgentPanel } from "./agent/agent-panel";
import type { PrototypePlan } from "./agent/prototype-plan";
import { AgentController } from "./agent/agent-controller";
import { agentStorage } from "./agent/agent-storage";
import { runAgent } from "./agent/agent-runtime";
import { AgentSettingsPage } from "./agent/agent-settings-page";
import { prepareAgentArtifact } from "./agent/agent-canvas";
import type { AgentContext, AppliedArtifact, AgentReference } from "./agent/agent-types";
import { agentPreviewElements, agentReceiptState, canvasReferences, captureAgentContext, createAgentReceipt, indexAgentNodes, prepareAgentChanges, projectAgentElements, undoAgentReceipt } from './agent/agent-document';
import { planToElement } from './agent/prototype-plan';
import { combineBounds } from './utils/viewport';
import { getLayoutElements } from './utils/layout-elements';
import { projectIdentity } from "./utils/project-identity";

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
  const notice = useEditorNotice();
  const [pages, setPages] = useState<Page[]>(defaultPages);
  const [activePageId, setActivePageId] = useState("page-1");
  const pageHistoriesRef = useRef(new Map<string, EditHistory<EditorElement[]>>());
  const [, refreshHistory] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<string>("select");
  const [contextTarget, setContextTarget] = useState<"element" | "canvas">("canvas");
  const [contextElementId, setContextElementId] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const canvasApiRef = useRef<CanvasHandle>(null);
  const pagePansRef = useRef(new Map<string, { x: number; y: number }>());
  const pageZoomsRef = useRef(new Map<string, number>());
  const rememberPan = useCallback((pan: { x: number; y: number }) => {
    pagePansRef.current.set(activePageId, pan);
    pageZoomsRef.current.set(activePageId, zoom);
  }, [activePageId, zoom]);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0] || null;
  const elements = activePage?.elements ?? [];
  const history = pageHistoriesRef.current.get(activePageId) ?? createHistory(elements);
  const historyIndex = history.index;
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
  const [projectId, setProjectId] = useState(() => genId());
  const [projectName, setProjectName] = useState("Untitled");
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "pending" | "saving" | "error">("loading");
  const [saveRetry, setSaveRetry] = useState(0);
  const [manualSaving, setManualSaving] = useState(false);
  const manualSavingRef = useRef(false);
  // Each project owns its binding, including when an older write finishes after switching.
  const fileBindingRef = useRef<{ path: string | null }>({ path: null });
  const autosaveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const currentProjectRef = useRef({ pages, name: projectName });
  currentProjectRef.current = { pages, name: projectName };
  const [libraryTab, setLibraryTab] = useState<"pages" | "components" | "web" | "agent">("components");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [leftDrawerCollapsed, setLeftDrawerCollapsed] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  useEffect(() => {
    if (!agentOpen) return;
    const narrow = window.matchMedia('(max-width: 1023px)');
    const collapse = () => { if (narrow.matches) setLeftDrawerCollapsed(true); };
    collapse(); narrow.addEventListener('change', collapse);
    return () => narrow.removeEventListener('change', collapse);
  }, [agentOpen]);
  const [agentWidth, setAgentWidth] = useState(420);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agent] = useState(() => new AgentController(agentStorage, runAgent));
  const agentState = useSyncExternalStore(agent.subscribe, agent.getSnapshot, agent.getSnapshot);
  useEffect(() => { void agent.initialize(); }, [agent]);
  useEffect(() => {
    const save = () => { void agent.flush(); };
    window.addEventListener("pagehide", save);
    return () => { window.removeEventListener("pagehide", save); agent.stop(); void agent.flush(); };
  }, [agent]);
  const [agentAnchor, setAgentAnchor] = useState<{ x: number; y: number } | null>(null);

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
        setProjectId(projectIdentity(project));
        if (project.filePath) {
          setCurrentFilePath(project.filePath);
          fileBindingRef.current.path = project.filePath;
        }
        const first = uniquePages.find((page) => page.id === settings?.activePageId) ?? uniquePages[0];
        if (first) {
          setActivePageId(first.id);
          pageHistoriesRef.current.set(first.id, createHistory(first.elements));
        }
      }
      if (settings) {
        if (["pages", "components", "web", "agent"].includes(settings.libraryTab ?? "")) {
          setLibraryTab(settings.libraryTab!);
        }
        setZoom(typeof settings.zoom === "number" && Number.isFinite(settings.zoom) ? Math.max(0.1, Math.min(4, settings.zoom)) : 1);
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
      setDirty(!project?.id);
      setSaveState(project?.id ? "saved" : "pending");
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);


  // Only acknowledge the exact revision that reached durable storage.
  useEffect(() => {
    if (!hydrated || !dirty || manualSaving) return;
    let cancelled = false;
    const binding = fileBindingRef.current;
    setSaveState("pending");
    const t = setTimeout(() => {
      if (manualSavingRef.current) return;
      setSaveState("saving");
      const save = async () => {
        const path = await saveProjectLocal({
          version: 3, id: projectId, name: projectName, pages, savedAt: Date.now(),
        }, binding.path);
        if (path) binding.path = path;
        if (binding === fileBindingRef.current && path) setCurrentFilePath(path);
        if (!cancelled && binding === fileBindingRef.current && currentProjectRef.current.pages === pages && currentProjectRef.current.name === projectName) {
          setDirty(false);
          setSaveState("saved");
        }
      };
      const pending = autosaveQueueRef.current.then(save, save);
      autosaveQueueRef.current = pending.catch((error) => {
        console.error("自动保存失败:", error);
        if (!cancelled) setSaveState("error");
      });
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [pages, projectId, projectName, currentFilePath, hydrated, dirty, saveRetry, manualSaving]);

  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  // Auto-save settings (debounced)
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      void saveSettingsLocal({
        zoom,
        showGrid,
        theme,
        leftDrawerCollapsed,
        libraryTab,
        activePageId,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [zoom, showGrid, theme, leftDrawerCollapsed, libraryTab, activePageId, hydrated]);

  const latestElementsRef = useRef(elements);
  latestElementsRef.current = elements;

  const pushHistory = useCallback((next: EditorElement[]) => {
    const previous = pageHistoriesRef.current.get(activePageId) ?? createHistory(elements);
    pageHistoriesRef.current.set(activePageId, appendHistory(previous, next));
    refreshHistory((version) => version + 1);
  }, [activePageId, elements]);

  const setElements = useCallback(
    (next: EditorElement[]) => {
      if (next === latestElementsRef.current) return;
      latestElementsRef.current = next;
      setPages((prev) =>
        prev.map((p) => (p.id === activePageId ? { ...p, elements: next } : p)),
      );
      setDirty(true);
    },
    [activePageId],
  );

  const commit = useCallback(
    (next: EditorElement[]) => {
      if (next === latestElementsRef.current) return;
      setElements(next);
      pushHistory(next);
    },
    [setElements, pushHistory],
  );

  // Keep untouched branches stable so memoized canvas elements can skip renders.
  const updateElementLive = useCallback((id: string, patch: Partial<EditorElement>) => {
    setElements(patchElements(latestElementsRef.current, [{ id, patch }]));
  }, [setElements]);

  const updateElement = useCallback((id: string, patch: Partial<EditorElement>) => {
    commit(patchElements(latestElementsRef.current, [{ id, patch }]));
  }, [commit]);

  const batchUpdateElementsLive = useCallback((patches: Array<{ id: string; patch: Partial<EditorElement> }>) => {
    setElements(patchElements(latestElementsRef.current, patches));
  }, [setElements]);

  const commitBatchUpdateElements = useCallback((patches: Array<{ id: string; patch: Partial<EditorElement> }>) => {
    commit(patchElements(latestElementsRef.current, patches));
  }, [commit]);

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
      label?: string,
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
          return groupEl;
        }
      }

      const lib = library.find((c) => c.type === type);
      const el: EditorElement = {
        id: genId(),
        type,
        name: label || lib?.label || (type === "connector" ? "连接线" : type === "group" ? "组合" : type),
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
        : [...elements, el];
      commit(next);
      setSelectedId(el.id);
      setSelectedIds([el.id]);
      return el;
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
      showToast({
        type: "success",
        title: "已打散组合",
        description: `已解组释放为 ${releasedIds.length} 个独立组件`,
        id: "ungroup-success",
      });
    }
  }, [contextElementId, selectedIds, elements, commit]);

  const deleteSelected = useCallback(() => {
    const targetIds = selectedIds.length > 0 ? selectedIds : (contextElementId ? [contextElementId] : []);
    if (targetIds.length === 0) return;
    const deleteIds = new Set(targetIds);
    const filterOut = (list: EditorElement[]): EditorElement[] => {
      return list
        .filter((e) => !deleteIds.has(e.id) || e.locked)
        .map((e) => ({
          ...e,
          children: filterOut(e.children),
        }));
    };
    const next = filterOut(elements);
    commit(next);
    const remainingSelected = targetIds.filter((id) => {
      const el = allElementsFlat.find((item) => item.id === id);
      return el?.locked;
    });
    setSelectedIds(remainingSelected);
  }, [selectedIds, contextElementId, elements, allElementsFlat, commit]);

  const toggleLockSelected = useCallback(() => {
    const targetIds = selectedIds.length > 0 ? selectedIds : (contextElementId ? [contextElementId] : []);
    if (targetIds.length === 0) return;
    const targetElements = allElementsFlat.filter((e) => targetIds.includes(e.id));
    const allLocked = targetElements.length > 0 && targetElements.every((e) => e.locked);
    const nextLocked = !allLocked;
    targetIds.forEach((id) => updateElement(id, { locked: nextLocked }));
    showToast({
      title: nextLocked ? "已锁定图层" : "已解锁图层",
      description: `${targetIds.length} 个对象`,
      id: "toggle-lock",
    });
  }, [selectedIds, contextElementId, allElementsFlat, updateElement]);

  const bringToFront = useCallback(() => {
    const activeContextId = contextOpen ? contextElementId : null;
    const targetIds = activeContextId
      ? (selectedIds.includes(activeContextId) ? selectedIds : [activeContextId])
      : selectedIds;
    if (targetIds.length === 0) return;
    const selectedSet = new Set(targetIds);
    const moving = elements.filter((e) => selectedSet.has(e.id));
    const rest = elements.filter((e) => !selectedSet.has(e.id));
    commit([...rest, ...moving]);
  }, [contextOpen, contextElementId, selectedIds, elements, commit]);

  const sendToBack = useCallback(() => {
    const activeContextId = contextOpen ? contextElementId : null;
    const targetIds = activeContextId
      ? (selectedIds.includes(activeContextId) ? selectedIds : [activeContextId])
      : selectedIds;
    if (targetIds.length === 0) return;
    const selectedSet = new Set(targetIds);
    const moving = elements.filter((e) => selectedSet.has(e.id));
    const rest = elements.filter((e) => !selectedSet.has(e.id));
    commit([...moving, ...rest]);
  }, [contextOpen, contextElementId, selectedIds, elements, commit]);

  const bringForward = useCallback(() => {
    const activeContextId = contextOpen ? contextElementId : null;
    const targetId = activeContextId || selectedId;
    if (!targetId) return;
    const idx = elements.findIndex((e) => e.id === targetId);
    if (idx === -1 || idx === elements.length - 1) return;
    const next = [...elements];
    const temp = next[idx];
    next[idx] = next[idx + 1];
    next[idx + 1] = temp;
    commit(next);
  }, [contextOpen, contextElementId, selectedId, elements, commit]);

  const sendBackward = useCallback(() => {
    const activeContextId = contextOpen ? contextElementId : null;
    const targetId = activeContextId || selectedId;
    if (!targetId) return;
    const idx = elements.findIndex((e) => e.id === targetId);
    if (idx === -1 || idx === 0) return;
    const next = [...elements];
    const temp = next[idx];
    next[idx] = next[idx - 1];
    next[idx - 1] = temp;
    commit(next);
  }, [contextOpen, contextElementId, selectedId, elements, commit]);

  const pasteCountRef = useRef(0);
  const isPastingRef = useRef(false);

  useEffect(() => {
    if (isPastingRef.current) {
      isPastingRef.current = false;
      return;
    }
    pasteCountRef.current = 0;
  }, [selectedIds]);

  const copySelected = useCallback(async () => {
    const activeContextId = contextOpen ? contextElementId : null;
    const targetIds = activeContextId
      ? (selectedIds.includes(activeContextId) ? selectedIds : [activeContextId])
      : selectedIds;
    if (targetIds.length === 0) return;

    const elementsToCopy = getTopLevelSelectedElements(targetIds, latestElementsRef.current);
    if (elementsToCopy.length === 0) return;

    const serialized = serializeElementsForClipboard(elementsToCopy);
    setInternalClipboard(elementsToCopy);
    pasteCountRef.current = 0;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(serialized);
      }
    } catch {
      // Internal clipboard cache will still work if browser clipboard write is blocked
    }
  }, [contextOpen, contextElementId, selectedIds]);

  const cutSelected = useCallback(async () => {
    const activeContextId = contextOpen ? contextElementId : null;
    const targetIds = activeContextId
      ? (selectedIds.includes(activeContextId) ? selectedIds : [activeContextId])
      : selectedIds;
    if (targetIds.length === 0) return;

    const elementsToCopy = getTopLevelSelectedElements(targetIds, latestElementsRef.current);
    if (elementsToCopy.length === 0) return;

    const serialized = serializeElementsForClipboard(elementsToCopy);
    setInternalClipboard(elementsToCopy);
    pasteCountRef.current = 0;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(serialized);
      }
    } catch {
      // Internal clipboard cache will still work
    }

    deleteSelected();
  }, [contextOpen, contextElementId, selectedIds, deleteSelected]);

  const duplicate = useCallback(() => {
    const activeContextId = contextOpen ? contextElementId : null;
    const targetIds = activeContextId
      ? (selectedIds.includes(activeContextId) ? selectedIds : [activeContextId])
      : selectedIds;
    if (targetIds.length === 0) return;

    const elementsToClone = getTopLevelSelectedElements(targetIds, latestElementsRef.current);
    if (elementsToClone.length === 0) return;

    isPastingRef.current = true;
    const { clonedElements, newSelectedIds } = cloneElementsForPaste(
      elementsToClone,
      undefined,
      0,
    );

    const next = [...latestElementsRef.current, ...clonedElements];
    commit(next);
    setSelectedIds(newSelectedIds);
  }, [contextOpen, contextElementId, selectedIds, commit]);

  const stepHistory = useCallback((direction: -1 | 1) => {
    const previous = pageHistoriesRef.current.get(activePageId);
    if (!previous) return;
    const next = moveHistory(previous, direction);
    if (next === previous) return;
    pageHistoriesRef.current.set(activePageId, next);
    setElements(next.snapshots[next.index]);
    setSelectedIds([]);
  }, [activePageId, setElements]);
  const undo = useCallback(() => stepHistory(-1), [stepHistory]);
  const redo = useCallback(() => stepHistory(1), [stepHistory]);

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
      if (activeTool === "ai-generate") {
        setAgentAnchor({ x: Math.round(canvasX / 20) * 20, y: Math.round(canvasY / 20) * 20 });
        setAgentOpen(true);
        setActiveTool("select");
      }
    },
    [activeTool, addElement, elements],
  );

  const generatePrototype = useCallback((plan: PrototypePlan, target: AgentContext, messageId: string): AppliedArtifact => {
    const before = latestElementsRef.current;
    const result = prepareAgentArtifact(plan, target, { projectId, pageId: activePageId, elements: latestElementsRef.current }, messageId);
    commit(result.elements);
    setSelectedIds([result.element.id]);
    setAgentAnchor(null);
    requestAnimationFrame(() => canvasApiRef.current?.focusBounds(result.element));
    return { pageId: activePageId, elementId: result.element.id, name: plan.pageName, receipt: createAgentReceipt(before, result.elements, activePageId, messageId, plan.pageName, [result.element.id]) };
  }, [projectId, activePageId, commit]);

  const addAgentReferences = (references: AgentReference[]) => {
    try {
      let session = agent.current(projectId);
      if (!session || session.archived) session = agent.newSession(projectId);
      if (!session) throw new Error('会话正在读取，请稍后重试');
      agent.addReferences(session.id, references); setAgentOpen(true);
    } catch (error) { showToast({ title: error instanceof Error ? error.message : '无法添加对象', type: 'error' }); }
  };
  const addSelectionToAgent = (ids = selectedIds) => addAgentReferences(canvasReferences(projectId, { id: activePageId, name: activePage?.name ?? '页面', elements: latestElementsRef.current }, ids));
  const agentPage = (pageId: string) => pages.find(page => page.id === pageId);
  const pageElements = (pageId: string) => pageId === activePageId ? latestElementsRef.current : agentPage(pageId)?.elements;
  const focusAgentElements = (document: EditorElement[], ids: string[]) => {
    const selected = getLayoutElements(document).filter(node => ids.includes(node.id));
    const bounds = combineBounds(selected);
    if (bounds) requestAnimationFrame(() => canvasApiRef.current?.focusBounds(bounds));
  };
  agent.setCanvasAdapter({
    capture: context => {
      if (context.projectId !== projectId) throw new Error('请回到此会话所属的项目');
      return captureAgentContext(context, pages.map(page => page.id === activePageId ? { ...page, elements: latestElementsRef.current } : page));
    },
    apply: (changes, context, id) => {
      if (context.projectId !== projectId || context.pageId !== activePageId) throw new Error(`请先回到目标页面「${context.pageName}」再应用修改`);
      const result = prepareAgentChanges(changes, context, latestElementsRef.current, id);
      commit(result.elements);
      setSelectedIds(result.receipt.targetIds);
      focusAgentElements(result.elements, result.receipt.targetIds);
      return { pageId: activePageId, elementId: result.receipt.targetIds[0] ?? '', name: changes.summary, receipt: result.receipt };
    },
    status: artifact => {
      const document = pageElements(artifact.pageId);
      return artifact.receipt ? agentReceiptState(artifact.receipt, document) : !document ? 'unavailable' : indexAgentNodes(document).has(artifact.elementId) ? 'applied' : 'missing';
    },
    undo: artifact => {
      if (artifact.pageId !== activePageId) throw new Error('请先切换到结果所在页面再撤销');
      if (!artifact.receipt) throw new Error('此历史结果不含独立撤销记录，请使用编辑器历史撤销');
      const next = undoAgentReceipt(artifact.receipt, latestElementsRef.current);
      commit(next); setSelectedIds(selectedIds.filter(id => indexAgentNodes(next).has(id)));
    },
    preview: message => {
      if (message.context.projectId !== projectId) throw new Error('请回到原项目预览');
      if (message.plan) return { before: [], after: [planToElement(message.plan, 0, 0)] };
      const before = agentPreviewElements(message.context);
      if (message.applied?.receipt) {
        const nodes = new Map(message.context.snapshot?.nodes.map(node => [node.id, node]) ?? []);
        message.applied.receipt.nodes.forEach(delta => { if (delta.after) nodes.set(delta.id, delta.after); else nodes.delete(delta.id); });
        return { before, after: agentPreviewElements({ ...message.context, snapshot: { ...message.context.snapshot!, nodes: [...nodes.values()] } }) };
      }
      if (!message.changes) throw new Error('没有可预览的修改');
      const document = pageElements(message.context.pageId);
      if (!document) throw new Error('目标页面已删除');
      const next = prepareAgentChanges(message.changes, message.context, document, message.id);
      const ids = (message.context.references ?? []).flatMap(ref => ref.kind === 'canvas' && ref.role === 'target' ? [ref.nodeId] : []);
      return { before, after: projectAgentElements(next.elements, [...ids, ...next.receipt.targetIds]) };
    },
  });

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

  const insertTextContent = useCallback(
    (text: string, targetCanvasX?: number, targetCanvasY?: number) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const snap = (v: number) => Math.round(v / 20) * 20;

      let posX = targetCanvasX !== undefined ? targetCanvasX : lastCanvasPointerPosRef.current.x;
      let posY = targetCanvasY !== undefined ? targetCanvasY : lastCanvasPointerPosRef.current.y;

      if (targetCanvasX === undefined) {
        const offset = (elements.length % 6) * 24;
        posX = 140 + offset;
        posY = 140 + offset;
      }

      // Calculate width and height adaptively based on text
      const lines = text.split(/\r\n|\r|\n/);
      let maxLineLength = 0;
      for (const line of lines) {
        let visualLen = 0;
        for (let i = 0; i < line.length; i++) {
          visualLen += line.charCodeAt(i) > 255 ? 2 : 1;
        }
        if (visualLen > maxLineLength) {
          maxLineLength = visualLen;
        }
      }

      let width = 180;
      let height = 36;

      if (lines.length === 1) {
        width = Math.min(600, Math.max(120, maxLineLength * 8.5 + 24));
        height = 36;
      } else {
        width = Math.min(560, Math.max(180, maxLineLength * 8.5 + 28));
        height = Math.max(48, lines.length * 22 + 16);
      }

      width = Math.round(width);
      height = Math.round(height);

      let cx = snap(posX);
      let cy = snap(posY);

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
        cx = snap(posX - container.x);
        cy = snap(posY - container.y);
      }

      addElement(
        "text",
        cx,
        cy,
        parentId,
        width,
        height,
        0,
        {
          text,
          fontSize: 14,
          fontWeight: 400,
          textColor: "var(--foreground)",
          align: "left",
        },
      );
    },
    [elements, addElement],
  );

  const pasteElements = useCallback(
    async (targetCanvasX?: number, targetCanvasY?: number) => {
      const posX = targetCanvasX ?? lastCanvasPointerPosRef.current.x;
      const posY = targetCanvasY ?? lastCanvasPointerPosRef.current.y;
      const targetPos =
        targetCanvasX !== undefined && targetCanvasY !== undefined
          ? { x: targetCanvasX, y: targetCanvasY }
          : undefined;

      // 1. Try reading system clipboard items (navigator.clipboard.read) for images
      if (typeof navigator !== "undefined" && navigator.clipboard?.read) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find((t) => t.startsWith("image/"));
            if (imageType) {
              const blob = await item.getType(imageType);
              await insertImageFile(blob, posX, posY);
              return true;
            }
          }
        } catch {
          // navigator.clipboard.read() might fail or be restricted in some browsers
        }
      }

      // 2. Try reading clipboard text (navigator.clipboard.readText)
      let clipText: string | null = null;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
          clipText = await navigator.clipboard.readText();
        }
      } catch {
        // Read text denied or restricted
      }

      // 2a. Check if text is valid Bluepen serialized element JSON
      const parsedElements = parseElementsFromClipboard(clipText);
      if (parsedElements && parsedElements.length > 0) {
        isPastingRef.current = true;
        const { clonedElements, newSelectedIds } = cloneElementsForPaste(
          parsedElements,
          targetPos,
          pasteCountRef.current,
        );
        pasteCountRef.current += 1;

        const next = [...latestElementsRef.current, ...clonedElements];
        commit(next);
        setSelectedIds(newSelectedIds);
        return true;
      }

      // 2b. Check if text is a base64 image data URL
      if (clipText && clipText.trim().startsWith("data:image/")) {
        const blob = dataUrlToBlob(clipText.trim());
        if (blob) {
          await insertImageFile(blob, posX, posY);
          return true;
        }
      }

      // 2c. Check if text is non-empty plain text
      if (clipText && clipText.trim()) {
        insertTextContent(clipText, targetCanvasX, targetCanvasY);
        return true;
      }

      // 3. Fallback: Internal clipboard cache ONLY if clipboard read produced nothing or failed
      const internal = getInternalClipboard();
      if (internal && internal.length > 0) {
        isPastingRef.current = true;
        const { clonedElements, newSelectedIds } = cloneElementsForPaste(
          internal,
          targetPos,
          pasteCountRef.current,
        );
        pasteCountRef.current += 1;

        const next = [...latestElementsRef.current, ...clonedElements];
        commit(next);
        setSelectedIds(newSelectedIds);
        return true;
      }

      return false;
    },
    [commit, setSelectedIds, insertImageFile, insertTextContent],
  );

  const handlePasteAtContextPos = useCallback(async () => {
    await pasteElements(lastCanvasPointerPosRef.current.x, lastCanvasPointerPosRef.current.y);
  }, [pasteElements]);

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (selectedIds.length === 0) return;

      const elementsToCopy = getTopLevelSelectedElements(selectedIds, latestElementsRef.current);
      if (elementsToCopy.length === 0) return;

      e.preventDefault();
      const serialized = serializeElementsForClipboard(elementsToCopy);
      e.clipboardData?.setData("text/plain", serialized);
      e.clipboardData?.setData(BLUEPEN_CLIPBOARD_MIME, serialized);
      e.clipboardData?.setData("application/json", serialized);
      setInternalClipboard(elementsToCopy);
      pasteCountRef.current = 0;
    };

    const handleCut = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (selectedIds.length === 0) return;

      const elementsToCopy = getTopLevelSelectedElements(selectedIds, latestElementsRef.current);
      if (elementsToCopy.length === 0) return;

      e.preventDefault();
      const serialized = serializeElementsForClipboard(elementsToCopy);
      e.clipboardData?.setData("text/plain", serialized);
      e.clipboardData?.setData(BLUEPEN_CLIPBOARD_MIME, serialized);
      e.clipboardData?.setData("application/json", serialized);
      setInternalClipboard(elementsToCopy);
      pasteCountRef.current = 0;

      deleteSelected();
    };

    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && isEditableTarget(target)) return;

      const clipText =
        e.clipboardData?.getData(BLUEPEN_CLIPBOARD_MIME) ||
        e.clipboardData?.getData("application/json") ||
        e.clipboardData?.getData("text/plain");

      // 1. First priority: parsed Bluepen elements JSON payload
      const parsedElements = parseElementsFromClipboard(clipText);
      if (parsedElements && parsedElements.length > 0) {
        e.preventDefault();
        isPastingRef.current = true;
        const { clonedElements, newSelectedIds } = cloneElementsForPaste(
          parsedElements,
          undefined,
          pasteCountRef.current,
        );
        pasteCountRef.current += 1;

        const next = [...latestElementsRef.current, ...clonedElements];
        commit(next);
        setSelectedIds(newSelectedIds);
        return;
      }

      // 2. Second priority: System clipboard images (screenshots, files, clipboard items, HTML data URLs)
      const imageFile = extractImageFromClipboardData(e.clipboardData);
      if (imageFile) {
        e.preventDefault();
        await insertImageFile(imageFile);
        return;
      }

      // 3. Third priority: Data URL image pasted as text
      if (clipText && clipText.trim().startsWith("data:image/")) {
        const blob = dataUrlToBlob(clipText.trim());
        if (blob) {
          e.preventDefault();
          await insertImageFile(blob);
          return;
        }
      }

      // 4. Fourth priority: Plain text content
      const textData = e.clipboardData?.getData("text/plain");
      if (textData && textData.trim()) {
        e.preventDefault();
        insertTextContent(textData);
        return;
      }

      // 5. Fallback: Internal clipboard cache ONLY if clipboard had no external data
      const internal = getInternalClipboard();
      if (internal && internal.length > 0 && (!clipText || !clipText.trim())) {
        e.preventDefault();
        isPastingRef.current = true;
        const { clonedElements, newSelectedIds } = cloneElementsForPaste(
          internal,
          undefined,
          pasteCountRef.current,
        );
        pasteCountRef.current += 1;

        const next = [...latestElementsRef.current, ...clonedElements];
        commit(next);
        setSelectedIds(newSelectedIds);
        return;
      }
    };

    window.addEventListener("copy", handleCopy);
    window.addEventListener("cut", handleCut);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("cut", handleCut);
      window.removeEventListener("paste", handlePaste);
    };
  }, [selectedIds, deleteSelected, commit, setSelectedId, setSelectedIds, insertImageFile, insertTextContent]);

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
    "Ctrl+C": copySelected,
    "Ctrl+X": cutSelected,
    "Ctrl+V": () => void pasteElements(),
    "Delete": deleteSelected,
    "Backspace": deleteSelected,
    "Ctrl+D": duplicate,
    "Ctrl+Shift+L": toggleLockSelected,
    "Ctrl+L": toggleLockSelected,
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
        showToast({ title: "编辑模式", id: "exit-preview" });
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
  }, !previewing);

  const handleSidebarAdd = useCallback((asset: ComponentType | LibraryComponent) => {
    const item = typeof asset === "string" ? library.find((candidate) => candidate.type === asset) : asset;
    if (!item) return;
    const nodes = latestElementsRef.current;
    const parent = nodes.find((element) => element.id === selectedId && !element.locked && element.visible &&
      (element.type === "mobile-frame" || element.type === "browser-frame"));
    const viewport = canvasApiRef.current?.getViewport();
    const offset = (nodes.length % 6) * 20;
    let x = viewport ? viewport.x + (viewport.width - item.defaultWidth) / 2 + offset : 120;
    let y = viewport ? viewport.y + (viewport.height - item.defaultHeight) / 2 + offset : 120;
    const template = isBlockTemplate(item.type);
    if (template && nodes.some((element) => element.visible && x < element.x + element.width && x + item.defaultWidth > element.x && y < element.y + element.height && y + item.defaultHeight > element.y)) {
      x = Math.max(...nodes.filter((element) => element.visible).map((element) => element.x + element.width)) + 80;
    }
    const container = template ? null : parent;
    if (container) {
      x = 24 + (container.children.length % 5) * 24;
      y = 24 + (container.children.length % 5) * 24;
    }
    const inserted = addElement(item.type, Math.round(x / 20) * 20, Math.round(y / 20) * 20,
      container?.id ?? null, item.defaultWidth, item.defaultHeight, 0, item.defaultProps, item.label);
    if (inserted && !container && (template || (viewport && (inserted.width > viewport.width || inserted.height > viewport.height)))) {
      canvasApiRef.current?.focusBounds(inserted);
    }
    setActiveTool("select");
  }, [addElement, selectedId]);

  const handlePageSelect = useCallback(
    (id: string) => {
      setZoom(pageZoomsRef.current.get(id) ?? 1);
      setActivePageId(id);
      const page = pages.find((p) => p.id === id);
      if (page) {
        if (!pageHistoriesRef.current.has(id)) {
          pageHistoriesRef.current.set(id, createHistory(page.elements));
        }
        setSelectedId(null);
      }
    },
    [pages],
  );

  const handlePageAdd = useCallback(() => {
    const newPage: Page = { id: genId(), name: `Page ${pages.length + 1}`, elements: [] };
    setPages((prev) => [...prev, newPage]);
    setZoom(1);
    setActivePageId(newPage.id);
    pageHistoriesRef.current.set(newPage.id, createHistory(newPage.elements));
    setSelectedId(null);
    setDirty(true);
  }, [pages.length]);

  const handlePageDelete = useCallback(
    (id: string) => {
      if (pages.length <= 1) return;
      const next = pages.filter((p) => p.id !== id);
      pageHistoriesRef.current.delete(id);
      pagePansRef.current.delete(id);
      pageZoomsRef.current.delete(id);
      setPages(next);
      if (activePageId === id) {
        const first = next[0];
        setActivePageId(first ? first.id : "");
        setZoom(first ? pageZoomsRef.current.get(first.id) ?? 1 : 1);
        setSelectedId(null);
      }
      setDirty(true);
    },
    [pages, activePageId],
  );

  const getProject = useCallback(
    () => ({ id: projectId, pages, name: projectName }),
    [projectId, pages, projectName],
  );

  const loadProject = useCallback(
    (data: { id?: string; pages: Page[]; name: string; filePath?: string | null }) => {
      const initialPages = data.pages && data.pages.length > 0
        ? data.pages
        : [{ id: genId(), name: "Page 1", elements: [] }];
      const loadedPages = ensureUniqueIds(initialPages);
      setPages(loadedPages);
      setProjectName(data.name || "Untitled");
      setProjectId(projectIdentity(data));
      setAgentAnchor(null);
      setCurrentFilePath(data.filePath ?? null);
      fileBindingRef.current = { path: data.filePath ?? null };
      pageHistoriesRef.current.clear();
      pagePansRef.current.clear();
      pageZoomsRef.current.clear();
      setZoom(1);
      setPreviewing(false);
      setActiveTool("select");
      setActivePageId(loadedPages[0].id);
      pageHistoriesRef.current.set(loadedPages[0].id, createHistory(loadedPages[0].elements));
      setSaveState("pending");
      setSelectedId(null);
      setSelectedIds([]);
      setDirty(true);
    },
    [],
  );

  const handleLoadTemplate = useCallback(() => {
    void confirmLocal("Replace the current project with the example template?").then(
      (ok) => {
        if (ok) {
          loadProject({ id: projectId, pages: templatePages, name: projectName, filePath: currentFilePath });
          showToast({
            type: "success",
            title: "Template inserted",
            description: "Landing Page & Dashboard",
            id: "template",
          });
        }
      },
    );
  }, [loadProject, projectId, projectName, currentFilePath]);

  const {
    isTauri,
    isMac,
    isWindows,
    fileApi,
    toggleFullscreen,
    windowControls,
    windowMaximized,
    windowFullscreen,
  } = useDesktop(getProject, loadProject, async () => {
    if (dirty && !(await confirmLocal("当前修改尚未保存成功。关闭客户端将丢失这些修改，仍要关闭吗？"))) return false;
    agent.stop();
    await agent.flush();
    if (agent.getSnapshot().saveError && !(await confirmLocal("会话尚未保存成功。仍要关闭客户端吗？"))) return false;
    return true;
  });

  const saveDesktopFile = useCallback(async (saveAs: boolean) => {
    if (!fileApi || manualSavingRef.current) return;
    manualSavingRef.current = true;
    setManualSaving(true);
    const binding = fileBindingRef.current;
    try {
      // Finish previous writes before choosing a new destination; resume autosave afterwards.
      await autosaveQueueRef.current;
      const result = saveAs ? await fileApi.saveFileAs() : await fileApi.saveFile(binding.path);
      if (!result.ok || !result.path || binding !== fileBindingRef.current) return;
      fileBindingRef.current = { path: result.path };
      setCurrentFilePath(result.path);
      const name = result.path.split(/[\\/]/).pop()?.replace(/\.(bluepen|json)$/, "") || projectName;
      setProjectName(name);
      const matches = result.project?.pages === currentProjectRef.current.pages &&
        result.project?.name === currentProjectRef.current.name && result.project?.name === name;
      setDirty(!matches);
      setSaveState(matches ? "saved" : "pending");
      showToast({ type: "success", title: saveAs ? "项目已另存为" : "项目已保存", description: name, id: "save-file" });
    } finally {
      manualSavingRef.current = false;
      setManualSaving(false);
    }
  }, [fileApi, projectName]);

  const handleSaveShortcut = useCallback(async () => {
    if (isTauri) {
      await saveDesktopFile(false);
      return;
    }
    const blob = new Blob([JSON.stringify({ ...getProject(), version: 3, savedAt: Date.now() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName || "Untitled"}.bluepen`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: "success", title: "项目副本已下载", id: "save-file" });
  }, [isTauri, saveDesktopFile, getProject, projectName]);

  const handleSaveAsShortcut = useCallback(async () => {
    if (isTauri) await saveDesktopFile(true);
    else await handleSaveShortcut();
  }, [isTauri, saveDesktopFile, handleSaveShortcut]);

  const handleNewShortcut = useCallback(async () => {
    if (dirty) {
      const ok = await confirmLocal("当前修改尚未保存成功。仍要新建项目吗？");
      if (!ok) return;
    }
    loadProject({
      id: genId(),
      pages: [{ id: genId(), name: "Page 1", elements: [] }],
      name: "Untitled",
      filePath: null,
    });
    showToast({ title: "已新建项目", id: "new-project" });
  }, [dirty, loadProject]);

  const handleOpenShortcut = useCallback(async () => {
    if (dirty) {
      const ok = await confirmLocal("当前修改尚未保存成功。仍要打开其他项目吗？");
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
            showToast({ type: "error", title: "项目文件格式无效", id: "open-file-invalid" });
            return;
          }
          const baseName = file.name.replace(/\.(bluepen|json)$/, "") || "Untitled";
          loadProject({
            id: data.id,
            pages: data.pages,
            name: data.name ?? baseName,
            filePath: null,
          });
          showToast({ type: "success", title: "项目已打开", description: baseName, id: "open-file" });
        } catch (err) {
          console.error("Failed to parse project file:", err);
          showToast({ type: "error", title: "无法解析项目文件", id: "open-file-error" });
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
              id: data.id,
              pages: data.pages,
              name: data.name ?? baseName,
              filePath: null,
            });
            showToast({ type: "success", title: "项目已打开", description: baseName, id: "open-file" });
            return;
          }
        } catch (err) {
          console.error("Failed to parse dropped project:", err);
          showToast({ type: "error", title: "无法解析项目文件", id: "open-file-error" });
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
        showToast({ type: "error", title: "图片导出失败", id: "export-error" });
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
    showToast({ type: "success", title: "图片已导出", description: `${baseName}.png`, id: "export-png" });
  }, [elements, isTauri, projectName]);

  useKeyboard({
    "Ctrl+S": handleSaveShortcut,
    "Ctrl+Shift+S": handleSaveAsShortcut,
    "Ctrl+O": handleOpenShortcut,
    "Ctrl+N": handleNewShortcut,
    "Ctrl+B": toggleLeftDrawer,
    "Shift+1": () => canvasApiRef.current?.fitContent(),
    "Shift+2": () => canvasApiRef.current?.fitContent(true),
    "Escape": () => { setPreviewing(false); setSelectedIds([]); setActiveTool("select"); },
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
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-background text-foreground">
      <TopBar
        projectName={projectName}
        dirty={dirty}
        saveState={saveState}
        onRetrySave={() => setSaveRetry((attempt) => attempt + 1)}
        zoom={zoom}
        showGrid={showGrid}
        hasContent={elements.some((element) => element.visible)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.snapshots.length - 1}
        activeTool={activeTool}
        previewing={previewing}
        demo={!isTauri}
        theme={theme}
        isTauri={isTauri}
        isMac={isMac}
        fullscreen={windowFullscreen}
        maximized={windowMaximized}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAgent={() => setAgentOpen(v => !v)}
        agentActive={!!agentState.activeRun}
        agentOpen={agentOpen}
        onUndo={undo}
        onRedo={redo}
        onSelectTool={() => setActiveTool("select")}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onZoomIn={() => setZoom((z) => Math.min(4, z + 0.1))}
        onZoomOut={() => setZoom((z) => Math.max(0.1, z - 0.1))}
        onZoomTo={(z) => setZoom(Math.min(4, Math.max(0.1, z)))}
        onFitContent={() => canvasApiRef.current?.fitContent()}
        onFitSelection={() => canvasApiRef.current?.fitContent(true)}
        onSave={handleSaveShortcut}
        onNew={handleNewShortcut}
        onOpen={handleOpenShortcut}
        onTemplate={handleLoadTemplate}
        onPreview={() => {
          const next = !previewing;
          setPreviewing(next);
          setSelectedId(null);
          showToast({ title: next ? "原型预览" : "编辑模式", id: "preview-toggle" });
        }}
        onExport={() => void exportPng()}
        onMinimize={() => windowControls("minimize")}
        onMaximize={() => windowControls("maximize")}
        onClose={() => windowControls("close")}
      />

      {previewing ? (
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">
          <Canvas
            ref={canvasApiRef}
            key={activePageId}
            initialPan={pagePansRef.current.get(activePageId)}
            onPanChange={rememberPan}
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
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">
          <div className={agentOpen ? "contents [&_[data-library-shell]]:max-lg:w-12" : "contents"}><LeftSidebar
            pages={pages}
            activeTab={libraryTab}
            onTabChange={setLibraryTab}
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
            onAddSelectionToAgent={() => addSelectionToAgent()}
            onReferenceAsset={item => addAgentReferences([{ kind: 'catalog', role: 'reference', id: `catalog:${item.type}`, componentType: item.type, name: item.label }])}
            drawerCollapsed={leftDrawerCollapsed}
            onToggleDrawer={toggleLeftDrawer}
          /></div>

        <div className="relative flex flex-1 min-w-0 overflow-hidden">
          {selectedIds.length > 0 && <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-32px)] flex-wrap items-center gap-2 rounded-lg border border-border-visible bg-surface px-3 py-2" aria-label="选区操作">
            <span className="font-mono text-[11px] text-muted-foreground">{selectedIds.length} 项已选</span>
            <Button variant="ghost" size="xs" onClick={() => addSelectionToAgent()}><WandSparkles className="size-3.5" />添加到会话</Button>
            {agentOpen && <Button variant="ghost" size="xs" onClick={() => setAgentOpen(false)}>查看属性</Button>}
          </div>}
          <ContextMenu
            open={contextOpen}
            onOpenChange={(open) => {
              setContextOpen(open);
              if (!open) {
                setContextElementId(null);
                setContextTarget("canvas");
              }
            }}
          >
            <ContextMenuTrigger className="flex flex-1 min-w-0 overflow-hidden" onContextMenu={handleContextMenu}>
              <Canvas
                ref={canvasApiRef}
                key={activePageId}
                initialPan={pagePansRef.current.get(activePageId)}
                onPanChange={rememberPan}
                emptyContent={
                  <div className="max-w-md space-y-4 text-left">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">BLUEPEN / 开始绘制</span>
                    <h1 className="text-2xl font-medium">从一个想法开始</h1>
                    <p className="text-xs leading-relaxed text-muted-foreground">选择基础组件自由绘制，或从 Web、Agent 客户端模板开始。</p>
                    <div className="pointer-events-auto flex flex-wrap gap-2">
                      {(Object.keys(libraryModes) as LibraryMode[]).map((mode) => (
                        <Button key={mode} variant={libraryTab === mode ? "default" : "outline"} className="rounded-full font-mono" onMouseDown={(event) => event.stopPropagation()} onClick={(event) => {
                          event.stopPropagation();
                          setLibraryTab(mode);
                          setLeftDrawerCollapsed(false);
                        }}>{libraryModes[mode].label}</Button>
                      ))}
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">R 矩形 · T 文字 · 空格拖动画布</p>
                  </div>
                }
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
                onCanvasPointerMove={(pos) => {
                  lastCanvasPointerPosRef.current = pos;
                }}
                onContextMenu={(_e, pos) => {
                  lastCanvasPointerPosRef.current = pos;
                }}
                onDropAsset={(type, x, y, customProps, width, height, label) =>
                  addElement(type, x, y, null, width, height, 0, customProps, label)
                }
                onDropFile={(file, x, y) => void handleDropFile(file, x, y)}
              />
            </ContextMenuTrigger>
            <ContextMenuPopup>
              {contextTarget === "element" && ((contextElementId && allElementsFlat.some((e: EditorElement) => e.id === contextElementId)) || selectedIds.length > 0) ? (
                <>
                  <ContextMenuItem closeOnClick onClick={() => addSelectionToAgent(selectedIds.length ? selectedIds : contextElementId ? [contextElementId] : [])}><WandSparkles />添加到 AI 会话</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={cutSelected}>
                    <Scissors aria-hidden="true" className="opacity-80" />
                    剪切
                    <ContextMenuShortcut>{isMac ? "⌘X" : "Ctrl+X"}</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={copySelected}>
                    <Copy aria-hidden="true" className="opacity-80" />
                    复制
                    <ContextMenuShortcut>{isMac ? "⌘C" : "Ctrl+C"}</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={() => void handlePasteAtContextPos()}>
                    <ClipboardPaste aria-hidden="true" className="opacity-80" />
                    粘贴
                    <ContextMenuShortcut>{isMac ? "⌘V" : "Ctrl+V"}</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={duplicate}>
                    <CopyPlus aria-hidden="true" className="opacity-80" />
                    克隆
                    <ContextMenuShortcut>{isMac ? "⌘D" : "Ctrl+D"}</ContextMenuShortcut>
                  </ContextMenuItem>
                  {canGroupElements(selectedIds, elements) && (
                    <ContextMenuItem closeOnClick onClick={groupSelected}>
                      <Boxes aria-hidden="true" className="opacity-80" />
                      组合
                      <ContextMenuShortcut>{isMac ? "⌘G" : "Ctrl+G"}</ContextMenuShortcut>
                    </ContextMenuItem>
                  )}
                  {canUngroupElements(contextElementId ? [contextElementId] : selectedIds, elements) && (
                    <ContextMenuItem closeOnClick onClick={ungroupSelected}>
                      <Ungroup aria-hidden="true" className="opacity-80" />
                      打散
                      <ContextMenuShortcut>{isMac ? "⌘⇧G" : "Ctrl+Shift+G"}</ContextMenuShortcut>
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={bringForward}>
                    <ArrowUp aria-hidden="true" className="opacity-80" />
                    上移一层
                    <ContextMenuShortcut>{isMac ? "⌘]" : "Ctrl+]"}</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={sendBackward}>
                    <ArrowDown aria-hidden="true" className="opacity-80" />
                    下移一层
                    <ContextMenuShortcut>{isMac ? "⌘[" : "Ctrl+["}</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={bringToFront}>
                    <ArrowUpToLine aria-hidden="true" className="opacity-80" />
                    置于顶层
                    <ContextMenuShortcut>{isMac ? "⌘⇧]" : "Ctrl+Shift+]"}</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem closeOnClick onClick={sendToBack}>
                    <ArrowDownToLine aria-hidden="true" className="opacity-80" />
                    置于底层
                    <ContextMenuShortcut>{isMac ? "⌘⇧[" : "Ctrl+Shift+["}</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem closeOnClick onClick={deleteSelected} variant="destructive">
                    <Trash2 aria-hidden="true" className="opacity-80" />
                    删除
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  {(() => {
                    const ids = selectedIds.length > 0 ? selectedIds : (contextElementId ? [contextElementId] : []);
                    const targetElements = allElementsFlat.filter((e) => ids.includes(e.id));
                    const isTargetLocked = targetElements.length > 0 && targetElements.every((e) => e.locked);
                    return isTargetLocked ? (
                      <ContextMenuItem
                        closeOnClick
                        onClick={() => {
                          ids.forEach((id) => updateElement(id, { locked: false }));
                        }}
                      >
                        <Unlock aria-hidden="true" className="opacity-80" />
                        解锁
                        <ContextMenuShortcut>{isMac ? "⌘⇧L" : "Ctrl+Shift+L"}</ContextMenuShortcut>
                      </ContextMenuItem>
                    ) : (
                      <ContextMenuItem
                        closeOnClick
                        onClick={() => {
                          ids.forEach((id) => updateElement(id, { locked: true }));
                        }}
                      >
                        <Lock aria-hidden="true" className="opacity-80" />
                        锁定
                        <ContextMenuShortcut>{isMac ? "⌘⇧L" : "Ctrl+Shift+L"}</ContextMenuShortcut>
                      </ContextMenuItem>
                    );
                  })()}
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
                  <ContextMenuItem closeOnClick onClick={() => { setAgentAnchor({ ...lastCanvasPointerPosRef.current }); setAgentOpen(true); }}>
                    <WandSparkles aria-hidden="true" />在此处用 AI 生成
                  </ContextMenuItem>
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
                    <ContextMenuShortcut>{isMac ? "⌘V" : "Ctrl+V"}</ContextMenuShortcut>
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

        {!agentOpen && <RightPanel
          element={selected}
          selectedElements={selectedElements}
          allElements={allElementsFlat}
          onSelect={setSelectedId}
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
        />}
        <AgentPanel
          open={agentOpen} controller={agent} projectId={projectId}
          context={{ projectId, pageId: activePageId, pageName: activePage?.name ?? "页面", ...(agentAnchor ? { anchor: agentAnchor } : {}) }}
          width={agentWidth} onWidthChange={setAgentWidth}
          pages={pages} selectedIds={selectedIds} onAddSelection={() => addSelectionToAgent()}
          onClose={() => setAgentOpen(false)} onSettings={() => setSettingsOpen(true)} onGenerate={generatePrototype}
          onLocate={(target) => {
            const page = pages.find(page => page.id === target.pageId);
            if (!page) throw new Error("目标页面已删除");
            if (target.elementId && !indexAgentNodes(page.elements).has(target.elementId)) throw new Error("对象已被撤销或删除");
            handlePageSelect(page.id);
            setSelectedIds(target.elementId ? [target.elementId] : []);
            focusAgentElements(page.elements, target.elementId ? [target.elementId] : page.elements.map(node => node.id));
          }}
        />
      </div>
      )}

      <footer className="flex h-7 shrink-0 items-center justify-between gap-4 border-t border-border bg-surface px-3 text-[11px]">
        <span className="truncate font-mono uppercase tracking-wider text-muted-foreground">{activePage?.name} · {allElementsFlat.length} 个图层</span>
        {notice ? (
          <div className="flex min-w-0 items-center gap-2" role={notice.type === "error" ? "alert" : "status"}>
            <span className={cn("truncate", notice.type === "error" ? "text-destructive" : "text-muted-foreground")}>[{notice.title}]{notice.description ? ` ${notice.description}` : ""}</span>
            <Button variant="ghost" size="icon-xs" aria-label="关闭状态消息" onClick={dismissEditorNotice}><X aria-hidden="true" /></Button>
          </div>
        ) : previewing ? <span className="truncate text-muted-foreground">原型预览 · Esc 返回编辑</span> : null}
      </footer>

      {/* Floating toolbar */}
      {!previewing && (
        <div className="fixed bottom-12 left-1/2 z-30 max-w-[calc(100vw-32px)] -translate-x-1/2 select-none" style={agentOpen ? { left: `calc(max(64px, (100% - ${agentWidth}px)) / 2)`, maxWidth: `max(64px, calc(100vw - ${agentWidth}px - 24px))` } : undefined}>
        <div className="animate-fade-up">
          <CossToolbar className="max-w-full overflow-x-auto rounded-full border border-border-visible bg-surface px-1.5 py-1 [&_[data-slot=toolbar-group]]:shrink-0">
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
            <ToolbarButton className={toolClass("ai-generate")} onClick={() => { setAgentAnchor(null); setAgentOpen(v => !v); }} title="打开 AI 助手">
              <WandSparkles aria-hidden="true" className="size-3" />
              AI
            </ToolbarButton>
          </ToolbarGroup>
          </CossToolbar>
        </div>
      </div>
      )}
      <AgentSettingsPage open={settingsOpen} onClose={() => setSettingsOpen(false)} controller={agent} />
    </div>
    );

  return <div className="h-svh w-full overflow-hidden bg-background text-foreground">{hydrated ? content : <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground" role="status">[正在恢复本地项目…]</div>}</div>;
}
