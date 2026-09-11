import type { Barber, Review, Service } from "./types";

/**
 * Placeholder content shown until real services/barbers/pricing are confirmed
 * (see PRD.md §7 Open Questions) and/or Supabase env vars are configured.
 */

export const DEMO_SERVICES: Service[] = [
  {
    id: "haircut-classic",
    name: "Classic Haircut",
    category: "haircut",
    description: "Precision cut, tailored to your style, finished with a hot towel.",
    durationMinutes: 30,
    priceGbp: 25,
  },
  {
    id: "skin-fade",
    name: "Skin Fade",
    category: "fade",
    description: "Sharp, blended skin fade with clean line-up.",
    durationMinutes: 45,
    priceGbp: 30,
  },
  {
    id: "beard-trim",
    name: "Beard Trim",
    category: "beard",
    description: "Shape and tidy with straight razor line-up.",
    durationMinutes: 15,
    priceGbp: 12,
  },
  {
    id: "hot-towel-shave",
    name: "Hot Towel Shave",
    category: "shave",
    description: "Traditional wet shave with hot towel and finishing balm.",
    durationMinutes: 30,
    priceGbp: 22,
  },
  {
    id: "restyle",
    name: "Restyle Consultation",
    category: "restyle",
    description: "Full consultation and restyle for a fresh new look.",
    durationMinutes: 60,
    priceGbp: 40,
  },
  {
    id: "kids-cut",
    name: "Kids' Cut",
    category: "kids",
    description: "Relaxed, friendly cut for younger clients (under 12).",
    durationMinutes: 20,
    priceGbp: 15,
  },
];

// 4 barber seats per PRD.md §7 — names/specialties/photos are placeholders
// pending the real roster.
export const DEMO_BARBERS: Barber[] = [
  {
    id: "barber-1",
    name: "Naj",
    bio: "Founder and master barber. Specialist in sharp fades and classic gentleman's cuts.",
    specialties: ["Skin Fades", "Classic Cuts", "Line-ups"],
    yearsExperience: 12,
    rating: 4.9,
    reviewCount: 128,
    portfolio: [],
    serviceIds: ["haircut-classic", "skin-fade", "beard-trim", "restyle"],
  },
  {
    id: "barber-2",
    name: "Marcus",
    bio: "Traditional wet-shave specialist with a passion for community barbering.",
    specialties: ["Hot Towel Shaves", "Beard Sculpting"],
    yearsExperience: 8,
    rating: 4.8,
    reviewCount: 96,
    portfolio: [],
    serviceIds: ["beard-trim", "hot-towel-shave", "haircut-classic"],
  },
  {
    id: "barber-3",
    name: "Leo",
    bio: "Great with kids and creative restyles — patient, precise, personable.",
    specialties: ["Kids' Cuts", "Restyles"],
    yearsExperience: 5,
    rating: 4.7,
    reviewCount: 54,
    portfolio: [],
    serviceIds: ["kids-cut", "restyle", "haircut-classic", "skin-fade"],
  },
  {
    id: "barber-4",
    name: "Barber 4 (name TBD)",
    bio: "Placeholder seat for the fourth barber — update once the real roster is confirmed.",
    specialties: ["Classic Cuts"],
    yearsExperience: 3,
    rating: 4.6,
    reviewCount: 21,
    portfolio: [],
    serviceIds: ["haircut-classic", "skin-fade", "beard-trim", "hot-towel-shave", "restyle", "kids-cut"],
  },
];

export const DEMO_REVIEWS: Review[] = [
  {
    id: "r1",
    barberId: "barber-1",
    customerName: "James O.",
    rating: 5,
    comment: "Best fade I've had in the city. Booking was seamless too.",
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "r2",
    barberId: "barber-2",
    customerName: "Daniel R.",
    rating: 5,
    comment: "The hot towel shave is worth it alone. Great vibe in the shop.",
    createdAt: "2026-08-15T14:00:00.000Z",
  },
];

export function getServiceById(id: string): Service | undefined {
  return DEMO_SERVICES.find((s) => s.id === id);
}

export function getBarberById(id: string): Barber | undefined {
  return DEMO_BARBERS.find((b) => b.id === id);
}

export function getBarbersForService(serviceId: string): Barber[] {
  return DEMO_BARBERS.filter((b) => b.serviceIds.includes(serviceId));
}

export function getReviewsForBarber(barberId: string): Review[] {
  return DEMO_REVIEWS.filter((r) => r.barberId === barberId);
}
