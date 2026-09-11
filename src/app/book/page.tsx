import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { getServices, getBarbers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Book an Appointment | Naj Barbers Ltd",
};

type SearchParams = Promise<{ service?: string; barber?: string }>;

export default async function BookPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ service, barber }, services, barbers] = await Promise.all([
    searchParams,
    getServices(),
    getBarbers(),
  ]);

  return (
    <BookingWizard
      services={services}
      barbers={barbers}
      initialServiceId={service}
      initialBarberId={barber}
    />
  );
}
