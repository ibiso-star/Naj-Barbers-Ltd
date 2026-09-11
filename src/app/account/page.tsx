import type { Metadata } from "next";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign In | Naj Barbers Ltd",
};

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-sm px-4 py-20 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-navy">Sign in</h1>
      <p className="mt-2 text-sm text-navy/60">
        We&apos;ll email you a secure link — no password needed.
      </p>
      <div className="mt-6">
        <SignInForm />
      </div>
    </section>
  );
}
