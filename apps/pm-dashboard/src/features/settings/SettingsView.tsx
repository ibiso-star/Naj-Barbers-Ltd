"use client";

import { RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PageHeader } from "@/features/shell/PageHeader";
import { useSnapshot, useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { DemoRepository } from "@/lib/data/demo-repository";
import type { WorkspacePlan } from "@/lib/data/types";

const PLAN_LABEL: Record<WorkspacePlan, string> = { free: "Free", team: "Team", business: "Business" };

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-line py-6 md:grid-cols-[240px_1fr]">
      <div>
        <h2 className="text-[13px] font-medium">{title}</h2>
        <p className="mt-1 text-[12.5px] leading-5 text-ink-muted">{description}</p>
      </div>
      <div className="max-w-lg">{children}</div>
    </section>
  );
}

export function SettingsView() {
  const snap = useSnapshot();
  const { isAdmin, rename, mode } = useWorkspace();
  const id = useId();
  const [name, setName] = useState(snap.workspace.name);
  const [pending, setPending] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const admins = snap.members.filter((m) => m.role === "admin").length;

  return (
    <>
      <PageHeader title="Settings & billing" meta={snap.workspace.name} />
      <div className="px-4 md:px-6">
        <Section title="General" description="The workspace name appears in the switcher and to everyone invited.">
          <form
            className="flex items-end gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);
              await rename(name);
              setPending(false);
            }}
          >
            <Field label="Workspace name" htmlFor={`${id}-name`} className="flex-1" hint={isAdmin ? undefined : "Only admins can rename the workspace."}>
              <Input id={`${id}-name`} value={name} maxLength={80} disabled={!isAdmin} onChange={(e) => setName(e.target.value)} />
            </Field>
            {isAdmin && (
              <Button type="submit" pending={pending} disabled={!name.trim() || name.trim() === snap.workspace.name}>Save</Button>
            )}
          </form>
          <p className="mt-3 text-[12px] text-ink-muted">
            Address: <span className="font-mono text-ink-soft">/w/{snap.workspace.slug}</span>
          </p>
        </Section>

        <Section title="Plan & billing" description="Seats count every member of this workspace.">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line text-[13px]">
            <div className="bg-surface px-4 py-3">
              <dt className="text-[12px] text-ink-muted">Current plan</dt>
              <dd className="mt-1 font-medium">{PLAN_LABEL[snap.workspace.plan]}</dd>
            </div>
            <div className="bg-surface px-4 py-3">
              <dt className="text-[12px] text-ink-muted">Seats in use</dt>
              <dd className="mt-1 font-mono">{snap.members.length} <span className="font-sans text-[12px] text-ink-muted">({admins} admin)</span></dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] leading-5 text-ink-muted">
            Online billing isn&apos;t connected in this version, so plans can&apos;t be changed here and no payment details are collected.
          </p>
        </Section>

        {mode === "demo" && (
          <Section title="Demo data" description="This build runs without a database. Everything you change is stored in this browser only.">
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-ink-soft">Discard all local changes?</span>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
                <Button
                  size="sm" variant="danger"
                  onClick={() => {
                    DemoRepository.reset();
                    window.location.reload();
                  }}
                >
                  Reset
                </Button>
              </div>
            ) : (
              <Button size="sm" icon={<RotateCcw aria-hidden className="size-3.5" />} onClick={() => setConfirmReset(true)}>
                Reset sample data
              </Button>
            )}
          </Section>
        )}
      </div>
    </>
  );
}
