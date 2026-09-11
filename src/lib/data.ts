import { isSupabaseConfigured, createClient } from "@/lib/supabase/server";
import {
  DEMO_BARBERS,
  DEMO_REVIEWS,
  DEMO_SERVICES,
  getBarberById as demoGetBarberById,
  getBarbersForService as demoGetBarbersForService,
  getReviewsForBarber as demoGetReviewsForBarber,
  getServiceById as demoGetServiceById,
} from "@/lib/demo-data";
import type { Barber, Review, Service } from "@/lib/types";

/**
 * Data-access layer: reads from Supabase when it's configured, otherwise falls
 * back to placeholder demo data so the app is fully browsable with zero setup.
 * See PRD.md §0 and §7.
 */

export async function getServices(): Promise<Service[]> {
  if (!isSupabaseConfigured()) return DEMO_SERVICES;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, category, description, duration_minutes, price_gbp, image_url")
    .order("name");

  if (error || !data) return DEMO_SERVICES;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceGbp: row.price_gbp,
    imageUrl: row.image_url ?? undefined,
  }));
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  if (!isSupabaseConfigured()) return demoGetServiceById(id);

  const services = await getServices();
  return services.find((s) => s.id === id);
}

export async function getBarbers(): Promise<Barber[]> {
  if (!isSupabaseConfigured()) return DEMO_BARBERS;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("barbers")
    .select(
      "id, name, bio, photo_url, specialties, years_experience, rating, review_count, portfolio, barber_services(service_id)"
    )
    .order("name");

  if (error || !data) return DEMO_BARBERS;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    bio: row.bio,
    photoUrl: row.photo_url ?? undefined,
    specialties: row.specialties ?? [],
    yearsExperience: row.years_experience,
    rating: row.rating,
    reviewCount: row.review_count,
    portfolio: row.portfolio ?? [],
    serviceIds: (row.barber_services ?? []).map(
      (bs: { service_id: string }) => bs.service_id
    ),
  }));
}

export async function getBarberById(id: string): Promise<Barber | undefined> {
  if (!isSupabaseConfigured()) return demoGetBarberById(id);

  const barbers = await getBarbers();
  return barbers.find((b) => b.id === id);
}

export async function getBarbersForService(serviceId: string): Promise<Barber[]> {
  if (!isSupabaseConfigured()) return demoGetBarbersForService(serviceId);

  const barbers = await getBarbers();
  return barbers.filter((b) => b.serviceIds.includes(serviceId));
}

export async function getReviewsForBarber(barberId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) return demoGetReviewsForBarber(barberId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, barber_id, customer_name, rating, comment, created_at")
    .eq("barber_id", barberId)
    .order("created_at", { ascending: false });

  if (error || !data) return DEMO_REVIEWS.filter((r) => r.barberId === barberId);

  return data.map((row) => ({
    id: row.id,
    barberId: row.barber_id,
    customerName: row.customer_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  }));
}
