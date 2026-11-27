"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, X } from "lucide-react";

type ToastTone = "success" | "error";
type Toast = { id: number; message: string; tone: ToastTone; leaving: boolean };

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

const VISIBLE_MS = 5000;
const EXIT_MS = 200;

/**
 * Confirms completed actions without moving page content. Messages use the
 * same verb as the control that triggered them ("Add job" -> "Job added").
 * Timers pause while the pointer or keyboard focus is inside a toast.
 */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), EXIT_MS);
  }, []);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, message, tone, leaving: false }]);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || toast.leaving) return;
    const timer = window.setTimeout(onDismiss, VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [paused, toast.leaving, onDismiss]);

  const Icon = toast.tone === "error" ? AlertCircle : Check;

  return (
    <div
      className="app-toast pointer-events-auto"
      data-tone={toast.tone}
      data-leaving={toast.leaving}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
      <p className="min-w-0 flex-1">{toast.message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" title="Dismiss" className="app-toast-close">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside ToastProvider");
  return show;
}
