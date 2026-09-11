"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@bluepen/editor/components/ui/button";
import { AlertDialog, AlertDialogPopup, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@bluepen/editor/components/ui/alert-dialog";

interface Confirmation {
  title: string;
  description: string;
  action: string;
  saveCopy?: () => Promise<void>;
}

export function useProjectConfirmation() {
  const [request, setRequest] = useState<Confirmation | null>(null);
  const resolve = useRef<((allowed: boolean) => void) | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const confirm = useCallback((next: Confirmation) => {
    if (resolve.current) return Promise.resolve(false);
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setRequest(next); setError("");
    return new Promise<boolean>(done => { resolve.current = done; });
  }, []);
  const finish = (allowed: boolean) => {
    resolve.current?.(allowed); resolve.current = null; setRequest(null);
  };
  useEffect(() => () => { resolve.current?.(false); }, []);
  const dialog = <AlertDialog open={!!request} onOpenChange={open => { if (!open && !saving) finish(false); }}>
    <AlertDialogPopup bottomStickOnMobile={false} finalFocus={trigger} onKeyDown={event => event.stopPropagation()}>
      <AlertDialogHeader>
        <AlertDialogTitle>{request?.title}</AlertDialogTitle>
        <AlertDialogDescription className="leading-6">{request?.description}</AlertDialogDescription>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter variant="bare" className="flex-wrap">
        <Button variant="ghost" size="pill" autoFocus disabled={saving} onClick={() => finish(false)}>取消</Button>
        <Button variant="destructive-outline" size="pill" disabled={saving} onClick={() => finish(true)}>{request?.action}</Button>
        {request?.saveCopy && <Button size="pill" disabled={saving} onClick={async () => {
          setSaving(true);
          try { await request.saveCopy?.(); finish(true); }
          catch { setError("下载副本失败，当前项目已保留，请重试。"); }
          finally { setSaving(false); }
        }}>{saving ? "正在下载…" : "下载副本并继续"}</Button>}
      </AlertDialogFooter>
    </AlertDialogPopup>
  </AlertDialog>;
  return { confirm, dialog };
}
