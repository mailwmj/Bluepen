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
  CheckCircle2,
  CircleDashed,
  Save,
  FolderOpen,
  FilePlus2,
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
    <header className="flex h-10 shrink-0 items-center justify-between border-b bg-background/75 px-2 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      {/* Left */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 pl-1 pr-1.5">
          <img
            src="/brand/bluepen-icon.svg"
            alt="Bluepen"
            className="size-[18px] shrink-0"
          />
          <span className="text-sm font-semibold tracking-tight text-foreground">{projectName}</span>
          <div
            className="flex items-center justify-center text-muted-foreground ml-0.5"
            title={dirty ? "Unsaved changes" : "All changes saved"}
            aria-label={dirty ? "Unsaved changes" : "All changes saved"}
          >
            {dirty ? (
              <CircleDashed aria-hidden="true" className="size-3.5 text-muted-foreground" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-3.5 text-emerald-500" />
            )}
          </div>
        </div>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 aria-hidden="true" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Button variant="ghost" size="icon-xs" onClick={onNew} aria-label="New project" title="New project (Ctrl+N)">
          <FilePlus2 aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onOpen} aria-label="Open project" title="Open project (Ctrl+O)">
          <FolderOpen aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onSave} aria-label="Save project" title="Save (Ctrl+S)">
          <Save aria-hidden="true" />
        </Button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* 1. Preview */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onPreview}
          aria-label={previewing ? "Exit preview (Esc)" : "Preview (Prototype)"}
          title={previewing ? "Exit preview (Esc)" : "Preview (Prototype)"}
          className={cn("relative", previewing && "bg-foreground text-background hover:bg-foreground")}
        >
          <Play aria-hidden="true" className="size-3.5" />
          {previewing && (
            <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-orange-400" />
          )}
        </Button>

        {/* 2. Export */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onExport}
          aria-label="Export PNG"
          title="Export PNG"
        >
          <Download aria-hidden="true" className="size-3.5" />
        </Button>

        {/* 3. Grid toggle */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleGrid}
          aria-label={showGrid ? "Hide grid" : "Show grid"}
          title={showGrid ? "Hide grid" : "Show grid"}
          className={cn("relative", showGrid && "bg-foreground text-background hover:bg-foreground")}
        >
          <Grid2X2 aria-hidden="true" className="size-3.5" />
          {showGrid && (
            <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-orange-400" />
          )}
        </Button>

        {/* 4. Zoom */}
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="xs"
                aria-label="Zoom options"
                title="Zoom options"
                className="gap-0.5 px-1.5 text-xs font-medium"
              >
                {Math.round(zoom * 100)}%
                <ChevronDown aria-hidden="true" className="size-3 opacity-60" />
              </Button>
            }
          />
          <MenuPopup align="end">
            <MenuItem onClick={onZoomIn} className="justify-between">
              <span>Zoom in</span>
              <span className="text-xs text-muted-foreground">Ctrl +</span>
            </MenuItem>
            <MenuItem onClick={onZoomOut} className="justify-between">
              <span>Zoom out</span>
              <span className="text-xs text-muted-foreground">Ctrl -</span>
            </MenuItem>
            <MenuItem onClick={() => onZoomTo(1)} className="justify-between">
              <span>Zoom to 100%</span>
              <span className="text-xs text-muted-foreground">Ctrl 0</span>
            </MenuItem>
            <Separator className="my-1" />
            {ZOOM_PRESETS.map((z) => (
              <MenuItem
                key={z}
                onClick={() => onZoomTo(z / 100)}
                className={cn(
                  "justify-between",
                  Math.round(zoom * 100) === z && "text-foreground font-medium",
                )}
              >
                {z}%
                {Math.round(zoom * 100) === z && (
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-orange-400" />
                )}
              </MenuItem>
            ))}
          </MenuPopup>
        </Menu>
      </div>
    </header>
  );
}
