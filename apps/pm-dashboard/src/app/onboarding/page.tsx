import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeelMark } from "@/components/brand/KeelMark";
import { CreateWorkspaceForm } from "@/features/shell/CreateWorkspaceForm";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create a workspace" };

/** Empty path for J2: a signed-in user with no workspaces. */
export default async function OnboardingPage() {
  if (isSupabaseConfigured()) {
    const supabase = await getServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/login?next=/onboarding");
  }
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <KeelMark size={28} />
        <h1 className="mt-6 text-[20px] font-medium tracking-tight">Create a workspace</h1>
        <p className="mt-1.5 text-[13px] leading-5 text-ink-soft">
          A workspace holds one team&apos;s projects and tasks. If a teammate already uses Keel, ask them to invite you instead.
        </p>
        <CreateWorkspaceForm />
      </div>
    </main>
  );
}
