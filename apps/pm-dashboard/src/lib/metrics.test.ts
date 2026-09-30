import { describe, expect, it } from "vitest";
import type { Member, Project, Task } from "@/lib/data/types";
import { completionByMonth, computeKpis, overdueTasks, velocityByWeek, workloadHeatmap } from "./metrics";

// Wednesday 30 September 2026, midday UTC.
const NOW = new Date("2026-09-30T12:00:00Z");

let n = 0;
function task(p: Partial<Task>): Task {
  n += 1;
  return {
    id: `t${n}`, workspaceId: "w", projectId: null, number: n, title: `Task ${n}`, description: "",
    status: "todo", priority: "medium", assigneeId: null, dueDate: null, position: n,
    completedAt: null, createdBy: null, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    ...p,
  };
}
const member = (userId: string, fullName: string): Member => ({
  workspaceId: "w", userId, role: "member", joinedAt: "", profile: { id: userId, email: "", fullName },
});
const project = (p: Partial<Project>): Project => ({
  id: "p", workspaceId: "w", key: "WEB", name: "Web", description: "", status: "active", leadId: null,
  budgetCents: 0, color: "#3987e5", startDate: null, targetDate: null, createdAt: "", updatedAt: "", ...p,
});

describe("completionByMonth", () => {
  it("measures completion against work due each month, with an on-time split", () => {
    const tasks = [
      task({ dueDate: "2026-09-10", status: "done", completedAt: "2026-09-09T10:00:00Z" }), // on time
      task({ dueDate: "2026-09-12", status: "done", completedAt: "2026-09-15T10:00:00Z" }), // late
      task({ dueDate: "2026-09-20", status: "todo" }), // open
      task({ dueDate: "2026-09-21", status: "in_progress" }),
      task({ dueDate: "2026-08-03", status: "done", completedAt: "2026-08-03T18:00:00Z" }), // same-day = on time
    ];
    const months = completionByMonth(tasks, NOW);
    expect(months).toHaveLength(6);
    expect(months.map((m) => m.key)).toEqual(["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]);
    const sep = months[5];
    expect(sep).toMatchObject({ due: 4, completed: 2, onTime: 1, completionRate: 50, onTimeRate: 25, partial: true });
    expect(months[4]).toMatchObject({ due: 1, completionRate: 100, onTimeRate: 100, partial: false });
    expect(months[0].completionRate).toBeNull(); // nothing due → no rate, not 0%
  });
});

describe("velocityByWeek", () => {
  it("counts completions per Monday-start week with a trailing 4-week mean", () => {
    const tasks = [
      task({ status: "done", completedAt: "2026-09-28T09:00:00Z" }), // this week (Mon 28 Sep)
      task({ status: "done", completedAt: "2026-09-29T09:00:00Z" }),
      task({ status: "done", completedAt: "2026-09-27T23:00:00Z" }), // previous week (Sun)
      task({ status: "todo", completedAt: "2026-09-29T09:00:00Z" }), // reopened: not counted
    ];
    const weeks = velocityByWeek(tasks, NOW, 4);
    expect(weeks.map((w) => w.completed)).toEqual([0, 0, 1, 2]);
    expect(weeks[3]).toMatchObject({ partial: true, average: 0.8 });
  });
});

describe("overdue and KPIs", () => {
  it("treats only open tasks due before today as overdue, oldest first", () => {
    const tasks = [
      task({ id: "late2", dueDate: "2026-09-29" }),
      task({ id: "late1", dueDate: "2026-09-01" }),
      task({ id: "today", dueDate: "2026-09-30" }),
      task({ id: "doneLate", dueDate: "2026-09-01", status: "done", completedAt: "2026-09-02T00:00:00Z" }),
    ];
    expect(overdueTasks(tasks, NOW).map((t) => t.id)).toEqual(["late1", "late2"]);
  });

  it("sums the budget of active projects only and compares 30-day windows", () => {
    const projects = [
      project({ id: "a", status: "active", budgetCents: 100_00 }),
      project({ id: "b", status: "active", budgetCents: 250_00 }),
      project({ id: "c", status: "completed", budgetCents: 999_00 }),
    ];
    const tasks = [
      task({ status: "done", completedAt: "2026-09-25T00:00:00Z" }),
      task({ status: "done", completedAt: "2026-08-20T00:00:00Z" }),
      task({ status: "done", completedAt: "2026-08-15T00:00:00Z" }),
    ];
    expect(computeKpis(projects, tasks, NOW)).toMatchObject({
      totalProjects: 3, activeProjects: 2, activeBudgetCents: 350_00, completedLast30: 1, completedPrev30: 2,
    });
  });
});

describe("workloadHeatmap", () => {
  it("buckets open, non-backlog work per member by due week", () => {
    const members = [member("u1", "Ada"), member("u2", "Bo")];
    const tasks = [
      task({ assigneeId: "u1", dueDate: "2026-09-20" }), // overdue
      task({ assigneeId: "u1", dueDate: "2026-10-01" }), // this week
      task({ assigneeId: "u1", dueDate: "2026-10-06", status: "in_progress" }), // next week
      task({ assigneeId: "u1", dueDate: null }), // no date
      task({ assigneeId: "u1", status: "backlog", dueDate: "2026-10-01" }), // excluded
      task({ assigneeId: "u2", status: "done", dueDate: "2026-10-01", completedAt: "2026-09-29T00:00:00Z" }), // excluded
      task({ assigneeId: null, dueDate: "2026-12-01" }), // unassigned, later
    ];
    const rows = workloadHeatmap(tasks, members, NOW);
    expect(rows.map((r) => r.name)).toEqual(["Ada", "Bo", "Unassigned"]);
    const ada = Object.fromEntries(rows[0].cells.map((c) => [c.bucket, c.count]));
    expect(ada).toMatchObject({ Overdue: 1, "This week": 1, "Next week": 1, "No date": 1, Later: 0 });
    expect(rows[0]).toMatchObject({ total: 4, inProgress: 1 });
    expect(rows[2].cells.find((c) => c.bucket === "Later")?.count).toBe(1);
  });
});
