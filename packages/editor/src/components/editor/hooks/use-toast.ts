"use client";

import { toastManager } from "@bluepen/editor/components/ui/toast";

export type ToastType = "info" | "success" | "error" | "warning";

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
  const toastId = toastManager.add({
    ...(id ? { id } : {}),
    type,
    title,
    ...(description ? { description } : {}),
    timeout: duration,
  });
  window.setTimeout(() => toastManager.close(toastId), duration + 500);
}
