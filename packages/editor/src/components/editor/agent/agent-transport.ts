import { z } from 'zod';
import type { AgentEvent, AgentSettings } from './agent-types';
import type { AgentMessage } from './agent-runtime';
import { agentOutputSchema } from './prototype-output';

/** Adapt wire differences while keeping the SDK's tools, cancellation and schema decoder. */
export function createAgentFetch(requestFetch: typeof fetch, settings: AgentSettings, history: AgentMessage[], onEvent?: (event: AgentEvent) => void): typeof fetch {
  const chat = settings.protocol === 'chat-completions';
  const deepseek = /^deepseek[-/]/i.test(settings.model) || new URL(settings.baseUrl).hostname === 'api.deepseek.com';
  const previousReasoning = history.filter(message => message.role === 'assistant').map(message => message.reasoning ?? '');
  const toolReasoning = new Map<string, string>();
  let jsonMode = chat;
  const schemaInstruction = () => `只输出符合以下 JSON Schema 的完整 JSON 对象，不使用 Markdown 代码围栏。工具查询完成后也必须遵守此结构。\n${JSON.stringify(z.toJSONSchema(agentOutputSchema))}`;
  return async (url, init) => {
    if (typeof init?.body !== 'string') return requestFetch(url, init);
    const body = JSON.parse(init.body);
    const useJsonMode = () => {
      if (chat) {
        body.response_format = { type: 'json_object' };
        body.messages = [{ role: 'system', content: schemaInstruction() }, ...body.messages];
      } else {
        body.text = { ...body.text, format: { type: 'json_object' } };
        body.input = [{ role: 'system', content: schemaInstruction() }, ...body.input];
      }
    };
    if (jsonMode) useJsonMode();
    if (chat && deepseek) {
      if (settings.thinking === 'high') { body.thinking = { type: 'enabled' }; body.reasoning_effort = 'high'; }
      if (settings.thinking === 'off') body.thinking = { type: 'disabled' };
      let previous = 0;
      for (const message of body.messages) {
        if (message.role !== 'assistant') continue;
        const callId = message.tool_calls?.[0]?.id;
        message.reasoning_content = callId ? toolReasoning.get(callId) ?? '' : previousReasoning[previous++] ?? '';
      }
    }
    let response = await requestFetch(url, { ...init, body: JSON.stringify(body) });
    // Retry once only when the service explicitly rejects strict output format.
    // Auth, billing, bad model names and ordinary validation errors never retry.
    if (!jsonMode && response.status === 400) {
      const error = await response.clone().json().catch(() => null);
      const message = error?.error?.message ?? error?.message;
      if (typeof message === 'string' && /response_format|json_schema|text\.format/i.test(message) && /unsupported|not supported|unavailable|not permitted/i.test(message)) {
        jsonMode = true;
        onEvent?.({ type: 'phase', label: '正在使用兼容输出格式' });
        useJsonMode();
        response = await requestFetch(url, { ...init, body: JSON.stringify(body) });
      }
    }
    if (!chat || !response.ok || !response.body) return response;
    // OpenAI's chat decoder ignores reasoning_content. Observe the original SSE
    // without changing its bytes, and replay reasoning for subsequent tool steps.
    const decoder = new TextDecoder();
    let pending = '', reasoning = '';
    const calls = new Set<string>();
    const consume = (text: string) => {
      pending += text;
      let newline: number;
      while ((newline = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, newline).trim(); pending = pending.slice(newline + 1);
        if (!line.startsWith('data:') || line.slice(5).trim() === '[DONE]') continue;
        let delta;
        try { delta = JSON.parse(line.slice(5)).choices?.[0]?.delta; } catch { continue; }
        if (typeof delta?.reasoning_content === 'string') {
          reasoning += delta.reasoning_content;
          onEvent?.({ type: 'reasoning', text: delta.reasoning_content });
        }
        for (const call of delta?.tool_calls ?? []) if (typeof call.id === 'string') calls.add(call.id);
        for (const id of calls) toolReasoning.set(id, reasoning);
      }
    };
    const stream = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) { consume(decoder.decode(chunk, { stream: true })); controller.enqueue(chunk); },
      flush() { consume(decoder.decode() + '\n'); },
    }));
    return new Response(stream, { status: response.status, statusText: response.statusText, headers: response.headers });
  };
}
