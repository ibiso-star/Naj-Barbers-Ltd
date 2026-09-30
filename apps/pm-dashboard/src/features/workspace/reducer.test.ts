import { describe, expect, it } from "vitest";
import { materialiseSeed } from "@/lib/data/seed";
import type { WorkspaceSnapshot } from "@/lib/data/types";
import { initialWorkspaceState, workspaceReducer } from "./reducer";

const seed = materialiseSeed(new Date("2026-09-30T12:00:00Z"));
const wsId = seed.workspaces[0].id;
const snapshot: WorkspaceSnapshot = {
  workspace: { ...seed.workspaces[0], role: "admin" },
  members: [], invitations: [], projects: [],
  tasks: seed.tasks.filter((t) => t.workspaceId === wsId),
  subtasks: seed.subtasks.filter((s) => s.workspaceId === wsId),
  activity: [],
};
const loaded = workspaceReducer(initialWorkspaceState, { type: "loaded", snapshot });

describe("workspaceReducer", () => {
  it("applies the same realtime upsert idempotently", () => {
    const row = { ...snapshot.tasks[0], title: "Renamed elsewhere" };
    const once = workspaceReducer(loaded, { type: "change", event: { table: "tasks", type: "upsert", row } });
    const twice = workspaceReducer(once, { type: "change", event: { table: "tasks", type: "upsert", row } });
    expect(twice.snapshot!.tasks).toHaveLength(snapshot.tasks.length);
    expect(twice.snapshot!.tasks.find((t) => t.id === row.id)!.title).toBe("Renamed elsewhere");
  });

  it("ignores rows that belong to another workspace", () => {
    const foreign = { ...snapshot.tasks[0], id: "foreign", workspaceId: "someone-else" };
    const next = workspaceReducer(loaded, { type: "change", event: { table: "tasks", type: "upsert", row: foreign } });
    expect(next.snapshot!.tasks.some((t) => t.id === "foreign")).toBe(false);
  });

  it("removes a deleted task together with its subtasks", () => {
    const withSubtasks = snapshot.subtasks[0].taskId;
    const next = workspaceReducer(loaded, { type: "change", event: { table: "tasks", type: "delete", id: withSubtasks } });
    expect(next.snapshot!.tasks.some((t) => t.id === withSubtasks)).toBe(false);
    expect(next.snapshot!.subtasks.some((s) => s.taskId === withSubtasks)).toBe(false);
  });
});
