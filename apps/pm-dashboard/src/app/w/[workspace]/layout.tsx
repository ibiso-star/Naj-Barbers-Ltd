import { redirect } from "next/navigation";
import { AppShell } from "@/features/shell/AppShell";
import { NoAccess } from "@/features/shell/StatusScreens";
import type { CurrentUser } from "@/lib/data/types";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Server-side gate for every workspace page (SEC-001, journey J2). In
 * Supabase mode the membership query runs as the signed-in user under RLS,
 * so a slug the user does not belong to returns nothing and renders the
 * no-access screen; the client never receives that workspace's data.
 */
export default async function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspace]">) {
  const { workspace: slug } = await params;
  let me: CurrentUser | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await getServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect(`/login?next=${encodeURIComponent(`/w/${slug}/overview`)}`);
    const { data: ws } = await supabase.from("workspaces").select("id").eq("slug", slug).maybeSingle();
    if (!ws) return <NoAccess slug={slug} />;
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
    me = { id: data.user.id, email: data.user.email ?? "", fullName: profile?.full_name || data.user.email || "" };
  }

  return (
    <AppShell slug={slug} me={me}>
      {children}
    </AppShell>
  );
}
