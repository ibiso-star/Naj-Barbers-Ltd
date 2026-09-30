import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeelMark } from "@/components/brand/KeelMark";
import { isSupabaseConfigured, safeNextPath } from "@/lib/env";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (!isSupabaseConfigured()) redirect("/");
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const linkError = params.error === "link";

  return (
    <main className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-[360px]">
        <KeelMark size={28} />
        <h1 className="mt-6 text-[20px] font-medium tracking-tight">Sign in to Keel</h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">We&apos;ll email you a one-time sign-in link.</p>
        {linkError && (
          <p role="alert" className="mt-4 rounded-md border border-line-strong bg-raised px-3 py-2 text-[13px] text-[#f08a8a]">
            That sign-in link has expired or was already used. Request a new one.
          </p>
        )}
        <SignInForm next={next} />
      </div>
    </main>
  );
}
