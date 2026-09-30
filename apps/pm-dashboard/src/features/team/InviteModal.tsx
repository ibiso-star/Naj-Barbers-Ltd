"use client";

import { Lock } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { inviteInput } from "@/lib/data/schemas";
import type { WorkspaceRole } from "@/lib/data/types";

/** J4: admins invite. Members see why they can't, and the database agrees. */
export function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAdmin, snapshot } = useWorkspace();
  return (
    <Modal open={open} onClose={onClose} title="Invite to workspace" description={snapshot ? `Add a teammate to ${snapshot.workspace.name}.` : undefined}>
      {open && (isAdmin ? <InviteForm onDone={onClose} /> : <NotAdmin onClose={onClose} />)}
    </Modal>
  );
}

function NotAdmin({ onClose }: { onClose: () => void }) {
  const { snapshot } = useWorkspace();
  const admins = snapshot?.members.filter((m) => m.role === "admin").map((m) => m.profile.fullName) ?? [];
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2.5 text-[13px] leading-5 text-ink-soft">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
        Only workspace admins can invite people. Ask {admins.length ? admins.join(" or ") : "an admin"} to send the invitation.
      </p>
      <div className="flex justify-end"><Button onClick={onClose}>Close</Button></div>
    </div>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const { invite } = useWorkspace();
  const id = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = inviteInput.safeParse({ email, role });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the email");
    setPending(true);
    const ok = await invite({ email, role });
    setPending(false);
    if (ok) onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label="Email" htmlFor={`${id}-email`} error={error}>
        <Input
          id={`${id}-email`} type="email" autoFocus value={email} maxLength={254} placeholder="name@company.com" aria-invalid={Boolean(error)}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
        />
      </Field>
      <Field label="Role" htmlFor={`${id}-role`} hint="Admins can invite people, change roles and rename the workspace.">
        <Select id={`${id}-role`} value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </Select>
      </Field>
      <p className="text-[12px] leading-5 text-ink-muted">
        The invitation is recorded and expires in 30 days. Invitation emails are not sent in this version, so share the sign-in link with them directly.
      </p>
      <div className="-mx-5 -mb-4 flex justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary" pending={pending}>Send invite</Button>
      </div>
    </form>
  );
}
