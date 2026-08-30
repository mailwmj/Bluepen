"use client";

import { useEffect, useRef } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

function normalizeKey(k: string): string {
  return k
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .sort((a, b) => {
      const order: Record<string, number> = { ctrl: 1, cmd: 1, command: 1, alt: 2, shift: 3 };
      return (order[a] ?? 99) - (order[b] ?? 99);
    })
    .join("+");
}

export function useKeyboard(shortcuts: ShortcutMap) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isEditable = isEditableTarget(e.target);
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // When editing text inside input/textarea, only allow hotkeys with Ctrl/Cmd (e.g. Ctrl+Z, Ctrl+S)
      if (isEditable && !isCtrlOrCmd && !e.altKey) {
        return;
      }

      const parts: string[] = [];
      if (isCtrlOrCmd) parts.push("ctrl");
      if (e.altKey) parts.push("alt");
      if (e.shiftKey) parts.push("shift");

      const keyName = e.key.toLowerCase();
      parts.push(keyName);

      const eventKeyCombo = parts.join("+");

      const map = shortcutsRef.current;
      for (const [keyPattern, callback] of Object.entries(map)) {
        const normalizedPattern = normalizeKey(keyPattern);
        if (normalizedPattern === eventKeyCombo || normalizedPattern === keyName) {
          e.preventDefault();
          callback();
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}

