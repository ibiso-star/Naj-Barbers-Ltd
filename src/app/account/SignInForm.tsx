"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-lg bg-cream px-4 py-3 text-sm text-navy/70">
        Sign-in requires Supabase to be configured — see <code>.env.example</code>.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <p className="rounded-lg bg-gold/10 px-4 py-3 text-sm text-navy">
        Check your email for a sign-in link.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        required
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm outline-none focus:border-navy"
      />
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send sign-in link"}
      </Button>
      {status === "error" && (
        <p className="text-sm text-red-600">Something went wrong — try again.</p>
      )}
    </form>
  );
}
