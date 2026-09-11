import { z } from "zod";

export const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  startTime: z.string().min(1), // ISO
  customerName: z.string().min(2, "Enter your full name"),
  customerEmail: z.string().email("Enter a valid email"),
  customerPhone: z.string().min(7, "Enter a valid phone number"),
  notes: z.string().max(500).optional(),
  paymentType: z.enum(["full", "pay_in_shop"]),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
