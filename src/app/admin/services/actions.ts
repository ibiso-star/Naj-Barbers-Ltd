"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleServiceActive(serviceId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ active })
    .eq("id", serviceId);

  if (!error) revalidatePath("/admin/services");
  return { ok: !error };
}
