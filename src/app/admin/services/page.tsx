import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StatusToggle } from "@/components/admin/StatusToggle";
import { toggleServiceActive } from "./actions";

export const metadata: Metadata = { title: "Services | Admin | Naj Barbers Ltd" };

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, category, duration_minutes, price_gbp, deposit_gbp, buffer_minutes, active")
    .order("name");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy">Services</h1>
      <p className="mt-2 text-sm text-navy/60">
        Toggle a service off to hide it from booking without deleting it.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-navy/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-navy/10 text-navy/50">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Deposit</th>
              <th className="px-4 py-3 font-medium">Buffer</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">{s.name}</td>
                <td className="px-4 py-3 text-navy/70">{s.duration_minutes} min</td>
                <td className="px-4 py-3 text-navy/70">£{s.price_gbp}</td>
                <td className="px-4 py-3 text-navy/70">£{s.deposit_gbp}</td>
                <td className="px-4 py-3 text-navy/70">{s.buffer_minutes} min</td>
                <td className="px-4 py-3">
                  <StatusToggle active={s.active} onToggle={toggleServiceActive.bind(null, s.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
