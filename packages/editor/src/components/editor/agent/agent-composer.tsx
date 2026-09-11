"use client";

import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { AtSign, ImagePlus, Layers, X } from 'lucide-react';
import { Button } from '@bluepen/editor/components/ui/button';
import { Input } from '@bluepen/editor/components/ui/input';
import { Textarea } from '@bluepen/editor/components/ui/textarea';
import { library } from '../library/index';
import { processImageFile } from '../utils/image';
import { AgentReferenceList } from './agent-references';
import { mergeAgentReferences } from './agent-document';
import { agentId, type AgentReference } from './agent-types';

export function AgentComposer({ sessionId, draft, references, candidates, disabled, busy, composerRef, selectedCount, onSelection, onDraft, onReferences, onSend, onError, onLocate, isMissing, onUploadState }: {
  onUploadState: (busy: boolean) => void;
  sessionId: string; draft: string; references: AgentReference[]; candidates: AgentReference[]; disabled: boolean; busy: boolean;
  composerRef: RefObject<HTMLTextAreaElement | null>; selectedCount: number; onSelection: () => void;
  onDraft: (value: string) => void; onReferences: (references: AgentReference[]) => void; onSend: () => void; onError: (error: string) => void;
  onLocate: (ref: Extract<AgentReference, { kind: 'canvas' }>) => void; isMissing: (ref: AgentReference) => boolean;
}) {
  const [picker, setPicker] = useState(false), [query, setQuery] = useState(''), [active, setActive] = useState(0), [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null), latest = useRef({ sessionId, references, disabled });
  latest.current = { sessionId, references, disabled };
  const mention = useRef(false), listId = useId();
  useEffect(() => { if (picker) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active, picker, listId]);
  useEffect(() => { setPicker(false); setQuery(''); setActive(0); }, [sessionId]);
  const options = candidates.filter(ref => !references.some(existing => existing.id === ref.id) && `${ref.name} ${ref.kind === 'canvas' ? ref.pageName : ref.kind === 'catalog' ? ref.componentType : ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 40);
  const add = (incoming: AgentReference[]) => {
    try { onReferences(mergeAgentReferences(latest.current.references, incoming)); onError(''); }
    catch (error) { onError(error instanceof Error ? error.message : '添加引用失败'); }
  };
  const pick = (ref: AgentReference) => {
    add([ref]); if (mention.current) onDraft(draft.replace(/@[^\s@]*$/, ''));
    setPicker(false); setQuery(''); mention.current = false; composerRef.current?.focus();
  };
  const images = async (files: File[]) => {
    if (!files.length || uploading || disabled) return;
    if (references.filter(ref => ref.kind === 'image').length + files.length > 4) { onError('最多添加 4 张参考图片'); return; }
    if (files.some(file => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024)) { onError('支持 PNG、JPEG、WebP，每张不超过 8 MB'); return; }
    const owner = sessionId;
    setUploading(true); onUploadState(true); onError('');
    try {
      const incoming: AgentReference[] = [];
      for (const file of files) {
        const image = await processImageFile(file, 1600);
        if (image.dataUrl.length > 3_000_000) throw new Error('图片处理后仍过大，请压缩后添加');
        incoming.push({ kind: 'image', id: agentId(), role: 'reference', name: file.name || '粘贴的图片', dataUrl: image.dataUrl });
      }
      if (latest.current.sessionId === owner && !latest.current.disabled) add(incoming);
    } catch (error) { if (latest.current.sessionId === owner) onError(error instanceof Error ? error.message : '图片读取失败'); }
    finally { setUploading(false); onUploadState(false); }
  };
  const navigate = (event: React.KeyboardEvent) => {
    if (!picker || event.nativeEvent.isComposing) return false;
    if (event.key === 'Escape') { event.preventDefault(); setPicker(false); return true; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(0, Math.min(options.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))); return true; }
    if (event.key === 'Enter' && options[active]) { event.preventDefault(); pick(options[active]); return true; }
    return false;
  };
  return <div className="relative space-y-3" onDragOver={event => { if (!disabled) { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'copy'; } }} onDrop={event => {
    event.preventDefault(); event.stopPropagation(); if (disabled) return;
    if (event.dataTransfer.files.length) { void images([...event.dataTransfer.files]); return; }
    try { const item = JSON.parse(event.dataTransfer.getData('application/json')); const component = library.find(entry => entry.type === item.type); if (component) add([{ kind: 'catalog', id: `catalog:${component.type}`, role: 'reference', name: component.label, componentType: component.type }]); } catch { onError('请拖入组件库中的组件或参考图片'); }
  }}>
    <AgentReferenceList references={references} onRemove={disabled ? undefined : id => onReferences(references.filter(ref => ref.id !== id))} onRole={disabled ? undefined : (id, role) => onReferences(references.map(ref => ref.id === id && ref.kind === 'canvas' ? { ...ref, role } : ref))} onLocate={onLocate} isMissing={isMissing} />
    {picker && <div className="absolute bottom-full left-0 z-30 mb-2 w-full rounded-xl border border-border-visible bg-surface p-2" aria-label="选择会话引用">
      <div className="mb-2 flex gap-1"><Input autoFocus={!mention.current} aria-label="搜索组件或图层" placeholder="搜索当前项目或组件库…" value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={navigate} /><Button variant="ghost" size="icon-sm" aria-label="关闭引用选择" onClick={() => setPicker(false)}><X /></Button></div>
      <div id={listId} role="listbox" aria-label="可引用对象" className="max-h-56 overflow-y-auto">{options.map((ref, index) => <button type="button" key={ref.id} id={`${listId}-${index}`} role="option" aria-selected={index === active} className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs ${index === active ? 'bg-surface-raised' : 'hover:bg-surface-raised'}`} onClick={() => pick(ref)}><span className="truncate">{ref.name}</span><span className="shrink-0 font-mono text-[11px] text-muted-foreground">{ref.kind === 'canvas' ? ref.pageName : '组件库参考'}</span></button>)}{!options.length && <p className="px-2 py-4 text-xs text-muted-foreground">没有匹配对象，试试其他名称。</p>}</div>
    </div>}
    <Textarea ref={composerRef} value={draft} disabled={disabled} aria-label="发送给 AI 助手" aria-controls={picker ? listId : undefined} aria-activedescendant={picker && options[active] ? `${listId}-${active}` : undefined} onChange={event => {
      onDraft(event.target.value); const match = event.target.value.match(/@([^\s@]*)$/);
      if (match && !(event.nativeEvent as InputEvent).isComposing) { mention.current = true; setQuery(match[1]); setActive(0); setPicker(true); } else if (mention.current) { setPicker(false); mention.current = false; }
    }} onKeyDown={event => { if (navigate(event)) return; if (!event.nativeEvent.isComposing && event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); if (!busy && !uploading) onSend(); } }} onPaste={event => { const files = [...event.clipboardData.files]; if (files.length) { event.preventDefault(); event.stopPropagation(); void images(files); } }} placeholder="描述修改，输入 @ 引用对象；可粘贴或拖入图片…" className="min-h-24 max-h-44 resize-y text-sm" />
    <div className="flex flex-wrap items-center gap-1"><Button variant="ghost" size="icon-sm" aria-label="添加引用" title="引用组件、组合或模板（@）" disabled={disabled} onClick={() => { mention.current = false; setQuery(''); setActive(0); setPicker(!picker); }}><AtSign /></Button><Button variant="ghost" size="icon-sm" aria-label="添加参考图片" disabled={disabled || uploading} onClick={() => input.current?.click()}><ImagePlus /></Button>{selectedCount > 0 && <Button variant="ghost" size="xs" disabled={disabled} onClick={onSelection}><Layers className="size-3.5" />添加选区 · {selectedCount}</Button>}{uploading && <span role="status" className="font-mono text-[11px] text-muted-foreground">[处理图片…]</span>}</div>
    <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="选择参考图片文件" onChange={event => { void images([...(event.target.files ?? [])]); event.target.value = ''; }} />
    {references.some(ref => ref.kind === 'image') && <p className="text-[11px] leading-4 text-muted-foreground">发送时，参考图片将交给当前模型分析。</p>}
  </div>;
}
