"use client";

import { useState, useEffect, memo } from "react";
import { cn } from "@bluepen/editor/lib/utils";
import { Button } from "@bluepen/editor/components/ui/button";
import {
  // Navigation / Shell icons
  Layers,
  Box,
  Boxes,
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
  X,
  Layout,

  // Basic component icons
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Image as ImageIcon,
  Zap,
  RectangleHorizontal,
  SquarePlay,
  Grid2X2,
  Table,
  StickyNote,
  MapPin,
  PanelBottomOpen,
  AppWindow,
  GitBranch,
  BookOpen,
  Braces,
  Sparkles,

  // Flowchart component icons
  Route,
  Diamond,
  CircleDot,
  FileText,
  Binary,
  SquareSplitVertical,
  HardDriveDownload,
  HardDrive,
  Database,
  Keyboard,
  CreditCard,
  Bookmark,
  Monitor,
  Wrench,
  Hexagon,
  Repeat,

  // Form component icons
  TextCursorInput,
  AlignLeft,
  ChevronsUpDown,
  Upload,
  CheckSquare,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  ListOrdered,
  CalendarDays,

  // Navigation component icons
  Menu,
  PanelTop,
  Columns3,
  Columns2,
  ChevronsRight,
  LayoutTemplate,
  FolderTree,
  CalendarRange,
  Clock,
  ArrowLeftRight,
  UploadCloud,
  Palette,
  FileSpreadsheet,
  PanelBottomClose,
  PanelRightClose,
  PanelLeftClose,
  BellRing,
  LayoutDashboard,
  SearchCode,
  TableProperties,
  FormInput,
  LockKeyhole,
  Workflow,

  // Container component icons
  Smartphone,
  PanelLeft,
  PanelBottom,

  // Display component icons
  Badge,
  Tag,
  User,
  Users,
  AlertTriangle,
  TrendingUp,
  Gauge,
  PackageOpen,
  Star,
  Link2,
  SeparatorHorizontal,
  Loader2,
  MessageSquare,
  HelpCircle,
  MousePointerClick,
  Video,
  BarChart3,
  Settings,
  Bot,
  UserCheck,
  Terminal,
  LayoutGrid,
  Compass,
  Heading,
} from "lucide-react";
import type { ComponentType, EditorElement, Page } from "./types";
import {
  library,
  type LibraryComponent,
  baseLibrary,
  webLibrary,
  agentLibrary,
} from "./library/index";

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
  onAddAsset: (asset: ComponentType | LibraryComponent) => void;
  drawerCollapsed?: boolean;
  onToggleDrawer?: () => void;
}

export function getElementIcon(type: ComponentType) {
  switch (type) {
    case "group":
      return Boxes;
    // Basic Wireframe
    case "text":
      return Type;
    case "rectangle":
      return Square;
    case "circle":
      return Circle;
    case "line":
      return Minus;
    case "arrow":
      return ArrowRight;
    case "image":
      return ImageIcon;
    case "hotspot":
      return Zap;
    case "button":
      return RectangleHorizontal;
    case "button-primary":
      return SquarePlay;
    case "placeholder":
      return Grid2X2;
    case "table":
      return Table;
    case "sticky-note":
      return StickyNote;
    case "pin-note":
      return MapPin;
    case "scroll-panel":
      return PanelBottomOpen;
    case "modal-dialog":
      return AppWindow;
    case "mind-map":
      return GitBranch;
    case "document":
      return BookOpen;
    case "code-block":
      return Braces;
    case "ai-component":
      return Sparkles;

    // Flowchart & Connectors
    case "connector":
      return Route;
    case "flow-process":
      return Square;
    case "flow-decision":
      return Diamond;
    case "flow-start-end":
      return CircleDot;
    case "flow-document":
      return FileText;
    case "flow-data":
      return Binary;
    case "flow-subprocess":
      return SquareSplitVertical;
    case "flow-external-data":
      return HardDriveDownload;
    case "flow-internal-storage":
      return HardDrive;
    case "flow-queue":
      return Layers;
    case "flow-database":
      return Database;
    case "flow-manual-input":
      return Keyboard;
    case "flow-card":
      return CreditCard;
    case "flow-tape":
      return Bookmark;
    case "flow-display":
      return Monitor;
    case "flow-manual-op":
      return Wrench;
    case "flow-preparation":
      return Hexagon;
    case "flow-loop-limit":
      return Repeat;

    // Form
    case "input":
      return TextCursorInput;
    case "textarea":
      return AlignLeft;
    case "select":
      return ChevronsUpDown;
    case "file-upload":
      return Upload;
    case "radio":
      return CircleDot;
    case "checkbox":
      return CheckSquare;
    case "switch-android":
      return ToggleLeft;
    case "switch-ios":
    case "switch":
      return ToggleRight;
    case "slider":
      return SlidersHorizontal;
    case "stepper":
      return ListOrdered;
    case "date-picker":
      return CalendarDays;
    case "search":
      return Search;

    // Navigation
    case "dropdown-menu":
      return ChevronDown;
    case "popup-menu":
      return Menu;
    case "navbar":
      return PanelTop;
    case "tabs":
      return Columns3;
    case "pagination":
      return ChevronsRight;
    case "breadcrumb":
      return Route;
    case "stepper-nav":
      return ListOrdered;

    // Containers & Devices
    case "mobile-frame":
      return Smartphone;
    case "browser-frame":
      return Layout;
    case "card":
      return Square;
    case "sidebar":
      return PanelLeft;
    case "header":
      return PanelTop;
    case "footer":
      return PanelBottom;

    // Display & Feedback
    case "badge":
      return Badge;
    case "chip":
      return Tag;
    case "avatar":
      return User;
    case "avatar-group":
      return Users;
    case "alert":
      return AlertTriangle;
    case "stat":
      return TrendingUp;
    case "progress":
      return Gauge;
    case "empty-state":
      return PackageOpen;
    case "rating":
      return Star;
    case "divider":
      return SeparatorHorizontal;
    case "link":
      return Link2;
    case "spinner":
      return Loader2;
    case "toast":
      return MessageSquare;
    case "tooltip":
      return HelpCircle;
    case "video":
      return Video;

    // Web Navigation
    case "web-dropdown":
      return ChevronDown;
    case "web-menu":
      return Menu;
    case "web-top-nav":
      return PanelTop;
    case "web-tabs":
      return Columns3;
    case "web-breadcrumb":
      return Route;
    case "web-pagination":
      return ChevronsRight;
    case "web-steps":
      return ListOrdered;

    // Web Form
    case "web-button":
      return RectangleHorizontal;
    case "web-input":
      return TextCursorInput;
    case "web-input-number":
      return ListOrdered;
    case "web-textarea":
      return AlignLeft;
    case "web-select":
      return ChevronsUpDown;
    case "web-cascader":
      return FolderTree;
    case "web-tree-select":
      return GitBranch;
    case "web-auto-complete":
      return Search;
    case "web-tag-input":
      return Tag;
    case "web-date-picker":
      return CalendarDays;
    case "web-date-range-picker":
      return CalendarRange;
    case "web-time-picker":
      return Clock;
    case "web-radio-group":
      return CircleDot;
    case "web-checkbox-group":
      return CheckSquare;
    case "web-switch":
      return ToggleRight;
    case "web-slider":
      return SlidersHorizontal;
    case "web-transfer":
      return ArrowLeftRight;
    case "web-upload":
      return UploadCloud;
    case "web-color-picker":
      return Palette;

    // Web Data Display
    case "web-table":
      return Table;
    case "web-descriptions":
      return FileSpreadsheet;
    case "web-tree":
      return FolderTree;
    case "web-collapse":
      return PanelBottomClose;
    case "web-statistic-card":
      return TrendingUp;
    case "web-tag":
      return Tag;
    case "web-timeline":
      return Clock;
    case "web-badge":
      return Badge;
    case "web-avatar-group":
      return Users;

    // Web Feedback
    case "web-modal":
      return AppWindow;
    case "web-drawer":
      return PanelRightClose;
    case "web-alert":
      return AlertTriangle;
    case "web-popconfirm":
      return HelpCircle;
    case "web-notification":
      return BellRing;
    case "web-tips":
      return HelpCircle;
    case "web-message":
      return MessageSquare;
    case "web-skeleton":
      return Layers;
    case "web-empty-state":
      return PackageOpen;

    // Web Blocks
    case "web-admin-layout":
      return LayoutDashboard;
    case "web-filter-bar":
      return SearchCode;
    case "web-crud-table":
      return TableProperties;
    case "web-form-layout":
      return FormInput;
    case "web-login-card":
      return LockKeyhole;
    case "web-steps-form":
      return Workflow;
    case "web-button-group":
      return Columns2;
    case "web-card":
      return Square;
    case "web-chart":
      return BarChart3;
    case "web-kanban":
      return Columns3;
    case "web-calendar":
      return CalendarDays;
    case "web-dashboard-page":
      return LayoutDashboard;
    case "web-settings-page":
      return Settings;
    case "web-pricing-table":
      return CreditCard;
    case "web-faq-section":
      return HelpCircle;

    // Agent Templates & Components
    case "agent-home-layout":
      return Bot;
    case "agent-chat-stream-layout":
      return MessageSquare;
    case "agent-split-workspace-layout":
      return Columns3;
    case "agent-employee-workspace-layout":
      return Users;
    case "agent-employee-market-layout":
      return LayoutGrid;
    case "agent-nav-sidebar":
      return PanelLeft;
    case "agent-sidebar-header":
      return AppWindow;
    case "agent-mode-switch":
      return SlidersHorizontal;
    case "agent-new-task-button":
      return Plus;
    case "agent-session-list":
      return MessageSquare;
    case "agent-project-tree":
      return FolderTree;
    case "agent-sidebar-nav":
      return Compass;
    case "agent-user-footer":
      return User;
    case "agent-prompt-box":
      return TextCursorInput;
    case "agent-model-badge":
      return Sparkles;
    case "agent-prompt-toolbar":
      return SlidersHorizontal;
    case "agent-prompt-suggestions":
      return Sparkles;
    case "agent-user-message":
      return User;
    case "agent-session-header":
      return Heading;
    case "agent-status-badge":
      return Tag;
    case "agent-stream-header":
      return Bot;
    case "agent-tool-step":
      return Terminal;
    case "agent-thought-stream":
      return Sparkles;
    case "agent-file-attachments":
      return FileText;
    case "agent-employee-card":
      return UserCheck;
    case "agent-template-card":
      return Square;
    case "agent-artifact-tabs":
      return Columns2;
    case "agent-console-table":
      return Table;

    default:
      return Box;
  }
}

// Map component icons to visual miniature previews using Lucide icons
function ComponentMiniPreview({ type }: { type: ComponentType; icon?: string }) {
  const IconComponent = getElementIcon(type);
  return (
    <div className="flex size-7 items-center justify-center rounded-xs transition-transform duration-150 group-hover:scale-110">
      <IconComponent className="size-5 text-foreground/85 transition-colors group-hover:text-foreground stroke-[1.75]" />
    </div>
  );
}

const LayerTreeItem = memo(function LayerTreeItem({
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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(el.name);
  const hasChildren = el.children && el.children.length > 0;
  const isSelected = selectedIds && selectedIds.length > 0 ? selectedIds.includes(el.id) : selectedId === el.id;
  const ElementIcon = getElementIcon(el.type);

  useEffect(() => {
    if (!isEditing) {
      setEditName(el.name);
    }
  }, [el.name, isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(el.name);
    setIsEditing(true);
  };

  const handleSaveRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== el.name) {
      onUpdateElement(el.id, { name: trimmed });
    } else {
      setEditName(el.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditName(el.name);
      setIsEditing(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "group flex h-7.5 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs transition-all duration-150 select-none",
          isSelected
            ? "bg-surface-raised text-foreground font-bold border border-border-visible"
            : "text-muted-foreground hover:bg-surface-raised/50 hover:text-foreground",
          !el.visible && "opacity-40"
        )}
        style={{ paddingLeft: `${6 + depth * 12}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex size-4 shrink-0 items-center justify-center rounded-xs hover:bg-surface-raised text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <span className="size-3.5 shrink-0" />
        )}

        {/* Element Type Icon */}
        <ElementIcon className={cn("size-3.5 shrink-0 transition-colors", isSelected ? "text-foreground" : "text-muted-foreground/70")} />

        {/* Element Name or Inline Edit Input */}
        {isEditing ? (
          <input
            ref={(input) => {
              if (input) {
                input.focus();
                input.select();
              }
            }}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="h-5.5 flex-1 min-w-0 rounded-xs border border-border-visible bg-background px-1 text-xs font-medium text-foreground outline-none focus:border-foreground"
          />
        ) : (
          <span
            className="truncate flex-1 text-xs font-medium tracking-normal"
            title="双击重命名"
          >
            {el.name}
          </span>
        )}

        {/* Hover Action Buttons */}
        {!isEditing && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              className="flex size-4 items-center justify-center rounded-xs text-muted-foreground hover:text-foreground hover:bg-surface-raised"
              onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { visible: !el.visible }); }}
              title={el.visible ? "隐藏图层" : "显示图层"}
            >
              {el.visible ? <Eye className="size-3" /> : <EyeOff className="size-3 text-muted-foreground/50" />}
            </button>
            <button
              type="button"
              className="flex size-4 items-center justify-center rounded-xs text-muted-foreground hover:text-foreground hover:bg-surface-raised"
              onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { locked: !el.locked }); }}
              title={el.locked ? "解锁图层" : "锁定图层"}
            >
              {el.locked ? <Lock className="size-3 text-accent" /> : <Unlock className="size-3 text-muted-foreground/50" />}
            </button>
            <button
              type="button"
              className="flex size-4 items-center justify-center rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
              title="删除图层"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* Children List with Indentation Tree Line */}
      {hasChildren && expanded && (
        <div className="relative border-l border-border-visible/40 ml-3.5 pl-0.5 space-y-0.5 my-0.5">
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
});

type NavTab = "pages" | "components" | "web" | "agent";

export const LeftSidebar = memo(function LeftSidebar({
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
  drawerCollapsed: controlledDrawerCollapsed,
  onToggleDrawer,
}: LeftSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isDrawerCollapsed = controlledDrawerCollapsed !== undefined ? controlledDrawerCollapsed : internalCollapsed;

  const toggleDrawer = () => {
    if (onToggleDrawer) {
      onToggleDrawer();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const [activeTab, setActiveTab] = useState<NavTab>("agent");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const handleTabClick = (tabId: NavTab) => {
    if (isDrawerCollapsed) {
      setActiveTab(tabId);
      if (onToggleDrawer) {
        onToggleDrawer();
      } else {
        setInternalCollapsed(false);
      }
    } else {
      if (activeTab === tabId) {
        toggleDrawer();
      } else {
        setActiveTab(tabId);
      }
    }
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const filteredBaseLibrary = baseLibrary.filter((item) => {
    return (
      searchQuery === "" ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredWebLibrary = webLibrary.filter((item) => {
    return (
      searchQuery === "" ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredAgentLibrary = agentLibrary.filter((item) => {
    return (
      searchQuery === "" ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const baseCategories = ["基础图元", "基础控件", "流程图元", "结构容器"];
  const groupedBaseCategories = baseCategories.filter((cat) =>
    filteredBaseLibrary.some((c) => c.category === cat),
  );

  const webCategories = ["Web结构", "Web表单", "Web复合", "Web展示与反馈", "Web模版"];
  const groupedWebCategories = webCategories.filter((cat) =>
    filteredWebLibrary.some((c) => c.category === cat),
  );

  const agentCategories = ["Agent基础", "Agent分子", "Agent功能舱", "Agent模版"];
  const groupedAgentCategories = agentCategories.filter((cat) =>
    filteredAgentLibrary.some((c) => c.category === cat),
  );

  const roots = elements.filter((el) => !el.parentId || !elements.some((p) => p.id === el.parentId));

  const navItems: { id: NavTab; label: string; dockLabel: string; icon: typeof Layers }[] = [
    { id: "pages", label: "页面与图层", dockLabel: "页面", icon: Layers },
    { id: "components", label: "基础通用组件", dockLabel: "基础", icon: Box },
    { id: "web", label: "Web业务组件库", dockLabel: "Web", icon: LayoutTemplate },
    { id: "agent", label: "Agent桌面客户端", dockLabel: "Agent", icon: Bot },
  ];

  return (
    <div className="relative flex h-full w-12 shrink-0 select-none bg-surface text-foreground z-20">
      {/* 1. PRIMARY NARROW DOCK (48px) */}
      <div className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-border bg-surface py-2 z-20">
        <div className="flex flex-col items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = !isDrawerCollapsed && activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "group relative flex size-10 flex-col items-center justify-center rounded-lg font-mono transition-all duration-150 cursor-pointer select-none",
                  isActive
                    ? "bg-surface-raised text-foreground font-bold border border-border-visible shadow-2xs"
                    : "text-muted-foreground hover:bg-surface-raised/50 hover:text-foreground"
                )}
                onClick={() => handleTabClick(item.id)}
                title={isActive ? `${item.label} (再次点击收起)` : `${item.label} (点击展开)`}
              >
                <Icon className={cn("size-4 transition-transform duration-150", isActive ? "scale-105 text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span
                  className={cn(
                    "mt-0.5 font-mono text-[8px] tracking-wider uppercase leading-none",
                    isActive ? "text-foreground font-bold" : "text-muted-foreground/70 group-hover:text-foreground"
                  )}
                >
                  {item.dockLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Status / More */}
        <div
          className="flex size-8 items-center justify-center rounded-xs text-muted-foreground/50 select-none"
        >
          <MoreHorizontal className="size-4" />
        </div>
      </div>

      {/* 2. SECONDARY DRAWER PANEL (248px) - Absolute Overlay */}
      <aside
        className={cn(
          "absolute top-0 bottom-0 left-12 z-20 flex w-62 flex-col overflow-hidden border-r border-border bg-surface text-foreground transition-all duration-200 ease-out",
          isDrawerCollapsed
            ? "pointer-events-none -translate-x-3 opacity-0"
            : "translate-x-0 opacity-100"
        )}
      >
        <div className="flex h-full w-62 min-w-[248px] flex-col overflow-hidden">
          {/* ===================== TAB: AGENT TEMPLATES & COMPONENTS ===================== */}
          {activeTab === "agent" && (
            <div className="flex h-full flex-col">
              {/* Tab Header & Search */}
              <div className="flex shrink-0 flex-col border-b border-border p-2 gap-1.5 bg-surface">
                <div className="flex items-center justify-between px-1 py-0.5">
                  <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">[ AGENT 桌面客户端 ]</span>
                  <span className="font-mono text-[10px] text-muted-foreground/80">{String(filteredAgentLibrary.length).padStart(2, "0")} ITEMS</span>
                </div>
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-2 size-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索 Agent 模版或组件..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-full rounded-xs border border-border-visible bg-background pl-7 pr-6 font-mono text-[11px] uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-foreground"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Agent Component Groups */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
                {groupedAgentCategories.map((cat) => {
                  const items = filteredAgentLibrary.filter((c) => c.category === cat);
                  const isCollapsed = searchQuery.trim().length > 0 ? false : Boolean(collapsedCategories[cat]);
                  const isTemplateCat = cat === "Agent模版";

                  const categoryLabels: Record<string, string> = {
                    "Agent基础": "客户端基础",
                    "Agent分子": "交互分子",
                    "Agent功能舱": "核心功能舱",
                    "Agent模版": "工作台模版",
                  };

                  return (
                    <div key={cat} className="space-y-1">
                      {/* Collapsible Category Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="flex w-full items-center gap-1 rounded-xs px-1.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="size-3 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-3 text-muted-foreground" />
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground/70">[</span>
                        <span className="text-xs font-semibold tracking-wide text-foreground/90">{categoryLabels[cat] || cat}</span>
                        <span className="font-mono text-[11px] text-muted-foreground/70">]</span>
                        <span className="ml-auto font-mono text-[10px] font-normal text-muted-foreground">
                          {String(items.length).padStart(2, "0")}
                        </span>
                      </button>

                      {/* Component Grid */}
                      {!isCollapsed && (
                        <div className={cn("gap-1.5 pt-0.5", isTemplateCat ? "grid grid-cols-2" : "grid grid-cols-3")}>
                          {items.map((item) => {
                            const isToolActive = activeTool === item.type;
                            return (
                              <div
                                key={item.type}
                                draggable
                                onDragStart={(e) => {
                                  const data = JSON.stringify({
                                    type: item.type,
                                    label: item.label,
                                    defaultWidth: item.defaultWidth,
                                    defaultHeight: item.defaultHeight,
                                    defaultProps: item.defaultProps,
                                  });
                                  e.dataTransfer.setData("application/json", data);
                                  e.dataTransfer.setData("text/plain", data);
                                  e.dataTransfer.effectAllowed = "copy";
                                }}
                                onClick={() => {
                                  onAddAsset(item);
                                }}
                                title={`${item.label} (点击添加至画布或拖拽)`}
                                className={cn(
                                  "group relative flex cursor-pointer flex-col items-center justify-center rounded-md border p-1.5 text-center transition-all duration-150 active:scale-95 select-none",
                                  isToolActive
                                    ? "border-foreground bg-surface-raised text-foreground font-semibold ring-1 ring-border-visible shadow-2xs"
                                    : "border-border/80 bg-surface-raised/50 hover:border-border-visible hover:bg-surface-raised text-muted-foreground hover:text-foreground",
                                  isTemplateCat && "py-2"
                                )}
                              >
                                {item.shortcut && (
                                  <span className="absolute top-1 left-1 rounded-2xs border border-border-visible/60 bg-background/80 px-1 font-mono text-[7.5px] font-semibold text-muted-foreground/80 group-hover:text-foreground group-hover:border-border-visible">
                                    {item.shortcut}
                                  </span>
                                )}

                                <div className={cn("flex w-full items-center justify-center", isTemplateCat ? "h-9" : "h-8")}>
                                  <ComponentMiniPreview type={item.type} icon={item.icon} />
                                </div>

                                <span
                                  className={cn(
                                    "mt-1 w-full truncate text-[11px] leading-tight transition-colors",
                                    isToolActive
                                      ? "font-bold text-foreground"
                                      : "text-foreground/85 group-hover:text-foreground font-medium",
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
          {/* ===================== TAB: WEB TEMPLATES & COMPONENTS ===================== */}
          {activeTab === "web" && (
            <div className="flex h-full flex-col">
              {/* Tab Header & Search */}
              <div className="flex shrink-0 flex-col border-b border-border p-2 gap-1.5 bg-surface">
                <div className="flex items-center justify-between px-1 py-0.5">
                  <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">[ WEB 业务设计库 ]</span>
                  <span className="font-mono text-[10px] text-muted-foreground/80">{String(filteredWebLibrary.length).padStart(2, "0")} ITEMS</span>
                </div>
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-2 size-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索模版或组件..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-full rounded-xs border border-border-visible bg-background pl-7 pr-6 font-mono text-[11px] uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-foreground"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Web Component Groups */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
                {groupedWebCategories.map((cat) => {
                  const items = filteredWebLibrary.filter((c) => c.category === cat);
                  const isCollapsed = searchQuery.trim().length > 0 ? false : Boolean(collapsedCategories[cat]);
                  const isTemplateCat = cat === "Web模版";

                  const categoryLabels: Record<string, string> = {
                    "Web结构": "结构与排版",
                    "Web表单": "表单与输入",
                    "Web复合": "复合选择与导航",
                    "Web展示与反馈": "数据展示与反馈",
                    "Web模版": "整屏业务模版",
                  };

                  return (
                    <div key={cat} className="space-y-1">
                      {/* Collapsible Category Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="flex w-full items-center gap-1 rounded-xs px-1.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="size-3 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-3 text-muted-foreground" />
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground/70">[</span>
                        <span className="text-xs font-semibold tracking-wide text-foreground/90">{categoryLabels[cat] || cat}</span>
                        <span className="font-mono text-[11px] text-muted-foreground/70">]</span>
                        <span className="ml-auto font-mono text-[10px] font-normal text-muted-foreground">
                          {String(items.length).padStart(2, "0")}
                        </span>
                      </button>

                      {/* Component Grid */}
                      {!isCollapsed && (
                        <div className={cn("gap-1.5 pt-0.5", isTemplateCat ? "grid grid-cols-2" : "grid grid-cols-3")}>
                          {items.map((item) => {
                            const isToolActive = activeTool === item.type;
                            return (
                              <div
                                key={item.type}
                                draggable
                                onDragStart={(e) => {
                                  const data = JSON.stringify({
                                    type: item.type,
                                    label: item.label,
                                    defaultWidth: item.defaultWidth,
                                    defaultHeight: item.defaultHeight,
                                    defaultProps: item.defaultProps,
                                  });
                                  e.dataTransfer.setData("application/json", data);
                                  e.dataTransfer.setData("text/plain", data);
                                  e.dataTransfer.effectAllowed = "copy";
                                }}
                                onClick={() => {
                                  onAddAsset(item);
                                }}
                                title={`${item.label} (点击添加至画布或拖拽)`}
                                className={cn(
                                  "group relative flex cursor-pointer flex-col items-center justify-center rounded-md border p-1.5 text-center transition-all duration-150 active:scale-95 select-none",
                                  isToolActive
                                    ? "border-foreground bg-surface-raised text-foreground font-semibold ring-1 ring-border-visible shadow-2xs"
                                    : "border-border/80 bg-surface-raised/50 hover:border-border-visible hover:bg-surface-raised text-muted-foreground hover:text-foreground",
                                  isTemplateCat && "py-2"
                                )}
                              >
                                {/* Shortcut tag in top-left */}
                                {item.shortcut && (
                                  <span className="absolute top-1 left-1 rounded-2xs border border-border-visible/60 bg-background/80 px-1 font-mono text-[7.5px] font-semibold text-muted-foreground/80 group-hover:text-foreground group-hover:border-border-visible">
                                    {item.shortcut}
                                  </span>
                                )}

                                {/* Miniature Preview Box */}
                                <div className={cn("flex w-full items-center justify-center", isTemplateCat ? "h-9" : "h-8")}>
                                  <ComponentMiniPreview type={item.type} icon={item.icon} />
                                </div>

                                {/* Label */}
                                <span
                                  className={cn(
                                    "mt-1 w-full truncate text-[11px] leading-tight transition-colors",
                                    isToolActive
                                      ? "font-bold text-foreground"
                                      : "text-foreground/85 group-hover:text-foreground font-medium",
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

          {/* ===================== TAB: COMPONENTS ===================== */}
          {activeTab === "components" && (
            <div className="flex h-full flex-col">
              {/* Tab Header & Search */}
              <div className="flex shrink-0 flex-col border-b border-border p-2 gap-1.5 bg-surface">
                <div className="flex items-center justify-between px-1 py-0.5">
                  <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">[ 基础通用组件库 ]</span>
                  <span className="font-mono text-[10px] text-muted-foreground/80">{String(filteredBaseLibrary.length).padStart(2, "0")} ITEMS</span>
                </div>
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-2 size-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索基础与流程组件..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-full rounded-xs border border-border-visible bg-background pl-7 pr-6 font-mono text-[11px] uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-foreground"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Component Groups & 3-Column Grid */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
                {groupedBaseCategories.map((cat) => {
                  const items = filteredBaseLibrary.filter((c) => c.category === cat);
                  const isCollapsed = searchQuery.trim().length > 0 ? false : Boolean(collapsedCategories[cat]);

                  const categoryLabels: Record<string, string> = {
                    "基础图元": "线框基础图元",
                    "基础控件": "常用表单控件",
                    "流程图元": "标准流程图元",
                    "结构容器": "结构与容器",
                  };

                  return (
                    <div key={cat} className="space-y-1">
                      {/* Collapsible Category Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="flex w-full items-center gap-1 rounded-xs px-1.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="size-3 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-3 text-muted-foreground" />
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground/70">[</span>
                        <span className="text-xs font-semibold tracking-wide text-foreground/90">{categoryLabels[cat] || cat}</span>
                        <span className="font-mono text-[11px] text-muted-foreground/70">]</span>
                        <span className="ml-auto font-mono text-[10px] font-normal text-muted-foreground">
                          {String(items.length).padStart(2, "0")}
                        </span>
                      </button>

                      {/* Component Grid */}
                      {!isCollapsed && (
                        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                          {items.map((item) => {
                            const isToolActive = activeTool === item.type;
                            return (
                              <div
                                key={item.type}
                                draggable
                                onDragStart={(e) => {
                                  const data = JSON.stringify({
                                    type: item.type,
                                    label: item.label,
                                    defaultWidth: item.defaultWidth,
                                    defaultHeight: item.defaultHeight,
                                    defaultProps: item.defaultProps,
                                  });
                                  e.dataTransfer.setData("application/json", data);
                                  e.dataTransfer.setData("text/plain", data);
                                  e.dataTransfer.effectAllowed = "copy";
                                }}
                                onClick={() => {
                                  const wireframeTools = ["rectangle", "circle", "line", "arrow", "text", "hotspot", "pin-note", "sticky-note", "connector"];
                                  if (onSelectTool && wireframeTools.includes(item.type)) {
                                    onSelectTool(item.type);
                                  } else {
                                    onAddAsset(item);
                                  }
                                }}
                                title={`${item.label} (点击在画布绘制或拖拽)`}
                                className={cn(
                                  "group relative flex cursor-pointer flex-col items-center justify-center rounded-md border p-1.5 text-center transition-all duration-150 active:scale-95 select-none",
                                  isToolActive
                                    ? "border-foreground bg-surface-raised text-foreground font-semibold ring-1 ring-border-visible shadow-2xs"
                                    : "border-border/80 bg-surface-raised/50 hover:border-border-visible hover:bg-surface-raised text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {/* Shortcut tag in top-left */}
                                {item.shortcut && (
                                  <span className="absolute top-1 left-1 rounded-2xs border border-border-visible/60 bg-background/80 px-1 font-mono text-[7.5px] font-semibold text-muted-foreground/80 group-hover:text-foreground group-hover:border-border-visible">
                                    {item.shortcut}
                                  </span>
                                )}

                                {/* Miniature Preview Box */}
                                <div className="flex h-8 w-full items-center justify-center">
                                  <ComponentMiniPreview type={item.type} icon={item.icon} />
                                </div>

                                {/* Label */}
                                <span
                                  className={cn(
                                    "mt-1 w-full truncate text-[11px] leading-tight transition-colors",
                                    isToolActive
                                      ? "font-bold text-foreground"
                                      : "text-foreground/85 group-hover:text-foreground font-medium",
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
            <div className="flex h-full flex-col overflow-hidden">
              {/* Top Module: PAGES */}
              <div className="flex shrink-0 flex-col border-b border-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 px-3 py-2 bg-surface">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">[ 页面管理 ]</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={onPageAdd}
                      className="flex size-5.5 items-center justify-center rounded-xs text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                      title="新建页面"
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={onPageAdd}
                      className="flex size-5.5 items-center justify-center rounded-xs text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                      title="新建文件夹"
                    >
                      <FolderPlus className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Canvas / Pages List (Dedicated Height Area) */}
                <div className="h-44 min-h-[120px] max-h-[200px] overflow-y-auto p-2 space-y-1 bg-surface">
                  {pages.map((page) => {
                    const isActive = activePageId === page.id;
                    return (
                      <div
                        key={page.id}
                        onClick={() => onPageSelect(page.id)}
                        className={cn(
                          "group flex h-7.5 cursor-pointer items-center justify-between rounded-md px-2.5 text-xs transition-all duration-150 select-none",
                          isActive
                            ? "bg-surface-raised text-foreground font-bold border border-border-visible shadow-2xs"
                            : "text-muted-foreground hover:bg-surface-raised/50 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Layout className={cn("size-3.5 shrink-0", isActive ? "text-foreground" : "text-muted-foreground/70")} />
                          <span className="truncate text-xs font-medium tracking-normal">{page.name}</span>
                        </div>
                        {pages.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPageDelete(page.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 flex size-4 items-center justify-center rounded-xs text-muted-foreground hover:text-destructive transition-opacity"
                            title="删除页面"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Module: LAYERS */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2 text-xs font-bold bg-surface">
                  <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">[ 图层列表 ]</span>
                  <span className="nd-num text-[10px] font-mono text-muted-foreground">{String(roots.length).padStart(2, "0")}</span>
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
                      <p className="px-3 py-4 text-center font-mono text-[11px] text-muted-foreground uppercase tracking-wider">NO LAYERS</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
});

