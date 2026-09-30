export function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-line-strong bg-canvas px-1 font-mono text-[10.5px] leading-none text-ink-soft">
      {children}
    </kbd>
  );
}
