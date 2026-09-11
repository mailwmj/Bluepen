import type { EditorElement } from '../types';
import type { AgentContext } from './agent-types';
import { planToElement, validatePrototypePlan, type PrototypePlan } from './prototype-plan';

/** A stable result ID makes repeated approval/recovery idempotent on the canvas too. */
export function prepareAgentArtifact(plan: PrototypePlan, target: AgentContext, current: { projectId: string; pageId: string; elements: EditorElement[] }, messageId: string) {
  if (target.projectId !== current.projectId) throw new Error('此方案属于其他项目，请回到原项目后生成');
  if (target.pageId !== current.pageId) throw new Error(`请先切换到目标页面「${target.pageName}」再生成`);
  const id = `agent-${messageId}`;
  const find = (nodes: EditorElement[]): EditorElement | undefined => { for (const node of nodes) { if (node.id === id) return node; const child = find(node.children); if (child) return child; } };
  const existing = find(current.elements);
  if (existing) return { element: existing, elements: current.elements };
  const errors = validatePrototypePlan(plan);
  if (errors.length) throw new Error(`原型方案无效：${errors[0]}`);
  const anchor = target.anchor ?? { x: 80, y: 80 };
  const element = planToElement(plan, anchor.x, anchor.y);
  element.id = id;
  element.children = element.children.map(child => ({ ...child, parentId: id }));
  // Place the new artifact after overlapping roots, rather than repeatedly adding 40px.
  while (current.elements.some(other => other.x < element.x + element.width && other.x + other.width > element.x && other.y < element.y + element.height && other.y + other.height > element.y)) {
    element.x = Math.max(...current.elements.filter(other => other.x < element.x + element.width && other.x + other.width > element.x && other.y < element.y + element.height && other.y + other.height > element.y).map(other => other.x + other.width)) + 32;
  }
  return { element, elements: [...current.elements, element] };
}
