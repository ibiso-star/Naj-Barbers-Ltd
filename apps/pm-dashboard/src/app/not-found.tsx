import Link from "next/link";
import { KeelMark } from "@/components/brand/KeelMark";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <KeelMark size={28} />
      <h1 className="mt-3 text-[17px] font-medium">Page not found</h1>
      <p className="max-w-sm text-[13px] text-ink-soft">The link may be out of date, or the page was moved.</p>
      <Link href="/" className="mt-2 text-[13px] text-accent-ink hover:underline">Go to your workspace</Link>
    </main>
  );
}
