import Link from "next/link";
import type { Barber } from "@/lib/types";

export function BarberCard({ barber }: { barber: Barber }) {
  return (
    <Link
      href={`/barbers/${barber.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-navy/10 bg-white transition hover:border-navy/30"
    >
      <div className="texture-grain relative flex aspect-[4/3] items-center justify-center bg-navy">
        {barber.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={barber.photoUrl}
            alt={barber.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-display text-5xl font-semibold text-gold">
            {barber.name.charAt(0)}
          </span>
        )}
        <span className="absolute bottom-0 left-0 h-1 w-full bg-gold transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold text-navy">
          {barber.name}
        </h3>
        <p className="text-sm text-navy/60">{barber.specialties.join(" · ")}</p>
        <p className="mt-auto pt-2 text-xs font-semibold uppercase tracking-wide text-navy/40">
          {barber.yearsExperience} yrs experience
        </p>
      </div>
    </Link>
  );
}
