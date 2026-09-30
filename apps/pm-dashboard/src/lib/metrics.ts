// Pure metric calculations for the Overview page. Kept free of React so they
// are unit-tested directly (test-plan.md) and produce the same numbers in
// demo and Supabase mode.
import {
  addDays, addWeeks, differenceInCalendarDays, endOfMonth, format, isWithinInterval, parseISO,
  startOfMonth, startOfWeek, subMonths, subWeeks,
} from "date-fns";
import type { Member, Project, Task } from "@/lib/data/types";

const WEEK = { weekStartsOn: 1 } as const;
const DAY_MS = 86_400_000;

const isDone = (t: Task) => t.status === "done";
const completedDay = (t: Task) => (t.completedAt ? parseISO(t.completedAt) : null);

export interface Kpis {
  totalProjects: number;
  activeProjects: number;
  completedLast30: number;
  completedPrev30: number;
  activeBudgetCents: number;
  activeBudgetProjects: number;
  overdue: number;
  openTasks: number;
}

export function computeKpis(projects: Project[], tasks: Task[], now: Date = new Date()): Kpis {
  const since = (days: number) => now.getTime() - days * DAY_MS;
  const doneBetween = (from: number, to: number) =>
    tasks.filter((t) => {
      const at = t.completedAt ? Date.parse(t.completedAt) : NaN;
      return isDone(t) && at >= from && at < to;
    }).length;
  const active = projects.filter((p) => p.status === "active");
  return {
    totalProjects: projects.length,
    activeProjects: active.length,
    completedLast30: doneBetween(since(30), now.getTime() + 1),
    completedPrev30: doneBetween(since(60), since(30)),
    activeBudgetCents: active.reduce((sum, p) => sum + p.budgetCents, 0),
    activeBudgetProjects: active.length,
    overdue: overdueTasks(tasks, now).length,
    openTasks: tasks.filter((t) => !isDone(t)).length,
  };
}

export interface MonthCompletion {
  key: string;
  label: string;
  due: number;
  completed: number;
  onTime: number;
  /** Share of tasks due this month that are done, 0–100; null with nothing due. */
  completionRate: number | null;
  /** Share of tasks due this month finished on or before the due date. */
  onTimeRate: number | null;
  partial: boolean;
}

/**
 * Completion rate per calendar month over the last `months` months, measured
 * against what was *due* that month — a month with a lot of due work that
 * slipped reads as low even if other work was finished.
 */
export function completionByMonth(tasks: Task[], now: Date = new Date(), months = 6): MonthCompletion[] {
  const out: MonthCompletion[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const start = startOfMonth(subMonths(now, i));
    const end = endOfMonth(start);
    const due = tasks.filter((t) => t.dueDate && isWithinInterval(parseISO(t.dueDate), { start, end }));
    const completed = due.filter(isDone);
    const onTime = completed.filter((t) => {
      const done = completedDay(t);
      return done !== null && differenceInCalendarDays(done, parseISO(t.dueDate!)) <= 0;
    });
    const pct = (n: number) => (due.length ? Math.round((n / due.length) * 100) : null);
    out.push({
      key: format(start, "yyyy-MM"),
      label: format(start, "MMM"),
      due: due.length,
      completed: completed.length,
      onTime: onTime.length,
      completionRate: pct(completed.length),
      onTimeRate: pct(onTime.length),
      partial: i === 0,
    });
  }
  return out;
}

export interface WeekVelocity {
  key: string;
  label: string;
  rangeLabel: string;
  completed: number;
  /** Trailing four-week mean, including this week. */
  average: number;
  partial: boolean;
}

export function velocityByWeek(tasks: Task[], now: Date = new Date(), weeks = 12): WeekVelocity[] {
  const thisWeek = startOfWeek(now, WEEK);
  const counts: number[] = [];
  const out: WeekVelocity[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = subWeeks(thisWeek, i);
    const end = addDays(start, 7);
    const completed = tasks.filter((t) => {
      const d = completedDay(t);
      return isDone(t) && d !== null && d >= start && d < end;
    }).length;
    counts.push(completed);
    const window = counts.slice(-4);
    out.push({
      key: format(start, "yyyy-MM-dd"),
      label: format(start, "d MMM"),
      rangeLabel: `${format(start, "d MMM")} – ${format(addDays(start, 6), "d MMM")}`,
      completed,
      average: Math.round((window.reduce((a, b) => a + b, 0) / window.length) * 10) / 10,
      partial: i === 0,
    });
  }
  return out;
}

export function overdueTasks(tasks: Task[], now: Date = new Date()): Task[] {
  return tasks
    .filter((t) => !isDone(t) && t.dueDate && differenceInCalendarDays(parseISO(t.dueDate), now) < 0)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
}

export const WORKLOAD_BUCKETS = ["Overdue", "This week", "Next week", "In 2 weeks", "In 3 weeks", "Later", "No date"] as const;
export type WorkloadBucket = (typeof WORKLOAD_BUCKETS)[number];

export interface WorkloadRow {
  userId: string | null;
  name: string;
  cells: { bucket: WorkloadBucket; count: number; taskIds: string[] }[];
  total: number;
  inProgress: number;
}

function bucketFor(task: Task, now: Date): WorkloadBucket {
  if (!task.dueDate) return "No date";
  const due = parseISO(task.dueDate);
  if (differenceInCalendarDays(due, now) < 0) return "Overdue";
  const week = startOfWeek(now, WEEK);
  for (let i = 0; i < 4; i += 1) {
    if (due < addWeeks(week, i + 1)) return WORKLOAD_BUCKETS[i + 1];
  }
  return "Later";
}

/** Open work per member by when it is due — the rows of the workload heatmap. */
export function workloadHeatmap(tasks: Task[], members: Member[], now: Date = new Date()): WorkloadRow[] {
  const open = tasks.filter((t) => !isDone(t) && t.status !== "backlog");
  const rows: WorkloadRow[] = [
    ...members.map((m) => ({ userId: m.userId as string | null, name: m.profile.fullName })),
    { userId: null, name: "Unassigned" },
  ].map(({ userId, name }) => {
    const mine = open.filter((t) => t.assigneeId === userId);
    return {
      userId,
      name,
      cells: WORKLOAD_BUCKETS.map((bucket) => {
        const inBucket = mine.filter((t) => bucketFor(t, now) === bucket);
        return { bucket, count: inBucket.length, taskIds: inBucket.map((t) => t.id) };
      }),
      total: mine.length,
      inProgress: mine.filter((t) => t.status === "in_progress").length,
    };
  });
  // Busiest first; keep the unassigned row last as a catch-all.
  const unassigned = rows.pop()!;
  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  return unassigned.total > 0 ? [...rows, unassigned] : rows;
}
