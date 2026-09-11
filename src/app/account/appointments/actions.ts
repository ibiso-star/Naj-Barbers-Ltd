"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SHOP_SETTINGS } from "@/lib/constants";

export async function cancelBooking(
  bookingId: string
): Promise<{ ok: true; late: boolean } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Please sign in to manage this booking." };

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, start_time, status, customers(auth_user_id)")
    .eq("id", bookingId)
    .maybeSingle();

  const ownerAuthId = (booking?.customers as unknown as { auth_user_id: string } | null)
    ?.auth_user_id;

  if (!booking || ownerAuthId !== user.id) {
    return { ok: false, error: "Booking not found." };
  }

  if (booking.status === "cancelled") {
    return { ok: false, error: "This booking is already cancelled." };
  }

  const hoursUntilStart =
    (new Date(booking.start_time).getTime() - Date.now()) / (1000 * 60 * 60);
  const late = hoursUntilStart < SHOP_SETTINGS.cancellationWindowHours;

  const { error } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: late
        ? "Cancelled by customer (late — prepayment non-refundable)"
        : "Cancelled by customer",
    })
    .eq("id", bookingId);

  if (error) return { ok: false, error: "Couldn't cancel — please try again." };

  revalidatePath("/account/appointments");
  return { ok: true, late };
}
