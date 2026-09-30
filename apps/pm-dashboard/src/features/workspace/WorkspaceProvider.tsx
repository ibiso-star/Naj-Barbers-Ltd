"use client";

// Owns one workspace's data for the whole app shell: loads the snapshot,
// subscribes to realtime changes, and exposes write actions that update the
// UI optimistically, persist through the repository, and roll back with an
// explained error if the write is rejected (journeys J1/J3 failure paths).
import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode,
} from "react";
import { useToast } from "@/components/ui/Toaster";
import { DataError } from "@/lib/data/errors";
import { getRepository } from "@/lib/data/get-repository";
import type { ChangeEvent, Repository } from "@/lib/data/repository";
import type { InviteInput, NewProjectInput, NewTaskInput, TaskPatch } from "@/lib/data/schemas";
import type {
  CurrentUser, Project, Subtask, Task, TaskStatus, WorkspaceRole, WorkspaceSnapshot,
} from "@/lib/data/types";
import { STEP, byPosition, positionBetween } from "@/lib/tasks/ordering";
import { initialWorkspaceState, workspaceReducer, type WorkspaceState } from "./reducer";

interface WorkspaceApi {
  state: WorkspaceState;
  snapshot: WorkspaceSnapshot | null;
  me: CurrentUser | null;
  isAdmin: boolean;
  mode: Repository["mode"];
  reload(): void;
  createTask(input: NewTaskInput): Promise<Task | null>;
  updateTask(id: string, patch: TaskPatch): Promise<boolean>;
  moveTask(id: string, status: TaskStatus, position: number): Promise<boolean>;
  deleteTask(id: string): Promise<boolean>;
  createProject(input: NewProjectInput): Promise<Project | null>;
  addSubtask(taskId: string, title: string): Promise<boolean>;
  toggleSubtask(subtask: Subtask): Promise<boolean>;
  deleteSubtask(subtask: Subtask): Promise<boolean>;
  loadActivity(taskId: string): Promise<void>;
  invite(input: InviteInput): Promise<boolean>;
  revokeInvite(id: string): Promise<boolean>;
  setRole(userId: string, role: WorkspaceRole): Promise<boolean>;
  rename(name: string): Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceApi | null>(null);

const message = (e: unknown) =>
  e instanceof DataError ? e.message : "Something went wrong. Try again.";

export function WorkspaceProvider({ slug, me, children }: { slug: string; me: CurrentUser | null; children: ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const toast = useToast();
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // Rows with a write in flight ignore realtime echoes until the server's
  // own response lands, so a fast second edit is never overwritten by the
  // echo of the first.
  const pending = useRef(new Map<string, number>());
  const workspaceId = state.snapshot?.workspace.id ?? null;

  const load = useCallback(async () => {
    dispatch({ type: "loading" });
    try {
      const snapshot = await repo.loadWorkspace(slug);
      dispatch(snapshot ? { type: "loaded", snapshot } : { type: "forbidden" });
    } catch (e) {
      dispatch({ type: "failed", error: message(e) });
    }
  }, [repo, slug]);

  const resyncMembers = useCallback(async () => {
    const snapshot = await repo.loadWorkspace(slug).catch(() => null);
    if (!snapshot) return dispatch({ type: "forbidden" });
    dispatch({ type: "members", members: snapshot.members, invitations: snapshot.invitations });
    if (snapshot.workspace.name !== stateRef.current.snapshot?.workspace.name) {
      dispatch({ type: "renamed", name: snapshot.workspace.name });
    }
  }, [repo, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!workspaceId) return;
    return repo.subscribe(
      workspaceId,
      (event: ChangeEvent) => {
        if (event.table === "workspace") return void load();
        if (event.table === "members") return void resyncMembers();
        const id = event.type === "delete" ? event.id : event.row.id;
        if (pending.current.has(id)) return;
        dispatch({ type: "change", event });
      },
      (connection) => dispatch({ type: "connection", state: connection }),
    );
  }, [repo, workspaceId, load, resyncMembers]);

  // Warn before closing the tab while a write is still in flight.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const track = useCallback(async <T,>(id: string, run: () => Promise<T>): Promise<T> => {
    pending.current.set(id, (pending.current.get(id) ?? 0) + 1);
    try {
      return await run();
    } finally {
      const left = (pending.current.get(id) ?? 1) - 1;
      if (left <= 0) pending.current.delete(id);
      else pending.current.set(id, left);
    }
  }, []);

  // Stable identity: the task drawer calls this from an effect.
  const loadActivity = useCallback(
    async (taskId: string) => {
      const wsId = stateRef.current.snapshot?.workspace.id;
      if (!wsId) return;
      try {
        const rows = await repo.listActivity(wsId, taskId);
        dispatch({ type: "activity", rows });
      } catch {
        // The drawer shows what it already has; activity is non-critical.
      }
    },
    [repo],
  );

  const api = useMemo<WorkspaceApi>(() => {
    const snap = () => stateRef.current.snapshot;
    const ws = () => {
      const s = snap();
      if (!s) throw new DataError("not_found", "Workspace not loaded.");
      return s.workspace.id;
    };

    const updateTask = async (id: string, patch: TaskPatch) => {
      const before = snap()?.tasks.find((t) => t.id === id);
      if (!before) return false;
      dispatch({ type: "change", event: { table: "tasks", type: "upsert", row: { ...before, ...patch } } });
      try {
        const saved = await track(id, () => repo.updateTask(ws(), id, patch));
        dispatch({ type: "change", event: { table: "tasks", type: "upsert", row: saved } });
        void loadActivity(id);
        return true;
      } catch (e) {
        dispatch({ type: "change", event: { table: "tasks", type: "upsert", row: before } });
        toast.error(message(e), { label: "Retry", run: () => void updateTask(id, patch) });
        return false;
      }
    };

    return {
      state,
      snapshot: state.snapshot,
      me,
      isAdmin: state.snapshot?.workspace.role === "admin",
      mode: repo.mode,
      reload: () => void load(),

      async createTask(input) {
        const s = snap();
        if (!s) return null;
        const status = input.status ?? "todo";
        const column = s.tasks.filter((t) => t.status === status).sort(byPosition);
        const position = positionBetween(column.at(-1)?.position, undefined);
        const id = crypto.randomUUID();
        try {
          const task = await track(id, () => repo.createTask(ws(), { ...input, id, position }));
          dispatch({ type: "change", event: { table: "tasks", type: "upsert", row: task } });
          void loadActivity(id);
          return task;
        } catch (e) {
          toast.error(message(e));
          return null;
        }
      },

      updateTask,
      moveTask: (id, status, position) => updateTask(id, { status, position }),

      async deleteTask(id) {
        const before = snap()?.tasks.find((t) => t.id === id);
        if (!before) return false;
        dispatch({ type: "change", event: { table: "tasks", type: "delete", id } });
        try {
          await track(id, () => repo.deleteTask(ws(), id));
          return true;
        } catch (e) {
          dispatch({ type: "change", event: { table: "tasks", type: "upsert", row: before } });
          toast.error(message(e));
          return false;
        }
      },

      async createProject(input) {
        const id = crypto.randomUUID();
        try {
          const project = await track(id, () => repo.createProject(ws(), { ...input, id }));
          dispatch({ type: "change", event: { table: "projects", type: "upsert", row: project } });
          return project;
        } catch (e) {
          toast.error(message(e));
          return null;
        }
      },

      async addSubtask(taskId, title) {
        const s = snap();
        if (!s) return false;
        const siblings = s.subtasks.filter((x) => x.taskId === taskId).sort(byPosition);
        const position = (siblings.at(-1)?.position ?? 0) + STEP;
        const id = crypto.randomUUID();
        try {
          const row = await track(id, () => repo.createSubtask(ws(), taskId, { id, title, position }));
          dispatch({ type: "change", event: { table: "subtasks", type: "upsert", row } });
          void loadActivity(taskId);
          return true;
        } catch (e) {
          toast.error(message(e));
          return false;
        }
      },

      async toggleSubtask(subtask) {
        dispatch({ type: "change", event: { table: "subtasks", type: "upsert", row: { ...subtask, done: !subtask.done } } });
        try {
          const row = await track(subtask.id, () => repo.updateSubtask(ws(), subtask.id, { done: !subtask.done }));
          dispatch({ type: "change", event: { table: "subtasks", type: "upsert", row } });
          void loadActivity(subtask.taskId);
          return true;
        } catch (e) {
          dispatch({ type: "change", event: { table: "subtasks", type: "upsert", row: subtask } });
          toast.error(message(e));
          return false;
        }
      },

      async deleteSubtask(subtask) {
        dispatch({ type: "change", event: { table: "subtasks", type: "delete", id: subtask.id } });
        try {
          await track(subtask.id, () => repo.deleteSubtask(ws(), subtask.id));
          return true;
        } catch (e) {
          dispatch({ type: "change", event: { table: "subtasks", type: "upsert", row: subtask } });
          toast.error(message(e));
          return false;
        }
      },

      loadActivity,

      async invite(input) {
        try {
          await repo.inviteMember(ws(), input);
          await resyncMembers();
          toast.success(`Invitation recorded for ${input.email}.`);
          return true;
        } catch (e) {
          toast.error(message(e));
          return false;
        }
      },

      async revokeInvite(id) {
        try {
          await repo.revokeInvitation(ws(), id);
          await resyncMembers();
          return true;
        } catch (e) {
          toast.error(message(e));
          return false;
        }
      },

      async setRole(userId, role) {
        try {
          await repo.updateMemberRole(ws(), userId, role);
          await resyncMembers();
          return true;
        } catch (e) {
          toast.error(message(e));
          return false;
        }
      },

      async rename(name) {
        try {
          await repo.renameWorkspace(ws(), name);
          dispatch({ type: "renamed", name: name.trim() });
          toast.success("Workspace renamed.");
          return true;
        } catch (e) {
          toast.error(message(e));
          return false;
        }
      },
    };
  }, [state, me, repo, load, resyncMembers, toast, track, loadActivity]);

  return <WorkspaceContext.Provider value={api}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceApi {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

/** Only for components that render after the shell confirmed the snapshot. */
export function useSnapshot(): WorkspaceSnapshot {
  const { snapshot } = useWorkspace();
  if (!snapshot) throw new Error("useSnapshot called before the workspace loaded");
  return snapshot;
}
