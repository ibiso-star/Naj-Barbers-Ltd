"use client";

import { useState, useTransition } from "react";
import { cancelBooking } from "./actions";

export function CancelButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (message) {
    return <p className="text-xs text-navy/60">{message}</p>;
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Cancel this appointment?")) return;
        startTransition(async () => {
          const result = await cancelBooking(bookingId);
          if (!result.ok) {
            setMessage(result.error);
          } else {
            setMessage(
              result.late
                ? "Cancelled — deposit forfeited (late cancellation)."
                : "Cancelled."
            );
          }
        });
      }}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? "Cancelling…" : "Cancel"}
    </button>
  );
}
