"use client";

import { Minus, Square, Copy, X } from "lucide-react";

interface TitleBarProps {
  maximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

export function TitleBar({ maximized, onMinimize, onMaximize, onClose }: TitleBarProps) {
  return (
    <div
      data-tauri-drag-region
      onDoubleClick={onMaximize}
      className="flex h-9 shrink-0 select-none items-center gap-2 border-b border-border bg-surface px-3 text-foreground"
    >
      <img src="/brand/bluepen-icon.svg" alt="Bluepen" className="size-3.5 grayscale invert dark:invert-0" draggable={false} />
      <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">BLUEPEN</span>

      <div className="ml-auto flex items-center gap-0.5" onDoubleClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize"
          className="flex size-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          <Minus aria-hidden="true" className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onMaximize}
          aria-label={maximized ? "Restore" : "Maximize"}
          className="flex size-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          {maximized ? (
            <Copy aria-hidden="true" className="size-3" />
          ) : (
            <Square aria-hidden="true" className="size-3" />
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-150 hover:bg-destructive hover:text-white"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
