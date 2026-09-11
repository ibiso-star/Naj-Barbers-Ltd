import type { LucideIcon } from "lucide-react";
import { CalendarX } from "lucide-react";

export function EmptyState({
  icon: Icon = CalendarX,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-navy/20 bg-cream/60 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/5 text-navy/40">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
      <p className="max-w-sm text-sm text-navy/60">{description}</p>
      {action}
    </div>
  );
}
