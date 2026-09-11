import { z } from 'zod';
import { library } from '../library/index';
import type { ComponentType } from '../types';
import type { AgentChangeSet } from './agent-types';
import { artifactKinds, normalizeArtifactBackground, validatePrototypePlan, type PrototypePlan, type PrototypePlanNode } from './prototype-plan';

// Strict Responses schemas cannot use arbitrary object keys. The wire format
// represents component props as entries, then validates them against the catalog.
interface OutputNode {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: { key: string; value: string | number | boolean }[];
  children: OutputNode[];
}
const componentTypes = [...new Set(['group', ...library.map(item => item.type)])];
const nodeSchema: z.ZodType<OutputNode> = z.lazy(() => z.object({
  type: z.enum(componentTypes as [string, ...string[]]),
  name: z.string(),
  x: z.number(), y: z.number(), width: z.number(), height: z.number(),
  props: z.array(z.object({ key: z.string(), value: z.union([z.string(), z.number(), z.boolean()]) })),
  children: z.array(nodeSchema),
}));
export const agentOutputSchema = z.object({
  reply: z.string(),
  questions: z.array(z.object({
    id: z.string(), title: z.string(), options: z.array(z.string()), multiple: z.boolean(), required: z.boolean(),
  })),
  plan: z.object({ artifactKind: z.enum(artifactKinds), pageName: z.string(), purpose: z.string(), notes: z.array(z.string()), root: nodeSchema }).nullable(),
  changes: z.object({ summary: z.string(), operations: z.array(z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('update'), nodeId: z.string(), fields: z.array(z.object({ key: z.string(), value: z.union([z.string(), z.number(), z.boolean()]) })) }),
    z.object({ kind: z.literal('delete'), nodeId: z.string() }),
    z.object({ kind: z.literal('insert'), parentId: z.string(), index: z.number(), node: nodeSchema }),
    z.object({ kind: z.literal('move'), nodeId: z.string(), parentId: z.string(), index: z.number(), x: z.number(), y: z.number() }),
  ])) }).nullable(),
});

/** JSON-mode providers may spell node props as a map. Normalize only that
 * equivalent representation; every value still passes the full wire schema
 * and catalog/permission validation before it can reach the canvas. */
export function parseCompatibleAgentOutput(text: string): z.infer<typeof agentOutputSchema> {
  const value = JSON.parse(text);
  let count = 0;
  const visit = (node: unknown, depth = 0) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    if (++count > 600 || depth > 20) throw new Error('原型结构过大，请分区域生成');
    const record = node as Record<string, unknown>;
    if (record.props && typeof record.props === 'object' && !Array.isArray(record.props)) {
      record.props = Object.entries(record.props).map(([key, value]) => ({ key, value }));
    }
    if (Array.isArray(record.children)) record.children.forEach(child => visit(child, depth + 1));
  };
  visit(value?.plan?.root);
  if (Array.isArray(value?.changes?.operations)) {
    for (const operation of value.changes.operations) if (operation?.kind === 'insert') visit(operation.node);
  }
  return agentOutputSchema.parse(value);
}
export function decodeNode(output: OutputNode): PrototypePlanNode {
  let count = 0;
  const convert = (node: OutputNode, depth = 0): PrototypePlanNode => {
    if (++count > 600 || depth > 20) throw new Error('原型结构过大，请分区域生成');
    const defaults = library.find(item => item.type === node.type)?.defaultProps ?? {};
    const props: Record<string, string | number | boolean> = { ...defaults };
    for (const { key, value } of node.props) {
      if (!Object.hasOwn(defaults, key) || typeof value !== typeof defaults[key]) {
        throw new Error(`组件 ${node.type} 的属性 ${key} 无效，请重新生成方案`);
      }
      props[key] = value;
    }
    return { ...node, type: node.type as ComponentType, props, children: node.children.map(child => convert(child, depth + 1)) };
  };
  return convert(output);
}
export function decodeChanges(output: NonNullable<z.infer<typeof agentOutputSchema>['changes']>): AgentChangeSet {
  if (!output.summary.trim() || !output.operations.length || output.operations.length > 100) throw new Error('修改方案无效，请分批处理');
  return { ...output, operations: output.operations.map(op => op.kind === 'insert' ? { ...op, node: decodeNode(op.node) } : op) };
}
export function decodePlan(output: NonNullable<z.infer<typeof agentOutputSchema>['plan']>): PrototypePlan {
  const plan = normalizeArtifactBackground({ ...output, root: decodeNode(output.root) });
  const errors = validatePrototypePlan(plan);
  if (errors.length) throw new Error(`原型计划无效：${errors[0]}`);
  if (plan.root.type !== 'group') throw new Error('原型页面必须包含根组合');
  return plan;
}
