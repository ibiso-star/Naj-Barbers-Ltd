"use client";

import { clsx } from "clsx";
import { Menu } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { KeelMark } from "@/components/brand/KeelMark";
import { InviteModal } from "@/features/team/InviteModal";
import { NewProjectModal } from "@/features/projects/NewProjectModal";
import { NewTaskModal } from "@/features/tasks/components/NewTaskModal";
import { TaskDrawer } from "@/features/tasks/components/TaskDrawer";
import { WorkspaceProvider, useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { getRepository } from "@/lib/data/get-repository";
import type { NewTaskInput } from "@/lib/data/schemas";
import type { CurrentUser } from "@/lib/data/types";
import { Sidebar } from "./Sidebar";
import { LoadError, NoAccess, PageSkeleton } from "./StatusScreens";
import { ShellUiContext, type ShellUi } from "./ui-context";

const COLLAPSE_KEY = "keel:sidebar-collapsed";

/** True when a keystroke should be left to the focused control. */
function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.closest("dialog")));
}

function ShellFrame({ slug, children }: { slug: string; children: ReactNode }) {
  const { state, reload } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Partial<NewTaskInput> | null>(null);
  const [newProject, setNewProject] = useState(false);
  const [invite, setInvite] = useState(false);

  // Sidebar preference is a per-browser convenience, so localStorage is fine.
  useEffect(() => {
    try {
      // Reading a browser-only preference after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // Storage blocked: default to expanded.
    }
  }, []);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        // Preference just won't persist.
      }
      return !c;
    });
  }, []);

  const ui = useMemo<ShellUi>(
    () => ({
      openTask: setTaskId,
      newTask: (defaults) => setNewTask(defaults ?? {}),
      newProject: () => setNewProject(true),
      invite: () => setInvite(true),
    }),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "c") {
        e.preventDefault();
        setNewTask({});
      } else if (e.key === "[") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  if (state.status === "forbidden") return <NoAccess slug={slug} />;

  const ready = state.status === "ready";
  return (
    <ShellUiContext.Provider value={ui}>
      <div className="flex h-full min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden shrink-0 border-r border-line bg-surface md:block">
          <Suspense>
            <Sidebar slug={slug} collapsed={collapsed} onToggle={toggleCollapsed} />
          </Suspense>
        </aside>

        {/* Mobile off-canvas sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="relative h-full w-[240px] border-r border-line bg-surface">
              <Suspense>
                <Sidebar slug={slug} collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
              </Suspense>
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-11 items-center gap-2 border-b border-line px-3 md:hidden">
            <button type="button" aria-label="Open menu" onClick={() => setMobileOpen(true)} className="rounded p-1.5 text-ink-soft hover:bg-hover">
              <Menu aria-hidden className="size-4" />
            </button>
            <KeelMark size={18} />
            <span className="truncate text-[13px] font-medium">{state.snapshot?.workspace.name ?? "Keel"}</span>
          </div>
          <main id="main" className={clsx("flex min-h-0 flex-1 flex-col overflow-y-auto", !ready && "overflow-hidden")}>
            {state.status === "loading" && !state.snapshot && <PageSkeleton />}
            {state.status === "error" && <LoadError message={state.error ?? ""} onRetry={reload} />}
            {state.snapshot && children}
          </main>
        </div>
      </div>

      {state.snapshot && (
        <>
          <TaskDrawer taskId={taskId} onClose={() => setTaskId(null)} />
          <NewTaskModal defaults={newTask} onClose={() => setNewTask(null)} />
          <NewProjectModal open={newProject} onClose={() => setNewProject(false)} />
          <InviteModal open={invite} onClose={() => setInvite(false)} />
        </>
      )}
    </ShellUiContext.Provider>
  );
}

export function AppShell({ slug, me, children }: { slug: string; me: CurrentUser | null; children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(me);
  useEffect(() => {
    if (me) return;
    let live = true;
    getRepository()
      .currentUser()
      .then((u) => live && setUser(u))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [me]);

  return (
    <WorkspaceProvider slug={slug} me={user}>
      <ShellFrame slug={slug}>{children}</ShellFrame>
    </WorkspaceProvider>
  );
}
