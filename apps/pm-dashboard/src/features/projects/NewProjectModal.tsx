"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useSnapshot, useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { newProjectInput } from "@/lib/data/schemas";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/data/types";
import { PROJECT_STATUS_LABEL } from "@/features/tasks/meta";

// The four validated categorical series colours, so project dots stay
// distinguishable in charts and lists.
const COLORS = [
  { value: "#3987e5", label: "Blue" },
  { value: "#d95926", label: "Orange" },
  { value: "#199e70", label: "Aqua" },
  { value: "#c98500", label: "Yellow" },
];

const keyFrom = (name: string) =>
  name.replace(/[^a-zA-Z ]/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 3).toUpperCase() ||
  name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New project" description="Projects group tasks and carry a budget and target date.">
      {open && <NewProjectForm onDone={onClose} />}
    </Modal>
  );
}

function NewProjectForm({ onDone }: { onDone: () => void }) {
  const { createProject } = useWorkspace();
  const snap = useSnapshot();
  const id = useId();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>("planned");
  const [leadId, setLeadId] = useState("");
  const [budget, setBudget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(COLORS[snap.projects.length % COLORS.length].value);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      name, key, status, description, color,
      leadId: leadId || null,
      budgetPounds: budget ? Number(budget) : 0,
      targetDate: targetDate || null,
    };
    const parsed = newProjectInput.safeParse(input);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    if (snap.projects.some((p) => p.key === parsed.data.key)) {
      setErrors({ key: `${parsed.data.key} is already used in this workspace` });
      return;
    }
    setPending(true);
    const project = await createProject(input);
    setPending(false);
    if (project) onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-[1fr_96px] gap-3">
        <Field label="Name" htmlFor={`${id}-name`} error={errors.name}>
          <Input
            id={`${id}-name`} autoFocus value={name} maxLength={80} placeholder="e.g. Checkout redesign" aria-invalid={Boolean(errors.name)}
            onChange={(e) => {
              setName(e.target.value);
              if (!keyTouched) setKey(keyFrom(e.target.value));
            }}
          />
        </Field>
        <Field label="Key" htmlFor={`${id}-key`} error={errors.key}>
          <Input
            id={`${id}-key`} value={key} maxLength={5} className="font-mono uppercase" aria-invalid={Boolean(errors.key)}
            onChange={(e) => {
              setKeyTouched(true);
              setKey(e.target.value.toUpperCase());
            }}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status" htmlFor={`${id}-status`}>
          <Select id={`${id}-status`} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</option>)}
          </Select>
        </Field>
        <Field label="Lead" htmlFor={`${id}-lead`}>
          <Select id={`${id}-lead`} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">No lead</option>
            {snap.members.map((m) => <option key={m.userId} value={m.userId}>{m.profile.fullName}</option>)}
          </Select>
        </Field>
        <Field label="Budget (GBP)" htmlFor={`${id}-budget`} error={errors.budgetPounds}>
          <Input id={`${id}-budget`} type="number" inputMode="numeric" min={0} step={1} value={budget} placeholder="0" onChange={(e) => setBudget(e.target.value)} />
        </Field>
        <Field label="Target date" htmlFor={`${id}-target`}>
          <Input id={`${id}-target`} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[12.5px] font-medium text-ink-soft">Colour</legend>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <label key={c.value} className="cursor-pointer">
              <input type="radio" name="color" value={c.value} checked={color === c.value} onChange={() => setColor(c.value)} className="peer sr-only" />
              <span className="flex h-7 items-center gap-1.5 rounded-md border border-line-strong px-2 text-[12px] text-ink-soft peer-checked:border-ink peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                <span aria-hidden className="size-2.5 rounded-sm" style={{ background: c.value }} />
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Description" htmlFor={`${id}-description`}>
        <Textarea id={`${id}-description`} rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="-mx-5 -mb-4 flex justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary" pending={pending}>Create project</Button>
      </div>
    </form>
  );
}
