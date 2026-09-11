"use client";

import { Button } from "@bluepen/editor/components/ui/button";
import { Separator } from "@bluepen/editor/components/ui/separator";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@bluepen/editor/components/ui/menu";
import { cn } from "@bluepen/editor/lib/utils";
import {
  Undo2,
  Redo2,
  ChevronDown,
  Play,
  Grid2X2,
  Download,
  Check,
  Save,
  FolderOpen,
  FilePlus2,
  Sun,
  Moon,
  Minus,
  Square,
  Copy,
  X,
  PenLine,
  Settings2,
  Bot,
} from "lucide-react";

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];

interface TopBarProps {
  projectName: string;
  dirty?: boolean;
  saveState?: "loading" | "saved" | "pending" | "saving" | "error";
  onRetrySave?: () => void;
  zoom: number;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasContent: boolean;
  activeTool?: string;
  previewing: boolean;
  demo?: boolean;
  theme?: "dark" | "light";
  isTauri?: boolean;
  isMac?: boolean;
  fullscreen?: boolean;
  maximized?: boolean;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onOpenAgent?: () => void;
  agentOpen?: boolean;
  agentActive?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSelectTool?: () => void;
  onToggleGrid: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomTo: (zoom: number) => void;
  onFitContent: () => void;
  onFitSelection: () => void;
  onSave: () => void;
  onNew: () => void;
  onOpen: () => void;
  onTemplate?: () => void;
  onPreview: () => void;
  onExport: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

export function TopBar({
  projectName,
  dirty = false,
  saveState = "saved",
  onRetrySave,
  zoom,
  canUndo,
  canRedo,
  hasContent,
  previewing,
  showGrid,
  theme = "dark",
  isTauri = false,
  isMac = false,
  fullscreen = false,
  maximized = false,
  onToggleTheme,
  onOpenSettings,
  onOpenAgent,
  agentOpen,
  agentActive,
  onUndo,
  onRedo,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onZoomTo,
  onFitContent,
  onFitSelection,
  onSave,
  onNew,
  onOpen,
  onPreview,
  onExport,
  onMinimize,
  onMaximize,
  onClose,
}: TopBarProps) {
  const showMacTrafficLightSpacer = isTauri && isMac && !fullscreen;
  const showWindowsControls = isTauri && !isMac && onMinimize && onMaximize && onClose;
  const status = dirty && saveState === "saved" ? "pending" : saveState;
  const statusLabel = { loading: "读取中", saved: "已保存", pending: "待保存", saving: "保存中", error: "保存失败" }[status];

  return (
    <header
      data-tauri-drag-region
      onDoubleClick={onMaximize}
      className={cn(
        "flex h-10 shrink-0 select-none items-center justify-between border-b border-border bg-surface pr-3 text-foreground transition-[padding] duration-150",
        showMacTrafficLightSpacer ? "pl-[76px]" : "pl-3",
      )}
    >
      {/* Left: Brand & File Actions */}
      <div className="flex items-center gap-1.5 min-w-0" onDoubleClick={(e) => e.stopPropagation()}>
        {/* Brand Icon & Name */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          <PenLine aria-hidden="true" strokeWidth={1.5} className="size-3.5" />
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">
            BLUEPEN
          </span>
        </div>

        <Separator orientation="vertical" className="mx-1 h-3.5 bg-border" />

        {/* Project Name & Save Status */}
        <div className="flex items-center gap-2 pr-1.5 min-w-0">
          <span className="font-mono text-xs font-bold tracking-tight text-foreground uppercase truncate max-w-[160px]">
            {projectName}
          </span>
          <div className="flex shrink-0 items-center gap-1 font-mono text-[11px] uppercase" role="status" aria-live="polite">
            <span className={cn("text-muted-foreground", status === "error" && "text-destructive")}>
              [{statusLabel}]
            </span>
            {status === "error" && (
              <Button variant="outline" size="xs" onClick={onRetrySave} aria-label="重试自动保存">重试</Button>
            )}
          </div>
        </div>

        <Separator orientation="vertical" className="mx-1 h-3.5 bg-border" />

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onUndo}
          disabled={!canUndo || previewing}
          aria-label="撤销"
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 aria-hidden="true" className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRedo}
          disabled={!canRedo || previewing}
          aria-label="重做"
          title="重做 (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <Redo2 aria-hidden="true" className="size-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-3.5 bg-border" />

        <Button variant="ghost" size="icon-xs" onClick={onNew} aria-label="新建项目" title="新建项目 (Ctrl+N)">
          <FilePlus2 aria-hidden="true" className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onOpen} aria-label="打开项目" title="打开项目 (Ctrl+O)">
          <FolderOpen aria-hidden="true" className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onSave} aria-label="保存项目" title="保存项目 (Ctrl+S)">
          <Save aria-hidden="true" className="size-3.5" />
        </Button>
      </div>

      {/* Right: Mode & Tool Controls */}
      <div className="flex items-center gap-1.5" onDoubleClick={(e) => e.stopPropagation()}>
        {/* Theme switch */}
        <Button variant="ghost" size="icon-xs" onClick={onOpenAgent} aria-label="打开 AI 助手" aria-pressed={agentOpen} title={agentActive ? "AI 正在运行" : "AI 助手"}>
          <Bot aria-hidden="true" strokeWidth={1.5} />
          {agentActive && <span className="absolute right-0 top-0 size-1.5 rounded-full bg-foreground" />}
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onOpenSettings} aria-label="打开设置" title="设置"><Settings2 aria-hidden="true" strokeWidth={1.5} /></Button>
        {onToggleTheme && (<Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "切换为浅色模式" : "切换为深色模式"}
            title={theme === "dark" ? "切换为浅色模式" : "切换为深色模式"}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun aria-hidden="true" className="size-3.5" />
            ) : (
              <Moon aria-hidden="true" className="size-3.5" />
            )}
          </Button>
        )}

        <Separator orientation="vertical" className="mx-1 h-3.5 bg-border" />

        {/* 1. Preview */}
        <Button
          variant={previewing ? "default" : "ghost"}
          size="icon-xs"
          onClick={onPreview}
          disabled={!hasContent && !previewing}
          aria-label={previewing ? "退出原型预览 (Esc)" : "原型预览"}
          title={previewing ? "退出原型预览 (Esc)" : "原型预览"}
          className={cn(
            "relative",
            previewing && "bg-primary text-primary-foreground font-mono",
          )}
        >
          <Play aria-hidden="true" className="size-3.5" />
          {previewing && (
            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-accent" />
          )}
        </Button>

        {/* 2. Export */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onExport}
          disabled={!hasContent}
          aria-label="导出为 PNG"
          title="导出为 PNG"
        >
          <Download aria-hidden="true" className="size-3.5" />
        </Button>

        {/* 3. Grid toggle */}
        <Button
          variant={showGrid ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={onToggleGrid}
          aria-label={showGrid ? "隐藏画布网格" : "显示画布网格"}
          title={showGrid ? "隐藏画布网格" : "显示画布网格"}
          className={cn("relative", showGrid && "border border-border-visible text-foreground")}
        >
          <Grid2X2 aria-hidden="true" className="size-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-3.5 bg-border" />

        {/* 4. Zoom */}
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="xs"
                aria-label="画布缩放比例"
                title="画布缩放比例"
                className="gap-1 px-1.5 font-mono text-[11px] text-foreground hover:border hover:border-border-visible"
              >
                <span>{Math.round(zoom * 100)}%</span>
                <ChevronDown aria-hidden="true" className="size-3 text-muted-foreground" />
              </Button>
            }
          />
          <MenuPopup align="end">
            <MenuItem closeOnClick onClick={onFitContent} className="justify-between font-mono text-xs">
              <span>适应全部内容</span><span className="text-muted-foreground">SHIFT 1</span>
            </MenuItem>
            <MenuItem closeOnClick onClick={onFitSelection} className="justify-between font-mono text-xs">
              <span>适应选中内容</span><span className="text-muted-foreground">SHIFT 2</span>
            </MenuItem>
            <Separator className="my-1 bg-border" />
            <MenuItem onClick={onZoomIn} className="justify-between font-mono text-xs">
              <span>放大</span>
              <span className="text-[10px] text-muted-foreground">CTRL +</span>
            </MenuItem>
            <MenuItem onClick={onZoomOut} className="justify-between font-mono text-xs">
              <span>缩小</span>
              <span className="text-[10px] text-muted-foreground">CTRL -</span>
            </MenuItem>
            <MenuItem onClick={() => onZoomTo(1)} className="justify-between font-mono text-xs">
              <span>重置 100%</span>
              <span className="text-[10px] text-muted-foreground">CTRL 0</span>
            </MenuItem>
            <Separator className="my-1 bg-border" />
            {ZOOM_PRESETS.map((z) => (
              <MenuItem
                key={z}
                onClick={() => onZoomTo(z / 100)}
                className={cn(
                  "justify-between font-mono text-xs",
                  Math.round(zoom * 100) === z && "text-foreground font-bold",
                )}
              >
                <span>{z}%</span>
                {Math.round(zoom * 100) === z && (
                  <Check aria-hidden="true" className="size-3 text-foreground" />
                )}
              </MenuItem>
            ))}
          </MenuPopup>
        </Menu>

        {/* 5. Windows Desktop Window Controls */}
        {showWindowsControls && (
          <>
            <Separator orientation="vertical" className="mx-1 h-3.5 bg-border" />
            <div className="flex items-center gap-0.5 ml-0.5">
              <button
                type="button"
                onClick={onMinimize}
                aria-label="最小化"
                title="最小化"
                className="flex size-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              >
                <Minus aria-hidden="true" className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onMaximize}
                aria-label={maximized ? "还原" : "最大化"}
                title={maximized ? "还原" : "最大化"}
                className="flex size-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              >
                {maximized ? (
                  <Copy aria-hidden="true" className="size-3" />
                ) : (
                  <Square aria-hidden="true" className="size-3" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                title="关闭"
                className="flex size-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-150 hover:bg-destructive hover:text-white"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
