// Allow-listed input shapes for every write (SEC-004/SEC-013). `.strict()`
// rejects unknown keys, so a caller cannot smuggle server-owned fields such as
// `number`, `workspaceId` on update, or `role` through a patch. These give the
// UI early feedback; the database grants and CHECK constraints in
// 0001_init.sql are the real gate and mirror these limits.
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");
const title = z.string().trim().min(1, "Title is required").max(200, "Keep the title under 200 characters");

export const taskStatus = z.enum(["backlog", "todo", "in_progress", "done"]);
export const taskPriority = z.enum(["low", "medium", "high"]);
export const workspaceRole = z.enum(["admin", "member"]);

export const newTaskInput = z
  .object({
    title,
    description: z.string().max(10_000).default(""),
    status: taskStatus.default("todo"),
    priority: taskPriority.default("medium"),
    projectId: z.uuid().nullable().default(null),
    assigneeId: z.uuid().nullable().default(null),
    dueDate: isoDate.nullable().default(null),
  })
  .strict();
export type NewTaskInput = z.input<typeof newTaskInput>;

export const taskPatch = z
  .object({
    title,
    description: z.string().max(10_000),
    status: taskStatus,
    priority: taskPriority,
    projectId: z.uuid().nullable(),
    assigneeId: z.uuid().nullable(),
    dueDate: isoDate.nullable(),
    position: z.number().finite(),
  })
  .partial()
  .strict();
export type TaskPatch = z.infer<typeof taskPatch>;

export const newProjectInput = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    key: z
      .string()
      .trim()
      .transform((s) => s.toUpperCase())
      .pipe(z.string().regex(/^[A-Z]{2,5}$/, "2–5 letters, e.g. WEB")),
    description: z.string().max(2000).default(""),
    status: z.enum(["planned", "active", "paused", "completed"]).default("planned"),
    leadId: z.uuid().nullable().default(null),
    // Budgets are entered in whole pounds; stored as integer pence.
    budgetPounds: z.number().int().min(0).max(1_000_000_000).default(0),
    color: z.string().regex(/^#[0-9a-f]{6}$/).default("#3987e5"),
    targetDate: isoDate.nullable().default(null),
  })
  .strict();
export type NewProjectInput = z.input<typeof newProjectInput>;

export const newSubtaskInput = z.object({ title }).strict();
export const subtaskPatch = z.object({ title, done: z.boolean() }).partial().strict();
export type SubtaskPatch = z.infer<typeof subtaskPatch>;

export const inviteInput = z
  .object({
    email: z.email("Enter a valid email address").max(254).transform((s) => s.toLowerCase()),
    role: workspaceRole.default("member"),
  })
  .strict();
export type InviteInput = z.input<typeof inviteInput>;

export const workspaceNameInput = z.string().trim().min(1, "Name is required").max(80);

export const newWorkspaceInput = z
  .object({
    name: workspaceNameInput,
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/, "Lowercase letters, numbers and dashes"),
  })
  .strict();
