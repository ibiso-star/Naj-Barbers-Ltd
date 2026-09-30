import type { Metadata } from "next";
import { TasksView } from "@/features/tasks/TasksView";

export const metadata: Metadata = { title: "Tasks" };

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function TasksPage({ searchParams }: PageProps<"/w/[workspace]/tasks">) {
  const params = await searchParams;
  return (
    <TasksView
      view={params.view === "list" ? "list" : "board"}
      initialAssignee={one(params.assignee)}
      initialProject={one(params.project)}
    />
  );
}
