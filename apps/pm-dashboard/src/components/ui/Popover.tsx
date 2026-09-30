"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Minimal anchored popover: closes on outside click, Escape, or blur-away. */
export function Popover({
  trigger, children, align = "start", className, label,
}: {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  className?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={label}
          className={clsx(
            "absolute top-[calc(100%+4px)] z-40 min-w-[200px] rounded-md border border-line-strong bg-raised p-1 shadow-overlay",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function OptionRow({
  selected, onSelect, children, multi = false,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? "menuitemcheckbox" : "menuitemradio"}
      aria-checked={selected}
      onClick={onSelect}
      className="flex h-8 w-full items-center gap-2 rounded px-2 text-left text-[13px] text-ink hover:bg-hover focus-visible:bg-hover"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate">{children}</span>
      <Check aria-hidden className={clsx("size-3.5 shrink-0 text-accent-ink", !selected && "invisible")} />
    </button>
  );
}
