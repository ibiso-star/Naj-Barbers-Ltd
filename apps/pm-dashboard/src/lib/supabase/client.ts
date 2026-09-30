import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/data/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser client. @supabase/ssr stores the session in cookies (not
 * localStorage) so the server can verify it too (SEC-002).
 */
export function getBrowserClient() {
  client ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
