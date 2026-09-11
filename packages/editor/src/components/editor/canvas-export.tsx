"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "./canvas";
import type { EditorElement } from "./types";
import { exportArtworkPng } from "./utils/export-png";

const noop = () => {};

/** A fixed snapshot uses the same renderer, without selection, zoom or editor chrome. */
export function CanvasExport({ elements, onComplete, onError }: {
  elements: EditorElement[];
  onComplete: (blob: Blob) => void;
  onError: (error: unknown) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onComplete, onError });
  callbacks.current = { onComplete, onError };
  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      const artwork = host.current?.querySelector<HTMLElement>("[data-canvas-area]");
      if (!artwork) { callbacks.current.onError(new Error("画布尚未就绪，请重试")); return; }
      void exportArtworkPng(artwork).then(blob => { if (!cancelled) callbacks.current.onComplete(blob); }, error => { if (!cancelled) callbacks.current.onError(error); });
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [elements]);
  return <div ref={host} aria-hidden="true" inert className="pointer-events-none fixed -left-[100000px] top-0 flex h-[900px] w-[1440px]" data-export-snapshot>
    <Canvas elements={elements} initialPan={{ x: 0, y: 0 }} selectedId={null} zoom={1} showGrid={false} activeTool="select" previewing
      onZoomChange={noop} onSelect={noop} onUpdateElement={noop} onCommitMove={noop} onDelete={noop} onCanvasClick={noop} />
  </div>;
}
