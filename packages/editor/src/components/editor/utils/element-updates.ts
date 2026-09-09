import type { EditorElement } from "../types";

export function patchElements(elements: EditorElement[], patches: Array<{ id: string; patch: Partial<EditorElement> }>): EditorElement[] {
  const byId = new Map(patches.map(({ id, patch }) => [id, patch]));
  const visit = (nodes: EditorElement[]): EditorElement[] => {
    let changed = false;
    const next = nodes.map((node) => {
      const patch = byId.get(node.id);
      const differs = patch && (Object.keys(patch) as (keyof EditorElement)[]).some((key) => node[key] !== patch[key]);
      let result = differs ? { ...node, ...patch } : node;
      const children = visit(result.children);
      if (children !== result.children) result = { ...result, children };
      if (result !== node) changed = true;
      return result;
    });
    return changed ? next : nodes;
  };
  return visit(elements);
}
