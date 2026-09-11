import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AdminSession {
  userId: string;
  fullName: string;
  role: "admin" | "barber";
}

/** Returns the signed-in staff profile, or null if not signed in / not staff. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return { userId: user.id, fullName: profile.full_name, role: profile.role };
}
