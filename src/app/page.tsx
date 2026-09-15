import { ArrowRight, Clock, MapPin, Phone, Scissors } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/ServiceCard";
import { BarberCard } from "@/components/BarberCard";
import { getServices, getBarbers } from "@/lib/data";
import { SHOP_SETTINGS } from "@/lib/constants";

const FACTS = [
  `Est. ${SHOP_SETTINGS.establishedYear} · Swansea`,
  "Specialists in Afro & European hair",
  "Walk-ins welcome",
  "Free cancellation up to 4hrs before",
];

const WEEK_ORDER = ["tue", "wed", "thu", "fri", "sat", "sun", "mon"] as const;
const DAY_LABELS: Record<(typeof WEEK_ORDER)[number], string> = {
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
  mon: "Mon",
};

export default async function Home() {
  const [services, barbers] = await Promise.all([getServices(), getBarbers()]);
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    SHOP_SETTINGS.addressMapQuery
  )}`;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 border border-gold/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold">
              Swansea · Est. {SHOP_SETTINGS.establishedYear}
            </span>
            <h1 className="font-display max-w-xl text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Every texture.
              <br />
              Every fade.
              <br />
              <span className="text-gold">One standard.</span>
            </h1>
            <p className="max-w-md text-lg text-white/70">
              Expert barbering and Afro hair grooming in the heart of
              Swansea — precision cuts, personal attention, and a shop that
              feels like home.
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              <Button href="/book" variant="primary">
                Book an Appointment
              </Button>
              <a
                href={`tel:${SHOP_SETTINGS.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-white hover:text-navy"
              >
                <Phone className="h-4 w-4" aria-hidden />
                Call Now
              </a>
            </div>
          </div>

          <div className="relative hidden aspect-[4/5] lg:block">
            <div className="clip-notch texture-grain absolute inset-0 border border-gold/20 bg-navy-light">
              <div className="stripe-fade absolute inset-x-0 top-0 h-3" />
              <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
                <span className="font-display text-8xl font-bold text-gold">
                  NB
                </span>
                <p className="max-w-[16rem] text-sm text-white/50">
                  {SHOP_SETTINGS.address}
                </p>
              </div>
              <div className="stripe-fade absolute inset-x-0 bottom-0 h-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Facts marquee */}
      <section
        aria-label="Why choose Naj Barbers"
        className="overflow-hidden border-b border-navy/10 bg-cream py-4"
      >
        <div className="marquee-track flex gap-12 whitespace-nowrap text-sm font-semibold uppercase tracking-wide text-navy/70">
          {[...FACTS, ...FACTS].map((fact, i) => (
            <span
              key={i}
              className="flex items-center gap-3"
              aria-hidden={i >= FACTS.length}
            >
              <Scissors className="h-3.5 w-3.5 text-gold" aria-hidden />
              {fact}
            </span>
          ))}
        </div>
      </section>

      {/* Specialty split */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          What we do
        </p>
        <h2 className="font-display mt-2 max-w-xl text-2xl font-bold text-navy sm:text-3xl">
          Two crafts, one shop
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-navy/10 bg-navy/10 sm:grid-cols-2">
          <div className="bg-white p-8">
            <h3 className="font-display text-xl font-semibold text-navy">
              Afro hair &amp; grooming
            </h3>
            <p className="mt-3 text-sm text-navy/70">
              Skin fades, line-ups, and texture-aware cuts from barbers who
              understand the craft — built for how your hair actually grows.
            </p>
          </div>
          <div className="bg-navy p-8 text-white">
            <h3 className="font-display text-xl font-semibold">
              Classic &amp; European barbering
            </h3>
            <p className="mt-3 text-sm text-white/70">
              Traditional cuts, hot towel shaves, and beard sculpting —
              timeless technique with modern finish.
            </p>
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              01 — The Menu
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold text-navy sm:text-3xl">
              Services
            </h2>
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
        <Button href="/services" variant="outline" className="mt-6 w-full sm:hidden">
          See all services
        </Button>
      </section>

      {/* Featured barbers */}
      <section className="bg-cream/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                02 — The Team
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold text-navy sm:text-3xl">
                Meet the Barbers
              </h2>
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

      {/* Visit */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-1 gap-8 border border-navy/10 p-8 sm:grid-cols-3 sm:p-10">
          <div>
            <MapPin className="h-5 w-5 text-gold" aria-hidden />
            <h3 className="font-display mt-3 font-semibold text-navy">
              Find us
            </h3>
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm text-navy/70 hover:text-gold"
            >
              {SHOP_SETTINGS.address}
            </a>
          </div>
          <div>
            <Clock className="h-5 w-5 text-gold" aria-hidden />
            <h3 className="font-display mt-3 font-semibold text-navy">
              Opening hours
            </h3>
            <ul className="mt-1 space-y-0.5 text-sm text-navy/70">
              {WEEK_ORDER.map((day) => {
                const hours = SHOP_SETTINGS.openingHours[day];
                return (
                  <li key={day} className="flex justify-between gap-4">
                    <span>{DAY_LABELS[day]}</span>
                    <span>{hours ? `${hours.open}–${hours.close}` : "Closed"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <Phone className="h-5 w-5 text-gold" aria-hidden />
            <h3 className="font-display mt-3 font-semibold text-navy">
              Get in touch
            </h3>
            <a
              href={`tel:${SHOP_SETTINGS.phone.replace(/\s+/g, "")}`}
              className="mt-1 block text-sm text-navy/70 hover:text-gold"
            >
              {SHOP_SETTINGS.phone}
            </a>
            <a
              href={`mailto:${SHOP_SETTINGS.email}`}
              className="mt-0.5 block text-sm text-navy/70 hover:text-gold"
            >
              {SHOP_SETTINGS.email}
            </a>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-gold px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="font-display mx-auto max-w-lg text-2xl font-bold text-navy sm:text-3xl">
          Ready for your next cut?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-navy/70">
          Choose your service, your barber, and a time that works.
        </p>
        <Button
          href="/book"
          className="mt-6 !bg-navy !text-white hover:!bg-navy-light"
        >
          Book Now
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </section>
    </>
  );
}
