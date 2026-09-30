"use client";

import { clsx } from "clsx";
import { CalendarDays, ListChecks } from "lucide-react";
import { memo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { Member, Project, Task } from "@/lib/data/types";
import { formatDue, isOverdue } from "@/lib/format";
import { taskIdentifier } from "@/lib/tasks/filter";
import { PRIORITY_LABEL, PriorityIcon, STATUS_LABEL } from "../meta";

export interface CardContext {
  projects: Project[];
  members: Member[];
  subtaskCounts: Map<string, { done: number; total: number }>;
}

export const TaskCardBody = memo(function TaskCardBody({ task, ctx, dragging = false }: { task: Task; ctx: CardContext; dragging?: boolean }) {
  const project = ctx.projects.find((p) => p.id === task.projectId);
  const assignee = ctx.members.find((m) => m.userId === task.assigneeId);
  const sub = ctx.subtaskCounts.get(task.id);
  const overdue = isOverdue(task.dueDate, task.status === "done");
  return (
    <div
      className={clsx(
        "rounded-md border bg-raised px-3 py-2.5 text-left transition-colors",
        dragging ? "border-accent shadow-overlay" : "border-line hover:border-line-strong",
      )}
    >
      <div className="flex items-center gap-2 text-[11.5px] text-ink-muted">
        <span className="font-mono">{taskIdentifier(task, ctx.projects)}</span>
        <span className="ml-auto flex items-center gap-1" title={`${PRIORITY_LABEL[task.priority]} priority`}>
          <PriorityIcon priority={task.priority} />
          <span className="sr-only">{PRIORITY_LABEL[task.priority]} priority</span>
        </span>
      </div>
      <p className={clsx("mt-1 text-[13px] leading-[18px]", task.status === "done" ? "text-ink-soft" : "text-ink")}>{task.title}</p>
      <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-ink-muted">
        {project && (
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: project.color }} />
            <span className="truncate">{project.name}</span>
          </span>
        )}
        {sub && sub.total > 0 && (
          <span className="inline-flex items-center gap-1 font-mono" title="Subtasks done">
            <ListChecks aria-hidden className="size-3" /> {sub.done}/{sub.total}
          </span>
        )}
        {task.dueDate && (
          <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap", overdue && "text-[#f08a8a]")}>
            <CalendarDays aria-hidden className="size-3" />
            {formatDue(task.dueDate)}
          </span>
        )}
        <span className="ml-auto">
          <Avatar id={task.assigneeId} name={assignee?.profile.fullName ?? "Unassigned"} size={18} />
          <span className="sr-only">{assignee ? `Assigned to ${assignee.profile.fullName}` : "Unassigned"}</span>
        </span>
      </div>
      <span className="sr-only">Status: {STATUS_LABEL[task.status]}</span>
    </div>
  );
});
