"use client";

import { clsx } from "clsx";
import { Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";

/**
 * Frame for every chart: title, one-line reading guide, and a table view so
 * no value is reachable only by hovering (dataviz accessibility rule).
 */
export function ChartCard({
  title, subtitle, legend, table, children, className, action,
}: {
  title: string;
  subtitle: string;
  legend?: ReactNode;
  table?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={clsx("flex min-w-0 flex-col rounded-lg border border-line bg-surface", className)} aria-label={title}>
      <header className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 pt-4">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium">{title}</h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">{subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {legend}
          {action}
          {table && (
            <button
              type="button"
              aria-pressed={showTable}
              onClick={() => setShowTable((s) => !s)}
              className={clsx(
                "inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11.5px]",
                showTable ? "bg-hover text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
              )}
            >
              <Table2 aria-hidden className="size-3.5" /> Table
            </button>
          )}
        </div>
      </header>
      <div className="min-h-0 flex-1 px-2 pt-2 pb-3">{showTable && table ? <div className="px-2">{table}</div> : children}</div>
    </section>
  );
}

export function LegendKey({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-soft">
      <svg width="14" height="6" aria-hidden>
        <line x1="1" y1="3" x2="13" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={dashed ? "3 3" : undefined} />
      </svg>
      {label}
    </span>
  );
}

export function TooltipFrame({ title, rows, note }: { title: string; rows: { color?: string; value: string; label: string; dashed?: boolean }[]; note?: string }) {
  return (
    <div className="min-w-[168px] rounded-md border border-line-strong bg-raised px-3 py-2 text-[12px] shadow-overlay">
      <p className="mb-1.5 text-ink-soft">{title}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2">
            {r.color && (
              <svg width="12" height="4" aria-hidden>
                <line x1="1" y1="2" x2="11" y2="2" stroke={r.color} strokeWidth="2" strokeLinecap="round" strokeDasharray={r.dashed ? "2 2" : undefined} />
              </svg>
            )}
            <span className="font-medium text-ink tabular-nums">{r.value}</span>
            <span className="text-ink-soft">{r.label}</span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-1.5 text-[11px] text-ink-muted">{note}</p>}
    </div>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="scroll-thin max-h-[240px] overflow-auto">
      <table className="w-full text-left text-[12px]">
        <thead className="sticky top-0 bg-surface text-ink-muted">
          <tr>{head.map((h, i) => <th key={h} scope="col" className={clsx("py-1.5 font-normal", i > 0 && "text-right")}>{h}</th>)}</tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((r) => (
            <tr key={String(r[0])} className="border-t border-line/70">
              {r.map((c, i) => <td key={i} className={clsx("py-1.5", i > 0 ? "text-right text-ink" : "text-ink-soft")}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
