"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useSnapshot, useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { newTaskInput, type NewTaskInput } from "@/lib/data/schemas";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/lib/data/types";
import { PRIORITY_LABEL, STATUS_LABEL } from "../meta";

/** F5: Add Task. New tasks land at the bottom of Todo unless a column is preset. */
export function NewTaskModal({ defaults, onClose }: { defaults: Partial<NewTaskInput> | null; onClose: () => void }) {
  const open = defaults !== null;
  return (
    <Modal open={open} onClose={onClose} title="New task" description="Adds the task to the bottom of its column.">
      {open && <NewTaskForm key={JSON.stringify(defaults)} defaults={defaults} onDone={onClose} />}
    </Modal>
  );
}

function NewTaskForm({ defaults, onDone }: { defaults: Partial<NewTaskInput>; onDone: () => void }) {
  const { createTask } = useWorkspace();
  const snap = useSnapshot();
  const id = useId();
  const [title, setTitle] = useState(defaults.title ?? "");
  const [priority, setPriority] = useState<TaskPriority>(defaults.priority ?? "medium");
  const [status, setStatus] = useState<TaskStatus>(defaults.status ?? "todo");
  const [dueDate, setDueDate] = useState(defaults.dueDate ?? "");
  const [projectId, setProjectId] = useState(defaults.projectId ?? "");
  const [assigneeId, setAssigneeId] = useState(defaults.assigneeId ?? "");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.getElementById(`${id}-title`)?.focus();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      title, priority, status, description,
      dueDate: dueDate || null,
      projectId: projectId || null,
      assigneeId: assigneeId || null,
    };
    const parsed = newTaskInput.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the fields");
      return;
    }
    setPending(true);
    const task = await createTask(input);
    setPending(false);
    if (task) onDone();
  }

  const projects = snap.projects.filter((p) => p.status !== "completed");
  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label="Title" htmlFor={`${id}-title`} error={error}>
        <Input
          id={`${id}-title`} value={title} maxLength={200} placeholder="e.g. Draft pricing page copy"
          aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-title-error` : undefined}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority" htmlFor={`${id}-priority`}>
          <Select id={`${id}-priority`} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
          </Select>
        </Field>
        <Field label="Due date" htmlFor={`${id}-due`}>
          <Input id={`${id}-due`} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Status" htmlFor={`${id}-status`}>
          <Select id={`${id}-status`} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
        </Field>
        <Field label="Assignee" htmlFor={`${id}-assignee`}>
          <Select id={`${id}-assignee`} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Unassigned</option>
            {snap.members.map((m) => <option key={m.userId} value={m.userId}>{m.profile.fullName}</option>)}
          </Select>
        </Field>
        <Field label="Project" htmlFor={`${id}-project`} className="col-span-2">
          <Select id={`${id}-project`} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.key} · {p.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Description" htmlFor={`${id}-description`}>
        <Textarea id={`${id}-description`} value={description} maxLength={10_000} rows={3} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="-mx-5 -mb-4 flex justify-end gap-2 border-t border-line px-5 py-3">
        <Button onClick={onDone} variant="ghost">Cancel</Button>
        <Button type="submit" variant="primary" pending={pending}>Create task</Button>
      </div>
    </form>
  );
}
