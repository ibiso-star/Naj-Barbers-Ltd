"use client";

import { createContext, useContext } from "react";
import type { NewTaskInput } from "@/lib/data/schemas";

/** Global overlays any page can open: task drawer and create/invite modals. */
export interface ShellUi {
  openTask(id: string): void;
  newTask(defaults?: Partial<NewTaskInput>): void;
  newProject(): void;
  invite(): void;
}

export const ShellUiContext = createContext<ShellUi | null>(null);

export function useShellUi(): ShellUi {
  const ctx = useContext(ShellUiContext);
  if (!ctx) throw new Error("useShellUi must be used inside AppShell");
  return ctx;
}
