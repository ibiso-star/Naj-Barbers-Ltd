import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerClient } from "@/lib/supabase/server";

// Demo mode always opens the sample workspace where the demo user is admin.
const DEMO_HOME = "/w/atlas/overview";

export default async function Home() {
  if (!isSupabaseConfigured()) redirect(DEMO_HOME);

  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, joined_at")
    .eq("user_id", data.user.id)
    .order("joined_at");
  const first = memberships?.[0];
  if (!first) redirect("/onboarding");
  const { data: ws } = await supabase.from("workspaces").select("slug").eq("id", first.workspace_id).single();
  redirect(ws ? `/w/${ws.slug}/overview` : "/onboarding");
}
