"use client";

import { useTransition } from "react";
import { clsx } from "clsx";

export function StatusToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: (next: boolean) => Promise<unknown>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await onToggle(!active);
        })
      }
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50",
        active ? "bg-green-100 text-green-700" : "bg-navy/10 text-navy/50"
      )}
    >
      {active ? "Active" : "Inactive"}
    </button>
  );
}
