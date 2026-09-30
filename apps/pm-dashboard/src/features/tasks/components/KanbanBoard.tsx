"use client";

import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors,
  type Announcements, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { Plus } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useShellUi } from "@/features/shell/ui-context";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/data/types";
import { byPosition, positionBetween } from "@/lib/tasks/ordering";
import { STATUS_LABEL, StatusIcon } from "../meta";
import { TaskCardBody, type CardContext } from "./TaskCard";

type Columns = Record<TaskStatus, string[]>;
const COLUMN_PREFIX = "column:";

function group(tasks: Task[]): Columns {
  const cols = { backlog: [], todo: [], in_progress: [], done: [] } as Columns;
  for (const t of [...tasks].sort(byPosition)) cols[t.status].push(t.id);
  return cols;
}

function containerOf(cols: Columns, id: string): TaskStatus | null {
  if (id.startsWith(COLUMN_PREFIX)) return id.slice(COLUMN_PREFIX.length) as TaskStatus;
  return TASK_STATUSES.find((s) => cols[s].includes(id)) ?? null;
}

const SortableCard = memo(function SortableCard({ task, ctx, onOpen }: { task: Task; ctx: CardContext; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  // The <li> keeps list semantics; the draggable button role lives inside it.
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className="list-none">
      <div
      className={clsx(
        "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent",
        // The dragged card leaves a dashed slot showing where it will land.
        isDragging && "rounded-md border border-dashed border-accent/60 [&>*]:invisible",
      )}
      {...attributes}
      {...listeners}
      aria-roledescription="Draggable task"
      aria-label={`${task.title}. Press Enter to open, Space to move.`}
      onClick={() => onOpen(task.id)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter" && !e.isDefaultPrevented()) {
          // Consume it: otherwise the same keypress activates the drawer's
          // Close button, which receives focus as the drawer opens.
          e.preventDefault();
          onOpen(task.id);
        }
      }}
      data-testid="task-card"
    >
      <TaskCardBody task={task} ctx={ctx} />
      </div>
    </li>
  );
});

function Column({
  status, ids, tasksById, ctx, onOpen, total,
}: {
  status: TaskStatus;
  ids: string[];
  tasksById: Map<string, Task>;
  ctx: CardContext;
  onOpen: (id: string) => void;
  total: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${status}` });
  const ui = useShellUi();
  return (
    <section
      aria-labelledby={`col-${status}`}
      className="flex w-[292px] shrink-0 flex-col rounded-lg border border-line bg-surface md:w-auto md:min-w-0 md:flex-1"
      data-testid={`column-${status}`}
    >
      <header className="flex h-10 items-center gap-2 px-3">
        <StatusIcon status={status} />
        <h2 id={`col-${status}`} className="text-[13px] font-medium">{STATUS_LABEL[status]}</h2>
        <span className="font-mono text-[12px] text-ink-muted" aria-label={`${ids.length} tasks`}>
          {ids.length}
          {ids.length !== total && <span>/{total}</span>}
        </span>
        <button
          type="button" onClick={() => ui.newTask({ status })} aria-label={`Add task to ${STATUS_LABEL[status]}`}
          className="ml-auto rounded p-1 text-ink-muted hover:bg-hover hover:text-ink"
        >
          <Plus aria-hidden className="size-3.5" />
        </button>
      </header>
      <SortableContext id={status} items={ids} strategy={verticalListSortingStrategy}>
        <ol
          ref={setNodeRef}
          className={clsx(
            "scroll-thin flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 transition-colors",
            isOver && "bg-hover/40",
          )}
        >
          {ids.map((id) => {
            const task = tasksById.get(id);
            return task ? <SortableCard key={id} task={task} ctx={ctx} onOpen={onOpen} /> : null;
          })}
          {ids.length === 0 && (
            <li className="flex h-20 list-none items-center justify-center rounded-md border border-dashed border-line text-[12px] text-ink-muted">
              Drop tasks here
            </li>
          )}
        </ol>
      </SortableContext>
    </section>
  );
}

/** F4: drag between and within columns; each drop persists one row. */
export function KanbanBoard({ tasks, allTasks, ctx }: { tasks: Task[]; allTasks: Task[]; ctx: CardContext }) {
  const { moveTask } = useWorkspace();
  const ui = useShellUi();
  const derived = useMemo(() => group(tasks), [tasks]);
  const totals = useMemo(() => group(allTasks), [allTasks]);
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const [dragCols, setDragCols] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const cols = dragCols ?? derived;

  const sensors = useSensors(
    // A small threshold keeps a click (open drawer) distinct from a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  const title = (id: string | number) => tasksById.get(String(id))?.title ?? "task";
  const colName = (id: string | number | undefined) => {
    const c = id ? containerOf(cols, String(id)) : null;
    return c ? STATUS_LABEL[c] : "the board";
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${title(active.id)}.`,
    onDragOver: ({ active, over }) => `${title(active.id)} is over ${colName(over?.id)}.`,
    onDragEnd: ({ active, over }) => `${title(active.id)} dropped in ${colName(over?.id)}.`,
    onDragCancel: ({ active }) => `Moving ${title(active.id)} cancelled.`,
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setDragCols(derived);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || !dragCols) return;
    const from = containerOf(dragCols, String(active.id));
    const to = containerOf(dragCols, String(over.id));
    if (!from || !to || from === to) return;
    setDragCols((prev) => {
      if (!prev) return prev;
      const source = prev[from].filter((id) => id !== active.id);
      const target = [...prev[to]];
      const overIndex = target.indexOf(String(over.id));
      target.splice(overIndex >= 0 ? overIndex : target.length, 0, String(active.id));
      return { ...prev, [from]: source, [to]: target };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const working = dragCols;
    setActiveId(null);
    setDragCols(null);
    if (!over || !working) return;
    const id = String(active.id);
    const status = containerOf(working, id);
    if (!status) return;
    let list = working[status];
    const overIndex = list.indexOf(String(over.id));
    const fromIndex = list.indexOf(id);
    if (overIndex >= 0 && overIndex !== fromIndex) list = arrayMove(list, fromIndex, overIndex);

    const index = list.indexOf(id);
    const before = index > 0 ? tasksById.get(list[index - 1])?.position : undefined;
    const after = index < list.length - 1 ? tasksById.get(list[index + 1])?.position : undefined;
    const task = tasksById.get(id);
    if (!task) return;
    const unchanged = task.status === status && derived[status].indexOf(id) === index;
    if (unchanged) return;
    void moveTask(id, status, positionBetween(before, after));
  }

  const active = activeId ? tasksById.get(activeId) : undefined;
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setDragCols(null);
      }}
      accessibility={{ announcements }}
    >
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-3 md:px-6 md:py-4" data-testid="kanban">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status} status={status} ids={cols[status]} tasksById={tasksById} ctx={ctx}
            onOpen={ui.openTask} total={totals[status].length}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
        {/* Tilt an inner element: a transform on the measured node would skew
            keyboard collision detection toward cards in the same column. */}
        {active ? (
          <div className="cursor-grabbing">
            <div className="rotate-[1.5deg]"><TaskCardBody task={active} ctx={ctx} dragging /></div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
