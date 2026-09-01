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
  top: "上",
  right: "右",
  bottom: "下",
  left: "左",
  center: "居中",
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
 * Resolves the dynamic bounding box of an element (including connectors with live linked anchors).
 */
export function getElementDynamicBounds(
  element: EditorElement,
  allElementsFlat?: EditorElement[],
): { x: number; y: number; width: number; height: number } {
  if (element.type === "connector") {
    const startEl = element.props.startElementId && allElementsFlat
      ? allElementsFlat.find((e) => e.id === element.props.startElementId)
      : null;
    const endEl = element.props.endElementId && allElementsFlat
      ? allElementsFlat.find((e) => e.id === element.props.endElementId)
      : null;

    let sX = Number(element.props.startPointX ?? element.x);
    let sY = Number(element.props.startPointY ?? element.y);
    let eX = Number(element.props.endPointX ?? element.x + element.width);
    let eY = Number(element.props.endPointY ?? element.y + element.height);

    if (startEl && allElementsFlat) {
      const anchor = getElementAnchor(startEl, (element.props.startPort as AnchorPort) || "right", allElementsFlat);
      sX = anchor.point.x;
      sY = anchor.point.y;
    }
    if (endEl && allElementsFlat) {
      const anchor = getElementAnchor(endEl, (element.props.endPort as AnchorPort) || "left", allElementsFlat);
      eX = anchor.point.x;
      eY = anchor.point.y;
    }

    const minX = Math.min(sX, eX);
    const minY = Math.min(sY, eY);
    return {
      x: minX,
      y: minY,
      width: Math.max(10, Math.abs(eX - sX)),
      height: Math.max(10, Math.abs(eY - sY)),
    };
  }

  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
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

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Simplifies a sequence of orthogonal points by removing redundant collinear waypoints
 * and zero-distance micro-steps.
 */
export function simplifyOrthogonalPoints(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  // 1. Remove points that are virtually identical
  const deduped: Point[] = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    const prev = deduped[deduped.length - 1]!;
    const curr = points[i]!;
    if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > 0.5) {
      deduped.push(curr);
    }
  }

  if (deduped.length <= 2) return deduped;

  // 2. Remove collinear intermediate points
  const result: Point[] = [deduped[0]!];
  for (let i = 1; i < deduped.length - 1; i++) {
    const pPrev = result[result.length - 1]!;
    const pCurr = deduped[i]!;
    const pNext = deduped[i + 1]!;

    const isHoriz = Math.abs(pPrev.y - pCurr.y) < 0.5 && Math.abs(pCurr.y - pNext.y) < 0.5;
    const isVert = Math.abs(pPrev.x - pCurr.x) < 0.5 && Math.abs(pCurr.x - pNext.x) < 0.5;

    if (isHoriz || isVert) {
      continue;
    }
    result.push(pCurr);
  }
  result.push(deduped[deduped.length - 1]!);

  return result;
}

/**
 * Checks whether an orthogonal segment (horizontal or vertical) strictly penetrates
 * the interior of any bounding box obstacle.
 */
function isSegmentColliding(p1: Point, p2: Point, boxes: Rect[]): boolean {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);
  const isHoriz = Math.abs(minY - maxY) < 0.01;
  const isVert = Math.abs(minX - maxX) < 0.01;

  for (const box of boxes) {
    const bx1 = box.x;
    const bx2 = box.x + box.width;
    const by1 = box.y;
    const by2 = box.y + box.height;
    const eps = 1.0;

    if (isHoriz) {
      if (minY > by1 + eps && minY < by2 - eps) {
        if (Math.max(minX, bx1) < Math.min(maxX, bx2) - eps) {
          return true;
        }
      }
    } else if (isVert) {
      if (minX > bx1 + eps && minX < bx2 - eps) {
        if (Math.max(minY, by1) < Math.min(maxY, by2) - eps) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Calculates the midpoint along the polyline path length for label placement.
 */
export function calculatePolylineMidpoint(waypoints: Point[]): Point {
  if (waypoints.length === 0) return { x: 0, y: 0 };
  if (waypoints.length === 1) return waypoints[0]!;

  let totalLength = 0;
  const segLengths: number[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i]!;
    const p2 = waypoints[i + 1]!;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    segLengths.push(len);
    totalLength += len;
  }

  if (totalLength <= 0) return waypoints[0]!;

  const targetDist = totalLength / 2;
  let accumulated = 0;

  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i]!;
    if (accumulated + segLen >= targetDist) {
      const remaining = targetDist - accumulated;
      const ratio = segLen > 0 ? remaining / segLen : 0;
      const p1 = waypoints[i]!;
      const p2 = waypoints[i + 1]!;
      return {
        x: Math.round(p1.x + (p2.x - p1.x) * ratio),
        y: Math.round(p1.y + (p2.y - p1.y) * ratio),
      };
    }
    accumulated += segLen;
  }

  const last = waypoints[waypoints.length - 1]!;
  return { x: Math.round(last.x), y: Math.round(last.y) };
}

/**
 * Calculates clean, robust orthogonal waypoints between start and end anchor positions
 * using an obstacle-aware Manhattan routing algorithm with port clearance stubs.
 */
export function calculateOrthogonalPath(
  start: { point: Point; dir?: Vector; box?: Rect },
  end: { point: Point; dir?: Vector; box?: Rect },
  radius = 8,
  stub = 20,
  options?: { startBox?: Rect; endBox?: Rect; obstacles?: Rect[]; padding?: number },
): { d: string; waypoints: Point[]; midpoint: Point } {
  const sx = start.point.x;
  const sy = start.point.y;
  const ex = end.point.x;
  const ey = end.point.y;

  const sDir = start.dir || { x: 0, y: 0 };
  const eDir = end.dir || { x: 0, y: 0 };

  const startBox = options?.startBox ?? start.box;
  const endBox = options?.endBox ?? end.box;
  const padding = options?.padding ?? 16;
  const obstacles = options?.obstacles ?? [];

  const hasStartDir = Math.abs(sDir.x) > 0.1 || Math.abs(sDir.y) > 0.1;
  const hasEndDir = Math.abs(eDir.x) > 0.1 || Math.abs(eDir.y) > 0.1;

  const p0: Point = { x: sx, y: sy };
  const pN: Point = { x: ex, y: ey };

  // Calculate safe exit stub for start port (outside startBox)
  let pStartStub: Point = p0;
  if (hasStartDir) {
    if (Math.abs(sDir.x) > Math.abs(sDir.y)) {
      if (sDir.x > 0) {
        const minOutX = startBox ? startBox.x + startBox.width + padding : sx + stub;
        pStartStub = { x: Math.max(sx + stub, minOutX), y: sy };
      } else {
        const minOutX = startBox ? startBox.x - padding : sx - stub;
        pStartStub = { x: Math.min(sx - stub, minOutX), y: sy };
      }
    } else {
      if (sDir.y > 0) {
        const minOutY = startBox ? startBox.y + startBox.height + padding : sy + stub;
        pStartStub = { x: sx, y: Math.max(sy + stub, minOutY) };
      } else {
        const minOutY = startBox ? startBox.y - padding : sy - stub;
        pStartStub = { x: sx, y: Math.min(sy - stub, minOutY) };
      }
    }
  }

  // Calculate safe approach stub for end port (outside endBox)
  let pEndStub: Point = pN;
  if (hasEndDir) {
    if (Math.abs(eDir.x) > Math.abs(eDir.y)) {
      if (eDir.x > 0) {
        const minOutX = endBox ? endBox.x + endBox.width + padding : ex + stub;
        pEndStub = { x: Math.max(ex + stub, minOutX), y: ey };
      } else {
        const minOutX = endBox ? endBox.x - padding : ex - stub;
        pEndStub = { x: Math.min(ex - stub, minOutX), y: ey };
      }
    } else {
      if (eDir.y > 0) {
        const minOutY = endBox ? endBox.y + endBox.height + padding : ey + stub;
        pEndStub = { x: ex, y: Math.max(ey + stub, minOutY) };
      } else {
        const minOutY = endBox ? endBox.y - padding : ey - stub;
        pEndStub = { x: ex, y: Math.min(ey - stub, minOutY) };
      }
    }
  }

  // Collect obstacle bounding boxes
  const obstacleBoxes: Rect[] = [];
  if (startBox) obstacleBoxes.push(startBox);
  if (endBox && (!startBox || endBox.x !== startBox.x || endBox.y !== startBox.y)) {
    obstacleBoxes.push(endBox);
  }
  for (const obs of obstacles) {
    if (obs && !obstacleBoxes.includes(obs)) {
      obstacleBoxes.push(obs);
    }
  }

  // Generate feature orthogonal grid lines
  const xSet = new Set<number>();
  const ySet = new Set<number>();

  xSet.add(sx);
  xSet.add(ex);
  xSet.add(pStartStub.x);
  xSet.add(pEndStub.x);
  xSet.add((pStartStub.x + pEndStub.x) / 2);

  ySet.add(sy);
  ySet.add(ey);
  ySet.add(pStartStub.y);
  ySet.add(pEndStub.y);
  ySet.add((pStartStub.y + pEndStub.y) / 2);

  for (const box of obstacleBoxes) {
    const pad = padding;
    xSet.add(box.x - pad);
    xSet.add(box.x + box.width + pad);
    ySet.add(box.y - pad);
    ySet.add(box.y + box.height + pad);
  }

  if (obstacleBoxes.length > 0) {
    const allX = Array.from(xSet);
    const allY = Array.from(ySet);
    const minAllX = Math.min(...allX);
    const maxAllX = Math.max(...allX);
    const minAllY = Math.min(...allY);
    const maxAllY = Math.max(...allY);
    xSet.add(minAllX - padding);
    xSet.add(maxAllX + padding);
    ySet.add(minAllY - padding);
    ySet.add(maxAllY + padding);
  }

  // Deduplicate and sort coordinates
  const sortedX = Array.from(xSet).sort((a, b) => a - b);
  const cleanedX: number[] = [];
  for (const x of sortedX) {
    if (cleanedX.length === 0 || Math.abs(x - cleanedX[cleanedX.length - 1]!) > 1.0) {
      cleanedX.push(x);
    }
  }

  const sortedY = Array.from(ySet).sort((a, b) => a - b);
  const cleanedY: number[] = [];
  for (const y of sortedY) {
    if (cleanedY.length === 0 || Math.abs(y - cleanedY[cleanedY.length - 1]!) > 1.0) {
      cleanedY.push(y);
    }
  }

  const getClosestIdx = (val: number, arr: number[]) => {
    let best = 0;
    let minD = Infinity;
    for (let i = 0; i < arr.length; i++) {
      const d = Math.abs(val - arr[i]!);
      if (d < minD) {
        minD = d;
        best = i;
      }
    }
    return best;
  };

  const startIx = getClosestIdx(pStartStub.x, cleanedX);
  const startIy = getClosestIdx(pStartStub.y, cleanedY);
  const endIx = getClosestIdx(pEndStub.x, cleanedX);
  const endIy = getClosestIdx(pEndStub.y, cleanedY);

  // A* Search on the Manhattan Grid
  interface GridState {
    ix: number;
    iy: number;
    dir: number; // 0: None, 1: H, 2: V
    g: number;
    f: number;
    key: string;
  }

  const openList: GridState[] = [];
  const gScores = new Map<string, number>();
  const cameFrom = new Map<string, { ix: number; iy: number; dir: number }>();

  const startKey = `${startIx},${startIy},0`;
  gScores.set(startKey, 0);
  openList.push({
    ix: startIx,
    iy: startIy,
    dir: 0,
    g: 0,
    f: Math.abs(cleanedX[startIx]! - cleanedX[endIx]!) + Math.abs(cleanedY[startIy]! - cleanedY[endIy]!),
    key: startKey,
  });

  let reachedKey: string | null = null;
  let loops = 0;
  const maxLoops = 400;

  while (openList.length > 0 && loops++ < maxLoops) {
    // Find item with lowest fScore
    let bestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i]!.f < openList[bestIdx]!.f) {
        bestIdx = i;
      }
    }
    const current = openList.splice(bestIdx, 1)[0]!;

    if (current.ix === endIx && current.iy === endIy) {
      reachedKey = current.key;
      break;
    }

    const curX = cleanedX[current.ix]!;
    const curY = cleanedY[current.iy]!;

    // 4 Cardinal Neighbors
    const neighbors: { nix: number; niy: number; newDir: number }[] = [
      { nix: current.ix + 1, niy: current.iy, newDir: 1 },
      { nix: current.ix - 1, niy: current.iy, newDir: 1 },
      { nix: current.ix, niy: current.iy + 1, newDir: 2 },
      { nix: current.ix, niy: current.iy - 1, newDir: 2 },
    ];

    for (const { nix, niy, newDir } of neighbors) {
      if (nix < 0 || nix >= cleanedX.length || niy < 0 || niy >= cleanedY.length) {
        continue;
      }

      const nextX = cleanedX[nix]!;
      const nextY = cleanedY[niy]!;

      // Check collision against obstacle boxes
      if (isSegmentColliding({ x: curX, y: curY }, { x: nextX, y: nextY }, obstacleBoxes)) {
        continue;
      }

      const stepDist = Math.abs(nextX - curX) + Math.abs(nextY - curY);
      const bendPenalty = current.dir !== 0 && current.dir !== newDir ? 40 : 0;
      const tentativeG = current.g + stepDist + bendPenalty;

      const neighborKey = `${nix},${niy},${newDir}`;
      const existingG = gScores.get(neighborKey);

      if (existingG === undefined || tentativeG < existingG) {
        gScores.set(neighborKey, tentativeG);
        cameFrom.set(neighborKey, { ix: current.ix, iy: current.iy, dir: current.dir });

        const h = Math.abs(nextX - cleanedX[endIx]!) + Math.abs(nextY - cleanedY[endIy]!);
        openList.push({
          ix: nix,
          iy: niy,
          dir: newDir,
          g: tentativeG,
          f: tentativeG + h,
          key: neighborKey,
        });
      }
    }
  }

  let rawWaypoints: Point[] = [];

  if (reachedKey) {
    const gridPoints: Point[] = [];
    let currKey: string | null = reachedKey;
    while (currKey) {
      const parts = currKey.split(",").map(Number);
      const cIx = parts[0]!;
      const cIy = parts[1]!;
      gridPoints.unshift({ x: cleanedX[cIx]!, y: cleanedY[cIy]! });
      const prev = cameFrom.get(currKey);
      if (!prev) break;
      currKey = `${prev.ix},${prev.iy},${prev.dir}`;
    }

    rawWaypoints = [p0, pStartStub, ...gridPoints, pEndStub, pN];
  } else {
    // Fallback if no obstacle-free grid path exists (e.g. tightly overlapping elements)
    const midX = pStartStub.x + (pEndStub.x - pStartStub.x) / 2;
    rawWaypoints = [
      p0,
      pStartStub,
      { x: midX, y: pStartStub.y },
      { x: midX, y: pEndStub.y },
      pEndStub,
      pN,
    ];
  }

  const waypoints = simplifyOrthogonalPoints(rawWaypoints);
  const d = buildRoundedSvgPath(waypoints, radius);
  const midpoint = calculatePolylineMidpoint(waypoints);

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

export interface OrthogonalSegment {
  index: number;
  p1: Point;
  p2: Point;
  mid: Point;
  isVertical: boolean;
  length: number;
}

/**
 * Extracts distinct orthogonal segments from a waypoints list.
 */
export function getOrthogonalSegments(waypoints: Point[]): OrthogonalSegment[] {
  if (!waypoints || waypoints.length < 2) return [];

  const segments: OrthogonalSegment[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i]!;
    const p2 = waypoints[i + 1]!;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const isVertical = Math.abs(dx) <= Math.abs(dy);

    segments.push({
      index: i,
      p1,
      p2,
      mid: {
        x: Math.round((p1.x + p2.x) / 2),
        y: Math.round((p1.y + p2.y) / 2),
      },
      isVertical,
      length: len,
    });
  }

  return segments;
}

/**
 * Adapts existing custom waypoints when the start or end terminal anchors move.
 */
export function adaptCustomWaypoints(waypoints: Point[], startPt: Point, endPt: Point): Point[] {
  if (!waypoints || waypoints.length < 2) return [startPt, endPt];

  const pts: Point[] = waypoints.map((p) => ({ ...p }));
  const N = pts.length;

  // 1. Update start point
  pts[0] = { x: Math.round(startPt.x), y: Math.round(startPt.y) };
  if (N > 2) {
    const isFirstVert = Math.abs(pts[1]!.x - waypoints[0]!.x) < 2;
    if (isFirstVert) {
      pts[1] = { x: pts[0]!.x, y: pts[1]!.y };
    } else {
      pts[1] = { x: pts[1]!.x, y: pts[0]!.y };
    }
  }

  // 2. Update end point
  pts[N - 1] = { x: Math.round(endPt.x), y: Math.round(endPt.y) };
  if (N > 2) {
    const isLastVert = Math.abs(pts[N - 2]!.x - waypoints[waypoints.length - 1]!.x) < 2;
    if (isLastVert) {
      pts[N - 2] = { x: pts[N - 1]!.x, y: pts[N - 2]!.y };
    } else {
      pts[N - 2] = { x: pts[N - 2]!.x, y: pts[N - 1]!.y };
    }
  }

  return simplifyOrthogonalPoints(pts);
}

/**
 * Modifies an orthogonal segment's position (single-axis translation) and updates waypoints.
 */
export function moveOrthogonalSegment(
  waypoints: Point[],
  segmentIndex: number,
  newCoord: number,
): Point[] {
  if (!waypoints || waypoints.length < 2 || segmentIndex < 0 || segmentIndex >= waypoints.length - 1) {
    return waypoints;
  }

  const N = waypoints.length;
  const pts: Point[] = waypoints.map((p) => ({ ...p }));
  const p1 = pts[segmentIndex]!;
  const p2 = pts[segmentIndex + 1]!;
  const isVert = Math.abs(p1.x - p2.x) <= Math.abs(p1.y - p2.y);
  const roundedCoord = Math.round(newCoord);

  // Case 1: Pure 2-point straight line (splitting into a 3-segment Z/U step)
  if (N === 2) {
    if (isVert) {
      const midY = Math.round((p1.y + p2.y) / 2);
      return simplifyOrthogonalPoints([
        p1,
        { x: p1.x, y: midY },
        { x: roundedCoord, y: midY },
        { x: roundedCoord, y: p2.y },
        p2,
      ]);
    } else {
      const midX = Math.round((p1.x + p2.x) / 2);
      return simplifyOrthogonalPoints([
        p1,
        { x: midX, y: p1.y },
        { x: midX, y: roundedCoord },
        { x: p2.x, y: roundedCoord },
        p2,
      ]);
    }
  }

  // Case 2: Intermediate segment (0 < segmentIndex < N - 2)
  if (segmentIndex > 0 && segmentIndex < N - 2) {
    if (isVert) {
      pts[segmentIndex] = { x: roundedCoord, y: pts[segmentIndex]!.y };
      pts[segmentIndex + 1] = { x: roundedCoord, y: pts[segmentIndex + 1]!.y };
    } else {
      pts[segmentIndex] = { x: pts[segmentIndex]!.x, y: roundedCoord };
      pts[segmentIndex + 1] = { x: pts[segmentIndex + 1]!.x, y: roundedCoord };
    }
    return simplifyOrthogonalPoints(pts);
  }

  // Case 3: First segment (segmentIndex === 0)
  if (segmentIndex === 0) {
    const fixedP0 = pts[0]!;
    if (isVert) {
      const stubY = fixedP0.y + (p2.y > fixedP0.y ? 1 : -1) * Math.min(20, Math.max(10, Math.abs(p2.y - fixedP0.y) / 2));
      const newPts = [
        fixedP0,
        { x: fixedP0.x, y: Math.round(stubY) },
        { x: roundedCoord, y: Math.round(stubY) },
        { x: roundedCoord, y: p2.y },
        ...pts.slice(2),
      ];
      return simplifyOrthogonalPoints(newPts);
    } else {
      const stubX = fixedP0.x + (p2.x > fixedP0.x ? 1 : -1) * Math.min(20, Math.max(10, Math.abs(p2.x - fixedP0.x) / 2));
      const newPts = [
        fixedP0,
        { x: Math.round(stubX), y: fixedP0.y },
        { x: Math.round(stubX), y: roundedCoord },
        { x: p2.x, y: roundedCoord },
        ...pts.slice(2),
      ];
      return simplifyOrthogonalPoints(newPts);
    }
  }

  // Case 4: Last segment (segmentIndex === N - 2)
  if (segmentIndex === N - 2) {
    const fixedPN = pts[N - 1]!;
    if (isVert) {
      const stubY = fixedPN.y - (fixedPN.y > p1.y ? 1 : -1) * Math.min(20, Math.max(10, Math.abs(fixedPN.y - p1.y) / 2));
      const newPts = [
        ...pts.slice(0, N - 2),
        { x: roundedCoord, y: p1.y },
        { x: roundedCoord, y: Math.round(stubY) },
        { x: fixedPN.x, y: Math.round(stubY) },
        fixedPN,
      ];
      return simplifyOrthogonalPoints(newPts);
    } else {
      const stubX = fixedPN.x - (fixedPN.x > p1.x ? 1 : -1) * Math.min(20, Math.max(10, Math.abs(fixedPN.x - p1.x) / 2));
      const newPts = [
        ...pts.slice(0, N - 2),
        { x: p1.x, y: roundedCoord },
        { x: Math.round(stubX), y: roundedCoord },
        { x: Math.round(stubX), y: fixedPN.y },
        fixedPN,
      ];
      return simplifyOrthogonalPoints(newPts);
    }
  }

  return simplifyOrthogonalPoints(pts);
}
