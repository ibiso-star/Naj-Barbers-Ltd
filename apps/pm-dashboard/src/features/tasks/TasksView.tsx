"use client";

import { clsx } from "clsx";
import { List, Plus, SquareKanban } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/features/shell/PageHeader";
import { useShellUi } from "@/features/shell/ui-context";
import { useSnapshot } from "@/features/workspace/WorkspaceProvider";
import { EMPTY_FILTERS, filterTasks, hasActiveFilters, type TaskFilters } from "@/lib/tasks/filter";
import { FilterBar } from "./components/FilterBar";
import { KanbanBoard } from "./components/KanbanBoard";
import type { CardContext } from "./components/TaskCard";
import { TaskList } from "./components/TaskList";

export function TasksView({
  view, initialAssignee, initialProject,
}: {
  view: "board" | "list";
  initialAssignee?: string;
  initialProject?: string;
}) {
  const snap = useSnapshot();
  const ui = useShellUi();
  // Deep links from the overview heatmap and projects list pre-set a filter.
  const [filters, setFilters] = useState<TaskFilters>(() => ({
    ...EMPTY_FILTERS,
    assignees: initialAssignee ? [initialAssignee] : [],
    projectIds: initialProject ? [initialProject] : [],
  }));
  const search = useRef<HTMLInputElement>(null);
  const base = `/w/${snap.workspace.slug}/tasks`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.closest("dialog")) return;
      e.preventDefault();
      search.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visible = useMemo(() => filterTasks(snap.tasks, filters, snap.projects), [snap.tasks, filters, snap.projects]);
  const ctx = useMemo<CardContext>(() => {
    const subtaskCounts = new Map<string, { done: number; total: number }>();
    for (const s of snap.subtasks) {
      const c = subtaskCounts.get(s.taskId) ?? { done: 0, total: 0 };
      c.total += 1;
      if (s.done) c.done += 1;
      subtaskCounts.set(s.taskId, c);
    }
    return { projects: snap.projects, members: snap.members, subtaskCounts };
  }, [snap.projects, snap.members, snap.subtasks]);

  const viewLink = (target: "board" | "list", label: string, Icon: typeof List) => (
    <Link
      href={target === "list" ? `${base}?view=list` : base}
      aria-current={view === target ? "page" : undefined}
      className={clsx(
        "inline-flex h-7 items-center gap-1.5 px-2.5 text-[12.5px]",
        view === target ? "bg-hover text-ink" : "text-ink-soft hover:text-ink",
      )}
    >
      <Icon aria-hidden className="size-3.5" /> {label}
    </Link>
  );

  const noTasks = snap.tasks.length === 0;
  const noMatches = !noTasks && visible.length === 0;

  return (
    <>
      <PageHeader title="Tasks" meta={`${snap.tasks.filter((t) => t.status !== "done").length} open`}>
        <div className="flex overflow-hidden rounded-md border border-line-strong" role="group" aria-label="View">
          {viewLink("board", "Board", SquareKanban)}
          {viewLink("list", "List", List)}
        </div>
        <Button variant="primary" size="sm" icon={<Plus aria-hidden className="size-3.5" />} onClick={() => ui.newTask()}>
          Add task
        </Button>
      </PageHeader>
      <FilterBar
        ref={search} filters={filters} onChange={setFilters} members={snap.members} projects={snap.projects}
        resultCount={visible.length} totalCount={snap.tasks.length}
      />
      {noTasks ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
          <h2 className="text-[15px] font-medium">No tasks yet</h2>
          <p className="max-w-sm text-[13px] text-ink-soft">Create the first task for this workspace. Press C from anywhere to add one.</p>
          <Button variant="primary" onClick={() => ui.newTask()}>Add task</Button>
        </div>
      ) : noMatches && hasActiveFilters(filters) ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center" role="status">
          <h2 className="text-[15px] font-medium">No tasks match these filters</h2>
          <Button onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</Button>
        </div>
      ) : view === "board" ? (
        <KanbanBoard tasks={visible} allTasks={snap.tasks} ctx={ctx} />
      ) : (
        <TaskList tasks={visible} ctx={ctx} />
      )}
    </>
  );
}
