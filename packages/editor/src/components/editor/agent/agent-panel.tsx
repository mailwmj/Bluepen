"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Archive, ArrowDown, ArrowLeft, ArrowUp, ChevronDown, History, MessageSquare, Plus, Search, Settings2, Square, Trash2, X } from 'lucide-react';
import { Button } from '@bluepen/editor/components/ui/button';
import { Popover, PopoverTrigger, PopoverPopup } from '@bluepen/editor/components/ui/popover';
import { Input } from '@bluepen/editor/components/ui/input';
import { cn } from '@bluepen/editor/lib/utils';
import { AgentMessageView } from './agent-message';
import type { AgentController } from './agent-controller';
import type { AgentContext, AppliedArtifact, AgentReference } from './agent-types';
import type { PrototypePlan } from './prototype-plan';

import { AgentComposer } from './agent-composer';
import { indexAgentNodes } from './agent-document';
import { library } from '../library/index';
import type { Page } from '../types';

const labelClass = 'font-mono text-[11px] uppercase tracking-wider text-muted-foreground';
interface AgentPanelProps {
  open: boolean;
  controller: AgentController;
  projectId: string;
  context: AgentContext;
  pages: Page[];
  selectedIds: string[];
  onAddSelection: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  onClose: () => void;
  onSettings: () => void;
  onGenerate: (plan: PrototypePlan, context: AgentContext, id: string) => AppliedArtifact;
  onLocate: (target: { pageId: string; elementId?: string }) => void;
}

export function AgentPanel({ open, controller, projectId, context, width, onWidthChange, onClose, onSettings, onGenerate, onLocate, pages, selectedIds, onAddSelection }: AgentPanelProps) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const session = controller.current(projectId);
  const [history, setHistory] = useState(false);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const candidates = useMemo<AgentReference[]>(() => [...pages.flatMap(page => [...indexAgentNodes(page.elements).values()].map(node => ({ kind: 'canvas' as const, id: `canvas:${page.id}:${node.id}`, role: page.id === context.pageId ? 'target' as const : 'reference' as const, projectId, pageId: page.id, pageName: page.name, nodeId: node.id, name: node.name }))), ...library.map(item => ({ kind: 'catalog' as const, id: `catalog:${item.type}`, role: 'reference' as const, componentType: item.type, name: item.label }))], [pages, projectId, context.pageId]);
  const [uploading, setUploading] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const follow = useRef(true);
  const positioned = useRef('');
  const drag = useRef<{ x: number; width: number } | null>(null);
  useEffect(() => { setHistory(false); setError(''); setRenaming(false); }, [projectId]);
  useEffect(() => {
    if (open && state.loaded && !state.historyError && !session) controller.newSession(projectId);
  }, [open, state.loaded, state.historyError, session, projectId, controller]);
  useLayoutEffect(() => {
    if (!scroller.current || !session) return;
    scroller.current.scrollTop = session.scrollTop;
    follow.current = scroller.current.scrollHeight - scroller.current.scrollTop - scroller.current.clientHeight < 80;
    setAtBottom(follow.current);
    setError(''); setRenaming(false);
  }, [session?.id, open, history]); // Restore only on navigation, not on streaming updates.
  useLayoutEffect(() => {
    if (!scroller.current) return;
    const last = session?.messages.at(-1);
    if (follow.current && last && ['waiting-input', 'waiting-approval'].includes(last.status) && positioned.current !== last.id) {
      const card = scroller.current.lastElementChild?.querySelector('form, section');
      if (card) {
        positioned.current = last.id;
        scroller.current.scrollTop += card.getBoundingClientRect().top - scroller.current.getBoundingClientRect().top - 16;
      }
    } else if (follow.current && last?.status === 'running') scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [session?.messages]);
  if (!open) return null;
  const busy = !!state.activeRun;
  const currentBusy = state.activeRun?.sessionId === session?.id;
  const waiting = session?.messages.at(-1)?.status === 'waiting-input';
  const otherRun = state.activeRun && !currentBusy ? controller.session(state.activeRun.sessionId) : undefined;
  const sessions = state.sessions.filter(item => item.projectId === projectId && item.archived === showArchived && (!search.trim() || `${item.title} ${item.messages.map(message => message.content).join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()))).sort((a, b) => b.updatedAt - a.updatedAt);
  const send = () => {
    if (!session || uploading) return;
    follow.current = true; setAtBottom(true); setError('');
    void controller.send(session.id, session.draft, context).catch(error => setError(error instanceof Error ? error.message : '发送失败'));
  };
  return <aside aria-label="AI 助手" className="relative flex h-full max-w-[calc(100vw-64px)] min-w-0 shrink-0 flex-col border-l border-border-visible bg-surface text-foreground [&_svg]:stroke-[1.5]" style={{ width }} onKeyDown={event => event.stopPropagation()}>
    <div role="separator" aria-label="调整助手面板宽度" aria-orientation="vertical" aria-valuemin={340} aria-valuemax={640} aria-valuenow={width} tabIndex={0} className="absolute -left-1 top-0 z-10 h-full w-2 cursor-col-resize focus-visible:bg-border-visible focus-visible:outline-none"
      onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); onWidthChange(Math.max(340, Math.min(640, width + (event.key === 'ArrowLeft' ? 20 : -20)))); } }}
      onPointerDown={event => { drag.current = { x: event.clientX, width }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={event => { if (drag.current) onWidthChange(Math.max(340, Math.min(640, drag.current.width + drag.current.x - event.clientX))); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
      {history && <Button variant="ghost" size="icon-xs" aria-label="返回对话" onClick={() => setHistory(false)}><ArrowLeft /></Button>}
      <span className="min-w-0 flex-1 truncate font-mono text-xs uppercase tracking-wider">{history ? '会话历史' : 'AI 助手'}</span>
      <Button variant="ghost" size="icon-sm" aria-label="新建会话" title="新建会话" disabled={!state.loaded || !!state.historyError} onClick={() => { controller.newSession(projectId); setHistory(false); composer.current?.focus(); }}><Plus /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="会话历史" title="会话历史" aria-pressed={history} onClick={() => setHistory(!history)}><History /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="AI 服务设置" title="AI 服务设置" onClick={onSettings}><Settings2 /></Button>
      <Button variant="ghost" size="xs" aria-label="切换到属性面板" onClick={onClose}>属性</Button>
      <Button variant="ghost" size="icon-sm" aria-label="收起 AI 助手" title="收起（继续运行）" onClick={onClose}><X /></Button>
    </header>
    {!state.loaded ? <p role="status" className="p-6 font-mono text-xs">[正在读取会话…]</p> : state.historyError ? <div className="space-y-3 p-6"><p role="alert" className="text-sm text-destructive">{state.historyError}</p><Button variant="outline" onClick={() => void controller.retryLoad()}>重新读取</Button></div> : history ? <>
      <div className="space-y-3 border-b border-border p-4"><Input type="search" aria-label="搜索会话" value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索标题或对话内容" prefix={<Search className="size-3" />} /><div className="flex gap-2"><Button variant={!showArchived ? 'secondary' : 'ghost'} size="sm" aria-pressed={!showArchived} onClick={() => setShowArchived(false)}>最近会话</Button><Button variant={showArchived ? 'secondary' : 'ghost'} size="sm" aria-pressed={showArchived} onClick={() => setShowArchived(true)}>已归档</Button></div></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {!sessions.length && <p className="py-12 text-center text-sm text-muted-foreground">{search ? '没有匹配的会话' : showArchived ? '暂无归档会话' : '暂无会话'}</p>}
        {sessions.map(item => <div key={item.id} className="border-b border-border py-3">
          <button aria-label={`打开会话：${item.title}`} className="w-full space-y-2 rounded-md p-2 text-left hover:bg-muted focus-visible:outline-1 focus-visible:outline-foreground" onClick={() => { controller.select(item.id); setHistory(false); }}>
            <div className="flex items-center justify-between gap-2"><span className="truncate text-sm">{item.title}</span>{state.activeRun?.sessionId === item.id ? <span className={labelClass}>运行中</span> : item.messages.at(-1)?.status === 'waiting-input' ? <span className={labelClass}>待回答</span> : item.messages.at(-1)?.status === 'waiting-approval' ? <span className={labelClass}>待确认</span> : null}</div>
            <p className="truncate text-xs text-muted-foreground">{item.messages.at(-1)?.content || '开始新的讨论'}</p><p className={labelClass}>{new Date(item.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} · {item.messages.filter(message => message.role === 'user').length} 条消息</p>
          </button>
          {deleting === item.id ? <div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span>删除此会话？画布内容保留。</span><Button variant="outline" size="xs" onClick={() => { controller.remove(item.id); setDeleting(null); }}>确认删除</Button><Button variant="ghost" size="xs" onClick={() => setDeleting(null)}>取消</Button></div> : <div className="flex justify-end gap-1"><Button variant="ghost" size="icon-xs" aria-label={item.archived ? `恢复会话：${item.title}` : `归档会话：${item.title}`} disabled={state.activeRun?.sessionId === item.id} onClick={() => controller.archive(item.id)}><Archive /></Button><Button variant="ghost" size="icon-xs" aria-label={`删除会话：${item.title}`} disabled={state.activeRun?.sessionId === item.id} onClick={() => setDeleting(item.id)}><Trash2 /></Button></div>}
        </div>)}
      </div>
    </> : session && <>
      <div className="shrink-0 space-y-2 px-4 pt-4">
        {renaming ? <form className="flex gap-2" onSubmit={event => { event.preventDefault(); if (title.trim()) controller.updateSession(session.id, { title: title.trim() }); setRenaming(false); }}><Input aria-label="会话标题" autoFocus value={title} onChange={event => setTitle(event.target.value)} maxLength={80} /><Button type="submit" size="sm">保存</Button><Button variant="ghost" size="sm" onClick={() => setRenaming(false)}>取消</Button></form> : <button aria-label="重命名会话" className="max-w-full truncate text-left text-base font-medium hover:underline focus-visible:outline-1" onClick={() => { setTitle(session.title); setRenaming(true); }}>{session.title}</button>}
        {session.archived && <div className="flex items-center justify-between text-xs text-muted-foreground">已归档 · 只读<Button variant="ghost" size="sm" onClick={() => controller.archive(session.id)}>恢复会话</Button></div>}
        {otherRun && <div role="status" className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="truncate">{otherRun.projectId === projectId ? otherRun.title : '其他项目的会话'}正在运行</span>{otherRun.projectId === projectId && <Button variant="ghost" size="xs" onClick={() => controller.select(otherRun.id)}>查看</Button>}<Button variant="ghost" size="xs" onClick={() => controller.stop()}>停止</Button></div>}
      </div>
      <div ref={scroller} aria-label="会话消息" className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-6" onScroll={event => {
        const element = event.currentTarget;
        follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        setAtBottom(follow.current);
        if (Math.abs(session.scrollTop - element.scrollTop) > 1) controller.updateSession(session.id, { scrollTop: element.scrollTop });
      }}>
        {!session.messages.length && <div className="space-y-6 py-10"><MessageSquare className="size-6 text-muted-foreground" /><div className="space-y-2"><h2 className="text-base font-medium">选中对象，一起打磨原型</h2><p className="text-sm leading-6 text-muted-foreground">选中组件或组合后添加到会话，直接修改原型；也可以从模板和参考图开始。</p></div><div className="space-y-2">{(session.references?.some(ref => ref.role === 'target') ? ['统一这些组件的文案和尺寸', '优化这个区域的布局', '先帮我分析这个组件'] : ['设计一个桌面端任务管理页面', '做一个移动端登录页', '先帮我梳理页面结构']).map(prompt => <button key={prompt} className="block w-full rounded-lg border border-border-visible px-3 py-3 text-left text-sm text-muted-foreground hover:border-foreground/50 hover:text-foreground focus-visible:outline-1" onClick={() => { controller.updateSession(session.id, { draft: prompt }); composer.current?.focus(); }}>{prompt}<ArrowUp className="float-right size-3.5" /></button>)}</div></div>}
        {session.messages.map((message, index) => <AgentMessageView key={message.id} message={message} sessionId={session.id} controller={controller} busy={busy} last={index === session.messages.length - 1} archived={session.archived} context={context} onGenerate={onGenerate} onLocate={onLocate} onError={setError} />)}
      </div>
      {!atBottom && session.messages.length > 0 && <div className="flex justify-center pb-2"><Button variant="outline" size="pill-sm" onClick={() => { follow.current = true; setAtBottom(true); scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }}><ArrowDown className="size-3" />回到最新</Button></div>}
      <div className="shrink-0 space-y-3 border-t border-border p-4">
        {!state.settings.apiKey && <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>连接模型后即可开始</span><Button variant="outline" size="pill-sm" onClick={onSettings}>前往设置</Button></div>}
        {state.settingsError && <p className="text-xs text-destructive">{state.settingsError}</p>}
        <div className="flex items-center justify-between gap-3"><span className={cn(labelClass, 'truncate')} title={context.pageName}>{session.references?.some(ref => ref.role === 'target') ? '修改对象' : '创作页面'} / {context.pageName}</span><Popover><PopoverTrigger aria-label="切换会话模型" className="flex max-w-[60%] cursor-pointer items-center gap-1 font-mono text-[11px] text-muted-foreground"><span className="max-w-40 truncate" title={session.model || state.settings.model}>{session.model || state.settings.model}</span><ChevronDown className="size-3" /></PopoverTrigger><PopoverPopup side="top" align="end" className="w-64" onKeyDown={event => event.stopPropagation()}><label className="block space-y-2"><span className={labelClass}>本会话模型</span><Input aria-label="本会话模型" disabled={session.archived} placeholder={state.settings.model} value={session.model} onChange={event => controller.updateSession(session.id, { model: event.target.value })} className="font-mono" /></label><p className="text-xs text-muted-foreground">留空使用默认模型，下次请求生效。</p></PopoverPopup></Popover></div>
        {waiting ? <p className="text-xs leading-5 text-muted-foreground">等待你回答上方问题，提交后会继续原任务。</p> : <><AgentComposer sessionId={session.id} draft={session.draft} references={session.references ?? []} candidates={candidates} disabled={session.archived} busy={busy} composerRef={composer} selectedCount={selectedIds.length} onSelection={onAddSelection} onDraft={draft => controller.updateSession(session.id, { draft })} onReferences={references => controller.updateSession(session.id, { references })} onSend={send} onError={setError} onUploadState={setUploading} onLocate={ref => { try { onLocate({ pageId: ref.pageId, elementId: ref.nodeId }); setError(''); } catch (error) { setError(error instanceof Error ? error.message : '无法定位对象'); } }} isMissing={ref => ref.kind === 'canvas' && !candidates.some(candidate => candidate.id === ref.id)} />
        <div className="flex items-center justify-between gap-2"><span className={labelClass}>⌘ / Ctrl + Enter</span>{currentBusy ? <Button variant="outline" size="pill-sm" onClick={() => controller.stop()}><Square className="size-3" />停止</Button> : <Button size="pill-sm" aria-label="发送消息" disabled={!session.draft.trim() || busy || uploading || waiting || session.archived || !state.settings.apiKey} onClick={send}><ArrowUp className="size-3.5" />发送</Button>}</div></>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </>}
    {state.saveError ? <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2"><p role="alert" className="text-xs text-destructive">{state.saveError}</p><Button size="xs" variant="outline" onClick={() => void controller.flush()}>重试保存</Button></div> : <div className="border-t border-border px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{state.saving ? '[保存中…]' : '[本地会话]'}</div>}
  </aside>;
}
