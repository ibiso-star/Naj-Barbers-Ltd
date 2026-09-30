"use client";

import { clsx } from "clsx";
import {
  ChevronsLeft, ChevronsRight, ChevronsUpDown, FolderKanban, LayoutDashboard, List, LogOut, Plus,
  Settings, SquareKanban, UserPlus, Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Kbd } from "@/components/ui/Kbd";
import { OptionRow, Popover } from "@/components/ui/Popover";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { getRepository } from "@/lib/data/get-repository";
import type { WorkspaceMembership } from "@/lib/data/types";
import { getBrowserClient } from "@/lib/supabase/client";
import { useShellUi } from "./ui-context";

function WorkspaceSwitcher({ slug, collapsed }: { slug: string; collapsed: boolean }) {
  const { snapshot } = useWorkspace();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[] | null>(null);

  useEffect(() => {
    let live = true;
    getRepository()
      .listWorkspaces()
      .then((ws) => live && setWorkspaces(ws))
      .catch(() => live && setWorkspaces([]));
    return () => {
      live = false;
    };
  }, [snapshot?.workspace.name]);

  const current = snapshot?.workspace;
  const name = current?.name ?? "Loading…";
  return (
    <Popover
      label="Switch workspace"
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={`Workspace: ${name}. Switch workspace`}
          className={clsx(
            "flex h-9 w-full items-center gap-2 rounded-md px-1.5 text-left hover:bg-hover",
            collapsed && "justify-center",
          )}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded bg-accent-strong text-[11px] font-semibold text-white">
            {name.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{name}</span>
              <ChevronsUpDown aria-hidden className="size-3.5 text-ink-muted" />
            </>
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="w-60">
          <p className="px-2 pt-1.5 pb-1 text-[11.5px] text-ink-muted">Your workspaces</p>
          {workspaces === null && <p className="px-2 py-2 text-[13px] text-ink-muted">Loading…</p>}
          {workspaces?.map((w) => (
            <OptionRow
              key={w.id}
              selected={w.slug === slug}
              onSelect={() => {
                close();
                if (w.slug !== slug) router.push(`/w/${w.slug}/overview`);
              }}
            >
              <span className="truncate">{w.name}</span>
              <span className="ml-auto pr-1 text-[11.5px] text-ink-muted capitalize">{w.role}</span>
            </OptionRow>
          ))}
          <div className="my-1 border-t border-line" />
          <Link
            href="/onboarding"
            onClick={close}
            className="flex h-8 items-center gap-2 rounded px-2 text-[13px] text-ink-soft hover:bg-hover hover:text-ink"
          >
            <Plus aria-hidden className="size-3.5" /> Create workspace
          </Link>
        </div>
      )}
    </Popover>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (path: string, view: string | null) => boolean;
}

export function Sidebar({
  slug, collapsed, onToggle, onNavigate,
}: {
  slug: string;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const view = useSearchParams().get("view");
  const { me, mode, state, isAdmin } = useWorkspace();
  const ui = useShellUi();
  const router = useRouter();
  const base = `/w/${slug}`;

  const nav: NavItem[] = [
    { href: `${base}/overview`, label: "Overview", icon: LayoutDashboard, match: (p) => p.endsWith("/overview") },
    { href: `${base}/projects`, label: "Projects", icon: FolderKanban, match: (p) => p.endsWith("/projects") },
    { href: `${base}/tasks`, label: "Board", icon: SquareKanban, match: (p, v) => p.endsWith("/tasks") && v !== "list" },
    { href: `${base}/tasks?view=list`, label: "List", icon: List, match: (p, v) => p.endsWith("/tasks") && v === "list" },
    { href: `${base}/team`, label: "Team", icon: Users, match: (p) => p.endsWith("/team") },
    { href: `${base}/settings`, label: "Settings & billing", icon: Settings, match: (p) => p.endsWith("/settings") },
  ];

  const displayName = me?.fullName ?? (mode === "demo" ? "Demo User" : "");
  const connection = state.connection;

  const link = (item: NavItem, indent = false) => {
    const active = item.match(pathname, view);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          title={collapsed ? item.label : undefined}
          className={clsx(
            "flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors",
            active ? "bg-hover text-ink" : "text-ink-soft hover:bg-hover hover:text-ink",
            collapsed && "justify-center px-0",
            indent && !collapsed && "pl-7",
          )}
        >
          <Icon aria-hidden className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Workspace" className={clsx("flex h-full flex-col gap-2 p-2", collapsed ? "w-[52px]" : "w-[232px]")}>
      <div className={clsx("flex items-center gap-1", collapsed && "flex-col")}>
        <div className="min-w-0 flex-1">
          <WorkspaceSwitcher slug={slug} collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar  [" : "Collapse sidebar  ["}
          className="hidden size-7 shrink-0 items-center justify-center rounded text-ink-muted hover:bg-hover hover:text-ink md:flex"
        >
          {collapsed ? <ChevronsRight aria-hidden className="size-4" /> : <ChevronsLeft aria-hidden className="size-4" />}
        </button>
      </div>

      <button
        type="button"
        onClick={() => ui.newTask()}
        className={clsx(
          "flex h-8 items-center gap-2 rounded-md border border-line-strong bg-raised px-2 text-[13px] text-ink hover:bg-hover",
          collapsed && "justify-center px-0",
        )}
        aria-label="New task"
      >
        <Plus aria-hidden className="size-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">New task</span>
            <Kbd>C</Kbd>
          </>
        )}
      </button>

      <ul className="mt-2 flex flex-col gap-0.5">
        {link(nav[0])}
        {link(nav[1])}
        {!collapsed && (
          <li className="mt-2 px-2 pb-1 text-[11.5px] font-medium text-ink-muted" aria-hidden>
            Tasks
          </li>
        )}
        {link(nav[2], true)}
        {link(nav[3], true)}
        {!collapsed && <li className="mt-2" aria-hidden />}
        {link(nav[4])}
        {link(nav[5])}
      </ul>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={() => ui.invite()}
          title={isAdmin ? "Invite team" : "Only admins can invite"}
          className={clsx(
            "flex h-8 items-center gap-2 rounded-md px-2 text-[13px] text-ink-soft hover:bg-hover hover:text-ink",
            collapsed && "justify-center px-0",
          )}
        >
          <UserPlus aria-hidden className="size-4 shrink-0" />
          {!collapsed && "Invite team"}
        </button>

        {mode === "demo" && !collapsed && (
          <p className="rounded-md border border-line px-2 py-1.5 text-[11.5px] leading-4 text-ink-muted">
            <span className="font-medium text-warning">Demo data.</span> Fictional sample workspace stored in this browser.
          </p>
        )}

        <div className={clsx("flex items-center gap-2 border-t border-line px-1 pt-2", collapsed && "flex-col")}>
          <Avatar id={me?.id ?? "demo"} name={displayName} size={22} />
          {!collapsed && <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">{displayName}</span>}
          <span
            role="status"
            title={connection === "live" ? "Live: changes sync instantly" : connection === "offline" ? "Offline: reconnecting" : "Connecting"}
            className="flex items-center gap-1 text-[11px] text-ink-muted"
          >
            <span
              aria-hidden
              className={clsx("size-1.5 rounded-full", connection === "live" ? "bg-good" : connection === "offline" ? "bg-critical" : "bg-warning")}
            />
            {!collapsed && (connection === "live" ? "Live" : connection === "offline" ? "Offline" : "…")}
          </span>
          {mode === "supabase" && (
            <button
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={async () => {
                await getBrowserClient().auth.signOut();
                router.replace("/login");
                router.refresh();
              }}
              className="rounded p-1 text-ink-muted hover:bg-hover hover:text-ink"
            >
              <LogOut aria-hidden className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
