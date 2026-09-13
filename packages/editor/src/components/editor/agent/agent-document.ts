import type { EditorElement, Page } from '../types';
import { library } from '../library/index';
import { planToElement, validatePrototypePlan, type PrototypePlanNode } from './prototype-plan';
import type { AgentChangeSet, AgentContext, AgentNode, AgentReceipt, AgentReference, AgentResultState, AgentSelectionSnapshot } from './agent-types';

const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const geometry = new Set(['x', 'y', 'width', 'height', 'rotation']);
export const MAX_AGENT_NODES = 600;
export const MAX_AGENT_REFERENCES = 24;
export function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const ak = Object.keys(a), bk = Object.keys(b);
  return ak.length === bk.length && ak.every(k => Object.hasOwn(b, k) && same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}
export function indexAgentNodes(elements: EditorElement[]) {
  const nodes = new Map<string, AgentNode>();
  const walk = (items: EditorElement[], parentId: string | null, depth: number) => {
    if (depth > 100) throw new Error('图层嵌套过深');
    for (const { children, ...element } of items) {
      if (nodes.has(element.id)) throw new Error('图层标识重复，请重新打开项目');
      nodes.set(element.id, { ...element, parentId, childIds: children.map(child => child.id) });
      walk(children, element.id, depth + 1);
    }
  };
  walk(elements, null, 0);
  return nodes;
}
export function agentElements(nodes: Map<string, AgentNode>, roots: string[]): EditorElement[] {
  const seen = new Set<string>();
  const walk = (id: string, parentId: string | null): EditorElement => {
    const node = nodes.get(id);
    if (!node || seen.has(id)) throw new Error('修改产生了无效的图层结构');
    seen.add(id);
    const { childIds, ...element } = node;
    return { ...element, parentId, children: childIds.map(child => walk(child, id)) };
  };
  const result = roots.map(id => walk(id, null));
  if (seen.size !== nodes.size) throw new Error('修改产生了游离图层');
  return result;
}
function subtree(id: string, nodes: Map<string, AgentNode>): string[] {
  const node = nodes.get(id);
  return node ? [id, ...node.childIds.flatMap(child => subtree(child, nodes))] : [];
}
function ancestors(id: string, nodes: Map<string, AgentNode>): AgentNode[] {
  const result: AgentNode[] = [];
  let node = nodes.get(id);
  const seen = new Set<string>();
  while (node?.parentId && !seen.has(node.parentId)) {
    seen.add(node.parentId);
    node = nodes.get(node.parentId);
    if (node) result.push(node);
  }
  return result;
}
export function canvasReferences(projectId: string, page: Page, ids: string[], role: 'target' | 'reference' = 'target'): AgentReference[] {
  const nodes = indexAgentNodes(page.elements), selected = new Set(ids);
  return ids.filter(id => nodes.has(id) && !ancestors(id, nodes).some(parent => selected.has(parent.id))).map(nodeId => ({
    kind: 'canvas', role, id: `canvas:${page.id}:${nodeId}`, projectId, pageId: page.id, pageName: page.name, nodeId, name: nodes.get(nodeId)!.name,
  }));
}
export function mergeAgentReferences(existing: AgentReference[], incoming: AgentReference[]): AgentReference[] {
  const result = new Map(existing.map(ref => [ref.id, ref]));
  incoming.forEach(ref => result.set(ref.id, ref));
  if (result.size > MAX_AGENT_REFERENCES) throw new Error(`每条消息最多添加 ${MAX_AGENT_REFERENCES} 个引用，请分批处理`);
  return [...result.values()];
}
export function retargetAgentReferences(existing: AgentReference[], targets: AgentReference[]): AgentReference[] {
  const targetIds = new Set(targets.map(reference => reference.id));
  const supporting = existing.filter(reference =>
    !(reference.kind === 'canvas' && reference.role === 'target') && !targetIds.has(reference.id));
  return mergeAgentReferences(targets, supporting);
}
export function captureAgentContext(context: AgentContext, pages: Page[]): AgentContext {
  const page = pages.find(item => item.id === context.pageId);
  if (!page) throw new Error('目标页面已删除，请重新选择');
  const nodes = indexAgentNodes(page.elements), refs = context.references ?? [];
  const writable = new Set<string>(), included = new Set<string>(), referenceNodes = new Map<string, AgentNode>();
  const references = refs.map(ref => {
    if (ref.kind !== 'canvas') return ref;
    if (ref.projectId !== context.projectId) throw new Error('引用属于其他项目，请移除后重新选择');
    const sourcePage = pages.find(p => p.id === ref.pageId);
    const source = sourcePage ? indexAgentNodes(sourcePage.elements) : new Map<string, AgentNode>();
    const node = source.get(ref.nodeId);
    if (!node) throw new Error(`「${ref.name}」已删除，请移除此引用`);
    if (ref.role === 'target') {
      if (ref.pageId !== page.id) throw new Error(`请切换到「${sourcePage!.name}」后修改，或将此对象设为参考`);
      if (node.locked || ancestors(node.id, nodes).some(parent => parent.locked)) throw new Error(`「${node.name}」已锁定，请先解锁或设为参考`);
      for (const id of subtree(node.id, nodes)) { included.add(id); if (!nodes.get(id)!.locked && !ancestors(id, nodes).some(parent => parent.locked)) writable.add(id); }
      ancestors(node.id, nodes).forEach(parent => included.add(parent.id));
    } else for (const id of subtree(node.id, source)) referenceNodes.set(id, source.get(id)!);
    return { ...ref, name: node.name, pageName: sourcePage!.name };
  });
  if (included.size + referenceNodes.size > MAX_AGENT_NODES) throw new Error('选区超过 600 个图层，请缩小修改范围');
  const snapshot: AgentSelectionSnapshot = { roots: page.elements.map(el => el.id), nodes: [...included].map(id => nodes.get(id)!), writableIds: [...writable], referenceNodes: [...referenceNodes.values()] };
  if (JSON.stringify(snapshot).length > 180_000) throw new Error('引用内容过大，请移除大型图片图层，改用图片附件或缩小选区');
  return { ...context, pageName: page.name, references, snapshot };
}

/** Deltas are field-wise: later edits to unrelated properties survive an Agent undo. */
function fields(node: AgentNode) {
  const { props, autoLayout, ...rest } = node;
  return { ...rest, ...Object.fromEntries(Object.entries(props).map(([key, value]) => [`props.${key}`, value])),
    ...(autoLayout ? Object.fromEntries(Object.entries(autoLayout).map(([key, value]) => [`autoLayout.${key}`, value])) : { autoLayout: null }) } as Record<string, unknown>;
}
function changedKeys(before: AgentNode, after: AgentNode) {
  const a = fields(before), b = fields(after);
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(key => !same(a[key], b[key]));
}
function setField(node: AgentNode, key: string, value: unknown) {
  const parts = key.split('.');
  if (parts.some(part => forbidden.has(part))) throw new Error('无效属性');
  if (parts.length === 2 && (parts[0] === 'props' || parts[0] === 'autoLayout')) {
    const target = node as unknown as Record<string, Record<string, unknown>>;
    target[parts[0]] = { ...(target[parts[0]] ?? {}) };
    if (value === undefined) delete target[parts[0]][parts[1]];
    else target[parts[0]][parts[1]] = value;
  } else if (parts.length === 1) (node as unknown as Record<string, unknown>)[key] = value;
  else throw new Error('无效属性路径');
}
function assertUnlocked(id: string, nodes: Map<string, AgentNode>) {
  if (nodes.get(id)?.locked || ancestors(id, nodes).some(node => node.locked)) throw new Error('目标或父组合已锁定，请解锁后重试');
}
function validField(node: AgentNode, key: string, value: unknown) {
  if (key.split('.').some(part => forbidden.has(part))) return false;
  if (geometry.has(key)) return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1_000_000 && (!['width', 'height'].includes(key) || value > 0);
  if (key === 'opacity') return typeof value === 'number' && value >= 0 && value <= 1;
  if (key === 'name') return typeof value === 'string' && !!value.trim() && value.length <= 200;
  if (key === 'visible') return typeof value === 'boolean';
  if (key.startsWith('props.')) {
    const prop = key.slice(6), defaults = library.find(item => item.type === node.type)?.defaultProps ?? {};
    const expected = Object.hasOwn(node.props, prop) ? node.props[prop] : defaults[prop];
    return !['startElementId', 'endElementId', 'src', 'html', 'code', 'url'].includes(prop) && expected !== undefined && typeof expected === typeof value && (typeof value !== 'number' || Number.isFinite(value)) && (typeof value !== 'string' || value.length <= 20_000);
  }

  return false;
}
export function createAgentReceipt(before: EditorElement[], after: EditorElement[], pageId: string, id: string, name: string, targetIds: string[]): AgentReceipt {
  const a = indexAgentNodes(before), b = indexAgentNodes(after);
  const rootsBefore = before.map(node => node.id), rootsAfter = after.map(node => node.id);
  return structuredClone({ id, pageId, name, targetIds, nodes: [...new Set([...a.keys(), ...b.keys()])].filter(id => !same(a.get(id), b.get(id))).map(id => ({ id, before: a.get(id) ?? null, after: b.get(id) ?? null })),
    ...(!same(rootsBefore, rootsAfter) ? { roots: { before: rootsBefore, after: rootsAfter } } : {}) });
}
export function prepareAgentChanges(changes: AgentChangeSet, context: AgentContext, elements: EditorElement[], id: string) {
  const snapshot = context.snapshot;
  if (!snapshot?.writableIds.length) throw new Error('请先把要修改的组件添加为修改对象');
  if (!changes.operations.length || changes.operations.length > 100) throw new Error('修改数量无效，请分批处理');
  const baseline = new Map(snapshot.nodes.map(node => [node.id, node]));
  const current = indexAgentNodes(elements), nodes = indexAgentNodes(structuredClone(elements));
  const writable = new Set(snapshot.writableIds), touched = new Set<string>();
  let roots = elements.map(node => node.id);
  const requireNode = (nodeId: string, structural = false) => {
    const base = baseline.get(nodeId), live = current.get(nodeId), node = nodes.get(nodeId);
    if (!writable.has(nodeId) || !base) throw new Error('修改超出选定对象，请把需要修改的父组合或组件加入修改范围');
    if (!live || !node) throw new Error('目标已删除或被重复操作，请重新生成修改');
    assertUnlocked(nodeId, current);
    for (const ancestor of [base, ...ancestors(nodeId, baseline)]) {
      const now = current.get(ancestor.id);
      if (!now || ['parentId', 'type', 'x', 'y', 'width', 'height', 'rotation', 'autoLayout'].some(key => !same((ancestor as unknown as Record<string, unknown>)[key], (now as unknown as Record<string, unknown>)[key]))) throw new Error('对象位置、尺寸或父组合已变化，请重新生成修改');
    }
    if (structural && !same(base, live)) throw new Error('对象结构已变化，请重新生成修改');
    touched.add(nodeId);
    return { base, live, node };
  };
  const parentList = (node: AgentNode) => node.parentId ? nodes.get(node.parentId)!.childIds : roots;
  const protectLayout = (node: AgentNode) => {
    if (ancestors(node.id, current).some(parent => parent.autoLayout && !writable.has(parent.id))) throw new Error('此对象位于自动布局中，请添加父组合后调整布局');
  };
  for (const [index, operation] of changes.operations.entries()) {
    if (operation.kind === 'update') {
      const { base, live, node } = requireNode(operation.nodeId);
      if (!operation.fields.length || new Set(operation.fields.map(field => field.key)).size !== operation.fields.length) throw new Error('修改字段为空或重复');
      for (const { key, value } of operation.fields) {
        if (!validField(node, key, value)) throw new Error(`「${node.name}」的属性 ${key} 无效`);
        if (!same(fields(base)[key], fields(live)[key])) throw new Error(`「${node.name}」已被手工修改，请重新生成修改`);
        if (geometry.has(key)) {
          protectLayout(node);
          if (subtree(node.id, current).some(id => current.get(id)?.locked)) throw new Error('组合内有锁定图层，请先解锁后调整位置或尺寸');
        }
        setField(node, key, value);
      }
    } else if (operation.kind === 'delete') {
      const { node } = requireNode(operation.nodeId, true);
      protectLayout(node);
      for (const childId of subtree(node.id, nodes)) {
        requireNode(childId, true);
        if ([...nodes.values()].some(other => !subtree(node.id, nodes).includes(other.id) && (other.props.startElementId === childId || other.props.endElementId === childId))) throw new Error('该对象仍被连接线引用，请先处理连接线');
      }
      const list = parentList(node); list.splice(list.indexOf(node.id), 1);
      for (const childId of subtree(node.id, nodes)) nodes.delete(childId);
    } else if (operation.kind === 'insert') {
      const { node: parent } = requireNode(operation.parentId, true);
      if (parent.type !== 'group') throw new Error('只能在组合内新增，请先选择父组合');
      protectLayout(parent);
      const plan = { artifactKind: 'component' as const, pageName: operation.node.name, purpose: '', notes: [], root: operation.node };
      if (validatePrototypePlan(plan).length) throw new Error('新增组件结构无效');
      const element = planToElement(plan, 0, 0);
      let serial = 0;
      const assign = (node: EditorElement, parentId: string) => {
        node.id = `agent-${id}-${index}-${serial++}`; node.parentId = parentId;
        node.children.forEach(child => assign(child, node.id));
      };
      assign(element, parent.id);
      for (const [nodeId, node] of indexAgentNodes([element])) {
        if (nodes.has(nodeId)) throw new Error('此修改已应用');
        nodes.set(nodeId, nodeId === element.id ? { ...node, parentId: parent.id } : node);
      }
      parent.childIds.splice(Math.max(0, Math.min(parent.childIds.length, Math.round(operation.index))), 0, element.id);
      touched.add(element.id);
    } else if (operation.kind === 'move') {
      const { node } = requireNode(operation.nodeId, true), { node: parent } = requireNode(operation.parentId, true);
      protectLayout(node); protectLayout(parent);
      if (parent.type !== 'group' || subtree(node.id, nodes).includes(parent.id)) throw new Error('无法移动到此组合');
      if (![operation.x, operation.y].every(value => Number.isFinite(value) && Math.abs(value) <= 1_000_000)) throw new Error('移动坐标无效');
      const list = parentList(node); list.splice(list.indexOf(node.id), 1);
      parent.childIds.splice(Math.max(0, Math.min(parent.childIds.length, Math.round(operation.index))), 0, node.id);
      node.parentId = parent.id; node.x = operation.x; node.y = operation.y;
    } else throw new Error('未知修改操作');
  }
  if (nodes.size - current.size > MAX_AGENT_NODES) throw new Error('新增图层过多，请分批生成');
  const next = agentElements(nodes, roots);
  const receipt = createAgentReceipt(elements, next, context.pageId, id, changes.summary, [...touched].filter(id => nodes.has(id)));
  if (!receipt.nodes.length) throw new Error('方案没有改变任何属性，可补充具体修改要求');
  return { elements: next, receipt };
}
function matchesReceipt(receipt: AgentReceipt, elements: EditorElement[], side: 'before' | 'after') {
  const nodes = indexAgentNodes(elements);
  return (!receipt.roots || same(elements.map(node => node.id), receipt.roots[side])) && receipt.nodes.every(delta => {
    const expected = delta[side], now = nodes.get(delta.id);
    if (!delta.before || !delta.after) return same(expected ?? undefined, now);
    return !!now && changedKeys(delta.before, delta.after).every(key => same(fields(now)[key], fields(expected!)[key]));
  });
}
export function agentReceiptState(receipt: AgentReceipt, elements?: EditorElement[]): AgentResultState {
  if (!elements) return 'unavailable';
  if (matchesReceipt(receipt, elements, 'after')) return 'applied';
  if (matchesReceipt(receipt, elements, 'before')) return 'reverted';
  const nodes = indexAgentNodes(elements);
  return receipt.targetIds.length && receipt.targetIds.every(id => !nodes.has(id)) ? 'missing' : 'changed';
}
export function undoAgentReceipt(receipt: AgentReceipt, elements: EditorElement[]) {
  if (!matchesReceipt(receipt, elements, 'after')) throw new Error('这些属性或图层结构已有后续修改，无法安全撤销；请使用编辑器历史逐步撤销');
  const nodes = indexAgentNodes(structuredClone(elements));
  for (const delta of receipt.nodes) {
    if (nodes.has(delta.id)) assertUnlocked(delta.id, nodes);
    if (!delta.before) nodes.delete(delta.id);
    else if (!delta.after) nodes.set(delta.id, structuredClone(delta.before));
    else {
      const node = nodes.get(delta.id)!;
      for (const key of changedKeys(delta.before, delta.after)) setField(node, key, fields(delta.before)[key]);
    }
  }
  return agentElements(nodes, receipt.roots?.before ?? elements.map(node => node.id));
}

/** Used by thumbnails and before/after previews; the regular canvas renderer draws the nodes. */
export function agentPreviewElements(context: AgentContext): EditorElement[] {
  const nodes = new Map(context.snapshot?.nodes.map(node => [node.id, node]) ?? []);
  const targets = [...new Set((context.references ?? []).flatMap(ref => ref.kind === 'canvas' && ref.role === 'target' ? [ref.nodeId] : []))];
  const selected = new Set(targets);
  const roots = targets.filter(id => !ancestors(id, nodes).some(node => selected.has(node.id)));
  const walk = (id: string): EditorElement => {
    const { childIds, ...node } = nodes.get(id)!;
    return { ...node, children: childIds.filter(id => nodes.has(id)).map(walk) };
  };
  return roots.filter(id => nodes.has(id)).map(id => { const node = walk(id); const parents = ancestors(id, nodes); return { ...node, parentId: null, x: node.x + parents.reduce((sum, parent) => sum + parent.x, 0), y: node.y + parents.reduce((sum, parent) => sum + parent.y, 0) }; });
}

export function projectAgentElements(elements: EditorElement[], ids: string[]): EditorElement[] {
  const nodes = indexAgentNodes(elements);
  return agentPreviewElements({ projectId: '', pageId: '', pageName: '', references: ids.filter(id => nodes.has(id)).map(nodeId => ({ kind: 'canvas', id: nodeId, nodeId, name: '', pageId: '', pageName: '', projectId: '', role: 'target' })), snapshot: { roots: elements.map(node => node.id), nodes: [...nodes.values()], writableIds: ids, referenceNodes: [] } });
}
