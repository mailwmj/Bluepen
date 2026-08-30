"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import type { AnchorPort, ComponentType, EditorElement } from "../types";
import { cn } from "@bluepen/editor/lib/utils";
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
import {
  getElementAnchor,
  getClosestAnchorOnElement,
  findNearestSnapAnchor,
  calculateOrthogonalPath,
  calculateStraightPath,
  calculateCurvedPath,
  ANCHOR_PORTS,
  PORT_LABELS,
  type AnchorInfo,
  type Point,
  type Vector,
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
  onDropAsset?: (type: ComponentType, x: number, y: number) => void;
}

const GRID_SIZE = 20;

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

function SmartGuidesOverlay({
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
              ? "#EF4444"
              : g.color === "blue"
              ? "#3B82F6"
              : "#EC4899";

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

        {/* Magnetic Snap Point Indicator (Figma/Axure style glowing target anchor/edge) */}
        {indicator && (
          <g transform={`translate(${indicator.x}, ${indicator.y})`}>
            {/* Outer halo ring */}
            <circle
              r={8 / Math.max(0.5, zoom)}
              fill="rgba(37, 99, 235, 0.25)"
              stroke="#2563EB"
              strokeWidth={1.5 / Math.max(0.5, zoom)}
            />
            {/* Core anchor dot */}
            <circle
              r={4 / Math.max(0.5, zoom)}
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth={1.5 / Math.max(0.5, zoom)}
            />
          </g>
        )}
      </svg>

      {/* Numerical measurement labels */}
      {guides
        .filter((g) => g.label && g.labelPosition)
        .map((g) => (
          <div
            key={`lbl-${g.id}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-[#EC4899] bg-white/95 shadow-xs border border-[#EC4899]/40 leading-none select-none"
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
}

/**
 * Renders the marquee multi-selection box when dragging on empty canvas space (Image 1 style).
 */
function MarqueeSelectionOverlay({
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
      className="pointer-events-none absolute z-[40] border border-blue-500 bg-blue-500/15 select-none"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
}

/**
 * Renders the live creation preview ghost when clicking and dragging a new shape or connector on the canvas.
 */
function DrawingPreviewOverlay({
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
    let endPoint: Point;
    let endDir: Vector | undefined;

    if (interaction.type === "create-connector") {
      const startEl = interaction.startElementId ? allElementsFlat.find((e) => e.id === interaction.startElementId) : null;
      if (startEl && interaction.startPort) {
        const anchor = getElementAnchor(startEl, interaction.startPort, allElementsFlat);
        startPoint = anchor.point;
        startDir = anchor.dir;
      } else {
        startPoint = { x: interaction.startX, y: interaction.startY };
      }

      const targetEl = interaction.targetElementId ? allElementsFlat.find((e) => e.id === interaction.targetElementId) : null;
      if (targetEl && interaction.targetPort) {
        const anchor = getElementAnchor(targetEl, interaction.targetPort, allElementsFlat);
        endPoint = anchor.point;
        endDir = anchor.dir;
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
        } else {
          startPoint = { x: interaction.currentX, y: interaction.currentY };
        }
        endPoint = interaction.fixedPoint;
        const fixEl = interaction.fixedElementId ? allElementsFlat.find((e) => e.id === interaction.fixedElementId) : null;
        if (fixEl && interaction.fixedPort) {
          endDir = getElementAnchor(fixEl, interaction.fixedPort, allElementsFlat).dir;
        }
      } else {
        startPoint = interaction.fixedPoint;
        const fixEl = interaction.fixedElementId ? allElementsFlat.find((e) => e.id === interaction.fixedElementId) : null;
        if (fixEl && interaction.fixedPort) {
          startDir = getElementAnchor(fixEl, interaction.fixedPort, allElementsFlat).dir;
        }
        const targetEl = interaction.targetElementId ? allElementsFlat.find((e) => e.id === interaction.targetElementId) : null;
        if (targetEl && interaction.targetPort) {
          const anchor = getElementAnchor(targetEl, interaction.targetPort, allElementsFlat);
          endPoint = anchor.point;
          endDir = anchor.dir;
        } else {
          endPoint = { x: interaction.currentX, y: interaction.currentY };
        }
      }
    }

    const { d } = calculateOrthogonalPath(
      { point: startPoint, dir: startDir },
      { point: endPoint, dir: endDir },
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
}

/**
 * Dedicated layer rendering all smart reactive connector lines.
 */
function ConnectorLinesLayer({
  connectors,
  allElementsFlat,
  selectedIds,
  zoom,
  previewing,
  onSelect,
  onSelectIds,
  onStartEndpointDrag,
}: {
  connectors: EditorElement[];
  allElementsFlat: EditorElement[];
  selectedIds: string[];
  zoom: number;
  previewing: boolean;
  onSelect: (id: string | null) => void;
  onSelectIds?: (ids: string[]) => void;
  onStartEndpointDrag: (e: React.MouseEvent, connector: EditorElement, endpoint: "start" | "end") => void;
}) {
  if (!connectors || connectors.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 overflow-visible z-[15]"
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
        let endPt: Point;
        let endDir: Vector | undefined;

        if (startEl) {
          const anchor = getElementAnchor(startEl, (c.props.startPort as AnchorPort) || "right", allElementsFlat);
          startPt = anchor.point;
          startDir = anchor.dir;
        } else {
          startPt = { x: Number(c.props.startPointX ?? c.x), y: Number(c.props.startPointY ?? c.y) };
        }

        if (endEl) {
          const anchor = getElementAnchor(endEl, (c.props.endPort as AnchorPort) || "left", allElementsFlat);
          endPt = anchor.point;
          endDir = anchor.dir;
        } else {
          endPt = { x: Number(c.props.endPointX ?? c.x + c.width), y: Number(c.props.endPointY ?? c.y + c.height) };
        }

        const routing = String(c.props.routing || "orthogonal");
        const radius = Number(c.props.radius ?? 8);
        const { d, midpoint } =
          routing === "straight"
            ? calculateStraightPath({ point: startPt }, { point: endPt })
            : routing === "curved"
            ? calculateCurvedPath({ point: startPt, dir: startDir }, { point: endPt, dir: endDir })
            : calculateOrthogonalPath({ point: startPt, dir: startDir }, { point: endPt, dir: endDir }, radius);

        const stroke = String(c.props.stroke || "#71717A");
        const borderWidth = Number(c.props.borderWidth ?? 1.5);
        const strokeStyle = String(c.props.strokeStyle || "solid");
        const strokeDasharray = strokeStyle === "dashed" ? "5 4" : strokeStyle === "dotted" ? "2 3" : undefined;
        const startArrow = String(c.props.startArrow || "none");
        const endArrow = String(c.props.endArrow || "arrow");
        const text = String(c.props.text || "");

        return (
          <g key={c.id} className="group pointer-events-auto cursor-pointer select-none">
            {/* Wide transparent hit path for easy clicking & selection */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(16, 16 / zoom)}
              onMouseDown={(e) => {
                if (previewing || c.locked) return;
                e.stopPropagation();
                if (e.shiftKey && onSelectIds) {
                  const next = selectedIds.includes(c.id) ? selectedIds.filter((id) => id !== c.id) : [...selectedIds, c.id];
                  onSelectIds(next);
                } else {
                  onSelect(c.id);
                  onSelectIds?.([c.id]);
                }
              }}
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
              className="transition-colors group-hover:stroke-blue-500"
            />

            {/* Midpoint Text Label */}
            {text && (
              <g
                transform={`translate(${midpoint.x}, ${midpoint.y})`}
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

            {/* Reconnection Endpoint Handles */}
            {isSelected && !previewing && !c.locked && (
              <>
                <circle
                  cx={startPt.x}
                  cy={startPt.y}
                  r={5 / Math.max(0.5, zoom)}
                  fill="#FFFFFF"
                  stroke="#2563EB"
                  strokeWidth={2 / Math.max(0.5, zoom)}
                  className="cursor-crosshair hover:scale-125 transition-transform"
                  onMouseDown={(e) => onStartEndpointDrag(e, c, "start")}
                >
                  <title>重新连接起点</title>
                </circle>
                <circle
                  cx={endPt.x}
                  cy={endPt.y}
                  r={5 / Math.max(0.5, zoom)}
                  fill="#FFFFFF"
                  stroke="#2563EB"
                  strokeWidth={2 / Math.max(0.5, zoom)}
                  className="cursor-crosshair hover:scale-125 transition-transform"
                  onMouseDown={(e) => onStartEndpointDrag(e, c, "end")}
                >
                  <title>重新连接终点</title>
                </circle>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Unified multi-selection bounding box (Image 2 style)
 * Pointer events are strictly NONE so it never intercepts clicks on underlying elements or canvas.
 */
function MultiSelectionBoundingBox({
  selectedElements,
}: {
  selectedElements: EditorElement[];
}) {
  if (selectedElements.length <= 1) return null;

  const minX = Math.min(...selectedElements.map((e) => e.x));
  const minY = Math.min(...selectedElements.map((e) => e.y));
  const maxX = Math.max(...selectedElements.map((e) => e.x + e.width));
  const maxY = Math.max(...selectedElements.map((e) => e.y + e.height));

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
        <span>{selectedElements.length} 项已选中</span>
      </div>
    </div>
  );
}

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
  onDropAsset,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
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
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.key === "Alt" && !e.repeat) {
        setAltHeld(true);
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
  }, []);

  // Native Non-Passive Wheel Event Listener for Ctrl + Wheel Canvas Zooming
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
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
        if (
          !target.closest("[data-element]") &&
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
    const handleWindowPointerMove = (e: PointerEvent) => {
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

        const hitIds = allElementsFlat
          .filter(
            (el) =>
              el.visible &&
              rectsIntersect(marqueeBox, {
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
              }),
          )
          .map((el) => el.id);

        if (curInter.shiftHeld) {
          const merged = Array.from(new Set([...curInter.initialSelected, ...hitIds]));
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
          setActiveGuides(snapRes.guides);
          setSnapIndicator(snapRes.indicator ?? null);
          onUpdateElement(curInter.id, {
            x: snapRes.x,
            y: snapRes.y,
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
        let delta = 0;
        if (curInter.corner === "nw") delta = (dx + dy) / 2;
        else if (curInter.corner === "ne") delta = (-dx + dy) / 2;
        else if (curInter.corner === "se") delta = (-dx - dy) / 2;
        else if (curInter.corner === "sw") delta = (dx - dy) / 2;

        const nextRadius = Math.max(0, Math.min(maxRadius, Math.round(curInter.startRadius + delta)));
        onUpdateElement(curInter.id, {
          props: { ...curInter.props, radius: nextRadius },
        });
      } else if (curInter.type === "rotate") {
        const curAngle = (Math.atan2(pos.y - curInter.centerY, pos.x - curInter.centerX) * 180) / Math.PI;
        const deltaAngle = curAngle - curInter.startAngle;
        let newRot = curInter.startRotation + deltaAngle;
        if (e.shiftKey) {
          newRot = Math.round(newRot / 15) * 15;
        }
        newRot = ((Math.round(newRot) % 360) + 360) % 360;
        onUpdateElement(curInter.id, { rotation: newRot });
      } else if (curInter.type === "resize" && curInter.handle) {
        const h = curInter.handle;
        let x = curInter.elStartX;
        let y = curInter.elStartY;
        let w = curInter.elW;
        let hh = curInter.elH;
        const isCorner = h.length === 2;

        if (e.shiftKey && isCorner) {
          const ratio = curInter.aspectRatio || 1;
          if (h === "se") {
            const propW = Math.max(10, curInter.elW + dx);
            const propH = Math.max(10, curInter.elH + dy);
            const scale = Math.max(propW / curInter.elW, propH / curInter.elH);
            w = Math.max(10, Math.round(curInter.elW * scale));
            hh = Math.max(10, Math.round(w / ratio));
          } else if (h === "nw") {
            const propW = Math.max(10, curInter.elW - dx);
            const propH = Math.max(10, curInter.elH - dy);
            const scale = Math.max(propW / curInter.elW, propH / curInter.elH);
            w = Math.max(10, Math.round(curInter.elW * scale));
            hh = Math.max(10, Math.round(w / ratio));
            x = curInter.elStartX + (curInter.elW - w);
            y = curInter.elStartY + (curInter.elH - hh);
          } else if (h === "ne") {
            const propW = Math.max(10, curInter.elW + dx);
            const propH = Math.max(10, curInter.elH - dy);
            const scale = Math.max(propW / curInter.elW, propH / curInter.elH);
            w = Math.max(10, Math.round(curInter.elW * scale));
            hh = Math.max(10, Math.round(w / ratio));
            y = curInter.elStartY + (curInter.elH - hh);
          } else if (h === "sw") {
            const propW = Math.max(10, curInter.elW - dx);
            const propH = Math.max(10, curInter.elH + dy);
            const scale = Math.max(propW / curInter.elW, propH / curInter.elH);
            w = Math.max(10, Math.round(curInter.elW * scale));
            hh = Math.max(10, Math.round(w / ratio));
            x = curInter.elStartX + (curInter.elW - w);
          }
        } else {
          if (h.includes("e")) {
            w = Math.max(10, Math.round(curInter.elW + dx));
          } else if (h.includes("w")) {
            const proposedW = Math.round(curInter.elW - dx);
            if (proposedW >= 10) {
              w = proposedW;
              x = curInter.elStartX + (curInter.elW - proposedW);
            } else {
              w = 10;
              x = curInter.elStartX + (curInter.elW - 10);
            }
          }

          if (h.includes("s")) {
            hh = Math.max(10, Math.round(curInter.elH + dy));
          } else if (h.includes("n")) {
            const proposedH = Math.round(curInter.elH - dy);
            if (proposedH >= 10) {
              hh = proposedH;
              y = curInter.elStartY + (curInter.elH - proposedH);
            } else {
              hh = 10;
              y = curInter.elStartY + (curInter.elH - 10);
            }
          }
        }

        const snapRes = calculateResizeSnapping(
          curInter.id,
          curInter.handle,
          { x, y, width: w, height: hh },
          allElementsFlat,
          zoom,
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

    const handleWindowPointerUp = () => {
      setActiveGuides([]);
      setSnapIndicator(null);
      const curInter = interactionRef.current;

      if (curInter?.type === "marquee") {
        const { startX, startY, currentX, currentY, shiftHeld, initialSelected } = curInter;
        const w = Math.abs(currentX - startX);
        const h = Math.abs(currentY - startY);

        if (w >= 3 || h >= 3) {
          const marqueeBox = {
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            width: w,
            height: h,
          };

          const hitIds = allElementsFlat
            .filter(
              (el) =>
                el.visible &&
                rectsIntersect(marqueeBox, {
                  x: el.x,
                  y: el.y,
                  width: el.width,
                  height: el.height,
                }),
            )
            .map((el) => el.id);

          if (shiftHeld) {
            const merged = Array.from(new Set([...initialSelected, ...hitIds]));
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
          if (!shiftHeld) {
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
        if (activeTool === "connector") {
          onSelectTool?.("select");
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
      if (!el || el.locked) return;
      e.stopPropagation();

      const pos = screenToCanvas(e.clientX, e.clientY);

      // Shift click for multi-selection toggle
      if (e.shiftKey) {
        const nextSelected = effectiveSelectedIds.includes(elId)
          ? effectiveSelectedIds.filter((id) => id !== elId)
          : [...effectiveSelectedIds, elId];
        if (onSelectIds) {
          onSelectIds(nextSelected);
        } else {
          onSelect(nextSelected[nextSelected.length - 1] ?? null);
        }
        return;
      }

      // If clicked element is already in multi-selection, start multi-move for all selected elements
      if (effectiveSelectedIds.includes(elId) && effectiveSelectedIds.length > 1) {
        const minX = Math.min(...selectedElements.map((item) => item.x));
        const minY = Math.min(...selectedElements.map((item) => item.y));
        const maxX = Math.max(...selectedElements.map((item) => item.x + item.width));
        const maxY = Math.max(...selectedElements.map((item) => item.y + item.height));

        const inter: Interaction = {
          type: "multi-move",
          startX: pos.x,
          startY: pos.y,
          initialPositions: selectedElements.map((item) => ({
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

      // Single select & move
      onSelect(elId);
      onSelectIds?.([elId]);
      const inter: Interaction = {
        type: "move",
        id: elId,
        startX: pos.x,
        startY: pos.y,
        elStartX: el.x,
        elStartY: el.y,
        elW: el.width,
        elH: el.height,
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [allElementsFlat, selectedElements, spaceHeld, activeTool, screenToCanvas, onSelect, onSelectIds, effectiveSelectedIds, previewing],
  );

  const selectedBounds = useMemo(() => {
    if (selectedElements.length <= 1) return null;
    const minX = Math.min(...selectedElements.map((e) => e.x));
    const minY = Math.min(...selectedElements.map((e) => e.y));
    const maxX = Math.max(...selectedElements.map((e) => e.x + e.width));
    const maxY = Math.max(...selectedElements.map((e) => e.y + e.height));
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [selectedElements]);

  const handleMultiSelectionMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (previewing) return;
      if (activeTool !== "select" && activeTool !== "hand") return;
      if (e.button !== 0 || spaceHeld || activeTool === "hand") return;
      if (selectedElements.length <= 1) return;
      if (selectedElements.every((item) => item.locked)) return;

      e.stopPropagation();
      const pos = screenToCanvas(e.clientX, e.clientY);

      const minX = Math.min(...selectedElements.map((item) => item.x));
      const minY = Math.min(...selectedElements.map((item) => item.y));
      const maxX = Math.max(...selectedElements.map((item) => item.x + item.width));
      const maxY = Math.max(...selectedElements.map((item) => item.y + item.height));

      const inter: Interaction = {
        type: "multi-move",
        startX: pos.x,
        startY: pos.y,
        initialPositions: selectedElements.map((item) => ({
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
    [previewing, activeTool, spaceHeld, selectedElements, screenToCanvas],
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
    (e: React.MouseEvent, el: EditorElement) => {
      if (previewing) return;
      e.stopPropagation();
      e.preventDefault();
      if (el.locked) return;
      onSelect(el.id);
      onSelectIds?.([el.id]);
      const pos = screenToCanvas(e.clientX, e.clientY);
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;
      const startAngle = (Math.atan2(pos.y - centerY, pos.x - centerX) * 180) / Math.PI;
      const inter: Interaction = {
        type: "rotate",
        id: el.id,
        startX: pos.x,
        startY: pos.y,
        centerX,
        centerY,
        startRotation: el.rotation,
        startAngle,
      };
      interactionRef.current = inter;
      setInteraction(inter);
    },
    [screenToCanvas, onSelect, onSelectIds, previewing],
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
      const inter: Interaction = {
        type: "corner-radius",
        id: el.id,
        corner,
        startX: pos.x,
        startY: pos.y,
        startRadius: Number(el.props.radius ?? 4),
        elW: el.width,
        elH: el.height,
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
    [screenToCanvas, onSelect, onSelectIds, onCanvasClick],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (previewing || !onDropAsset) return;
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.type) {
          const pos = screenToCanvas(e.clientX, e.clientY);
          onDropAsset(parsed.type as ComponentType, snap(pos.x), snap(pos.y));
        }
      } catch {
        // Ignore parsing errors
      }
    },
    [previewing, onDropAsset, screenToCanvas, snap],
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
    [previewing, allElementsFlat, activeTool, interaction],
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
    const [isHovered, setIsHovered] = useState(false);
    const isSelected = effectiveSelectedIds.includes(el.id);
    const isSingleSelected = effectiveSelectedIds.length === 1 && isSelected;
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
    const showAnchors = !previewing && !locked && el.type !== "connector" && isConnectorMode;

    return (
      <div
        key={el.id}
        data-element
        data-element-id={el.id}
        className={cn(
          "absolute z-10 select-none",
          previewing && "pointer-events-none",
          locked && "cursor-default opacity-60",
          !locked &&
            (!interaction || ("id" in interaction && interaction.id !== el.id)) &&
            (activeTool === "select"
              ? "cursor-move"
              : activeTool === "connector"
              ? "cursor-crosshair"
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => onElementMouseDown(e, el.id)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onSelect(el.id);
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
        <ElementRenderer element={el}>
          {el.children &&
            el.children.length > 0 &&
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

              return (
                <div
                  key={port}
                  data-handle
                  data-anchor-port={port}
                  className="absolute z-[35] flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center cursor-crosshair group/anchor"
                  style={posStyle}
                  title={`从此处连线 (${PORT_LABELS[port]})`}
                  onMouseDown={(e) => handleAnchorMouseDown(e, el, port)}
                >
                  <div className="size-2.5 rounded-full border-1.5 border-blue-500 bg-white shadow-xs transition-all group-hover/anchor:bg-blue-600 group-hover/anchor:border-blue-600 group-hover/anchor:scale-125" />
                </div>
              );
            })}
          </>
        )}

        {isSelected && !locked && !previewing && (
          <>
            {isLineLike ? (
              /* Line endpoint handles */
              <>
                <div
                  data-handle
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 z-30 size-3 rounded-full border-2 border-blue-500 bg-white shadow-xs cursor-crosshair hover:scale-125 transition-transform"
                  title="起点 / 方向 (Shift 水平/垂直/45°)"
                  onMouseDown={(e) => handleLineEndpointMouseDown(e, el, "start")}
                />
                <div
                  data-handle
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-30 size-3 rounded-full border-2 border-blue-500 bg-white shadow-xs cursor-crosshair hover:scale-125 transition-transform"
                  title="终点 / 方向 (Shift 水平/垂直/45°)"
                  onMouseDown={(e) => handleLineEndpointMouseDown(e, el, "end")}
                />
              </>
            ) : (
              /* Standard 2D shape bounding box and handles */
              <>
                {/* 1px crisp blue selection border */}
                <div
                  className="pointer-events-none absolute inset-0 border border-blue-500 z-10"
                  data-handle
                />

                {/* Show rotation and resize handles on single selection */}
                {isSingleSelected && (
                  <>
                    {/* Top center rotation handle */}
                    <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 h-3 w-[1px] bg-blue-500 z-10" />
                    <div
                      data-handle
                      className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 size-2.5 rounded-full border border-blue-500 bg-white cursor-grab shadow-xs hover:scale-125 transition-transform"
                      title="旋转 (Shift 15°吸附)"
                      onMouseDown={(e) => handleRotateMouseDown(e, el)}
                    />

                    {/* 4 corner radius inner dots */}
                    {hasCornerRadius &&
                      (() => {
                        const curRadius = Number(el.props.radius ?? 4);
                        const maxR = Math.min(el.width, el.height) / 2;
                        const offset = Math.max(6, Math.min(curRadius + 4, maxR - 4));
                        return (
                          <>
                            <div
                              data-handle
                              className="absolute z-25 size-2 rounded-full border border-blue-500 bg-white cursor-crosshair shadow-xs hover:scale-125 transition-transform"
                              style={{ top: offset, left: offset }}
                              title="调节圆角"
                              onMouseDown={(e) => handleRadiusMouseDown(e, el, "nw")}
                            />
                            <div
                              data-handle
                              className="absolute z-25 size-2 rounded-full border border-blue-500 bg-white cursor-crosshair shadow-xs hover:scale-125 transition-transform"
                              style={{ top: offset, right: offset }}
                              title="调节圆角"
                              onMouseDown={(e) => handleRadiusMouseDown(e, el, "ne")}
                            />
                            <div
                              data-handle
                              className="absolute z-25 size-2 rounded-full border border-blue-500 bg-white cursor-crosshair shadow-xs hover:scale-125 transition-transform"
                              style={{ bottom: offset, left: offset }}
                              title="调节圆角"
                              onMouseDown={(e) => handleRadiusMouseDown(e, el, "sw")}
                            />
                            <div
                              data-handle
                              className="absolute z-25 size-2 rounded-full border border-blue-500 bg-white cursor-crosshair shadow-xs hover:scale-125 transition-transform"
                              style={{ bottom: offset, right: offset }}
                              title="调节圆角"
                              onMouseDown={(e) => handleRadiusMouseDown(e, el, "se")}
                            />
                          </>
                        );
                      })()}

                    {/* 8 resize handle control points */}
                    {[
                      { id: "nw", style: { top: -3.5, left: -3.5, cursor: "nwse-resize" } },
                      { id: "n", style: { top: -3.5, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" } },
                      { id: "ne", style: { top: -3.5, right: -3.5, cursor: "nesw-resize" } },
                      { id: "e", style: { top: "50%", right: -3.5, transform: "translateY(-50%)", cursor: "ew-resize" } },
                      { id: "se", style: { bottom: -3.5, right: -3.5, cursor: "nwse-resize" } },
                      { id: "s", style: { bottom: -3.5, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" } },
                      { id: "sw", style: { bottom: -3.5, left: -3.5, cursor: "nesw-resize" } },
                      { id: "w", style: { top: "50%", left: -3.5, transform: "translateY(-50%)", cursor: "ew-resize" } },
                    ].map((handle) => (
                      <div
                        key={handle.id}
                        data-handle
                        className="absolute z-20 size-2 border border-blue-500 bg-white shadow-xs"
                        style={handle.style}
                        onMouseDown={(e) => onResizeMouseDown(e, el.id, handle.id)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  };

  const isDrawingTool = activeTool !== "select" && activeTool !== "hand";

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative flex-1 overflow-hidden bg-muted outline-none",
        (spaceHeld || activeTool === "hand") && "cursor-grab",
        isPanning && "cursor-grabbing",
        !spaceHeld && activeTool === "select" && "cursor-default",
        !spaceHeld && isDrawingTool && "cursor-crosshair",
      )}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
      data-canvas
    >
      {/* Infinite Grid */}
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
              <path
                d={`M ${GRID_SIZE * zoom} 0 L 0 0 0 ${GRID_SIZE * zoom}`}
                fill="none"
                className="stroke-[var(--color-border)]"
                strokeWidth="0.5"
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
          {/* Multi-Selection Interactive Background Hit Area (enables dragging from empty spaces inside bounding box) */}
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
          />

          {elements
            .filter((el) => el.type !== "connector" && (!el.parentId || !elements.some((p) => p.id === el.parentId)))
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

          {/* Unified Multi-Selection Bounding Box (Image 2 style) */}
          <MultiSelectionBoundingBox selectedElements={selectedElements} />

          {/* Live Marquee Box Selection Overlay (Image 1 style) */}
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

      <div className="absolute bottom-4 right-4 rounded-lg border bg-background px-2.5 py-1 text-xs text-muted-foreground shadow-xs">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
