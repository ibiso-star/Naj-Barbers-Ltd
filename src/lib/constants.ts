import type { ShopSettings } from "./types";

export const SHOP_SETTINGS: ShopSettings = {
  name: "Naj Barbers Ltd",
  companyNumber: "15508310",
  establishedYear: 2024,
  address: "13 Mansel Street, Swansea SA1 5SF",
  addressMapQuery: "Naj Barbers Ltd, 13 Mansel Street, Swansea SA1 5SF",
  phone: "07876 489900",
  email: "info@najbarbers.com",
  instagramHandle: "@najbarbers",
  instagramUrl: "https://instagram.com/najbarbers",
  openingHours: {
    mon: null,
    tue: { open: "09:00", close: "19:00" },
    wed: { open: "09:00", close: "19:00" },
    thu: { open: "09:00", close: "19:00" },
    fri: { open: "09:00", close: "19:00" },
    sat: { open: "09:00", close: "19:00" },
    sun: { open: "10:00", close: "16:00" },
  },
  bufferMinutes: 15,
  cancellationWindowHours: 4,
  walkInReservePercent: 20,
};

export const NO_SHOW_LIMIT = 3;

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
