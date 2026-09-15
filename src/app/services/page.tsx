import type { Metadata } from "next";
import { ServiceCard } from "@/components/ServiceCard";
import { getServices } from "@/lib/data";

export const metadata: Metadata = {
  title: "Services | Naj Barbers Ltd",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
        The Menu
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold text-navy">
        Services
      </h1>
      <p className="mt-2 max-w-xl text-navy/60">
        Every price includes a consultation and finish. Tap a service to start
        booking.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
