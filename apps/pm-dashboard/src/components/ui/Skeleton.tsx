import { clsx } from "clsx";

/** Placeholder with the same footprint as the content it stands in for (PROD-025). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("animate-pulse rounded bg-raised", className)} />;
}
