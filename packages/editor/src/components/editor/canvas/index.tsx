"use client";

import { useRef, useCallback, useState, useEffect, useMemo, memo } from "react";
import type { AnchorPort, ComponentType, EditorElement } from "../types";
import { cn } from "@bluepen/editor/lib/utils";
import { Lock } from "lucide-react";
import { ElementRenderer } from "./elements/index";
import {
  calculateSnapping,
  calculateResizeSnapping,
  calculateAltMeasurements,
  calculateEndpointSnapping,
  calculateLineMoveSnapping,
  type SnapGuideLine,
  type SnapIndicatorPoint,
} from "./snap-engine";
import { hexToRgba } from "../utils/shape-styles";
import {
  getElementAnchor,
  getClosestAnchorOnElement,
  findNearestSnapAnchor,
  calculateOrthogonalPath,
  calculateStraightPath,
  calculateCurvedPath,
  getElementDynamicBounds,
  getElementWorldBounds,
  ANCHOR_PORTS,
  PORT_LABELS,
  getOrthogonalSegments,
  moveOrthogonalSegment,
  adaptCustomWaypoints,
  buildRoundedSvgPath,
  calculatePolylineMidpoint,
  type AnchorInfo,
  type Point,
  type Vector,
  type Rect,
} from "./connector-utils";

interface CanvasProps {
  elements: EditorElement[];
  selectedId: string | null;
  selectedIds?: string[];
  showGrid: boolean;
  activeTool: string;
  zoom: number;
  previewing: boolean;
  onZoomChange: (zoom: number) => void;
  onSelect: (id: string | null) => void;
  onSelectIds?: (ids: string[]) => void;
  onSelectTool?: (tool: string) => void;
  onUpdateElement: (id: string, patch: Partial<EditorElement>) => void;
  onBatchUpdateElements?: (patches: Array<{ id: string; patch: Partial<EditorElement> }>) => void;
  onCreateElement?: (
    type: ComponentType,
    x: number,
    y: number,
    width?: number,
    height?: number,
    rotation?: number,
    parentId?: string | null,
    props?: Record<string, string | number | boolean>,
  ) => void;
  onCommitMove: () => void;
  onDelete: () => void;
  onCanvasClick: (e: React.MouseEvent, canvasX: number, canvasY: number) => void;
  onCanvasPointerMove?: (pos: { x: number; y: number }) => void;
  onContextMenu?: (e: React.MouseEvent, canvasPos: { x: number; y: number }) => void;
  onDropAsset?: (
    type: ComponentType,
    x: number,
    y: number,
    customProps?: Record<string, string | number | boolean>,
    width?: number,
    height?: number,
    label?: string,
  ) => void;
  onDropFile?: (file: File, x: number, y: number) => void;
}

const GRID_SIZE = 20;

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

function createRotateCursorSvg(arcPath: string, arrow1Path: string, arrow2Path: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'><path d='${arcPath}' stroke='%23000000' stroke-width='3.5' stroke-linecap='round'/><path d='${arcPath}' stroke='%23FFFFFF' stroke-width='1.5' stroke-linecap='round'/><path d='${arrow1Path}' fill='%23000000' stroke='%23FFFFFF' stroke-width='1' stroke-linejoin='round'/><path d='${arrow2Path}' fill='%23000000' stroke='%23FFFFFF' stroke-width='1' stroke-linejoin='round'/></svg>`;
  return `url("data:image/svg+xml,${svg}") 12 12, crosshair`;
}

const ROTATE_CURSORS = {
  nw: createRotateCursorSvg("M 4 12 A 8 8 0 0 1 12 4", "M 8.5 1.5 L 14 4 L 8.5 6.5 Z", "M 1.5 8.5 L 4 14 L 6.5 8.5 Z"),
  ne: createRotateCursorSvg("M 12 4 A 8 8 0 0 1 20 12", "M 15.5 1.5 L 10 4 L 15.5 6.5 Z", "M 17.5 8.5 L 20 14 L 22.5 8.5 Z"),
  se: createRotateCursorSvg("M 20 12 A 8 8 0 0 1 12 20", "M 17.5 15.5 L 20 10 L 22.5 15.5 Z", "M 15.5 17.5 L 10 20 L 15.5 22.5 Z"),
  sw: createRotateCursorSvg("M 12 20 A 8 8 0 0 1 4 12", "M 8.5 17.5 L 14 20 L 8.5 22.5 Z", "M 1.5 15.5 L 4 10 L 6.5 15.5 Z"),
};

type Interaction =
  | {
      type: "move";
      id: string;
      startX: number;
      startY: number;
      elStartX: number;
      elStartY: number;
      elW: number;
      elH: number;
    }
  | {
      type: "multi-move";
      startX: number;
      startY: number;
      initialPositions: Array<{ id: string; x: number; y: number; width: number; height: number }>;
      combinedBounds: { x: number; y: number; width: number; height: number };
    }
  | {
      type: "marquee";
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      shiftHeld: boolean;
      initialSelected: string[];
      containerClickTargetId?: string;
      lockedClickTargetId?: string;
    }
  | {
      type: "resize";
      id: string;
      handle: string;
      startX: number;
      startY: number;
      elStartX: number;
      elStartY: number;
      elW: number;
      elH: number;
      aspectRatio: number;
    }
  | {
      type: "rotate";
      id: string;
      startX: number;
      startY: number;
      centerX: number;
      centerY: number;
      startRotation: number;
      startAngle: number;
      currentRotation?: number;
      corner?: "nw" | "ne" | "se" | "sw";
    }
  | {
      type: "corner-radius";
      id: string;
      corner: "nw" | "ne" | "se" | "sw";
      startX: number;
      startY: number;
      startRadius: number;
      elW: number;
      elH: number;
      rotation?: number;
      props: Record<string, string | number | boolean>;
    }
  | {
      type: "line-endpoint";
      id: string;
      endpoint: "start" | "end";
      startX: number;
      startY: number;
      elStartX: number;
      elStartY: number;
      elW: number;
      elH: number;
      elRotation: number;
      fixedPoint: { x: number; y: number };
    }
  | {
      type: "create-drag";
      tool: ComponentType;
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      parentId: string | null;
    }
  | {
      type: "create-connector";
      startElementId: string | null;
      startPort: AnchorPort | null;
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      targetElementId: string | null;
      targetPort: AnchorPort | null;
    }
  | {
      type: "connector-endpoint";
      id: string;
      endpoint: "start" | "end";
      fixedPoint: { x: number; y: number };
      fixedElementId: string | null;
      fixedPort: AnchorPort | null;
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      targetElementId: string | null;
      targetPort: AnchorPort | null;
    }
  | {
      type: "connector-segment";
      id: string;
      segmentIndex: number;
      isVertical: boolean;
      initialWaypoints: Point[];
      startX: number;
      startY: number;
      startPos: number;
    };

function rectsIntersect(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number },
) {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

const CONTAINER_TYPES: Set<ComponentType> = new Set([
  "card",
  "web-card",
  "mobile-frame",
  "browser-frame",
  "scroll-panel",
  "modal-dialog",
  "web-admin-layout",
  "web-dashboard-page",
  "web-settings-page",
  "web-form-layout",
  "agent-home-layout",
  "agent-chat-stream-layout",
  "agent-split-workspace-layout",
  "agent-employee-workspace-layout",
  "agent-employee-market-layout",
  "agent-employee-card",
  "agent-template-card",
  "sidebar",
  "header",
  "footer",
]);

export function isElementLocked(el: EditorElement, allElementsFlat?: EditorElement[]): boolean {
  if (el.locked) return true;
  if (!allElementsFlat || !el.parentId) return false;
  let curr = el;
  const visited = new Set<string>();
  while (curr.parentId) {
    if (visited.has(curr.parentId)) break;
    visited.add(curr.parentId);
    const parent = allElementsFlat.find((p) => p.id === curr.parentId);
    if (!parent) break;
    if (parent.locked) return true;
    curr = parent;
  }
  return false;
}

export function isContainerElement(el: EditorElement): boolean {
  return (
    el.type !== "group" &&
    (CONTAINER_TYPES.has(el.type) ||
      (Boolean(el.children) && el.children.length > 0))
  );
}

function isRectEnclosedIn(
  inner: { x: number; y: number; width: number; height: number },
  outer: { x: number; y: number; width: number; height: number },
  tolerance = 6,
): boolean {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

/**
 * Filters out any element IDs whose ancestors are also present in the given ID list.
 * This guarantees that selecting a container never simultaneously selects its internal children.
 */
export function filterOutDescendantIds(
  ids: string[],
  allElementsFlat: EditorElement[],
): string[] {
  if (!ids || ids.length <= 1) return ids;
  const idSet = new Set(ids);
  const elementMap = new Map(allElementsFlat.map((el) => [el.id, el]));

  return ids.filter((id) => {
    let curr = elementMap.get(id);
    if (!curr) return true;
    const visited = new Set<string>([id]);
    while (curr && curr.parentId) {
      if (visited.has(curr.parentId)) break;
      visited.add(curr.parentId);
      if (idSet.has(curr.parentId)) {
        return false;
      }
      curr = elementMap.get(curr.parentId);
    }
    return true;
  });
}

/**
 * Filters out any elements whose ancestors are also present in the given element list.
 */
export function filterOutDescendantElements(
  elementsList: EditorElement[],
  allElementsFlat: EditorElement[],
): EditorElement[] {
  if (!elementsList || elementsList.length <= 1) return elementsList;
  const idSet = new Set(elementsList.map((el) => el.id));
  const elementMap = new Map(allElementsFlat.map((el) => [el.id, el]));

  return elementsList.filter((el) => {
    let curr = el;
    const visited = new Set<string>([el.id]);
    while (curr && curr.parentId) {
      if (visited.has(curr.parentId)) break;
      visited.add(curr.parentId);
      if (idSet.has(curr.parentId)) {
        return false;
      }
      curr = elementMap.get(curr.parentId)!;
    }
    return true;
  });
}

export function getMarqueeHitElementIds(
  marqueeBox: { x: number; y: number; width: number; height: number },
  allElementsFlat: EditorElement[],
  options?: {
    containerClickTargetId?: string | null;
    isDeepSelect?: boolean;
  },
): string[] {
  // 1. First find all candidate visible, non-locked elements that intersect the marquee
  const candidates = allElementsFlat.filter((el) => {
    if (!el.visible || isElementLocked(el, allElementsFlat)) return false;
    const bounds = getElementDynamicBounds(el, allElementsFlat);
    return rectsIntersect(marqueeBox, bounds);
  });

  if (candidates.length === 0) return [];

  // 2. Identify enclosing background containers (containers that completely enclose the marqueeBox or inside which drag started)
  const marqueeArea = marqueeBox.width * marqueeBox.height;
  const enclosingContainerIds = new Set<string>();

  if (options?.containerClickTargetId) {
    enclosingContainerIds.add(options.containerClickTargetId);
  }

  for (const el of candidates) {
    if (el.type !== "group" && isContainerElement(el)) {
      const bounds = getElementDynamicBounds(el, allElementsFlat);
      const containerArea = bounds.width * bounds.height;
      if (
        isRectEnclosedIn(marqueeBox, bounds, 8) &&
        marqueeArea < containerArea * 0.95
      ) {
        enclosingContainerIds.add(el.id);
      }
    }
  }

  // 3. Filter out enclosing background containers
  const activeCandidates = candidates.filter((el) => !enclosingContainerIds.has(el.id));
  if (activeCandidates.length === 0) return [];

  // 4. Deep Select Mode (Cmd / Ctrl held): Prefer leaf components over their container groups
  if (options?.isDeepSelect) {
    const leafOnly = activeCandidates.filter((el) => {
      if (isContainerElement(el)) {
        // If any hit candidate has this container as an ancestor, drop the container in favor of the inner child
        return !activeCandidates.some((other) => {
          let curr = other;
          const visited = new Set<string>([other.id]);
          while (curr && curr.parentId) {
            if (visited.has(curr.parentId)) break;
            visited.add(curr.parentId);
            if (curr.parentId === el.id) return true;
            curr = allElementsFlat.find((p) => p.id === curr.parentId)!;
          }
          return false;
        });
      }
      return true;
    });
    return leafOnly.map((el) => el.id);
  }

  // 5. Standard Mode: Hierarchy-aware top-level selection (groups are atomic units)
  const candidateIds = activeCandidates.map((el) => {
    let curr = el;
    let groupAncestor: EditorElement | null = null;
    const visited = new Set<string>([el.id]);
    while (curr.parentId) {
      if (visited.has(curr.parentId)) break;
      visited.add(curr.parentId);
      const parent = allElementsFlat.find((p) => p.id === curr.parentId);
      if (!parent) break;
      if (parent.type === "group") {
        groupAncestor = parent;
      }
      curr = parent;
    }
    return groupAncestor ? groupAncestor.id : el.id;
  });

  return filterOutDescendantIds(Array.from(new Set(candidateIds)), allElementsFlat);
}

function flattenElements(list: EditorElement[]): EditorElement[] {
  const result: EditorElement[] = [];
  for (const el of list) {
    result.push(el);
    if (el.children && el.children.length > 0) {
      result.push(...flattenElements(el.children));
    }
  }
  return result;
}

const SmartGuidesOverlay = memo(function SmartGuidesOverlay({
  guides,
  indicator,
  zoom,
}: {
  guides: SnapGuideLine[];
  indicator?: SnapIndicatorPoint | null;
  zoom: number;
}) {
  if ((!guides || guides.length === 0) && !indicator) return null;

  return (
    <div className="pointer-events-none absolute top-0 left-0 overflow-visible z-[50]">
      <svg className="overflow-visible" style={{ position: "absolute", left: 0, top: 0, width: 1, height: 1 }}>
        {guides.map((g) => {
          const color =
            g.color === "red"
              ? "var(--accent)"
              : g.color === "blue"
              ? "var(--primary)"
              : "var(--accent)";

          if (g.type === "vertical") {
            return (
              <line
                key={g.id}
                x1={g.position}
                y1={g.start}
                x2={g.position}
                y2={g.end}
                stroke={color}
                strokeWidth={Math.max(1, 1 / zoom)}
                strokeDasharray={g.color === "pink" ? undefined : "3 3"}
              />
            );
          } else {
            return (
              <line
                key={g.id}
                x1={g.start}
                y1={g.position}
                x2={g.end}
                y2={g.position}
                stroke={color}
                strokeWidth={Math.max(1, 1 / zoom)}
                strokeDasharray={g.color === "pink" ? undefined : "3 3"}
              />
            );
          }
        })}

        {/* Magnetic Snap Point Indicator */}
        {indicator && (
          <g transform={`translate(${indicator.x}, ${indicator.y})`}>
            {indicator.type === "anchor" ? (
              <>
                <circle
                  r={10 / Math.max(0.5, zoom)}
                  fill="rgba(37, 99, 235, 0.25)"
                  stroke="#2563EB"
                  strokeWidth={2 / Math.max(0.5, zoom)}
                />
                <circle
                  r={4 / Math.max(0.5, zoom)}
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth={1.5 / Math.max(0.5, zoom)}
                />
              </>
            ) : (
              <>
                {/* Outer halo ring */}
                <circle
                  r={8 / Math.max(0.5, zoom)}
                  fill="rgba(215, 25, 33, 0.2)"
                  stroke="var(--accent)"
                  strokeWidth={1.5 / Math.max(0.5, zoom)}
                />
                {/* Core anchor dot */}
                <circle
                  r={3 / Math.max(0.5, zoom)}
                  fill="var(--accent)"
                  stroke="var(--background)"
                  strokeWidth={1 / Math.max(0.5, zoom)}
                />
              </>
            )}
          </g>
        )}
      </svg>

      {/* Numerical measurement labels */}
      {guides
        .filter((g) => g.label && g.labelPosition)
        .map((g) => (
          <div
            key={`lbl-${g.id}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-2xs px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent bg-surface shadow-xs border border-accent/40 leading-none select-none"
            style={{
              left: g.labelPosition!.x,
              top: g.labelPosition!.y,
            }}
          >
            {g.label}
          </div>
        ))}
    </div>
  );
});

/**
 * Renders the marquee multi-selection box when dragging on empty canvas space.
 */
const MarqueeSelectionOverlay = memo(function MarqueeSelectionOverlay({
  interaction,
}: {
  interaction: Interaction | null;
}) {
  if (!interaction || interaction.type !== "marquee") return null;

  const { startX, startY, currentX, currentY } = interaction;
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  if (width < 2 && height < 2) return null;

  return (
    <div
      className="pointer-events-none absolute z-[40] border border-dashed border-primary bg-primary/10 select-none"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
});

/**
 * Renders the live creation preview ghost when clicking and dragging a new shape or connector on the canvas.
 */
const DrawingPreviewOverlay = memo(function DrawingPreviewOverlay({
  interaction,
  allElementsFlat,
  zoom,
}: {
  interaction: Interaction | null;
  allElementsFlat: EditorElement[];
  zoom: number;
}) {
  if (!interaction) return null;

  // Live Connector Drag Preview
  if (interaction.type === "create-connector" || interaction.type === "connector-endpoint") {
    let startPoint: Point;
    let startDir: Vector | undefined;
    let startBox: Rect | undefined;
    let endPoint: Point;
    let endDir: Vector | undefined;
    let endBox: Rect | undefined;

    if (interaction.type === "create-connector") {
      const startEl = interaction.startElementId ? allElementsFlat.find((e) => e.id === interaction.startElementId) : null;
      if (startEl && interaction.startPort) {
        const anchor = getElementAnchor(startEl, interaction.startPort, allElementsFlat);
        startPoint = anchor.point;
        startDir = anchor.dir;
        startBox = getElementWorldBounds(startEl, allElementsFlat);
      } else {
        startPoint = { x: interaction.startX, y: interaction.startY };
      }

      const targetEl = interaction.targetElementId ? allElementsFlat.find((e) => e.id === interaction.targetElementId) : null;
      if (targetEl && interaction.targetPort) {
        const anchor = getElementAnchor(targetEl, interaction.targetPort, allElementsFlat);
        endPoint = anchor.point;
        endDir = anchor.dir;
        endBox = getElementWorldBounds(targetEl, allElementsFlat);
      } else {
        endPoint = { x: interaction.currentX, y: interaction.currentY };
      }
    } else {
      // connector-endpoint repositioning
      const isStart = interaction.endpoint === "start";
      if (isStart) {
        const targetEl = interaction.targetElementId ? allElementsFlat.find((e) => e.id === interaction.targetElementId) : null;
        if (targetEl && interaction.targetPort) {
          const anchor = getElementAnchor(targetEl, interaction.targetPort, allElementsFlat);
          startPoint = anchor.point;
          startDir = anchor.dir;
          startBox = getElementWorldBounds(targetEl, allElementsFlat);
        } else {
          startPoint = { x: interaction.currentX, y: interaction.currentY };
        }
        endPoint = interaction.fixedPoint;
        const fixEl = interaction.fixedElementId ? allElementsFlat.find((e) => e.id === interaction.fixedElementId) : null;
        if (fixEl && interaction.fixedPort) {
          endDir = getElementAnchor(fixEl, interaction.fixedPort, allElementsFlat).dir;
          endBox = getElementWorldBounds(fixEl, allElementsFlat);
        }
      } else {
        startPoint = interaction.fixedPoint;
        const fixEl = interaction.fixedElementId ? allElementsFlat.find((e) => e.id === interaction.fixedElementId) : null;
        if (fixEl && interaction.fixedPort) {
          startDir = getElementAnchor(fixEl, interaction.fixedPort, allElementsFlat).dir;
          startBox = getElementWorldBounds(fixEl, allElementsFlat);
        }
        const targetEl = interaction.targetElementId ? allElementsFlat.find((e) => e.id === interaction.targetElementId) : null;
        if (targetEl && interaction.targetPort) {
          const anchor = getElementAnchor(targetEl, interaction.targetPort, allElementsFlat);
          endPoint = anchor.point;
          endDir = anchor.dir;
          endBox = getElementWorldBounds(targetEl, allElementsFlat);
        } else {
          endPoint = { x: interaction.currentX, y: interaction.currentY };
        }
      }
    }

    const { d } = calculateOrthogonalPath(
      { point: startPoint, dir: startDir, box: startBox },
      { point: endPoint, dir: endDir, box: endBox },
      8,
    );

    return (
      <svg
        className="pointer-events-none absolute top-0 left-0 overflow-visible z-[50]"
        style={{ width: 1, height: 1 }}
      >
        <defs>
          <marker id="live-conn-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M 1 1 L 7 4 L 1 7 Z" fill="#2563EB" />
          </marker>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="#2563EB"
          strokeWidth={Math.max(1.5, 1.5 / zoom)}
          strokeDasharray="4 4"
          markerEnd="url(#live-conn-arrow)"
        />
        <circle cx={startPoint.x} cy={startPoint.y} r={4.5 / Math.max(0.5, zoom)} fill="#2563EB" stroke="#FFFFFF" strokeWidth={1.5} />
        <circle cx={endPoint.x} cy={endPoint.y} r={4.5 / Math.max(0.5, zoom)} fill="#2563EB" stroke="#FFFFFF" strokeWidth={1.5} />
      </svg>
    );
  }

  if (interaction.type !== "create-drag") return null;

  const { tool, startX, startY, currentX, currentY } = interaction;
  const isLineLike = tool === "line" || tool === "arrow";

  if (isLineLike) {
    const diffX = currentX - startX;
    const diffY = currentY - startY;
    const len = Math.max(1, Math.round(Math.sqrt(diffX * diffX + diffY * diffY)));
    const angle = Math.round((Math.atan2(diffY, diffX) * 180) / Math.PI);

    return (
      <div className="pointer-events-none absolute inset-0 z-40">
        <div
          className="absolute h-0 origin-left border-t-2 border-dashed border-blue-500"
          style={{
            left: startX,
            top: startY,
            width: len,
            transform: `rotate(${angle}deg)`,
          }}
        >
          <div className="absolute -left-1 -top-1.5 size-3 rounded-full border-2 border-blue-500 bg-white shadow-xs" />
          <div className="absolute -right-1 -top-1.5 size-3 rounded-full border-2 border-blue-500 bg-white shadow-xs" />
          <div className="absolute left-1/2 -top-6 -translate-x-1/2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-md">
            {len}px · {angle}°
          </div>
        </div>
      </div>
    );
  }

  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.max(1, Math.round(Math.abs(currentX - startX)));
  const height = Math.max(1, Math.round(Math.abs(currentY - startY)));
  const isCircle = tool === "circle";

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      <div
        className={cn(
          "absolute border-2 border-dashed border-blue-500 bg-blue-500/10 shadow-sm",
          isCircle ? "rounded-full" : "rounded-sm",
        )}
        style={{
          left,
          top,
          width,
          height,
        }}
      >
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-md">
          {width} × {height}
        </div>
      </div>
    </div>
  );
});

/**
 * Dedicated layer rendering all smart reactive connector lines.
 */
const ConnectorLinesLayer = memo(function ConnectorLinesLayer({
  connectors,
  allElementsFlat,
  selectedIds,
  zoom,
  previewing,
  onSelect,
  onSelectIds,
  onStartEndpointDrag,
  onStartSegmentDrag,
}: {
  connectors: EditorElement[];
  allElementsFlat: EditorElement[];
  selectedIds: string[];
  zoom: number;
  previewing: boolean;
  onSelect: (id: string | null) => void;
  onSelectIds?: (ids: string[]) => void;
  onStartEndpointDrag: (e: React.MouseEvent, connector: EditorElement, endpoint: "start" | "end") => void;
  onStartSegmentDrag?: (
    e: React.MouseEvent,
    connector: EditorElement,
    segmentIndex: number,
    isVertical: boolean,
    currentWaypoints: Point[],
    startPos: number,
  ) => void;
}) {
  if (!connectors || connectors.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 overflow-visible z-[5]"
      style={{ width: 1, height: 1 }}
    >
      <defs>
        {connectors.map((c) => {
          const stroke = String(c.props.stroke || "#71717A");
          return (
            <g key={`defs-${c.id}`}>
              <marker id={`arrow-end-${c.id}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 1 1 L 7 4 L 1 7 Z" fill={stroke} />
              </marker>
              <marker id={`arrow-start-${c.id}`} markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
                <path d="M 7 1 L 1 4 L 7 7 Z" fill={stroke} />
              </marker>
              <marker id={`circle-${c.id}`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <circle cx="4" cy="4" r="3" fill={stroke} />
              </marker>
            </g>
          );
        })}
      </defs>

      {connectors.map((c) => {
        if (!c.visible) return null;
        const isSelected = selectedIds.includes(c.id);

        const startEl = c.props.startElementId ? allElementsFlat.find((e) => e.id === c.props.startElementId) : null;
        const endEl = c.props.endElementId ? allElementsFlat.find((e) => e.id === c.props.endElementId) : null;

        let startPt: Point;
        let startDir: Vector | undefined;
        let startBox: Rect | undefined;
        let endPt: Point;
        let endDir: Vector | undefined;
        let endBox: Rect | undefined;

        if (startEl) {
          const anchor = getElementAnchor(startEl, (c.props.startPort as AnchorPort) || "right", allElementsFlat);
          startPt = anchor.point;
          startDir = anchor.dir;
          startBox = getElementWorldBounds(startEl, allElementsFlat);
        } else {
          startPt = { x: Number(c.props.startPointX ?? c.x), y: Number(c.props.startPointY ?? c.y) };
        }

        if (endEl) {
          const anchor = getElementAnchor(endEl, (c.props.endPort as AnchorPort) || "left", allElementsFlat);
          endPt = anchor.point;
          endDir = anchor.dir;
          endBox = getElementWorldBounds(endEl, allElementsFlat);
        } else {
          endPt = { x: Number(c.props.endPointX ?? c.x + c.width), y: Number(c.props.endPointY ?? c.y + c.height) };
        }

        const routing = String(c.props.routing || "orthogonal");
        const radius = Number(c.props.radius ?? 8);

        let customPts: Point[] | null = null;
        if (c.props.customWaypoints && typeof c.props.customWaypoints === "string") {
          try {
            const parsed = JSON.parse(c.props.customWaypoints);
            if (Array.isArray(parsed) && parsed.length >= 2) {
              customPts = parsed;
            }
          } catch {}
        }

        let d: string;
        let midpoint: Point;
        let waypoints: Point[];

        if (routing === "straight") {
          const res = calculateStraightPath({ point: startPt }, { point: endPt });
          d = res.d;
          midpoint = res.midpoint;
          waypoints = res.waypoints;
        } else if (routing === "curved") {
          const res = calculateCurvedPath({ point: startPt, dir: startDir }, { point: endPt, dir: endDir });
          d = res.d;
          midpoint = res.midpoint;
          waypoints = res.waypoints;
        } else {
          if (customPts) {
            const adapted = adaptCustomWaypoints(customPts, startPt, endPt);
            d = buildRoundedSvgPath(adapted, radius);
            midpoint = calculatePolylineMidpoint(adapted);
            waypoints = adapted;
          } else {
            const res = calculateOrthogonalPath(
              { point: startPt, dir: startDir, box: startBox },
              { point: endPt, dir: endDir, box: endBox },
              radius,
            );
            d = res.d;
            midpoint = res.midpoint;
            waypoints = res.waypoints;
          }
        }

        const stroke = String(c.props.stroke || "#71717A");
        const borderWidth = Number(c.props.borderWidth ?? 1.5);
        const strokeStyle = String(c.props.strokeStyle || "solid");
        const strokeDasharray = strokeStyle === "dashed" ? "5 4" : strokeStyle === "dotted" ? "2 3" : undefined;
        const startArrow = String(c.props.startArrow || "none");
        const endArrow = String(c.props.endArrow || "arrow");
        const text = String(c.props.text || "");

        const handleSelectConnector = (e: React.MouseEvent) => {
          if (previewing) return;
          e.stopPropagation();
          if (e.shiftKey && onSelectIds) {
            const next = selectedIds.includes(c.id)
              ? selectedIds.filter((id) => id !== c.id)
              : [...selectedIds, c.id];
            onSelectIds(next);
          } else {
            onSelect(c.id);
            onSelectIds?.([c.id]);
          }
        };

        const scaleFactor = Math.max(0.5, zoom);

        return (
          <g
            key={c.id}
            data-element
            data-element-id={c.id}
            className="group pointer-events-auto cursor-pointer select-none"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleSelectConnector}
          >
            {/* Wide transparent hit path for easy clicking & selection */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(20, 20 / zoom)}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="cursor-pointer"
            />

            {/* Selection Halo Glow */}
            {isSelected && !previewing && (
              <path
                d={d}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={borderWidth + 4}
                strokeOpacity={0.35}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none"
              />
            )}

            {/* Main Visible Connector Path */}
            <path
              d={d}
              fill="none"
              stroke={isSelected ? "#2563EB" : stroke}
              strokeWidth={borderWidth}
              strokeDasharray={strokeDasharray}
              markerStart={startArrow === "arrow" ? `url(#arrow-start-${c.id})` : startArrow === "circle" ? `url(#circle-${c.id})` : undefined}
              markerEnd={endArrow === "arrow" ? `url(#arrow-end-${c.id})` : endArrow === "circle" ? `url(#circle-${c.id})` : undefined}
              className="pointer-events-none transition-colors group-hover:stroke-blue-500"
            />

            {/* Midpoint Text Label */}
            {text && (
              <g
                transform={`translate(${midpoint.x}, ${midpoint.y})`}
                className="pointer-events-auto cursor-pointer"
                onMouseDown={handleSelectConnector}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onSelect(c.id);
                  onSelectIds?.([c.id]);
                  setTimeout(() => {
                    const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                      "aside input:not([type='color']):not([type='checkbox']), aside textarea"
                    );
                    if (input) {
                      input.focus();
                      input.select?.();
                    }
                  }, 60);
                }}
              >
                <rect
                  x={-((text.length * 10 + 14) / 2)}
                  y={-11}
                  width={text.length * 10 + 14}
                  height={22}
                  rx={4}
                  fill="#FFFFFF"
                  stroke="#E4E4E7"
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={3.5}
                  textAnchor="middle"
                  fill="#3F3F46"
                  fontSize={11}
                  fontWeight={500}
                  className="select-none pointer-events-none font-sans"
                >
                  {text}
                </text>
              </g>
            )}

            {/* Orthogonal Segment Drag Handles (for segment shifting / waypoints) */}
            {isSelected && !previewing && !c.locked && routing === "orthogonal" && onStartSegmentDrag && (
              <g className="pointer-events-auto">
                {getOrthogonalSegments(waypoints)
                  .filter((seg) => seg.length >= 14)
                  .map((seg) => {
                    const handleW = (seg.isVertical ? 6 : 14) / scaleFactor;
                    const handleH = (seg.isVertical ? 14 : 6) / scaleFactor;
                    const handleRx = 2.5 / scaleFactor;
                    const strokeW = 1 / scaleFactor;
                    const cursor = seg.isVertical ? "ew-resize" : "ns-resize";
                    const hitPad = 8 / scaleFactor;
                    const hitW = handleW + hitPad;
                    const hitH = handleH + hitPad;

                    return (
                      <g
                        key={`seg-${seg.index}`}
                        className="group/segment pointer-events-auto select-none"
                        style={{ cursor }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onStartSegmentDrag(
                            e,
                            c,
                            seg.index,
                            seg.isVertical,
                            waypoints,
                            seg.isVertical ? seg.mid.x : seg.mid.y,
                          );
                        }}
                      >
                        {/* Invisible generous hit target to ensure stable and smooth grabbing */}
                        <rect
                          x={seg.mid.x - hitW / 2}
                          y={seg.mid.y - hitH / 2}
                          width={hitW}
                          height={hitH}
                          fill="transparent"
                          stroke="transparent"
                          style={{ cursor }}
                        />
                        {/* Crisp visible pill handle without jumping scale transforms */}
                        <rect
                          x={seg.mid.x - handleW / 2}
                          y={seg.mid.y - handleH / 2}
                          width={handleW}
                          height={handleH}
                          rx={handleRx}
                          fill="#2563EB"
                          stroke="#FFFFFF"
                          strokeWidth={strokeW}
                          className="pointer-events-none transition-colors group-hover/segment:fill-blue-500"
                        />
                        <title>{seg.isVertical ? "拖动平移垂直线段" : "拖动平移水平线段"}</title>
                      </g>
                    );
                  })}
              </g>
            )}

            {/* Reconnection Endpoint Handles */}
            {isSelected && !previewing && !c.locked && (
              <>
                <g
                  className="group/endpoint pointer-events-auto select-none cursor-crosshair"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onStartEndpointDrag(e, c, "start");
                  }}
                >
                  <circle
                    cx={startPt.x}
                    cy={startPt.y}
                    r={10 / scaleFactor}
                    fill="transparent"
                    stroke="transparent"
                    className="cursor-crosshair"
                  />
                  <circle
                    cx={startPt.x}
                    cy={startPt.y}
                    r={5 / scaleFactor}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth={2 / scaleFactor}
                    className="pointer-events-none transition-colors group-hover/endpoint:fill-blue-500"
                  />
                  <title>重新连接起点</title>
                </g>
                <g
                  className="group/endpoint pointer-events-auto select-none cursor-crosshair"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onStartEndpointDrag(e, c, "end");
                  }}
                >
                  <circle
                    cx={endPt.x}
                    cy={endPt.y}
                    r={10 / scaleFactor}
                    fill="transparent"
                    stroke="transparent"
                    className="cursor-crosshair"
                  />
                  <circle
                    cx={endPt.x}
                    cy={endPt.y}
                    r={5 / scaleFactor}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth={2 / scaleFactor}
                    className="pointer-events-none transition-colors group-hover/endpoint:fill-blue-500"
                  />
                  <title>重新连接终点</title>
                </g>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
});

/**
 * Unified multi-selection bounding box (Image 2 style)
 * Pointer events are strictly NONE so it never intercepts clicks on underlying elements or canvas.
 */
const MultiSelectionBoundingBox = memo(function MultiSelectionBoundingBox({
  selectedElements,
  allElementsFlat,
}: {
  selectedElements: EditorElement[];
  allElementsFlat: EditorElement[];
}) {
  const topLevelSelected = useMemo(() => {
    return filterOutDescendantElements(selectedElements, allElementsFlat);
  }, [selectedElements, allElementsFlat]);

  if (topLevelSelected.length <= 1) return null;

  const boundsList = topLevelSelected.map((e) => getElementDynamicBounds(e, allElementsFlat));
  const minX = Math.min(...boundsList.map((b) => b.x));
  const minY = Math.min(...boundsList.map((b) => b.y));
  const maxX = Math.max(...boundsList.map((b) => b.x + b.width));
  const maxY = Math.max(...boundsList.map((b) => b.y + b.height));

  const width = maxX - minX;
  const height = maxY - minY;

  return (
    <div
      className="pointer-events-none absolute z-30 border border-blue-500/80 select-none"
      style={{
        left: minX,
        top: minY,
        width,
        height,
      }}
    >
      <div className="pointer-events-none absolute -bottom-5 right-0 flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-xs select-none">
        <span>{topLevelSelected.length} 项已选中</span>
      </div>
    </div>
  );
});

interface InlineTextEditorProps {
  element: EditorElement;
  zoom: number;
  onUpdateText: (newText: string) => void;
  onFinish: () => void;
}

function InlineTextEditor({ element, zoom, onUpdateText, onFinish }: InlineTextEditorProps) {
  const isButton =
    element.type === "button" ||
    element.type === "button-primary" ||
    element.type === "web-button";
  const defaultText =
    element.type === "button"
      ? "次要操作"
      : element.type === "button-primary" || element.type === "web-button"
      ? "主要操作"
      : "";
  const textProp = String(element.props.text ?? (element.type === "text" ? "" : defaultText));
  const [localText, setLocalText] = useState(textProp);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const finishCalledRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      // Select all text on double click edit
      const len = textarea.value.length;
      textarea.setSelectionRange(0, len);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setLocalText(nextVal);
    onUpdateText(nextVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      handleFinish();
    } else if (isButton && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFinish();
    } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleFinish();
    }
  };

  const defaultTextColor =
    element.type === "button-primary"
      ? "var(--primary-foreground)"
      : "var(--foreground)";
  const textColor = String(element.props.textColor || defaultTextColor);
  const textOpacity = Number(element.props.textOpacity ?? 100);
  const color = textColor.startsWith("#") ? hexToRgba(textColor, textOpacity) : textColor;
  const fontSize = Number(element.props.fontSize || (isButton ? 12 : 14));
  const fontWeight = Number(
    element.props.fontWeight || (element.type === "button-primary" ? 600 : isButton ? 500 : 400)
  );
  const fontFamily = element.props.fontFamily
    ? String(element.props.fontFamily)
    : isButton
    ? "var(--font-mono)"
    : undefined;
  const align = String(
    element.props.textAlign || element.props.align || (element.type === "text" ? "left" : "center")
  ) as "left" | "center" | "right" | "justify";
  const textVerticalAlign = String(element.props.textVerticalAlign || (element.type === "text" ? "top" : "middle"));
  const lineHeight = element.props.lineHeight ? `${element.props.lineHeight}px` : "1.4";
  const letterSpacing =
    element.props.letterSpacing !== undefined
      ? typeof element.props.letterSpacing === "number"
        ? `${element.props.letterSpacing}px`
        : String(element.props.letterSpacing)
      : isButton
      ? "0.06em"
      : undefined;
  const fontStyle = element.props.italic ? "italic" : undefined;
  const isUnderline = Boolean(element.props.underline);
  const isStrikethrough = Boolean(element.props.strikethrough);
  const textDecoration =
    isUnderline && isStrikethrough
      ? "underline line-through"
      : isUnderline
      ? "underline"
      : isStrikethrough
      ? "line-through"
      : undefined;

  const isShape = element.type !== "text";

  // Auto-fit height when vertically centered or bottom-aligned so flex positioning matches TextPreview / ShapeTextRenderer
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (textVerticalAlign === "middle" || textVerticalAlign === "center" || textVerticalAlign === "bottom") {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, element.height)}px`;
    }
  }, [localText, textVerticalAlign, element.height]);

  const buttonRadius =
    element.props.radius !== undefined
      ? `${element.props.radius}px`
      : undefined;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex size-full border border-dashed border-blue-500 select-text bg-transparent",
        isButton && !buttonRadius ? "rounded-full" : "rounded-xs",
        textVerticalAlign === "middle" || textVerticalAlign === "center"
          ? "items-center"
          : textVerticalAlign === "bottom"
          ? "items-end"
          : "items-start"
      )}
      style={{
        borderRadius: buttonRadius,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleFinish}
        rows={isButton ? 1 : undefined}
        className={cn(
          "w-full resize-none border-0 bg-transparent outline-none whitespace-pre-wrap break-words overflow-hidden",
          isButton ? "px-4 py-0 text-center uppercase" : isShape ? "p-2 text-center" : "p-0 px-1"
        )}
        style={{
          color,
          fontSize,
          fontWeight,
          fontFamily,
          textAlign: align,
          lineHeight: isButton ? "normal" : lineHeight,
          letterSpacing,
          fontStyle,
          textDecoration,
          caretColor: color.startsWith("var(--primary-foreground)") ? "var(--primary-foreground)" : "currentColor",
          height:
            textVerticalAlign === "middle" || textVerticalAlign === "center" || textVerticalAlign === "bottom"
              ? undefined
              : "100%",
          maxHeight: "100%",
        }}
        placeholder={element.type === "text" ? "输入文本内容…" : "输入内容…"}
      />
    </div>
  );
}

function isTextCapable(type: ComponentType, props?: Record<string, string | number | boolean>): boolean {
  return (
    type === "text" ||
    type === "button" ||
    type === "button-primary" ||
    type === "web-button" ||
    type === "sticky-note" ||
    type === "pin-note" ||
    type === "rectangle" ||
    type === "circle" ||
    type.startsWith("flow-") ||
    type === "card" ||
    type === "placeholder" ||
    type === "badge" ||
    type === "chip" ||
    Boolean(props?.text !== undefined || props?.hasText)
  );
}

interface ElementNodeProps {
  el: EditorElement;
  allElementsFlat: EditorElement[];
  effectiveSelectedIds: string[];
  ancestorLocked: boolean;
  interaction: Interaction | null;
  isPanning: boolean;
  spaceHeld: boolean;
  previewing: boolean;
  activeTool: string;
  zoom: number;
  editingElementId?: string | null;
  onStartEditing?: (id: string) => void;
  onStopEditing?: () => void;
  onElementMouseDown: (e: React.MouseEvent, elId: string) => void;
  onResizeMouseDown: (e: React.MouseEvent, elId: string, handle: string) => void;
  onRotateMouseDown: (e: React.MouseEvent, el: EditorElement, corner?: "nw" | "ne" | "se" | "sw") => void;
  onRadiusMouseDown: (e: React.MouseEvent, el: EditorElement, corner: "nw" | "ne" | "se" | "sw") => void;
  onLineEndpointMouseDown: (e: React.MouseEvent, el: EditorElement, endpoint: "start" | "end") => void;
  onAnchorMouseDown: (e: React.MouseEvent, el: EditorElement, port: AnchorPort) => void;
  onSelect: (id: string | null) => void;
  onUpdateElement?: (id: string, patch: Partial<EditorElement>) => void;
}

const ElementNode = memo(function ElementNode({
  el,
  allElementsFlat,
  effectiveSelectedIds,
  ancestorLocked,
  interaction,
  isPanning,
  spaceHeld,
  previewing,
  activeTool,
  zoom,
  editingElementId,
  onStartEditing,
  onStopEditing,
  onElementMouseDown,
  onResizeMouseDown,
  onRotateMouseDown,
  onRadiusMouseDown,
  onLineEndpointMouseDown,
  onAnchorMouseDown,
  onSelect,
  onUpdateElement,
}: ElementNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = effectiveSelectedIds.includes(el.id);
  const isSingleSelected = effectiveSelectedIds.length === 1 && isSelected;
  const isEditing = editingElementId === el.id;
  if (!el.visible) return null;
  const locked = el.locked || ancestorLocked;
  const isLineLike = el.type === "line" || el.type === "arrow";
  const hasCornerRadius =
    el.type === "rectangle" ||
    el.type === "card" ||
    el.type === "mobile-frame" ||
    el.type === "browser-frame" ||
    el.type === "placeholder" ||
    el.type === "modal-dialog" ||
    el.type === "image";

  const isConnecting = interaction?.type === "create-connector" || interaction?.type === "connector-endpoint";
  const isConnectorMode = activeTool === "connector" || isConnecting;

  const isConnectedToSelectedConnector = useMemo(() => {
    if (effectiveSelectedIds.length === 0) return false;
    return allElementsFlat.some(
      (item) =>
        item.type === "connector" &&
        effectiveSelectedIds.includes(item.id) &&
        (item.props.startElementId === el.id || item.props.endElementId === el.id)
    );
  }, [el.id, effectiveSelectedIds, allElementsFlat]);

  const showAnchors =
    !previewing &&
    !locked &&
    !isEditing &&
    el.type !== "connector" &&
    (isConnectorMode
      ? (isConnecting
          ? (interaction?.type === "create-connector" && interaction.startElementId === el.id) ||
            (interaction?.type === "connector-endpoint" && interaction.fixedElementId === el.id) ||
            interaction?.targetElementId === el.id ||
            isHovered
          : isHovered || isSelected)
      : false);

  return (
    <div
      key={el.id}
      data-element
      data-element-id={el.id}
      data-locked={locked ? "true" : undefined}
      className={cn(
        "absolute select-none z-10",
        previewing && "pointer-events-none",
        "pointer-events-auto",
        (!interaction || ("id" in interaction && interaction.id !== el.id)) &&
          (activeTool === "select"
            ? (locked ? "cursor-default" : isEditing ? "cursor-text" : "cursor-move")
            : activeTool === "connector"
            ? (locked ? "cursor-not-allowed" : "cursor-crosshair")
            : "cursor-default"),
      )}
      style={{
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        opacity: el.opacity,
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: isLineLike ? "0 50%" : "center center",
      }}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      onMouseDown={(e) => {
        onElementMouseDown(e, el.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (previewing) return;
        if (!locked && isTextCapable(el.type, el.props)) {
          onSelect(el.id);
          onStartEditing?.(el.id);
        } else {
          let curr = el;
          let groupAncestor: EditorElement | null = null;
          const visited = new Set<string>([el.id]);
          while (curr.parentId) {
            if (visited.has(curr.parentId)) break;
            visited.add(curr.parentId);
            const parent = allElementsFlat.find((p) => p.id === curr.parentId);
            if (!parent) break;
            if (parent.type === "group") {
              groupAncestor = parent;
            }
            curr = parent;
          }
          onSelect(groupAncestor ? groupAncestor.id : el.id);
        }
      }}
    >
      <ElementRenderer
        element={el}
        isSelected={isSelected}
        previewing={previewing}
        zoom={zoom}
        onSelect={onSelect}
        onUpdateProps={(patch) => {
          onUpdateElement?.(el.id, {
            props: { ...el.props, ...patch },
          });
        }}
        onUpdateElement={onUpdateElement}
        isEditing={isEditing}
      >
        {el.children &&
          el.children.length > 0 &&
          el.children.map((child) => (
            <ElementNode
              key={child.id}
              el={child}
              allElementsFlat={allElementsFlat}
              effectiveSelectedIds={effectiveSelectedIds}
              ancestorLocked={locked}
              interaction={interaction}
              isPanning={isPanning}
              spaceHeld={spaceHeld}
              previewing={previewing}
              activeTool={activeTool}
              zoom={zoom}
              editingElementId={editingElementId}
              onStartEditing={onStartEditing}
              onStopEditing={onStopEditing}
              onElementMouseDown={onElementMouseDown}
              onResizeMouseDown={onResizeMouseDown}
              onRotateMouseDown={onRotateMouseDown}
              onRadiusMouseDown={onRadiusMouseDown}
              onLineEndpointMouseDown={onLineEndpointMouseDown}
              onAnchorMouseDown={onAnchorMouseDown}
              onSelect={onSelect}
              onUpdateElement={onUpdateElement}
            />
          ))}
      </ElementRenderer>

      {isEditing && (
        <InlineTextEditor
          element={el}
          zoom={zoom}
          onUpdateText={(newText) => {
            onUpdateElement?.(el.id, {
              props: { ...el.props, text: newText, hasText: true },
            });
          }}
          onFinish={onStopEditing ?? (() => {})}
        />
      )}

      {/* Anchor Ports (Top, Right, Bottom, Left) for Connecting Elements */}
      {showAnchors && (
        <>
          {ANCHOR_PORTS.map((port) => {
            const posStyle =
              port === "top"
                ? { left: "50%", top: 0 }
                : port === "right"
                ? { left: "100%", top: "50%" }
                : port === "bottom"
                ? { left: "50%", top: "100%" }
                : { left: 0, top: "50%" };

            const isTargetPort =
              isConnecting &&
              interaction?.targetElementId === el.id &&
              interaction?.targetPort === port;

            const isStartPort =
              isConnecting &&
              interaction?.type === "create-connector" &&
              interaction?.startElementId === el.id &&
              interaction?.startPort === port;

            return (
              <div
                key={port}
                data-handle
                data-anchor-port={port}
                className="absolute z-[35] flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center cursor-crosshair group/anchor"
                style={posStyle}
                title={`从此处连线 (${PORT_LABELS[port]})`}
                onMouseDown={(e) => onAnchorMouseDown(e, el, port)}
              >
                <div
                  className={cn(
                    "size-3 rounded-full border-2 border-white bg-blue-600 shadow-md transition-all",
                    "group-hover/anchor:scale-135 group-hover/anchor:bg-blue-500 group-hover/anchor:ring-4 group-hover/anchor:ring-blue-500/30",
                    (isTargetPort || isStartPort) && "scale-140 bg-blue-600 ring-4 ring-blue-500/40 ring-offset-1",
                  )}
                />
              </div>
            );
          })}
        </>
      )}

      {/* Locked selection outline & quick unlock action */}
      {isSelected && locked && !previewing && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 border border-dashed border-accent/80 z-10",
              isLineLike && "hidden",
            )}
            data-handle
          />
          <button
            type="button"
            className="absolute -top-7 right-0 z-30 flex items-center gap-1.5 rounded-full bg-surface border border-border-visible px-2 py-0.5 font-mono text-[10px] text-foreground tracking-wider hover:border-foreground transition-colors cursor-pointer pointer-events-auto select-none shadow-xs"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateElement?.(el.id, { locked: false });
            }}
            title="点击解锁图层 (⌘⇧L)"
          >
            <Lock className="size-3 text-accent" />
            <span className="text-[9px] font-mono uppercase text-muted-foreground">LOCKED</span>
            <span className="text-[9px] font-mono uppercase text-foreground underline ml-0.5">解锁</span>
          </button>
        </>
      )}

      {isSelected && !locked && !previewing && !isEditing && (
        <>
          {isLineLike ? (
            /* Line endpoint handles with stable hit target containers */
            <>
              <div
                data-handle
                className="absolute z-30 size-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-crosshair group/handle pointer-events-auto"
                style={{ left: 0, top: "50%" }}
                title="起点 / 方向 (Shift 15°吸附)"
                onMouseDown={(e) => onLineEndpointMouseDown(e, el, "start")}
              >
                <div className="size-3 rounded-full border-2 border-blue-500 bg-white shadow-xs pointer-events-none group-hover/handle:scale-125 transition-transform" />
              </div>
              <div
                data-handle
                className="absolute z-30 size-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-crosshair group/handle pointer-events-auto"
                style={{ left: "100%", top: "50%" }}
                title="终点 / 方向 (Shift 15°吸附)"
                onMouseDown={(e) => onLineEndpointMouseDown(e, el, "end")}
              >
                <div className="size-2.5 rounded-full border border-primary bg-background shadow-xs pointer-events-none group-hover/handle:scale-125 transition-transform" />
              </div>
            </>
          ) : (
            /* Standard 2D shape bounding box and handles */
            <>
              {/* 1px crisp selection border */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 border border-primary z-10",
                  el.type === "group" && "border-dashed border-primary/80",
                )}
                data-handle
              />

              {/* Group Name Tag */}
              {el.type === "group" && (
                <div className="pointer-events-none absolute -top-5 left-0 z-30 flex items-center gap-1 rounded-xs bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary-foreground tracking-wider uppercase shadow-xs">
                  <span>{el.name || "GROUP"}</span>
                </div>
              )}

              {/* Show rotation and resize handles on single selection */}
              {isSingleSelected && (
                <>
                  {/* Live rotation angle badge during active rotation */}
                  {interaction?.type === "rotate" && interaction.id === el.id && (
                    <div
                      className={cn(
                        "pointer-events-none absolute z-50 rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white shadow-md select-none whitespace-nowrap",
                        interaction.corner === "se"
                          ? "bottom-[-28px] right-0"
                          : interaction.corner === "sw"
                          ? "bottom-[-28px] left-0"
                          : interaction.corner === "ne"
                          ? "top-[-28px] right-0"
                          : "top-[-28px] left-0"
                      )}
                    >
                      {`${Number((interaction.currentRotation ?? el.rotation ?? 0).toFixed(2))}°`}
                    </div>
                  )}

                  {/* 4 corner rotation outer trigger areas (compact hit area) */}
                  {[
                    { id: "nw" as const, style: { top: -15, left: -15 } },
                    { id: "ne" as const, style: { top: -15, right: -15 } },
                    { id: "se" as const, style: { bottom: -15, right: -15 } },
                    { id: "sw" as const, style: { bottom: -15, left: -15 } },
                  ].map((item) => (
                    <div
                      key={`rotate-${item.id}`}
                      data-handle
                      className="absolute z-20 size-3.5 flex items-center justify-center pointer-events-auto"
                      style={{
                        ...item.style,
                        cursor: ROTATE_CURSORS[item.id],
                      }}
                      title="旋转 (按住 Shift 15°吸附)"
                      onMouseDown={(e) => onRotateMouseDown(e, el, item.id)}
                    />
                  ))}

                  {/* Live radius badge during active radius dragging */}
                  {interaction?.type === "corner-radius" && interaction.id === el.id && (
                    <div
                      className={cn(
                        "pointer-events-none absolute z-50 rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white shadow-md select-none whitespace-nowrap",
                        interaction.corner === "se"
                          ? "bottom-[-28px] right-0"
                          : interaction.corner === "sw"
                          ? "bottom-[-28px] left-0"
                          : interaction.corner === "ne"
                          ? "top-[-28px] right-0"
                          : "top-[-28px] left-0"
                      )}
                    >
                      {`R: ${Number(
                        (Boolean(el.props.radiusIndependent)
                          ? (interaction.corner === "nw"
                              ? el.props.radiusTopLeft
                              : interaction.corner === "ne"
                              ? el.props.radiusTopRight
                              : interaction.corner === "se"
                              ? el.props.radiusBottomRight
                              : el.props.radiusBottomLeft)
                          : el.props.radius) ?? 0
                      )}px`}
                    </div>
                  )}

                  {/* 4 corner radius inner dots with stable hit target container */}
                  {hasCornerRadius &&
                    !isConnectorMode &&
                    (isHovered || (interaction?.type === "corner-radius" && interaction.id === el.id)) &&
                    (() => {
                      const isRadiusEnabled = el.props.radiusEnabled !== false && el.props.radiusEnabled !== "false";
                      const isIndependent = Boolean(el.props.radiusIndependent);
                      const baseRadius = isRadiusEnabled ? Number(el.props.radius ?? 4) : 0;
                      const nwRadius = isRadiusEnabled ? Number((isIndependent ? el.props.radiusTopLeft : undefined) ?? baseRadius) : 0;
                      const neRadius = isRadiusEnabled ? Number((isIndependent ? el.props.radiusTopRight : undefined) ?? baseRadius) : 0;
                      const swRadius = isRadiusEnabled ? Number((isIndependent ? el.props.radiusBottomLeft : undefined) ?? baseRadius) : 0;
                      const seRadius = isRadiusEnabled ? Number((isIndependent ? el.props.radiusBottomRight : undefined) ?? baseRadius) : 0;

                      const maxR = Math.min(el.width, el.height) / 2;
                      const minOffset = Math.min(16, maxR);
                      const getOffset = (r: number) => Math.max(minOffset, Math.min(r, maxR));

                      const nwOffset = getOffset(nwRadius);
                      const neOffset = getOffset(neRadius);
                      const swOffset = getOffset(swRadius);
                      const seOffset = getOffset(seRadius);

                      const radiusCorners = [
                        { id: "nw" as const, x: nwOffset, y: nwOffset },
                        { id: "ne" as const, x: el.width - neOffset, y: nwOffset },
                        { id: "sw" as const, x: swOffset, y: el.height - swOffset },
                        { id: "se" as const, x: el.width - seOffset, y: el.height - seOffset },
                      ];
                      return (
                        <>
                          {radiusCorners.map((c) => (
                            <div
                              key={`radius-${c.id}`}
                              data-handle
                              className="absolute z-25 size-5 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-crosshair group/radius pointer-events-auto"
                              style={{ left: c.x, top: c.y }}
                              title="调节圆角"
                              onMouseDown={(e) => onRadiusMouseDown(e, el, c.id)}
                            >
                              <div className="size-2 rounded-full border border-primary bg-background shadow-xs pointer-events-none group-hover/radius:scale-125 transition-transform" />
                            </div>
                          ))}
                        </>
                      );
                    })()}

                  {/* 4 border edge drag hit areas */}
                  {[
                    { id: "n", style: { top: -4, left: 4, right: 4, height: 8, cursor: "ns-resize" } },
                    { id: "s", style: { bottom: -4, left: 4, right: 4, height: 8, cursor: "ns-resize" } },
                    { id: "w", style: { left: -4, top: 4, bottom: 4, width: 8, cursor: "ew-resize" } },
                    { id: "e", style: { right: -4, top: 4, bottom: 4, width: 8, cursor: "ew-resize" } },
                  ].map((edge) => (
                    <div
                      key={`edge-${edge.id}`}
                      data-handle
                      className="absolute z-35 pointer-events-auto"
                      style={edge.style}
                      onMouseDown={(e) => onResizeMouseDown(e, el.id, edge.id)}
                    />
                  ))}

                  {/* 8 resize handle control points (4 corners + 4 edge midpoints) */}
                  {[
                    // 4 corner handles
                    { id: "nw", style: { top: -10, left: -10, cursor: "nwse-resize" } },
                    { id: "ne", style: { top: -10, right: -10, cursor: "nesw-resize" } },
                    { id: "se", style: { bottom: -10, right: -10, cursor: "nwse-resize" } },
                    { id: "sw", style: { bottom: -10, left: -10, cursor: "nesw-resize" } },
                    // 4 edge midpoint handles
                    { id: "n", style: { top: -10, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" } },
                    { id: "s", style: { bottom: -10, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" } },
                    { id: "w", style: { top: "50%", left: -10, transform: "translateY(-50%)", cursor: "ew-resize" } },
                    { id: "e", style: { top: "50%", right: -10, transform: "translateY(-50%)", cursor: "ew-resize" } },
                  ].map((handle) => (
                    <div
                      key={handle.id}
                      data-handle
                      className="absolute z-40 size-5 flex items-center justify-center pointer-events-auto group/handle"
                      style={handle.style}
                      onMouseDown={(e) => onResizeMouseDown(e, el.id, handle.id)}
                    >
                      <div className="size-2 border border-primary bg-background pointer-events-none group-hover/handle:scale-125 transition-transform" />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
});

export function Canvas({
  elements,
  selectedId,
  selectedIds,
  showGrid,
  activeTool,
  zoom,
  previewing,
  onZoomChange,
  onSelect,
  onSelectIds,
  onSelectTool,
  onUpdateElement,
  onBatchUpdateElements,
  onCreateElement,
  onCommitMove,
  onDelete,
  onCanvasClick,
  onCanvasPointerMove,
  onContextMenu,
  onDropAsset,
  onDropFile,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const [activeGuides, setActiveGuides] = useState<SnapGuideLine[]>([]);
  const [altGuides, setAltGuides] = useState<SnapGuideLine[]>([]);
  const [snapIndicator, setSnapIndicator] = useState<SnapIndicatorPoint | null>(null);
  const dragOccurred = useRef(false);

  const snap = useCallback((v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE, []);

  const allElementsFlat = useMemo(() => {
    return flattenElements(elements);
  }, [elements]);

  const effectiveSelectedIds = useMemo(() => {
    if (selectedIds && selectedIds.length > 0) return selectedIds;
    if (selectedId) return [selectedId];
    return [];
  }, [selectedIds, selectedId]);

  const selectedElements = useMemo(() => {
    return allElementsFlat.filter((el) => effectiveSelectedIds.includes(el.id));
  }, [allElementsFlat, effectiveSelectedIds]);

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
      if (isEditableTarget(e.target)) return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.key === "Alt" && !e.repeat) {
        setAltHeld(true);
      }
      if (e.key === "F2" || (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        if (effectiveSelectedIds.length === 1 && !editingElementId) {
          const selectedEl = allElementsFlat.find((item) => item.id === effectiveSelectedIds[0]);
          if (selectedEl && !selectedEl.locked && isTextCapable(selectedEl.type, selectedEl.props)) {
            e.preventDefault();
            setEditingElementId(selectedEl.id);
          }
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
      if (e.key === "Alt") {
        setAltHeld(false);
        setAltGuides([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [effectiveSelectedIds, editingElementId, allElementsFlat]);

  // Native Non-Passive Wheel Event Listener for Trackpad/Wheel Canvas Panning and Ctrl + Wheel Zooming
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.0015;
        const newZoom = Math.min(4, Math.max(0.1, zoom + delta));
        const rect = canvasEl.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setPan((p) => ({
          x: mx - ((mx - p.x) / zoom) * newZoom,
          y: my - ((my - p.y) / zoom) * newZoom,
        }));
        onZoomChange(newZoom);
      } else {
        setPan((p) => ({
          x: p.x - e.deltaX,
          y: p.y - e.deltaY,
        }));
      }
    };

    canvasEl.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      canvasEl.removeEventListener("wheel", handleNativeWheel);
    };
  }, [zoom, onZoomChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragOccurred.current = false;

      if (editingElementId) {
        setEditingElementId(null);
      }

      if (e.button === 1 || (e.button === 0 && (spaceHeld || activeTool === "hand"))) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        return;
      }
      if (previewing) return;

      const target = e.target as HTMLElement;

      // Connector line drawing tool
      if (activeTool === "connector" && e.button === 0) {
        if (!target.closest("[data-handle]")) {
          const pos = screenToCanvas(e.clientX, e.clientY);
          const snapNear = findNearestSnapAnchor(pos, allElementsFlat, undefined, 36);
          const startX = snapNear ? snapNear.anchor.point.x : pos.x;
          const startY = snapNear ? snapNear.anchor.point.y : pos.y;
          const inter: Interaction = {
            type: "create-connector",
            startElementId: snapNear ? snapNear.element.id : null,
            startPort: snapNear ? snapNear.anchor.port : null,
            startX,
            startY,
            currentX: startX,
            currentY: startY,
            targetElementId: null,
            targetPort: null,
          };
          interactionRef.current = inter;
          setInteraction(inter);
        }
        return;
      }

      // Click on canvas with a component creation tool selected -> initiate drag-to-create
      if (activeTool !== "select" && activeTool !== "hand" && e.button === 0) {
        if (!target.closest("[data-handle]")) {
          const pos = screenToCanvas(e.clientX, e.clientY);
          const container = [...elements]
            .reverse()
            .find(
              (el) =>
                (el.type === "mobile-frame" || el.type === "browser-frame") &&
                pos.x >= el.x &&
                pos.x <= el.x + el.width &&
                pos.y >= el.y &&
                pos.y <= el.y + el.height,
            );

          let startX = pos.x;
          let startY = pos.y;
          if (activeTool === "line" || activeTool === "arrow") {
            const snapStart = calculateEndpointSnapping(
              "__new_line_start__",
              { x: pos.x, y: pos.y },
              null,
              allElementsFlat,
              zoom,
              false,
            );
            startX = snapStart.x;
            startY = snapStart.y;
            if (snapStart.indicator) {
              setSnapIndicator(snapStart.indicator);
              setActiveGuides(snapStart.guides);
            }
          }

          const inter: Interaction = {
            type: "create-drag",
            tool: activeTool as ComponentType,
            startX,
            startY,
            currentX: startX,
            currentY: startY,
            parentId: container ? container.id : null,
          };
          interactionRef.current = inter;
          setInteraction(inter);
        }
        return;
      }

      // Marquee selection on canvas
      if (activeTool === "select" && e.button === 0) {
        const closestEl = target.closest("[data-element]");
        if (
          (!closestEl || e.metaKey || e.ctrlKey) &&
          !target.closest("[data-handle]") &&
          !target.closest("[data-multi-selection-box]")
        ) {
          const pos = screenToCanvas(e.clientX, e.clientY);
          const inter: Interaction = {
            type: "marquee",
            startX: pos.x,
            startY: pos.y,
            currentX: pos.x,
            currentY: pos.y,
            shiftHeld: e.shiftKey,
            initialSelected: e.shiftKey ? [...effectiveSelectedIds] : [],
          };
          interactionRef.current = inter;
          setInteraction(inter);
        }
      }
    },
    [previewing, spaceHeld, pan, activeTool, screenToCanvas, elements, effectiveSelectedIds],
  );

  // Global PointerMove & PointerUp listeners for smooth, glitch-free dragging & marquee
  useEffect(() => {
    let rafId: number | null = null;
    let pendingEvent: { clientX: number; clientY: number; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean } | null = null;

    const processPointerMove = (e: { clientX: number; clientY: number; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        return;
      }

      const curInter = interactionRef.current;
      if (!curInter) return;

      const pos = screenToCanvas(e.clientX, e.clientY);
      dragOccurred.current = true;

      // Marquee box selection
      if (curInter.type === "marquee") {
        curInter.currentX = pos.x;
        curInter.currentY = pos.y;
        setInteraction({ ...curInter });

        const marqueeBox = {
          x: Math.min(curInter.startX, pos.x),
          y: Math.min(curInter.startY, pos.y),
          width: Math.abs(pos.x - curInter.startX),
          height: Math.abs(pos.y - curInter.startY),
        };

        const hitIds = getMarqueeHitElementIds(marqueeBox, allElementsFlat, {
          containerClickTargetId: curInter.containerClickTargetId,
          isDeepSelect: e.ctrlKey || e.metaKey,
        });

        if (curInter.shiftHeld) {
          const merged = filterOutDescendantIds(
            Array.from(new Set([...curInter.initialSelected, ...hitIds])),
            allElementsFlat,
          );
          if (onSelectIds) {
            onSelectIds(merged);
          } else {
            onSelect(merged[merged.length - 1] ?? null);
          }
        } else {
          if (onSelectIds) {
            onSelectIds(hitIds);
          } else {
            onSelect(hitIds[hitIds.length - 1] ?? null);
          }
        }
        return;
      }

      // Connector creation or endpoint dragging
      if (curInter.type === "create-connector" || curInter.type === "connector-endpoint") {
        const excludeId =
          curInter.type === "create-connector"
            ? (curInter.startElementId || undefined)
            : (curInter.fixedElementId || undefined);
        const snapRes = findNearestSnapAnchor(pos, allElementsFlat, excludeId, 32);
        if (snapRes) {
          curInter.currentX = snapRes.anchor.point.x;
          curInter.currentY = snapRes.anchor.point.y;
          curInter.targetElementId = snapRes.element.id;
          curInter.targetPort = snapRes.anchor.port;
          setSnapIndicator({
            id: `anchor-${snapRes.element.id}-${snapRes.anchor.port}`,
            x: snapRes.anchor.point.x,
            y: snapRes.anchor.point.y,
            type: "anchor",
          });
        } else {
          curInter.currentX = pos.x;
          curInter.currentY = pos.y;
          curInter.targetElementId = null;
          curInter.targetPort = null;
          setSnapIndicator(null);
        }
        setInteraction({ ...curInter });
        return;
      }

      // Connector segment dragging (orthogonal path manipulation)
      if (curInter.type === "connector-segment") {
        const delta = curInter.isVertical ? pos.x - curInter.startX : pos.y - curInter.startY;
        let rawCoord = curInter.startPos + delta;
        if (!e.altKey) {
          rawCoord = Math.round(rawCoord / 10) * 10;
        }
        const updatedPts = moveOrthogonalSegment(curInter.initialWaypoints, curInter.segmentIndex, rawCoord);
        const conn = allElementsFlat.find((el) => el.id === curInter.id);
        if (conn) {
          onUpdateElement(curInter.id, {
            props: {
              ...conn.props,
              customWaypoints: JSON.stringify(updatedPts),
            },
          });
        }
        return;
      }

      // Drag to create
      if (curInter.type === "create-drag") {
        let curX = pos.x;
        let curY = pos.y;

        if (curInter.tool === "line" || curInter.tool === "arrow") {
          const snapRes = calculateEndpointSnapping(
            "__new_line__",
            { x: curX, y: curY },
            { x: curInter.startX, y: curInter.startY },
            allElementsFlat,
            zoom,
            e.shiftKey,
          );
          curX = snapRes.x;
          curY = snapRes.y;
          setActiveGuides(snapRes.guides);
          setSnapIndicator(snapRes.indicator);
        } else {
          if (e.shiftKey) {
            const w = Math.abs(curX - curInter.startX);
            const h = Math.abs(curY - curInter.startY);
            const size = Math.max(w, h);
            curX = curX >= curInter.startX ? curInter.startX + size : curInter.startX - size;
            curY = curY >= curInter.startY ? curInter.startY + size : curInter.startY - size;
          }

          const boxX = Math.min(curInter.startX, curX);
          const boxY = Math.min(curInter.startY, curY);
          const boxW = Math.max(10, Math.abs(curX - curInter.startX));
          const boxH = Math.max(10, Math.abs(curY - curInter.startY));

          const snapRes = calculateSnapping(
            "__new__",
            boxX,
            boxY,
            boxW,
            boxH,
            allElementsFlat,
            zoom,
          );
          setActiveGuides(snapRes.guides);
          setSnapIndicator(snapRes.indicator ?? null);
        }

        curInter.currentX = curX;
        curInter.currentY = curY;
        setInteraction({ ...curInter });
        return;
      }

      const dx = pos.x - curInter.startX;
      const dy = pos.y - curInter.startY;

      const disableSnap = e.ctrlKey || e.metaKey || e.altKey;

      // Multi-element synchronous move
      if (curInter.type === "multi-move") {
        const rawGroupX = curInter.combinedBounds.x + dx;
        const rawGroupY = curInter.combinedBounds.y + dy;

        const snapRes = calculateSnapping(
          "__multi__",
          rawGroupX,
          rawGroupY,
          curInter.combinedBounds.width,
          curInter.combinedBounds.height,
          allElementsFlat.filter((item) => !curInter.initialPositions.some((p) => p.id === item.id)),
          zoom,
          null,
          disableSnap,
        );

        setActiveGuides(snapRes.guides);
        setSnapIndicator(snapRes.indicator ?? null);
        const snappedDx = snapRes.x - curInter.combinedBounds.x;
        const snappedDy = snapRes.y - curInter.combinedBounds.y;

        const patches = curInter.initialPositions.map((posInit) => ({
          id: posInit.id,
          patch: {
            x: Math.round(posInit.x + snappedDx),
            y: Math.round(posInit.y + snappedDy),
          },
        }));

        if (onBatchUpdateElements) {
          onBatchUpdateElements(patches);
        } else {
          patches.forEach((p) => onUpdateElement(p.id, p.patch));
        }
        return;
      }

      // Single element move
      if (curInter.type === "move") {
        const targetEl = allElementsFlat.find((item) => item.id === curInter.id);
        const isLineLike = targetEl?.type === "line" || targetEl?.type === "arrow";

        if (isLineLike && targetEl) {
          const rawX = curInter.elStartX + dx;
          const rawY = curInter.elStartY + dy;
          const snapRes = calculateLineMoveSnapping(
            curInter.id,
            rawX,
            rawY,
            curInter.elW,
            targetEl.rotation,
            curInter.elH,
            allElementsFlat,
            zoom,
          );
          setActiveGuides(disableSnap ? [] : snapRes.guides);
          setSnapIndicator(disableSnap ? null : (snapRes.indicator ?? null));
          onUpdateElement(curInter.id, {
            x: disableSnap ? Math.round(rawX) : snapRes.x,
            y: disableSnap ? Math.round(rawY) : snapRes.y,
          });
        } else {
          const rawX = curInter.elStartX + dx;
          const rawY = curInter.elStartY + dy;

          const snapRes = calculateSnapping(
            curInter.id,
            rawX,
            rawY,
            curInter.elW,
            curInter.elH,
            allElementsFlat,
            zoom,
            null,
            disableSnap,
          );

          setActiveGuides(snapRes.guides);
          setSnapIndicator(snapRes.indicator ?? null);
          onUpdateElement(curInter.id, {
            x: snapRes.x,
            y: snapRes.y,
          });
        }
      } else if (curInter.type === "line-endpoint") {
        const snapRes = calculateEndpointSnapping(
          curInter.id,
          { x: pos.x, y: pos.y },
          curInter.fixedPoint,
          allElementsFlat,
          zoom,
          e.shiftKey,
        );

        setActiveGuides(snapRes.guides);
        setSnapIndicator(snapRes.indicator);

        const snappedX = snapRes.x;
        const snappedY = snapRes.y;

        if (curInter.endpoint === "end") {
          const fixedX = curInter.fixedPoint.x;
          const fixedY = curInter.fixedPoint.y;
          const diffX = snappedX - fixedX;
          const diffY = snappedY - fixedY;
          const rawAngle =
            snapRes.snappedAngle !== undefined
              ? snapRes.snappedAngle
              : (Math.atan2(diffY, diffX) * 180) / Math.PI;
          const rawLen = Math.sqrt(diffX * diffX + diffY * diffY);

          onUpdateElement(curInter.id, {
            width: Math.max(10, Math.round(rawLen)),
            rotation: Math.round(rawAngle),
          });
        } else {
          const fixedX = curInter.fixedPoint.x;
          const fixedY = curInter.fixedPoint.y;
          const diffX = fixedX - snappedX;
          const diffY = fixedY - snappedY;
          const rawAngle =
            snapRes.snappedAngle !== undefined
              ? snapRes.snappedAngle
              : (Math.atan2(diffY, diffX) * 180) / Math.PI;
          const rawLen = Math.sqrt(diffX * diffX + diffY * diffY);

          const newStartX = snappedX;
          const newStartY = snappedY - curInter.elH / 2;

          onUpdateElement(curInter.id, {
            x: Math.round(newStartX),
            y: Math.round(newStartY),
            width: Math.max(10, Math.round(rawLen)),
            rotation: Math.round(rawAngle),
          });
        }
      } else if (curInter.type === "corner-radius") {
        const maxRadius = Math.floor(Math.min(curInter.elW, curInter.elH) / 2);
        const rotRad = (-(curInter.rotation ?? 0) * Math.PI) / 180;
        const cos = Math.cos(rotRad);
        const sin = Math.sin(rotRad);
        const localDx = dx * cos - dy * sin;
        const localDy = dx * sin + dy * cos;

        let delta = 0;
        if (curInter.corner === "nw") delta = (localDx + localDy) / 2;
        else if (curInter.corner === "ne") delta = (-localDx + localDy) / 2;
        else if (curInter.corner === "se") delta = (-localDx - localDy) / 2;
        else if (curInter.corner === "sw") delta = (localDx - localDy) / 2;

        const nextRadius = Math.max(0, Math.min(maxRadius, Math.round(curInter.startRadius + delta)));
        const isIndependent = Boolean(curInter.props.radiusIndependent);
        if (isIndependent) {
          const cornerPropKey =
            curInter.corner === "nw"
              ? "radiusTopLeft"
              : curInter.corner === "ne"
              ? "radiusTopRight"
              : curInter.corner === "se"
              ? "radiusBottomRight"
              : "radiusBottomLeft";
          onUpdateElement(curInter.id, {
            props: { ...curInter.props, [cornerPropKey]: nextRadius, radiusEnabled: true },
          });
        } else {
          onUpdateElement(curInter.id, {
            props: { ...curInter.props, radius: nextRadius, radiusEnabled: true },
          });
        }
      } else if (curInter.type === "rotate") {
        const curAngle = (Math.atan2(pos.y - curInter.centerY, pos.x - curInter.centerX) * 180) / Math.PI;
        const deltaAngle = curAngle - curInter.startAngle;
        let rawRot = curInter.startRotation + deltaAngle;
        let finalRot = rawRot;
        if (e.shiftKey) {
          finalRot = Math.round(finalRot / 15) * 15;
        }
        finalRot = ((Math.round(finalRot * 100) / 100) % 360 + 360) % 360;
        if (finalRot >= 359.95 || finalRot <= 0.05) {
          finalRot = 0;
        }

        const updatedInter: Interaction = {
          ...curInter,
          currentRotation: finalRot,
        };
        interactionRef.current = updatedInter;
        setInteraction(updatedInter);

        onUpdateElement(curInter.id, { rotation: finalRot });
      } else if (curInter.type === "resize" && curInter.handle) {
        const h = curInter.handle;
        const targetEl = allElementsFlat.find((item) => item.id === curInter.id);
        const rot = targetEl?.rotation || 0;
        const isRotated = Math.abs(rot % 360) > 0.01;
        const rotRad = (-rot * Math.PI) / 180;
        const cos = Math.cos(rotRad);
        const sin = Math.sin(rotRad);
        const lDx = isRotated ? dx * cos - dy * sin : dx;
        const lDy = isRotated ? dx * sin + dy * cos : dy;

        let x = curInter.elStartX;
        let y = curInter.elStartY;
        let w = curInter.elW;
        let hh = curInter.elH;
        const isCorner = h.length === 2;
        const isImage = targetEl?.type === "image";
        const lockAspect = (e.shiftKey || isImage) && isCorner;
        const isAlt = e.altKey;

        if (lockAspect) {
          const ratio = Math.max(0.01, curInter.aspectRatio || 1);
          let effectiveDx = 0;
          let effectiveDy = 0;

          if (h === "se") {
            effectiveDx = lDx;
            effectiveDy = lDy;
          } else if (h === "nw") {
            effectiveDx = -lDx;
            effectiveDy = -lDy;
          } else if (h === "ne") {
            effectiveDx = lDx;
            effectiveDy = -lDy;
          } else if (h === "sw") {
            effectiveDx = -lDx;
            effectiveDy = lDy;
          }

          const multiplier = isAlt ? 2 : 1;
          const projectedDelta = (effectiveDx * ratio + effectiveDy) / (ratio * ratio + 1);
          const targetH = Math.max(10, Math.round(curInter.elH + projectedDelta * multiplier));
          const targetW = Math.max(10, Math.round(targetH * ratio));

          w = targetW;
          hh = targetH;

          if (isAlt) {
            // Symmetric resize from center
            x = curInter.elStartX - (targetW - curInter.elW) / 2;
            y = curInter.elStartY - (targetH - curInter.elH) / 2;
          } else if (!isRotated) {
            if (h === "se") {
              x = curInter.elStartX;
              y = curInter.elStartY;
            } else if (h === "nw") {
              x = curInter.elStartX + (curInter.elW - targetW);
              y = curInter.elStartY + (curInter.elH - targetH);
            } else if (h === "ne") {
              x = curInter.elStartX;
              y = curInter.elStartY + (curInter.elH - targetH);
            } else if (h === "sw") {
              x = curInter.elStartX + (curInter.elW - targetW);
              y = curInter.elStartY;
            }
          } else {
            // Rotated corner transform keeping opposite corner anchored
            let localTL_dx = 0;
            let localTL_dy = 0;
            if (h === "nw") {
              localTL_dx = curInter.elW - targetW;
              localTL_dy = curInter.elH - targetH;
            } else if (h === "ne") {
              localTL_dy = curInter.elH - targetH;
            } else if (h === "sw") {
              localTL_dx = curInter.elW - targetW;
            }
            const localCenterDx = localTL_dx + (targetW - curInter.elW) / 2;
            const localCenterDy = localTL_dy + (targetH - curInter.elH) / 2;
            const worldRad = (rot * Math.PI) / 180;
            const worldCenterDx = localCenterDx * Math.cos(worldRad) - localCenterDy * Math.sin(worldRad);
            const worldCenterDy = localCenterDx * Math.sin(worldRad) + localCenterDy * Math.cos(worldRad);
            const initCenterX = curInter.elStartX + curInter.elW / 2;
            const initCenterY = curInter.elStartY + curInter.elH / 2;
            const newCenterX = initCenterX + worldCenterDx;
            const newCenterY = initCenterY + worldCenterDy;
            x = Math.round(newCenterX - targetW / 2);
            y = Math.round(newCenterY - targetH / 2);
          }
        } else {
          let localTL_dx = 0;
          let localTL_dy = 0;

          if (isAlt) {
            // Symmetric resize around center
            if (h.includes("e")) {
              w = Math.max(10, Math.round(curInter.elW + lDx * 2));
            } else if (h.includes("w")) {
              w = Math.max(10, Math.round(curInter.elW - lDx * 2));
            }
            if (h.includes("s")) {
              hh = Math.max(10, Math.round(curInter.elH + lDy * 2));
            } else if (h.includes("n")) {
              hh = Math.max(10, Math.round(curInter.elH - lDy * 2));
            }
            x = Math.round(curInter.elStartX - (w - curInter.elW) / 2);
            y = Math.round(curInter.elStartY - (hh - curInter.elH) / 2);
          } else {
            if (h.includes("e")) {
              w = Math.max(10, Math.round(curInter.elW + lDx));
            } else if (h.includes("w")) {
              const proposedW = Math.round(curInter.elW - lDx);
              if (proposedW >= 10) {
                w = proposedW;
                localTL_dx = curInter.elW - proposedW;
              } else {
                w = 10;
                localTL_dx = curInter.elW - 10;
              }
            }

            if (h.includes("s")) {
              hh = Math.max(10, Math.round(curInter.elH + lDy));
            } else if (h.includes("n")) {
              const proposedH = Math.round(curInter.elH - lDy);
              if (proposedH >= 10) {
                hh = proposedH;
                localTL_dy = curInter.elH - proposedH;
              } else {
                hh = 10;
                localTL_dy = curInter.elH - 10;
              }
            }

            if (!isRotated) {
              x = curInter.elStartX + localTL_dx;
              y = curInter.elStartY + localTL_dy;
            } else {
              // Rotated local translation to world coordinates
              const localCenterDx = localTL_dx + (w - curInter.elW) / 2;
              const localCenterDy = localTL_dy + (hh - curInter.elH) / 2;
              const worldRad = (rot * Math.PI) / 180;
              const worldCenterDx = localCenterDx * Math.cos(worldRad) - localCenterDy * Math.sin(worldRad);
              const worldCenterDy = localCenterDx * Math.sin(worldRad) + localCenterDy * Math.cos(worldRad);
              const initCenterX = curInter.elStartX + curInter.elW / 2;
              const initCenterY = curInter.elStartY + curInter.elH / 2;
              const newCenterX = initCenterX + worldCenterDx;
              const newCenterY = initCenterY + worldCenterDy;
              x = Math.round(newCenterX - w / 2);
              y = Math.round(newCenterY - hh / 2);
            }
          }
        }

        const snapRes = isRotated
          ? { x, y, width: w, height: hh, guides: [], distances: [] }
          : calculateResizeSnapping(
              curInter.id,
              curInter.handle,
              { x, y, width: w, height: hh },
              allElementsFlat,
              zoom,
              disableSnap,
              (e.shiftKey && isCorner) ? (curInter.aspectRatio || 1) : undefined,
            );

        setActiveGuides(snapRes.guides);
        onUpdateElement(curInter.id, {
          x: snapRes.x,
          y: snapRes.y,
          width: snapRes.width ?? w,
          height: snapRes.height ?? hh,
        });
      }
    };

    const handleWindowPointerMove = (e: PointerEvent) => {
      pendingEvent = {
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
      };

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (pendingEvent) {
            const ev = pendingEvent;
            pendingEvent = null;
            processPointerMove(ev);
          }
        });
      }
    };

    const handleWindowPointerUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (pendingEvent) {
        const ev = pendingEvent;
        pendingEvent = null;
        processPointerMove(ev);
      }

      setActiveGuides([]);
      setSnapIndicator(null);
      const curInter = interactionRef.current;

      if (curInter?.type === "marquee") {
        const { startX, startY, currentX, currentY, shiftHeld, initialSelected, containerClickTargetId, lockedClickTargetId } = curInter;
        const w = Math.abs(currentX - startX);
        const h = Math.abs(currentY - startY);

        if (w >= 3 || h >= 3) {
          const marqueeBox = {
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            width: w,
            height: h,
          };

          const hitIds = getMarqueeHitElementIds(marqueeBox, allElementsFlat, {
            containerClickTargetId,
          });

          if (shiftHeld) {
            const merged = filterOutDescendantIds(
              Array.from(new Set([...initialSelected, ...hitIds])),
              allElementsFlat,
            );
            if (onSelectIds) {
              onSelectIds(merged);
            } else {
              onSelect(merged[merged.length - 1] ?? null);
            }
          } else {
            if (onSelectIds) {
              onSelectIds(hitIds);
            } else {
              onSelect(hitIds[hitIds.length - 1] ?? null);
            }
          }
          dragOccurred.current = true;
        } else {
          if (lockedClickTargetId) {
            if (shiftHeld) {
              const nextSelected = initialSelected.includes(lockedClickTargetId)
                ? initialSelected.filter((id) => id !== lockedClickTargetId)
                : [...initialSelected, lockedClickTargetId];
              if (onSelectIds) {
                onSelectIds(nextSelected);
              } else {
                onSelect(nextSelected[nextSelected.length - 1] ?? null);
              }
            } else {
              onSelect(lockedClickTargetId);
              onSelectIds?.([lockedClickTargetId]);
            }
          } else if (containerClickTargetId) {
            if (shiftHeld) {
              const nextSelected = initialSelected.includes(containerClickTargetId)
                ? initialSelected.filter((id) => id !== containerClickTargetId)
                : [...initialSelected, containerClickTargetId];
              if (onSelectIds) {
                onSelectIds(nextSelected);
              } else {
                onSelect(nextSelected[nextSelected.length - 1] ?? null);
              }
            } else {
              onSelect(containerClickTargetId);
              onSelectIds?.([containerClickTargetId]);
            }
          } else if (!shiftHeld) {
            if (onSelectIds) {
              onSelectIds([]);
            } else {
              onSelect(null);
            }
          }
          dragOccurred.current = false;
        }
      } else if (curInter?.type === "create-drag") {
        const { tool, startX, startY, currentX, currentY, parentId } = curInter;
        const isLineLike = tool === "line" || tool === "arrow";

        if (isLineLike) {
          const diffX = currentX - startX;
          const diffY = currentY - startY;
          const len = Math.sqrt(diffX * diffX + diffY * diffY);

          if (len > 8) {
            const angle = Math.round((Math.atan2(diffY, diffX) * 180) / Math.PI);
            onCreateElement?.(tool, Math.round(startX), Math.round(startY), Math.round(len), 16, angle, parentId);
          } else {
            onCreateElement?.(tool, Math.round(startX), Math.round(startY), undefined, undefined, 0, parentId);
          }
        } else {
          const w = Math.abs(currentX - startX);
          const h = Math.abs(currentY - startY);

          if (w > 8 || h > 8) {
            const finalX = Math.round(Math.min(startX, currentX));
            const finalY = Math.round(Math.min(startY, currentY));
            onCreateElement?.(tool, finalX, finalY, Math.round(Math.max(10, w)), Math.round(Math.max(10, h)), 0, parentId);
          } else {
            onCreateElement?.(tool, Math.round(startX), Math.round(startY), undefined, undefined, 0, parentId);
          }
        }

        onSelectTool?.("select");
      } else if (curInter?.type === "create-connector") {
        const { startElementId, startPort, startX, startY, currentX, currentY, targetElementId, targetPort } = curInter;
        const dist = Math.hypot(currentX - startX, currentY - startY);
        if (dist >= 10 || targetElementId) {
          onCreateElement?.(
            "connector",
            Math.min(startX, currentX),
            Math.min(startY, currentY),
            Math.max(10, Math.abs(currentX - startX)),
            Math.max(10, Math.abs(currentY - startY)),
            0,
            null,
            {
              startElementId: startElementId || "",
              startPort: startPort || "right",
              startPointX: Math.round(startX),
              startPointY: Math.round(startY),
              endElementId: targetElementId || "",
              endPort: targetPort || "left",
              endPointX: Math.round(currentX),
              endPointY: Math.round(currentY),
              routing: "orthogonal",
              startArrow: "none",
              endArrow: "arrow",
              stroke: "#71717A",
              borderWidth: 1.5,
              strokeStyle: "solid",
              radius: 8,
              strokeEnabled: true,
              text: "",
            },
          );
          dragOccurred.current = true;
        }
      } else if (curInter?.type === "connector-endpoint") {
        const targetConn = allElementsFlat.find((e) => e.id === curInter.id);
        if (targetConn) {
          const isStart = curInter.endpoint === "start";
          const nextProps = { ...targetConn.props };
          if (isStart) {
            nextProps.startElementId = curInter.targetElementId || "";
            nextProps.startPort = curInter.targetPort || "right";
            nextProps.startPointX = Math.round(curInter.currentX);
            nextProps.startPointY = Math.round(curInter.currentY);
          } else {
            nextProps.endElementId = curInter.targetElementId || "";
            nextProps.endPort = curInter.targetPort || "left";
            nextProps.endPointX = Math.round(curInter.currentX);
            nextProps.endPointY = Math.round(curInter.currentY);
          }
          onUpdateElement(curInter.id, { props: nextProps });
          onCommitMove();
        }
      } else if (curInter) {
        onCommitMove();
      }

      setIsPanning(false);
      interactionRef.current = null;
      setInteraction(null);
    };

    if (interaction !== null || isPanning) {
      window.addEventListener("pointermove", handleWindowPointerMove);
      window.addEventListener("pointerup", handleWindowPointerUp);
      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        window.removeEventListener("pointermove", handleWindowPointerMove);
        window.removeEventListener("pointerup", handleWindowPointerUp);
      };
    }
  }, [
    interaction,
    isPanning,
    panStart,
    screenToCanvas,
    allElementsFlat,
    zoom,
    onBatchUpdateElements,
    onUpdateElement,
    onSelectIds,
    onSelect,
    onCreateElement,
    onSelectTool,
    onCommitMove,
  ]);

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elId: string) => {
      if (previewing) return;

      if (activeTool === "connector") {
        if (e.button !== 0 || spaceHeld) return;
        const el = allElementsFlat.find((item) => item.id === elId);
        if (!el || el.locked || el.type === "connector") return;
        e.stopPropagation();
        e.preventDefault();
        const pos = screenToCanvas(e.clientX, e.clientY);
        const anchor = getClosestAnchorOnElement(el, pos, allElementsFlat);
        const inter: Interaction = {
          type: "create-connector",
          startElementId: el.id,
          startPort: anchor.port,
          startX: anchor.point.x,
          startY: anchor.point.y,
          currentX: anchor.point.x,
          currentY: anchor.point.y,
          targetElementId: null,
          targetPort: null,
        };
        interactionRef.current = inter;
        setInteraction(inter);
        return;
      }

      if (activeTool !== "select" && activeTool !== "hand") {
        return;
      }

      if (e.button !== 0 || spaceHeld || activeTool === "hand") return;
      const el = allElementsFlat.find((item) => item.id === elId);
      if (!el) return;

      // 1. Force Marquee Selection when Cmd / Ctrl is held
      if ((e.metaKey || e.ctrlKey) && activeTool === "select") {
        e.stopPropagation();
        const pos = screenToCanvas(e.clientX, e.clientY);
        const inter: Interaction = {
          type: "marquee",
          startX: pos.x,
          startY: pos.y,
          currentX: pos.x,
          currentY: pos.y,
          shiftHeld: e.shiftKey,
          initialSelected: e.shiftKey ? [...effectiveSelectedIds] : [],
        };
        interactionRef.current = inter;
        setInteraction(inter);
        return;
      }

      e.stopPropagation();

      // Check if clicked element is inside a Group
      let targetSelectId = elId;
      if (el.parentId && !e.metaKey && !e.ctrlKey) {
        let curr = el;
        let groupAncestor: EditorElement | null = null;
        const visited = new Set<string>([el.id]);
        while (curr.parentId) {
          if (visited.has(curr.parentId)) break;
          visited.add(curr.parentId);
          const parent = allElementsFlat.find((p) => p.id === curr.parentId);
          if (!parent) break;
          if (parent.type === "group") {
            groupAncestor = parent;
          }
          curr = parent;
        }

        // Always resolve target to the group ancestor on standard click/drag
        if (groupAncestor) {
          targetSelectId = groupAncestor.id;
        }
      }

      const targetEl = allElementsFlat.find((item) => item.id === targetSelectId) || el;
      const pos = screenToCanvas(e.clientX, e.clientY);

      // 1. Locked element handling (Axure/Figma hybrid):
      // Dragging on a locked element starts marquee selection across the canvas (never moves the locked element).
      // Clicking without moving (< 3px) selects the locked element on pointerUp so properties & unlock actions can be accessed.
      if (isElementLocked(targetEl, allElementsFlat)) {
        const inter: Interaction = {
          type: "marquee",
          startX: pos.x,
          startY: pos.y,
          currentX: pos.x,
          currentY: pos.y,
          shiftHeld: e.shiftKey,
          initialSelected: e.shiftKey ? [...effectiveSelectedIds] : [],
          lockedClickTargetId: targetSelectId,
        };
        interactionRef.current = inter;
        setInteraction(inter);
        return;
      }

      // Shift click for multi-selection toggle
      if (e.shiftKey) {
        const nextSelected = effectiveSelectedIds.includes(targetSelectId)
          ? effectiveSelectedIds.filter((id) => id !== targetSelectId)
          : [...effectiveSelectedIds, targetSelectId];
        if (onSelectIds) {
          onSelectIds(nextSelected);
        } else {
          onSelect(nextSelected[nextSelected.length - 1] ?? null);
        }
        return;
      }

      // If clicked element is already in multi-selection, start multi-move for all selected elements (excluding locked)
      if (effectiveSelectedIds.includes(targetSelectId) && effectiveSelectedIds.length > 1) {
        const moveableSelected = filterOutDescendantElements(
          selectedElements.filter((item) => !isElementLocked(item, allElementsFlat)),
          allElementsFlat,
        );
        if (moveableSelected.length > 0) {
          const boundsList = moveableSelected.map((item) => getElementDynamicBounds(item, allElementsFlat));
          const minX = Math.min(...boundsList.map((b) => b.x));
          const minY = Math.min(...boundsList.map((b) => b.y));
          const maxX = Math.max(...boundsList.map((b) => b.x + b.width));
          const maxY = Math.max(...boundsList.map((b) => b.y + b.height));

          const inter: Interaction = {
            type: "multi-move",
            startX: pos.x,
            startY: pos.y,
            initialPositions: moveableSelected.map((item) => ({
              id: item.id,
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height,
            })),
            combinedBounds: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            },
          };
          interactionRef.current = inter;
          setInteraction(inter);
          return;
        }
      }

      // Single select & move (for all elements: leaf, shapes, groups, and containers)
      onSelect(targetSelectId);
      onSelectIds?.([targetSelectId]);
      const inter: Interaction = {
        type: "move",
        id: targetSelectId,
        startX: pos.x,
        startY: pos.y,
        elStartX: targetEl.x,
        elStartY: targetEl.y,
        elW: targetEl.width,
        elH: targetEl.height,
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [allElementsFlat, selectedElements, spaceHeld, activeTool, screenToCanvas, onSelect, onSelectIds, effectiveSelectedIds, previewing],
  );

  const selectedBounds = useMemo(() => {
    const topLevelSelected = filterOutDescendantElements(selectedElements, allElementsFlat);
    if (topLevelSelected.length <= 1) return null;
    const boundsList = topLevelSelected.map((e) => getElementDynamicBounds(e, allElementsFlat));
    const minX = Math.min(...boundsList.map((b) => b.x));
    const minY = Math.min(...boundsList.map((b) => b.y));
    const maxX = Math.max(...boundsList.map((b) => b.x + b.width));
    const maxY = Math.max(...boundsList.map((b) => b.y + b.height));
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [selectedElements, allElementsFlat]);

  const handleMultiSelectionMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (previewing) return;
      if (activeTool !== "select" && activeTool !== "hand") return;
      if (e.button !== 0 || spaceHeld || activeTool === "hand") return;
      if (selectedElements.length <= 1) return;
      const moveableSelected = filterOutDescendantElements(
        selectedElements.filter((item) => !isElementLocked(item, allElementsFlat)),
        allElementsFlat,
      );
      if (moveableSelected.length === 0) return;

      e.stopPropagation();
      const pos = screenToCanvas(e.clientX, e.clientY);

      const boundsList = moveableSelected.map((item) => getElementDynamicBounds(item, allElementsFlat));
      const minX = Math.min(...boundsList.map((b) => b.x));
      const minY = Math.min(...boundsList.map((b) => b.y));
      const maxX = Math.max(...boundsList.map((b) => b.x + b.width));
      const maxY = Math.max(...boundsList.map((b) => b.y + b.height));

      const inter: Interaction = {
        type: "multi-move",
        startX: pos.x,
        startY: pos.y,
        initialPositions: moveableSelected.map((item) => ({
          id: item.id,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
        })),
        combinedBounds: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [previewing, activeTool, spaceHeld, selectedElements, allElementsFlat, screenToCanvas],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, elId: string, handle: string) => {
      if (previewing) return;
      e.stopPropagation();
      e.preventDefault();
      const el = allElementsFlat.find((item) => item.id === elId);
      if (!el || el.locked) return;
      onSelect(elId);
      onSelectIds?.([elId]);
      const pos = screenToCanvas(e.clientX, e.clientY);
      const inter: Interaction = {
        type: "resize",
        id: elId,
        handle,
        startX: pos.x,
        startY: pos.y,
        elStartX: el.x,
        elStartY: el.y,
        elW: el.width,
        elH: el.height,
        aspectRatio: el.width / (el.height || 1),
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [allElementsFlat, screenToCanvas, onSelect, onSelectIds, previewing],
  );

  const handleRotateMouseDown = useCallback(
    (e: React.MouseEvent, el: EditorElement, corner?: "nw" | "ne" | "se" | "sw") => {
      if (previewing) return;
      e.stopPropagation();
      e.preventDefault();
      if (el.locked) return;
      onSelect(el.id);
      onSelectIds?.([el.id]);
      const pos = screenToCanvas(e.clientX, e.clientY);
      const bounds = getElementWorldBounds(el, allElementsFlat);
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const startAngle = (Math.atan2(pos.y - centerY, pos.x - centerX) * 180) / Math.PI;
      const inter: Interaction = {
        type: "rotate",
        id: el.id,
        startX: pos.x,
        startY: pos.y,
        centerX,
        centerY,
        startRotation: el.rotation ?? 0,
        startAngle,
        currentRotation: el.rotation ?? 0,
        corner: corner ?? "nw",
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [allElementsFlat, screenToCanvas, onSelect, onSelectIds, previewing],
  );

  const handleRadiusMouseDown = useCallback(
    (e: React.MouseEvent, el: EditorElement, corner: "nw" | "ne" | "se" | "sw") => {
      if (previewing) return;
      e.stopPropagation();
      e.preventDefault();
      if (el.locked) return;
      onSelect(el.id);
      onSelectIds?.([el.id]);
      const pos = screenToCanvas(e.clientX, e.clientY);
      const isIndependent = Boolean(el.props.radiusIndependent);
      const isRadiusEnabled = el.props.radiusEnabled !== false && el.props.radiusEnabled !== "false";
      const baseRadius = isRadiusEnabled ? Number(el.props.radius ?? 4) : 0;
      const currentCornerRadius = isIndependent
        ? Number(
            (corner === "nw"
              ? el.props.radiusTopLeft
              : corner === "ne"
              ? el.props.radiusTopRight
              : corner === "se"
              ? el.props.radiusBottomRight
              : el.props.radiusBottomLeft) ?? baseRadius
          )
        : baseRadius;

      const inter: Interaction = {
        type: "corner-radius",
        id: el.id,
        corner,
        startX: pos.x,
        startY: pos.y,
        startRadius: currentCornerRadius,
        elW: el.width,
        elH: el.height,
        rotation: el.rotation ?? 0,
        props: { ...el.props },
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [screenToCanvas, onSelect, onSelectIds, previewing],
  );

  const handleLineEndpointMouseDown = useCallback(
    (e: React.MouseEvent, el: EditorElement, endpoint: "start" | "end") => {
      if (previewing) return;
      e.stopPropagation();
      e.preventDefault();
      if (el.locked) return;
      onSelect(el.id);
      onSelectIds?.([el.id]);
      const pos = screenToCanvas(e.clientX, e.clientY);

      const rad = (el.rotation * Math.PI) / 180;
      let fixedPoint: { x: number; y: number };
      if (endpoint === "end") {
        fixedPoint = { x: el.x, y: el.y + el.height / 2 };
      } else {
        fixedPoint = {
          x: el.x + el.width * Math.cos(rad),
          y: el.y + el.height / 2 + el.width * Math.sin(rad),
        };
      }

      const inter: Interaction = {
        type: "line-endpoint",
        id: el.id,
        endpoint,
        startX: pos.x,
        startY: pos.y,
        elStartX: el.x,
        elStartY: el.y,
        elW: el.width,
        elH: el.height,
        elRotation: el.rotation,
        fixedPoint,
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [screenToCanvas, onSelect, onSelectIds, previewing],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (previewing) return;
      if (editingElementId) {
        setEditingElementId(null);
      }
      if (dragOccurred.current) {
        dragOccurred.current = false;
        return;
      }
      if (activeTool !== "select" && activeTool !== "hand") return;

      const target = e.target as HTMLElement;
      if (
        target.closest("[data-element]") ||
        target.closest("[data-handle]") ||
        target.closest("[data-multi-selection-box]")
      ) {
        return;
      }
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (onSelectIds) onSelectIds([]);
      else onSelect(null);
      onCanvasClick(e, pos.x, pos.y);
    },
    [previewing, editingElementId, screenToCanvas, onSelect, onSelectIds, onCanvasClick, activeTool],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (previewing) return;

      // 1. Check for dropped files (images or .bluepen / .json project files)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onDropFile) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          const fileName = file.name.toLowerCase();
          if (file.type.startsWith("image/") || fileName.endsWith(".bluepen") || fileName.endsWith(".json")) {
            const pos = screenToCanvas(e.clientX, e.clientY);
            onDropFile(file, snap(pos.x), snap(pos.y));
            return;
          }
        }
      }

      // 2. Check for library asset drag & drop
      if (!onDropAsset) return;
      try {
        const raw =
          e.dataTransfer.getData("application/json") ||
          e.dataTransfer.getData("text/plain") ||
          e.dataTransfer.getData("text");
        if (!raw) return;

        let compType: ComponentType | null = null;
        let defaultProps: Record<string, string | number | boolean> | undefined;
        let defaultWidth: number | undefined;
        let defaultHeight: number | undefined;
        let label: string | undefined;

        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object" && parsed.type) {
            compType = parsed.type as ComponentType;
            defaultProps = parsed.defaultProps;
            defaultWidth = parsed.defaultWidth;
            defaultHeight = parsed.defaultHeight;
            label = parsed.label;
          } else if (typeof parsed === "string") {
            compType = parsed as ComponentType;
          }
        } catch {
          // If not valid JSON, treat raw string directly as component type
          compType = raw.trim() as ComponentType;
        }

        if (compType) {
          const pos = screenToCanvas(e.clientX, e.clientY);
          onDropAsset(compType, snap(pos.x), snap(pos.y), defaultProps, defaultWidth, defaultHeight, label);
        }
      } catch {
        // Ignore parsing errors
      }
    },
    [previewing, onDropFile, onDropAsset, screenToCanvas, snap],
  );

  const handleAnchorMouseDown = useCallback(
    (e: React.MouseEvent, el: EditorElement, port: AnchorPort) => {
      if (previewing || el.locked) return;
      if (activeTool !== "connector" && interaction?.type !== "create-connector" && interaction?.type !== "connector-endpoint") return;
      e.stopPropagation();
      e.preventDefault();
      const anchor = getElementAnchor(el, port, allElementsFlat);
      const inter: Interaction = {
        type: "create-connector",
        startElementId: el.id,
        startPort: port,
        startX: anchor.point.x,
        startY: anchor.point.y,
        currentX: anchor.point.x,
        currentY: anchor.point.y,
        targetElementId: null,
        targetPort: null,
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [previewing, activeTool, interaction, allElementsFlat],
  );

  const handleConnectorEndpointMouseDown = useCallback(
    (e: React.MouseEvent, connector: EditorElement, endpoint: "start" | "end") => {
      if (previewing || connector.locked) return;
      e.stopPropagation();
      e.preventDefault();
      onSelect(connector.id);
      onSelectIds?.([connector.id]);

      const isStart = endpoint === "start";
      const oppElId = (isStart ? connector.props.endElementId : connector.props.startElementId) as string | undefined;
      const oppPort = (isStart ? connector.props.endPort : connector.props.startPort) as AnchorPort | undefined;
      const oppEl = oppElId ? allElementsFlat.find((item) => item.id === oppElId) : null;
      let fixedPt: { x: number; y: number };
      if (oppEl) {
        fixedPt = getElementAnchor(oppEl, oppPort || (isStart ? "left" : "right"), allElementsFlat).point;
      } else {
        fixedPt = {
          x: Number(isStart ? (connector.props.endPointX ?? connector.x + connector.width) : (connector.props.startPointX ?? connector.x)),
          y: Number(isStart ? (connector.props.endPointY ?? connector.y + connector.height) : (connector.props.startPointY ?? connector.y)),
        };
      }

      const pos = screenToCanvas(e.clientX, e.clientY);
      const inter: Interaction = {
        type: "connector-endpoint",
        id: connector.id,
        endpoint,
        fixedPoint: fixedPt,
        fixedElementId: oppElId || null,
        fixedPort: oppPort || null,
        startX: pos.x,
        startY: pos.y,
        currentX: pos.x,
        currentY: pos.y,
        targetElementId: null,
        targetPort: null,
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [allElementsFlat, onSelect, onSelectIds, previewing, screenToCanvas],
  );

  const handleConnectorSegmentMouseDown = useCallback(
    (
      e: React.MouseEvent,
      connector: EditorElement,
      segmentIndex: number,
      isVertical: boolean,
      currentWaypoints: Point[],
      startPos: number,
    ) => {
      if (previewing || connector.locked) return;
      e.stopPropagation();
      e.preventDefault();
      onSelect(connector.id);
      onSelectIds?.([connector.id]);

      const pos = screenToCanvas(e.clientX, e.clientY);
      const inter: Interaction = {
        type: "connector-segment",
        id: connector.id,
        segmentIndex,
        isVertical,
        initialWaypoints: currentWaypoints,
        startX: pos.x,
        startY: pos.y,
        startPos,
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [previewing, screenToCanvas, onSelect, onSelectIds],
  );

  const isDrawingTool = activeTool !== "select" && activeTool !== "hand";

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative flex-1 overflow-hidden bg-background outline-none select-none touch-none overscroll-none",
        (spaceHeld || activeTool === "hand") && "cursor-grab",
        isPanning && "cursor-grabbing",
        !spaceHeld && activeTool === "select" && "cursor-default",
        !spaceHeld && isDrawingTool && "cursor-crosshair",
      )}
      style={{
        cursor:
          interaction?.type === "rotate"
            ? ROTATE_CURSORS[interaction.corner ?? "nw"]
            : undefined,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={(e) => {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onCanvasPointerMove?.(pos);
        onContextMenu?.(e, pos);
      }}
      onPointerMove={(e) => {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onCanvasPointerMove?.(pos);
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
      data-canvas
    >
      {/* Infinite Dot Grid */}
      {showGrid && (
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="canvas-grid-pattern"
              width={GRID_SIZE * zoom}
              height={GRID_SIZE * zoom}
              patternUnits="userSpaceOnUse"
              x={((pan.x % (GRID_SIZE * zoom)) + (GRID_SIZE * zoom)) % (GRID_SIZE * zoom)}
              y={((pan.y % (GRID_SIZE * zoom)) + (GRID_SIZE * zoom)) % (GRID_SIZE * zoom)}
            >
              <circle
                cx={0}
                cy={0}
                r={Math.max(1, 1 * Math.min(1.5, zoom))}
                fill="var(--border-visible)"
              />
              <circle
                cx={GRID_SIZE * zoom}
                cy={0}
                r={Math.max(1, 1 * Math.min(1.5, zoom))}
                fill="var(--border-visible)"
              />
              <circle
                cx={0}
                cy={GRID_SIZE * zoom}
                r={Math.max(1, 1 * Math.min(1.5, zoom))}
                fill="var(--border-visible)"
              />
              <circle
                cx={GRID_SIZE * zoom}
                cy={GRID_SIZE * zoom}
                r={Math.max(1, 1 * Math.min(1.5, zoom))}
                fill="var(--border-visible)"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" />
        </svg>
      )}

      {/* Infinite Content Layer */}
      <div
        ref={contentRef}
        className="pointer-events-none absolute inset-0 size-full"
      >
        <div
          className="pointer-events-auto origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          data-canvas-area
        >
          {/* Multi-Selection Interactive Background Hit Area */}
          {selectedBounds && (
            <div
              data-multi-selection-box
              className={cn(
                "absolute z-0 select-none bg-transparent",
                previewing && "pointer-events-none",
                isDrawingTool && "pointer-events-none",
                !previewing && !spaceHeld && activeTool === "select" && "cursor-move",
              )}
              style={{
                left: selectedBounds.x,
                top: selectedBounds.y,
                width: selectedBounds.width,
                height: selectedBounds.height,
              }}
              onMouseDown={handleMultiSelectionMouseDown}
            />
          )}

          {/* Interactive Connector Lines Layer */}
          <ConnectorLinesLayer
            connectors={elements.filter((el) => el.type === "connector")}
            allElementsFlat={allElementsFlat}
            selectedIds={effectiveSelectedIds}
            zoom={zoom}
            previewing={previewing}
            onSelect={onSelect}
            onSelectIds={onSelectIds}
            onStartEndpointDrag={handleConnectorEndpointMouseDown}
            onStartSegmentDrag={handleConnectorSegmentMouseDown}
          />

          {elements
            .filter((el) => el.type !== "connector" && (!el.parentId || !elements.some((p) => p.id === el.parentId)))
            .map((el) => (
              <ElementNode
                key={el.id}
                el={el}
                allElementsFlat={allElementsFlat}
                effectiveSelectedIds={effectiveSelectedIds}
                ancestorLocked={false}
                interaction={interaction}
                isPanning={isPanning}
                spaceHeld={spaceHeld}
                previewing={previewing}
                activeTool={activeTool}
                zoom={zoom}
                editingElementId={editingElementId}
                onStartEditing={setEditingElementId}
                onStopEditing={() => {
                  setEditingElementId(null);
                  onCommitMove();
                }}
                onElementMouseDown={handleElementMouseDown}
                onResizeMouseDown={handleResizeMouseDown}
                onRotateMouseDown={handleRotateMouseDown}
                onRadiusMouseDown={handleRadiusMouseDown}
                onLineEndpointMouseDown={handleLineEndpointMouseDown}
                onAnchorMouseDown={handleAnchorMouseDown}
                onSelect={onSelect}
                onUpdateElement={onUpdateElement}
              />
            ))}

          {/* Unified Multi-Selection Bounding Box */}
          <MultiSelectionBoundingBox selectedElements={selectedElements} allElementsFlat={allElementsFlat} />

          {/* Live Marquee Box Selection Overlay */}
          <MarqueeSelectionOverlay interaction={interaction} />

          {/* Live Drag-to-Create Drawing Ghost Preview */}
          <DrawingPreviewOverlay interaction={interaction} allElementsFlat={allElementsFlat} zoom={zoom} />

          {/* Top-level Smart Guides & Alt Distance Overlay */}
          <SmartGuidesOverlay
            guides={[...activeGuides, ...altGuides]}
            indicator={snapIndicator}
            zoom={zoom}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onZoomChange?.(1)}
        title="点击重置缩放为 100%"
        className="absolute bottom-4 right-4 rounded-md border border-border-visible bg-surface px-2.5 py-1 font-mono text-[11px] font-bold text-foreground hover:border-foreground transition-colors cursor-pointer select-none"
      >
        {Math.round(zoom * 100)}%
      </button>
    </div>
  );
}
