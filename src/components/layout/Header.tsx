"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/barbers", label: "Barbers" },
  { href: "/account/appointments", label: "My Appointments" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-navy">
          NAJ <span className="text-gold">BARBERS</span>
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
    </header>
  );
}
