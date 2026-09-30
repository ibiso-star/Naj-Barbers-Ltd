// Domain types used by the UI. They mirror supabase/migrations/0001_init.sql
// one-to-one (snake_case columns become camelCase fields); the mapping lives
// only in mappers.ts so the rest of the app never sees database names.

export type WorkspaceRole = "admin" | "member";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type ProjectStatus = "planned" | "active" | "paused" | "completed";
export type WorkspacePlan = "free" | "team" | "business";

export const TASK_STATUSES: readonly TaskStatus[] = ["backlog", "todo", "in_progress", "done"];
export const TASK_PRIORITIES: readonly TaskPriority[] = ["high", "medium", "low"];
export const PROJECT_STATUSES: readonly ProjectStatus[] = ["planned", "active", "paused", "completed"];

export interface Profile {
  id: string;
  email: string;
  fullName: string;
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  plan: WorkspacePlan;
  createdAt: string;
}

/** A workspace as seen by the signed-in user: includes their own role. */
export interface WorkspaceMembership extends Workspace {
  role: WorkspaceRole;
}

export interface Member {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  profile: Profile;
}

export interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  leadId: string | null;
  budgetCents: number;
  color: string;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string | null;
  number: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  /** ISO date (yyyy-mm-dd), no time zone. */
  dueDate: string | null;
  position: number;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  workspaceId: string;
  taskId: string;
  title: string;
  done: boolean;
  position: number;
  createdAt: string;
}

export type ActivityKind =
  | "created"
  | "status"
  | "assignee"
  | "priority"
  | "due_date"
  | "title"
  | "project"
  | "description"
  | "subtask_added"
  | "subtask_completed";

export interface Activity {
  id: string;
  workspaceId: string;
  taskId: string;
  actorId: string | null;
  kind: ActivityKind;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
}

/** Everything the UI needs for one workspace, loaded in one pass. */
export interface WorkspaceSnapshot {
  workspace: WorkspaceMembership;
  members: Member[];
  invitations: Invitation[];
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
  activity: Activity[];
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
}
