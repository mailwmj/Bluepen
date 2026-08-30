import type { EditorElement } from "../types";

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
 * - Single element: Aligns to parent container (or canvas artboard 1440x900).
 * - Multiple elements (>= 2): Aligns to the selection bounding box.
 */
export function calculateAlign(
  elements: EditorElement[],
  type: AlignType,
  parent?: EditorElement | null,
  containerSize = { width: 1440, height: 900 },
): ElementPatch[] {
  if (!elements || elements.length === 0) return [];

  // Filter movable (unlocked) elements
  const movableElements = elements.filter((el) => !el.locked);
  if (movableElements.length === 0) return [];

  const patches: ElementPatch[] = [];

  // 1. Single selection -> Align to parent container or default canvas bounds
  if (elements.length === 1) {
    const el = movableElements[0];
    if (!el) return [];

    const cW = parent?.width ?? containerSize.width;
    const cH = parent?.height ?? containerSize.height;

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
): ElementPatch[] {
  if (!elements || elements.length < 3) return [];

  const movable = elements.filter((el) => !el.locked);
  if (movable.length < 3) return [];

  const patches: ElementPatch[] = [];

  if (type === "horizontal") {
    // Sort left to right
    const sorted = [...movable].sort((a, b) => a.x - b.x || a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) return [];

    const minX = first.x;
    const maxX = last.x + last.width;
    const totalWidth = sorted.reduce((sum, item) => sum + item.width, 0);
    const totalGap = (maxX - minX) - totalWidth;
    const gap = totalGap / (sorted.length - 1);

    let currentRight = minX;
    for (let i = 0; i < sorted.length; i++) {
      const el = sorted[i];
      if (!el) continue;

      if (i === 0) {
        currentRight = el.x + el.width;
      } else if (i === sorted.length - 1) {
        const targetX = maxX - el.width;
        if (el.x !== targetX) {
          patches.push({ id: el.id, patch: { x: targetX } });
        }
      } else {
        const targetX = Math.round(currentRight + gap);
        if (el.x !== targetX) {
          patches.push({ id: el.id, patch: { x: targetX } });
        }
        currentRight = targetX + el.width;
      }
    }
  } else if (type === "vertical") {
    // Sort top to bottom
    const sorted = [...movable].sort((a, b) => a.y - b.y || a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) return [];

    const minY = first.y;
    const maxY = last.y + last.height;
    const totalHeight = sorted.reduce((sum, item) => sum + item.height, 0);
    const totalGap = (maxY - minY) - totalHeight;
    const gap = totalGap / (sorted.length - 1);

    let currentBottom = minY;
    for (let i = 0; i < sorted.length; i++) {
      const el = sorted[i];
      if (!el) continue;

      if (i === 0) {
        currentBottom = el.y + el.height;
      } else if (i === sorted.length - 1) {
        const targetY = maxY - el.height;
        if (el.y !== targetY) {
          patches.push({ id: el.id, patch: { y: targetY } });
        }
      } else {
        const targetY = Math.round(currentBottom + gap);
        if (el.y !== targetY) {
          patches.push({ id: el.id, patch: { y: targetY } });
        }
        currentBottom = targetY + el.height;
      }
    }
  }

  return patches;
}
