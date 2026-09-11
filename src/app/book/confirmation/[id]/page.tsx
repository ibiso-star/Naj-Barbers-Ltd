import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export default async function BookingConfirmationPage({ params }: { params: Params }) {
  const { id } = await params;
  const isDemo = id.startsWith("demo-");

  let summary: { serviceName: string; barberName: string; startTime: string } | null = null;

  if (!isDemo && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bookings")
      .select("start_time, services(name), barbers(name)")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      summary = {
        serviceName: (data.services as unknown as { name: string })?.name ?? "your service",
        barberName: (data.barbers as unknown as { name: string })?.name ?? "your barber",
        startTime: data.start_time,
      };
    }
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <CheckCircle2 className="h-14 w-14 text-gold" aria-hidden />
      <h1 className="font-display mt-4 text-3xl font-bold text-navy">
        Booking confirmed
      </h1>

      {isDemo && (
        <p className="mt-3 rounded-lg bg-cream px-4 py-3 text-sm text-navy/70">
          Demo mode — this booking wasn&apos;t saved anywhere. Connect Supabase
          (see <code>.env.example</code>) to persist real bookings.
        </p>
      )}

      {summary && (
        <p className="mt-3 text-navy/70">
          {summary.serviceName} with {summary.barberName} —{" "}
          {new Date(summary.startTime).toLocaleString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      <p className="mt-2 text-sm text-navy/50">
        A confirmation has been sent to your email. You can manage this booking
        from My Appointments.
      </p>

      <div className="mt-8 flex gap-3">
        <Button href="/account/appointments" variant="secondary">
          My Appointments
        </Button>
        <Button href="/" variant="outline">
          Back to home
        </Button>
      </div>
    </section>
  );
}
