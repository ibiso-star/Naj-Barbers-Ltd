"use client";

import { clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/features/shell/PageHeader";
import { useShellUi } from "@/features/shell/ui-context";
import { PROJECT_STATUS_LABEL } from "@/features/tasks/meta";
import { useSnapshot } from "@/features/workspace/WorkspaceProvider";
import type { ProjectStatus } from "@/lib/data/types";
import { formatPence } from "@/lib/format";

const STATUS_STYLE: Record<ProjectStatus, string> = {
  planned: "text-ink-soft border-line-strong",
  active: "text-accent-ink border-accent/40",
  paused: "text-warning border-warning/40",
  completed: "text-good border-good/40",
};

export function ProjectsView() {
  const snap = useSnapshot();
  const ui = useShellUi();

  const rows = useMemo(
    () =>
      snap.projects
        .map((p) => {
          const tasks = snap.tasks.filter((t) => t.projectId === p.id);
          const done = tasks.filter((t) => t.status === "done").length;
          return { project: p, total: tasks.length, done, lead: snap.members.find((m) => m.userId === p.leadId) };
        })
        .sort((a, b) => {
          const order: ProjectStatus[] = ["active", "planned", "paused", "completed"];
          return order.indexOf(a.project.status) - order.indexOf(b.project.status) || a.project.name.localeCompare(b.project.name);
        }),
    [snap.projects, snap.tasks, snap.members],
  );

  return (
    <>
      <PageHeader title="Projects" meta={`${snap.projects.length} total`}>
        <Button variant="primary" size="sm" icon={<Plus aria-hidden className="size-3.5" />} onClick={() => ui.newProject()}>
          New project
        </Button>
      </PageHeader>
      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
          <h2 className="text-[15px] font-medium">No projects yet</h2>
          <p className="max-w-sm text-[13px] text-ink-soft">Projects group related tasks and track budget and progress.</p>
          <Button variant="primary" onClick={() => ui.newProject()}>New project</Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]" data-testid="projects-table">
            <thead className="text-left text-[12px] text-ink-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-3 pl-4 font-normal md:pl-6">Project</th>
                <th scope="col" className="py-2 pr-3 font-normal">Status</th>
                <th scope="col" className="w-[200px] py-2 pr-3 font-normal">Progress</th>
                <th scope="col" className="py-2 pr-3 font-normal">Lead</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">Budget</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal md:pr-6">Target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ project: p, total, done, lead }) => {
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <tr key={p.id} className="border-b border-line/60 hover:bg-hover/50">
                    <td className="py-2.5 pr-3 pl-4 md:pl-6">
                      <Link href={`/w/${snap.workspace.slug}/tasks?project=${p.id}`} className="group flex items-center gap-2.5">
                        <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: p.color }} />
                        <span className="font-mono text-[11.5px] text-ink-muted">{p.key}</span>
                        <span className="truncate group-hover:underline">{p.name}</span>
                      </Link>
                      {p.description && <p className="mt-0.5 max-w-md truncate pl-5 text-[12px] text-ink-muted">{p.description}</p>}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={clsx("inline-flex h-5 items-center rounded border px-1.5 text-[11.5px]", STATUS_STYLE[p.status])}>
                        {PROJECT_STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised" role="progressbar"
                          aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.name} progress`}
                        >
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                        </div>
                        <span className="w-[92px] text-right font-mono text-[11.5px] whitespace-nowrap text-ink-muted">{done}/{total} · {pct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      {lead ? (
                        <span className="flex items-center gap-2 text-ink-soft">
                          <Avatar id={lead.userId} name={lead.profile.fullName} size={18} />
                          <span className="truncate">{lead.profile.fullName}</span>
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{formatPence(p.budgetCents)}</td>
                    <td className="py-2.5 pr-4 text-right text-ink-soft md:pr-6">{p.targetDate ? format(parseISO(p.targetDate), "d MMM yyyy") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
