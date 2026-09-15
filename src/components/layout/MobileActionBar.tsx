"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, MapPin, Phone } from "lucide-react";
import { clsx } from "clsx";
import { SHOP_SETTINGS } from "@/lib/constants";

const HIDDEN_PREFIXES = ["/book", "/admin"];

type ActionItem = {
  href: string;
  label: string;
  icon: typeof Phone;
  external?: boolean;
  primary?: boolean;
};

export function MobileActionBar() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    SHOP_SETTINGS.addressMapQuery
  )}`;

  const items: ActionItem[] = [
    {
      href: `tel:${SHOP_SETTINGS.phone.replace(/\s+/g, "")}`,
      label: "Call",
      icon: Phone,
    },
    { href: directionsHref, label: "Directions", icon: MapPin, external: true },
    { href: "/book", label: "Book", icon: CalendarCheck, primary: true },
  ];

  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-navy/10 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {items.map(({ href, label, icon: Icon, external, primary }) => (
        <Link
          key={label}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={clsx(
            "flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold",
            primary ? "bg-gold text-navy" : "text-navy/70"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
