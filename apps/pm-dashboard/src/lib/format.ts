import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const gbpCompact = new Intl.NumberFormat("en-GB", {
  style: "currency", currency: "GBP", notation: "compact", maximumFractionDigits: 1,
});

export const formatPence = (pence: number) => gbp.format(pence / 100);
export const formatPenceCompact = (pence: number) => gbpCompact.format(pence / 100);

/** yyyy-mm-dd for "today" in the viewer's local time zone. */
export function todayIso(now: Date = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

export function formatDue(dueDate: string, now: Date = new Date()): string {
  const days = differenceInCalendarDays(parseISO(dueDate), now);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0 && days > -7) return `${-days}d overdue`;
  return format(parseISO(dueDate), "d MMM");
}

export function isOverdue(dueDate: string | null, done: boolean, now: Date = new Date()): boolean {
  return Boolean(dueDate && !done && differenceInCalendarDays(parseISO(dueDate), now) < 0);
}

export const formatRelative = (iso: string) => `${formatDistanceToNowStrict(parseISO(iso))} ago`;
export const formatDate = (iso: string) => format(parseISO(iso), "d MMM yyyy");

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
