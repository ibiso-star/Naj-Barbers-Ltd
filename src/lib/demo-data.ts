import type { Barber, Review, Service } from "./types";

/**
 * Real launch content per PRD.md §7 (services/pricing/barber count decided
 * 2026-09-11). Barber names/photos beyond the confirmed headcount of 4 are
 * still placeholders pending the real roster.
 *
 * Ratings/review counts are intentionally left at 0 and DEMO_REVIEWS empty —
 * the shop has no real reviews yet (est. 2024, pre-launch), and inventing
 * star ratings or customer quotes would be fabricated testimonials shipped
 * to real users. The UI treats reviewCount === 0 as "no reviews yet".
 */

export const DEMO_SERVICES: Service[] = [
  {
    id: "haircut-classic",
    name: "Classic Haircut",
    category: "haircut",
    description: "Precision cut, tailored to your style, finished with a hot towel.",
    durationMinutes: 30,
    priceGbp: 28,
  },
  {
    id: "skin-fade",
    name: "Skin Fade",
    category: "fade",
    description: "Sharp, blended skin fade with clean line-up.",
    durationMinutes: 45,
    priceGbp: 32,
  },
  {
    id: "beard-trim",
    name: "Beard Trim",
    category: "beard",
    description: "Shape and tidy with straight razor line-up.",
    durationMinutes: 15,
    priceGbp: 14,
  },
  {
    id: "cut-beard-combo",
    name: "Cut + Beard Combo",
    category: "combo",
    description: "A full haircut paired with a straight-razor beard trim.",
    durationMinutes: 45,
    priceGbp: 38,
  },
  {
    id: "hot-towel-shave",
    name: "Hot Towel Shave",
    category: "shave",
    description: "Traditional wet shave with hot towel and finishing balm.",
    durationMinutes: 30,
    priceGbp: 25,
  },
  {
    id: "restyle",
    name: "Restyle Consultation",
    category: "restyle",
    description: "Full consultation and restyle for a fresh new look.",
    durationMinutes: 60,
    priceGbp: 45,
  },
  {
    id: "kids-cut",
    name: "Kids' Cut",
    category: "kids",
    description: "Relaxed, friendly cut for younger clients (under 12).",
    durationMinutes: 20,
    priceGbp: 16,
  },
];

const ALL_SERVICE_IDS = DEMO_SERVICES.map((s) => s.id);

// 4 barber seats per PRD.md §7 — names/photos are placeholders pending the
// real roster. Every barber offers every service (decided 2026-09-11).
export const DEMO_BARBERS: Barber[] = [
  {
    id: "barber-1",
    name: "Naj",
    bio: "Founder and master barber. Specialist in sharp fades and classic gentleman's cuts.",
    specialties: ["Skin Fades", "Classic Cuts", "Line-ups"],
    yearsExperience: 12,
    rating: 0,
    reviewCount: 0,
    portfolio: [],
    serviceIds: ALL_SERVICE_IDS,
  },
  {
    id: "barber-2",
    name: "Marcus",
    bio: "Traditional wet-shave specialist with a passion for community barbering.",
    specialties: ["Hot Towel Shaves", "Beard Sculpting"],
    yearsExperience: 8,
    rating: 0,
    reviewCount: 0,
    portfolio: [],
    serviceIds: ALL_SERVICE_IDS,
  },
  {
    id: "barber-3",
    name: "Leo",
    bio: "Great with kids and creative restyles — patient, precise, personable.",
    specialties: ["Kids' Cuts", "Restyles"],
    yearsExperience: 5,
    rating: 0,
    reviewCount: 0,
    portfolio: [],
    serviceIds: ALL_SERVICE_IDS,
  },
  {
    id: "barber-4",
    name: "Barber 4 (name TBD)",
    bio: "Placeholder seat for the fourth barber — update once the real roster is confirmed.",
    specialties: ["Classic Cuts"],
    yearsExperience: 3,
    rating: 0,
    reviewCount: 0,
    portfolio: [],
    serviceIds: ALL_SERVICE_IDS,
  },
];

// Intentionally empty — no real customer reviews exist yet. See note above.
export const DEMO_REVIEWS: Review[] = [];

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
