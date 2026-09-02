import type { EditorElement } from "../types";

export const BLUEPEN_CLIPBOARD_MIME = "application/x-bluepen-elements";
export const BLUEPEN_CLIPBOARD_TYPE = "bluepen/elements";

export interface BluepenClipboardPayload {
  type: typeof BLUEPEN_CLIPBOARD_TYPE;
  version: 1;
  copiedAt: number;
  elements: EditorElement[];
}

let internalClipboardCache: EditorElement[] | null = null;

export function genId(): string {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function serializeElementsForClipboard(elements: EditorElement[]): string {
  const payload: BluepenClipboardPayload = {
    type: BLUEPEN_CLIPBOARD_TYPE,
    version: 1,
    copiedAt: Date.now(),
    elements: JSON.parse(JSON.stringify(elements)),
  };
  return JSON.stringify(payload);
}

function isValidElement(obj: unknown): obj is EditorElement {
  if (!obj || typeof obj !== "object") return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.type === "string" &&
    typeof candidate.x === "number" &&
    typeof candidate.y === "number" &&
    typeof candidate.width === "number" &&
    typeof candidate.height === "number"
  );
}

export function parseElementsFromClipboard(text: string | null | undefined): EditorElement[] | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const data = JSON.parse(trimmed);
    if (data && typeof data === "object") {
      if (data.type === BLUEPEN_CLIPBOARD_TYPE && Array.isArray(data.elements)) {
        if (data.elements.length > 0 && isValidElement(data.elements[0])) {
          return data.elements as EditorElement[];
        }
      }
      if (Array.isArray(data) && data.length > 0 && isValidElement(data[0])) {
        return data as EditorElement[];
      }
      if (isValidElement(data)) {
        return [data as EditorElement];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function setInternalClipboard(elements: EditorElement[] | null): void {
  internalClipboardCache = elements ? JSON.parse(JSON.stringify(elements)) : null;
}

export function getInternalClipboard(): EditorElement[] | null {
  return internalClipboardCache ? JSON.parse(JSON.stringify(internalClipboardCache)) : null;
}

export function getTopLevelSelectedElements(
  selectedIds: string[],
  elements: EditorElement[],
): EditorElement[] {
  if (!selectedIds || selectedIds.length === 0) return [];
  const selectedSet = new Set(selectedIds);

  const flatMap = new Map<string, EditorElement>();
  const parentMap = new Map<string, string | null>();

  const indexTree = (list: EditorElement[], currentParentId: string | null) => {
    for (const el of list) {
      flatMap.set(el.id, el);
      parentMap.set(el.id, currentParentId || el.parentId || null);
      if (el.children && el.children.length > 0) {
        indexTree(el.children, el.id);
      }
    }
  };
  indexTree(elements, null);

  const topLevelSelected: EditorElement[] = [];

  for (const id of selectedIds) {
    const el = flatMap.get(id);
    if (!el) continue;

    let hasSelectedAncestor = false;
    let currParentId = parentMap.get(id);
    const visited = new Set<string>([id]);

    while (currParentId) {
      if (visited.has(currParentId)) break;
      visited.add(currParentId);
      if (selectedSet.has(currParentId)) {
        hasSelectedAncestor = true;
        break;
      }
      currParentId = parentMap.get(currParentId) || null;
    }

    if (!hasSelectedAncestor) {
      // If this element is inside a container/group that is NOT part of the selection,
      // convert its coordinates to absolute world coordinates and detach parentId
      if (el.parentId) {
        let curX = el.x;
        let curY = el.y;
        let pId: string | null = el.parentId;
        const pVisited = new Set<string>([el.id]);

        while (pId) {
          if (pVisited.has(pId)) break;
          pVisited.add(pId);
          const parent = flatMap.get(pId);
          if (!parent) break;
          curX += parent.x;
          curY += parent.y;
          pId = parent.parentId || null;
        }

        const cloned = JSON.parse(JSON.stringify(el)) as EditorElement;
        cloned.x = Math.round(curX);
        cloned.y = Math.round(curY);
        cloned.parentId = null;
        topLevelSelected.push(cloned);
      } else {
        topLevelSelected.push(JSON.parse(JSON.stringify(el)) as EditorElement);
      }
    }
  }

  return topLevelSelected;
}

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function cloneElementsForPaste(
  elements: EditorElement[],
  targetPos?: { x: number; y: number },
  pasteCount = 0,
  viewportBounds?: ViewportBounds,
): { clonedElements: EditorElement[]; newSelectedIds: string[] } {
  if (!elements || elements.length === 0) {
    return { clonedElements: [], newSelectedIds: [] };
  }

  const minX = Math.min(...elements.map((e) => e.x));
  const minY = Math.min(...elements.map((e) => e.y));
  const maxX = Math.max(...elements.map((e) => e.x + (e.width || 0)));
  const maxY = Math.max(...elements.map((e) => e.y + (e.height || 0)));
  const boundingWidth = maxX - minX;
  const boundingHeight = maxY - minY;

  let deltaX = 0;
  let deltaY = 0;

  if (targetPos !== undefined) {
    deltaX = targetPos.x - minX;
    deltaY = targetPos.y - minY;
  } else {
    // Check if the original elements are completely outside the visible viewport
    let isOffscreen = false;
    if (viewportBounds) {
      isOffscreen =
        maxX < viewportBounds.minX ||
        minX > viewportBounds.maxX ||
        maxY < viewportBounds.minY ||
        minY > viewportBounds.maxY;
    }

    if (isOffscreen && viewportBounds) {
      // Center in visible viewport
      const vpCenterX = (viewportBounds.minX + viewportBounds.maxX) / 2;
      const vpCenterY = (viewportBounds.minY + viewportBounds.maxY) / 2;
      const targetCenterX = vpCenterX - boundingWidth / 2;
      const targetCenterY = vpCenterY - boundingHeight / 2;
      const offset = (pasteCount % 10) * 20;
      deltaX = Math.round(targetCenterX - minX + offset);
      deltaY = Math.round(targetCenterY - minY + offset);
    } else {
      const offset = Math.max(20, (pasteCount + 1) * 20);
      deltaX = offset;
      deltaY = offset;
    }
  }

  const idMap = new Map<string, string>();
  const newTopLevelIds: string[] = [];

  const assignNewIds = (list: EditorElement[]) => {
    for (const el of list) {
      const newId = genId();
      idMap.set(el.id, newId);
      if (el.children && el.children.length > 0) {
        assignNewIds(el.children);
      }
    }
  };
  assignNewIds(elements);

  const cloneNode = (node: EditorElement, isTopLevel: boolean): EditorElement => {
    const newId = idMap.get(node.id) || genId();
    if (isTopLevel) {
      newTopLevelIds.push(newId);
    }

    const clonedProps = { ...(node.props || {}) };
    if (node.type === "connector") {
      if (typeof clonedProps.startElementId === "string" && idMap.has(clonedProps.startElementId)) {
        clonedProps.startElementId = idMap.get(clonedProps.startElementId)!;
      }
      if (typeof clonedProps.endElementId === "string" && idMap.has(clonedProps.endElementId)) {
        clonedProps.endElementId = idMap.get(clonedProps.endElementId)!;
      }
    }

    const newX = isTopLevel ? Math.round(node.x + deltaX) : node.x;
    const newY = isTopLevel ? Math.round(node.y + deltaY) : node.y;
    const newParentId = node.parentId ? (idMap.get(node.parentId) ?? node.parentId) : null;

    return {
      ...JSON.parse(JSON.stringify(node)),
      id: newId,
      name: `${node.name}`,
      x: newX,
      y: newY,
      parentId: newParentId,
      props: clonedProps,
      children: (node.children || []).map((child) => cloneNode(child, false)),
    };
  };

  const clonedElements = elements.map((el) => cloneNode(el, true));
  return { clonedElements, newSelectedIds: newTopLevelIds };
}
