import { clsx } from "clsx";
import { initials } from "@/lib/format";

// Stable per-person tint from a small fixed set, so the same teammate keeps
// the same colour everywhere; initials always carry identity, not colour.
const TINTS = ["#1c5cab", "#8a3a1a", "#136e4f", "#7a5400", "#7d2f4f", "#3d3a8c"];

function tintFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function Avatar({ id, name, size = 20, className }: { id: string | null; name: string; size?: number; className?: string }) {
  if (!id) {
    return (
      <span
        aria-hidden
        className={clsx("inline-block shrink-0 rounded-full border border-dashed border-line-strong", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      title={name}
      className={clsx("inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white", className)}
      style={{ width: size, height: size, background: tintFor(id), fontSize: Math.max(9, Math.round(size * 0.42)) }}
    >
      {initials(name)}
    </span>
  );
}
