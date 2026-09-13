"use client";

import { Boxes, ChevronDown, Image as ImageIcon, Layers, X } from 'lucide-react';
import { Button } from '@bluepen/editor/components/ui/button';
import { Popover, PopoverPopup, PopoverTrigger } from '@bluepen/editor/components/ui/popover';
import type { AgentReference } from './agent-types';
import { agentReferenceSummary } from './agent-reference-summary';

export function AgentReferenceList({ references, onRemove, onRole, onLocate, isMissing }: {
  references: AgentReference[];
  onRemove?: (id: string) => void;
  onRole?: (id: string, role: 'target' | 'reference') => void;
  onLocate?: (ref: Extract<AgentReference, { kind: 'canvas' }>) => void;
  isMissing?: (ref: AgentReference) => boolean;
}) {
  if (!references.length) return null;
  const missing = references.filter(reference => isMissing?.(reference)).length;
  const summary = agentReferenceSummary(references);

  return <Popover>
    <PopoverTrigger render={<Button variant="outline" size="sm" className="max-w-full justify-start font-normal" />} aria-label={`查看目标与参考：${summary}`}>
      <span className="truncate">{summary}</span>
      {missing > 0 && <span className="shrink-0 font-mono text-[11px] text-destructive">{missing} 项失效</span>}
      <ChevronDown aria-hidden="true" className="ml-auto" />
    </PopoverTrigger>
    <PopoverPopup side="top" align="start" className="w-80 max-w-[calc(100vw-32px)]">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">目标与参考</p>
        <ul aria-label="目标与参考明细" className="max-h-64 overflow-y-auto">
          {references.map((reference, index) => {
            const deleted = isMissing?.(reference);
            const Icon = reference.kind === 'canvas' ? Layers : reference.kind === 'catalog' ? Boxes : ImageIcon;
            return <li key={reference.id} className={`flex min-h-10 items-center gap-2 py-2 ${index > 0 ? 'border-t border-border' : ''}`}>
              {reference.kind === 'image'
                ? <img src={reference.dataUrl} alt="" className="size-8 shrink-0 rounded object-cover" />
                : <Icon aria-hidden="true" className="shrink-0 text-muted-foreground" />}
              <div className="min-w-0 flex-1">
                <button type="button" disabled={reference.kind !== 'canvas' || !onLocate || deleted} className="block w-full truncate text-left text-xs enabled:hover:underline" title={reference.kind === 'canvas' ? `${reference.pageName} / ${reference.name}` : reference.name} onClick={() => { if (reference.kind === 'canvas') onLocate?.(reference); }}>{reference.name}</button>
                {deleted
                  ? <span className="font-mono text-[11px] text-destructive">对象已删除</span>
                  : reference.kind === 'canvas' && onRole
                    ? <button type="button" className="font-mono text-[11px] text-muted-foreground hover:text-foreground" aria-label={`${reference.name}：${reference.role === 'target' ? '修改对象，切换为参考' : '参考，切换为修改对象'}`} onClick={() => onRole(reference.id, reference.role === 'target' ? 'reference' : 'target')}>{reference.role === 'target' ? '修改' : '参考'}</button>
                    : <span className="font-mono text-[11px] text-muted-foreground">{reference.role === 'target' ? '修改' : '参考'}</span>}
              </div>
              {onRemove && <Button variant="ghost" size="icon-xs" aria-label={`移除：${reference.name}`} title={`移除 ${reference.name}`} onClick={() => onRemove(reference.id)}><X aria-hidden="true" /></Button>}
            </li>;
          })}
        </ul>
      </div>
    </PopoverPopup>
  </Popover>;
}
