import type { EditorElement } from "../types";
import { getLayoutSelection } from "./layout-elements";

export type AlignType =
  | "left"
  | "horizontal-center"
  | "right"
  | "top"
  | "vertical-center"
  | "bottom";

export type DistributeType = "horizontal" | "vertical";

export interface SelectionBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface ElementPatch {
  id: string;
  patch: Partial<EditorElement>;
}

/**
 * Calculates the bounding box of a list of elements.
 */
export function getSelectionBounds(elements: EditorElement[]): SelectionBounds | null {
  if (!elements || elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.x < minX) minX = el.x;
    if (el.y < minY) minY = el.y;
    const right = el.x + el.width;
    const bottom = el.y + el.height;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  if (minX === Infinity || maxX === -Infinity) return null;

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX,
    centerY,
  };
}

/**
 * Calculates alignment patches for elements.
 * - Single element: Aligns to parent container (or an explicitly supplied artboard).
 * - Multiple elements (>= 2): Aligns to the selection bounding box.
 */
export function calculateAlign(
  elements: EditorElement[],
  type: AlignType,
  parent?: EditorElement | null,
  containerSize?: { width: number; height: number },
  allElements?: EditorElement[],
): ElementPatch[] {
  if (!elements || elements.length === 0) return [];

  if (allElements && elements.length > 1) {
    const world = getLayoutSelection(elements, allElements);
    // A selected container and its child are one layout object, never two moves.
    if (world.length < 2) return [];
    return toLocalPatches(calculateAlign(world, type), elements, world);
  }
  if (allElements && elements.length === 1) {
    const world = getLayoutSelection(elements, allElements);
    if (world[0]?.locked) return [];
  }

  // Filter movable (unlocked) elements
  const movableElements = elements.filter((el) => !el.locked);
  if (movableElements.length === 0) return [];

  const patches: ElementPatch[] = [];

  // 1. Single selection -> Align to parent container or explicit canvas bounds
  if (elements.length === 1) {
    const el = movableElements[0];
    if (!el) return [];

    if (!parent && !containerSize) return [];
    const cW = parent?.width ?? containerSize!.width;
    const cH = parent?.height ?? containerSize!.height;

    switch (type) {
      case "left":
        patches.push({ id: el.id, patch: { x: 0 } });
        break;
      case "horizontal-center":
        patches.push({ id: el.id, patch: { x: Math.round((cW - el.width) / 2) } });
        break;
      case "right":
        patches.push({ id: el.id, patch: { x: cW - el.width } });
        break;
      case "top":
        patches.push({ id: el.id, patch: { y: 0 } });
        break;
      case "vertical-center":
        patches.push({ id: el.id, patch: { y: Math.round((cH - el.height) / 2) } });
        break;
      case "bottom":
        patches.push({ id: el.id, patch: { y: cH - el.height } });
        break;
    }
    return patches;
  }

  // 2. Multi-selection -> Align to collective selection bounding box
  const bounds = getSelectionBounds(elements);
  if (!bounds) return [];

  for (const el of movableElements) {
    switch (type) {
      case "left":
        if (el.x !== bounds.minX) {
          patches.push({ id: el.id, patch: { x: bounds.minX } });
        }
        break;
      case "horizontal-center": {
        const targetX = Math.round(bounds.centerX - el.width / 2);
        if (el.x !== targetX) {
          patches.push({ id: el.id, patch: { x: targetX } });
        }
        break;
      }
      case "right": {
        const targetX = bounds.maxX - el.width;
        if (el.x !== targetX) {
          patches.push({ id: el.id, patch: { x: targetX } });
        }
        break;
      }
      case "top":
        if (el.y !== bounds.minY) {
          patches.push({ id: el.id, patch: { y: bounds.minY } });
        }
        break;
      case "vertical-center": {
        const targetY = Math.round(bounds.centerY - el.height / 2);
        if (el.y !== targetY) {
          patches.push({ id: el.id, patch: { y: targetY } });
        }
        break;
      }
      case "bottom": {
        const targetY = bounds.maxY - el.height;
        if (el.y !== targetY) {
          patches.push({ id: el.id, patch: { y: targetY } });
        }
        break;
      }
    }
  }

  return patches;
}

/**
 * Calculates distribution patches for 3 or more elements (Equal Spacing).
 */
export function calculateDistribute(
  elements: EditorElement[],
  type: DistributeType,
  allElements?: EditorElement[],
): ElementPatch[] {
  const world = allElements ? getLayoutSelection(elements, allElements) : elements;
  if (world.length < 3 || world.some((el) => el.locked)) return [];
  const axis = type === "horizontal" ? "x" : "y";
  const size = type === "horizontal" ? "width" : "height";
  const sorted = [...world].sort((a, b) => a[axis] - b[axis]);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const total = sorted.reduce((sum, el) => sum + el[size], 0);
  const gap = (last[axis] + last[size] - first[axis] - total) / (sorted.length - 1);
  let cursor = first[axis] + first[size];
  const patches: ElementPatch[] = [];
  for (const el of sorted.slice(1, -1)) {
    cursor += gap;
    const position = Math.round(cursor * 1000) / 1000;
    if (el[axis] !== position) patches.push({ id: el.id, patch: { [axis]: position } });
    cursor += el[size];
  }
  return allElements ? toLocalPatches(patches, elements, world) : patches;
}

/** Set explicit edge-to-edge spacing, keeping the first component anchored. */
export function calculateSpacing(
  elements: EditorElement[],
  type: DistributeType,
  gap: number,
  allElements?: EditorElement[],
): ElementPatch[] {
  const world = allElements ? getLayoutSelection(elements, allElements) : elements;
  if (world.length < 2 || world.some((el) => el.locked) || !Number.isFinite(gap) || gap < 0) return [];
  const axis = type === "horizontal" ? "x" : "y";
  const size = type === "horizontal" ? "width" : "height";
  const sorted = [...world].sort((a, b) => a[axis] - b[axis]);
  let cursor = sorted[0]![axis] + sorted[0]![size] + gap;
  const patches: ElementPatch[] = [];
  for (const el of sorted.slice(1)) {
    if (el[axis] !== cursor) patches.push({ id: el.id, patch: { [axis]: cursor } });
    cursor += el[size] + gap;
  }
  return allElements ? toLocalPatches(patches, elements, world) : patches;
}

function toLocalPatches(patches: ElementPatch[], local: EditorElement[], world: EditorElement[]): ElementPatch[] {
  return patches.map(({ id, patch }) => {
    const original = local.find((el) => el.id === id)!;
    const absolute = world.find((el) => el.id === id)!;
    return { id, patch: {
      ...patch,
      ...(patch.x !== undefined ? { x: original.x + patch.x - absolute.x } : {}),
      ...(patch.y !== undefined ? { y: original.y + patch.y - absolute.y } : {}),
    } };
  });
}
