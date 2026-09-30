// Pure state transitions for one workspace. Realtime events, optimistic
// updates and server responses all flow through the same idempotent upserts,
// so receiving an event twice (our own echo, a reconnect) is harmless.
import type { ChangeEvent, ConnectionState } from "@/lib/data/repository";
import type { Activity, Invitation, Member, Project, Subtask, Task, WorkspaceSnapshot } from "@/lib/data/types";

export type LoadStatus = "loading" | "ready" | "forbidden" | "error";

export interface WorkspaceState {
  status: LoadStatus;
  error: string | null;
  snapshot: WorkspaceSnapshot | null;
  connection: ConnectionState;
}

export const initialWorkspaceState: WorkspaceState = {
  status: "loading",
  error: null,
  snapshot: null,
  connection: "connecting",
};

export type Action =
  | { type: "loading" }
  | { type: "loaded"; snapshot: WorkspaceSnapshot }
  | { type: "forbidden" }
  | { type: "failed"; error: string }
  | { type: "connection"; state: ConnectionState }
  | { type: "change"; event: ChangeEvent }
  | { type: "members"; members: Member[]; invitations: Invitation[] }
  | { type: "activity"; rows: Activity[] }
  | { type: "renamed"; name: string };

function upsert<T extends { id: string }>(list: T[], row: T): T[] {
  const i = list.findIndex((x) => x.id === row.id);
  if (i < 0) return [...list, row];
  const next = list.slice();
  next[i] = row;
  return next;
}
const remove = <T extends { id: string }>(list: T[], id: string) => list.filter((x) => x.id !== id);

function applyChange(s: WorkspaceSnapshot, e: ChangeEvent): WorkspaceSnapshot {
  switch (e.table) {
    case "tasks":
      if (e.type === "delete") {
        return {
          ...s,
          tasks: remove(s.tasks, e.id),
          subtasks: s.subtasks.filter((x) => x.taskId !== e.id),
          activity: s.activity.filter((x) => x.taskId !== e.id),
        };
      }
      // Never let a row from another workspace into this view.
      return e.row.workspaceId === s.workspace.id ? { ...s, tasks: upsert<Task>(s.tasks, e.row) } : s;
    case "projects":
      if (e.type === "delete") return { ...s, projects: remove(s.projects, e.id) };
      return e.row.workspaceId === s.workspace.id ? { ...s, projects: upsert<Project>(s.projects, e.row) } : s;
    case "subtasks":
      if (e.type === "delete") return { ...s, subtasks: remove(s.subtasks, e.id) };
      return e.row.workspaceId === s.workspace.id ? { ...s, subtasks: upsert<Subtask>(s.subtasks, e.row) } : s;
    case "activity":
      return e.row.workspaceId === s.workspace.id ? { ...s, activity: upsert<Activity>(s.activity, e.row) } : s;
    default:
      // "members" / "workspace" resyncs are handled by the provider (refetch).
      return s;
  }
}

export function workspaceReducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null };
    case "loaded":
      return { ...state, status: "ready", error: null, snapshot: action.snapshot };
    case "forbidden":
      return { ...state, status: "forbidden", snapshot: null };
    case "failed":
      return { ...state, status: "error", error: action.error };
    case "connection":
      return { ...state, connection: action.state };
    case "change":
      return state.snapshot ? { ...state, snapshot: applyChange(state.snapshot, action.event) } : state;
    case "members":
      return state.snapshot
        ? { ...state, snapshot: { ...state.snapshot, members: action.members, invitations: action.invitations } }
        : state;
    case "activity": {
      if (!state.snapshot) return state;
      let activity = state.snapshot.activity;
      for (const row of action.rows) activity = upsert(activity, row);
      return { ...state, snapshot: { ...state.snapshot, activity } };
    }
    case "renamed":
      return state.snapshot
        ? { ...state, snapshot: { ...state.snapshot, workspace: { ...state.snapshot.workspace, name: action.name } } }
        : state;
  }
}
