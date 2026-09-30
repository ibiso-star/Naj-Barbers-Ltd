/** Working mark for "Keel" (PRD.md §3: placeholder until a logo is commissioned). */
export function KeelMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className}>
      <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" fill="#111113" stroke="#3f3f46" />
      <path d="M5 8h14l-2.2 4.5H7.2z" fill="#3987e5" />
      <path d="M11 12.5h2V19h-2z" fill="#fafafa" />
    </svg>
  );
}
