import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/data/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** Server client bound to the request's session cookie; RLS applies as that user. */
export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
