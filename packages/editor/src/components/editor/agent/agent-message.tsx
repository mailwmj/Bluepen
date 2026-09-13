"use client";

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, CircleHelp, Copy, Search, Square, X } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { Button } from '@bluepen/editor/components/ui/button';
import { Textarea } from '@bluepen/editor/components/ui/textarea';
import { cn } from '@bluepen/editor/lib/utils';
import type { AgentController } from './agent-controller';
import type { AgentContext, AppliedArtifact, ConversationMessage } from './agent-types';
import type { PrototypePlan } from './prototype-plan';
import { planToElement } from './prototype-plan';
import { AgentReferenceList } from './agent-references';
import { AgentCanvasPreview, AgentPreviewDialog } from './agent-preview';
import type { EditorElement } from '../types';

const labelClass = 'font-mono text-[11px] uppercase text-muted-foreground';
const statusLabels = { running: '执行中', 'waiting-input': '等待回答', 'waiting-approval': '等待确认', completed: '已完成', failed: '请求失败', cancelled: '已停止', interrupted: '已中断', declined: '未采用' };

function Elapsed({ message }: { message: ConversationMessage }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (message.status !== 'running') return; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [message.status]);
  return <span className="font-mono text-[11px] text-muted-foreground">{Math.max(0, Math.round(((message.finishedAt ?? now) - message.createdAt) / 1000))}s</span>;
}

function QuestionCard({ message, disabled, onAnswer, onCancel, onDraft }: { message: ConversationMessage; disabled: boolean; onAnswer: (answers: Record<string, string>) => Promise<void>; onCancel: () => void; onDraft: (draft: NonNullable<ConversationMessage['questionDraft']>) => void }) {
  const choices = Object.fromEntries(Object.entries(message.questionDraft ?? {}).map(([id, draft]) => [id, draft.choices]));
  const custom = Object.fromEntries(Object.entries(message.questionDraft ?? {}).map(([id, draft]) => [id, draft.custom]));
  const update = (id: string, patch: { choices?: string[]; custom?: string }) => onDraft({ ...message.questionDraft, [id]: { choices: choices[id] ?? [], custom: custom[id] ?? '', ...patch } });
  const [error, setError] = useState('');
  const waiting = message.status === 'waiting-input';
  return <form className="space-y-5 rounded-lg border border-border-visible p-4" aria-label="回答澄清问题" onSubmit={event => {
    event.preventDefault(); setError('');
    const answers = Object.fromEntries((message.questions ?? []).map(question => [question.id, [...(choices[question.id] ?? []), custom[question.id]?.trim()].filter(Boolean).join('；')]));
    void onAnswer(answers).catch(error => setError(error instanceof Error ? error.message : '回答失败'));
  }}>
    <div className="flex items-center gap-2"><CircleHelp className="size-4" /><span className={labelClass}>{waiting ? '需要你补充' : message.answers ? '已回答' : '问题已取消'}</span></div>
    {message.questions?.map((question, index) => <fieldset key={question.id} disabled={disabled || !waiting} className="space-y-3">
      <legend className="mb-3 text-sm leading-6">{index + 1}. {question.title}<span className="ml-2 text-[11px] text-muted-foreground">{question.required ? '必答' : '选答'}{question.multiple ? ' · 可多选' : ''}</span></legend>
      {waiting ? <>
        {question.options.length > 0 && <div className="flex flex-wrap gap-2">{question.options.map((option, optionIndex) => <label key={`${option}-${optionIndex}`} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors duration-150 has-focus-visible:outline-1 has-focus-visible:outline-foreground', choices[question.id]?.includes(option) ? 'border-foreground bg-foreground text-background' : 'border-border-visible hover:border-foreground/50')}>
          <input type={question.multiple ? 'checkbox' : 'radio'} name={`${message.id}-${question.id}`} value={option} aria-label={option} className="size-3 accent-current" checked={choices[question.id]?.includes(option) ?? false} onChange={event => update(question.id, { choices: question.multiple ? event.target.checked ? [...(choices[question.id] ?? []), option] : (choices[question.id] ?? []).filter(value => value !== option) : [option] })} />{option}
        </label>)}</div>}
        <Textarea aria-label={`${question.title}：自定义回答`} placeholder={question.options.length ? '或补充你的想法…' : '输入你的回答…'} value={custom[question.id] ?? ''} onChange={event => update(question.id, { custom: event.target.value })} className="min-h-16 text-sm" />
      </> : <p className="whitespace-pre-wrap text-sm text-muted-foreground">{message.answers?.[question.id] || (message.answers ? '已跳过' : '未回答')}</p>}
    </fieldset>)}
    {waiting && <div className="flex items-center gap-2"><Button type="submit" size="pill" disabled={disabled}>提交并继续</Button><Button variant="ghost" onClick={onCancel} disabled={disabled}>取消任务</Button></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </form>;
}

export function AgentMessageView({ message, sessionId, controller, busy, last, context, onGenerate, onLocate, onError, archived }: {
  message: ConversationMessage; sessionId: string; controller: AgentController; busy: boolean; last: boolean; context: AgentContext; archived: boolean;
  onGenerate: (plan: PrototypePlan, context: AgentContext, id: string) => AppliedArtifact;
  onLocate: (target: { pageId: string; elementId?: string }) => void; onError: (error: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(message.status === 'running');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [preview, setPreview] = useState<{ before: EditorElement[]; after: EditorElement[] } | null>(null);
  const planElements = useMemo(() => message.plan ? [planToElement(message.plan, 0, 0)] : [], [message.plan]);
  const resultState = message.applied ? controller.resultState(message.applied) : undefined;
  const resultLabel = resultState ? ({ applied: '已应用', reverted: '已撤销', changed: '已有后续修改', missing: '对象已删除', unavailable: '页面不可用' })[resultState] : '';
  const showPreview = () => { try { setPreview(controller.preview(message)); } catch (error) { onError(error instanceof Error ? error.message : '预览失败'); } };
  const copy = () => { void navigator.clipboard.writeText(message.content).then(() => setCopied(true)).catch(() => onError('无法复制，请检查剪贴板权限')); };
  useEffect(() => { if (message.status !== 'running') setReasoningOpen(false); }, [message.status]);
  const locate = (target: { pageId: string; elementId?: string }) => { try { onLocate(target); } catch (error) { onError(error instanceof Error ? error.message : '无法定位目标'); } };
  if (message.role === 'user') return <article className="space-y-2 border-l-2 border-border-visible pl-4" aria-label="你的消息"><div className={labelClass}>你</div>
    <AgentReferenceList references={message.context.references ?? []} onLocate={ref => locate({ pageId: ref.pageId, elementId: ref.nodeId })} />
    {editing ? <form className="space-y-2" onSubmit={event => { event.preventDefault(); void controller.send(sessionId, editText, { ...message.context, snapshot: undefined }).then(() => setEditing(false)).catch(error => onError(error instanceof Error ? error.message : '发送失败')); }}><Textarea aria-label="编辑消息" value={editText} onChange={event => setEditText(event.target.value)} /><p className="text-xs text-muted-foreground">作为新一轮发送，画布上已有修改保留。</p><div className="flex gap-2"><Button type="submit" size="pill-sm" disabled={busy || !editText.trim()}>保存并重发</Button><Button variant="ghost" size="sm" onClick={() => setEditing(false)}>取消</Button></div></form> : <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>}
    <div className="flex gap-1"><Button variant="ghost" size="icon-xs" aria-label="复制消息" onClick={copy}>{copied ? <Check /> : <Copy />}</Button><Button variant="ghost" size="xs" disabled={busy || archived || controller.session(sessionId)?.messages.at(-1)?.status === 'waiting-input'} onClick={() => { setEditText(message.content); setEditing(true); }}>编辑重发</Button></div>
  </article>;
  return <article className="space-y-4" aria-label="助手消息">
    <div className="flex items-center justify-between gap-3"><span className={labelClass}>Bluepen <span className="ml-2">/ {statusLabels[message.status]}</span></span><Elapsed message={message} /></div>
    {message.status === 'running' && <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><span className="size-2 bg-foreground" />{message.phase || '正在分析需求'}</div>}
    {!!message.steps.length && <details className="group"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-muted-foreground"><ChevronDown className="size-3.5 transition-transform duration-150 group-open:rotate-180" />{message.status === 'running' ? `执行进度 · ${message.steps.filter(step => step.status === 'completed').length}/${message.steps.length}` : `已完成 ${message.steps.filter(step => step.status === 'completed').length} 步`}</summary><ol className="mt-3 space-y-3 border-l border-border pl-4">{message.steps.map(step => <li key={step.id} className="space-y-1"><div className="flex items-center gap-2 text-xs">{step.status === 'completed' ? <Check className="size-3.5" /> : step.status === 'failed' || step.status === 'cancelled' ? <X className="size-3.5" /> : <Search className="size-3.5" />}{step.label}<span className={labelClass}>{({ running: '执行中', completed: '完成', failed: '失败', cancelled: '停止' })[step.status]}</span></div><p className="break-words pl-5 text-xs text-muted-foreground">{step.detail}</p></li>)}</ol></details>}
    {message.reasoning && <details open={reasoningOpen} onToggle={event => setReasoningOpen(event.currentTarget.open)}><summary className="cursor-pointer text-xs text-muted-foreground">思考摘要</summary><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">{message.reasoning}</p></details>}
    {message.content && <div className="min-w-0 break-words text-sm leading-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:my-3 [&_h2]:my-3 [&_h3]:my-3 [&_h1]:font-medium [&_h2]:font-medium [&_h3]:font-medium [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:p-3 [&_code]:font-mono [&_code]:text-xs [&_a]:text-interactive [&_a]:underline [&_table]:block [&_table]:overflow-auto [&_td]:border-b [&_td]:border-border [&_td]:p-2 [&_th]:p-2 [&_blockquote]:border-l [&_blockquote]:border-border-visible [&_blockquote]:pl-3">
      <Streamdown mode={message.status === 'running' ? 'streaming' : 'static'} isAnimating={message.status === 'running'} animated={false} controls={false} skipHtml components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener">{children}</a>, img: ({ alt }) => <span className="text-muted-foreground">[图片：{alt || '参考图片'}]</span> }}>{message.content}</Streamdown>
    </div>}
    {!!message.questions?.length && <QuestionCard message={message} disabled={busy || archived} onAnswer={answers => controller.answer(sessionId, message.id, answers)} onCancel={() => controller.dismiss(sessionId, message.id)} onDraft={draft => controller.updateQuestionDraft(sessionId, message.id, draft)} />}
    {message.plan && <section className="space-y-3 rounded-lg border border-border-visible p-4" aria-label="原型方案">
      <div className="flex items-center justify-between"><span className={labelClass}>{message.applied ? resultLabel : message.status === 'declined' ? '未采用的方案' : '待确认方案'}</span><span className={labelClass}>V{message.planVersion ?? 1} · {({ page: '页面', section: '区域', component: '组件' })[message.plan.artifactKind]}</span></div>
      <h3 className="text-base font-medium">{message.plan.pageName}</h3><p className="text-sm leading-6 text-muted-foreground">{message.plan.purpose}</p>
      <p className="text-xs text-muted-foreground">新增到 {message.context.pageName} · <span className="font-mono">{message.plan.root.width} × {message.plan.root.height}</span></p>
      {message.status === 'waiting-approval' && !message.applied && <p className="text-xs leading-5 text-foreground">尚未写入画布，确认生成后生效。</p>}
      <button className="block w-full rounded-lg focus-visible:outline-2" aria-label="放大原型预览" onClick={showPreview}><AgentCanvasPreview elements={planElements} /></button>
      <ul className="space-y-1 text-xs text-muted-foreground">{message.plan.root.children?.slice(0, 6).map((node, index) => <li key={index}>— {node.name}</li>)}</ul>
      {message.plan.notes.length > 0 && <details><summary className="cursor-pointer text-xs text-muted-foreground">方案说明</summary><ul className="mt-2 space-y-1 text-xs leading-5">{message.plan.notes.map((note, index) => <li key={index}>{note}</li>)}</ul></details>}
      {message.applied ? <Button variant="outline" size="pill-sm" onClick={() => locate(message.applied!)}><ArrowUpRight className="size-3.5" />定位到画布</Button> : message.status === 'waiting-approval' && <div className="flex flex-wrap items-center gap-2">
        {context.pageId !== message.context.pageId ? <Button variant="outline" size="pill-sm" onClick={() => locate({ pageId: message.context.pageId })}>前往目标页面</Button> : <Button size="pill-sm" disabled={busy || archived} onClick={() => controller.apply(sessionId, message.id, onGenerate)}>确认生成</Button>}
        <Button variant="ghost" size="sm" disabled={busy || archived} onClick={() => { controller.dismiss(sessionId, message.id); controller.updateSession(sessionId, { draft: '调整方案：' }); }}>继续调整</Button>
        <Button variant="ghost" size="sm" disabled={busy || archived} onClick={() => controller.dismiss(sessionId, message.id)}>不采用</Button>
      </div>}
      {message.applied?.receipt && <Button variant="ghost" size="sm" disabled={busy || archived || resultState !== 'applied'} onClick={() => controller.undo(sessionId, message.id)}>撤销</Button>}
    </section>}
    {message.changes && <section className="space-y-3 rounded-lg border border-border-visible p-4" aria-label="对象修改">
      <div className="flex items-center justify-between gap-2"><span className={labelClass}>{message.applied ? resultLabel : message.status === 'declined' ? '未采用' : '待确认修改'}</span><span className={labelClass}>{message.changes.operations.length} 项调整</span></div>
      <h3 className="text-sm font-medium">{message.changes.summary}</h3>
      <p className="text-xs text-muted-foreground">{message.context.pageName} · 保留原组件，可继续手工编辑</p>
      {message.status === 'waiting-approval' && !message.applied && <p className="text-xs leading-5 text-foreground">尚未修改画布，请预览并确认。</p>}
      <details><summary className="cursor-pointer text-xs text-muted-foreground">查看修改明细</summary><ul className="mt-2 space-y-2 text-xs leading-5">{message.changes.operations.map((op, index) => <li key={index}>{({ update: '调整', insert: '新增', delete: '删除', move: '移动' })[op.kind]} {op.kind === 'insert' ? op.node.name : message.context.snapshot?.nodes.find(node => node.id === op.nodeId)?.name ?? '组件'}{op.kind === 'update' && `：${op.fields.map(field => `${field.key.replace('props.', '').replace('autoLayout.', '布局.')} → ${String(field.value).slice(0, 60)}`).join('；')}`}</li>)}</ul></details>
      <div className="flex flex-wrap gap-2"><Button variant="outline" size="pill-sm" onClick={showPreview}>查看对比</Button>
        {message.applied ? <><Button variant="ghost" size="sm" disabled={!message.applied.elementId || resultState === 'missing' || resultState === 'unavailable'} onClick={() => locate(message.applied!)}>定位</Button><Button variant="ghost" size="sm" disabled={busy || archived || resultState !== 'applied'} onClick={() => controller.undo(sessionId, message.id)}>撤销</Button></> : message.status === 'waiting-approval' && <><Button size="pill-sm" disabled={busy || archived} onClick={() => controller.applyChanges(sessionId, message.id)}>应用修改</Button><Button variant="ghost" size="sm" disabled={busy || archived} onClick={() => { controller.dismiss(sessionId, message.id); controller.updateSession(sessionId, { draft: '继续调整：' }); }}>继续调整</Button><Button variant="ghost" size="sm" disabled={busy || archived} onClick={() => controller.dismiss(sessionId, message.id)}>不采用</Button></>}
      </div>
    </section>}
    <AgentPreviewDialog preview={preview} title={message.changes?.summary ?? message.plan?.pageName ?? '原型预览'} onClose={() => setPreview(null)} />
    {message.error && <p role="alert" className="text-sm leading-6 text-destructive">{message.error}</p>}
    <div className="flex items-center gap-2">
      {message.content && <Button variant="ghost" size="icon-xs" aria-label={copied ? '已复制回复' : '复制回复'} onClick={() => { void navigator.clipboard.writeText(message.content).then(() => setCopied(true)).catch(() => onError('无法复制，请检查剪贴板权限')); }}>{copied ? <Check /> : <Copy />}</Button>}
      {last && ['failed', 'cancelled', 'interrupted'].includes(message.status) && <Button size="pill-sm" variant="outline" disabled={busy || archived} onClick={() => { void controller.retry(sessionId, message.id).catch(error => onError(error instanceof Error ? error.message : '重试失败')); }}>重新尝试</Button>}
      {last && ['completed', 'declined', 'waiting-approval'].includes(message.status) && <Button variant="ghost" size="sm" disabled={busy || archived} onClick={() => { void controller.regenerate(sessionId, message.id).catch(error => onError(error instanceof Error ? error.message : '重新生成失败')); }}>重新生成</Button>}
      {message.status === 'running' && <Button variant="ghost" size="sm" onClick={() => controller.stop()}><Square className="size-3" />停止</Button>}
    </div>
  </article>;
}
