"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { Task } from "@/lib/data/types";
import { WORKLOAD_BUCKETS, type WorkloadRow } from "@/lib/metrics";

// Sequential single-hue ramp (magnitude): lighter = more work. Step 0 is the
// surface so an empty cell recedes; text flips to dark ink on light steps.
const RAMP = ["#18181b", "#104281", "#1c5cab", "#2a78d6", "#5598e7", "#9ec5f4"];
const stepFor = (count: number, max: number) => (count === 0 ? 0 : Math.max(1, Math.ceil((count / Math.max(max, 1)) * (RAMP.length - 1))));

interface Hover { row: number; col: number }

export function WorkloadHeatmap({ rows, tasks, slug }: { rows: WorkloadRow[]; tasks: Task[]; slug: string }) {
  const [hover, setHover] = useState<Hover | null>(null);
  const max = Math.max(0, ...rows.flatMap((r) => r.cells.map((c) => c.count)));
  const titleOf = (id: string) => tasks.find((t) => t.id === id)?.title ?? "";

  if (rows.every((r) => r.total === 0)) {
    return <p className="px-2 py-12 text-center text-[13px] text-ink-muted">No open work is scheduled. Assign tasks to see workload here.</p>;
  }

  return (
    <div className="scroll-thin overflow-x-auto px-2" data-testid="workload-heatmap">
      <table className="w-full min-w-[620px] border-separate border-spacing-[3px] text-[12px]">
        <caption className="sr-only">Open tasks per member by due date. Each cell shows a task count.</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[168px] pb-1 text-left font-normal text-ink-muted">Member</th>
            {WORKLOAD_BUCKETS.map((b) => (
              <th key={b} scope="col" className={clsx("pb-1 text-center font-normal", b === "Overdue" ? "text-[#f08a8a]" : "text-ink-muted")}>{b}</th>
            ))}
            <th scope="col" className="pb-1 text-right font-normal text-ink-muted">Open</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r.userId ?? "unassigned"}>
              <th scope="row" className="pr-2 text-left font-normal">
                <Link
                  href={`/w/${slug}/tasks?view=list&assignee=${r.userId ?? "unassigned"}`}
                  className="flex items-center gap-2 truncate text-ink-soft hover:text-ink"
                >
                  <Avatar id={r.userId} name={r.name} size={18} />
                  <span className="truncate">{r.name}</span>
                </Link>
              </th>
              {r.cells.map((c, ci) => {
                const step = stepFor(c.count, max);
                const isHover = hover?.row === ri && hover.col === ci;
                return (
                  <td key={c.bucket} className="relative p-0">
                    <div
                      tabIndex={c.count ? 0 : -1}
                      role="img"
                      aria-label={`${r.name}, ${c.bucket}: ${c.count} ${c.count === 1 ? "task" : "tasks"}`}
                      onMouseEnter={() => setHover({ row: ri, col: ci })}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover({ row: ri, col: ci })}
                      onBlur={() => setHover(null)}
                      className={clsx(
                        "flex h-8 items-center justify-center rounded-[4px] font-mono tabular-nums outline-none transition-shadow",
                        isHover && "ring-2 ring-ink/70",
                        step >= 4 ? "text-canvas" : c.count ? "text-ink" : "text-ink-muted",
                        c.bucket === "Overdue" && c.count > 0 && "ring-1 ring-inset ring-critical",
                      )}
                      style={{ background: RAMP[step] }}
                    >
                      {c.count || "·"}
                    </div>
                    {isHover && c.count > 0 && (
                      <div role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 w-56 -translate-x-1/2 rounded-md border border-line-strong bg-raised px-3 py-2 text-left shadow-overlay">
                        <p className="text-ink-soft">{r.name} · {c.bucket}</p>
                        <p className="mt-1"><span className="font-medium text-ink">{c.count}</span> <span className="text-ink-soft">open {c.count === 1 ? "task" : "tasks"}</span></p>
                        <ul className="mt-1.5 flex flex-col gap-0.5 text-[11.5px] text-ink-soft">
                          {c.taskIds.slice(0, 3).map((id) => <li key={id} className="truncate">{titleOf(id)}</li>)}
                          {c.taskIds.length > 3 && <li className="text-ink-muted">and {c.taskIds.length - 3} more</li>}
                        </ul>
                      </div>
                    )}
                  </td>
                );
              })}
              <td className="pl-2 text-right font-mono text-ink tabular-nums">
                {r.total}
                {r.inProgress > 0 && <span className="ml-1 text-[11px] text-ink-muted">({r.inProgress} active)</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center justify-end gap-1.5 px-1 text-[11px] text-ink-muted" aria-hidden>
        Fewer
        {RAMP.slice(1).map((c) => <span key={c} className="size-2.5 rounded-[2px]" style={{ background: c }} />)}
        More
      </div>
    </div>
  );
}
