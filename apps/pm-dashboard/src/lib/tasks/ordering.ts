// Fractional ordering: a card move writes a single row. Positions are spaced
// by STEP; repeatedly inserting into the same gap halves it each time, so
// after ~50 such inserts two cards can share a position (see memory.md).
export const STEP = 1000;

export function positionBetween(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return STEP;
  if (before === undefined) return after! - STEP;
  if (after === undefined) return before + STEP;
  return (before + after) / 2;
}

export function byPosition<T extends { position: number; number?: number }>(a: T, b: T): number {
  return a.position - b.position || (a.number ?? 0) - (b.number ?? 0);
}
