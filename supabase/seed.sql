-- Real launch content mirroring src/lib/demo-data.ts (see PRD.md §7 —
-- services/pricing/barber count decided 2026-09-11). Barber names beyond the
-- confirmed headcount of 4 are still placeholders pending the real roster.

insert into services (id, name, category, description, duration_minutes, price_gbp) values
  (gen_random_uuid(), 'Classic Haircut', 'haircut', 'Precision cut, tailored to your style, finished with a hot towel.', 30, 28),
  (gen_random_uuid(), 'Skin Fade', 'fade', 'Sharp, blended skin fade with clean line-up.', 45, 32),
  (gen_random_uuid(), 'Beard Trim', 'beard', 'Shape and tidy with straight razor line-up.', 15, 14),
  (gen_random_uuid(), 'Cut + Beard Combo', 'combo', 'A full haircut paired with a straight-razor beard trim.', 45, 38),
  (gen_random_uuid(), 'Hot Towel Shave', 'shave', 'Traditional wet shave with hot towel and finishing balm.', 30, 25),
  (gen_random_uuid(), 'Restyle Consultation', 'restyle', 'Full consultation and restyle for a fresh new look.', 60, 45),
  (gen_random_uuid(), 'Kids'' Cut', 'kids', 'Relaxed, friendly cut for younger clients (under 12).', 20, 16);

-- 4 barber seats per PRD.md §7 — names/specialties/photos are placeholders
-- pending the real roster.
insert into barbers (id, name, bio, specialties, years_experience, rating, review_count) values
  (gen_random_uuid(), 'Naj', 'Founder and master barber. Specialist in sharp fades and classic gentleman''s cuts.', array['Skin Fades', 'Classic Cuts', 'Line-ups'], 12, 4.9, 128),
  (gen_random_uuid(), 'Marcus', 'Traditional wet-shave specialist with a passion for community barbering.', array['Hot Towel Shaves', 'Beard Sculpting'], 8, 4.8, 96),
  (gen_random_uuid(), 'Leo', 'Great with kids and creative restyles — patient, precise, personable.', array['Kids'' Cuts', 'Restyles'], 5, 4.7, 54),
  (gen_random_uuid(), 'Barber 4 (name TBD)', 'Placeholder seat for the fourth barber — update once the real roster is confirmed.', array['Classic Cuts'], 3, 4.6, 21);

-- Every barber offers every service (decided 2026-09-11, PRD.md §7).
insert into barber_services (barber_id, service_id)
select b.id, s.id from barbers b cross join services s;

-- Recurring weekly availability matching shop hours (Tue-Sat 9-7, Sun 10-4).
insert into barber_availability (barber_id, day_of_week, start_time, end_time)
select b.id, d.day_of_week, d.start_time, d.end_time
from barbers b
cross join (values
  (2, time '09:00', time '19:00'), -- Tue
  (3, time '09:00', time '19:00'), -- Wed
  (4, time '09:00', time '19:00'), -- Thu
  (5, time '09:00', time '19:00'), -- Fri
  (6, time '09:00', time '19:00'), -- Sat
  (0, time '10:00', time '16:00')  -- Sun
) as d(day_of_week, start_time, end_time);
