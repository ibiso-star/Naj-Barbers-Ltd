"use client";

import { clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, controlClass } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Modal";
import { useSnapshot, useWorkspace } from "@/features/workspace/WorkspaceProvider";
import type { Activity, Member, Project, Task, TaskPriority, TaskStatus } from "@/lib/data/types";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/data/types";
import { formatRelative, isOverdue } from "@/lib/format";
import { taskIdentifier } from "@/lib/tasks/filter";
import { byPosition } from "@/lib/tasks/ordering";
import { PRIORITY_LABEL, PriorityIcon, STATUS_LABEL, StatusIcon } from "../meta";

/** F7: deep-dive drawer. Every field saves on change; failures roll back with a toast. */
export function TaskDrawer({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const snap = useSnapshot();
  const task = taskId ? snap.tasks.find((t) => t.id === taskId) : undefined;

  // A task deleted elsewhere (another browser) closes the drawer.
  useEffect(() => {
    if (taskId && !task) onClose();
  }, [taskId, task, onClose]);

  return (
    <Drawer open={Boolean(task)} onClose={onClose} label={task ? `Task ${task.title}` : "Task"}>
      {task && <TaskDetails key={task.id} task={task} onClose={onClose} />}
    </Drawer>
  );
}

function TaskDetails({ task, onClose }: { task: Task; onClose: () => void }) {
  const snap = useSnapshot();
  const { updateTask, deleteTask, loadActivity } = useWorkspace();
  const id = useId();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    void loadActivity(task.id);
  }, [task.id, loadActivity]);

  const identifier = taskIdentifier(task, snap.projects);
  const overdue = isOverdue(task.dueDate, task.status === "done");

  const saveTitle = () => {
    const next = title.trim();
    if (!next) return setTitle(task.title);
    if (next !== task.title) void updateTask(task.id, { title: next });
  };
  const saveDescription = () => {
    if (description !== task.description) void updateTask(task.id, { description });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
        <span className="font-mono text-[12px] text-ink-muted">{identifier}</span>
        <span className="text-[12px] text-ink-muted">·</span>
        <span className="text-[12px] text-ink-muted">Created {formatRelative(task.createdAt)}</span>
        <button type="button" onClick={onClose} aria-label="Close task" className="ml-auto rounded p-1 text-ink-muted hover:bg-hover hover:text-ink">
          <X aria-hidden className="size-4" />
        </button>
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto">
        <div className="px-5 pt-5">
          <label htmlFor={`${id}-title`} className="sr-only">Title</label>
          <input
            id={`${id}-title`}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-full rounded bg-transparent px-1 py-0.5 -mx-1 text-[18px] font-medium tracking-tight text-ink hover:bg-hover/60 focus:bg-canvas focus:outline-none"
          />
        </div>

        <dl className="mt-4 grid grid-cols-[108px_1fr] items-center gap-x-3 gap-y-2 px-5 text-[13px]">
          <dt className="text-ink-muted">Status</dt>
          <dd>
            <PropertySelect
              label="Status" value={task.status} icon={<StatusIcon status={task.status} />}
              options={TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
              onChange={(v) => void updateTask(task.id, { status: v as TaskStatus })}
            />
          </dd>
          <dt className="text-ink-muted">Priority</dt>
          <dd>
            <PropertySelect
              label="Priority" value={task.priority} icon={<PriorityIcon priority={task.priority} />}
              options={TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))}
              onChange={(v) => void updateTask(task.id, { priority: v as TaskPriority })}
            />
          </dd>
          <dt className="text-ink-muted">Assignee</dt>
          <dd>
            <PropertySelect
              label="Assignee" value={task.assigneeId ?? ""}
              icon={<Avatar id={task.assigneeId} name={memberName(snap.members, task.assigneeId)} size={16} />}
              options={[{ value: "", label: "Unassigned" }, ...snap.members.map((m) => ({ value: m.userId, label: m.profile.fullName }))]}
              onChange={(v) => void updateTask(task.id, { assigneeId: v || null })}
            />
          </dd>
          <dt className="text-ink-muted">Project</dt>
          <dd>
            <PropertySelect
              label="Project" value={task.projectId ?? ""}
              icon={<span aria-hidden className="size-2 rounded-sm" style={{ background: snap.projects.find((p) => p.id === task.projectId)?.color ?? "#3f3f46" }} />}
              options={[{ value: "", label: "No project" }, ...snap.projects.map((p) => ({ value: p.id, label: `${p.key} · ${p.name}` }))]}
              onChange={(v) => void updateTask(task.id, { projectId: v || null })}
            />
          </dd>
          <dt className="text-ink-muted">Due date</dt>
          <dd className="flex items-center gap-2">
            <label htmlFor={`${id}-due`} className="sr-only">Due date</label>
            <Input
              id={`${id}-due`} type="date" value={task.dueDate ?? ""}
              className={clsx("h-7 w-auto border-transparent bg-transparent hover:border-line-strong", overdue && "text-[#f08a8a]")}
              onChange={(e) => void updateTask(task.id, { dueDate: e.target.value || null })}
            />
            {overdue && <span className="text-[12px] text-[#f08a8a]">Overdue</span>}
          </dd>
        </dl>

        <section className="mt-6 px-5">
          <h3 className="mb-2 text-[12.5px] font-medium text-ink-soft">
            <label htmlFor={`${id}-description`}>Description</label>
          </h3>
          <Textarea
            id={`${id}-description`} value={description} maxLength={10_000} rows={4}
            placeholder="Add context, acceptance criteria, links…"
            onChange={(e) => setDescription(e.target.value)} onBlur={saveDescription}
          />
        </section>

        <Subtasks task={task} />
        <ActivityLog task={task} />
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-4 py-3">
        {confirmDelete ? (
          <>
            <span className="text-[13px] text-ink-soft">Delete this task and its subtasks?</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button
                size="sm" variant="danger"
                onClick={async () => {
                  if (await deleteTask(task.id)) onClose();
                }}
              >
                Delete
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="text-[12px] text-ink-muted">Changes save automatically</span>
            <Button size="sm" variant="ghost" icon={<Trash2 aria-hidden className="size-3.5" />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </>
        )}
      </footer>
    </div>
  );
}

function PropertySelect({
  label, value, options, onChange, icon,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative inline-flex max-w-full items-center">
      <span className="pointer-events-none absolute left-2 flex items-center">{icon}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(controlClass, "h-7 max-w-full truncate border-transparent bg-transparent pl-7 hover:border-line-strong hover:bg-raised")}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const memberName = (members: Member[], id: string | null) =>
  id ? members.find((m) => m.userId === id)?.profile.fullName ?? "Former member" : "Unassigned";

function Subtasks({ task }: { task: Task }) {
  const snap = useSnapshot();
  const { addSubtask, toggleSubtask, deleteSubtask } = useWorkspace();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const subtasks = useMemo(() => snap.subtasks.filter((s) => s.taskId === task.id).sort(byPosition), [snap.subtasks, task.id]);
  const done = subtasks.filter((s) => s.done).length;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setPending(true);
    if (await addSubtask(task.id, draft.trim())) setDraft("");
    setPending(false);
  }

  return (
    <section className="mt-6 px-5" aria-labelledby="subtasks-heading">
      <div className="mb-2 flex items-center gap-2">
        <h3 id="subtasks-heading" className="text-[12.5px] font-medium text-ink-soft">Subtasks</h3>
        {subtasks.length > 0 && (
          <span className="font-mono text-[11.5px] text-ink-muted">{done}/{subtasks.length}</span>
        )}
      </div>
      <ul className="flex flex-col">
        {subtasks.map((s) => (
          <li key={s.id} className="group flex h-8 items-center gap-2.5 rounded px-1 hover:bg-hover">
            <input
              type="checkbox" checked={s.done} onChange={() => void toggleSubtask(s)} aria-label={`Mark "${s.title}" ${s.done ? "not done" : "done"}`}
              className="size-3.5 accent-[#3987e5]"
            />
            <span className={clsx("min-w-0 flex-1 truncate text-[13px]", s.done && "text-ink-muted line-through")}>{s.title}</span>
            <button
              type="button" onClick={() => void deleteSubtask(s)} aria-label={`Delete subtask "${s.title}"`}
              className="rounded p-1 text-ink-muted opacity-0 group-hover:opacity-100 hover:text-ink focus-visible:opacity-100"
            >
              <Trash2 aria-hidden className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-1 flex items-center gap-2">
        <Plus aria-hidden className="ml-1 size-3.5 text-ink-muted" />
        <label htmlFor={`new-subtask-${task.id}`} className="sr-only">New subtask</label>
        <input
          id={`new-subtask-${task.id}`} value={draft} maxLength={200} onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a subtask and press Enter" disabled={pending}
          className="h-8 flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </form>
    </section>
  );
}

function describe(a: Activity, members: Member[], projects: Project[]): string {
  const status = (v: string | null) => (v ? STATUS_LABEL[v as TaskStatus] ?? v : "none");
  switch (a.kind) {
    case "created":
      return "created the task";
    case "status":
      return `moved it from ${status(a.fromValue)} to ${status(a.toValue)}`;
    case "assignee":
      return a.toValue ? `assigned it to ${memberName(members, a.toValue)}` : "removed the assignee";
    case "priority":
      return `set priority to ${PRIORITY_LABEL[a.toValue as TaskPriority] ?? a.toValue}`;
    case "due_date":
      return a.toValue ? `set the due date to ${format(parseISO(a.toValue), "d MMM yyyy")}` : "removed the due date";
    case "title":
      return `renamed it to “${a.toValue}”`;
    case "project": {
      const p = projects.find((x) => x.id === a.toValue);
      return p ? `moved it to ${p.name}` : "removed it from its project";
    }
    case "description":
      return "updated the description";
    case "subtask_added":
      return `added subtask “${a.toValue}”`;
    case "subtask_completed":
      return `completed subtask “${a.toValue}”`;
  }
}

function ActivityLog({ task }: { task: Task }) {
  const snap = useSnapshot();
  const rows = useMemo(
    () => snap.activity.filter((a) => a.taskId === task.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [snap.activity, task.id],
  );
  return (
    <section className="mt-6 mb-6 px-5" aria-labelledby="activity-heading">
      <h3 id="activity-heading" className="mb-3 text-[12.5px] font-medium text-ink-soft">Activity</h3>
      {rows.length === 0 ? (
        <p className="text-[12.5px] text-ink-muted">No activity yet.</p>
      ) : (
        <ol className="relative flex flex-col gap-3 border-l border-line pl-4">
          {rows.map((a) => {
            const actor = a.actorId ? memberName(snap.members, a.actorId) : "Someone";
            return (
              <li key={a.id} className="relative text-[12.5px] leading-5 text-ink-soft">
                <span aria-hidden className="absolute top-[7px] -left-[20.5px] size-2 rounded-full border border-line-strong bg-surface" />
                <span className="text-ink">{actor}</span> {describe(a, snap.members, snap.projects)}
                <time dateTime={a.createdAt} className="ml-1.5 text-ink-muted">{formatRelative(a.createdAt)}</time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
