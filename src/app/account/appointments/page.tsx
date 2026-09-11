import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server";
import { CancelButton } from "./CancelButton";

export const metadata: Metadata = {
  title: "My Appointments | Naj Barbers Ltd",
};

interface BookingRow {
  id: string;
  start_time: string;
  status: string;
  services: { name: string } | null;
  barbers: { name: string } | null;
}

export default async function AppointmentsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={CalendarCheck}
          title="Appointments need Supabase configured"
          description="Connect Supabase (see .env.example) to enable accounts and appointment history."
        />
      </section>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={CalendarCheck}
          title="Sign in to see your appointments"
          description="View upcoming and past bookings once you're signed in."
          action={
            <Button href="/account" className="mt-2">
              Sign in
            </Button>
          }
        />
      </section>
    );
  }

  const { data } = await supabase
    .from("bookings")
    .select("id, start_time, status, services(name), barbers(name)")
    .order("start_time", { ascending: false });

  const bookings = (data ?? []) as unknown as BookingRow[];
  const nowMs = new Date().getTime();
  const upcoming = bookings.filter(
    (b) => new Date(b.start_time).getTime() >= nowMs && b.status !== "cancelled"
  );
  const past = bookings.filter(
    (b) => new Date(b.start_time).getTime() < nowMs || b.status === "cancelled"
  );

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-navy">My Appointments</h1>

      <h2 className="font-display mt-8 text-lg font-semibold text-navy">Upcoming</h2>
      {upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No upcoming appointments"
          description="Ready for your next cut?"
          action={
            <Button href="/book" className="mt-2">
              Book Now
            </Button>
          }
        />
      ) : (
        <ul className="mt-3 space-y-3">
          {upcoming.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-navy/10 bg-white p-4"
            >
              <div>
                <p className="font-medium text-navy">
                  {b.services?.name} with {b.barbers?.name}
                </p>
                <p className="text-sm text-navy/50">
                  {new Date(b.start_time).toLocaleString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <CancelButton bookingId={b.id} />
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <h2 className="font-display mt-10 text-lg font-semibold text-navy">Past</h2>
          <ul className="mt-3 space-y-3">
            {past.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-navy/10 bg-cream/50 p-4 text-navy/60"
              >
                <div>
                  <p className="font-medium">
                    {b.services?.name} with {b.barbers?.name}
                  </p>
                  <p className="text-sm">
                    {new Date(b.start_time).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide">{b.status}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
