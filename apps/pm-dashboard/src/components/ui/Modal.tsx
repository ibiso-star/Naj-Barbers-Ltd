"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Native <dialog> gives focus trapping, Escape handling and inert background
 * for free (A11Y-002/004); we only add styling and backdrop-click to close.
 */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", handleCancel);
    return () => el.removeEventListener("cancel", handleCancel);
  }, [onClose]);
  const onBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
  return { ref, onBackdrop };
}

export function Modal({
  open, onClose, title, description, children, footer, width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const { ref, onBackdrop } = useDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      onClick={onBackdrop}
      aria-labelledby="modal-title"
      className="modal m-auto w-[calc(100vw-2rem)] rounded-lg border border-line-strong bg-surface p-0 text-ink shadow-overlay backdrop:backdrop-blur-[1px]"
      style={{ maxWidth: width }}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 id="modal-title" className="text-[15px] font-medium">{title}</h2>
              {description && <p className="mt-1 text-[13px] text-ink-soft">{description}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 rounded p-1 text-ink-muted hover:bg-hover hover:text-ink">
              <X aria-hidden className="size-4" />
            </button>
          </header>
          <div className="scroll-thin overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

export function Drawer({
  open, onClose, label, children, className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const { ref, onBackdrop } = useDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      onClick={onBackdrop}
      aria-label={label}
      className={clsx(
        "drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-[560px] border-l border-line-strong bg-surface p-0 text-ink shadow-overlay",
        className,
      )}
    >
      {open && children}
    </dialog>
  );
}
