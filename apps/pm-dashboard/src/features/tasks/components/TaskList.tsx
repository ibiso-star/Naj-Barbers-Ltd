"use client";

import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useShellUi } from "@/features/shell/ui-context";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/data/types";
import { formatDue, isOverdue } from "@/lib/format";
import { taskIdentifier } from "@/lib/tasks/filter";
import { byPosition } from "@/lib/tasks/ordering";
import { PRIORITY_LABEL, PriorityIcon, STATUS_LABEL, StatusIcon } from "../meta";
import type { CardContext } from "./TaskCard";

/** List view of the same filtered set as the board, grouped by status. */
export function TaskList({ tasks, ctx }: { tasks: Task[]; ctx: CardContext }) {
  const ui = useShellUi();
  const [collapsed, setCollapsed] = useState<Set<TaskStatus>>(new Set());
  const groups = useMemo(
    () => TASK_STATUSES.map((s) => ({ status: s, tasks: tasks.filter((t) => t.status === s).sort(byPosition) })),
    [tasks],
  );

  return (
    <div className="flex-1 pb-8" data-testid="task-list">
      {groups.map(({ status, tasks: rows }) => {
        const isCollapsed = collapsed.has(status);
        return (
          <section key={status} aria-labelledby={`group-${status}`}>
            <h2 id={`group-${status}`} className="sticky top-0 z-10 border-b border-line bg-surface">
              <button
                type="button"
                aria-expanded={!isCollapsed}
                onClick={() =>
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    if (next.has(status)) next.delete(status);
                    else next.add(status);
                    return next;
                  })
                }
                className="flex h-9 w-full items-center gap-2 px-4 text-left text-[13px] font-medium md:px-6"
              >
                <ChevronDown aria-hidden className={clsx("size-3.5 text-ink-muted transition-transform", isCollapsed && "-rotate-90")} />
                <StatusIcon status={status} />
                {STATUS_LABEL[status]}
                <span className="font-mono text-[12px] font-normal text-ink-muted">{rows.length}</span>
              </button>
            </h2>
            {!isCollapsed && (
              <ul>
                {rows.map((t) => {
                  const project = ctx.projects.find((p) => p.id === t.projectId);
                  const assignee = ctx.members.find((m) => m.userId === t.assigneeId);
                  const overdue = isOverdue(t.dueDate, t.status === "done");
                  return (
                    <li key={t.id}>
                      <button
                        type="button" onClick={() => ui.openTask(t.id)}
                        className="grid h-10 w-full grid-cols-[18px_64px_1fr_auto] items-center gap-3 border-b border-line/60 px-4 text-left text-[13px] hover:bg-hover md:grid-cols-[18px_72px_1fr_160px_110px_80px_24px] md:px-6"
                      >
                        <span title={`${PRIORITY_LABEL[t.priority]} priority`}>
                          <PriorityIcon priority={t.priority} />
                          <span className="sr-only">{PRIORITY_LABEL[t.priority]} priority</span>
                        </span>
                        <span className="font-mono text-[12px] text-ink-muted">{taskIdentifier(t, ctx.projects)}</span>
                        <span className={clsx("truncate", t.status === "done" ? "text-ink-soft" : "text-ink")}>{t.title}</span>
                        <span className="hidden min-w-0 items-center gap-1.5 truncate text-[12px] text-ink-soft md:flex">
                          {project && <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: project.color }} />}
                          <span className="truncate">{project?.name ?? "—"}</span>
                        </span>
                        <span className="hidden truncate text-[12px] text-ink-soft md:block">{assignee?.profile.fullName ?? "Unassigned"}</span>
                        <span className={clsx("text-right text-[12px] whitespace-nowrap", overdue ? "text-[#f08a8a]" : "text-ink-muted")}>
                          {t.dueDate ? formatDue(t.dueDate) : ""}
                        </span>
                        <span className="hidden md:block">
                          <Avatar id={t.assigneeId} name={assignee?.profile.fullName ?? "Unassigned"} size={20} />
                        </span>
                      </button>
                    </li>
                  );
                })}
                {rows.length === 0 && <li className="border-b border-line/60 px-6 py-3 text-[12.5px] text-ink-muted">No tasks</li>}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
