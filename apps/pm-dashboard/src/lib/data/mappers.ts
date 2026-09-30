// The only place database column names meet domain field names.
import type {
  ActivityRow, InvitationRow, MemberRow, ProfileRow, ProjectRow, SubtaskRow, TaskRow, WorkspaceRow,
} from "./database.types";
import type {
  Activity, ActivityKind, Invitation, Member, Profile, Project, Subtask, Task, Workspace,
} from "./types";

export const toProfile = (r: ProfileRow): Profile => ({ id: r.id, email: r.email, fullName: r.full_name });

export const toWorkspace = (r: WorkspaceRow): Workspace => ({
  id: r.id, slug: r.slug, name: r.name, plan: r.plan, createdAt: r.created_at,
});

export const toMember = (r: MemberRow, profile: Profile): Member => ({
  workspaceId: r.workspace_id, userId: r.user_id, role: r.role, joinedAt: r.joined_at, profile,
});

export const toInvitation = (r: InvitationRow): Invitation => ({
  id: r.id, workspaceId: r.workspace_id, email: r.email, role: r.role, invitedBy: r.invited_by,
  createdAt: r.created_at, expiresAt: r.expires_at,
});

export const toProject = (r: ProjectRow): Project => ({
  id: r.id, workspaceId: r.workspace_id, key: r.key, name: r.name, description: r.description,
  status: r.status, leadId: r.lead_id, budgetCents: Number(r.budget_cents), color: r.color,
  startDate: r.start_date, targetDate: r.target_date, createdAt: r.created_at, updatedAt: r.updated_at,
});

export const toTask = (r: TaskRow): Task => ({
  id: r.id, workspaceId: r.workspace_id, projectId: r.project_id, number: r.number, title: r.title,
  description: r.description, status: r.status, priority: r.priority, assigneeId: r.assignee_id,
  dueDate: r.due_date, position: r.position, completedAt: r.completed_at, createdBy: r.created_by,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

export const toSubtask = (r: SubtaskRow): Subtask => ({
  id: r.id, workspaceId: r.workspace_id, taskId: r.task_id, title: r.title, done: r.done,
  position: r.position, createdAt: r.created_at,
});

export const toActivity = (r: ActivityRow): Activity => ({
  id: String(r.id), workspaceId: r.workspace_id, taskId: r.task_id, actorId: r.actor_id,
  kind: r.kind as ActivityKind, fromValue: r.from_value, toValue: r.to_value, createdAt: r.created_at,
});
