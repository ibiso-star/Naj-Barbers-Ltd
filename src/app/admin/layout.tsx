import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Scissors, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin-auth";

const NAV = [
  { href: "/admin/bookings", label: "Bookings", icon: LayoutDashboard },
  { href: "/admin/services", label: "Services", icon: Scissors },
  { href: "/admin/staff", label: "Staff", icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Admin requires Supabase configured"
          description="Connect Supabase (see .env.example), run the migrations, and create a profile with role='admin' to use this dashboard."
        />
      </div>
    );
  }

  const session = await getAdminSession();
  if (!session) redirect("/account");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-navy/40">
          {session.fullName} · {session.role}
        </p>
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-navy/70 hover:bg-navy/5 hover:text-navy"
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
