/**
 * The Naj Barbers mark: an "N" whose right stroke breaks into a taper of
 * lines instead of staying solid, the same gradient a clipper leaves fading
 * skin into length. Chosen 2026-09-15 from src/lib/../PRD.md §7's three
 * concepts (Fade Mark, Open Blade, Heritage Seal).
 *
 * `variant="duo"` (navy stem, gold taper) reads best on light backgrounds;
 * `variant="gold"` (solid gold) reads best on the navy background.
 */
export function FadeMark({
  variant = "duo",
  className,
}: {
  variant?: "duo" | "gold";
  className?: string;
}) {
  const stem = variant === "duo" ? "#0b1220" : "#c9a227";

  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden="true">
      <path
        d="M64,176 L64,64 L176,176"
        fill="none"
        stroke={stem}
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="#c9a227" strokeLinecap="round">
        <line x1="163" y1="64" x2="189" y2="64" strokeWidth="9" />
        <line x1="164" y1="78" x2="188" y2="78" strokeWidth="8.5" />
        <line x1="165" y1="92" x2="187" y2="92" strokeWidth="7.5" />
        <line x1="166" y1="106" x2="186" y2="106" strokeWidth="7" />
        <line x1="167" y1="120" x2="185" y2="120" strokeWidth="6.5" />
        <line x1="168" y1="134" x2="184" y2="134" strokeWidth="5.5" />
        <line x1="169.5" y1="148" x2="182.5" y2="148" strokeWidth="5" />
        <line x1="171" y1="162" x2="181" y2="162" strokeWidth="4.5" />
        <line x1="172.5" y1="176" x2="179.5" y2="176" strokeWidth="4" />
      </g>
    </svg>
  );
}
