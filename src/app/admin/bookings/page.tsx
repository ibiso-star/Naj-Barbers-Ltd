import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bookings | Admin | Naj Barbers Ltd" };

interface Row {
  id: string;
  start_time: string;
  status: string;
  payment_type: string;
  services: { name: string; price_gbp: number } | null;
  barbers: { name: string } | null;
  customers: { name: string; email: string } | null;
}

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, start_time, status, payment_type, services(name, price_gbp), barbers(name), customers(name, email)"
    )
    .order("start_time", { ascending: false })
    .limit(100);

  const bookings = (data ?? []) as unknown as Row[];
  const today = new Date().toDateString();
  const todayCount = bookings.filter(
    (b) => new Date(b.start_time).toDateString() === today
  ).length;
  const todayRevenue = bookings
    .filter(
      (b) =>
        new Date(b.start_time).toDateString() === today && b.status !== "cancelled"
    )
    .reduce((sum, b) => sum + (b.services?.price_gbp ?? 0), 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy">Bookings</h1>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Today's bookings" value={String(todayCount)} />
        <Stat label="Today's est. revenue" value={`£${todayRevenue.toFixed(0)}`} />
        <Stat
          label="No-shows"
          value={String(bookings.filter((b) => b.status === "no_show").length)}
        />
      </div>

      <div className="mt-8">
        {bookings.length === 0 ? (
          <EmptyState title="No bookings yet" description="New bookings will appear here." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-navy/10 text-navy/50">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Barber</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-navy/5 last:border-0">
                    <td className="px-4 py-3 text-navy/70">
                      {new Date(b.start_time).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-navy">{b.customers?.name}</td>
                    <td className="px-4 py-3 text-navy/70">{b.services?.name}</td>
                    <td className="px-4 py-3 text-navy/70">{b.barbers?.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-navy/40">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    pending_payment: "bg-amber-100 text-amber-700",
    completed: "bg-navy/10 text-navy/70",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] ?? "bg-navy/10 text-navy/70"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
