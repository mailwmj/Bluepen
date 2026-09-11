"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogPortal, DialogPrimitive, DialogTitle, DialogDescription } from '@bluepen/editor/components/ui/dialog';
import { Button } from '@bluepen/editor/components/ui/button';
import { ElementRenderer } from '../canvas/elements/index';
import { getLayoutElements } from '../utils/layout-elements';
import type { EditorElement } from '../types';

function PreviewNode({ element }: { element: EditorElement }) {
  if (!element.visible) return null;
  return <div style={{ position: 'absolute', left: element.x, top: element.y, width: element.width, height: element.height, opacity: element.opacity, transform: `rotate(${element.rotation}deg)` }}>
    <ElementRenderer element={element} previewing>{element.children.map(child => <PreviewNode key={child.id} element={child} />)}</ElementRenderer>
  </div>;
}
/** The same component renderer as the editable canvas; no screenshot or placeholder drawing. */
export function AgentCanvasPreview({ elements, height = 180, label = '原型预览' }: { elements: EditorElement[]; height?: number; label?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(container.current); return () => observer.disconnect();
  }, []);
  const bounds = useMemo(() => {
    const visible = getLayoutElements(elements).filter(node => node.visible);
    if (!visible.length) return { x: 0, y: 0, width: 1, height: 1 };
    const x = Math.min(...visible.map(node => node.x)), y = Math.min(...visible.map(node => node.y));
    return { x, y, width: Math.max(...visible.map(node => node.x + node.width)) - x, height: Math.max(...visible.map(node => node.y + node.height)) - y };
  }, [elements]);
  const scale = Math.max(0.001, Math.min((width - 32) / bounds.width, (height - 32) / bounds.height, 1));
  return <div ref={container} role="img" aria-label={label} className="relative w-full overflow-hidden rounded-lg border border-border bg-background" style={{ height }}>
    {!elements.length ? <span className="absolute inset-0 grid place-content-center font-mono text-[11px] text-muted-foreground">[无对象]</span> : <div inert aria-hidden className="pointer-events-none absolute origin-top-left select-none" style={{ left: (width - bounds.width * scale) / 2, top: (height - bounds.height * scale) / 2, width: bounds.width, height: bounds.height, transform: `scale(${scale})` }}>
      <div style={{ position: 'absolute', left: -bounds.x, top: -bounds.y }}>{elements.map(element => <PreviewNode key={element.id} element={element} />)}</div>
    </div>}
  </div>;
}
export function AgentPreviewDialog({ preview, title, onClose }: { preview: { before: EditorElement[]; after: EditorElement[] } | null; title: string; onClose: () => void }) {
  return <Dialog open={!!preview} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogPortal>
      <DialogPrimitive.Backdrop className="nd-overlay fixed inset-0 z-50 bg-black/80" />
      <DialogPrimitive.Viewport className="fixed inset-0 z-50 grid place-items-center p-4">
        <DialogPrimitive.Popup className="nd-overlay relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border-visible bg-surface p-6 outline-none" onKeyDown={event => event.stopPropagation()}>
          <div className="mb-6 flex items-start justify-between gap-4"><div className="space-y-2"><DialogTitle className="text-base font-medium">{title}</DialogTitle><DialogDescription>使用当前组件渲染的静态预览，关闭后可确认或继续调整。</DialogDescription></div><DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />} aria-label="关闭修改预览"><X /></DialogPrimitive.Close></div>
          {preview && (preview.before.length ? <div className="grid gap-6 md:grid-cols-2">{(['before', 'after'] as const).map(side => <div key={side} className="space-y-3"><p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{side === 'before' ? '修改前' : '修改后'}</p><AgentCanvasPreview elements={preview[side]} height={420} label={side === 'before' ? '修改前画布' : '修改后画布'} /></div>)}</div> : <AgentCanvasPreview elements={preview.after} height={420} label="新增原型预览" />)}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPortal>
  </Dialog>;
}
