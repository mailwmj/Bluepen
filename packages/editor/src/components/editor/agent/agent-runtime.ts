import type { AgentContext, AgentEvent, AgentResult, AgentSettings } from './agent-types';
export type { AgentSettings } from './agent-types';
import { createOpenAI } from '@ai-sdk/openai';
import { APICallError, NoObjectGeneratedError, NoOutputGeneratedError, Output, streamText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { library } from '../library/index';
import { agentOutputSchema, decodePlan } from './prototype-output';

// Replaced by Next at build time; an exported desktop build has no web proxy.
declare const process: { env: { NEXT_PUBLIC_TOKENBOX_PROXY?: string } };

export interface AgentMessage { role: 'user' | 'assistant'; content: string; }
export type AgentProvider = (input: {
  messages: AgentMessage[];
  settings: AgentSettings;
  signal?: AbortSignal;
  onReply?: (reply: string) => void;
  onEvent?: (event: AgentEvent) => void;
  context?: AgentContext;
}) => Promise<AgentResult>;

/** SDK orchestration stays here; the runtime never mutates the canvas. */
export const responsesAgentProvider: AgentProvider = async ({ messages, settings, signal, onReply, onEvent, context }) => {
  if (!settings.apiKey.trim()) throw new Error('请先在设置 → AI 服务中填写 API Key');
  if (!settings.model.trim()) throw new Error('请填写当前分组支持的模型名称');
  let parsed: URL;
  try { parsed = new URL(settings.baseUrl.trim()); }
  catch { throw new Error('API Base URL 必须是有效的 http:// 或 https:// 地址'); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('API Base URL 必须使用 HTTP(S)，且不能包含认证信息、查询参数或片段');
  }
  const baseUrl = parsed.href.replace(/\/+$/, '');
  const desktop = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  const proxy = process.env.NEXT_PUBLIC_TOKENBOX_PROXY;
  const useProxy = !desktop && typeof window !== 'undefined' && proxy && baseUrl === 'https://tokbox-api.netease.im';
  const requestFetch = desktop ? (await import('@tauri-apps/plugin-http')).fetch : globalThis.fetch;
  const openai = createOpenAI({
    apiKey: settings.apiKey.trim(),
    baseURL: useProxy ? `${window.location.origin}${proxy}` : baseUrl,
    fetch: requestFetch,
  });
  onEvent?.({ type: 'phase', label: '正在连接模型' });
  const agentSettings = {
    model: openai.responses(settings.model.trim()),
    maxRetries: 0,
    stopWhen: stepCountIs(5),
    providerOptions: { openai: { store: false } },
    system: `你是 Bluepen 原型规划 Agent。与用户多轮讨论要生成的原型，回复中文。
需求不明确时通过 questions 返回 1–3 个关键澄清问题，plan 为 null，不要在 reply 重复问题。每题 id 唯一，title 清晰，options 可给出 2–4 个简短选项或空数组供自由输入，multiple 表示多选，required 表示必须回答。不需要澄清时 questions 为空数组。不同时返回问题和方案。
需求明确时先查询组件目录，然后给出与产物范围匹配的完整可编辑静态方案，等待用户在界面确认后生成。你只能规划新增原型，不要声称已读取或修改现有画布。用户要求修改既有内容时说明可以讨论并生成一个新版本。
使用 searchComponents 查询当前已有组件及其合法 props 和默认尺寸。只使用目录中组件；group 可分组但 props 必须为空。
输出节点的 props 为 key/value 数组，只修改目录中存在且类型相符的属性。不输出 HTML、JSX 或脚本。
root 必须为 group，x/y 为 0。所有子节点坐标相对父节点，正尺寸，按 8px 网格排布。根据内容决定页面尺寸，不能把页面裁切到用户选区。
根据用户要的产物设置 artifactKind：完整功能页面或完整屏幕为 page；页面内独立区域为 section；单个控件或可复用组件为 component。不要把单个控件误判为 page。
page 的根组合代表完整页面，客户端会确保它有与根边界一致的页面底板。section 和 component 的根组合默认透明，不要为了包裹内容添加页面底板；只有用户明确要求控件自身带背景时，才使用组件正常所需的局部背景。
动态 Hover/点击/切换用直接可见的按钮、静态状态或弹层稿表达，并写入 notes。完整页面包括用户需要的导航、筛选及内容区域，不能只返回一张示意卡片。
${context ? `用户指定的新增目标页面（仅页面标识，不含现有画布内容）：${JSON.stringify({ pageId: context.pageId, pageName: context.pageName })}` : ''}`,
    tools: {
      searchComponents: tool({
        description: '搜索可复用的已有组件与业务模板；空字符串列出全部。返回合法属性、默认值与尺寸。',
        inputSchema: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
          return library.filter(item => !terms.length || terms.some(term => `${item.type} ${item.label} ${item.category}`.toLowerCase().includes(term)));
        },
      }),
    },
    output: Output.object({ schema: agentOutputSchema }),
  };
  let streamError: unknown;
  try {
    const stream = streamText({ ...agentSettings, messages, abortSignal: signal, timeout: 180_000,
      onError: ({ error }) => { streamError = error; },
      onChunk: ({ chunk }) => {
        if (chunk.type === 'reasoning-delta') onEvent?.({ type: 'reasoning', text: chunk.text });
        if (chunk.type === 'tool-call') onEvent?.({ type: 'tool', id: chunk.toolCallId, label: '查询组件目录', status: 'running', detail: chunk.input && typeof chunk.input === 'object' && 'query' in chunk.input && typeof chunk.input.query === 'string' ? chunk.input.query : '' });
        if (chunk.type === 'tool-result') onEvent?.({ type: 'tool', id: chunk.toolCallId, label: '查询组件目录', status: 'completed', detail: Array.isArray(chunk.output) ? `找到 ${chunk.output.length} 个可用组件` : '查询完成' });
        if (chunk.type === 'tool-error') onEvent?.({ type: 'tool', id: chunk.toolCallId, label: '查询组件目录', status: 'failed', detail: '组件查询失败' });
      },
    });
    let replying = false;
    for await (const partial of stream.partialOutputStream) {
      if (!replying) { replying = true; onEvent?.({ type: 'phase', label: '正在整理回复与方案' }); }
      if (typeof partial.reply === 'string') onReply?.(partial.reply);
    }
    // Do not create SDK result promises on a failed stream: preserve the actual
    // transport error instead of the derived NoOutputGeneratedError.
    if (streamError) throw streamError;
    if (signal?.aborted) throw new Error('请求已取消');
    const output = await stream.output;
    if (output.questions.length > 3 || new Set(output.questions.map(q => q.id)).size !== output.questions.length || output.questions.some(q => !q.id.trim() || !q.title.trim())) throw new Error('澄清问题格式无效，请重试');
    if (output.questions.length && output.plan) throw new Error('接口同时返回问题和方案，请重试');
    if (output.plan) onEvent?.({ type: 'phase', label: '正在验证原型结构' });
    return { reply: output.reply, plan: output.plan ? decodePlan(output.plan) : undefined, questions: output.questions };
  } catch (error) {
    error = streamError ?? error;
    if (signal?.aborted) throw new Error('请求已取消');
    if (APICallError.isInstance(error)) {
      if (error.statusCode === 401) throw new Error('API Key 无效或已过期（401），请前往设置 → AI 服务');
      if (error.statusCode === 403) throw new Error('接口拒绝访问（403），请检查模型分组权限和网络');
      if (error.statusCode === 404) throw new Error('找不到 Responses 接口或模型（404），请检查 Base URL 和模型名称');
      if (error.statusCode === 429) throw new Error('接口限流或额度不足（429），请稍后重试');
      if (!error.statusCode) throw new Error('无法连接 API，请检查网络、Base URL 和服务的 CORS 支持');
      let detail = '';
      try {
        const body = JSON.parse(error.responseBody ?? '{}');
        const message = body.error?.message ?? body.message;
        if (typeof message === 'string') detail = message.replaceAll(settings.apiKey.trim(), '[已隐藏]').slice(0, 300);
      } catch { /* Do not display proxy HTML or arbitrary response bodies. */ }
      throw new Error(`Responses 请求失败（${error.statusCode}）${detail ? `：${detail}` : '，请检查接口配置后重试'}`);
    }
    if (NoObjectGeneratedError.isInstance(error) || NoOutputGeneratedError.isInstance(error)) {
      throw new Error('接口未返回完整、有效的原型方案，可能已超时或输出被截断，请重试');
    }
    if (error instanceof TypeError && /fetch/i.test(error.message)) {
      throw new Error('无法连接 API，请检查网络、Base URL 和服务的 CORS 支持');
    }
    throw error;
  }
};
let provider: AgentProvider = responsesAgentProvider;
export function setAgentProvider(next: AgentProvider) { provider = next; }
export function runAgent(input: Parameters<AgentProvider>[0]) { return provider(input); }
