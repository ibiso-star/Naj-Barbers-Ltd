import { addMinutes, isBefore, setHours, setMinutes, setSeconds } from "date-fns";
import { SHOP_SETTINGS } from "@/lib/constants";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server";
import type { TimeSlot } from "@/lib/types";

const SLOT_STEP_MINUTES = 15;

const DAY_KEY_BY_INDEX = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface BusyRange {
  start: Date;
  end: Date;
}

function timeStringToDateOnDay(day: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return setSeconds(setMinutes(setHours(day, hours), minutes), 0);
}

/**
 * Returns bookable start times for a barber/service on a given calendar day,
 * honouring shop hours, the barber's recurring availability, time off, the
 * service's buffer time, and existing bookings (PRD.md §4 Business Rules).
 */
export async function getAvailableSlots({
  barberId,
  date,
  durationMinutes,
  bufferMinutes,
}: {
  barberId: string;
  date: Date;
  durationMinutes: number;
  bufferMinutes: number;
}): Promise<TimeSlot[]> {
  const dayKey = DAY_KEY_BY_INDEX[date.getDay()];
  const windows = await getOpenWindowsForDay(barberId, date, dayKey);
  const busyRanges = await getBusyRanges(barberId, date, bufferMinutes);

  const slots: TimeSlot[] = [];

  for (const window of windows) {
    let candidateStart = window.start;

    while (true) {
      const candidateEnd = addMinutes(candidateStart, durationMinutes);
      if (isBefore(window.end, candidateEnd)) break;

      const overlapsBusy = busyRanges.some(
        (busy) => candidateStart < busy.end && candidateEnd > busy.start
      );

      if (!overlapsBusy && isBefore(new Date(), candidateStart)) {
        slots.push({
          barberId,
          start: candidateStart.toISOString(),
          end: candidateEnd.toISOString(),
        });
      }

      candidateStart = addMinutes(candidateStart, SLOT_STEP_MINUTES);
    }
  }

  return slots;
}

async function getOpenWindowsForDay(
  barberId: string,
  date: Date,
  dayKey: (typeof DAY_KEY_BY_INDEX)[number]
): Promise<{ start: Date; end: Date }[]> {
  if (!isSupabaseConfigured()) {
    const shopHours = SHOP_SETTINGS.openingHours[dayKey];
    if (!shopHours) return [];
    return [
      {
        start: timeStringToDateOnDay(date, shopHours.open),
        end: timeStringToDateOnDay(date, shopHours.close),
      },
    ];
  }

  const supabase = await createClient();
  const dayOfWeek = date.getDay();
  const { data } = await supabase
    .from("barber_availability")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .eq("day_of_week", dayOfWeek);

  if (!data || data.length === 0) return [];

  return data.map((row) => ({
    start: timeStringToDateOnDay(date, row.start_time),
    end: timeStringToDateOnDay(date, row.end_time),
  }));
}

async function getBusyRanges(
  barberId: string,
  date: Date,
  bufferMinutes: number
): Promise<BusyRange[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const dayStart = setSeconds(setMinutes(setHours(date, 0), 0), 0);
  const dayEnd = addMinutes(dayStart, 24 * 60);

  const [bookingsRes, timeOffRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("barber_id", barberId)
      .not("status", "in", "(cancelled,no_show)")
      .gte("start_time", dayStart.toISOString())
      .lt("start_time", dayEnd.toISOString()),
    supabase
      .from("barber_time_off")
      .select("start_at, end_at")
      .eq("barber_id", barberId)
      .lt("start_at", dayEnd.toISOString())
      .gt("end_at", dayStart.toISOString()),
  ]);

  const busy: BusyRange[] = [];

  for (const row of bookingsRes.data ?? []) {
    busy.push({
      start: new Date(row.start_time),
      end: addMinutes(new Date(row.end_time), bufferMinutes),
    });
  }

  for (const row of timeOffRes.data ?? []) {
    busy.push({ start: new Date(row.start_at), end: new Date(row.end_at) });
  }

  return busy;
}
