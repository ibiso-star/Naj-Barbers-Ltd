// The UI talks to data only through this interface. Two implementations:
// SupabaseRepository (production) and DemoRepository (browser-local sample
// data). Both enforce the same role rules; in Supabase mode the database is
// the authority and the client checks are only for fast feedback.
import type { InviteInput, NewProjectInput, NewTaskInput, SubtaskPatch, TaskPatch } from "./schemas";
import type {
  Activity, CurrentUser, Invitation, Member, Project, Subtask, Task, WorkspaceMembership,
  WorkspaceRole, WorkspaceSnapshot,
} from "./types";

/** A change pushed by realtime; applied idempotently by the store. */
export type ChangeEvent =
  | { table: "tasks"; type: "upsert"; row: Task }
  | { table: "tasks"; type: "delete"; id: string }
  | { table: "projects"; type: "upsert"; row: Project }
  | { table: "projects"; type: "delete"; id: string }
  | { table: "subtasks"; type: "upsert"; row: Subtask }
  | { table: "subtasks"; type: "delete"; id: string }
  | { table: "activity"; type: "upsert"; row: Activity }
  | { table: "members"; type: "resync" }
  | { table: "workspace"; type: "resync" };

export type ConnectionState = "connecting" | "live" | "offline";

export interface Repository {
  readonly mode: "demo" | "supabase";
  currentUser(): Promise<CurrentUser | null>;
  listWorkspaces(): Promise<WorkspaceMembership[]>;
  /** Returns null when the workspace does not exist or the user is not a member. */
  loadWorkspace(slug: string): Promise<WorkspaceSnapshot | null>;
  subscribe(
    workspaceId: string,
    onChange: (event: ChangeEvent) => void,
    onStatus: (state: ConnectionState) => void,
  ): () => void;

  createTask(workspaceId: string, input: NewTaskInput & { id: string; position: number }): Promise<Task>;
  updateTask(workspaceId: string, id: string, patch: TaskPatch): Promise<Task>;
  deleteTask(workspaceId: string, id: string): Promise<void>;

  createProject(workspaceId: string, input: NewProjectInput & { id: string }): Promise<Project>;

  createSubtask(workspaceId: string, taskId: string, input: { id: string; title: string; position: number }): Promise<Subtask>;
  updateSubtask(workspaceId: string, id: string, patch: SubtaskPatch): Promise<Subtask>;
  deleteSubtask(workspaceId: string, id: string): Promise<void>;

  listActivity(workspaceId: string, taskId: string): Promise<Activity[]>;

  inviteMember(workspaceId: string, input: InviteInput): Promise<Invitation>;
  revokeInvitation(workspaceId: string, id: string): Promise<void>;
  updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<Member>;
  renameWorkspace(workspaceId: string, name: string): Promise<void>;
  createWorkspace(name: string, slug: string): Promise<WorkspaceMembership>;
}
