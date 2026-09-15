/**
 * Hand-drawn line illustration standing in for real shop photography, which
 * hasn't been shot yet (see PRD.md §7). Deliberately illustrative rather
 * than photorealistic so it's never mistaken for an actual photo of the
 * shop.
 */
export function ToolsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 260" className={className} aria-hidden="true">
      <g transform="rotate(20 130 150)">
        <rect x="26" y="146" width="208" height="14" rx="4" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <line x1="40" y1="160" x2="40" y2="192" />
          <line x1="58" y1="160" x2="58" y2="192" />
          <line x1="76" y1="160" x2="76" y2="192" />
          <line x1="94" y1="160" x2="94" y2="192" />
          <line x1="112" y1="160" x2="112" y2="192" />
          <line x1="130" y1="160" x2="130" y2="192" />
          <line x1="148" y1="160" x2="148" y2="192" />
          <line x1="166" y1="160" x2="166" y2="192" />
          <line x1="184" y1="160" x2="184" y2="192" />
          <line x1="202" y1="160" x2="202" y2="192" />
          <line x1="218" y1="160" x2="218" y2="192" />
        </g>
      </g>

      <g
        transform="translate(-6,-18) rotate(-6 130 130) scale(0.78)"
        stroke="currentColor"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M84,188 L120,128 L152,48" strokeWidth="16" />
        <path d="M156,188 L120,128 L88,48" strokeWidth="16" />
        <circle cx="84" cy="188" r="22" strokeWidth="16" />
        <circle cx="156" cy="188" r="22" strokeWidth="16" />
        <circle cx="120" cy="128" r="9" fill="currentColor" stroke="none" />
      </g>

      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.55">
        <line x1="200" y1="60" x2="214" y2="50" />
        <line x1="212" y1="76" x2="228" y2="70" />
        <line x1="192" y1="90" x2="204" y2="82" />
      </g>
    </svg>
  );
}
