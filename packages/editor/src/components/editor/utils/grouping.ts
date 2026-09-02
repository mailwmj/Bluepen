import type { EditorElement } from "../types";
import { isBlockTemplate, createBlockTemplateGroup } from "../library/block-templates";

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
    (el) =>
      selectedIds.includes(el.id) &&
      (el.type === "group" || (el.children && el.children.length > 0) || isBlockTemplate(el.type)),
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

function computeWorldBounds(
  element: EditorElement,
  allElementsFlat: EditorElement[],
): { x: number; y: number; width: number; height: number } {
  let curX = element.x;
  let curY = element.y;
  let parentId = element.parentId;

  if (parentId) {
    const visited = new Set<string>([element.id]);
    while (parentId) {
      if (visited.has(parentId)) break;
      visited.add(parentId);
      const parent = allElementsFlat.find((p) => p.id === parentId);
      if (!parent) break;
      curX += parent.x;
      curY += parent.y;
      parentId = parent.parentId;
    }
  }

  return {
    x: curX,
    y: curY,
    width: element.width,
    height: element.height,
  };
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

  const flat = flattenElements(elements);
  const elementMap = new Map(flat.map((el) => [el.id, el]));

  // 1. Deduplicate: If an element's ancestor is also in selectedIds, filter out the descendant
  const idSet = new Set(selectedIds);
  const topLevelSelectedIds = selectedIds.filter((id) => {
    let curr = elementMap.get(id);
    if (!curr) return false;
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

  if (topLevelSelectedIds.length < 1) {
    return { nextElements: elements, groupId: null };
  }

  const topLevelSelectedSet = new Set(topLevelSelectedIds);
  const selectedTargets = topLevelSelectedIds.map((id) => elementMap.get(id)!).filter(Boolean);

  // Check if all selected elements share the exact same parent
  const firstParentId = selectedTargets[0]?.parentId ?? null;
  const allSameParent = selectedTargets.every((el) => (el.parentId ?? null) === firstParentId);

  let createdGroupId: string | null = null;

  if (allSameParent) {
    // Standard grouping within the same parent level
    const processLevel = (list: EditorElement[]): EditorElement[] => {
      const selectedAtLevel = list.filter((el) => topLevelSelectedSet.has(el.id));

      if (selectedAtLevel.length >= 1 && selectedAtLevel.length === topLevelSelectedIds.length) {
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

        let inserted = false;
        const result: EditorElement[] = [];

        for (const item of list) {
          if (topLevelSelectedSet.has(item.id)) {
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
    if (createdGroupId) {
      return { nextElements, groupId: createdGroupId };
    }
  }

  // Cross-hierarchy / Fallback grouping: Resolve world coordinates accurately
  const worldBoundsList = selectedTargets.map((el) => computeWorldBounds(el, flat));
  const minX = Math.min(...worldBoundsList.map((b) => b.x));
  const minY = Math.min(...worldBoundsList.map((b) => b.y));
  const maxX = Math.max(...worldBoundsList.map((b) => b.x + b.width));
  const maxY = Math.max(...worldBoundsList.map((b) => b.y + b.height));

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
    children: selectedTargets.map((child, idx) => {
      const wb = worldBoundsList[idx]!;
      return {
        ...child,
        x: wb.x - minX,
        y: wb.y - minY,
        parentId: groupId,
      };
    }),
  };

  const removeSelectedRecursive = (list: EditorElement[]): EditorElement[] => {
    return list
      .filter((el) => !topLevelSelectedSet.has(el.id))
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
      if (selectedSet.has(item.id)) {
        if (item.type === "group" || (item.children && item.children.length > 0)) {
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
        } else if (isBlockTemplate(item.type)) {
          // Dynamically instantiate block template and release its children
          const parentX = item.x;
          const parentY = item.y;
          const parentId = item.parentId ?? null;
          const templateGroup = createBlockTemplateGroup(item.type, parentX, parentY, parentId);
          if (templateGroup && templateGroup.children && templateGroup.children.length > 0) {
            for (const child of templateGroup.children) {
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
            result.push(item);
          }
        } else {
          result.push(item);
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
