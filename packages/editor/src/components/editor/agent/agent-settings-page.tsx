"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, Check, KeyRound, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogPortal, DialogPrimitive, DialogTitle, DialogDescription } from '@bluepen/editor/components/ui/dialog';
import { Button } from '@bluepen/editor/components/ui/button';
import { Input } from '@bluepen/editor/components/ui/input';
import { isDesktop } from '../hooks/use-desktop';
import { runAgent } from './agent-runtime';
import type { AgentController } from './agent-controller';

export function AgentSettingsPage({ open, onClose, controller }: { open: boolean; onClose: () => void; controller: AgentController }) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [form, setForm] = useState(state.settings);
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const [status, setStatus] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const test = useRef<AbortController | null>(null);
  useEffect(() => {
    if (open) { setForm(controller.getSnapshot().settings); setStatus(''); setError(''); setLeaving(false); }
    else { test.current?.abort(); test.current = null; }
  }, [open, controller, state.loaded]);
  useEffect(() => () => { test.current?.abort(); }, []);
  const save = async () => {
    setBusy('save'); setError(''); setStatus('');
    try { await controller.saveSettings(form); setStatus('已保存'); setForm(controller.getSnapshot().settings); setLeaving(false); }
    catch (error) { setError(error instanceof Error ? error.message : '设置保存失败，请重试'); }
    finally { setBusy(null); }
  };
  const verify = async () => {
    const request = new AbortController(); test.current = request;
    setBusy('test'); setError(''); setStatus('正在验证连接和生成能力…');
    let usedTool = false;
    try {
      await runAgent({ settings: form, signal: request.signal,
        messages: [{ role: 'user', content: '这是连接测试。必须调用 searchComponents 搜索 button，随后仅回复“连接成功”，plan 为 null，questions 为空。不要生成原型或提出问题。' }],
        onEvent: event => { if (event.type === 'tool' && event.status === 'completed') usedTool = true; },
      });
      if (!usedTool) throw new Error('接口已响应，但未完成组件查询；请确认模型支持工具调用');
      if (test.current === request) setStatus('连接成功 · 工具调用与结构化输出可用');
    } catch (error) {
      if (test.current === request) { setStatus(''); setError(error instanceof Error ? error.message : '连接失败'); }
    } finally { if (test.current === request) { test.current = null; setBusy(null); } }
  };
  const close = () => { if (busy === 'save') return; test.current?.abort(); test.current = null; setBusy(null); if (JSON.stringify(form) !== JSON.stringify(controller.getSnapshot().settings)) { setLeaving(true); return; } onClose(); };
  return <Dialog open={open} onOpenChange={next => { if (!next) close(); }}>
    <DialogPortal>
      <DialogPrimitive.Popup className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground outline-none [&_svg]:stroke-[1.5]" onKeyDown={event => event.stopPropagation()}>
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-6">
          <Button variant="ghost" size="icon" aria-label="返回编辑器" onClick={close}><ArrowLeft /></Button>
          <DialogTitle className="font-mono text-xs font-normal uppercase tracking-wider">设置 / Settings</DialogTitle>
        </header>
        <div className="flex min-h-0 flex-1">
          <nav aria-label="设置分类" className="hidden w-52 shrink-0 border-r border-border p-6 sm:block">
            <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider"><SlidersHorizontal className="size-4" />AI 服务</span>
          </nav>
          <main className="min-w-0 flex-1 overflow-y-auto px-6 py-10 sm:px-12">
            <div className="max-w-xl space-y-8">
              <div className="space-y-3"><h1 className="text-2xl font-medium">连接你的模型</h1><DialogDescription className="text-sm leading-6 text-muted-foreground">配置用于讨论与生成原型的 AI 服务。保存后可在会话中使用。</DialogDescription></div>
              {leaving && <div className="space-y-3 border-b border-border pb-5" role="alert"><p className="text-sm">设置尚未保存，是否放弃修改？</p><div className="flex gap-2"><Button variant="outline" size="pill" onClick={onClose}>放弃修改并返回</Button><Button variant="ghost" onClick={() => setLeaving(false)}>继续编辑</Button></div></div>}
              {state.settingsError && <p role="alert" className="text-sm text-destructive">{state.settingsError}</p>}
              <form className="space-y-6" onSubmit={event => { event.preventDefault(); void save(); }}>
                <fieldset disabled={!!busy} className="space-y-6 disabled:opacity-60">
                  <label className="block space-y-2"><span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">API Base URL</span><Input aria-label="API Base URL" value={form.baseUrl} onChange={event => { setForm({ ...form, baseUrl: event.target.value }); setStatus(''); }} placeholder="https://api.openai.com/v1" className="font-mono" required /><span className="block text-xs text-muted-foreground">使用支持 Responses、工具调用和结构化输出的服务地址。</span></label>
                  <label className="block space-y-2"><span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">API Key</span><Input aria-label="API Key" type="password" autoComplete="off" value={form.apiKey} onChange={event => { setForm({ ...form, apiKey: event.target.value }); setStatus(''); }} placeholder="输入 API Key" className="font-mono" /><span className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><KeyRound className="mt-0.5 size-3.5 shrink-0" />{isDesktop() ? '保存在系统凭据库，不写入项目文件或会话历史。' : '仅保存在本次浏览器会话中；关闭标签页后需要重新填写。'}</span></label>
                  <label className="block space-y-2"><span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">默认模型 / Model</span><Input aria-label="默认模型" value={form.model} onChange={event => { setForm({ ...form, model: event.target.value }); setStatus(''); }} placeholder="输入服务支持的模型名称" className="font-mono" required /></label>
                </fieldset>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" size="pill" disabled={!!busy}>{busy === 'save' ? '保存中…' : '保存设置'}</Button>
                  <Button variant="outline" size="pill" disabled={!!busy || !form.apiKey.trim()} onClick={() => void verify()}>{busy === 'test' ? '验证中…' : '测试连接'}</Button>
                  {busy === 'test' && <Button variant="ghost" onClick={() => { test.current?.abort(); test.current = null; setBusy(null); setStatus('测试已停止'); }}>停止测试</Button>}
                  {!busy && form.apiKey && <Button variant="ghost" onClick={() => { setForm({ ...form, apiKey: '' }); setStatus('点击保存设置以移除凭据'); }}>移除 Key</Button>}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">测试会发起少量模型请求，可能产生费用。未保存的修改不会影响正在运行的会话。</p>
                {status && <p role="status" className="flex items-center gap-2 font-mono text-xs"><Check className="size-3.5" />[{status}]</p>}
                {error && <p role="alert" className="text-sm leading-6 text-destructive">{error}</p>}
              </form>
            </div>
          </main>
        </div>
      </DialogPrimitive.Popup>
    </DialogPortal>
  </Dialog>;
}
