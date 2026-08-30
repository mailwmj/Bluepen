"use client";

import { useEffect } from "react";

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

export function useKeyboard(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey || e.metaKey ? "Ctrl" : "",
        e.shiftKey ? "Shift" : "",
        e.altKey ? "Alt" : "",
        e.key.toUpperCase(),
      ]
        .filter(Boolean)
        .join("+");

      if (isEditableTarget(e.target)) {
        if (!key.includes("Ctrl") && !key.includes("Alt")) return;
      }

      const fn = shortcuts[key] || shortcuts[e.key.toLowerCase()];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
