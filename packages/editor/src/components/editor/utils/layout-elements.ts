import type { EditorElement } from "../types";

/** A deduplicated canvas-space view. Stored children always keep parent-local coordinates. */
export function getLayoutElements(elements: EditorElement[], excludedIds: string[] = []): EditorElement[] {
  const byId = new Map<string, EditorElement>();
  const collect = (nodes: EditorElement[]) => {
    for (const node of nodes) {
      if (byId.has(node.id)) continue;
      byId.set(node.id, node);
      collect(node.children);
    }
  };
  collect(elements);
  const excluded = new Set(excludedIds);
  const result: EditorElement[] = [];
  for (const node of byId.values()) {
    let x = node.x, y = node.y;
    let visible = node.visible, locked = node.locked;
    let omit = excluded.has(node.id);
    let parentId = node.parentId;
    const visited = new Set([node.id]);
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      omit ||= excluded.has(parentId);
      const parent = byId.get(parentId);
      if (!parent) break;
      x += parent.x;
      y += parent.y;
      visible &&= parent.visible;
      locked ||= parent.locked;
      parentId = parent.parentId;
    }
    if (!omit) result.push({ ...node, x, y, visible, locked, children: [] });
  }
  return result;
}

export function getLayoutSelection(selected: EditorElement[], all: EditorElement[]): EditorElement[] {
  const selectedIds = new Set(selected.map((el) => el.id));
  const world = getLayoutElements(all);
  const byId = new Map(world.map((el) => [el.id, el]));
  return world.filter((el) => {
    if (!selectedIds.has(el.id)) return false;
    let parentId = el.parentId;
    const visited = new Set([el.id]);
    while (parentId && !visited.has(parentId)) {
      if (selectedIds.has(parentId)) return false;
      visited.add(parentId);
      parentId = byId.get(parentId)?.parentId ?? null;
    }
    return true;
  });
}

/** Clicking a group moves it; after entering it, children remain directly selectable. */
export function resolveGroupSelection(id: string, selectedIds: string[], all: EditorElement[]): string {
  const byId = new Map(all.map((el) => [el.id, el]));
  if (selectedIds.includes(id)) return id;
  const selected = selectedIds.map((selectedId) => byId.get(selectedId));
  const editingParent = selected[0]?.parentId && selected.every((el) => el?.parentId === selected[0]?.parentId)
    ? selected[0].parentId : null;
  let current = byId.get(id);
  let target = id;
  const visited = new Set([id]);
  while (current?.parentId && !visited.has(current.parentId)) {
    if (current.parentId === editingParent) break;
    visited.add(current.parentId);
    current = byId.get(current.parentId);
    if (current?.type === "group") target = current.id;
  }
  return target;
}
