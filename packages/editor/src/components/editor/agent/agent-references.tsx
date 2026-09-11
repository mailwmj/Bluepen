"use client";

import { Boxes, Layers, X } from 'lucide-react';
import { Button } from '@bluepen/editor/components/ui/button';
import type { AgentReference } from './agent-types';

export function AgentReferenceList({ references, onRemove, onRole, onLocate, isMissing }: {
  references: AgentReference[];
  onRemove?: (id: string) => void;
  onRole?: (id: string, role: 'target' | 'reference') => void;
  onLocate?: (ref: Extract<AgentReference, { kind: 'canvas' }>) => void;
  isMissing?: (ref: AgentReference) => boolean;
}) {
  if (!references.length) return null;
  return <ul aria-label="会话引用" className="flex flex-wrap gap-2">
    {references.map(ref => <li key={ref.id} className="flex max-w-full items-center gap-1 rounded-lg border border-border-visible bg-background px-2 py-1.5 text-xs">
      {ref.kind === 'image' ? <img src={ref.dataUrl} alt={ref.name} className="mr-1 size-8 rounded object-cover" /> : ref.kind === 'canvas' ? <Layers className="mr-1 size-3.5 shrink-0 text-muted-foreground" /> : <Boxes className="mr-1 size-3.5 shrink-0 text-muted-foreground" />}
      <div className="min-w-0"><button type="button" disabled={ref.kind !== 'canvas' || !onLocate || isMissing?.(ref)} className="block max-w-40 truncate text-left enabled:hover:underline" title={ref.kind === 'canvas' ? `${ref.pageName} / ${ref.name}` : ref.name} onClick={() => { if (ref.kind === 'canvas') onLocate?.(ref); }}>{ref.name}</button>
        {isMissing?.(ref) ? <span className="font-mono text-[11px] text-destructive">对象已删除</span> : onRole && ref.kind === 'canvas' ? <button type="button" className="font-mono text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2" title="点击切换修改对象或仅作参考" aria-label={`${ref.name}：${ref.role === 'target' ? '修改对象，切换为参考' : '参考，切换为修改对象'}`} onClick={() => onRole(ref.id, ref.role === 'target' ? 'reference' : 'target')}>{ref.role === 'target' ? '修改对象' : '仅作参考'}</button> : <span className="font-mono text-[11px] text-muted-foreground">{ref.role === 'target' ? '修改对象' : ref.kind === 'catalog' ? '组件库参考' : '仅作参考'}</span>}
      </div>
      {onRemove && <Button variant="ghost" size="icon-xs" aria-label={`移除引用：${ref.name}`} onClick={() => onRemove(ref.id)}><X /></Button>}
    </li>)}
  </ul>;
}
