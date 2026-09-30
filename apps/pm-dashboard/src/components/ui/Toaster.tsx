"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Tone = "error" | "success";
interface Toast { id: number; tone: Tone; message: string; action?: { label: string; run: () => void } }

interface ToastApi {
  error(message: string, action?: Toast["action"]): void;
  success(message: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);

// Errors stay until dismissed or a retry is taken; successes fade quickly.
const SUCCESS_MS = 3500;
const ERROR_MS = 8000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const serial = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (tone: Tone, message: string, action?: Toast["action"]) => {
      serial.current += 1;
      const id = serial.current;
      setToasts((ts) => [...ts.slice(-3), { id, tone, message, action }]);
      setTimeout(() => dismiss(id), tone === "error" ? ERROR_MS : SUCCESS_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ error: (m, a) => push("error", m, a), success: (m) => push("success", m) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="toast-in pointer-events-auto flex items-start gap-2.5 rounded-md border border-line-strong bg-raised px-3 py-2.5 text-[13px] text-ink shadow-overlay"
          >
            {t.tone === "error" ? (
              <CircleAlert aria-hidden className="mt-px size-4 shrink-0 text-critical" />
            ) : (
              <CircleCheck aria-hidden className="mt-px size-4 shrink-0 text-good" />
            )}
            <p className="min-w-0 flex-1 leading-5">{t.message}</p>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.run();
                  dismiss(t.id);
                }}
                className="shrink-0 font-medium text-accent-ink hover:underline"
              >
                {t.action.label}
              </button>
            )}
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="shrink-0 text-ink-muted hover:text-ink">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
