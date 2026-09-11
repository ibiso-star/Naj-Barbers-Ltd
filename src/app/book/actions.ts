"use server";

import { randomUUID } from "crypto";
import { getAvailableSlots as computeAvailableSlots } from "@/lib/availability";
import { createBookingSchema, type CreateBookingInput } from "@/lib/booking-schema";
import { getServiceById } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { NO_SHOW_LIMIT, SHOP_SETTINGS } from "@/lib/constants";
import type { TimeSlot } from "@/lib/types";

export async function fetchAvailableSlots(input: {
  barberId: string;
  serviceId: string;
  dateISO: string; // yyyy-mm-dd
}): Promise<TimeSlot[]> {
  const service = await getServiceById(input.serviceId);
  if (!service) return [];

  return computeAvailableSlots({
    barberId: input.barberId,
    date: new Date(`${input.dateISO}T00:00:00`),
    durationMinutes: service.durationMinutes,
    bufferMinutes: SHOP_SETTINGS.bufferMinutes,
  });
}

export type SubmitBookingResult =
  | { ok: true; bookingId: string; checkoutUrl?: string; demo?: boolean }
  | { ok: false; error: string };

export async function submitBooking(
  rawInput: CreateBookingInput
): Promise<SubmitBookingResult> {
  const parsed = createBookingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking details" };
  }
  const input = parsed.data;

  const service = await getServiceById(input.serviceId);
  if (!service) return { ok: false, error: "That service is no longer available." };

  const startTime = new Date(input.startTime);
  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60_000);

  if (!isSupabaseConfigured()) {
    // Demo mode: nothing to persist to, but let the flow complete so the UI
    // can be exercised end-to-end. See PRD.md §0/§7.
    return { ok: true, bookingId: `demo-${randomUUID()}`, demo: true };
  }

  const admin = createAdminClient();

  const { data: existingCustomer } = await admin
    .from("customers")
    .select("id, no_show_count, prepay_only")
    .eq("email", input.customerEmail)
    .maybeSingle();

  let customerId = existingCustomer?.id as string | undefined;

  if (!customerId) {
    const { data: newCustomer, error: customerError } = await admin
      .from("customers")
      .insert({
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
      })
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      return { ok: false, error: "Couldn't save your details. Please try again." };
    }
    customerId = newCustomer.id;
  }

  // No-show policy (PRD.md §4): 3+ no-shows forces prepay (full payment —
  // there's no deposit option, see PRD.md §0).
  const mustPrepay = existingCustomer?.prepay_only || (existingCustomer?.no_show_count ?? 0) >= NO_SHOW_LIMIT;
  let paymentType = input.paymentType;
  if (mustPrepay && paymentType === "pay_in_shop") {
    paymentType = "full";
  }

  const needsOnlinePayment = paymentType !== "pay_in_shop" && service.priceGbp > 0;

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .insert({
      service_id: input.serviceId,
      barber_id: input.barberId,
      customer_id: customerId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: needsOnlinePayment ? "pending_payment" : "confirmed",
      payment_type: paymentType,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    if (bookingError?.code === "23P01") {
      return { ok: false, error: "That slot was just taken — please pick another time." };
    }
    return { ok: false, error: "Couldn't create the booking. Please try again." };
  }

  if (!needsOnlinePayment) {
    return { ok: true, bookingId: booking.id };
  }

  if (!isStripeConfigured()) {
    // Stripe isn't wired up yet — fall back to confirmed + pay-in-shop rather
    // than blocking the booking (see PRD.md §7 open questions).
    await admin.from("bookings").update({ status: "confirmed" }).eq("id", booking.id);
    return { ok: true, bookingId: booking.id };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(service.priceGbp * 100),
          product_data: { name: service.name },
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: booking.id },
    success_url: `${siteUrl}/book/confirmation/${booking.id}`,
    cancel_url: `${siteUrl}/book`,
  });

  return { ok: true, bookingId: booking.id, checkoutUrl: session.url ?? undefined };
}
