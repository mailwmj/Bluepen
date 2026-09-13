"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowUp, Square, X } from 'lucide-react';
import { Button } from '@bluepen/editor/components/ui/button';
import { AgentComposer } from './agent-composer';
import type { AgentController } from './agent-controller';
import type { AgentContext, AgentReference } from './agent-types';

interface AgentQuickComposerProps {
  open: boolean;
  controller: AgentController;
  projectId: string;
  context: AgentContext;
  candidates: AgentReference[];
  selectedCount: number;
  onAddSelection: () => void;
  onClose: () => void;
  onSettings: () => void;
  onSubmitted: () => void;
  onLocate: (target: { pageId: string; elementId?: string }) => void;
}

export function AgentQuickComposer({ open, controller, projectId, context, candidates, selectedCount, onAddSelection, onClose, onSettings, onSubmitted, onLocate }: AgentQuickComposerProps) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const session = controller.current(projectId);
  const composer = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const errorId = useId();

  useEffect(() => {
    if (open && state.loaded && !state.historyError && !session) controller.newSession(projectId);
  }, [controller, open, projectId, session, state.historyError, state.loaded]);
  useEffect(() => {
    if (!open || !session) return;
    const frame = requestAnimationFrame(() => composer.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, session?.id]);
  useEffect(() => { setError(''); }, [open, session?.id]);

  if (!open) return null;
  const hasTarget = session?.references?.some(reference => reference.kind === 'canvas' && reference.role === 'target') ?? false;
  const currentBusy = state.activeRun?.sessionId === session?.id;
  const waiting = session?.messages.at(-1)?.status === 'waiting-input';
  const send = () => {
    if (!session || uploading || state.activeRun || waiting || !session.draft.trim()) return;
    setError('');
    const messageCount = session.messages.length;
    const request = controller.send(session.id, session.draft, context);
    if ((controller.session(session.id)?.messages.length ?? messageCount) > messageCount) onSubmitted();
    void request.catch(error => setError(error instanceof Error ? error.message : '发送失败'));
  };

  return <section aria-label={hasTarget ? 'AI 修改' : 'AI 创建'} className="absolute bottom-20 left-1/2 z-30 w-[min(480px,calc(100%-32px))] -translate-x-1/2 rounded-lg border border-border-visible bg-surface p-3 text-foreground [&_svg]:stroke-[1.5]" onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); onClose(); }
  }}>
    <div className="mb-2 flex h-7 items-center justify-between gap-2">
      <span className="truncate font-mono text-[11px] uppercase text-muted-foreground">{hasTarget ? 'AI 修改' : 'AI 创建'}</span>
      <Button variant="ghost" size="icon-sm" aria-label="关闭 AI 输入" title="关闭" onClick={onClose}><X aria-hidden="true" /></Button>
    </div>
    {!state.loaded ? <p role="status" className="py-3 font-mono text-xs text-muted-foreground">[正在准备…]</p>
      : state.historyError ? <div className="flex items-center justify-between gap-3 py-2"><p role="alert" className="text-xs text-destructive">任务记录读取失败</p><Button variant="outline" size="xs" onClick={() => void controller.retryLoad()}>重试</Button></div>
        : session ? <>
          <AgentComposer sessionId={session.id} draft={session.draft} references={session.references ?? []} candidates={candidates} disabled={session.archived} busy={!!state.activeRun} composerRef={composer} selectedCount={selectedCount} onSelection={onAddSelection} onDraft={draft => controller.updateSession(session.id, { draft })} onReferences={references => controller.updateSession(session.id, { references })} onSend={send} onError={setError} onUploadState={setUploading} errorId={error ? errorId : undefined} onLocate={reference => {
            try { onLocate({ pageId: reference.pageId, elementId: reference.nodeId }); setError(''); }
            catch (error) { setError(error instanceof Error ? error.message : '无法定位对象'); }
          }} isMissing={reference => reference.kind === 'canvas' && !candidates.some(candidate => candidate.id === reference.id)} actions={
            !state.settings.apiKey ? <Button variant="outline" size="xs" onClick={onSettings}>连接模型</Button>
              : currentBusy ? <Button variant="outline" size="icon-sm" aria-label="停止任务" title="停止" onClick={() => controller.stop()}><Square aria-hidden="true" /></Button>
                : state.activeRun || waiting ? <Button variant="outline" size="xs" onClick={onSubmitted}>查看任务</Button>
                  : <Button size="icon-sm" className="rounded-full" aria-label="发送" title="发送" disabled={!session.draft.trim() || uploading || session.archived} onClick={send}><ArrowUp aria-hidden="true" /></Button>
          } />
          {state.settingsError && <p className="mt-2 text-xs text-destructive">{state.settingsError}</p>}
          {error && <p id={errorId} role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
          {state.saveError && <div className="mt-2 flex items-center gap-2 text-xs text-destructive"><span title={state.saveError}>保存失败</span><Button variant="ghost" size="xs" onClick={() => void controller.flush()}>重试</Button></div>}
        </> : <p role="status" className="py-3 font-mono text-xs text-muted-foreground">[正在准备任务…]</p>}
  </section>;
}
