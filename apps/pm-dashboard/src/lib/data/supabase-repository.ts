// Supabase implementation of Repository. Every query is additionally scoped
// by workspace_id for performance and clarity, but authorisation is enforced
// by RLS and column grants in supabase/migrations/0001_init.sql — this file
// never decides who may do what (SEC-001).
import type { RealtimePostgresChangesPayload, SupabaseClient } from "@supabase/supabase-js";
import type { ActivityRow, Database, ProjectRow, SubtaskRow, TaskRow } from "./database.types";
import { DataError, fromPostgrestError } from "./errors";
import {
  toActivity, toInvitation, toMember, toProfile, toProject, toSubtask, toTask, toWorkspace,
} from "./mappers";
import type { ChangeEvent, ConnectionState, Repository } from "./repository";
import {
  inviteInput, newProjectInput, newSubtaskInput, newTaskInput, newWorkspaceInput, subtaskPatch,
  taskPatch, workspaceNameInput,
  type InviteInput, type NewProjectInput, type NewTaskInput, type SubtaskPatch, type TaskPatch,
} from "./schemas";
import type {
  Activity, CurrentUser, Invitation, Member, Project, Subtask, Task, WorkspaceMembership,
  WorkspaceRole, WorkspaceSnapshot,
} from "./types";

type Client = SupabaseClient<Database>;

// v1 loads a workspace in one pass; beyond this the board needs paging
// (CODE-008 is open until then — see release-checklist.md).
const MAX_TASKS = 2000;
const RECENT_ACTIVITY = 300;

function unwrap<T>(result: { data: T; error: { code?: string; message: string } | null }): NonNullable<T> {
  if (result.error) throw fromPostgrestError(result.error);
  if (result.data === null || result.data === undefined) throw new DataError("not_found", "That item no longer exists.");
  return result.data;
}

/**
 * Admin-only writes that RLS filters out affect zero rows, which PostgREST
 * reports as "not found". To the user that is a permission problem.
 */
async function asAdmin<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof DataError && e.kind === "not_found") {
      throw new DataError("permission", "Only workspace admins can do that.");
    }
    throw e;
  }
}

function parse<T>(schema: { safeParse(v: unknown): { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } }, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new DataError("validation", r.error.issues[0]?.message ?? "Invalid input");
  return r.data;
}

export class SupabaseRepository implements Repository {
  readonly mode = "supabase" as const;

  constructor(private readonly db: Client) {}

  private async uid(): Promise<string> {
    const { data } = await this.db.auth.getUser();
    if (!data.user) throw new DataError("permission", "Your session has expired. Sign in again.");
    return data.user.id;
  }

  async currentUser(): Promise<CurrentUser | null> {
    const { data } = await this.db.auth.getUser();
    if (!data.user) return null;
    const profile = await this.db.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      fullName: profile.data?.full_name || data.user.email || "",
    };
  }

  async listWorkspaces(): Promise<WorkspaceMembership[]> {
    const userId = await this.uid();
    const memberships = unwrap(await this.db.from("workspace_members").select("*").eq("user_id", userId));
    if (memberships.length === 0) return [];
    const workspaces = unwrap(
      await this.db.from("workspaces").select("*").in("id", memberships.map((m) => m.workspace_id)).order("name"),
    );
    return workspaces.map((w) => ({
      ...toWorkspace(w),
      role: memberships.find((m) => m.workspace_id === w.id)!.role,
    }));
  }

  async loadWorkspace(slug: string): Promise<WorkspaceSnapshot | null> {
    const userId = await this.uid();
    const ws = await this.db.from("workspaces").select("*").eq("slug", slug).maybeSingle();
    if (ws.error) throw fromPostgrestError(ws.error);
    // RLS hides workspaces the user does not belong to: null covers both cases.
    if (!ws.data) return null;
    const id = ws.data.id;

    const [members, projects, tasks, subtasks, invitations, activity] = await Promise.all([
      this.db.from("workspace_members").select("*").eq("workspace_id", id),
      this.db.from("projects").select("*").eq("workspace_id", id).order("created_at"),
      this.db.from("tasks").select("*").eq("workspace_id", id).order("position").range(0, MAX_TASKS - 1),
      this.db.from("subtasks").select("*").eq("workspace_id", id).order("position"),
      this.db
        .from("workspace_invitations")
        .select("*")
        .eq("workspace_id", id)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString()),
      this.db
        .from("task_activity")
        .select("*")
        .eq("workspace_id", id)
        .order("created_at", { ascending: false })
        .limit(RECENT_ACTIVITY),
    ]);
    const memberRows = unwrap(members);
    const me = memberRows.find((m) => m.user_id === userId);
    if (!me) return null;
    const profiles = unwrap(
      await this.db.from("profiles").select("*").in("id", memberRows.map((m) => m.user_id)),
    ).map(toProfile);
    const profileFor = (uid: string) =>
      profiles.find((p) => p.id === uid) ?? { id: uid, email: "", fullName: "Unknown member" };

    return {
      workspace: { ...toWorkspace(ws.data), role: me.role },
      members: memberRows.map((m) => toMember(m, profileFor(m.user_id))),
      projects: unwrap(projects).map(toProject),
      tasks: unwrap(tasks).map(toTask),
      subtasks: unwrap(subtasks).map(toSubtask),
      invitations: unwrap(invitations).map(toInvitation),
      activity: unwrap(activity).map(toActivity),
    };
  }

  async listActivity(workspaceId: string, taskId: string): Promise<Activity[]> {
    const rows = unwrap(
      await this.db
        .from("task_activity")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("task_id", taskId)
        .order("created_at"),
    );
    return rows.map(toActivity);
  }

  subscribe(workspaceId: string, onChange: (e: ChangeEvent) => void, onStatus: (s: ConnectionState) => void) {
    const filter = `workspace_id=eq.${workspaceId}`;
    let wasLive = false;
    const channel = this.db
      .channel(`workspace:${workspaceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter },
        (p: RealtimePostgresChangesPayload<TaskRow>) =>
          onChange(p.eventType === "DELETE"
            ? { table: "tasks", type: "delete", id: String(p.old.id) }
            : { table: "tasks", type: "upsert", row: toTask(p.new) }))
      .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter },
        (p: RealtimePostgresChangesPayload<ProjectRow>) =>
          onChange(p.eventType === "DELETE"
            ? { table: "projects", type: "delete", id: String(p.old.id) }
            : { table: "projects", type: "upsert", row: toProject(p.new) }))
      .on("postgres_changes", { event: "*", schema: "public", table: "subtasks", filter },
        (p: RealtimePostgresChangesPayload<SubtaskRow>) =>
          onChange(p.eventType === "DELETE"
            ? { table: "subtasks", type: "delete", id: String(p.old.id) }
            : { table: "subtasks", type: "upsert", row: toSubtask(p.new) }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "task_activity", filter },
        (p: RealtimePostgresChangesPayload<ActivityRow>) => {
          if (p.eventType === "INSERT") onChange({ table: "activity", type: "upsert", row: toActivity(p.new) });
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_members", filter },
        () => onChange({ table: "members", type: "resync" }))
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // After a dropped connection, changes may have been missed: refetch.
          if (wasLive) onChange({ table: "workspace", type: "resync" });
          wasLive = true;
          onStatus("live");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          onStatus("offline");
        } else {
          onStatus("connecting");
        }
      });
    return () => {
      void this.db.removeChannel(channel);
    };
  }

  async createTask(workspaceId: string, input: NewTaskInput & { id: string; position: number }): Promise<Task> {
    const { id, position, ...rest } = input;
    const v = parse(newTaskInput, rest);
    const row = unwrap(
      await this.db
        .from("tasks")
        .insert({
          id, workspace_id: workspaceId, position, title: v.title, description: v.description,
          status: v.status, priority: v.priority, project_id: v.projectId,
          assignee_id: v.assigneeId, due_date: v.dueDate,
        })
        .select()
        .single(),
    );
    return toTask(row);
  }

  async updateTask(workspaceId: string, id: string, patch: TaskPatch): Promise<Task> {
    const p = parse(taskPatch, patch);
    const row: Database["public"]["Tables"]["tasks"]["Update"] = {};
    if (p.title !== undefined) row.title = p.title;
    if (p.description !== undefined) row.description = p.description;
    if (p.status !== undefined) row.status = p.status;
    if (p.priority !== undefined) row.priority = p.priority;
    if (p.projectId !== undefined) row.project_id = p.projectId;
    if (p.assigneeId !== undefined) row.assignee_id = p.assigneeId;
    if (p.dueDate !== undefined) row.due_date = p.dueDate;
    if (p.position !== undefined) row.position = p.position;
    return toTask(
      unwrap(await this.db.from("tasks").update(row).eq("id", id).eq("workspace_id", workspaceId).select().single()),
    );
  }

  async deleteTask(workspaceId: string, id: string): Promise<void> {
    const { error } = await this.db.from("tasks").delete().eq("id", id).eq("workspace_id", workspaceId);
    if (error) throw fromPostgrestError(error);
  }

  async createProject(workspaceId: string, input: NewProjectInput & { id: string }): Promise<Project> {
    const { id, ...rest } = input;
    const v = parse(newProjectInput, rest);
    return toProject(
      unwrap(
        await this.db
          .from("projects")
          .insert({
            id, workspace_id: workspaceId, key: v.key, name: v.name, description: v.description,
            status: v.status, lead_id: v.leadId, budget_cents: v.budgetPounds * 100, color: v.color,
            start_date: new Date().toISOString().slice(0, 10), target_date: v.targetDate,
          })
          .select()
          .single(),
      ),
    );
  }

  async createSubtask(workspaceId: string, taskId: string, input: { id: string; title: string; position: number }): Promise<Subtask> {
    const v = parse(newSubtaskInput, { title: input.title });
    return toSubtask(
      unwrap(
        await this.db
          .from("subtasks")
          .insert({ id: input.id, workspace_id: workspaceId, task_id: taskId, title: v.title, position: input.position })
          .select()
          .single(),
      ),
    );
  }

  async updateSubtask(workspaceId: string, id: string, patch: SubtaskPatch): Promise<Subtask> {
    const v = parse(subtaskPatch, patch);
    return toSubtask(
      unwrap(await this.db.from("subtasks").update(v).eq("id", id).eq("workspace_id", workspaceId).select().single()),
    );
  }

  async deleteSubtask(workspaceId: string, id: string): Promise<void> {
    const { error } = await this.db.from("subtasks").delete().eq("id", id).eq("workspace_id", workspaceId);
    if (error) throw fromPostgrestError(error);
  }

  async inviteMember(workspaceId: string, input: InviteInput): Promise<Invitation> {
    const v = parse(inviteInput, input);
    const invitedBy = await this.uid();
    return toInvitation(
      unwrap(
        await this.db
          .from("workspace_invitations")
          .insert({ workspace_id: workspaceId, email: v.email, role: v.role, invited_by: invitedBy })
          .select()
          .single(),
      ),
    );
  }

  async revokeInvitation(workspaceId: string, id: string): Promise<void> {
    const { error } = await this.db.from("workspace_invitations").delete().eq("id", id).eq("workspace_id", workspaceId);
    if (error) throw fromPostgrestError(error);
  }

  async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<Member> {
    const row = await asAdmin(async () =>
      unwrap(
        await this.db
          .from("workspace_members")
          .update({ role })
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)
          .select()
          .single(),
      ),
    );
    const profile = unwrap(await this.db.from("profiles").select("*").eq("id", userId).single());
    return toMember(row, toProfile(profile));
  }

  async renameWorkspace(workspaceId: string, name: string): Promise<void> {
    const v = parse(workspaceNameInput, name);
    await asAdmin(async () =>
      unwrap(await this.db.from("workspaces").update({ name: v }).eq("id", workspaceId).select().single()),
    );
  }

  async createWorkspace(name: string, slug: string): Promise<WorkspaceMembership> {
    const v = parse(newWorkspaceInput, { name, slug });
    const row = unwrap(await this.db.rpc("create_workspace", { p_name: v.name, p_slug: v.slug }));
    return { ...toWorkspace(row), role: "admin" };
  }
}
