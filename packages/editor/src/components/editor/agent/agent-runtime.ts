import type { PrototypePlan } from "./prototype-plan";
import { starterPlan } from "./prototype-plan";

export interface AgentSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AgentMessage { role: "user" | "assistant"; content: string; }

/** Provider boundary. A Vercel AI SDK implementation can be injected without changing the editor. */
export type AgentProvider = (input: { messages: AgentMessage[]; settings: AgentSettings }) => Promise<{ reply: string; plan?: PrototypePlan }>;

export const offlineAgentProvider: AgentProvider = async ({ messages }) => {
  const prompt = messages.filter((message) => message.role === "user").at(-1)?.content ?? "灵感模板页面";
  return {
    reply: `我整理了一个静态页面方案：${prompt}。Hover、点击等动态行为会先用可见控件表达。确认后可以生成到画布。`,
    plan: starterPlan(prompt),
  };
};

/** OpenAI Responses-compatible transport. It is deliberately kept behind the provider boundary. */
export const responsesAgentProvider: AgentProvider = async ({ messages, settings }) => {
  if (!settings.apiKey.trim()) return offlineAgentProvider({ messages, settings });
  const endpoint = `${settings.baseUrl.replace(/\/$/, "")}/responses`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${settings.apiKey}` },
    body: JSON.stringify({
      model: settings.model,
      stream: false,
      instructions: "You are Bluepen's prototype planning agent. Use existing components only. Return concise Chinese assistant text and a JSON prototype plan when the user has confirmed generation.",
      input: messages.map((message) => ({ role: message.role, content: [{ type: "input_text", text: message.content }] })),
      text: { format: { type: "json_schema", name: "bluepen_agent_result", strict: true, schema: { type: "object", properties: { reply: { type: "string" }, plan: { type: ["object", "null"] } }, required: ["reply", "plan"], additionalProperties: false } } },
    }),
  });
  if (!response.ok) throw new Error(`Responses API ${response.status}`);
  const payload = await response.json() as { output_text?: string };
  const parsed = JSON.parse(payload.output_text ?? "{}");
  return { reply: String(parsed.reply ?? "已更新方案。"), plan: parsed.plan ?? undefined };
};

let provider: AgentProvider = responsesAgentProvider;
export function setAgentProvider(next: AgentProvider) { provider = next; }
export function runAgent(input: Parameters<AgentProvider>[0]) { return provider(input); }
