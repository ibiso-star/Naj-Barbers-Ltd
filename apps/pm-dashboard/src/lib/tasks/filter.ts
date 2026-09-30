import Fuse from "fuse.js";
import type { Project, Task, TaskPriority } from "@/lib/data/types";

export interface TaskFilters {
  query: string;
  priorities: TaskPriority[];
  /** Member user IDs; the string "unassigned" matches tasks with no assignee. */
  assignees: string[];
  projectIds: string[];
}

export const UNASSIGNED = "unassigned";
export const EMPTY_FILTERS: TaskFilters = { query: "", priorities: [], assignees: [], projectIds: [] };

export function hasActiveFilters(f: TaskFilters): boolean {
  return Boolean(f.query.trim() || f.priorities.length || f.assignees.length || f.projectIds.length);
}

export function taskIdentifier(task: Pick<Task, "number" | "projectId">, projects: Pick<Project, "id" | "key">[]): string {
  const key = projects.find((p) => p.id === task.projectId)?.key ?? "TSK";
  return `${key}-${task.number}`;
}

/**
 * Structured filters first (cheap, exact), then fuzzy search over the rest.
 * Fuse ranks by relevance; the board keeps its own column order, so callers
 * get back the matching set rather than a ranking.
 */
export function filterTasks(tasks: Task[], filters: TaskFilters, projects: Pick<Project, "id" | "key">[]): Task[] {
  const structured = tasks.filter((t) => {
    if (filters.priorities.length && !filters.priorities.includes(t.priority)) return false;
    if (filters.projectIds.length && !(t.projectId && filters.projectIds.includes(t.projectId))) return false;
    if (filters.assignees.length) {
      const key = t.assigneeId ?? UNASSIGNED;
      if (!filters.assignees.includes(key)) return false;
    }
    return true;
  });
  const query = filters.query.trim();
  if (!query) return structured;

  const docs = structured.map((t) => ({ task: t, identifier: taskIdentifier(t, projects) }));
  const fuse = new Fuse(docs, {
    keys: [
      { name: "identifier", weight: 0.3 },
      { name: "task.title", weight: 0.6 },
      { name: "task.description", weight: 0.1 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  const matched = new Set(fuse.search(query).map((r) => r.item.task.id));
  return structured.filter((t) => matched.has(t.id));
}
