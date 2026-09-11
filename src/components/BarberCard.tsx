import Link from "next/link";
import { Star } from "lucide-react";
import type { Barber } from "@/lib/types";

export function BarberCard({ barber }: { barber: Barber }) {
  return (
    <Link
      href={`/barbers/${barber.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-navy/90 text-4xl font-display font-semibold text-gold">
        {barber.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={barber.photoUrl}
            alt={barber.name}
            className="h-full w-full object-cover"
          />
        ) : (
          barber.name.charAt(0)
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold text-navy">
          {barber.name}
        </h3>
        <p className="text-sm text-navy/60">{barber.specialties.join(" · ")}</p>
        <div className="mt-auto flex items-center gap-1 pt-2 text-sm text-navy/70">
          <Star className="h-4 w-4 fill-gold text-gold" aria-hidden />
          <span className="font-medium text-navy">{barber.rating}</span>
          <span>({barber.reviewCount} reviews)</span>
        </div>
      </div>
    </Link>
  );
}
