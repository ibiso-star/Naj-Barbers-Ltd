// Hand-maintained mirror of supabase/migrations/0001_init.sql in the shape
// supabase-js expects. Replace with `supabase gen types typescript` output
// once a project is linked (decisions.md D-004). Insert/Update types list only
// the columns granted to the `authenticated` role (SEC-004).

type WorkspaceRole = "admin" | "member";
type TaskStatus = "backlog" | "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";
type ProjectStatus = "planned" | "active" | "paused" | "completed";

export type ProfileRow = { id: string; email: string; full_name: string; created_at: string }
export type WorkspaceRow = {
  id: string; slug: string; name: string; plan: "free" | "team" | "business";
  task_counter: number; created_by: string | null; created_at: string;
}
export type MemberRow = { workspace_id: string; user_id: string; role: WorkspaceRole; joined_at: string }
export type InvitationRow = {
  id: string; workspace_id: string; email: string; role: WorkspaceRole; invited_by: string | null;
  created_at: string; expires_at: string; accepted_at: string | null;
}
export type ProjectRow = {
  id: string; workspace_id: string; key: string; name: string; description: string;
  status: ProjectStatus; lead_id: string | null; budget_cents: number; color: string;
  start_date: string | null; target_date: string | null; created_by: string | null;
  created_at: string; updated_at: string;
}
export type TaskRow = {
  id: string; workspace_id: string; project_id: string | null; number: number; title: string;
  description: string; status: TaskStatus; priority: TaskPriority; assignee_id: string | null;
  due_date: string | null; position: number; completed_at: string | null; created_by: string | null;
  created_at: string; updated_at: string;
}
export type SubtaskRow = {
  id: string; workspace_id: string; task_id: string; title: string; done: boolean;
  position: number; created_at: string;
}
export type ActivityRow = {
  id: number; workspace_id: string; task_id: string; actor_id: string | null; kind: string;
  from_value: string | null; to_value: string | null; created_at: string;
}

type Table<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, never, Pick<ProfileRow, "full_name">>;
      workspaces: Table<WorkspaceRow, never, Partial<Pick<WorkspaceRow, "name">>>;
      workspace_members: Table<MemberRow, never, Partial<Pick<MemberRow, "role">>>;
      workspace_invitations: Table<
        InvitationRow,
        Pick<InvitationRow, "workspace_id" | "email"> & Partial<Pick<InvitationRow, "role" | "invited_by">>,
        never
      >;
      projects: Table<
        ProjectRow,
        Pick<ProjectRow, "workspace_id" | "key" | "name"> &
          Partial<Pick<ProjectRow, "id" | "description" | "status" | "lead_id" | "budget_cents" | "color" | "start_date" | "target_date">>,
        Partial<Pick<ProjectRow, "name" | "description" | "status" | "lead_id" | "budget_cents" | "color" | "start_date" | "target_date">>
      >;
      tasks: Table<
        TaskRow,
        Pick<TaskRow, "workspace_id" | "title"> &
          Partial<Pick<TaskRow, "id" | "project_id" | "description" | "status" | "priority" | "assignee_id" | "due_date" | "position">>,
        Partial<Pick<TaskRow, "project_id" | "title" | "description" | "status" | "priority" | "assignee_id" | "due_date" | "position">>
      >;
      subtasks: Table<
        SubtaskRow,
        Pick<SubtaskRow, "workspace_id" | "task_id" | "title"> & Partial<Pick<SubtaskRow, "id" | "done" | "position">>,
        Partial<Pick<SubtaskRow, "title" | "done" | "position">>
      >;
      task_activity: Table<ActivityRow, never, never>;
    };
    Views: { [_ in never]: never };
    Functions: {
      create_workspace: { Args: { p_name: string; p_slug: string }; Returns: WorkspaceRow };
    };
    Enums: {
      workspace_role: WorkspaceRole;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      project_status: ProjectStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
