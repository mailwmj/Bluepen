"use client";

import { Button } from "@outlin/editor/components/ui/button";
import { Separator } from "@outlin/editor/components/ui/separator";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@outlin/editor/components/ui/menu";
import { cn } from "@outlin/editor/lib/utils";
import {
  MousePointer2,
  Undo2,
  Redo2,
  ChevronDown,
  Grid3X3,
  Play,
  Square,
  Download,
  CheckCircle2,
  Save,
  FolderOpen,
  FilePlus2,
  CircleDashed,
  LayoutTemplate,
} from "lucide-react";

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];

interface TopBarProps {
  projectName: string;
  dirty: boolean;
  zoom: number;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  activeTool: string;
  previewing: boolean;
  demo?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSelectTool: () => void;
  onFrameTool: () => void;
  onToggleGrid: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomTo: (zoom: number) => void;
  onSave: () => void;
  onNew: () => void;
  onOpen: () => void;
  onTemplate: () => void;
  onPreview: () => void;
  onExport: () => void;
}

export function TopBar({
  projectName,
  dirty,
  zoom,
  canUndo,
  canRedo,
  activeTool,
  previewing,
  demo = false,
  showGrid,
  onUndo,
  onRedo,
  onSelectTool,
  onFrameTool,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onZoomTo,
  onSave,
  onNew,
  onOpen,
  onTemplate,
  onPreview,
  onExport,
}: TopBarProps) {
  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b bg-background/75 px-2 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      {/* Left */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 pl-1 pr-1.5">
          <img
            src="/brand/outlin-icon.svg"
            alt="Outlin"
            className="size-[18px] shrink-0"
          />
          <span className="text-sm font-semibold tracking-tight text-foreground">{projectName}</span>
        </div>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Select tool (V)"
          title="Select tool (V)"
          onClick={onSelectTool}
          className={cn("relative", activeTool === "select" && "bg-foreground text-background hover:bg-foreground")}
        >
          <MousePointer2 aria-hidden="true" />
          {activeTool === "select" && (
            <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-orange-400" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Frame tool (F)"
          title="Frame tool (F)"
          onClick={onFrameTool}
          className={cn("relative", activeTool === "frame" && "bg-foreground text-background hover:bg-foreground")}
        >
          <Grid3X3 aria-hidden="true" />
          {activeTool === "frame" && (
            <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-orange-400" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Toggle grid"
          title="Toggle grid"
          onClick={onToggleGrid}
          className={cn("relative", !showGrid && "bg-foreground text-background hover:bg-foreground")}
        >
          <Square aria-hidden="true" />
          {!showGrid && (
            <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-orange-400" />
          )}
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Button variant="ghost" size="icon-xs" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
          <Undo2 aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onRedo} disabled={!canRedo} aria-label="Redo">
          <Redo2 aria-hidden="true" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <div className="flex items-center">
          <Button variant="ghost" size="xs" onClick={onZoomOut} aria-label="Zoom out" className="px-1">
            −
          </Button>
          <Menu>
            <MenuTrigger
              render={
                <Button variant="ghost" size="xs" aria-label="Zoom" className="gap-0.5 px-1">
                  {Math.round(zoom * 100)}%
                  <ChevronDown aria-hidden="true" className="size-3" />
                </Button>
              }
            />
            <MenuPopup align="center">
              {ZOOM_PRESETS.map((z) => (
                <MenuItem
                  key={z}
                  onClick={() => onZoomTo(z / 100)}
                  className={cn(
                    "justify-between",
                    Math.round(zoom * 100) === z && "text-foreground",
                  )}
                >
                  {z}%
                  {Math.round(zoom * 100) === z && <CheckCircle2 aria-hidden="true" className="size-3.5 text-orange-400" />}
                </MenuItem>
              ))}
            </MenuPopup>
          </Menu>
          <Button variant="ghost" size="xs" onClick={onZoomIn} aria-label="Zoom in" className="px-1">
            +
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <div className="flex items-center">
          {dirty ? (
            <>
              <CircleDashed aria-hidden="true" className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Unsaved</span>
            </>
          ) : (
            <>
              <CheckCircle2 aria-hidden="true" className="size-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Saved</span>
            </>
          )}
        </div>

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
        {demo && (
          <a
            href="/download"
            className="mr-1 inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
            title="This is an online demo — download the desktop app"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-orange-400" />
            Demo
          </a>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onTemplate}
          aria-label="Insert example template"
          title="Insert example template"
        >
          <LayoutTemplate aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={onPreview}
          aria-label={previewing ? "Exit preview (Esc)" : "Preview (Prototype)"}
          title={previewing ? "Exit preview (Esc)" : "Preview (Prototype)"}
          className={cn(previewing && "bg-foreground text-background")}
        >
          <Play aria-hidden="true" className="size-3.5" />
          {previewing ? "Exit" : "Preview"}
        </Button>
        <Button variant="default" size="xs" onClick={onExport}>
          <Download aria-hidden="true" className="size-3.5" />
          Export
        </Button>
      </div>
    </header>
  );
}
