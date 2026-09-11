export type ServiceCategory =
  | "haircut"
  | "beard"
  | "shave"
  | "fade"
  | "restyle"
  | "kids";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  durationMinutes: number;
  priceGbp: number;
  depositGbp: number;
  imageUrl?: string;
}

export interface BarberSpecialty {
  serviceId: string;
}

export interface Review {
  id: string;
  barberId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Barber {
  id: string;
  name: string;
  bio: string;
  photoUrl?: string;
  specialties: string[];
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  portfolio: string[];
  serviceIds: string[];
}

export type TimeSlot = {
  start: string; // ISO
  end: string; // ISO
  barberId: string;
};

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Booking {
  id: string;
  serviceId: string;
  barberId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  status: BookingStatus;
  paymentType: "deposit" | "full" | "pay_in_shop";
  createdAt: string;
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  openingHours: Record<
    "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
    { open: string; close: string } | null
  >;
  bufferMinutes: number;
  cancellationWindowHours: number;
  walkInReservePercent: number;
}
