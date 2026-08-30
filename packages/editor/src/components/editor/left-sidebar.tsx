"use client";

import { useState } from "react";
import { cn } from "@bluepen/editor/lib/utils";
import { Button } from "@bluepen/editor/components/ui/button";
import {
  Layers,
  Box,
  Bookmark,
  Smile,
  Image as ImageIcon,
  Compass,
  PlusSquare,
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  MoreHorizontal,
  Clock,
  LayoutGrid,
  ListFilter,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Zap,
  MousePointerClick,
  Grid2X2,
  Columns,
  MapPin,
  PanelBottomOpen,
  Maximize2,
  GitBranch,
  BookOpen,
  Braces,
  Sparkles,
  AlignLeft,
  ChevronsUpDown,
  Upload,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  ListOrdered,
  CalendarDays,
  Menu,
  PanelTop,
  Columns3,
  ChevronsRight,
  Route,
  Smartphone,
  Layout,
  Badge,
  Tag,
  User,
  AlertTriangle,
  TrendingUp,
  Gauge,
  PackageOpen,
  X,
  Sliders,
  Settings,
  Heart,
  Star,
  Bell,
  Mail,
  Home,
  Check,
} from "lucide-react";
import type { ComponentType, EditorElement, Page } from "./types";
import { library, type LibraryComponent } from "./library/index";

interface LeftSidebarProps {
  pages: Page[];
  activePageId: string;
  onPageSelect: (id: string) => void;
  onPageAdd: () => void;
  onPageDelete: (id: string) => void;
  elements: EditorElement[];
  selectedId: string | null;
  selectedIds?: string[];
  activeTool?: string;
  onSelectTool?: (tool: string) => void;
  onSelect: (id: string) => void;
  onSelectIds?: (ids: string[]) => void;
  onUpdateElement: (id: string, patch: Partial<EditorElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddAsset: (type: ComponentType) => void;
}

// Map component icons to visual miniature previews
function ComponentMiniPreview({ type, icon }: { type: ComponentType; icon: string }) {
  switch (type) {
    case "text":
      return (
        <div className="flex flex-col items-center justify-center text-neutral-700">
          <div className="flex items-center gap-0.5 text-[11px] font-semibold text-neutral-800">
            <span>Text</span>
            <ChevronDown className="size-2 text-neutral-400" />
          </div>
        </div>
      );
    case "rectangle":
      return <div className="size-5.5 rounded-xs border-2 border-neutral-600 bg-white" />;
    case "circle":
      return <div className="size-5.5 rounded-full border-2 border-neutral-600 bg-white" />;
    case "line":
      return <div className="h-0.5 w-6 rotate-[-25deg] bg-neutral-700" />;
    case "arrow":
      return (
        <div className="flex items-center">
          <div className="h-0.5 w-4.5 bg-neutral-700" />
          <div className="size-0 border-y-3 border-l-5 border-y-transparent border-l-neutral-700" />
        </div>
      );
    case "image":
      return (
        <div className="flex size-6 items-center justify-center rounded-xs border border-neutral-400 bg-neutral-100">
          <ImageIcon className="size-3.5 text-neutral-500" />
        </div>
      );
    case "hotspot":
      return (
        <div className="flex size-6 items-center justify-center rounded-xs border-2 border-dashed border-blue-500 bg-blue-50/70">
          <Zap className="size-3.5 fill-blue-500 text-blue-500" />
        </div>
      );
    case "button":
      return (
        <div className="rounded-xs border border-blue-500 px-1 py-0.5 text-[8px] font-bold text-blue-600">
          Btn
        </div>
      );
    case "button-primary":
      return (
        <div className="rounded-xs bg-blue-600 px-1 py-0.5 text-[8px] font-bold text-white shadow-xs">
          Btn
        </div>
      );
    case "placeholder":
      return (
        <div className="relative flex size-6 items-center justify-center border border-neutral-400 bg-white">
          <svg className="absolute inset-0 size-full" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#94A3B8" strokeWidth="1" />
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="#94A3B8" strokeWidth="1" />
          </svg>
        </div>
      );
    case "table":
      return (
        <div className="grid size-6 grid-cols-2 grid-rows-2 border border-neutral-400 bg-white">
          <div className="border-r border-b border-neutral-300 bg-neutral-100" />
          <div className="border-b border-neutral-300 bg-neutral-100" />
          <div className="border-r border-neutral-300" />
          <div />
        </div>
      );
    case "sticky-note":
      return (
        <div className="flex size-5.5 flex-col rounded-xs bg-amber-200 p-0.5 shadow-xs">
          <div className="h-0.5 w-3 rounded-full bg-amber-700/60" />
          <div className="mt-0.5 h-0.5 w-2 rounded-full bg-amber-700/40" />
        </div>
      );
    case "pin-note":
      return (
        <div className="flex size-5.5 items-center justify-center rounded-full bg-amber-400 shadow-xs">
          <span className="text-[9px] font-bold text-amber-950">1</span>
        </div>
      );
    case "scroll-panel":
      return (
        <div className="relative size-6 rounded-xs border border-neutral-400 bg-white">
          <div className="absolute top-0.5 right-0.5 bottom-0.5 w-1 rounded-full bg-neutral-300" />
        </div>
      );
    case "modal-dialog":
      return (
        <div className="flex size-6 flex-col overflow-hidden rounded-xs border border-neutral-400 bg-white shadow-xs">
          <div className="h-1.5 w-full bg-neutral-200" />
          <div className="flex-1 bg-white" />
        </div>
      );
    case "mind-map":
      return <GitBranch className="size-4.5 text-blue-600" />;
    case "document":
      return <BookOpen className="size-4.5 text-neutral-600" />;
    case "code-block":
      return <Braces className="size-4.5 text-neutral-600" />;
    case "ai-component":
      return <Sparkles className="size-4.5 text-purple-600" />;
    case "input":
      return (
        <div className="flex h-3.5 w-7 items-center border border-neutral-400 bg-white px-0.5 text-[6px] text-neutral-400">
          Text |
        </div>
      );
    case "textarea":
      return (
        <div className="flex h-4 w-7 flex-col border border-neutral-400 bg-white p-0.5 text-[6px] text-neutral-400">
          Text |
        </div>
      );
    case "select":
      return (
        <div className="flex h-3.5 w-7 items-center justify-between border border-neutral-400 bg-white px-0.5 text-[6px]">
          <span className="h-0.5 w-3 bg-neutral-400" />
          <ChevronDown className="size-2 text-neutral-500" />
        </div>
      );
    case "file-upload":
      return <Upload className="size-4 text-neutral-600" />;
    case "radio":
      return (
        <div className="flex size-4 items-center justify-center rounded-full border-2 border-blue-600">
          <div className="size-1.5 rounded-full bg-blue-600" />
        </div>
      );
    case "checkbox":
      return (
        <div className="flex size-4 items-center justify-center rounded-xs bg-blue-600 text-white">
          <Check className="size-3 stroke-[3]" />
        </div>
      );
    case "switch-android":
      return (
        <div className="flex h-2.5 w-6 items-center rounded-full bg-blue-300 p-0.5">
          <div className="size-2 rounded-full bg-blue-600" />
        </div>
      );
    case "switch-ios":
      return (
        <div className="flex h-3 w-6 items-center justify-end rounded-full bg-blue-600 p-0.5">
          <div className="size-2 rounded-full bg-white" />
        </div>
      );
    case "slider":
      return (
        <div className="flex h-1 w-6 items-center rounded-full bg-neutral-300">
          <div className="size-2 rounded-full border border-blue-600 bg-white" />
        </div>
      );
    case "stepper":
      return (
        <div className="flex h-3.5 w-7 items-center justify-between border border-neutral-400 bg-white px-0.5 text-[7px] text-neutral-600">
          <span>-</span>
          <span className="font-bold">1</span>
          <span>+</span>
        </div>
      );
    case "mobile-frame":
      return <Smartphone className="size-4.5 text-neutral-700" />;
    case "browser-frame":
      return <Layout className="size-4.5 text-neutral-700" />;
    // Flowchart & Connector Mini Previews
    case "connector":
      return (
        <svg className="size-6 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="4" cy="5" r="2" fill="currentColor" />
          <path d="M 4 5 H 12 Q 16 5 16 9 V 15 Q 16 19 12 19 H 20" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 17 16 L 20 19 L 17 22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "flow-process":
      return <div className="h-4 w-6 border-1.5 border-neutral-700 bg-white rounded-xs" />;
    case "flow-decision":
      return <div className="size-4 rotate-45 border-1.5 border-neutral-700 bg-white rounded-2xs" />;
    case "flow-start-end":
      return <div className="h-3.5 w-6 rounded-full border-1.5 border-neutral-700 bg-white" />;
    case "flow-document":
      return (
        <svg className="h-4.5 w-6" viewBox="0 0 24 18" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <path d="M 1 1 H 23 V 13 Q 17.5 17 12 13 T 1 13 Z" />
        </svg>
      );
    case "flow-data":
      return (
        <svg className="h-4 w-6" viewBox="0 0 24 16" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <polygon points="5,1 23,1 19,15 1,15" />
        </svg>
      );
    case "flow-subprocess":
      return (
        <svg className="h-4 w-6" viewBox="0 0 24 16" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <rect x="1" y="1" width="22" height="14" rx="1" />
          <line x1="5" y1="1" x2="5" y2="15" />
          <line x1="19" y1="1" x2="19" y2="15" />
        </svg>
      );
    case "flow-external-data":
      return (
        <svg className="h-4.5 w-6" viewBox="0 0 24 18" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <path d="M 1 1 H 20 A 3 8 0 0 1 20 17 H 1 A 3 8 0 0 0 1 1 Z" />
        </svg>
      );
    case "flow-internal-storage":
      return (
        <svg className="h-4 w-6" viewBox="0 0 24 16" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <rect x="1" y="1" width="22" height="14" rx="1" />
          <line x1="1" y1="4" x2="23" y2="4" />
          <line x1="5" y1="1" x2="5" y2="15" />
        </svg>
      );
    case "flow-queue":
      return (
        <svg className="size-5" viewBox="0 0 20 20" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <circle cx="10" cy="10" r="8" />
          <line x1="10" y1="18" x2="18" y2="18" />
        </svg>
      );
    case "flow-database":
      return (
        <svg className="h-5 w-4.5" viewBox="0 0 18 20" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <ellipse cx="9" cy="4" rx="8" ry="3" />
          <path d="M 1 4 V 16 A 8 3 0 0 0 17 16 V 4" />
        </svg>
      );
    case "flow-manual-input":
      return (
        <svg className="h-4 w-6" viewBox="0 0 24 16" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <polygon points="1,4 23,1 23,15 1,15" />
        </svg>
      );
    case "flow-card":
      return (
        <svg className="h-4 w-6" viewBox="0 0 24 16" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <polygon points="5,1 23,1 23,15 1,15 1,5" />
        </svg>
      );
    case "flow-tape":
      return (
        <svg className="h-4.5 w-6" viewBox="0 0 24 18" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <path d="M 1 3 Q 6.5 0 12 3 T 23 3 V 15 Q 17.5 18 12 15 T 1 15 Z" />
        </svg>
      );
    case "flow-display":
      return (
        <svg className="h-4 w-6" viewBox="0 0 24 16" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <path d="M 4 1 H 18 L 23 8 L 18 15 H 4 Q 0 8 4 1 Z" />
        </svg>
      );
    case "flow-manual-op":
      return (
        <svg className="h-4 w-6" viewBox="0 0 24 16" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <polygon points="1,1 23,1 19,15 5,15" />
        </svg>
      );
    case "flow-preparation":
      return (
        <svg className="h-4 w-6" viewBox="0 0 24 16" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <polygon points="5,1 19,1 23,8 19,15 5,15 1,8" />
        </svg>
      );
    case "flow-loop-limit":
      return (
        <svg className="h-4 w-6" viewBox="0 0 24 16" fill="white" stroke="#3F3F46" strokeWidth="1.5">
          <polygon points="4,1 20,1 23,4 23,15 1,15 1,4" />
        </svg>
      );
    default:
      return <Box className="size-4 text-neutral-600" />;
  }
}

function LayerTreeItem({
  el,
  selectedId,
  selectedIds,
  onSelect,
  onSelectIds,
  onUpdateElement,
  onDeleteElement,
  depth = 0,
}: {
  el: EditorElement;
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (id: string) => void;
  onSelectIds?: (ids: string[]) => void;
  onUpdateElement: (id: string, patch: Partial<EditorElement>) => void;
  onDeleteElement: (id: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = el.children && el.children.length > 0;
  const isSelected = selectedIds && selectedIds.length > 0 ? selectedIds.includes(el.id) : selectedId === el.id;

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && onSelectIds) {
      const current = selectedIds && selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
      const next = current.includes(el.id)
        ? current.filter((id) => id !== el.id)
        : [...current, el.id];
      onSelectIds(next);
    } else {
      if (onSelectIds) {
        onSelectIds([el.id]);
      } else {
        onSelect(el.id);
      }
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex h-7 cursor-pointer items-center gap-1.5 rounded-sm pr-1.5 text-xs transition-colors",
          isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-neutral-600 hover:bg-neutral-100",
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex size-4 shrink-0 items-center justify-center rounded-sm hover:bg-accent"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}

        <span className="truncate flex-1">{el.name}</span>

        {el.locked && <Lock aria-hidden="true" className="size-3 shrink-0 text-neutral-400" />}

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className="flex size-4 items-center justify-center rounded-sm hover:bg-neutral-200"
            onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { visible: !el.visible }); }}
            aria-label={el.visible ? "隐藏" : "显示"}
          >
            {el.visible ? <Eye className="size-3 text-neutral-600" /> : <EyeOff className="size-3 text-neutral-400" />}
          </button>
          <button
            type="button"
            className="flex size-4 items-center justify-center rounded-sm hover:bg-neutral-200"
            onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { locked: !el.locked }); }}
            aria-label={el.locked ? "解锁" : "锁定"}
          >
            {el.locked ? <Lock className="size-3 text-neutral-600" /> : <Unlock className="size-3 text-neutral-400" />}
          </button>
          <button
            type="button"
            className="flex size-4 items-center justify-center rounded-sm text-neutral-400 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
            aria-label="删除"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="overflow-hidden">
          {el.children.map((child) => (
            <LayerTreeItem
              key={child.id}
              el={child}
              selectedId={selectedId}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onSelectIds={onSelectIds}
              onUpdateElement={onUpdateElement}
              onDeleteElement={onDeleteElement}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type NavTab = "pages" | "components";

export function LeftSidebar({
  pages,
  activePageId,
  onPageSelect,
  onPageAdd,
  onPageDelete,
  elements,
  selectedId,
  selectedIds,
  activeTool,
  onSelectTool,
  onSelect,
  onSelectIds,
  onUpdateElement,
  onDeleteElement,
  onAddAsset,
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<NavTab>("components");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const filteredLibrary = library.filter((item) => {
    return searchQuery === "" || item.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const allCategories = ["基础", "流程", "表单", "导航", "容器", "展示"];
  const groupedCategories = allCategories.filter((cat) =>
    filteredLibrary.some((c) => c.category === cat),
  );
  const roots = elements.filter((el) => !el.parentId || !elements.some((p) => p.id === el.parentId));

  const navItems: { id: NavTab; label: string; icon: typeof Layers }[] = [
    { id: "pages", label: "目录", icon: Layers },
    { id: "components", label: "组件", icon: Box },
  ];

  return (
    <div className="flex h-full shrink-0 select-none border-r border-neutral-200 bg-white">
      {/* 1. PRIMARY NARROW DOCK (48px) */}
      <div className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-neutral-200 bg-neutral-50/80 py-2">
        <div className="flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "group relative flex size-10 flex-col items-center justify-center rounded-lg text-neutral-600 transition-all hover:bg-neutral-200/70 active:scale-95",
                  isActive && "bg-white text-blue-600 shadow-xs font-semibold ring-1 ring-black/5",
                )}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
              >
                <Icon className={cn("size-4.5 transition-transform", isActive && "text-blue-600 scale-105")} />
                <span className={cn("mt-0.5 text-[9px] leading-none", isActive ? "font-bold text-blue-600" : "text-neutral-600")}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Settings Button */}
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
          title="更多设置"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* 2. SECONDARY DRAWER PANEL (248px) */}
      <aside className="flex w-62 flex-col overflow-hidden bg-white text-neutral-800">
        {/* ===================== TAB: COMPONENTS ===================== */}
        {activeTab === "components" && (
          <div className="flex h-full flex-col">
            {/* Search Bar */}
            <div className="border-b border-neutral-100 p-2.5">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-2.5 size-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="素材海量搜"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full rounded-md border border-neutral-200 bg-neutral-50/60 pl-8 pr-7 text-xs text-neutral-800 placeholder-neutral-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Component Groups & 3-Column Grid */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
              {groupedCategories.map((cat) => {
                const items = filteredLibrary.filter((c) => c.category === cat);
                const isCollapsed = Boolean(collapsedCategories[cat]);

                return (
                  <div key={cat} className="space-y-1">
                    {/* Collapsible Category Header (Image 2 style) */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="flex w-full items-center gap-1.5 rounded-sm px-1 py-1 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="size-3.5 text-neutral-400 transition-transform" />
                      ) : (
                        <ChevronDown className="size-3.5 text-neutral-400 transition-transform" />
                      )}
                      <span>{cat}</span>
                      <span className="ml-auto text-[10px] font-normal text-neutral-400">
                        {items.length}
                      </span>
                    </button>

                    {/* Component Grid */}
                    {!isCollapsed && (
                      <div className="grid grid-cols-3 gap-2 pt-0.5">
                        {items.map((item) => {
                          const isToolActive = activeTool === item.type;
                          return (
                            <div
                              key={item.type}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("application/json", JSON.stringify({ type: item.type }));
                                e.dataTransfer.effectAllowed = "copy";
                              }}
                              onClick={() => {
                                if (onSelectTool) {
                                  onSelectTool(item.type);
                                } else {
                                  onAddAsset(item.type);
                                }
                              }}
                              title={`${item.label} (点击后在画布拖拽绘制，或直接拖拽置入)`}
                              className={cn(
                                "group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border p-2 text-center transition-all duration-150 active:scale-95",
                                isToolActive
                                  ? "border-blue-500 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20 font-medium"
                                  : "border-neutral-100 bg-neutral-50/70 hover:border-blue-300 hover:bg-white hover:shadow-md",
                              )}
                            >
                              {/* Shortcut tag in top-left */}
                              {item.shortcut && (
                                <span className="absolute top-1 left-1 rounded bg-neutral-200/80 px-1 py-0.2 text-[8px] font-bold text-neutral-600">
                                  {item.shortcut}
                                </span>
                              )}

                              {/* Miniature Preview Box */}
                              <div className="flex h-9 w-full items-center justify-center">
                                <ComponentMiniPreview type={item.type} icon={item.icon} />
                              </div>

                              {/* Label */}
                              <span
                                className={cn(
                                  "mt-1 w-full truncate text-[11px]",
                                  isToolActive
                                    ? "font-semibold text-blue-600"
                                    : "text-neutral-700 group-hover:text-blue-600 group-hover:font-medium",
                                )}
                              >
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB: PAGES & CATALOG ===================== */}
        {activeTab === "pages" && (
          <div className="flex h-full flex-col">
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2.5">
              <span className="text-xs font-bold text-neutral-900">画布</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onPageAdd}
                  className="flex size-6 items-center justify-center rounded hover:bg-neutral-100 text-neutral-600"
                  title="新建页面"
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onPageAdd}
                  className="flex size-6 items-center justify-center rounded hover:bg-neutral-100 text-neutral-600"
                  title="新建文件夹"
                >
                  <FolderPlus className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="flex size-6 items-center justify-center rounded hover:bg-neutral-100 text-neutral-600"
                  title="搜索"
                >
                  <Search className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="flex size-6 items-center justify-center rounded hover:bg-neutral-100 text-neutral-600"
                  title="更多"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas / Pages List (Top section) */}
            <div className="border-b border-neutral-200 p-2 space-y-1">
              {pages.map((page) => {
                const isActive = activePageId === page.id;
                return (
                  <div
                    key={page.id}
                    onClick={() => onPageSelect(page.id)}
                    className={cn(
                      "group flex h-8 cursor-pointer items-center justify-between rounded-md px-2.5 text-xs transition-colors",
                      isActive ? "bg-neutral-100 font-bold text-neutral-900" : "text-neutral-600 hover:bg-neutral-50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Square className="size-3.5 text-neutral-500" />
                      <span className="truncate">{page.name}</span>
                    </div>
                    {isActive && <div className="size-2 rounded-full bg-blue-600" />}
                  </div>
                );
              })}
            </div>

            {/* Bottom Section: Layers */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-900">
              <span>图层</span>
              <div className="flex items-center gap-1 text-neutral-400">
                <Search className="size-3.5 cursor-pointer hover:text-neutral-700" />
                <ListFilter className="size-3.5 cursor-pointer hover:text-neutral-700" />
              </div>
            </div>

            {/* Tree Items List */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-0.5">
                {[...roots].reverse().map((el) => (
                  <LayerTreeItem
                    key={el.id}
                    el={el}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    onSelect={onSelect}
                    onSelectIds={onSelectIds}
                    onUpdateElement={onUpdateElement}
                    onDeleteElement={onDeleteElement}
                  />
                ))}
                {roots.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-neutral-400">当前页面暂无图层</p>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

