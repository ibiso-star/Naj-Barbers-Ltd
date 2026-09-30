// Browser-local implementation of Repository for demo mode (PRD.md §4 F9).
//
// State lives in localStorage so it survives reloads, and every write is
// broadcast over BroadcastChannel so other tabs of the same browser update
// instantly — the demo equivalent of Supabase Realtime. It enforces the same
// membership/role rules and server-owned fields as the RLS policies and
// triggers in supabase/migrations/0001_init.sql, so the UI behaves the same
// in both modes (including permission-denied paths).
import { DataError } from "./errors";
import type { ChangeEvent, ConnectionState, Repository } from "./repository";
import {
  inviteInput, newProjectInput, newSubtaskInput, newTaskInput, newWorkspaceInput, subtaskPatch,
  taskPatch, workspaceNameInput,
  type InviteInput, type NewProjectInput, type NewTaskInput, type SubtaskPatch, type TaskPatch,
} from "./schemas";
import { DEMO_USER_ID, materialiseSeed, type MaterialisedSeed } from "./seed";
import type {
  Activity, ActivityKind, CurrentUser, Invitation, Member, Project, Subtask, Task,
  WorkspaceMembership, WorkspaceRole, WorkspaceSnapshot,
} from "./types";

const STORAGE_KEY = "keel:demo:v1";
const CHANNEL = "keel-demo";
// A short artificial delay keeps loading and pending states honest in demo
// mode; without it they would never be seen or tested. Writes are persisted
// *before* the delay so a reload mid-request never loses them.
const LATENCY_MS = 120;

type State = MaterialisedSeed;
interface Broadcast { workspaceId: string; event: ChangeEvent }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();

function firstIssue(result: { success: false; error: { issues: { message: string }[] } }): never {
  throw new DataError("validation", result.error.issues[0]?.message ?? "Invalid input");
}

export class DemoRepository implements Repository {
  readonly mode = "demo" as const;
  private state: State;
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(b: Broadcast) => void>();
  private activitySerial = 0;

  constructor(private readonly userId: string = DEMO_USER_ID, initial?: State) {
    this.state = initial ?? this.readStorage() ?? materialiseSeed();
    this.activitySerial = this.state.activity.length;
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = (msg: MessageEvent<Broadcast>) => {
        // Another tab wrote; re-read the shared store, then fan out.
        this.state = this.readStorage() ?? this.state;
        this.listeners.forEach((l) => l(msg.data));
      };
    }
  }

  /** Discard local changes and restore the original sample data. */
  static reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode); nothing persisted to clear.
    }
  }

  private readStorage(): State | null {
    try {
      const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as State) : null;
    } catch {
      return null;
    }
  }

  private persist(workspaceId: string, events: ChangeEvent[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Quota or private mode: the demo keeps working in memory for this tab.
    }
    for (const event of events) this.channel?.postMessage({ workspaceId, event } satisfies Broadcast);
  }

  // --- authorisation, mirroring the RLS helpers -----------------------------

  private roleIn(workspaceId: string): WorkspaceRole | null {
    return this.state.members.find((m) => m.workspaceId === workspaceId && m.userId === this.userId)?.role ?? null;
  }
  private requireMember(workspaceId: string) {
    if (!this.roleIn(workspaceId)) throw new DataError("permission", "You are not a member of this workspace.");
  }
  private requireAdmin(workspaceId: string) {
    if (this.roleIn(workspaceId) !== "admin") {
      throw new DataError("permission", "Only workspace admins can do that.");
    }
  }
  private checkAssignee(workspaceId: string, assigneeId: string | null | undefined) {
    if (assigneeId && !this.state.members.some((m) => m.workspaceId === workspaceId && m.userId === assigneeId)) {
      throw new DataError("validation", "The assignee must be a member of this workspace.");
    }
  }
  private checkProject(workspaceId: string, projectId: string | null | undefined) {
    if (projectId && !this.state.projects.some((p) => p.id === projectId && p.workspaceId === workspaceId)) {
      throw new DataError("validation", "That project is not in this workspace.");
    }
  }

  private log(taskId: string, workspaceId: string, kind: ActivityKind, fromValue: string | null, toValue: string | null): Activity {
    this.activitySerial += 1;
    const row: Activity = {
      id: `demo-${Date.now()}-${this.activitySerial}`, workspaceId, taskId, actorId: this.userId,
      kind, fromValue, toValue, createdAt: nowIso(),
    };
    this.state.activity.push(row);
    return row;
  }

  // --- reads -----------------------------------------------------------------

  async currentUser(): Promise<CurrentUser | null> {
    const p = this.state.profiles.find((x) => x.id === this.userId);
    return p ? { id: p.id, email: p.email, fullName: p.fullName } : null;
  }

  async listWorkspaces(): Promise<WorkspaceMembership[]> {
    return this.state.members
      .filter((m) => m.userId === this.userId)
      .flatMap((m) => {
        const w = this.state.workspaces.find((x) => x.id === m.workspaceId);
        return w ? [{ ...w, role: m.role }] : [];
      });
  }

  async loadWorkspace(slug: string): Promise<WorkspaceSnapshot | null> {
    await sleep(LATENCY_MS * 3);
    const w = this.state.workspaces.find((x) => x.slug === slug);
    const role = w ? this.roleIn(w.id) : null;
    // Same shape as RLS: a non-member cannot distinguish "missing" from "forbidden".
    if (!w || !role) return null;
    const byWs = <T extends { workspaceId: string }>(xs: T[]) => xs.filter((x) => x.workspaceId === w.id);
    const members: Member[] = byWs(this.state.members).map((m) => ({
      ...m,
      profile: this.state.profiles.find((p) => p.id === m.userId) ?? { id: m.userId, email: "", fullName: "Unknown" },
    }));
    return {
      workspace: { ...w, role },
      members,
      invitations: byWs(this.state.invitations),
      projects: byWs(this.state.projects),
      tasks: byWs(this.state.tasks),
      subtasks: byWs(this.state.subtasks),
      activity: byWs(this.state.activity),
    };
  }

  async listActivity(workspaceId: string, taskId: string): Promise<Activity[]> {
    this.requireMember(workspaceId);
    return this.state.activity.filter((a) => a.workspaceId === workspaceId && a.taskId === taskId);
  }

  subscribe(workspaceId: string, onChange: (e: ChangeEvent) => void, onStatus: (s: ConnectionState) => void) {
    const listener = (b: Broadcast) => {
      if (b.workspaceId === workspaceId) onChange(b.event);
    };
    this.listeners.add(listener);
    onStatus(this.channel ? "live" : "offline");
    return () => {
      this.listeners.delete(listener);
    };
  }

  // --- tasks -----------------------------------------------------------------

  async createTask(workspaceId: string, input: NewTaskInput & { id: string; position: number }): Promise<Task> {
    this.requireMember(workspaceId);
    const { id, position, ...rest } = input;
    const parsed = newTaskInput.safeParse(rest);
    if (!parsed.success) firstIssue(parsed);
    const v = parsed.data;
    this.checkAssignee(workspaceId, v.assigneeId);
    this.checkProject(workspaceId, v.projectId);
    const number = (this.state.taskCounters[workspaceId] ?? 0) + 1;
    this.state.taskCounters[workspaceId] = number;
    const now = nowIso();
    const task: Task = {
      id, workspaceId, number, position, ...v,
      completedAt: v.status === "done" ? now : null,
      createdBy: this.userId, createdAt: now, updatedAt: now,
    };
    this.state.tasks.push(task);
    const activity = this.log(id, workspaceId, "created", null, task.status);
    this.persist(workspaceId, [
      { table: "tasks", type: "upsert", row: task },
      { table: "activity", type: "upsert", row: activity },
    ]);
    await sleep(LATENCY_MS);
    return task;
  }

  async updateTask(workspaceId: string, id: string, patch: TaskPatch): Promise<Task> {
    this.requireMember(workspaceId);
    const parsed = taskPatch.safeParse(patch);
    if (!parsed.success) firstIssue(parsed);
    const p = parsed.data;
    const index = this.state.tasks.findIndex((t) => t.id === id && t.workspaceId === workspaceId);
    if (index < 0) throw new DataError("not_found", "That task no longer exists.");
    if ("assigneeId" in p) this.checkAssignee(workspaceId, p.assigneeId);
    if ("projectId" in p) this.checkProject(workspaceId, p.projectId);

    const old = this.state.tasks[index];
    const next: Task = { ...old, ...p, updatedAt: nowIso() };
    if (next.status === "done" && old.status !== "done") next.completedAt = nowIso();
    if (next.status !== "done") next.completedAt = null;
    this.state.tasks[index] = next;

    const logged: Activity[] = [];
    const diff = (kind: ActivityKind, a: string | null, b: string | null) => {
      if (a !== b) logged.push(this.log(id, workspaceId, kind, a, b));
    };
    diff("status", old.status, next.status);
    diff("assignee", old.assigneeId, next.assigneeId);
    diff("priority", old.priority, next.priority);
    diff("due_date", old.dueDate, next.dueDate);
    diff("title", old.title, next.title);
    diff("project", old.projectId, next.projectId);
    if (old.description !== next.description) logged.push(this.log(id, workspaceId, "description", null, null));

    this.persist(workspaceId, [
      { table: "tasks", type: "upsert", row: next },
      ...logged.map((row) => ({ table: "activity" as const, type: "upsert" as const, row })),
    ]);

    await sleep(LATENCY_MS);
    return next;
  }

  async deleteTask(workspaceId: string, id: string): Promise<void> {
    this.requireMember(workspaceId);
    this.state.tasks = this.state.tasks.filter((t) => t.id !== id);
    this.state.subtasks = this.state.subtasks.filter((s) => s.taskId !== id);
    this.state.activity = this.state.activity.filter((a) => a.taskId !== id);
    this.persist(workspaceId, [{ table: "tasks", type: "delete", id }]);
    await sleep(LATENCY_MS);
  }

  // --- projects --------------------------------------------------------------

  async createProject(workspaceId: string, input: NewProjectInput & { id: string }): Promise<Project> {
    this.requireMember(workspaceId);
    const { id, ...rest } = input;
    const parsed = newProjectInput.safeParse(rest);
    if (!parsed.success) firstIssue(parsed);
    const v = parsed.data;
    if (this.state.projects.some((p) => p.workspaceId === workspaceId && p.key === v.key)) {
      throw new DataError("conflict", `A project with key ${v.key} already exists.`);
    }
    this.checkAssignee(workspaceId, v.leadId);
    const now = nowIso();
    const project: Project = {
      id, workspaceId, key: v.key, name: v.name, description: v.description, status: v.status,
      leadId: v.leadId, budgetCents: v.budgetPounds * 100, color: v.color,
      startDate: now.slice(0, 10), targetDate: v.targetDate, createdAt: now, updatedAt: now,
    };
    this.state.projects.push(project);
    this.persist(workspaceId, [{ table: "projects", type: "upsert", row: project }]);
    await sleep(LATENCY_MS);
    return project;
  }

  // --- subtasks --------------------------------------------------------------

  async createSubtask(workspaceId: string, taskId: string, input: { id: string; title: string; position: number }) {
    this.requireMember(workspaceId);
    const parsed = newSubtaskInput.safeParse({ title: input.title });
    if (!parsed.success) firstIssue(parsed);
    if (!this.state.tasks.some((t) => t.id === taskId && t.workspaceId === workspaceId)) {
      throw new DataError("not_found", "That task no longer exists.");
    }
    const subtask: Subtask = {
      id: input.id, workspaceId, taskId, title: parsed.data.title, done: false,
      position: input.position, createdAt: nowIso(),
    };
    this.state.subtasks.push(subtask);
    const activity = this.log(taskId, workspaceId, "subtask_added", null, subtask.title);
    this.persist(workspaceId, [
      { table: "subtasks", type: "upsert", row: subtask },
      { table: "activity", type: "upsert", row: activity },
    ]);
    await sleep(LATENCY_MS);
    return subtask;
  }

  async updateSubtask(workspaceId: string, id: string, patch: SubtaskPatch): Promise<Subtask> {
    this.requireMember(workspaceId);
    const parsed = subtaskPatch.safeParse(patch);
    if (!parsed.success) firstIssue(parsed);
    const index = this.state.subtasks.findIndex((s) => s.id === id && s.workspaceId === workspaceId);
    if (index < 0) throw new DataError("not_found", "That subtask no longer exists.");
    const old = this.state.subtasks[index];
    const next = { ...old, ...parsed.data };
    this.state.subtasks[index] = next;
    const events: ChangeEvent[] = [{ table: "subtasks", type: "upsert", row: next }];
    if (next.done && !old.done) {
      events.push({ table: "activity", type: "upsert", row: this.log(old.taskId, workspaceId, "subtask_completed", null, next.title) });
    }
    this.persist(workspaceId, events);
    await sleep(LATENCY_MS);
    return next;
  }

  async deleteSubtask(workspaceId: string, id: string): Promise<void> {
    this.requireMember(workspaceId);
    this.state.subtasks = this.state.subtasks.filter((s) => s.id !== id);
    this.persist(workspaceId, [{ table: "subtasks", type: "delete", id }]);
    await sleep(LATENCY_MS);
  }

  // --- members & workspace ---------------------------------------------------

  async inviteMember(workspaceId: string, input: InviteInput): Promise<Invitation> {
    this.requireAdmin(workspaceId);
    const parsed = inviteInput.safeParse(input);
    if (!parsed.success) firstIssue(parsed);
    const { email, role } = parsed.data;
    const memberEmails = this.state.members
      .filter((m) => m.workspaceId === workspaceId)
      .map((m) => this.state.profiles.find((p) => p.id === m.userId)?.email);
    if (memberEmails.includes(email)) throw new DataError("conflict", "That person is already a member.");
    if (this.state.invitations.some((i) => i.workspaceId === workspaceId && i.email === email)) {
      throw new DataError("conflict", "That email already has a pending invitation.");
    }
    const created = new Date();
    const invitation: Invitation = {
      id: crypto.randomUUID(), workspaceId, email, role, invitedBy: this.userId,
      createdAt: created.toISOString(),
      expiresAt: new Date(created.getTime() + 30 * 86_400_000).toISOString(),
    };
    this.state.invitations.push(invitation);
    this.persist(workspaceId, [{ table: "members", type: "resync" }]);
    await sleep(LATENCY_MS);
    return invitation;
  }

  async revokeInvitation(workspaceId: string, id: string): Promise<void> {
    this.requireAdmin(workspaceId);
    this.state.invitations = this.state.invitations.filter((i) => i.id !== id);
    this.persist(workspaceId, [{ table: "members", type: "resync" }]);
    await sleep(LATENCY_MS);
  }

  async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<Member> {
    this.requireAdmin(workspaceId);
    const member = this.state.members.find((m) => m.workspaceId === workspaceId && m.userId === userId);
    if (!member) throw new DataError("not_found", "That member has left the workspace.");
    const admins = this.state.members.filter((m) => m.workspaceId === workspaceId && m.role === "admin");
    if (member.role === "admin" && role !== "admin" && admins.length === 1) {
      throw new DataError("validation", "A workspace needs at least one admin");
    }
    member.role = role;
    this.persist(workspaceId, [{ table: "members", type: "resync" }]);
    await sleep(LATENCY_MS);
    const profile = this.state.profiles.find((p) => p.id === userId)!;
    return { ...member, profile };
  }

  async renameWorkspace(workspaceId: string, name: string): Promise<void> {
    this.requireAdmin(workspaceId);
    const parsed = workspaceNameInput.safeParse(name);
    if (!parsed.success) firstIssue(parsed);
    const w = this.state.workspaces.find((x) => x.id === workspaceId);
    if (w) w.name = parsed.data;
    this.persist(workspaceId, [{ table: "workspace", type: "resync" }]);
    await sleep(LATENCY_MS);
  }

  async createWorkspace(name: string, slug: string): Promise<WorkspaceMembership> {
    const parsed = newWorkspaceInput.safeParse({ name, slug });
    if (!parsed.success) firstIssue(parsed);
    if (this.state.workspaces.some((w) => w.slug === parsed.data.slug)) {
      throw new DataError("conflict", "That URL is taken. Try another.");
    }
    const workspace = {
      id: crypto.randomUUID(), slug: parsed.data.slug, name: parsed.data.name,
      plan: "free" as const, createdAt: nowIso(),
    };
    this.state.workspaces.push(workspace);
    this.state.members.push({ workspaceId: workspace.id, userId: this.userId, role: "admin", joinedAt: nowIso() });
    this.persist(workspace.id, []);
    await sleep(LATENCY_MS);
    return { ...workspace, role: "admin" };
  }
}
