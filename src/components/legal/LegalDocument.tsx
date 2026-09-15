export function LegalDocument({
  eyebrow,
  title,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
        {eyebrow}
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold text-navy">
        {title}
      </h1>
      <p className="mt-2 text-sm text-navy/50">Last updated: {lastUpdated}</p>
      <div className="legal-content mt-10">{children}</div>
    </article>
  );
}
