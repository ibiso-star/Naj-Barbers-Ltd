import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/data/types";
import { EMPTY_FILTERS, UNASSIGNED, filterTasks, taskIdentifier } from "./filter";
import { byPosition, positionBetween } from "./ordering";

const base: Task = {
  id: "", workspaceId: "w", projectId: "p1", number: 1, title: "", description: "", status: "todo",
  priority: "medium", assigneeId: null, dueDate: null, position: 0, completedAt: null, createdBy: null,
  createdAt: "", updatedAt: "",
};
const projects = [{ id: "p1", key: "WEB" }, { id: "p2", key: "MOB" }];
const tasks: Task[] = [
  { ...base, id: "a", number: 1, title: "Design pricing page", priority: "high", assigneeId: "u1" },
  { ...base, id: "b", number: 2, title: "Migrate blog posts", priority: "low", assigneeId: "u2" },
  { ...base, id: "c", number: 3, title: "Onboarding checklist", projectId: "p2", description: "pricing experiment follow-up" },
];

describe("filterTasks", () => {
  it("returns everything with no filters", () => {
    expect(filterTasks(tasks, EMPTY_FILTERS, projects)).toHaveLength(3);
  });
  it("fuzzy-matches titles despite typos", () => {
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, query: "prcing pge" }, projects).map((t) => t.id)).toContain("a");
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, query: "migrate" }, projects).map((t) => t.id)).toEqual(["b"]);
  });
  it("matches identifiers like MOB-3", () => {
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, query: "MOB-3" }, projects).map((t) => t.id)).toEqual(["c"]);
  });
  it("combines multi-select priority and assignee filters (OR within, AND across)", () => {
    const f = { ...EMPTY_FILTERS, priorities: ["high" as const, "medium" as const], assignees: ["u1", UNASSIGNED] };
    expect(filterTasks(tasks, f, projects).map((t) => t.id)).toEqual(["a", "c"]);
  });
  it("builds identifiers from the project key", () => {
    expect(taskIdentifier(tasks[2], projects)).toBe("MOB-3");
    expect(taskIdentifier({ number: 9, projectId: null }, projects)).toBe("TSK-9");
  });
});

describe("positionBetween", () => {
  it("places between, before, after, and into empty columns", () => {
    expect(positionBetween(1000, 2000)).toBe(1500);
    expect(positionBetween(undefined, 1000)).toBe(0);
    expect(positionBetween(3000, undefined)).toBe(4000);
    expect(positionBetween(undefined, undefined)).toBe(1000);
  });
  it("breaks position ties by task number so order stays stable", () => {
    const tied = [{ position: 5, number: 2 }, { position: 5, number: 1 }, { position: 1, number: 9 }];
    expect([...tied].sort(byPosition).map((t) => t.number)).toEqual([9, 1, 2]);
  });
});
