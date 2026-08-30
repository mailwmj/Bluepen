import type { EditorElement } from "../types";

export interface SnapGuideLine {
  id: string;
  type: "vertical" | "horizontal";
  position: number; // canvas coordinate on the aligned axis
  start: number;    // start canvas coordinate along perpendicular axis
  end: number;      // end canvas coordinate along perpendicular axis
  color: "blue" | "red" | "pink";
  label?: string | number;
  labelPosition?: { x: number; y: number };
}

export interface DistanceBadge {
  id: string;
  x: number;
  y: number;
  value: number;
  direction: "horizontal" | "vertical";
  length: number;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
}

export interface Rect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface SnapResult {
  x: number;
  y: number;
  width?: number;
  height?: number;
  guides: SnapGuideLine[];
  distances: DistanceBadge[];
  indicator?: SnapIndicatorPoint | null;
}

export interface SnapIndicatorPoint {
  id: string;
  x: number;
  y: number;
  type: "anchor" | "edge" | "vertex" | "axis";
}

export interface EndpointSnapResult {
  x: number;
  y: number;
  guides: SnapGuideLine[];
  indicator: SnapIndicatorPoint | null;
  snappedAngle?: number;
}

const SNAP_THRESHOLD = 12; // snap threshold in canvas coordinates

/**
 * Calculates smart alignment, snapping, guide lines, and distance annotations
 * when moving an active element.
 */
export function calculateSnapping(
  activeId: string,
  rawX: number,
  rawY: number,
  width: number,
  height: number,
  allElements: EditorElement[],
  zoom = 1,
  frameBounds?: { x: number; y: number; width: number; height: number } | null,
): SnapResult {
  const threshold = SNAP_THRESHOLD / Math.max(0.5, zoom);

  let snappedX = rawX;
  let snappedY = rawY;
  const guides: SnapGuideLine[] = [];
  const distances: DistanceBadge[] = [];

  // Filter candidate target bounding boxes
  const targets: Rect[] = [];

  const collectTargets = (list: EditorElement[]) => {
    for (const el of list) {
      if (el.id === activeId || !el.visible) continue;
      targets.push({
        id: el.id,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
      });
      if (el.children && el.children.length > 0) {
        collectTargets(el.children);
      }
    }
  };
  collectTargets(allElements);

  if (frameBounds) {
    targets.push({
      id: "__frame__",
      x: frameBounds.x,
      y: frameBounds.y,
      width: frameBounds.width,
      height: frameBounds.height,
    });
  }

  // Active element alignment reference points
  const activeLeft = rawX;
  const activeCenterX = rawX + width / 2;
  const activeRight = rawX + width;

  const activeTop = rawY;
  const activeCenterY = rawY + height / 2;
  const activeBottom = rawY + height;

  // --- X-AXIS SNAPPING (Vertical Guide Lines) ---
  let minDiffX = threshold + 1;
  let bestSnapX: number | null = null;
  let bestXGuide: SnapGuideLine | null = null;
  let matchedTargetX: Rect | null = null;

  for (const t of targets) {
    const tLeft = t.x;
    const tCenterX = t.x + t.width / 2;
    const tRight = t.x + t.width;

    const xPairs: Array<{
      activePoint: number;
      targetPoint: number;
      calcSnap: () => number;
      isCenter: boolean;
      type: "edge" | "center";
    }> = [
      // Left edge snaps
      { activePoint: activeLeft, targetPoint: tLeft, calcSnap: () => tLeft, isCenter: false, type: "edge" },
      { activePoint: activeLeft, targetPoint: tCenterX, calcSnap: () => tCenterX, isCenter: false, type: "edge" },
      { activePoint: activeLeft, targetPoint: tRight, calcSnap: () => tRight, isCenter: false, type: "edge" },

      // Center snaps
      { activePoint: activeCenterX, targetPoint: tLeft, calcSnap: () => tLeft - width / 2, isCenter: false, type: "edge" },
      { activePoint: activeCenterX, targetPoint: tCenterX, calcSnap: () => tCenterX - width / 2, isCenter: true, type: "center" },
      { activePoint: activeCenterX, targetPoint: tRight, calcSnap: () => tRight - width / 2, isCenter: false, type: "edge" },

      // Right edge snaps
      { activePoint: activeRight, targetPoint: tLeft, calcSnap: () => tLeft - width, isCenter: false, type: "edge" },
      { activePoint: activeRight, targetPoint: tCenterX, calcSnap: () => tCenterX - width, isCenter: false, type: "edge" },
      { activePoint: activeRight, targetPoint: tRight, calcSnap: () => tRight - width, isCenter: false, type: "edge" },
    ];

    for (const pair of xPairs) {
      const diff = Math.abs(pair.activePoint - pair.targetPoint);
      if (diff <= threshold && diff < minDiffX) {
        minDiffX = diff;
        bestSnapX = pair.calcSnap();
        matchedTargetX = t;

        const startY = Math.min(rawY, t.y) - 16;
        const endY = Math.max(rawY + height, t.y + t.height) + 16;

        bestXGuide = {
          id: `guide-x-${pair.targetPoint}-${t.id}`,
          type: "vertical",
          position: pair.targetPoint,
          start: startY,
          end: endY,
          color: pair.isCenter ? "red" : "blue",
        };
      }
    }
  }

  if (bestSnapX !== null && bestXGuide) {
    snappedX = Math.round(bestSnapX);
    guides.push(bestXGuide);

    if (matchedTargetX) {
      const t = matchedTargetX;
      const curLeft = snappedX;
      const curRight = snappedX + width;
      const leftDist = Math.round(curLeft - t.x);
      const rightDist = Math.round(t.x + t.width - curRight);

      if (leftDist > 0 && curLeft >= t.x && curRight <= t.x + t.width) {
        guides.push({
          id: `dist-top-left-${t.id}`,
          type: "horizontal",
          position: t.y,
          start: t.x,
          end: curLeft,
          color: "pink",
          label: `${leftDist}`,
          labelPosition: { x: t.x + leftDist / 2, y: t.y - 12 },
        });

        if (rightDist > 0) {
          guides.push({
            id: `dist-top-right-${t.id}`,
            type: "horizontal",
            position: t.y,
            start: curRight,
            end: t.x + t.width,
            color: "pink",
            label: `${rightDist}`,
            labelPosition: { x: curRight + rightDist / 2, y: t.y - 12 },
          });
        }

        guides.push({
          id: `dist-bottom-span-${t.id}`,
          type: "horizontal",
          position: t.y + t.height,
          start: t.x,
          end: t.x + t.width,
          color: "pink",
        });
      }
    }
  }

  // --- Y-AXIS SNAPPING (Horizontal Guide Lines) ---
  let minDiffY = threshold + 1;
  let bestSnapY: number | null = null;
  let bestYGuide: SnapGuideLine | null = null;
  let matchedTargetY: Rect | null = null;

  for (const t of targets) {
    const tTop = t.y;
    const tCenterY = t.y + t.height / 2;
    const tBottom = t.y + t.height;

    const yPairs: Array<{
      activePoint: number;
      targetPoint: number;
      calcSnap: () => number;
      isCenter: boolean;
      type: "edge" | "center";
    }> = [
      // Top edge snaps
      { activePoint: activeTop, targetPoint: tTop, calcSnap: () => tTop, isCenter: false, type: "edge" },
      { activePoint: activeTop, targetPoint: tCenterY, calcSnap: () => tCenterY, isCenter: false, type: "edge" },
      { activePoint: activeTop, targetPoint: tBottom, calcSnap: () => tBottom, isCenter: false, type: "edge" },

      // Center snaps
      { activePoint: activeCenterY, targetPoint: tTop, calcSnap: () => tTop - height / 2, isCenter: false, type: "edge" },
      { activePoint: activeCenterY, targetPoint: tCenterY, calcSnap: () => tCenterY - height / 2, isCenter: true, type: "center" },
      { activePoint: activeCenterY, targetPoint: tBottom, calcSnap: () => tBottom - height / 2, isCenter: false, type: "edge" },

      // Bottom edge snaps
      { activePoint: activeBottom, targetPoint: tTop, calcSnap: () => tTop - height, isCenter: false, type: "edge" },
      { activePoint: activeBottom, targetPoint: tCenterY, calcSnap: () => tCenterY - height, isCenter: false, type: "edge" },
      { activePoint: activeBottom, targetPoint: tBottom, calcSnap: () => tBottom - height, isCenter: false, type: "edge" },
    ];

    for (const pair of yPairs) {
      const diff = Math.abs(pair.activePoint - pair.targetPoint);
      if (diff <= threshold && diff < minDiffY) {
        minDiffY = diff;
        bestSnapY = pair.calcSnap();
        matchedTargetY = t;

        const startX = Math.min(rawX, t.x) - 16;
        const endX = Math.max(rawX + width, t.x + t.width) + 16;

        bestYGuide = {
          id: `guide-y-${pair.targetPoint}-${t.id}`,
          type: "horizontal",
          position: pair.targetPoint,
          start: startX,
          end: endX,
          color: pair.isCenter ? "red" : "blue",
        };
      }
    }
  }

  if (bestSnapY !== null && bestYGuide) {
    snappedY = Math.round(bestSnapY);
    guides.push(bestYGuide);

    if (matchedTargetY) {
      const t = matchedTargetY;
      const curTop = snappedY;
      const curBottom = snappedY + height;
      const topDist = Math.round(curTop - t.y);
      const bottomDist = Math.round(t.y + t.height - curBottom);

      if (topDist > 0 && curTop >= t.y && curBottom <= t.y + t.height) {
        guides.push({
          id: `dist-left-top-${t.id}`,
          type: "vertical",
          position: t.x,
          start: t.y,
          end: curTop,
          color: "pink",
          label: `${topDist}`,
          labelPosition: { x: t.x - 18, y: t.y + topDist / 2 },
        });

        if (bottomDist > 0) {
          guides.push({
            id: `dist-left-bottom-${t.id}`,
            type: "vertical",
            position: t.x,
            start: curBottom,
            end: t.y + t.height,
            color: "pink",
            label: `${bottomDist}`,
            labelPosition: { x: t.x - 18, y: curBottom + bottomDist / 2 },
          });
        }
      }
    }
  }

  return {
    x: snappedX,
    y: snappedY,
    guides,
    distances,
  };
}

/**
 * Calculates smart snapping when resizing an element via its handles (nw, n, ne, e, se, s, sw, w).
 */
export function calculateResizeSnapping(
  activeId: string,
  handle: string,
  proposed: { x: number; y: number; width: number; height: number },
  allElements: EditorElement[],
  zoom = 1,
): SnapResult {
  const threshold = SNAP_THRESHOLD / Math.max(0.5, zoom);
  let { x, y, width, height } = proposed;
  const guides: SnapGuideLine[] = [];
  const distances: DistanceBadge[] = [];

  const targets: Rect[] = [];
  const collectTargets = (list: EditorElement[]) => {
    for (const el of list) {
      if (el.id === activeId || !el.visible) continue;
      targets.push({
        id: el.id,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
      });
      if (el.children && el.children.length > 0) {
        collectTargets(el.children);
      }
    }
  };
  collectTargets(allElements);

  // X-axis resize snapping
  if (handle.includes("e")) {
    const rawRight = x + width;
    let bestRight: number | null = null;
    let minDiff = threshold + 1;
    let bestGuide: SnapGuideLine | null = null;
    let matchedT: Rect | null = null;

    for (const t of targets) {
      const pts = [
        { pt: t.x, isCenter: false },
        { pt: t.x + t.width / 2, isCenter: true },
        { pt: t.x + t.width, isCenter: false },
      ];
      for (const { pt, isCenter } of pts) {
        const diff = Math.abs(rawRight - pt);
        if (diff <= threshold && diff < minDiff) {
          minDiff = diff;
          bestRight = pt;
          matchedT = t;
          bestGuide = {
            id: `resize-guide-e-${pt}-${t.id}`,
            type: "vertical",
            position: pt,
            start: Math.min(y, t.y) - 16,
            end: Math.max(y + height, t.y + t.height) + 16,
            color: isCenter ? "red" : "blue",
          };
        }
      }
    }

    if (bestRight !== null && bestGuide) {
      width = Math.max(10, Math.round(bestRight - x));
      guides.push(bestGuide);
      if (matchedT && x >= matchedT.x) {
        const leftGap = Math.round(x - matchedT.x);
        if (leftGap > 0) {
          guides.push({
            id: `resize-gap-left-${matchedT.id}`,
            type: "horizontal",
            position: y + height,
            start: matchedT.x,
            end: x,
            color: "pink",
            label: `${leftGap}`,
            labelPosition: { x: matchedT.x + leftGap / 2, y: y + height - 12 },
          });
        }
      }
    }
  } else if (handle.includes("w")) {
    const rawLeft = x;
    let bestLeft: number | null = null;
    let minDiff = threshold + 1;
    let bestGuide: SnapGuideLine | null = null;

    for (const t of targets) {
      const pts = [
        { pt: t.x, isCenter: false },
        { pt: t.x + t.width / 2, isCenter: true },
        { pt: t.x + t.width, isCenter: false },
      ];
      for (const { pt, isCenter } of pts) {
        const diff = Math.abs(rawLeft - pt);
        if (diff <= threshold && diff < minDiff) {
          minDiff = diff;
          bestLeft = pt;
          bestGuide = {
            id: `resize-guide-w-${pt}-${t.id}`,
            type: "vertical",
            position: pt,
            start: Math.min(y, t.y) - 16,
            end: Math.max(y + height, t.y + t.height) + 16,
            color: isCenter ? "red" : "blue",
          };
        }
      }
    }

    if (bestLeft !== null && bestGuide) {
      const rightEdge = x + width;
      const proposedW = rightEdge - bestLeft;
      if (proposedW >= 10) {
        x = Math.round(bestLeft);
        width = Math.round(proposedW);
        guides.push(bestGuide);
      }
    }
  }

  // Y-axis resize snapping
  if (handle.includes("s")) {
    const rawBottom = y + height;
    let bestBottom: number | null = null;
    let minDiff = threshold + 1;
    let bestGuide: SnapGuideLine | null = null;
    let matchedT: Rect | null = null;

    for (const t of targets) {
      const pts = [
        { pt: t.y, isCenter: false },
        { pt: t.y + t.height / 2, isCenter: true },
        { pt: t.y + t.height, isCenter: false },
      ];
      for (const { pt, isCenter } of pts) {
        const diff = Math.abs(rawBottom - pt);
        if (diff <= threshold && diff < minDiff) {
          minDiff = diff;
          bestBottom = pt;
          matchedT = t;
          bestGuide = {
            id: `resize-guide-s-${pt}-${t.id}`,
            type: "horizontal",
            position: pt,
            start: Math.min(x, t.x) - 16,
            end: Math.max(x + width, t.x + t.width) + 16,
            color: isCenter ? "red" : "blue",
          };
        }
      }
    }

    if (bestBottom !== null && bestGuide) {
      height = Math.max(10, Math.round(bestBottom - y));
      guides.push(bestGuide);

      // Bottom pink span guide (Image 1 style)
      if (matchedT) {
        guides.push({
          id: `resize-bottom-span-${matchedT.id}`,
          type: "horizontal",
          position: bestBottom,
          start: Math.min(x, matchedT.x),
          end: Math.max(x + width, matchedT.x + matchedT.width),
          color: "pink",
        });
        if (x >= matchedT.x) {
          const leftGap = Math.round(x - matchedT.x);
          if (leftGap > 0) {
            guides.push({
              id: `resize-bottom-gap-${matchedT.id}`,
              type: "horizontal",
              position: bestBottom,
              start: matchedT.x,
              end: x,
              color: "pink",
              label: `${leftGap}`,
              labelPosition: { x: matchedT.x + leftGap / 2, y: bestBottom - 12 },
            });
          }
        }
      }
    }
  } else if (handle.includes("n")) {
    const rawTop = y;
    let bestTop: number | null = null;
    let minDiff = threshold + 1;
    let bestGuide: SnapGuideLine | null = null;

    for (const t of targets) {
      const pts = [
        { pt: t.y, isCenter: false },
        { pt: t.y + t.height / 2, isCenter: true },
        { pt: t.y + t.height, isCenter: false },
      ];
      for (const { pt, isCenter } of pts) {
        const diff = Math.abs(rawTop - pt);
        if (diff <= threshold && diff < minDiff) {
          minDiff = diff;
          bestTop = pt;
          bestGuide = {
            id: `resize-guide-n-${pt}-${t.id}`,
            type: "horizontal",
            position: pt,
            start: Math.min(x, t.x) - 16,
            end: Math.max(x + width, t.x + t.width) + 16,
            color: isCenter ? "red" : "blue",
          };
        }
      }
    }

    if (bestTop !== null && bestGuide) {
      const bottomEdge = y + height;
      const proposedH = bottomEdge - bestTop;
      if (proposedH >= 10) {
        y = Math.round(bestTop);
        height = Math.round(proposedH);
        guides.push(bestGuide);
      }
    }
  }

  return {
    x,
    y,
    width,
    height,
    guides,
    distances,
  };
}

/**
 * Calculates Alt-key real-time distance measurements between the selected element
 * and another element or canvas boundaries.
 */
export function calculateAltMeasurements(
  selected: EditorElement,
  target: EditorElement | null,
  canvasWidth = 1440,
  canvasHeight = 900,
): { guides: SnapGuideLine[]; distances: DistanceBadge[] } {
  const guides: SnapGuideLine[] = [];
  const distances: DistanceBadge[] = [];

  const selLeft = selected.x;
  const selRight = selected.x + selected.width;
  const selTop = selected.y;
  const selBottom = selected.y + selected.height;
  const selCenterX = selected.x + selected.width / 2;
  const selCenterY = selected.y + selected.height / 2;

  if (target && target.id !== selected.id) {
    const tarLeft = target.x;
    const tarRight = target.x + target.width;
    const tarTop = target.y;
    const tarBottom = target.y + target.height;

    // Horizontal distance
    if (selRight <= tarLeft) {
      const dist = Math.round(tarLeft - selRight);
      const midY = Math.min(selBottom, tarBottom) > Math.max(selTop, tarTop)
        ? (Math.max(selTop, tarTop) + Math.min(selBottom, tarBottom)) / 2
        : selCenterY;
      guides.push({
        id: "alt-h",
        type: "horizontal",
        position: midY,
        start: selRight,
        end: tarLeft,
        color: "pink",
        label: `${dist}`,
        labelPosition: { x: (selRight + tarLeft) / 2, y: midY - 10 },
      });
    } else if (tarRight <= selLeft) {
      const dist = Math.round(selLeft - tarRight);
      const midY = Math.min(selBottom, tarBottom) > Math.max(selTop, tarTop)
        ? (Math.max(selTop, tarTop) + Math.min(selBottom, tarBottom)) / 2
        : selCenterY;
      guides.push({
        id: "alt-h",
        type: "horizontal",
        position: midY,
        start: tarRight,
        end: selLeft,
        color: "pink",
        label: `${dist}`,
        labelPosition: { x: (tarRight + selLeft) / 2, y: midY - 10 },
      });
    }

    // Vertical distance
    if (selBottom <= tarTop) {
      const dist = Math.round(tarTop - selBottom);
      const midX = Math.min(selRight, tarRight) > Math.max(selLeft, tarLeft)
        ? (Math.max(selLeft, tarLeft) + Math.min(selRight, tarRight)) / 2
        : selCenterX;
      guides.push({
        id: "alt-v",
        type: "vertical",
        position: midX,
        start: selBottom,
        end: tarTop,
        color: "pink",
        label: `${dist}`,
        labelPosition: { x: midX + 8, y: (selBottom + tarTop) / 2 },
      });
    } else if (tarBottom <= selTop) {
      const dist = Math.round(selTop - tarBottom);
      const midX = Math.min(selRight, tarRight) > Math.max(selLeft, tarLeft)
        ? (Math.max(selLeft, tarLeft) + Math.min(selRight, tarRight)) / 2
        : selCenterX;
      guides.push({
        id: "alt-v",
        type: "vertical",
        position: midX,
        start: tarBottom,
        end: selTop,
        color: "pink",
        label: `${dist}`,
        labelPosition: { x: midX + 8, y: (tarBottom + selTop) / 2 },
      });
    }

    // Inner bounding distances
    if (selLeft >= tarLeft && selRight <= tarRight && selTop >= tarTop && selBottom <= tarBottom) {
      const dLeft = Math.round(selLeft - tarLeft);
      const dRight = Math.round(tarRight - selRight);
      const dTop = Math.round(selTop - tarTop);
      const dBottom = Math.round(tarBottom - selBottom);

      if (dLeft > 0) {
        guides.push({
          id: "alt-inner-l",
          type: "horizontal",
          position: selCenterY,
          start: tarLeft,
          end: selLeft,
          color: "pink",
          label: `${dLeft}`,
          labelPosition: { x: (tarLeft + selLeft) / 2, y: selCenterY - 10 },
        });
      }
      if (dRight > 0) {
        guides.push({
          id: "alt-inner-r",
          type: "horizontal",
          position: selCenterY,
          start: selRight,
          end: tarRight,
          color: "pink",
          label: `${dRight}`,
          labelPosition: { x: (selRight + tarRight) / 2, y: selCenterY - 10 },
        });
      }
      if (dTop > 0) {
        guides.push({
          id: "alt-inner-t",
          type: "vertical",
          position: selCenterX,
          start: tarTop,
          end: selTop,
          color: "pink",
          label: `${dTop}`,
          labelPosition: { x: selCenterX + 8, y: (tarTop + selTop) / 2 },
        });
      }
      if (dBottom > 0) {
        guides.push({
          id: "alt-inner-b",
          type: "vertical",
          position: selCenterX,
          start: selBottom,
          end: tarBottom,
          color: "pink",
          label: `${dBottom}`,
          labelPosition: { x: selCenterX + 8, y: (selBottom + tarBottom) / 2 },
        });
      }
    }
  }

  return { guides, distances };
}

/**
 * Calculates smart magnetic snapping for line/arrow endpoints or vector vertices.
 * Snaps to:
 * 1. 2D Key Anchors (4 corners, 4 midpoints, 1 center of rectangles/shapes)
 * 2. Other line endpoints and midpoints (for line joining/chaining)
 * 3. 1D Edge Segments (top/bottom/left/right border lines of surrounding shapes)
 * 4. Orthogonal alignment (horizontal / vertical / 45° with fixed point)
 * 5. Global axis alignment with other shapes
 */
export function calculateEndpointSnapping(
  activeId: string,
  rawPoint: { x: number; y: number },
  fixedPoint: { x: number; y: number } | null,
  allElements: EditorElement[],
  zoom = 1,
  shiftHeld = false,
): EndpointSnapResult {
  const threshold = SNAP_THRESHOLD / Math.max(0.5, zoom);
  let snappedX = rawPoint.x;
  let snappedY = rawPoint.y;
  const guides: SnapGuideLine[] = [];
  let indicator: SnapIndicatorPoint | null = null;
  let snappedAngle: number | undefined = undefined;

  interface TargetAnchor {
    id: string;
    x: number;
    y: number;
    type: "corner" | "midpoint" | "center" | "endpoint";
    elementId: string;
  }
  interface TargetEdge {
    id: string;
    type: "horizontal" | "vertical";
    coord: number;
    start: number;
    end: number;
    elementId: string;
    isCenter: boolean;
  }

  const anchors: TargetAnchor[] = [];
  const edges: TargetEdge[] = [];

  const collectGeometries = (list: EditorElement[]) => {
    for (const el of list) {
      if (el.id === activeId || !el.visible) continue;

      if (el.type === "line" || el.type === "arrow") {
        const rad = (el.rotation * Math.PI) / 180;
        const pStart = { x: el.x, y: el.y + el.height / 2 };
        const pEnd = {
          x: el.x + el.width * Math.cos(rad),
          y: el.y + el.height / 2 + el.width * Math.sin(rad),
        };
        const pMid = { x: (pStart.x + pEnd.x) / 2, y: (pStart.y + pEnd.y) / 2 };

        anchors.push(
          { id: `anchor-start-${el.id}`, x: pStart.x, y: pStart.y, type: "endpoint", elementId: el.id },
          { id: `anchor-end-${el.id}`, x: pEnd.x, y: pEnd.y, type: "endpoint", elementId: el.id },
          { id: `anchor-mid-${el.id}`, x: pMid.x, y: pMid.y, type: "midpoint", elementId: el.id },
        );
      } else {
        const left = el.x;
        const right = el.x + el.width;
        const top = el.y;
        const bottom = el.y + el.height;
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;

        // 4 corners
        anchors.push(
          { id: `corner-tl-${el.id}`, x: left, y: top, type: "corner", elementId: el.id },
          { id: `corner-tr-${el.id}`, x: right, y: top, type: "corner", elementId: el.id },
          { id: `corner-bl-${el.id}`, x: left, y: bottom, type: "corner", elementId: el.id },
          { id: `corner-br-${el.id}`, x: right, y: bottom, type: "corner", elementId: el.id },
        );

        // 4 edge midpoints
        anchors.push(
          { id: `mid-t-${el.id}`, x: cx, y: top, type: "midpoint", elementId: el.id },
          { id: `mid-b-${el.id}`, x: cx, y: bottom, type: "midpoint", elementId: el.id },
          { id: `mid-l-${el.id}`, x: left, y: cy, type: "midpoint", elementId: el.id },
          { id: `mid-r-${el.id}`, x: right, y: cy, type: "midpoint", elementId: el.id },
        );

        // Center
        anchors.push({ id: `center-${el.id}`, x: cx, y: cy, type: "center", elementId: el.id });

        // 4 edge segments + center axes
        edges.push(
          { id: `edge-t-${el.id}`, type: "horizontal", coord: top, start: left, end: right, elementId: el.id, isCenter: false },
          { id: `edge-b-${el.id}`, type: "horizontal", coord: bottom, start: left, end: right, elementId: el.id, isCenter: false },
          { id: `edge-l-${el.id}`, type: "vertical", coord: left, start: top, end: bottom, elementId: el.id, isCenter: false },
          { id: `edge-r-${el.id}`, type: "vertical", coord: right, start: top, end: bottom, elementId: el.id, isCenter: false },
          { id: `edge-cx-${el.id}`, type: "vertical", coord: cx, start: top, end: bottom, elementId: el.id, isCenter: true },
          { id: `edge-cy-${el.id}`, type: "horizontal", coord: cy, start: left, end: right, elementId: el.id, isCenter: true },
        );
      }

      if (el.children && el.children.length > 0) {
        collectGeometries(el.children);
      }
    }
  };
  collectGeometries(allElements);

  // Priority 1: 2D Key Anchor Snapping (Corners, Midpoints, Endpoints, Centers)
  let bestAnchor: TargetAnchor | null = null;
  let minAnchorDist = threshold;

  for (const anchor of anchors) {
    const dx = rawPoint.x - anchor.x;
    const dy = rawPoint.y - anchor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= minAnchorDist) {
      minAnchorDist = dist;
      bestAnchor = anchor;
    }
  }

  if (bestAnchor) {
    snappedX = Math.round(bestAnchor.x);
    snappedY = Math.round(bestAnchor.y);

    guides.push({
      id: `guide-anchor-x-${bestAnchor.id}`,
      type: "vertical",
      position: snappedX,
      start: snappedY - 32,
      end: snappedY + 32,
      color: "blue",
    });
    guides.push({
      id: `guide-anchor-y-${bestAnchor.id}`,
      type: "horizontal",
      position: snappedY,
      start: snappedX - 32,
      end: snappedX + 32,
      color: "blue",
    });

    indicator = {
      id: `indicator-${bestAnchor.id}`,
      x: snappedX,
      y: snappedY,
      type: "anchor",
    };

    return { x: snappedX, y: snappedY, guides, indicator };
  }

  // Priority 2: Edge Segment Snapping & Orthogonal Alignment

  // 2.1 X-Axis Snapping (Vertical Edges & Orthogonal Vertical Line Alignment)
  let bestSnapX: number | null = null;
  let minDiffX = threshold;
  let bestXGuide: SnapGuideLine | null = null;

  for (const edge of edges) {
    if (edge.type !== "vertical") continue;
    const diff = Math.abs(rawPoint.x - edge.coord);
    const inRange = rawPoint.y >= edge.start - 40 && rawPoint.y <= edge.end + 40;
    if (diff <= minDiffX && inRange) {
      minDiffX = diff;
      bestSnapX = edge.coord;
      bestXGuide = {
        id: `guide-edge-${edge.id}`,
        type: "vertical",
        position: edge.coord,
        start: Math.min(rawPoint.y, edge.start) - 20,
        end: Math.max(rawPoint.y, edge.end) + 20,
        color: edge.isCenter ? "red" : "blue",
      };
    }
  }

  // Orthogonal Vertical Line (make line strictly vertical if near fixedPoint.x and vertically separated)
  if (fixedPoint && Math.abs(rawPoint.y - fixedPoint.y) > 10) {
    const diffOrthX = Math.abs(rawPoint.x - fixedPoint.x);
    if (diffOrthX <= threshold && (bestSnapX === null || diffOrthX < minDiffX)) {
      minDiffX = diffOrthX;
      bestSnapX = fixedPoint.x;
      bestXGuide = {
        id: `guide-orth-v-${activeId}`,
        type: "vertical",
        position: fixedPoint.x,
        start: Math.min(rawPoint.y, fixedPoint.y) - 20,
        end: Math.max(rawPoint.y, fixedPoint.y) + 20,
        color: "blue",
      };
    }
  }

  // 2.2 Y-Axis Snapping (Horizontal Edges & Orthogonal Horizontal Line Alignment)
  let bestSnapY: number | null = null;
  let minDiffY = threshold;
  let bestYGuide: SnapGuideLine | null = null;

  for (const edge of edges) {
    if (edge.type !== "horizontal") continue;
    const diff = Math.abs(rawPoint.y - edge.coord);
    const inRange = rawPoint.x >= edge.start - 40 && rawPoint.x <= edge.end + 40;
    if (diff <= minDiffY && inRange) {
      minDiffY = diff;
      bestSnapY = edge.coord;
      bestYGuide = {
        id: `guide-edge-${edge.id}`,
        type: "horizontal",
        position: edge.coord,
        start: Math.min(rawPoint.x, edge.start) - 20,
        end: Math.max(rawPoint.x, edge.end) + 20,
        color: edge.isCenter ? "red" : "blue",
      };
    }
  }

  // Orthogonal Horizontal Line (make line strictly horizontal if near fixedPoint.y and horizontally separated)
  if (fixedPoint && Math.abs(rawPoint.x - fixedPoint.x) > 10) {
    const diffOrthY = Math.abs(rawPoint.y - fixedPoint.y);
    if (diffOrthY <= threshold && (bestSnapY === null || diffOrthY < minDiffY)) {
      minDiffY = diffOrthY;
      bestSnapY = fixedPoint.y;
      bestYGuide = {
        id: `guide-orth-h-${activeId}`,
        type: "horizontal",
        position: fixedPoint.y,
        start: Math.min(rawPoint.x, fixedPoint.x) - 20,
        end: Math.max(rawPoint.x, fixedPoint.x) + 20,
        color: "blue",
      };
    }
  }

  if (bestSnapX !== null) {
    snappedX = Math.round(bestSnapX);
    if (bestXGuide) guides.push(bestXGuide);
  }
  if (bestSnapY !== null) {
    snappedY = Math.round(bestSnapY);
    if (bestYGuide) guides.push(bestYGuide);
  }

  // Soft 45° angle snapping if neither strict horizontal nor vertical snapped and not shiftHeld
  if (fixedPoint && (bestSnapX === null || bestSnapY === null)) {
    const diffX = (bestSnapX !== null ? snappedX : rawPoint.x) - fixedPoint.x;
    const diffY = (bestSnapY !== null ? snappedY : rawPoint.y) - fixedPoint.y;
    const angle = (Math.atan2(diffY, diffX) * 180) / Math.PI;

    if (shiftHeld) {
      const snappedA = Math.round(angle / 45) * 45;
      const len = Math.sqrt(diffX * diffX + diffY * diffY);
      const rad = (snappedA * Math.PI) / 180;
      snappedX = Math.round(fixedPoint.x + len * Math.cos(rad));
      snappedY = Math.round(fixedPoint.y + len * Math.sin(rad));
      snappedAngle = snappedA;
    } else {
      const nearest45 = Math.round(angle / 45) * 45;
      const angleDiff = Math.abs(angle - nearest45);
      if (nearest45 % 90 !== 0 && angleDiff <= 5) {
        const len = Math.sqrt(diffX * diffX + diffY * diffY);
        const rad = (nearest45 * Math.PI) / 180;
        snappedX = Math.round(fixedPoint.x + len * Math.cos(rad));
        snappedY = Math.round(fixedPoint.y + len * Math.sin(rad));
        snappedAngle = nearest45;
      }
    }
  }

  if (bestSnapX !== null || bestSnapY !== null) {
    indicator = {
      id: "indicator-edge-snap",
      x: snappedX,
      y: snappedY,
      type: "edge",
    };
  }

  return {
    x: snappedX,
    y: snappedY,
    guides,
    indicator,
    snappedAngle,
  };
}

/**
 * Calculates smart snapping when moving a whole line or arrow.
 * Considers both endpoints (start and end) and midpoint in true canvas space.
 */
export function calculateLineMoveSnapping(
  activeId: string,
  rawStartX: number,
  rawStartY: number,
  length: number,
  rotation: number,
  height: number,
  allElements: EditorElement[],
  zoom = 1,
): SnapResult {
  const threshold = SNAP_THRESHOLD / Math.max(0.5, zoom);
  const rad = (rotation * Math.PI) / 180;
  const hOffset = height / 2;

  // Compute endpoints
  const p1 = { x: rawStartX, y: rawStartY + hOffset };
  const p2 = {
    x: rawStartX + length * Math.cos(rad),
    y: rawStartY + hOffset + length * Math.sin(rad),
  };
  const pMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  const targets: Rect[] = [];
  const collectTargets = (list: EditorElement[]) => {
    for (const el of list) {
      if (el.id === activeId || !el.visible) continue;
      targets.push({
        id: el.id,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
      });
      if (el.children && el.children.length > 0) {
        collectTargets(el.children);
      }
    }
  };
  collectTargets(allElements);

  let deltaX = 0;
  let deltaY = 0;
  let minDiffX = threshold + 1;
  let minDiffY = threshold + 1;
  let bestXGuide: SnapGuideLine | null = null;
  let bestYGuide: SnapGuideLine | null = null;
  let indicator: SnapIndicatorPoint | null = null;

  // X-axis snapping candidates along the line
  const xPoints = [
    { pt: p1.x, name: "start" },
    { pt: p2.x, name: "end" },
    { pt: pMid.x, name: "center" },
    { pt: Math.min(p1.x, p2.x), name: "min" },
    { pt: Math.max(p1.x, p2.x), name: "max" },
  ];

  for (const t of targets) {
    const tXPoints = [
      { pt: t.x, isCenter: false },
      { pt: t.x + t.width / 2, isCenter: true },
      { pt: t.x + t.width, isCenter: false },
    ];

    for (const xp of xPoints) {
      for (const tx of tXPoints) {
        const diff = Math.abs(xp.pt - tx.pt);
        if (diff <= threshold && diff < minDiffX) {
          minDiffX = diff;
          deltaX = tx.pt - xp.pt;
          bestXGuide = {
            id: `line-guide-x-${tx.pt}-${t.id}`,
            type: "vertical",
            position: tx.pt,
            start: Math.min(p1.y, p2.y, t.y) - 20,
            end: Math.max(p1.y, p2.y, t.y + t.height) + 20,
            color: tx.isCenter ? "red" : "blue",
          };
        }
      }
    }
  }

  // Y-axis snapping candidates along the line
  const yPoints = [
    { pt: p1.y, name: "start" },
    { pt: p2.y, name: "end" },
    { pt: pMid.y, name: "center" },
    { pt: Math.min(p1.y, p2.y), name: "min" },
    { pt: Math.max(p1.y, p2.y), name: "max" },
  ];

  for (const t of targets) {
    const tYPoints = [
      { pt: t.y, isCenter: false },
      { pt: t.y + t.height / 2, isCenter: true },
      { pt: t.y + t.height, isCenter: false },
    ];

    for (const yp of yPoints) {
      for (const ty of tYPoints) {
        const diff = Math.abs(yp.pt - ty.pt);
        if (diff <= threshold && diff < minDiffY) {
          minDiffY = diff;
          deltaY = ty.pt - yp.pt;
          bestYGuide = {
            id: `line-guide-y-${ty.pt}-${t.id}`,
            type: "horizontal",
            position: ty.pt,
            start: Math.min(p1.x, p2.x, t.x) - 20,
            end: Math.max(p1.x, p2.x, t.x + t.width) + 20,
            color: ty.isCenter ? "red" : "blue",
          };
        }
      }
    }
  }

  const snappedX = Math.round(rawStartX + deltaX);
  const snappedY = Math.round(rawStartY + deltaY);
  const guides: SnapGuideLine[] = [];
  if (bestXGuide) guides.push(bestXGuide);
  if (bestYGuide) guides.push(bestYGuide);

  if (bestXGuide || bestYGuide) {
    indicator = {
      id: "line-move-indicator",
      x: Math.round(p1.x + deltaX),
      y: Math.round(p1.y + deltaY),
      type: "edge",
    };
  }

  return {
    x: snappedX,
    y: snappedY,
    guides,
    distances: [],
    indicator,
  };
}

