"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleBarberActive(barberId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("barbers").update({ active }).eq("id", barberId);

  if (!error) revalidatePath("/admin/staff");
  return { ok: !error };
}
