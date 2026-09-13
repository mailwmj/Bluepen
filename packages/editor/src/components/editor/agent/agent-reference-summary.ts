import type { AgentReference } from './agent-types';

export function agentReferenceSummary(references: AgentReference[]) {
  const targets = references.filter(reference => reference.kind === 'canvas' && reference.role === 'target');
  const supporting = references.filter(reference => !(reference.kind === 'canvas' && reference.role === 'target'));
  const parts: string[] = [];

  if (targets.length === 1) parts.push(`修改：${targets[0].name}`);
  else if (targets.length > 1) parts.push(`修改：${targets.length} 个对象`);

  if (supporting.length === 1) parts.push(`参考：${supporting[0].name}`);
  else if (supporting.length > 1) parts.push(`参考：${supporting.length} 项`);

  return parts.join(' · ');
}
