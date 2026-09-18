import { z } from 'zod';
import type { AgentChangeSet, AgentNode, AgentReference } from './agent-types';
import { library } from '../library/index';
import { validatePrototypePlan, type PrototypePlanNode } from './prototype-plan';

const value = z.union([z.string(), z.number().finite(), z.boolean()]);
const component = z.enum(['group', ...library.map(item => item.type)] as [string, ...string[]]);
/**
 * Canvas nodes are read back from project files, block templates and earlier agent runs, so they are
 * not limited to the palette: `library` lists 129 of the 211 ComponentTypes the editor stores, and a
 * template such as `web-login-card` expands into children like `link` that the palette never had.
 * Rejecting those types made an already-saved receipt unreadable, which failed the whole history
 * load and left the AI feature permanently disabled. Model-authored nodes stay palette-checked
 * through `planNode` / `prototype-output.ts`; this schema only guards data the editor itself wrote.
 */
const canvasComponent = z.string().min(1);
export const referenceSchema: z.ZodType<AgentReference> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('canvas'), id: z.string(), role: z.enum(['target', 'reference']), projectId: z.string(), pageId: z.string(), pageName: z.string(), nodeId: z.string(), name: z.string() }),
  z.object({ kind: z.literal('catalog'), id: z.string(), role: z.literal('reference'), componentType: component, name: z.string() }),
  z.object({ kind: z.literal('image'), id: z.string(), role: z.literal('reference'), name: z.string(), dataUrl: z.string().max(3_000_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/) }),
]) as z.ZodType<AgentReference>;
export const nodeSchema: z.ZodType<AgentNode> = z.object({
  id: z.string(), type: canvasComponent, name: z.string(), parentId: z.string().nullable(), childIds: z.array(z.string()),
  x: z.number().finite(), y: z.number().finite(), width: z.number().positive(), height: z.number().positive(), rotation: z.number().finite(), opacity: z.number(), visible: z.boolean(), locked: z.boolean(), props: z.record(z.string(), value),
  autoLayout: z.object({ direction: z.enum(['vertical', 'horizontal']), gap: z.number(), paddingTop: z.number(), paddingRight: z.number(), paddingBottom: z.number(), paddingLeft: z.number(), horizontalAlign: z.enum(['left', 'center', 'right', 'stretch']), verticalAlign: z.enum(['top', 'center', 'bottom', 'stretch']), widthMode: z.enum(['hug', 'fill', 'fixed']), heightMode: z.enum(['hug', 'fill', 'fixed']) }).nullable(),
}) as z.ZodType<AgentNode>;
export const selectionSchema = z.object({ roots: z.array(z.string()), nodes: z.array(nodeSchema).max(600), writableIds: z.array(z.string()).max(600), referenceNodes: z.array(nodeSchema).max(600) });
const planNode = z.custom<PrototypePlanNode>(root => { try { return validatePrototypePlan({ root: root as PrototypePlanNode, artifactKind: 'component', pageName: 'node', purpose: '', notes: [] }).length === 0; } catch { return false; } });
export const changesSchema: z.ZodType<AgentChangeSet> = z.object({ summary: z.string(), operations: z.array(z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('update'), nodeId: z.string(), fields: z.array(z.object({ key: z.string(), value })) }),
  z.object({ kind: z.literal('delete'), nodeId: z.string() }),
  z.object({ kind: z.literal('insert'), parentId: z.string(), index: z.number().finite(), node: planNode }),
  z.object({ kind: z.literal('move'), nodeId: z.string(), parentId: z.string(), index: z.number().finite(), x: z.number().finite(), y: z.number().finite() }),
])).max(100) });
export const receiptSchema = z.object({ id: z.string(), pageId: z.string(), name: z.string(), targetIds: z.array(z.string()), nodes: z.array(z.object({ id: z.string(), before: nodeSchema.nullable(), after: nodeSchema.nullable() })), roots: z.object({ before: z.array(z.string()), after: z.array(z.string()) }).optional() });
