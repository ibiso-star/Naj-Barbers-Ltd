"use client";

import { isSupabaseConfigured } from "@/lib/env";
import { getBrowserClient } from "@/lib/supabase/client";
import { DemoRepository } from "./demo-repository";
import type { Repository } from "./repository";
import { SupabaseRepository } from "./supabase-repository";

let repo: Repository | null = null;

/** One repository per browser tab; its mode is fixed by the build's env. */
export function getRepository(): Repository {
  repo ??= isSupabaseConfigured() ? new SupabaseRepository(getBrowserClient()) : new DemoRepository();
  return repo;
}
