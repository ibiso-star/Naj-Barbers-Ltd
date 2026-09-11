import Link from "next/link";
import { SHOP_SETTINGS } from "@/lib/constants";

const WEEK_ORDER = ["tue", "wed", "thu", "fri", "sat", "sun", "mon"] as const;

const DAY_LABELS: Record<(typeof WEEK_ORDER)[number], string> = {
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
  mon: "Monday",
};

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">
            NAJ <span className="text-gold">BARBERS</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-white/60">
            Premium cuts, community roots. Book your next appointment in under a
            minute.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
            Opening Hours
          </h4>
          <ul className="mt-3 space-y-1 text-sm text-white/70">
            {WEEK_ORDER.map((day) => {
              const hours = SHOP_SETTINGS.openingHours[day];
              return (
                <li key={day} className="flex justify-between gap-6">
                  <span>{DAY_LABELS[day]}</span>
                  <span>{hours ? `${hours.open}–${hours.close}` : "Closed"}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
            Visit
          </h4>
          <p className="mt-3 text-sm text-white/70">{SHOP_SETTINGS.address}</p>
          <p className="mt-1 text-sm text-white/70">{SHOP_SETTINGS.phone}</p>
          <Link
            href="/book"
            className="mt-4 inline-block text-sm font-semibold text-gold hover:text-gold-light"
          >
            Book an appointment →
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40 sm:px-6">
        © {new Date().getFullYear()} Naj Barbers Ltd. All rights reserved.
      </div>
    </footer>
  );
}
