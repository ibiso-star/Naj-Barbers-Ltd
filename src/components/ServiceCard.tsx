import Link from "next/link";
import { Clock } from "lucide-react";
import type { Service } from "@/lib/types";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/book?service=${service.id}`}
      className="group flex flex-col justify-between border border-navy/10 bg-white p-6 transition hover:border-gold"
    >
      <div className="flex items-baseline gap-2">
        <h3 className="font-display text-lg font-semibold text-navy">
          {service.name}
        </h3>
        <span
          className="flex-1 border-b border-dotted border-navy/25"
          aria-hidden
        />
        <span className="font-display text-lg font-semibold text-gold">
          £{service.priceGbp.toFixed(0)}
        </span>
      </div>
      <p className="mt-2 text-sm text-navy/70">{service.description}</p>
      <div className="mt-6 flex items-center justify-between border-t border-navy/10 pt-4">
        <span className="flex items-center gap-1.5 text-sm text-navy/60">
          <Clock className="h-4 w-4" aria-hidden />
          {service.durationMinutes} min
        </span>
        <span className="text-sm font-semibold text-navy/70 group-hover:text-gold">
          Book this →
        </span>
      </div>
    </Link>
  );
}
