"use client";

import { useEffect, useState } from "react";
import { Bot, Send, X, WandSparkles } from "lucide-react";
import { Button } from "@bluepen/editor/components/ui/button";
import { Textarea } from "@bluepen/editor/components/ui/textarea";
import { cn } from "@bluepen/editor/lib/utils";
import type { PrototypePlan } from "./prototype-plan";
import { runAgent, type AgentMessage, type AgentSettings } from "./agent-runtime";

interface AgentPanelProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (plan: PrototypePlan) => void;
  settings?: AgentSettings;
}

export function AgentPanel({ open, onClose, onGenerate, settings = { baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4.1-mini" } }: AgentPanelProps) {
  const [config, setConfig] = useState<AgentSettings>(settings);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState("描述你想做的页面，我会先整理结构，再生成原型。");
  const [plan, setPlan] = useState<PrototypePlan | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem("bluepen:ai-settings"); if (saved) setConfig({ ...settings, ...JSON.parse(saved) }); } catch { /* use defaults */ }
  }, []);
  const saveConfig = (patch: Partial<AgentSettings>) => setConfig((current) => { const next = { ...current, ...patch }; localStorage.setItem("bluepen:ai-settings", JSON.stringify(next)); return next; });
  if (!open) return null;
  const send = async () => {
    const content = draft.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setDraft(""); setBusy(true);
    try {
      const result = await runAgent({ messages: next, settings: config });
      setReply(result.reply);
      if (result.plan) setPlan(result.plan);
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } finally { setBusy(false); }
  };
  return (
    <aside className="absolute right-0 top-0 z-40 flex h-full w-[380px] flex-col border-l border-border-visible bg-surface text-foreground" aria-label="AI 助手">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2"><Bot className="size-4" /><span className="font-mono text-xs font-bold uppercase tracking-wider">AI 助手</span></div>
        <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="关闭 AI 助手"><X className="size-3.5" /></Button>
      </header>
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <div className="space-y-2"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">对话</span><p className="text-sm leading-6">{reply}</p></div>
        {messages.filter((message) => message.role === "user").map((message, index) => <div key={index} className="border-l border-border-visible pl-3 text-xs text-muted-foreground">{message.content}</div>)}
        {plan && <section className="space-y-2 border-t border-border pt-4"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">原型方案</span><h2 className="text-base">{plan.pageName}</h2><p className="text-xs leading-5 text-muted-foreground">{plan.purpose}</p><ul className="space-y-1 text-xs">{plan.root.children?.slice(0, 8).map((node) => <li key={node.name}>· {node.name}</li>)}</ul><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">静态表达动态意图 · 控件直接可见</p><Button className="w-full rounded-full font-mono text-xs uppercase" onClick={() => onGenerate(plan)}><WandSparkles className="size-3.5" />按此方案生成</Button></section>}
      </div>
      <div className="border-t border-border p-3 space-y-2"><details><summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground">BYOK 设置</summary><div className="mt-2 space-y-2"><input className="h-8 w-full border border-border-visible bg-background px-2 font-mono text-[11px]" value={config.baseUrl} onChange={(e) => saveConfig({ baseUrl: e.target.value })} aria-label="API Base URL" placeholder="API Base URL" /><input className="h-8 w-full border border-border-visible bg-background px-2 font-mono text-[11px]" type="password" value={config.apiKey} onChange={(e) => saveConfig({ apiKey: e.target.value })} aria-label="API Key" placeholder="API Key" /><input className="h-8 w-full border border-border-visible bg-background px-2 font-mono text-[11px]" value={config.model} onChange={(e) => saveConfig({ model: e.target.value })} aria-label="模型" placeholder="模型" /></div></details><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void send(); } }} placeholder="描述页面目标、内容和用户任务…" className="min-h-24 resize-none" /><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase text-muted-foreground">⌘/Ctrl + Enter 发送</span><Button size="sm" className={cn("rounded-full font-mono text-xs uppercase")} onClick={() => void send()} disabled={!draft.trim() || busy}><Send className="size-3.5" />{busy ? "处理中" : "发送"}</Button></div></div>
    </aside>
  );
}
