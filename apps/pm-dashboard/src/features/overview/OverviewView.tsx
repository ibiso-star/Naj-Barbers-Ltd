"use client";

import { clsx } from "clsx";
import { ArrowDownRight, ArrowUpRight, CircleAlert, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/features/shell/PageHeader";
import { useShellUi } from "@/features/shell/ui-context";
import { PriorityIcon } from "@/features/tasks/meta";
import { useSnapshot } from "@/features/workspace/WorkspaceProvider";
import { formatDue, formatPence, formatPenceCompact } from "@/lib/format";
import { completionByMonth, computeKpis, overdueTasks, velocityByWeek, workloadHeatmap } from "@/lib/metrics";
import { taskIdentifier } from "@/lib/tasks/filter";
import { ChartCard } from "./ChartCard";
import { CompletionChart, CompletionLegend, CompletionTable, VelocityChart, VelocityLegend, VelocityTable } from "./charts";
import { WorkloadHeatmap } from "./WorkloadHeatmap";

function KpiCard({
  href, label, value, detail, trend, testId, tone,
}: {
  href: string;
  label: string;
  value: string;
  detail: string;
  trend?: { dir: "up" | "down" | "flat"; text: string; good: boolean };
  testId: string;
  tone?: "critical";
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="group flex flex-col rounded-lg border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong hover:bg-raised focus-visible:border-accent"
    >
      <span className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
        {tone === "critical" && <CircleAlert aria-hidden className="size-3.5 text-critical" />}
        {label}
      </span>
      <span className="mt-2 text-[26px] leading-8 font-medium tracking-tight text-ink">{value}</span>
      <span className="mt-1.5 flex items-center gap-2 text-[12px] text-ink-muted">
        {trend && trend.dir !== "flat" && (
          <span className={clsx("inline-flex items-center gap-0.5", trend.good ? "text-good" : "text-serious")}>
            {trend.dir === "up" ? <ArrowUpRight aria-hidden className="size-3.5" /> : <ArrowDownRight aria-hidden className="size-3.5" />}
            {trend.text}
          </span>
        )}
        <span className="truncate">{detail}</span>
        <span aria-hidden className="ml-auto text-ink-muted opacity-0 transition-opacity group-hover:opacity-100">View →</span>
      </span>
    </Link>
  );
}

export function OverviewView() {
  const snap = useSnapshot();
  const ui = useShellUi();
  const base = `/w/${snap.workspace.slug}`;
  // One "now" per render so every panel agrees on what is overdue.
  const now = useMemo(() => new Date(), []);

  const kpis = useMemo(() => computeKpis(snap.projects, snap.tasks, now), [snap.projects, snap.tasks, now]);
  const completion = useMemo(() => completionByMonth(snap.tasks, now), [snap.tasks, now]);
  const velocity = useMemo(() => velocityByWeek(snap.tasks, now), [snap.tasks, now]);
  const overdue = useMemo(() => overdueTasks(snap.tasks, now), [snap.tasks, now]);
  const workload = useMemo(() => workloadHeatmap(snap.tasks, snap.members, now), [snap.tasks, snap.members, now]);

  const delta = kpis.completedLast30 - kpis.completedPrev30;
  const firstRun = snap.tasks.length === 0 && snap.projects.length === 0;

  return (
    <>
      <PageHeader title="Overview" meta={snap.workspace.name}>
        <Button size="sm" icon={<Plus aria-hidden className="size-3.5" />} onClick={() => ui.newProject()}>New project</Button>
      </PageHeader>

      {firstRun ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
          <h2 className="text-[15px] font-medium">Nothing to report yet</h2>
          <p className="max-w-sm text-[13px] text-ink-soft">Create a project and a few tasks; velocity, overdue work and workload appear here as the team moves them.</p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => ui.newProject()}>New project</Button>
            <Button onClick={() => ui.newTask()}>Add task</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 p-4 md:p-6 lg:grid-cols-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-12 xl:grid-cols-4">
            <KpiCard
              testId="kpi-projects" href={`${base}/projects`} label="Total projects"
              value={String(kpis.totalProjects)} detail={`${kpis.activeProjects} active`}
            />
            <KpiCard
              testId="kpi-completed" href={`${base}/tasks?view=list`} label="Completed tasks · 30 days"
              value={String(kpis.completedLast30)}
              detail="vs previous 30 days"
              trend={{ dir: delta > 0 ? "up" : delta < 0 ? "down" : "flat", text: `${delta > 0 ? "+" : ""}${delta}`, good: delta >= 0 }}
            />
            <KpiCard
              testId="kpi-budget" href={`${base}/projects`} label="Active budget"
              value={formatPenceCompact(kpis.activeBudgetCents)}
              detail={`${formatPence(kpis.activeBudgetCents)} across ${kpis.activeBudgetProjects} active ${kpis.activeBudgetProjects === 1 ? "project" : "projects"}`}
            />
            <KpiCard
              testId="kpi-overdue" href={`${base}/tasks?view=list`} label="Overdue items" tone={kpis.overdue ? "critical" : undefined}
              value={String(kpis.overdue)} detail={`of ${kpis.openTasks} open tasks`}
            />
          </div>

          <ChartCard
            className="lg:col-span-7" title="Completion rate"
            subtitle="Share of tasks due each month that were completed, last 6 months"
            legend={<CompletionLegend />} table={<CompletionTable data={completion} />}
          >
            <CompletionChart data={completion} />
          </ChartCard>

          <ChartCard
            className="lg:col-span-5" title="Project velocity"
            subtitle="Tasks completed per week, last 12 weeks"
            legend={<VelocityLegend />} table={<VelocityTable data={velocity} />}
          >
            <VelocityChart data={velocity} />
          </ChartCard>

          <ChartCard
            className="lg:col-span-8" title="Team workload"
            subtitle="Open tasks per member by due date (backlog excluded)"
          >
            <WorkloadHeatmap rows={workload} tasks={snap.tasks} slug={snap.workspace.slug} />
          </ChartCard>

          <section className="flex flex-col rounded-lg border border-line bg-surface lg:col-span-4" aria-labelledby="overdue-heading" data-testid="overdue-list">
            <header className="flex items-center gap-2 px-4 pt-4 pb-2">
              <CircleAlert aria-hidden className="size-3.5 text-critical" />
              <h2 id="overdue-heading" className="text-[13px] font-medium">Overdue items</h2>
              <span className="font-mono text-[12px] text-ink-muted">{overdue.length}</span>
            </header>
            {overdue.length === 0 ? (
              <p className="px-4 pb-6 text-[13px] text-ink-muted">Nothing is overdue.</p>
            ) : (
              <ul className="scroll-thin max-h-[300px] overflow-y-auto px-2 pb-2">
                {overdue.map((t) => {
                  const assignee = snap.members.find((m) => m.userId === t.assigneeId);
                  return (
                    <li key={t.id}>
                      <button
                        type="button" onClick={() => ui.openTask(t.id)}
                        className="flex h-9 w-full items-center gap-2.5 rounded px-2 text-left text-[13px] hover:bg-hover"
                      >
                        <PriorityIcon priority={t.priority} />
                        <span className="font-mono text-[11.5px] text-ink-muted">{taskIdentifier(t, snap.projects)}</span>
                        <span className="min-w-0 flex-1 truncate">{t.title}</span>
                        <span className="text-[11.5px] whitespace-nowrap text-[#f08a8a]">{formatDue(t.dueDate!, now)}</span>
                        <Avatar id={t.assigneeId} name={assignee?.profile.fullName ?? "Unassigned"} size={18} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
