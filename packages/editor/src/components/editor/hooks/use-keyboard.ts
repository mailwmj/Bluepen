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

const ALLOWED_EDITABLE_SHORTCUTS = new Set([
  "ctrl+s",
  "ctrl+shift+s",
  "ctrl+o",
  "ctrl+n",
  "f11",
]);

export function useKeyboard(shortcuts: ShortcutMap) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isEditable = isEditableTarget(e.target);
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      const parts: string[] = [];
      if (isCtrlOrCmd) parts.push("ctrl");
      if (e.altKey) parts.push("alt");
      if (e.shiftKey) parts.push("shift");

      const keyName = e.key.toLowerCase();
      parts.push(keyName);

      const eventKeyCombo = parts.join("+");
      const normalizedEvent = normalizeKey(eventKeyCombo);

      // When focused on an editable element (input, textarea, select), protect native editing behavior
      if (isEditable) {
        if (keyName === "escape") {
          (e.target as HTMLElement)?.blur?.();
          return;
        }
        if (!ALLOWED_EDITABLE_SHORTCUTS.has(normalizedEvent)) {
          return;
        }
      }

      const map = shortcutsRef.current;
      for (const [keyPattern, callback] of Object.entries(map)) {
        const normalizedPattern = normalizeKey(keyPattern);
        if (
          normalizedPattern === normalizedEvent ||
          normalizedPattern === keyName ||
          // Support Ctrl+Y as an alias for Redo when Ctrl+Shift+Z is registered
          (normalizedPattern === "ctrl+shift+z" && normalizedEvent === "ctrl+y") ||
          (normalizedPattern === "ctrl+y" && normalizedEvent === "ctrl+shift+z")
        ) {
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

