"use client";

import { clsx } from "clsx";
import { ChevronDown, Search, X } from "lucide-react";
import { forwardRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Kbd } from "@/components/ui/Kbd";
import { OptionRow, Popover } from "@/components/ui/Popover";
import type { Member, Project, TaskPriority } from "@/lib/data/types";
import { TASK_PRIORITIES } from "@/lib/data/types";
import { EMPTY_FILTERS, UNASSIGNED, hasActiveFilters, type TaskFilters } from "@/lib/tasks/filter";
import { PRIORITY_LABEL, PriorityIcon } from "../meta";

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function FilterButton({ label, count, open, onClick, id }: { label: string; count: number; open: boolean; onClick: () => void; id: string }) {
  return (
    <button
      type="button" onClick={onClick} aria-expanded={open} aria-controls={id}
      className={clsx(
        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12.5px] transition-colors",
        count ? "border-accent/50 bg-accent/10 text-ink" : "border-line-strong text-ink-soft hover:bg-hover hover:text-ink",
      )}
    >
      {label}
      {count > 0 && <span className="rounded bg-accent-strong px-1 font-mono text-[10.5px] leading-4 text-white">{count}</span>}
      <ChevronDown aria-hidden className="size-3" />
    </button>
  );
}

export const FilterBar = forwardRef<HTMLInputElement, {
  filters: TaskFilters;
  onChange: (f: TaskFilters) => void;
  members: Member[];
  projects: Project[];
  resultCount: number;
  totalCount: number;
}>(function FilterBar({ filters, onChange, members, projects, resultCount, totalCount }, searchRef) {
  const active = hasActiveFilters(filters);
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 md:px-6" role="search">
      <div className="relative w-full sm:w-[260px]">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted" />
        <label htmlFor="task-search" className="sr-only">Search tasks</label>
        <input
          ref={searchRef}
          id="task-search"
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onChange({ ...filters, query: "" });
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Search by title or ID"
          autoComplete="off"
          className="h-7 w-full rounded-md border border-line-strong bg-canvas pr-8 pl-8 text-[13px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
        />
        <span className="absolute top-1/2 right-2 -translate-y-1/2"><Kbd>/</Kbd></span>
      </div>

      <Popover
        label="Filter by priority"
        trigger={({ open, toggle: t, id }) => (
          <FilterButton label="Priority" count={filters.priorities.length} open={open} onClick={t} id={id} />
        )}
      >
        {() =>
          TASK_PRIORITIES.map((p: TaskPriority) => (
            <OptionRow key={p} multi selected={filters.priorities.includes(p)} onSelect={() => onChange({ ...filters, priorities: toggle(filters.priorities, p) })}>
              <PriorityIcon priority={p} /> {PRIORITY_LABEL[p]}
            </OptionRow>
          ))
        }
      </Popover>

      <Popover
        label="Filter by assignee"
        className="max-h-80 overflow-y-auto"
        trigger={({ open, toggle: t, id }) => (
          <FilterButton label="Assignee" count={filters.assignees.length} open={open} onClick={t} id={id} />
        )}
      >
        {() => (
          <>
            <OptionRow multi selected={filters.assignees.includes(UNASSIGNED)} onSelect={() => onChange({ ...filters, assignees: toggle(filters.assignees, UNASSIGNED) })}>
              <Avatar id={null} name="Unassigned" size={16} /> Unassigned
            </OptionRow>
            {members.map((m) => (
              <OptionRow key={m.userId} multi selected={filters.assignees.includes(m.userId)} onSelect={() => onChange({ ...filters, assignees: toggle(filters.assignees, m.userId) })}>
                <Avatar id={m.userId} name={m.profile.fullName} size={16} /> {m.profile.fullName}
              </OptionRow>
            ))}
          </>
        )}
      </Popover>

      <Popover
        label="Filter by project"
        trigger={({ open, toggle: t, id }) => (
          <FilterButton label="Project" count={filters.projectIds.length} open={open} onClick={t} id={id} />
        )}
      >
        {() =>
          projects.map((p) => (
            <OptionRow key={p.id} multi selected={filters.projectIds.includes(p.id)} onSelect={() => onChange({ ...filters, projectIds: toggle(filters.projectIds, p.id) })}>
              <span aria-hidden className="size-2 shrink-0 rounded-sm" style={{ background: p.color }} /> {p.name}
            </OptionRow>
          ))
        }
      </Popover>

      {active && (
        <>
          <button
            type="button" onClick={() => onChange(EMPTY_FILTERS)}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12.5px] text-ink-soft hover:bg-hover hover:text-ink"
          >
            <X aria-hidden className="size-3.5" /> Clear
          </button>
          <span role="status" className="text-[12px] text-ink-muted">
            {resultCount} of {totalCount} tasks
          </span>
        </>
      )}
    </div>
  );
});
