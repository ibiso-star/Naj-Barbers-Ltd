-- Naj Barbers Ltd — initial schema
-- Mirrors src/lib/types.ts and PRD.md §4 (Business Rules) / §5 (Data Model).

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles: one row per authenticated user (barbers + admins).
-- Customers are NOT required to have an account (guest booking is supported),
-- so customer data lives in its own `customers` table below.
-- ─────────────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('barber', 'admin')),
  full_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────
-- services
-- ─────────────────────────────────────────────────────────────────────────
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (
    category in ('haircut', 'beard', 'shave', 'fade', 'restyle', 'kids')
  ),
  description text not null default '',
  duration_minutes int not null check (duration_minutes > 0),
  price_gbp numeric(8, 2) not null check (price_gbp >= 0),
  deposit_gbp numeric(8, 2) not null default 0 check (deposit_gbp >= 0),
  buffer_minutes int not null default 15 check (buffer_minutes >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table services enable row level security;

create policy "Anyone can view active services"
  on services for select
  using (active or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "Admins manage services"
  on services for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ─────────────────────────────────────────────────────────────────────────
-- barbers
-- ─────────────────────────────────────────────────────────────────────────
create table barbers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete set null,
  name text not null,
  bio text not null default '',
  photo_url text,
  specialties text[] not null default '{}',
  years_experience int not null default 0,
  rating numeric(2, 1) not null default 0,
  review_count int not null default 0,
  portfolio text[] not null default '{}',
  commission_rate numeric(4, 3) not null default 0.5 check (
    commission_rate >= 0 and commission_rate <= 1
  ),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table barbers enable row level security;

create policy "Anyone can view active barbers"
  on barbers for select
  using (active or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "Barbers can update their own row"
  on barbers for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Admins manage barbers"
  on barbers for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create table barber_services (
  barber_id uuid not null references barbers (id) on delete cascade,
  service_id uuid not null references services (id) on delete cascade,
  primary key (barber_id, service_id)
);

alter table barber_services enable row level security;

create policy "Anyone can view barber_services"
  on barber_services for select
  using (true);

create policy "Admins manage barber_services"
  on barber_services for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Recurring weekly availability, e.g. Tue 09:00-19:00.
create table barber_availability (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null check (end_time > start_time)
);

alter table barber_availability enable row level security;

create policy "Anyone can view barber_availability"
  on barber_availability for select
  using (true);

create policy "Barbers manage their own availability"
  on barber_availability for all
  using (exists (
    select 1 from barbers b where b.id = barber_id and b.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from barbers b where b.id = barber_id and b.profile_id = auth.uid()
  ));

create policy "Admins manage all availability"
  on barber_availability for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- One-off blocks: holidays, personal time off.
create table barber_time_off (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at > start_at),
  reason text
);

alter table barber_time_off enable row level security;

create policy "Anyone can view time off (for availability calc)"
  on barber_time_off for select
  using (true);

create policy "Barbers manage their own time off"
  on barber_time_off for all
  using (exists (
    select 1 from barbers b where b.id = barber_id and b.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from barbers b where b.id = barber_id and b.profile_id = auth.uid()
  ));

create policy "Admins manage all time off"
  on barber_time_off for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ─────────────────────────────────────────────────────────────────────────
-- customers: guest-friendly — no auth.users row required to book.
-- ─────────────────────────────────────────────────────────────────────────
create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text not null,
  phone text not null,
  no_show_count int not null default 0,
  prepay_only boolean not null default false,
  created_at timestamptz not null default now()
);

alter table customers enable row level security;

create policy "Customers can view their own record"
  on customers for select
  using (auth_user_id = auth.uid());

create policy "Admins and barbers view customers"
  on customers for select
  using (exists (select 1 from profiles p where p.id = auth.uid()));

-- Inserts/updates to `customers` happen via trusted server actions using the
-- service-role key (src/lib/supabase/admin.ts), not directly from the browser,
-- so no public insert/update policy is defined here.

-- ─────────────────────────────────────────────────────────────────────────
-- bookings
-- ─────────────────────────────────────────────────────────────────────────
create table bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id),
  barber_id uuid not null references barbers (id),
  customer_id uuid not null references customers (id),
  start_time timestamptz not null,
  end_time timestamptz not null check (end_time > start_time),
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  payment_type text not null check (payment_type in ('deposit', 'full', 'pay_in_shop')),
  stripe_payment_intent_id text,
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),

  -- One barber can't be double-booked; buffer time is added to end_time
  -- by the application before insert (see PRD.md §4 Buffer time).
  exclude using gist (
    barber_id with =,
    tstzrange(start_time, end_time) with &&
  ) where (status not in ('cancelled', 'no_show'))
);

create index bookings_customer_id_idx on bookings (customer_id);
create index bookings_barber_id_start_time_idx on bookings (barber_id, start_time);

alter table bookings enable row level security;

create policy "Admins and barbers view all bookings"
  on bookings for select
  using (exists (select 1 from profiles p where p.id = auth.uid()));

create policy "Customers view their own bookings"
  on bookings for select
  using (exists (
    select 1 from customers c where c.id = customer_id and c.auth_user_id = auth.uid()
  ));

create policy "Barbers update bookings assigned to them"
  on bookings for update
  using (exists (
    select 1 from barbers b where b.id = barber_id and b.profile_id = auth.uid()
  ));

create policy "Admins manage all bookings"
  on bookings for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Booking creation (including guest checkout) and customer-initiated
-- cancel/reschedule go through server actions using the service-role client
-- (src/lib/supabase/admin.ts) so business rules — buffer time, cancellation
-- window, no-show flagging — are enforced in one place, not duplicated in RLS.

-- ─────────────────────────────────────────────────────────────────────────
-- reviews
-- ─────────────────────────────────────────────────────────────────────────
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique references bookings (id) on delete set null,
  barber_id uuid not null references barbers (id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "Anyone can view reviews"
  on reviews for select
  using (true);

-- Review submission is validated server-side (must match a completed booking)
-- via the service-role client, not a direct public insert policy.

-- ─────────────────────────────────────────────────────────────────────────
-- shop_settings: single row of shop-wide configuration.
-- ─────────────────────────────────────────────────────────────────────────
create table shop_settings (
  id boolean primary key default true check (id), -- enforces a single row
  name text not null default 'Naj Barbers Ltd',
  address text not null default '',
  phone text not null default '',
  opening_hours jsonb not null default '{
    "mon": null,
    "tue": {"open": "09:00", "close": "19:00"},
    "wed": {"open": "09:00", "close": "19:00"},
    "thu": {"open": "09:00", "close": "19:00"},
    "fri": {"open": "09:00", "close": "19:00"},
    "sat": {"open": "09:00", "close": "19:00"},
    "sun": {"open": "10:00", "close": "16:00"}
  }'::jsonb,
  buffer_minutes int not null default 15,
  cancellation_window_hours int not null default 4,
  walk_in_reserve_percent int not null default 20,
  no_show_limit int not null default 3
);

insert into shop_settings (id) values (true);

alter table shop_settings enable row level security;

create policy "Anyone can view shop settings"
  on shop_settings for select
  using (true);

create policy "Admins manage shop settings"
  on shop_settings for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
