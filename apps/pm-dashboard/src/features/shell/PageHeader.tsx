import type { ReactNode } from "react";

export function PageHeader({ title, children, meta }: { title: string; children?: ReactNode; meta?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-12 flex-wrap items-center gap-3 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur-sm md:px-6">
      <h1 className="text-[14px] font-medium">{title}</h1>
      {meta && <div className="text-[12.5px] text-ink-muted">{meta}</div>}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}
