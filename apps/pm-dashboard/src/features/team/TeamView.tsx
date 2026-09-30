"use client";

import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/features/shell/PageHeader";
import { useShellUi } from "@/features/shell/ui-context";
import { useSnapshot, useWorkspace } from "@/features/workspace/WorkspaceProvider";
import type { WorkspaceRole } from "@/lib/data/types";
import { formatDate, formatRelative } from "@/lib/format";

export function TeamView() {
  const snap = useSnapshot();
  const { isAdmin, me, setRole, revokeInvite } = useWorkspace();
  const ui = useShellUi();
  const [busy, setBusy] = useState<string | null>(null);

  const load = useMemo(() => {
    const m = new Map<string, { open: number; active: number }>();
    for (const t of snap.tasks) {
      if (!t.assigneeId || t.status === "done") continue;
      const c = m.get(t.assigneeId) ?? { open: 0, active: 0 };
      c.open += 1;
      if (t.status === "in_progress") c.active += 1;
      m.set(t.assigneeId, c);
    }
    return m;
  }, [snap.tasks]);

  const members = [...snap.members].sort((a, b) => (a.role === b.role ? a.profile.fullName.localeCompare(b.profile.fullName) : a.role === "admin" ? -1 : 1));

  return (
    <>
      <PageHeader title="Team" meta={`${snap.members.length} members`}>
        <Button variant="primary" size="sm" icon={<UserPlus aria-hidden className="size-3.5" />} onClick={() => ui.invite()}>
          Invite team
        </Button>
      </PageHeader>
      <div className="flex flex-col gap-8 p-4 md:p-6">
        <section aria-labelledby="members-heading">
          <h2 id="members-heading" className="mb-2 text-[12.5px] font-medium text-ink-soft">Members</h2>
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface" data-testid="members-list">
            {members.map((m) => {
              const w = load.get(m.userId) ?? { open: 0, active: 0 };
              const isMe = m.userId === me?.id;
              return (
                <li key={m.userId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar id={m.userId} name={m.profile.fullName} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">
                      {m.profile.fullName} {isMe && <span className="text-ink-muted">(you)</span>}
                    </p>
                    <p className="truncate text-[12px] text-ink-muted">{m.profile.email} · joined {formatDate(m.joinedAt)}</p>
                  </div>
                  <p className="w-28 text-[12px] text-ink-soft">
                    <span className="font-mono text-ink">{w.open}</span> open · <span className="font-mono text-ink">{w.active}</span> active
                  </p>
                  {isAdmin ? (
                    <select
                      aria-label={`Role for ${m.profile.fullName}`}
                      value={m.role}
                      disabled={busy === m.userId}
                      onChange={async (e) => {
                        setBusy(m.userId);
                        await setRole(m.userId, e.target.value as WorkspaceRole);
                        setBusy(null);
                      }}
                      className="h-7 rounded-md border border-line-strong bg-canvas px-2 text-[12.5px] text-ink disabled:opacity-50"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span className="w-20 text-right text-[12.5px] text-ink-soft capitalize">{m.role}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {!isAdmin && <p className="mt-2 text-[12px] text-ink-muted">Only admins can change roles or invite people.</p>}
        </section>

        <section aria-labelledby="invites-heading">
          <h2 id="invites-heading" className="mb-2 text-[12.5px] font-medium text-ink-soft">Pending invitations</h2>
          {snap.invitations.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-4 py-4 text-[13px] text-ink-muted">No pending invitations.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface" data-testid="invites-list">
              {snap.invitations.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar id={null} name={i.email} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{i.email}</p>
                    <p className="text-[12px] text-ink-muted">
                      Invited {formatRelative(i.createdAt)} as {i.role} · expires {formatDate(i.expiresAt)}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button size="sm" variant="ghost" onClick={() => void revokeInvite(i.id)}>Revoke</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
