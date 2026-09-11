"use client";

import { useSyncExternalStore } from "react";

export type ToastType = "info" | "success" | "error" | "warning";

type EditorNotice = { type: ToastType; title: string; description?: string };
let notice: EditorNotice | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => notice;
const getServerSnapshot = () => null;

export function useEditorNotice() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function dismissEditorNotice() {
  clearTimeout(timer);
  notice = null;
  listeners.forEach((listener) => listener());
}

export function showToast({
  type = "info",
  title,
  description,
  id,
  duration = 3500,
}: {
  type?: ToastType;
  title: string;
  description?: string;
  id?: string;
  duration?: number;
}) {
  // Preserve existing callers while presenting feedback in the editor's status bar.
  clearTimeout(timer);
  notice = { type, title, description };
  listeners.forEach((listener) => listener());
  if (type !== "error" && type !== "warning" && duration > 0) timer = setTimeout(dismissEditorNotice, duration);
}
