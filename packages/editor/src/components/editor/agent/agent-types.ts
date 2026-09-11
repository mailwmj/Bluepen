import type { PrototypePlan } from './prototype-plan';

export interface AgentSettings { baseUrl: string; apiKey: string; model: string }
export const defaultAgentSettings: AgentSettings = { baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4.1-mini' };
export interface AgentQuestion { id: string; title: string; options: string[]; multiple: boolean; required: boolean }
export interface AgentContext {
  projectId: string;
  pageId: string;
  pageName: string;
  anchor?: { x: number; y: number };
}
export type AgentEvent =
  | { type: 'phase'; label: string }
  | { type: 'reasoning'; text: string }
  | { type: 'tool'; id: string; label: string; status: 'running' | 'completed' | 'failed'; detail: string };
export interface AgentResult { reply: string; plan?: PrototypePlan; questions?: AgentQuestion[] }
export interface AppliedArtifact { pageId: string; elementId: string; name: string }
export type RunStatus = 'running' | 'waiting-input' | 'waiting-approval' | 'completed' | 'failed' | 'cancelled' | 'interrupted' | 'declined';
export interface AgentStep { id: string; label: string; status: 'running' | 'completed' | 'failed' | 'cancelled'; detail: string }
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  status: RunStatus;
  context: AgentContext;
  model?: string;
  phase?: string;
  finishedAt?: number;
  steps: AgentStep[];
  reasoning: string;
  questions?: AgentQuestion[];
  answers?: Record<string, string>;
  questionDraft?: Record<string, { choices: string[]; custom: string }>;
  plan?: PrototypePlan;
  planVersion?: number;
  applied?: AppliedArtifact;
  error?: string;
}
export interface AgentSession {
  id: string;
  projectId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  draft: string;
  model: string;
  scrollTop: number;
  messages: ConversationMessage[];
}
export interface AgentHistory { version: 1; sessions: AgentSession[]; selected: Record<string, string> }

export function agentId() { return globalThis.crypto.randomUUID(); }
