import type { AnchorPort, EditorElement } from "../types";

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

export interface AnchorInfo {
  port: AnchorPort;
  point: Point;
  dir: Vector;
}

export const ANCHOR_PORTS: AnchorPort[] = ["top", "right", "bottom", "left"];

export const PORT_DIRECTIONS: Record<AnchorPort, Vector> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  center: { x: 0, y: 0 },
};

export const PORT_LABELS: Record<AnchorPort, string> = {
  top: "上 (Top)",
  right: "右 (Right)",
  bottom: "下 (Bottom)",
  left: "左 (Left)",
  center: "居中 (Center)",
};

/**
 * Resolves the absolute world bounds of an element by traversing its parent hierarchy.
 */
export function getElementWorldBounds(
  element: EditorElement,
  allElementsFlat?: EditorElement[],
): { x: number; y: number; width: number; height: number; rotation: number } {
  let curX = element.x;
  let curY = element.y;
  let curRot = element.rotation ?? 0;
  let parentId = element.parentId;

  if (allElementsFlat && parentId) {
    const visited = new Set<string>([element.id]);
    while (parentId) {
      if (visited.has(parentId)) break;
      visited.add(parentId);
      const parent = allElementsFlat.find((p) => p.id === parentId);
      if (!parent) break;
      curX += parent.x;
      curY += parent.y;
      curRot += parent.rotation ?? 0;
      parentId = parent.parentId;
    }
  }

  return {
    x: curX,
    y: curY,
    width: element.width,
    height: element.height,
    rotation: curRot % 360,
  };
}

/**
 * Calculates absolute anchor position and direction vector for an element in world coordinates.
 */
export function getElementAnchor(
  element: EditorElement,
  port: AnchorPort,
  allElementsFlat?: EditorElement[],
): AnchorInfo {
  const { x, y, width, height, rotation = 0 } = getElementWorldBounds(element, allElementsFlat);
  let localX = x + width / 2;
  let localY = y + height / 2;
  let dir = PORT_DIRECTIONS[port] || { x: 0, y: 0 };

  switch (port) {
    case "top":
      localX = x + width / 2;
      localY = y;
      break;
    case "right":
      localX = x + width;
      localY = y + height / 2;
      break;
    case "bottom":
      localX = x + width / 2;
      localY = y + height;
      break;
    case "left":
      localX = x;
      localY = y + height / 2;
      break;
    case "center":
      localX = x + width / 2;
      localY = y + height / 2;
      break;
  }

  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const cx = x + width / 2;
    const cy = y + height / 2;
    const dx = localX - cx;
    const dy = localY - cy;

    localX = cx + dx * cos - dy * sin;
    localY = cy + dx * sin + dy * cos;

    dir = {
      x: dir.x * cos - dir.y * sin,
      y: dir.x * sin + dir.y * cos,
    };
  }

  return {
    port,
    point: { x: Math.round(localX), y: Math.round(localY) },
    dir,
  };
}

/**
 * Returns all 4 cardinal anchor points for an element.
 */
export function getElementAnchors(element: EditorElement, allElementsFlat?: EditorElement[]): AnchorInfo[] {
  return ANCHOR_PORTS.map((port) => getElementAnchor(element, port, allElementsFlat));
}

/**
 * Finds the nearest anchor on any visible element within a magnetic snap threshold.
 * Prioritizes topmost flowchart and basic shapes over background frames.
 */
export function findNearestSnapAnchor(
  point: Point,
  elements: EditorElement[],
  excludeId?: string,
  threshold = 36,
): { element: EditorElement; anchor: AnchorInfo; distance: number } | null {
  const eligible = elements.filter((el) => el.visible && el.id !== excludeId && el.type !== "connector");
  if (eligible.length === 0) return null;

  // 1. Direct hit on an element bounding box (excluding large frames if smaller shapes exist)
  const insideElements = [...eligible].reverse().filter((el) => {
    const wb = getElementWorldBounds(el, elements);
    return (
      point.x >= wb.x &&
      point.x <= wb.x + wb.width &&
      point.y >= wb.y &&
      point.y <= wb.y + wb.height
    );
  });

  if (insideElements.length > 0) {
    // Prefer non-frame elements over background containers
    const bestEl = insideElements.find((el) => el.type !== "mobile-frame" && el.type !== "browser-frame") || insideElements[0]!;
    const bestAnchor = getClosestAnchorOnElement(bestEl, point, elements);
    return {
      element: bestEl,
      anchor: bestAnchor,
      distance: 0,
    };
  }

  // 2. Otherwise check proximity to all cardinal anchors on visible elements
  let closest: { element: EditorElement; anchor: AnchorInfo; distance: number } | null = null;
  let minDistance = threshold;

  for (const el of eligible) {
    const wb = getElementWorldBounds(el, elements);
    const margin = threshold + 12;
    if (
      point.x < wb.x - margin ||
      point.x > wb.x + wb.width + margin ||
      point.y < wb.y - margin ||
      point.y > wb.y + wb.height + margin
    ) {
      continue;
    }

    const anchors = getElementAnchors(el, elements);
    for (const anchor of anchors) {
      const dist = Math.hypot(point.x - anchor.point.x, point.y - anchor.point.y);
      if (dist < minDistance) {
        minDistance = dist;
        closest = {
          element: el,
          anchor,
          distance: dist,
        };
      }
    }
  }

  return closest;
}

/**
 * Finds the best anchor port on a given target element closest to a given reference point.
 */
export function getClosestAnchorOnElement(
  element: EditorElement,
  referencePoint: Point,
  allElementsFlat?: EditorElement[],
): AnchorInfo {
  const anchors = getElementAnchors(element, allElementsFlat);
  let best = anchors[0]!;
  let bestDist = Infinity;

  for (const a of anchors) {
    const d = Math.hypot(referencePoint.x - a.point.x, referencePoint.y - a.point.y);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }

  return best;
}

/**
 * Builds SVG path with rounded corners from an array of waypoints.
 */
export function buildRoundedSvgPath(points: Point[], radius = 8): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`;
  }

  // Deduplicate points that are virtually identical
  const cleaned: Point[] = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    const prev = cleaned[cleaned.length - 1]!;
    const curr = points[i]!;
    if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > 0.5) {
      cleaned.push(curr);
    }
  }

  if (cleaned.length < 3) {
    const p0 = cleaned[0]!;
    const p1 = cleaned[1] || p0;
    return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`;
  }

  let d = `M ${cleaned[0]!.x} ${cleaned[0]!.y}`;

  for (let i = 1; i < cleaned.length - 1; i++) {
    const pPrev = cleaned[i - 1]!;
    const pCurr = cleaned[i]!;
    const pNext = cleaned[i + 1]!;

    const v1 = { x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y };
    const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };

    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);

    if (len1 === 0 || len2 === 0) continue;

    const u1 = { x: v1.x / len1, y: v1.y / len1 };
    const u2 = { x: v2.x / len2, y: v2.y / len2 };

    const isCollinear = Math.abs(u1.x * u2.y - u1.y * u2.x) < 0.01 && (u1.x * u2.x + u1.y * u2.y) > 0;
    if (isCollinear) {
      continue;
    }

    const curR = Math.min(radius, len1 / 2, len2 / 2);

    if (curR < 1) {
      d += ` L ${pCurr.x} ${pCurr.y}`;
    } else {
      const cornerStart = {
        x: pCurr.x - u1.x * curR,
        y: pCurr.y - u1.y * curR,
      };
      const cornerEnd = {
        x: pCurr.x + u2.x * curR,
        y: pCurr.y + u2.y * curR,
      };

      d += ` L ${cornerStart.x} ${cornerStart.y}`;
      d += ` Q ${pCurr.x} ${pCurr.y}, ${cornerEnd.x} ${cornerEnd.y}`;
    }
  }

  const last = cleaned[cleaned.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Calculates clean, robust orthogonal waypoints between start and end anchor positions.
 * Handles all 16 directional cases without overlapping, double-backs, or erratic jumping.
 */
export function calculateOrthogonalPath(
  start: { point: Point; dir?: Vector },
  end: { point: Point; dir?: Vector },
  radius = 8,
  stub = 20,
): { d: string; waypoints: Point[]; midpoint: Point } {
  const sx = start.point.x;
  const sy = start.point.y;
  const ex = end.point.x;
  const ey = end.point.y;

  const sDir = start.dir || { x: 0, y: 0 };
  const eDir = end.dir || { x: 0, y: 0 };

  const hasStartDir = Math.abs(sDir.x) > 0.1 || Math.abs(sDir.y) > 0.1;
  const hasEndDir = Math.abs(eDir.x) > 0.1 || Math.abs(eDir.y) > 0.1;

  const p0: Point = { x: sx, y: sy };
  const pN: Point = { x: ex, y: ey };

  const pStartStub: Point = hasStartDir
    ? {
        x: sx + Math.sign(sDir.x) * (Math.abs(sDir.x) > 0.5 ? stub : 0),
        y: sy + Math.sign(sDir.y) * (Math.abs(sDir.y) > 0.5 ? stub : 0),
      }
    : p0;

  const pEndStub: Point = hasEndDir
    ? {
        x: ex + Math.sign(eDir.x) * (Math.abs(eDir.x) > 0.5 ? stub : 0),
        y: ey + Math.sign(eDir.y) * (Math.abs(eDir.y) > 0.5 ? stub : 0),
      }
    : pN;

  const waypoints: Point[] = [p0];
  if (hasStartDir && (pStartStub.x !== p0.x || pStartStub.y !== p0.y)) {
    waypoints.push(pStartStub);
  }

  const isStartHoriz = Math.abs(sDir.x) > 0.5;
  const isStartVert = Math.abs(sDir.y) > 0.5;
  const isEndHoriz = Math.abs(eDir.x) > 0.5;
  const isEndVert = Math.abs(eDir.y) > 0.5;

  if (hasStartDir && hasEndDir) {
    if (isStartHoriz && isEndHoriz) {
      const sXSign = Math.sign(sDir.x);
      const eXSign = Math.sign(eDir.x);
      const dx = pEndStub.x - pStartStub.x;

      if (sXSign !== eXSign && sXSign * dx > 0) {
        // Facing each other with space in between -> S-shape through midpoint
        const midX = pStartStub.x + dx / 2;
        waypoints.push({ x: midX, y: pStartStub.y });
        waypoints.push({ x: midX, y: pEndStub.y });
      } else {
        // Same direction or facing away -> route around
        const midY = (pStartStub.y + pEndStub.y) / 2;
        const clearanceX =
          sXSign > 0
            ? Math.max(pStartStub.x, pEndStub.x) + stub
            : Math.min(pStartStub.x, pEndStub.x) - stub;
        waypoints.push({ x: clearanceX, y: pStartStub.y });
        waypoints.push({ x: clearanceX, y: midY });
        waypoints.push({ x: pEndStub.x, y: midY });
      }
    } else if (isStartVert && isEndVert) {
      const sYSign = Math.sign(sDir.y);
      const eYSign = Math.sign(eDir.y);
      const dy = pEndStub.y - pStartStub.y;

      if (sYSign !== eYSign && sYSign * dy > 0) {
        // Facing each other vertically -> S-shape through midY
        const midY = pStartStub.y + dy / 2;
        waypoints.push({ x: pStartStub.x, y: midY });
        waypoints.push({ x: pEndStub.x, y: midY });
      } else {
        // Same direction or facing away -> route around
        const midX = (pStartStub.x + pEndStub.x) / 2;
        const clearanceY =
          sYSign > 0
            ? Math.max(pStartStub.y, pEndStub.y) + stub
            : Math.min(pStartStub.y, pEndStub.y) - stub;
        waypoints.push({ x: pStartStub.x, y: clearanceY });
        waypoints.push({ x: midX, y: clearanceY });
        waypoints.push({ x: midX, y: pEndStub.y });
      }
    } else if (isStartHoriz && isEndVert) {
      const sXSign = Math.sign(sDir.x);
      const eYSign = Math.sign(eDir.y);
      const dx = pEndStub.x - pStartStub.x;
      const dy = pEndStub.y - pStartStub.y;

      if (sXSign * dx >= 0 && eYSign * (-dy) >= 0) {
        // Direct natural 90° turn
        waypoints.push({ x: pEndStub.x, y: pStartStub.y });
      } else if (sXSign * dx < 0) {
        // Target is behind start port -> extend start horizontally, then turn
        const clearanceX = pStartStub.x + sXSign * stub;
        waypoints.push({ x: clearanceX, y: pStartStub.y });
        waypoints.push({ x: clearanceX, y: pEndStub.y });
      } else {
        waypoints.push({ x: pEndStub.x, y: pStartStub.y });
      }
    } else if (isStartVert && isEndHoriz) {
      const sYSign = Math.sign(sDir.y);
      const eXSign = Math.sign(eDir.x);
      const dx = pEndStub.x - pStartStub.x;
      const dy = pEndStub.y - pStartStub.y;

      if (sYSign * dy >= 0 && eXSign * (-dx) >= 0) {
        // Direct natural 90° turn
        waypoints.push({ x: pStartStub.x, y: pEndStub.y });
      } else if (sYSign * dy < 0) {
        const clearanceY = pStartStub.y + sYSign * stub;
        waypoints.push({ x: pStartStub.x, y: clearanceY });
        waypoints.push({ x: pEndStub.x, y: clearanceY });
      } else {
        waypoints.push({ x: pStartStub.x, y: pEndStub.y });
      }
    } else {
      const midX = pStartStub.x + (pEndStub.x - pStartStub.x) / 2;
      waypoints.push({ x: midX, y: pStartStub.y });
      waypoints.push({ x: midX, y: pEndStub.y });
    }
  } else if (hasStartDir && !hasEndDir) {
    // Live dragging ghost or end is free floating point
    if (isStartHoriz) {
      const sXSign = Math.sign(sDir.x);
      if (sXSign * (ex - pStartStub.x) > 0) {
        // Moving ahead of start
        const midX = pStartStub.x + (ex - pStartStub.x) / 2;
        waypoints.push({ x: midX, y: pStartStub.y });
        waypoints.push({ x: midX, y: ey });
      } else {
        // Target is behind start port -> clean L-turn
        waypoints.push({ x: pStartStub.x, y: ey });
      }
    } else if (isStartVert) {
      const sYSign = Math.sign(sDir.y);
      if (sYSign * (ey - pStartStub.y) > 0) {
        const midY = pStartStub.y + (ey - pStartStub.y) / 2;
        waypoints.push({ x: pStartStub.x, y: midY });
        waypoints.push({ x: ex, y: midY });
      } else {
        waypoints.push({ x: ex, y: pStartStub.y });
      }
    } else {
      const midX = sx + (ex - sx) / 2;
      waypoints.push({ x: midX, y: sy });
      waypoints.push({ x: midX, y: ey });
    }
  } else if (!hasStartDir && hasEndDir) {
    // Start is free point, End has anchor direction
    if (isEndHoriz) {
      const eXSign = Math.sign(eDir.x);
      if (eXSign * (pEndStub.x - sx) > 0) {
        const midX = sx + (pEndStub.x - sx) / 2;
        waypoints.push({ x: midX, y: sy });
        waypoints.push({ x: midX, y: pEndStub.y });
      } else {
        waypoints.push({ x: pEndStub.x, y: sy });
      }
    } else if (isEndVert) {
      const eYSign = Math.sign(eDir.y);
      if (eYSign * (pEndStub.y - sy) > 0) {
        const midY = sy + (pEndStub.y - sy) / 2;
        waypoints.push({ x: sx, y: midY });
        waypoints.push({ x: pEndStub.x, y: midY });
      } else {
        waypoints.push({ x: sx, y: pEndStub.y });
      }
    } else {
      const midX = sx + (ex - sx) / 2;
      waypoints.push({ x: midX, y: sy });
      waypoints.push({ x: midX, y: ey });
    }
  } else {
    // Both endpoints are free floating points
    const midX = sx + (ex - sx) / 2;
    waypoints.push({ x: midX, y: sy });
    waypoints.push({ x: midX, y: ey });
  }

  if (hasEndDir && (pEndStub.x !== pN.x || pEndStub.y !== pN.y)) {
    waypoints.push(pEndStub);
  }
  waypoints.push(pN);

  const d = buildRoundedSvgPath(waypoints, radius);

  // Compute middle anchor point for label text
  let midIdx = Math.floor(waypoints.length / 2);
  const pA = waypoints[midIdx - 1] || waypoints[0]!;
  const pB = waypoints[midIdx] || waypoints[waypoints.length - 1]!;
  const midpoint: Point = {
    x: Math.round((pA.x + pB.x) / 2),
    y: Math.round((pA.y + pB.y) / 2),
  };

  return { d, waypoints, midpoint };
}

/**
 * Calculates straight line path between start and end.
 */
export function calculateStraightPath(
  start: { point: Point },
  end: { point: Point },
): { d: string; waypoints: Point[]; midpoint: Point } {
  const p0 = start.point;
  const p1 = end.point;
  return {
    d: `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`,
    waypoints: [p0, p1],
    midpoint: { x: Math.round((p0.x + p1.x) / 2), y: Math.round((p0.y + p1.y) / 2) },
  };
}

/**
 * Calculates smooth cubic Bézier curved path between start and end.
 */
export function calculateCurvedPath(
  start: { point: Point; dir?: Vector },
  end: { point: Point; dir?: Vector },
): { d: string; waypoints: Point[]; midpoint: Point } {
  const p0 = start.point;
  const p1 = end.point;
  const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const handleLen = Math.max(30, dist * 0.4);

  const sDir = start.dir || { x: (p1.x - p0.x) / (dist || 1), y: (p1.y - p0.y) / (dist || 1) };
  const eDir = end.dir || { x: (p0.x - p1.x) / (dist || 1), y: (p0.y - p1.y) / (dist || 1) };

  const cp1: Point = { x: p0.x + sDir.x * handleLen, y: p0.y + sDir.y * handleLen };
  const cp2: Point = { x: p1.x + eDir.x * handleLen, y: p1.y + eDir.y * handleLen };

  const d = `M ${p0.x} ${p0.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p1.x} ${p1.y}`;
  return {
    d,
    waypoints: [p0, cp1, cp2, p1],
    midpoint: { x: Math.round((p0.x + p1.x) / 2), y: Math.round((p0.y + p1.y) / 2) },
  };
}

/**
 * Returns SVG path definitions for standard flowchart shapes.
 */
export function getFlowchartSvgPath(type: string, width: number, height: number): string {
  const W = Math.max(10, width);
  const H = Math.max(10, height);

  switch (type) {
    case "flow-process":
      // Standard process rectangle
      return `M 0 0 H ${W} V ${H} H 0 Z`;

    case "flow-decision":
      // Decision diamond / rhombus
      return `M ${W / 2} 0 L ${W} ${H / 2} L ${W / 2} ${H} L 0 ${H / 2} Z`;

    case "flow-start-end": {
      // Terminator / Pill
      const r = Math.min(W / 2, H / 2);
      return `M ${r} 0 H ${W - r} A ${r} ${r} 0 0 1 ${W} ${r} V ${H - r} A ${r} ${r} 0 0 1 ${W - r} ${H} H ${r} A ${r} ${r} 0 0 1 0 ${H - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
    }

    case "flow-document": {
      // Document with sinusoidal wave bottom
      const waveH = Math.min(16, H * 0.2);
      return `M 0 0 H ${W} V ${H - waveH} Q ${W * 0.75} ${H} ${W * 0.5} ${H - waveH} T 0 ${H - waveH} Z`;
    }

    case "flow-data": {
      // Parallelogram / I/O Data
      const slant = Math.min(24, W * 0.2);
      return `M ${slant} 0 L ${W} 0 L ${W - slant} ${H} L 0 ${H} Z`;
    }

    case "flow-subprocess":
      // Predefined process / Subprocess rectangle
      return `M 0 0 H ${W} V ${H} H 0 Z`;

    case "flow-external-data": {
      // Cylinder sideways / Direct access storage
      const r = Math.min(16, W * 0.18);
      return `M 0 0 H ${W - r} A ${r} ${H / 2} 0 0 1 ${W - r} ${H} H 0 A ${r} ${H / 2} 0 0 0 0 0 Z`;
    }

    case "flow-internal-storage":
      // Internal storage container
      return `M 0 0 H ${W} V ${H} H 0 Z`;

    case "flow-queue": {
      // Sequential data / Queue (Circle)
      const r = Math.min(W, H) / 2;
      return `M ${W / 2} 0 A ${r} ${r} 0 1 1 ${W / 2} ${H} A ${r} ${r} 0 1 1 ${W / 2} 0 Z`;
    }

    case "flow-database": {
      // 3D Database Cylinder
      const rY = Math.min(14, H * 0.2);
      return `M 0 ${rY} A ${W / 2} ${rY} 0 0 1 ${W} ${rY} V ${H - rY} A ${W / 2} ${rY} 0 0 1 0 ${H - rY} Z`;
    }

    case "flow-manual-input": {
      // Manual input trapezoid (sloping top)
      const drop = Math.min(16, H * 0.22);
      return `M 0 ${drop} L ${W} 0 L ${W} ${H} L 0 ${H} Z`;
    }

    case "flow-card": {
      // Card with notched corner
      const cut = Math.min(16, W * 0.18, H * 0.25);
      return `M ${cut} 0 L ${W} 0 L ${W} ${H} L 0 ${H} L 0 ${cut} Z`;
    }

    case "flow-tape": {
      // Paper tape / Ribbon (dual waves)
      const wave = Math.min(10, H * 0.15);
      return `M 0 ${wave} Q ${W / 4} 0 ${W / 2} ${wave} T ${W} ${wave} V ${H - wave} Q ${W * 0.75} ${H} ${W / 2} ${H - wave} T 0 ${H - wave} Z`;
    }

    case "flow-display": {
      // Display / Round left, pointed right
      const r = Math.min(24, W * 0.2, H / 2);
      return `M ${r} 0 H ${W - r} L ${W} ${H / 2} L ${W - r} ${H} H ${r} Q 0 ${H / 2} ${r} 0 Z`;
    }

    case "flow-manual-op": {
      // Manual operation (inverted trapezoid)
      const slant = Math.min(20, W * 0.16);
      return `M 0 0 L ${W} 0 L ${W - slant} ${H} L ${slant} ${H} Z`;
    }

    case "flow-preparation": {
      // Preparation Hexagon
      const cut = Math.min(22, W * 0.2);
      return `M ${cut} 0 L ${W - cut} 0 L ${W} ${H / 2} L ${W - cut} ${H} L ${cut} ${H} L 0 ${H / 2} Z`;
    }

    case "flow-loop-limit": {
      // Loop limit / Chamfered top rectangle
      const cut = Math.min(16, W * 0.18, H * 0.25);
      return `M ${cut} 0 L ${W - cut} 0 L ${W} ${cut} L ${W} ${H} L 0 ${H} L 0 ${cut} Z`;
    }

    default:
      return `M 0 0 H ${W} V ${H} H 0 Z`;
  }
}
