"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import type { EditorElement } from "../types";
import { cn } from "@outlin/editor/lib/utils";
import { ElementRenderer } from "./elements/index";

interface CanvasProps {
  elements: EditorElement[];
  selectedId: string | null;
  showGrid: boolean;
  activeTool: string;
  zoom: number;
  previewing: boolean;
  onZoomChange: (zoom: number) => void;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, patch: Partial<EditorElement>) => void;
  onCommitMove: () => void;
  onDelete: () => void;
  onCanvasClick: (e: React.MouseEvent, canvasX: number, canvasY: number) => void;
}

const GRID_SIZE = 20;

type Interaction = {
  type: "move" | "resize";
  id: string;
  startX: number;
  startY: number;
  elStartX: number;
  elStartY: number;
  elW: number;
  elH: number;
  handle?: string;
};

export function Canvas({
  elements,
  selectedId,
  showGrid,
  activeTool,
  zoom,
  previewing,
  onZoomChange,
  onSelect,
  onUpdateElement,
  onCommitMove,
  onDelete,
  onCanvasClick,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [interaction, setInteraction] = useState<Interaction | null>(null);

  const snap = useCallback((v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE, []);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [zoom, pan],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newZoom = Math.min(4, Math.max(0.1, zoom + delta));
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          setPan((p) => ({
            x: mx - ((mx - p.x) / zoom) * newZoom,
            y: my - ((my - p.y) / zoom) * newZoom,
          }));
        }
        onZoomChange(newZoom);
      } else {
        setPan((p) => ({
          x: p.x - e.deltaX,
          y: p.y - e.deltaY,
        }));
      }
    },
    [zoom, onZoomChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && (spaceHeld || activeTool === "hand"))) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        return;
      }
      if (previewing) return;
    },
    [previewing, spaceHeld, pan, activeTool],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        return;
      }
      if (!interaction) return;
      const pos = screenToCanvas(e.clientX, e.clientY);
      const dx = pos.x - interaction.startX;
      const dy = pos.y - interaction.startY;

      if (interaction.type === "move") {
        onUpdateElement(interaction.id, {
          x: snap(Math.max(0, interaction.elStartX + dx)),
          y: snap(Math.max(0, interaction.elStartY + dy)),
        });
      } else if (interaction.type === "resize" && interaction.handle) {
        const h = interaction.handle;
        let x = interaction.elStartX;
        let y = interaction.elStartY;
        let w = interaction.elW;
        let hh = interaction.elH;
        if (h.includes("e")) w = Math.max(20, snap(interaction.elW + dx));
        if (h.includes("w")) {
          w = Math.max(20, snap(interaction.elW - dx));
          x = snap(interaction.elStartX + dx);
        }
        if (h.includes("s")) hh = Math.max(20, snap(interaction.elH + dy));
        if (h.includes("n")) {
          hh = Math.max(20, snap(interaction.elH - dy));
          y = snap(interaction.elStartY + dy);
        }
        onUpdateElement(interaction.id, { x, y, width: w, height: hh });
      }
    },
    [isPanning, panStart, interaction, screenToCanvas, onUpdateElement, snap],
  );

  const handleMouseUp = useCallback(() => {
    if (interaction) onCommitMove();
    setIsPanning(false);
    setInteraction(null);
  }, [interaction, onCommitMove]);

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elId: string) => {
      if (previewing) return;
      if (e.button !== 0 || spaceHeld || activeTool === "hand") return;
      const el = elements.find((el) => el.id === elId);
      if (!el || el.locked) return;
      e.stopPropagation();
      onSelect(elId);
      const pos = screenToCanvas(e.clientX, e.clientY);
      setInteraction({
        type: "move", id: elId, startX: pos.x, startY: pos.y,
        elStartX: el.x, elStartY: el.y, elW: el.width, elH: el.height,
      });
    },
    [elements, spaceHeld, activeTool, screenToCanvas, onSelect],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, elId: string, handle: string) => {
      if (previewing) return;
      e.stopPropagation();
      e.preventDefault();
      const el = elements.find((el) => el.id === elId);
      if (!el || el.locked) return;
      onSelect(elId);
      const pos = screenToCanvas(e.clientX, e.clientY);
      setInteraction({
        type: "resize", id: elId, handle, startX: pos.x, startY: pos.y,
        elStartX: el.x, elStartY: el.y, elW: el.width, elH: el.height,
      });
    },
    [elements, screenToCanvas, onSelect],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (previewing) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-element]") || target.closest("[data-handle]")) return;
      if (!target.closest("[data-canvas-area]")) return;
      const pos = screenToCanvas(e.clientX, e.clientY);
      const frame = [...elements]
        .reverse()
        .find(
          (el) =>
            el.type === "frame" &&
            pos.x >= el.x && pos.x <= el.x + el.width &&
            pos.y >= el.y && pos.y <= el.y + el.height,
        );
      onSelect(frame ? frame.id : null);
      onCanvasClick(e, pos.x, pos.y);
    },
    [elements, screenToCanvas, onSelect, onCanvasClick],
  );

  const ElementNode = ({
    el,
    ancestorLocked,
    interaction,
    isPanning,
    spaceHeld,
    onElementMouseDown,
    onResizeMouseDown,
  }: {
    el: EditorElement;
    ancestorLocked: boolean;
    interaction: Interaction | null;
    isPanning: boolean;
    spaceHeld: boolean;
    onElementMouseDown: (e: React.MouseEvent, elId: string) => void;
    onResizeMouseDown: (e: React.MouseEvent, elId: string, handle: string) => void;
  }) => {
    const isSelected = selectedId === el.id;
    if (!el.visible) return null;
    const locked = el.locked || ancestorLocked;
    return (
      <div
        key={el.id}
        data-element
        data-element-id={el.id}
        className={cn(
          "absolute select-none",
          isSelected && !previewing && "z-50",
          previewing && "pointer-events-none",
          locked && "cursor-default opacity-60",
          !locked && interaction?.id !== el.id && "cursor-move",
        )}
        style={{
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          opacity: el.opacity,
          transform: `rotate(${el.rotation}deg)`,
        }}
        onMouseDown={(e) => onElementMouseDown(e, el.id)}
      >
        {el.type === "frame" && isSelected && !previewing && (
          <div
            className="pointer-events-none absolute -top-6 left-0 z-20 max-w-full truncate rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs"
          >
            {el.name}
          </div>
        )}
        <ElementRenderer element={el}>
          {el.type === "frame" &&
            el.children.map((child) => (
              <ElementNode
                key={child.id}
                el={child}
                ancestorLocked={locked}
                interaction={interaction}
                isPanning={isPanning}
                spaceHeld={spaceHeld}
                onElementMouseDown={onElementMouseDown}
                onResizeMouseDown={onResizeMouseDown}
              />
            ))}
        </ElementRenderer>
        {isSelected && !locked && !previewing && (
          <>
            <div className="pointer-events-none absolute -inset-1 rounded-md ring-2 ring-orange-400 ring-offset-1 transition-all duration-200 ease-apple animate-fade-in" data-handle />
            {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((h) => (
              <div
                key={h}
                data-handle
                className="absolute z-10 size-3 rounded-full border-2 border-orange-400 bg-white shadow-xs"
                style={{
                  [h.includes("n") ? "top" : "bottom"]: -6,
                  [h.includes("w") ? "left" : "right"]: -6,
                  cursor: `${h}-resize`,
                }}
                onMouseDown={(e) => onResizeMouseDown(e, el.id, h)}
              />
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative flex-1 overflow-hidden bg-muted outline-none",
        (spaceHeld || activeTool === "hand") && "cursor-grab",
        isPanning && "cursor-grabbing",
        !spaceHeld && activeTool === "select" && "cursor-pointer",
        (activeTool === "frame" || activeTool === "rectangle" || activeTool === "text") && "cursor-crosshair",
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      tabIndex={0}
      data-canvas
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {showGrid && (
          <svg
            className="pointer-events-none absolute inset-0"
            width={2000}
            height={2000}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" className="stroke-[var(--color-border)]" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}

        <div
          ref={contentRef}
          className="relative"
          style={{ width: 2000, height: 2000 }}
          data-canvas-area
        >
          {elements
            .filter((el) => !el.parentId || !elements.some((p) => p.id === el.parentId))
            .map((el) => (
              <ElementNode
                key={el.id}
                el={el}
                ancestorLocked={false}
                interaction={interaction}
                isPanning={isPanning}
                spaceHeld={spaceHeld}
                onElementMouseDown={handleElementMouseDown}
                onResizeMouseDown={handleResizeMouseDown}
              />
            ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 rounded-lg border bg-background px-2.5 py-1 text-xs text-muted-foreground shadow-xs">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
