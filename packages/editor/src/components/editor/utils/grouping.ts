import type { EditorElement } from "../types";

function genId() {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Checks whether the current selection can be grouped.
 */
export function canGroupElements(selectedIds: string[], elements: EditorElement[]): boolean {
  if (!selectedIds || selectedIds.length < 2) return false;
  return true;
}

/**
 * Checks whether the current selection contains any group or composite element that can be ungrouped.
 */
export function canUngroupElements(selectedIds: string[], elements: EditorElement[]): boolean {
  if (!selectedIds || selectedIds.length === 0) return false;
  const flat = flattenElements(elements);
  return flat.some(
    (el) => selectedIds.includes(el.id) && (el.type === "group" || (el.children && el.children.length > 0)),
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

/**
 * Groups multiple selected elements into a single Group container.
 * Sub-elements have their coordinates converted into relative coordinates within the group.
 */
export function groupElements(
  selectedIds: string[],
  elements: EditorElement[],
  groupName?: string,
): { nextElements: EditorElement[]; groupId: string | null } {
  if (!selectedIds || selectedIds.length < 1) {
    return { nextElements: elements, groupId: null };
  }

  const selectedSet = new Set(selectedIds);

  // Helper to recursively process a list of elements at any level of the tree
  let createdGroupId: string | null = null;

  const processLevel = (list: EditorElement[]): EditorElement[] => {
    // Check which elements at this specific level are selected
    const selectedAtLevel = list.filter((el) => selectedSet.has(el.id));

    if (selectedAtLevel.length >= 1 && selectedAtLevel.length === selectedIds.length) {
      // All selected elements are at this same level
      const minX = Math.min(...selectedAtLevel.map((el) => el.x));
      const minY = Math.min(...selectedAtLevel.map((el) => el.y));
      const maxX = Math.max(...selectedAtLevel.map((el) => el.x + el.width));
      const maxY = Math.max(...selectedAtLevel.map((el) => el.y + el.height));

      const groupId = genId();
      createdGroupId = groupId;
      const commonParentId = selectedAtLevel[0]?.parentId ?? null;

      const groupElement: EditorElement = {
        id: groupId,
        type: "group",
        name: groupName || "组合",
        x: minX,
        y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId: commonParentId,
        props: {},
        children: selectedAtLevel.map((child) => ({
          ...child,
          x: child.x - minX,
          y: child.y - minY,
          parentId: groupId,
        })),
      };

      // Replace the first selected element with the group, and drop the other selected elements
      let inserted = false;
      const result: EditorElement[] = [];

      for (const item of list) {
        if (selectedSet.has(item.id)) {
          if (!inserted) {
            result.push(groupElement);
            inserted = true;
          }
        } else {
          result.push({
            ...item,
            children: item.children ? processLevel(item.children) : [],
          });
        }
      }

      return result;
    }

    // Otherwise, recursively check children
    return list.map((item) => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: processLevel(item.children),
        };
      }
      return item;
    });
  };

  const nextElements = processLevel(elements);

  // Fallback: If elements were scattered across hierarchy, collect them to root
  if (!createdGroupId) {
    const flat = flattenElements(elements);
    const selectedTargets = flat.filter((el) => selectedSet.has(el.id));
    if (selectedTargets.length < 1) {
      return { nextElements: elements, groupId: null };
    }

    const minX = Math.min(...selectedTargets.map((el) => el.x));
    const minY = Math.min(...selectedTargets.map((el) => el.y));
    const maxX = Math.max(...selectedTargets.map((el) => el.x + el.width));
    const maxY = Math.max(...selectedTargets.map((el) => el.y + el.height));

    const groupId = genId();
    createdGroupId = groupId;

    const groupElement: EditorElement = {
      id: groupId,
      type: "group",
      name: groupName || "组合",
      x: minX,
      y: minY,
      width: Math.max(10, maxX - minX),
      height: Math.max(10, maxY - minY),
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      autoLayout: null,
      parentId: null,
      props: {},
      children: selectedTargets.map((child) => ({
        ...child,
        x: child.x - minX,
        y: child.y - minY,
        parentId: groupId,
      })),
    };

    const removeSelectedRecursive = (list: EditorElement[]): EditorElement[] => {
      return list
        .filter((el) => !selectedSet.has(el.id))
        .map((el) => ({
          ...el,
          children: el.children ? removeSelectedRecursive(el.children) : [],
        }));
    };

    const cleaned = removeSelectedRecursive(elements);
    return {
      nextElements: [...cleaned, groupElement],
      groupId,
    };
  }

  return { nextElements, groupId: createdGroupId };
}

/**
 * Ungroups selected group elements, releasing their children back into the parent coordinate space.
 */
export function ungroupElements(
  selectedIds: string[],
  elements: EditorElement[],
): { nextElements: EditorElement[]; releasedIds: string[] } {
  if (!selectedIds || selectedIds.length === 0) {
    return { nextElements: elements, releasedIds: [] };
  }

  const selectedSet = new Set(selectedIds);
  const releasedIds: string[] = [];

  const processLevel = (list: EditorElement[]): EditorElement[] => {
    const result: EditorElement[] = [];

    for (const item of list) {
      if (selectedSet.has(item.id) && (item.type === "group" || (item.children && item.children.length > 0))) {
        // Unpack all children
        const parentX = item.x;
        const parentY = item.y;
        const parentId = item.parentId ?? null;

        for (const child of item.children) {
          const releasedChild: EditorElement = {
            ...child,
            x: Math.round(parentX + child.x),
            y: Math.round(parentY + child.y),
            parentId,
          };
          result.push(releasedChild);
          releasedIds.push(child.id);
        }
      } else {
        result.push({
          ...item,
          children: item.children ? processLevel(item.children) : [],
        });
      }
    }

    return result;
  };

  const nextElements = processLevel(elements);
  return { nextElements, releasedIds };
}
