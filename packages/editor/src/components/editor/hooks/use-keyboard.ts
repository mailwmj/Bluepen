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

export function matchesShortcut(pattern: string, event: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">): boolean {
  const key = /^Digit\d$/.test(event.code) ? event.code.slice(-1) : event.key.toLowerCase();
  const combination = normalizeKey([
    ...(event.ctrlKey || event.metaKey ? ["ctrl"] : []),
    ...(event.altKey ? ["alt"] : []),
    ...(event.shiftKey ? ["shift"] : []), key,
  ].join("+"));
  const expected = normalizeKey(pattern);
  return expected === combination ||
    (expected === "ctrl+shift+z" && combination === "ctrl+y") ||
    (expected === "ctrl+y" && combination === "ctrl+shift+z");
}

export function useKeyboard(shortcuts: ShortcutMap, enabled = true) {
  const shortcutsRef = useRef(shortcuts);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!enabledRef.current || e.defaultPrevented || e.isComposing) return;
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
        if (matchesShortcut(keyPattern, e)) {
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
