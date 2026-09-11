import type { Metadata } from "next";
import { BarberCard } from "@/components/BarberCard";
import { getBarbers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Barbers | Naj Barbers Ltd",
};

export default async function BarbersPage() {
  const barbers = await getBarbers();

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-navy">Our Barbers</h1>
      <p className="mt-2 max-w-xl text-navy/60">
        Every barber is trained in the full range of services — pick based on
        style, specialty, or reviews.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {barbers.map((barber) => (
          <BarberCard key={barber.id} barber={barber} />
        ))}
      </div>
    </section>
  );
}
