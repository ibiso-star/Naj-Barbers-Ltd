"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeMark } from "@/components/brand/FadeMark";
import { SHOP_SETTINGS } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/barbers", label: "Barbers" },
  { href: "/account/appointments", label: "My Appointments" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
      <div className="hidden border-b border-navy/10 bg-navy text-white md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 text-xs text-white/70">
          <span>{SHOP_SETTINGS.address}</span>
          <a
            href={`tel:${SHOP_SETTINGS.phone.replace(/\s+/g, "")}`}
            className="flex items-center gap-1.5 font-medium text-gold hover:text-gold-light"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {SHOP_SETTINGS.phone}
          </a>
        </div>
      </div>

      <div className="border-b border-navy/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <FadeMark className="h-8 w-8 shrink-0" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-bold tracking-tight text-navy">
                NAJ <span className="text-gold">BARBERS</span>
              </span>
              <span className="mt-1 h-[3px] w-0 bg-gold transition-all duration-300 group-hover:w-full" />
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy/70 transition hover:text-navy"
              >
                {link.label}
              </Link>
            ))}
            <Button href="/book" className="!px-5 !py-2.5">
              Book Now
            </Button>
          </nav>

          <button
            type="button"
            className="flex items-center justify-center rounded-md p-2 text-navy md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-navy/10 bg-white px-4 pb-4 md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-3 text-sm font-medium text-navy/80 hover:bg-navy/5"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button href="/book" className="mt-2 w-full" onClick={() => setOpen(false)}>
              Book Now
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
