import Link from "next/link";
import { Lock, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

/** Permission-denied path (J2): same screen for "missing" and "not yours". */
export function NoAccess({ slug }: { slug: string }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="flex size-10 items-center justify-center rounded-full border border-line-strong bg-raised">
        <Lock aria-hidden className="size-4 text-ink-soft" />
      </span>
      <h1 className="mt-2 text-[17px] font-medium">You don&apos;t have access to this workspace</h1>
      <p className="max-w-md text-[13px] leading-5 text-ink-soft">
        The workspace <span className="font-mono text-ink">{slug}</span> doesn&apos;t exist or you aren&apos;t a member.
        Ask one of its admins to invite you.
      </p>
      <Link href="/" className="mt-2 text-[13px] text-accent-ink hover:underline">Back to your workspaces</Link>
    </main>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <h2 className="text-[15px] font-medium">Couldn&apos;t load this workspace</h2>
      <p className="max-w-sm text-[13px] text-ink-soft">{message}</p>
      <button type="button" onClick={onRetry} className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-accent-ink hover:underline">
        <RefreshCw aria-hidden className="size-3.5" /> Retry
      </button>
    </div>
  );
}

/** Loading state that matches the page frame, not a spinner (PROD-025). */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading workspace" className="flex flex-1 flex-col">
      <div className="flex h-12 items-center border-b border-line px-6">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] rounded-lg" />)}
        <Skeleton className="h-[300px] rounded-lg md:col-span-2" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    </div>
  );
}
