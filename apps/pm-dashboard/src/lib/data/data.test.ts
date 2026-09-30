import { beforeEach, describe, expect, it } from "vitest";
import { DemoRepository } from "./demo-repository";
import { DataError } from "./errors";
import { newTaskInput, taskPatch } from "./schemas";
import {
  DEMO_USER_ID, SEED_MEMBERS, SEED_PROJECTS, SEED_SUBTASKS, SEED_TASKS, SEED_USERS, SEED_WORKSPACES, materialiseSeed,
} from "./seed";

const NOW = new Date("2026-09-30T12:00:00Z");
const ATLAS = SEED_WORKSPACES.find((w) => w.slug === "atlas")!.id; // demo user: admin
const BEACON = SEED_WORKSPACES.find((w) => w.slug === "beacon")!.id; // demo user: member
const HARBOR = SEED_WORKSPACES.find((w) => w.slug === "harbor")!.id; // demo user: not a member
// Someone with no Atlas membership (Beacon's admin).
const OUTSIDER = SEED_USERS.find((u) => !SEED_MEMBERS.some((m) => m.workspaceId === ATLAS && m.userId === u.id))!.id;

async function rejects(p: Promise<unknown>, kind: DataError["kind"]) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof DataError && e.kind === kind);
}

describe("seed", () => {
  it("has unique ids and valid references", () => {
    const ids = [...SEED_USERS, ...SEED_WORKSPACES, ...SEED_PROJECTS, ...SEED_TASKS, ...SEED_SUBTASKS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of SEED_TASKS) {
      const project = SEED_PROJECTS.find((p) => p.id === t.projectId);
      expect(project?.workspaceId).toBe(t.workspaceId);
      if (t.assigneeId) {
        expect(SEED_MEMBERS.some((m) => m.workspaceId === t.workspaceId && m.userId === t.assigneeId)).toBe(true);
      }
      expect(t.status === "done").toBe(t.completedHoursAgo !== null);
    }
  });

  it("spreads completions across the last six months so the charts have history", () => {
    const months = new Set(
      materialiseSeed(NOW).tasks.filter((t) => t.completedAt).map((t) => t.completedAt!.slice(0, 7)),
    );
    expect(months.size).toBeGreaterThanOrEqual(6);
  });

  it("is deterministic", () => {
    expect(materialiseSeed(NOW)).toEqual(materialiseSeed(NOW));
  });
});

describe("schemas (SEC-004 allow-list)", () => {
  it("rejects server-owned fields on create and update", () => {
    expect(newTaskInput.safeParse({ title: "x", number: 5 }).success).toBe(false);
    expect(newTaskInput.safeParse({ title: "x", workspaceId: HARBOR }).success).toBe(false);
    expect(taskPatch.safeParse({ completedAt: "2020-01-01" }).success).toBe(false);
    expect(taskPatch.safeParse({ createdBy: DEMO_USER_ID }).success).toBe(false);
  });
  it("trims titles and rejects blank ones", () => {
    expect(newTaskInput.parse({ title: "  Ship it  " }).title).toBe("Ship it");
    expect(newTaskInput.safeParse({ title: "   " }).success).toBe(false);
  });
});

describe("DemoRepository mirrors the RLS rules", () => {
  let repo: DemoRepository;
  beforeEach(() => {
    repo = new DemoRepository(DEMO_USER_ID, materialiseSeed(NOW));
  });

  it("lists only the user's workspaces and hides others (J2)", async () => {
    const slugs = (await repo.listWorkspaces()).map((w) => w.slug).sort();
    expect(slugs).toEqual(["atlas", "beacon"]);
    expect(await repo.loadWorkspace("harbor")).toBeNull();
    expect(await repo.loadWorkspace("does-not-exist")).toBeNull();
  });

  it("scopes a snapshot strictly to one workspace", async () => {
    const snap = (await repo.loadWorkspace("atlas"))!;
    for (const list of [snap.tasks, snap.projects, snap.subtasks, snap.activity, snap.members]) {
      expect(list.every((x) => x.workspaceId === ATLAS)).toBe(true);
    }
    expect(snap.workspace.role).toBe("admin");
  });

  it("creates a task with server-owned number, creator and activity (J1)", async () => {
    const task = await repo.createTask(ATLAS, { id: crypto.randomUUID(), position: 99_000, title: "New thing", priority: "high", dueDate: "2026-10-05" });
    const snap = (await repo.loadWorkspace("atlas"))!;
    expect(task.number).toBe(Math.max(...snap.tasks.filter((t) => t.id !== task.id).map((t) => t.number)) + 1);
    expect(task).toMatchObject({ status: "todo", createdBy: DEMO_USER_ID, completedAt: null });
    expect(snap.activity.some((a) => a.taskId === task.id && a.kind === "created")).toBe(true);
  });

  it("stamps completion on done, clears it on reopen, and logs each change", async () => {
    const t = (await repo.loadWorkspace("atlas"))!.tasks.find((x) => x.status === "todo")!;
    const done = await repo.updateTask(ATLAS, t.id, { status: "done" });
    expect(done.completedAt).not.toBeNull();
    const reopened = await repo.updateTask(ATLAS, t.id, { status: "in_progress" });
    expect(reopened.completedAt).toBeNull();
    const log = await repo.listActivity(ATLAS, t.id);
    expect(log.filter((a) => a.kind === "status").map((a) => a.toValue).slice(-2)).toEqual(["done", "in_progress"]);
  });

  it("refuses assignees and projects from outside the workspace", async () => {
    const t = SEED_TASKS.find((x) => x.workspaceId === ATLAS)!;
    await rejects(repo.updateTask(ATLAS, t.id, { assigneeId: OUTSIDER }), "validation");
    const beaconProject = SEED_PROJECTS.find((p) => p.workspaceId === BEACON)!.id;
    await rejects(repo.updateTask(ATLAS, t.id, { projectId: beaconProject }), "validation");
  });

  it("refuses writes to a workspace the user is not in", async () => {
    await rejects(repo.createTask(HARBOR, { id: crypto.randomUUID(), position: 1, title: "Injected" }), "permission");
    const harborTask = SEED_TASKS.find((x) => x.workspaceId === HARBOR)!;
    await rejects(repo.updateTask(HARBOR, harborTask.id, { title: "Pwned" }), "permission");
  });

  it("lets admins invite and change roles but not members (J4)", async () => {
    await rejects(repo.inviteMember(BEACON, { email: "x@example.test" }), "permission");
    await rejects(repo.renameWorkspace(BEACON, "Hijacked"), "permission");
    const invite = await repo.inviteMember(ATLAS, { email: "New.Person@Example.test", role: "member" });
    expect(invite.email).toBe("new.person@example.test");
    await rejects(repo.inviteMember(ATLAS, { email: "new.person@example.test" }), "conflict");
  });

  it("keeps at least one admin", async () => {
    const other = SEED_MEMBERS.find((m) => m.workspaceId === ATLAS && m.role === "admin" && m.userId !== DEMO_USER_ID)!;
    await repo.updateMemberRole(ATLAS, other.userId, "member");
    await rejects(repo.updateMemberRole(ATLAS, DEMO_USER_ID, "member"), "validation");
  });
});
