"use client";

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Square, X } from 'lucide-react';
import { cn } from '@bluepen/editor/lib/utils';
import type { AgentStep, RunStatus } from './agent-types';

/** Tertiary layer: every label is Space Mono, 11px, ALL CAPS. */
export const labelClass = 'font-mono text-[11px] uppercase text-muted-foreground';
/** Primary red stays reserved for failure: it is applied to the failing value, never to a row. */
const failureClass = 'text-destructive';

export const statusLabels: Record<RunStatus, string> = { running: '执行中', 'waiting-input': '等待回答', 'waiting-approval': '等待确认', completed: '已完成', failed: '请求失败', cancelled: '已停止', interrupted: '已中断', declined: '未采用' };
const stepLabels: Record<AgentStep['status'], string> = { running: '执行中', completed: '完成', failed: '失败', cancelled: '停止' };

/** Mechanical readout: one decimal below a second, whole seconds above it. */
function formatDuration(milliseconds: number) {
  const value = Math.max(0, milliseconds);
  return value < 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value / 1000)}s`;
}

/**
 * Live duration readout. It ticks only while the run is unfinished, and it is hidden from assistive
 * technology so a streaming turn is not announced once per second.
 */
export function AgentElapsed({ startedAt, finishedAt, className }: { startedAt: number; finishedAt?: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (finishedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finishedAt]);
  return <span aria-hidden="true" className={cn('shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground', className)}>{formatDuration((finishedAt ?? now) - startedAt)}</span>;
}

/**
 * One block per step that actually exists. There is no total to divide by and no percentage to
 * invent, so an unknown-length run shows no bar at all instead of a fabricated one.
 */
function StepMeter({ steps }: { steps: AgentStep[] }) {
  if (!steps.length) return null;
  return <div aria-hidden="true" className="flex h-1 gap-0.5">{steps.map(step => <span key={step.id} className={cn('h-full min-w-2 flex-1',
    step.status === 'completed' && 'bg-foreground',
    step.status === 'running' && 'bg-foreground/35',
    step.status === 'failed' && 'border border-destructive',
    step.status === 'cancelled' && 'bg-border-visible')} />)}</div>;
}

function StepGlyph({ status }: { status: AgentStep['status'] }) {
  if (status === 'running') return <span aria-hidden="true" className="size-2 shrink-0 bg-foreground" />;
  if (status === 'completed') return <Check aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />;
  if (status === 'failed') return <X aria-hidden="true" className={cn('size-3.5 shrink-0', failureClass)} />;
  return <Square aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />;
}

function StepRow({ step }: { step: AgentStep }) {
  return <li className="space-y-1">
    <div className="flex items-baseline justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 text-xs"><StepGlyph status={step.status} /><span className="truncate">{step.label}</span></span>
      <span className="flex shrink-0 items-baseline gap-2">
        <span className={labelClass}>{stepLabels[step.status]}</span>
        {step.startedAt && <AgentElapsed startedAt={step.startedAt} finishedAt={step.finishedAt} />}
      </span>
    </div>
    {step.detail && <p className="break-words pl-5 text-xs leading-5 text-muted-foreground">{step.detail}</p>}
  </li>;
}

/**
 * The running turn reads as an instrument: current phase as the primary line, step count and elapsed
 * time as monospace telemetry, and a segmented meter underneath. It renders only while the model is
 * actually working, so no state is invented for turns that are waiting on the user.
 */
export function AgentPhaseReadout({ phase, steps, startedAt }: { phase?: string; steps: AgentStep[]; startedAt: number }) {
  const completed = steps.filter(step => step.status === 'completed').length;
  const failed = steps.some(step => step.status === 'failed');
  return <div className="space-y-2">
    <div className="flex items-baseline justify-between gap-3">
      <span role="status" className="flex min-w-0 items-center gap-2 text-sm text-foreground">
        <span aria-hidden="true" className="size-2 shrink-0 bg-foreground" />
        <span className="truncate">{phase || '正在分析需求'}</span>
      </span>
      <span className="flex shrink-0 items-baseline gap-2">
        {steps.length > 0 && <span className={labelClass}>{failed ? 'FAILED' : 'STEP'} {completed}/{steps.length}</span>}
        <AgentElapsed startedAt={startedAt} />
      </span>
    </div>
    <StepMeter steps={steps} />
  </div>;
}

/**
 * Execution steps stay visible while running and fold back into a summary line once the turn ends,
 * so the message body keeps the space it needs for the actual answer and the result cards.
 */
export function AgentStepTimeline({ steps, running }: { steps: AgentStep[]; running: boolean }) {
  if (!steps.length) return null;
  const completed = steps.filter(step => step.status === 'completed').length;
  const rows = <ol className="space-y-3">{steps.map(step => <StepRow key={step.id} step={step} />)}</ol>;
  // While running, the phase readout above already carries the step count: the rows add no second one.
  if (running) return <section aria-label="执行进度">{rows}</section>;
  return <details className="group">
    <summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-muted-foreground"><ChevronDown className="size-3.5 transition-transform duration-150 group-open:rotate-180" />已完成 {completed} 步</summary>
    <div className="mt-3">{rows}</div>
  </details>;
}
