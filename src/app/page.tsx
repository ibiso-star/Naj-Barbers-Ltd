import { Scissors, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/ServiceCard";
import { BarberCard } from "@/components/BarberCard";
import { getServices, getBarbers } from "@/lib/data";

export default async function Home() {
  const [services, barbers] = await Promise.all([getServices(), getBarbers()]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,162,39,0.18),_transparent_60%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
            <Scissors className="h-3.5 w-3.5" aria-hidden />
            Premium barbering, community roots
          </span>
          <h1 className="font-display max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Sharp cuts. No waiting around.
          </h1>
          <p className="max-w-xl text-lg text-white/70">
            Browse services, pick your barber, and lock in a time slot — book
            your next appointment at Naj Barbers in under a minute.
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            <Button href="/book" variant="primary">
              Book Now
            </Button>
            <Button href="/services" variant="outline" className="border-white/30 text-white hover:bg-white hover:text-navy">
              View Services
            </Button>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-navy/10 bg-cream">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 text-sm text-navy/70 sm:grid-cols-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Star className="h-5 w-5 text-gold" aria-hidden />
            4.8 average rating from regulars
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-gold" aria-hidden />
            Free cancellation up to 4 hours before
          </div>
          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 text-gold" aria-hidden />
            Skilled barbers, every style, every fade
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
              Our Services
            </h2>
            <p className="mt-2 text-navy/60">
              Haircuts, fades, beard trims, and more — priced upfront.
            </p>
          </div>
          <Button href="/services" variant="outline" className="hidden sm:inline-flex">
            See all
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* Featured barbers */}
      <section className="bg-cream/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
                Meet the Barbers
              </h2>
              <p className="mt-2 text-navy/60">
                Pick a barber by style, specialty, or reviews.
              </p>
            </div>
            <Button href="/barbers" variant="outline" className="hidden sm:inline-flex">
              See all
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {barbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
          Ready for your next cut?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-navy/60">
          Choose your service, favourite barber, and a time that works — done in
          under a minute.
        </p>
        <Button href="/book" className="mt-6">
          Book Now
        </Button>
      </section>
    </>
  );
}
