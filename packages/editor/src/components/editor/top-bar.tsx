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
} from "lucide-react";

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];

interface TopBarProps {
  projectName: string;
  dirty?: boolean;
  zoom: number;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  activeTool?: string;
  previewing: boolean;
  demo?: boolean;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectTool?: () => void;
  onToggleGrid: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomTo: (zoom: number) => void;
  onSave: () => void;
  onNew: () => void;
  onOpen: () => void;
  onTemplate?: () => void;
  onPreview: () => void;
  onExport: () => void;
}

export function TopBar({
  projectName,
  dirty = false,
  zoom,
  canUndo,
  canRedo,
  previewing,
  showGrid,
  theme = "dark",
  onToggleTheme,
  onUndo,
  onRedo,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onZoomTo,
  onSave,
  onNew,
  onOpen,
  onPreview,
  onExport,
}: TopBarProps) {
  return (
    <header className="flex h-10 shrink-0 select-none items-center justify-between border-b border-border bg-surface px-3 text-foreground">
      {/* Left: Brand & File Actions */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-2 pr-1.5">
          <span className="font-mono text-xs font-bold tracking-tight text-foreground uppercase">{projectName}</span>
          <div
            className="flex items-center justify-center"
            title={dirty ? "Unsaved changes" : "All changes saved"}
            aria-label={dirty ? "Unsaved changes" : "All changes saved"}
          >
            {dirty ? (
              <span className="size-2 rounded-full bg-accent animate-pulse shadow-[0_0_6px_var(--accent)]" />
            ) : (
              <span className="size-1.5 rounded-full bg-success/80" />
            )}
          </div>
        </div>

        <Separator orientation="vertical" className="mx-1 h-3.5 bg-border" />

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="撤销"
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 aria-hidden="true" className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRedo}
          disabled={!canRedo}
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
      <div className="flex items-center gap-1.5">
        {/* Theme switch */}
        {onToggleTheme && (
          <Button
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
          aria-label={previewing ? "退出原型预览 (Esc)" : "原型预览 (Prototype)"}
          title={previewing ? "退出原型预览 (Esc)" : "原型预览 (Prototype)"}
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
      </div>
    </header>
  );
}
