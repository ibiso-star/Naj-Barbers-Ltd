import type { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/data/types";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};
export const PRIORITY_LABEL: Record<TaskPriority, string> = { high: "High", medium: "Medium", low: "Low" };
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned", active: "Active", paused: "Paused", completed: "Completed",
};

/**
 * Status glyphs follow the Linear convention: an empty dashed ring for
 * backlog, a ring for todo, a half-filled ring for in progress, a filled
 * check for done. Shape carries state, so colour is never the only cue.
 */
export function StatusIcon({ status, className = "size-3.5" }: { status: TaskStatus; className?: string }) {
  const common = { viewBox: "0 0 14 14", className, "aria-hidden": true } as const;
  switch (status) {
    case "backlog":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="#8e8e97" strokeWidth="1.5" strokeDasharray="2 2.2" />
        </svg>
      );
    case "todo":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="#a1a1aa" strokeWidth="1.5" />
        </svg>
      );
    case "in_progress":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="#fab219" strokeWidth="1.5" />
          <path d="M7 3.5a3.5 3.5 0 0 1 0 7z" fill="#fab219" />
        </svg>
      );
    case "done":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6.25" fill="#3987e5" />
          <path d="M4.3 7.2l1.8 1.8 3.6-3.8" fill="none" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

/** Signal-bar priority glyph; filled bar count encodes level. */
export function PriorityIcon({ priority, className = "size-3.5" }: { priority: TaskPriority; className?: string }) {
  const level = priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  const tone = priority === "high" ? "#ec835a" : "#a1a1aa";
  return (
    <svg viewBox="0 0 14 14" className={className} aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={2 + i * 3.8} y={9 - i * 3} width="2.6" height={3 + i * 3} rx="0.8" fill={i < level ? tone : "#3f3f46"} />
      ))}
    </svg>
  );
}
