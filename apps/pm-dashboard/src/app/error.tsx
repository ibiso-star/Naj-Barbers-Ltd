"use client";

import { Button } from "@/components/ui/Button";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-[17px] font-medium">Something went wrong</h1>
      <p className="max-w-sm text-[13px] text-ink-soft">The page failed to render. Your saved work is not affected.</p>
      <Button onClick={reset} className="mt-2">Try again</Button>
    </main>
  );
}
