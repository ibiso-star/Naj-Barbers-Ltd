"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { getBrowserClient } from "@/lib/supabase/client";

export function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await getBrowserClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setState(error ? "error" : "sent");
  }

  // Same confirmation whether or not the address has an account (SEC-009).
  if (state === "sent") {
    return (
      <p role="status" className="mt-6 rounded-md border border-line bg-surface px-3 py-3 text-[13px] leading-5 text-ink-soft">
        If <span className="text-ink">{email}</span> can sign in, a link is on its way. It expires in one hour.
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
      <Field label="Work email" htmlFor="email" error={state === "error" ? "Couldn't send the link. Try again in a minute." : null}>
        <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Button type="submit" variant="primary" pending={state === "sending"}>Email me a link</Button>
    </form>
  );
}
