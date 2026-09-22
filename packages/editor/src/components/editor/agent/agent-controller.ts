import { z } from 'zod';
import type { AgentProvider, AgentMessage } from './agent-runtime';
import { validatePrototypePlan, type PrototypePlan } from './prototype-plan';
import { agentId, defaultAgentSettings, type AgentContext, type AgentHistory, type AgentSession, type AgentSettings, type AppliedArtifact, type ConversationMessage, type AgentReference, type AgentChangeSet, type AgentResultState } from './agent-types';
import { changesSchema, receiptSchema, referenceSchema, selectionSchema } from './agent-schema';
import { mergeAgentReferences, same } from './agent-document';
import type { EditorElement } from '../types';

export interface AgentCanvasAdapter {
  capture(context: AgentContext): AgentContext;
  apply(changes: AgentChangeSet, context: AgentContext, id: string): AppliedArtifact;
  status(artifact: AppliedArtifact): AgentResultState;
  undo(artifact: AppliedArtifact): void;
  preview(message: ConversationMessage): { before: EditorElement[]; after: EditorElement[] };
}

export interface AgentStorage {
  loadHistory(): Promise<AgentHistory | undefined>;
  saveHistory(history: AgentHistory): Promise<void>;
  /** Optional: keeps the untouched record before a salvaged load overwrites it. */
  saveHistoryRecovery?(raw: unknown): Promise<void>;
  loadSettings(): Promise<AgentSettings>;
  saveSettings(settings: AgentSettings): Promise<void>;
}
const contextSchema = z.object({ projectId: z.string(), pageId: z.string(), pageName: z.string(), anchor: z.object({ x: z.number(), y: z.number() }).optional(), references: z.array(referenceSchema).max(24).optional(), snapshot: selectionSchema.optional() });
const messageSchema = z.object({
  id: z.string(), role: z.enum(['user', 'assistant']), content: z.string(), createdAt: z.number(), context: contextSchema,
  status: z.enum(['running', 'waiting-input', 'waiting-approval', 'completed', 'failed', 'cancelled', 'interrupted', 'declined']),
  model: z.string().optional(), phase: z.string().optional(), finishedAt: z.number().optional(),
  steps: z.array(z.object({ id: z.string(), label: z.string(), status: z.enum(['running', 'completed', 'failed', 'cancelled']), detail: z.string(), startedAt: z.number().optional(), finishedAt: z.number().optional() })), reasoning: z.string(),
  questions: z.array(z.object({ id: z.string(), title: z.string(), options: z.array(z.string()), multiple: z.boolean(), required: z.boolean() })).optional(),
  answers: z.record(z.string(), z.string()).optional(),
  questionDraft: z.record(z.string(), z.object({ choices: z.array(z.string()), custom: z.string() })).optional(),
  plan: z.custom<PrototypePlan>(value => { try { return validatePrototypePlan(value as PrototypePlan).length === 0; } catch { return false; } }).optional(),
  changes: changesSchema.optional(), planVersion: z.number().optional(), applied: z.object({ pageId: z.string(), elementId: z.string(), name: z.string(), receipt: receiptSchema.optional() }).optional(), error: z.string().optional(),
});
const sessionSchema = z.object({
  id: z.string(), projectId: z.string(), title: z.string(), createdAt: z.number(), updatedAt: z.number(), archived: z.boolean(), draft: z.string(), model: z.string(), scrollTop: z.number(), references: z.array(referenceSchema).max(24).optional(),
  messages: z.array(messageSchema),
});
const historySchema = z.object({ version: z.literal(1), selected: z.record(z.string(), z.string()), sessions: z.array(sessionSchema) });

/**
 * Stored history is user data that outlives the code that wrote it, so a field this build no longer
 * understands must not hide every other conversation. Valid sessions are kept whole; inside a broken
 * session only the unreadable messages are dropped, and the caller reports how many. Genuinely
 * unrecognisable values still fail so the caller can refuse to overwrite them.
 */
function restoreHistory(value: unknown): { history: AgentHistory; dropped: number } | undefined {
  const parsed = historySchema.safeParse(value);
  if (parsed.success) return { history: parsed.data as AgentHistory, dropped: 0 };
  if (!value || typeof value !== 'object') return undefined;
  const source = value as { selected?: unknown; sessions?: unknown };
  if (!Array.isArray(source.sessions)) return undefined;
  const selected = z.record(z.string(), z.string()).safeParse(source.selected);
  const history: AgentHistory = { version: 1, selected: selected.success ? selected.data : {}, sessions: [] };
  let dropped = 0;
  for (const entry of source.sessions) {
    const session = sessionSchema.safeParse(entry);
    if (session.success) { history.sessions.push(session.data as AgentSession); continue; }
    const messages = entry && typeof entry === 'object' ? (entry as { messages?: unknown }).messages : undefined;
    const shell = Array.isArray(messages) ? sessionSchema.safeParse({ ...entry, messages: [] }) : undefined;
    if (!shell?.success) { dropped++; continue; }
    const kept = (messages as unknown[]).flatMap(message => {
      const result = messageSchema.safeParse(message);
      return result.success ? [result.data as ConversationMessage] : [];
    });
    dropped += (messages as unknown[]).length - kept.length;
    history.sessions.push({ ...(shell.data as AgentSession), messages: kept });
  }
  // Nothing survived, so there is no honest salvage: report failure and leave the record untouched.
  if (dropped && !history.sessions.length) return undefined;
  return { history, dropped };
}

export interface AgentSnapshot extends AgentHistory {
  loaded: boolean;
  settings: AgentSettings;
  settingsError: string;
  historyError: string;
  /** Set when a load had to skip unreadable entries; the rest of the history is usable. */
  historyWarning: string;
  saveError: string;
  saving: boolean;
  activeRun?: { sessionId: string; messageId: string };
}

/** One editor-owned controller outlives panel visibility and session selection. */
export class AgentController {
  private state: AgentSnapshot = { version: 1, sessions: [], selected: {}, loaded: false, settings: defaultAgentSettings, settingsError: '', historyError: '', historyWarning: '', saveError: '', saving: false };
  private listeners = new Set<() => void>();
  private active?: { sessionId: string; messageId: string; controller: AbortController };
  private timer?: ReturnType<typeof setTimeout>;
  private queue: Promise<unknown> = Promise.resolve();
  private initialization?: Promise<void>;
  private revision = 0;
  private canvas?: AgentCanvasAdapter;
  constructor(private storage: AgentStorage, private provider: AgentProvider) {}
  setCanvasAdapter(adapter: AgentCanvasAdapter) { this.canvas = adapter; }
  resultState(artifact: AppliedArtifact): AgentResultState { return this.canvas?.status(artifact) ?? 'unavailable'; }
  preview(message: ConversationMessage) { if (!this.canvas) throw new Error('画布尚未就绪'); return this.canvas.preview(message); }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.state;
  private emit(patch: Partial<AgentSnapshot>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(listener => listener()); }
  private changed(patch: Partial<AgentSnapshot>) {
    this.revision++;
    this.emit({ ...patch, saving: true });
    if (!this.timer) this.timer = setTimeout(() => { void this.flush(); }, 200);
  }
  async initialize() {
    if (this.initialization) return this.initialization;
    this.initialization = (async () => {
      const [history, settings] = await Promise.allSettled([this.storage.loadHistory(), this.storage.loadSettings()]);
      if (settings.status === 'fulfilled') this.emit({ settings: settings.value, settingsError: '' });
      else this.emit({ settingsError: this.errorText(settings.reason) });
      try {
        if (history.status === 'rejected') throw history.reason;
        const restored = history.value ? restoreHistory(history.value) : { history: { version: 1 as const, sessions: [], selected: {} } as AgentHistory, dropped: 0 };
        if (!restored) throw new Error('任务记录结构无法识别');
        const sessions = restored.history.sessions.map(session => ({ ...session, messages: session.messages.map(message => message.status === 'running' ? {
          ...message, status: 'interrupted' as const, finishedAt: Date.now(), error: '上次运行已中断，可重新尝试',
          steps: message.steps.map(step => step.status === 'running' ? { ...step, status: 'cancelled' as const, finishedAt: Date.now() } : step),
        } : message) }));
        if (restored.dropped) { try { await this.storage.saveHistoryRecovery?.(history.value); } catch { /* the recovery copy is best effort */ } }
        this.emit({ ...restored.history, sessions, historyError: '', historyWarning: restored.dropped ? `已跳过 ${restored.dropped} 条无法读取的任务记录` : '', loaded: true });
      } catch {
        this.emit({ loaded: true, historyError: '无法恢复任务记录，请重试。原记录尚未覆盖。' });
      }
    })();
    return this.initialization;
  }
  async retryLoad() { this.initialization = undefined; this.emit({ loaded: false }); await this.initialize(); }
  async flush() {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (!this.state.loaded || this.state.historyError) return;
    const { sessions, selected } = this.state;
    const revision = this.revision;
    this.emit({ saving: true });
    const write = async () => {
      try {
        await this.storage.saveHistory({ version: 1, sessions, selected });
        if (revision === this.revision) this.emit({ saving: false, saveError: '' });
      } catch (error) { this.emit({ saving: false, saveError: this.errorText(error) }); }
    };
    this.queue = this.queue.then(write, write);
    await this.queue;
  }
  async saveSettings(settings: AgentSettings) {
    if (!settings.baseUrl.trim() || !settings.model.trim()) throw new Error('请填写 API 地址和默认模型');
    let url: URL;
    try { url = new URL(settings.baseUrl.trim()); } catch { throw new Error('请填写完整的 HTTP(S) API 地址'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('API 地址必须是无认证信息及查询参数的 HTTP(S) 地址');
    await this.storage.saveSettings(settings);
    this.emit({ settings: { ...settings, baseUrl: settings.baseUrl.trim(), apiKey: settings.apiKey.trim(), model: settings.model.trim() }, settingsError: '' });
  }
  session(id: string) { return this.state.sessions.find(session => session.id === id); }
  current(projectId: string) { return this.state.sessions.find(session => session.id === this.state.selected[projectId] && session.projectId === projectId) ?? this.state.sessions.find(session => session.projectId === projectId && !session.archived); }
  newSession(projectId: string) {
    if (!this.state.loaded || this.state.historyError) return;
    const session: AgentSession = { id: agentId(), projectId, title: '新任务', createdAt: Date.now(), updatedAt: Date.now(), archived: false, draft: '', model: '', scrollTop: 0, messages: [] };
    this.changed({ sessions: [session, ...this.state.sessions], selected: { ...this.state.selected, [projectId]: session.id } });
    return session;
  }
  select(id: string) {
    const session = this.session(id);
    if (session) this.changed({ selected: { ...this.state.selected, [session.projectId]: id } });
  }
  updateSession(id: string, patch: Partial<Pick<AgentSession, 'title' | 'draft' | 'model' | 'scrollTop' | 'references'>>) {
    this.changed({ sessions: this.state.sessions.map(session => session.id === id ? { ...session, ...patch } : session) });
  }
  addReferences(id: string, incoming: AgentReference[]) {
    const session = this.session(id);
    if (!session || session.archived) throw new Error('请恢复或新建任务后添加对象');
    const references = mergeAgentReferences(session.references ?? [], incoming.map(ref => referenceSchema.parse(ref)));
    this.updateSession(id, { references });
  }
  archive(id: string) {
    if (this.active?.sessionId === id) return;
    this.changed({ sessions: this.state.sessions.map(session => session.id === id ? { ...session, archived: !session.archived } : session) });
  }
  remove(id: string) {
    if (this.active?.sessionId === id) return;
    this.changed({ sessions: this.state.sessions.filter(session => session.id !== id), selected: Object.fromEntries(Object.entries(this.state.selected).filter(([, selected]) => selected !== id)) });
  }
  private patchMessage(sessionId: string, id: string, patch: Partial<ConversationMessage>) {
    this.changed({ sessions: this.state.sessions.map(session => session.id === sessionId ? { ...session, updatedAt: Date.now(), messages: session.messages.map(message => message.id === id ? { ...message, ...patch } : message) } : session) });
  }
  private errorText(error: unknown, key = this.state.settings.apiKey) { const text = typeof error === 'string' ? error : error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : '操作失败，请重试'; return text.split(key || '\0').join('[已隐藏]'); }
  private modelMessages(session: AgentSession): AgentMessage[] {
    const valid = session.messages.filter(message => message.role === 'user' || ['completed', 'waiting-input', 'waiting-approval', 'declined'].includes(message.status));
    const lastPlan = valid.findLast(message => message.plan);
    const messages = valid.map(message => ({ role: message.role, reasoning: message.role === 'assistant' ? message.reasoning : undefined, content: message.content +
      (message.context.references?.length ? `\n本条消息引用：${JSON.stringify(message.context.references.map(ref => ({ kind: ref.kind, name: ref.name, role: ref.role, ...(ref.kind === 'canvas' ? { nodeId: ref.nodeId } : {}) })))}` : '') +
      (message.questions?.length ? `\n澄清问题：${JSON.stringify(message.questions)}` : '') +
      (message === lastPlan ? `\n方案：${JSON.stringify(message.plan)}` : '') +
      (message.changes ? `\n修改摘要：${message.changes.summary}` : '') +
      (message.applied ? `\n画布当前状态：${({ applied: '修改仍存在', reverted: '已撤销', changed: '已有后续修改', missing: '对象已删除', unavailable: '目标页面不可用' })[this.resultState(message.applied)]}` : message.plan || message.changes ? `\n状态：${message.status === 'declined' ? '用户未采用' : '尚未应用'}` : '') }));
    // Keep recent turns intact and make the omitted context explicit to the model.
    let length = 0;
    const recent: AgentMessage[] = [];
    for (const message of messages.toReversed()) {
      const size = message.content.length + (message.reasoning?.length ?? 0);
      if (recent.length && length + size > 60_000) break;
      recent.unshift(message); length += size;
    }
    if (recent.length < messages.length) recent.unshift({ role: 'user', content: '[较早会话已省略；不要推测缺失内容，以本次引用的当前画布数据为准。]' });
    return recent;
  }
  async send(sessionId: string, content: string, context: AgentContext) {
    const session = this.session(sessionId);
    if (!session || session.archived || session.messages.at(-1)?.status === 'waiting-input' || this.active || !content.trim() || !this.state.loaded || this.state.historyError) return;
    if (session.projectId !== context.projectId) throw new Error('任务与目标项目不一致');
    if (!this.state.settings.apiKey.trim()) throw new Error('请先在设置 → AI 服务中填写 API Key');
    if (content.length > 20_000) throw new Error('消息过长，请拆成几步发送');
    context = { ...context, references: context.references ?? session.references ?? [] };
    context = structuredClone(this.canvas?.capture(context) ?? context);
    const user: ConversationMessage = { id: agentId(), role: 'user', content: content.trim(), createdAt: Date.now(), status: 'completed', context, steps: [], reasoning: '' };
    this.changed({ sessions: this.state.sessions.map(item => sessionId === item.id ? { ...item, draft: '', title: item.messages.length || !['新会话', '新任务'].includes(item.title) ? item.title : content.trim().slice(0, 30), messages: [...item.messages.map(message => message.status === 'waiting-approval' ? { ...message, status: 'declined' as const } : message), user] } : item) });
    await this.start(sessionId, context);
  }
  private async start(sessionId: string, context: AgentContext) {
    const session = this.session(sessionId)!;
    const input = this.modelMessages(session);
    const settings = { ...this.state.settings, model: session.model.trim() || this.state.settings.model };
    const message: ConversationMessage = { id: agentId(), role: 'assistant', content: '', status: 'running', context, createdAt: Date.now(), model: settings.model, phase: '正在连接模型', steps: [], reasoning: '' };
    const run = { sessionId, messageId: message.id, controller: new AbortController() };
    this.active = run;
    this.changed({ activeRun: { sessionId, messageId: message.id }, sessions: this.state.sessions.map(item => item.id === sessionId ? { ...item, messages: [...item.messages, message] } : item) });
    const current = () => this.session(sessionId)!.messages.find(item => item.id === message.id)!;
    try {
      const result = await this.provider({ messages: input, settings, context, signal: run.controller.signal,
        onReply: content => { if (this.active === run) this.patchMessage(sessionId, message.id, { content }); },
        onEvent: event => {
          if (this.active !== run) return;
          if (event.type === 'phase') this.patchMessage(sessionId, message.id, { phase: event.label });
          if (event.type === 'reasoning') this.patchMessage(sessionId, message.id, { reasoning: current().reasoning + event.text });
          if (event.type === 'tool') {
            const steps = current().steps;
            const previous = steps.find(item => item.id === event.id);
            const step = { id: event.id, label: event.label, status: event.status, detail: event.detail, startedAt: previous?.startedAt ?? Date.now(), finishedAt: event.status === 'running' ? undefined : Date.now() };
            this.patchMessage(sessionId, message.id, { phase: event.status === 'running' ? event.label : '正在整理回复与方案', steps: previous ? steps.map(item => item.id === event.id ? step : item) : [...steps, step] });
          }
        },
      });
      if (this.active !== run) return;
      if ([!!result.plan, !!result.changes, !!result.questions?.length].filter(Boolean).length > 1) throw new Error('返回了冲突的任务结果，请重试');
      if (result.changes) changesSchema.parse(result.changes);
      this.patchMessage(sessionId, message.id, { content: result.reply, plan: result.plan, changes: result.changes, questions: result.questions,
        planVersion: result.plan ? session.messages.filter(item => item.plan).length + 1 : undefined,
        status: result.questions?.length ? 'waiting-input' : result.plan || result.changes ? 'waiting-approval' : 'completed', finishedAt: Date.now() });
      if (result.changes && this.canvas && result.changes.operations.length <= 12 && result.changes.operations.every(op => op.kind === 'update')) this.applyChanges(sessionId, message.id, true);
    } catch (error) {
      if (this.active !== run) return;
      this.patchMessage(sessionId, message.id, { status: 'failed', error: this.errorText(error, settings.apiKey), finishedAt: Date.now(), steps: current().steps.map(step => step.status === 'running' ? { ...step, status: 'failed' as const, finishedAt: Date.now() } : step) });
    } finally {
      if (this.active === run) { this.active = undefined; this.emit({ activeRun: undefined }); await this.flush(); }
    }
  }
  stop() {
    const run = this.active;
    if (!run) return;
    this.active = undefined;
    run.controller.abort();
    const message = this.session(run.sessionId)?.messages.find(item => item.id === run.messageId);
    this.patchMessage(run.sessionId, run.messageId, { status: 'cancelled', finishedAt: Date.now(), steps: message?.steps.map(step => step.status === 'running' ? { ...step, status: 'cancelled' as const, finishedAt: Date.now() } : step) ?? [] });
    this.emit({ activeRun: undefined });
    void this.flush();
  }
  async retry(sessionId: string, messageId: string) {
    const session = this.session(sessionId);
    const message = session?.messages.find(item => item.id === messageId);
    if (!session || session.archived || !message || this.active || !['failed', 'cancelled', 'interrupted'].includes(message.status) || session.messages.at(-1)?.id !== messageId) return;
    if (!this.state.settings.apiKey.trim()) throw new Error('请先配置 API Key');
    await this.start(sessionId, structuredClone(this.canvas?.capture(message.context) ?? message.context));
  }
  async regenerate(sessionId: string, messageId: string) {
    const session = this.session(sessionId), message = session?.messages.find(item => item.id === messageId);
    if (!session || !message || this.active || session.archived || message.role !== 'assistant' || session.messages.at(-1)?.id !== messageId || message.status === 'waiting-input') return;
    if (!this.state.settings.apiKey.trim()) throw new Error('请先配置 API Key');
    const context = structuredClone(this.canvas?.capture(message.context) ?? message.context);
    if (message.status === 'waiting-approval') this.dismiss(sessionId, messageId);
    await this.start(sessionId, context);
  }
  updateQuestionDraft(sessionId: string, messageId: string, questionDraft: NonNullable<ConversationMessage['questionDraft']>) {
    const session = this.session(sessionId);
    if (session?.archived || session?.messages.find(message => message.id === messageId)?.status !== 'waiting-input') return;
    this.patchMessage(sessionId, messageId, { questionDraft });
  }
  async answer(sessionId: string, messageId: string, answers: Record<string, string>) {
    const message = this.session(sessionId)?.messages.find(item => item.id === messageId);
    if (!message || this.session(sessionId)?.archived || message.status !== 'waiting-input' || this.active) return;
    if (!this.state.settings.apiKey.trim()) throw new Error('请先在设置中填写 API Key');
    if (message.questions?.some(question => question.required && !answers[question.id]?.trim())) throw new Error('请回答所有必答问题');
    const context = this.canvas?.capture(message.context) ?? message.context;
    const content = message.questions?.map(question => `${question.title}\n${answers[question.id]?.trim() || '已跳过（选答）'}`).join('\n\n') ?? '';
    this.patchMessage(sessionId, messageId, { status: 'completed', answers });
    await this.send(sessionId, content, context);
  }
  dismiss(sessionId: string, messageId: string) {
    const message = this.session(sessionId)?.messages.find(item => item.id === messageId);
    if (message && !this.session(sessionId)?.archived && ['waiting-input', 'waiting-approval'].includes(message.status)) this.patchMessage(sessionId, messageId, { status: message.plan || message.changes ? 'declined' : 'cancelled' });
  }
  private applied(sessionId: string, message: ConversationMessage, applied: AppliedArtifact) {
    this.patchMessage(sessionId, message.id, { applied, status: 'completed', error: undefined });
    // A new artifact becomes the next visible editing target, unless the draft was retargeted during the run.
    const session = this.session(sessionId)!;
    if (message.plan && same(session.references ?? [], message.context.references ?? [])) this.updateSession(sessionId, { references: [{ kind: 'canvas', role: 'target', id: `canvas:${applied.pageId}:${applied.elementId}`, projectId: message.context.projectId, pageId: applied.pageId, pageName: message.context.pageName, nodeId: applied.elementId, name: applied.name }] });
    void this.flush();
  }
  applyChanges(sessionId: string, messageId: string, automatic = false) {
    const message = this.session(sessionId)?.messages.find(item => item.id === messageId);
    if (!message?.changes || !this.canvas || (!automatic && this.active) || this.session(sessionId)?.archived || message.status !== 'waiting-approval' || message.applied) return;
    try { this.applied(sessionId, message, this.canvas.apply(message.changes, message.context, message.id)); }
    catch (error) { this.patchMessage(sessionId, messageId, { error: this.errorText(error) }); }
  }
  undo(sessionId: string, messageId: string) {
    const message = this.session(sessionId)?.messages.find(item => item.id === messageId);
    if (!message?.applied || !this.canvas || this.active || this.session(sessionId)?.archived) return;
    try { this.canvas.undo(message.applied); this.patchMessage(sessionId, messageId, { error: undefined }); }
    catch (error) { this.patchMessage(sessionId, messageId, { error: this.errorText(error) }); }
  }
  apply(sessionId: string, messageId: string, generate: (plan: PrototypePlan, context: AgentContext, id: string) => AppliedArtifact) {
    const message = this.session(sessionId)?.messages.find(item => item.id === messageId);
    if (!message?.plan || this.active || this.session(sessionId)?.archived || message.status !== 'waiting-approval' || message.applied) return;
    try {
      const applied = generate(message.plan, message.context, message.id);
      this.applied(sessionId, message, applied);
    } catch (error) { this.patchMessage(sessionId, messageId, { error: this.errorText(error) }); }
  }
}
