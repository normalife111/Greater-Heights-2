-- SAVORA · 0300 · Restaurant profile, hours, closures, dining areas and tables
set search_path = public, extensions;

-- Public restaurant profile and booking policy. Exactly one row (id = true).
create table public.restaurant_settings (
  id boolean primary key default true check (id),
  name text not null default 'SAVORA',
  descriptor text not null default 'Afro-Continental Bistro',
  address text,                 -- null until the owner supplies a verified address
  phone text,
  email citext,
  whatsapp text,
  maps_url text,
  social_links jsonb not null default '[]'::jsonb,
  time_zone text not null default 'Africa/Lagos',
  currency char(3) not null default 'NGN',
  -- Booking policy
  approval_mode public.approval_mode not null default 'staff_approval',
  slot_interval_minutes int not null default 30 check (slot_interval_minutes in (15, 30, 60)),
  booking_duration_minutes int not null default 120 check (booking_duration_minutes between 30 and 360),
  min_party_size int not null default 1 check (min_party_size >= 1),
  max_party_size int not null default 12 check (max_party_size between 1 and 100),
  min_notice_minutes int not null default 120 check (min_notice_minutes >= 0),
  booking_horizon_days int not null default 60 check (booking_horizon_days between 1 and 365),
  cancellation_cutoff_minutes int not null default 240 check (cancellation_cutoff_minutes >= 0),
  is_setup_placeholder boolean not null default true,  -- true until verified details are entered
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_party_size <= max_party_size)
);
create trigger restaurant_settings_updated_at before update on public.restaurant_settings
  for each row execute function public.set_updated_at();
insert into public.restaurant_settings (id) values (true);

-- Private settings: notification recipients and deposit rules. Never readable by the public.
create table public.restaurant_private_settings (
  id boolean primary key default true check (id),
  notification_emails citext[] not null default '{}',
  deposit_enabled boolean not null default false,
  deposit_min_party_size int check (deposit_min_party_size >= 1),
  deposit_amount_kobo bigint check (deposit_amount_kobo >= 0),   -- NGN minor units
  deposit_refund_policy text,
  payment_provider text check (payment_provider in ('paystack', 'flutterwave')),
  reminder_hours_before int not null default 24 check (reminder_hours_before between 1 and 168),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger restaurant_private_settings_updated_at before update on public.restaurant_private_settings
  for each row execute function public.set_updated_at();
insert into public.restaurant_private_settings (id) values (true);

-- Weekly opening hours. day_of_week follows ISO: 1 = Monday ... 7 = Sunday.
-- Several rows per day allow split service (e.g. lunch and dinner).
create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 1 and 7),
  opens_at time not null,
  closes_at time not null,          -- may be <= opens_at for service past midnight
  last_seating_at time,             -- latest booking start; defaults to closes_at - booking duration
  label text,                       -- e.g. 'Lunch', 'Dinner'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  exclude using gist (day_of_week with =, int4range(
    (extract(epoch from opens_at) / 60)::int,
    case when closes_at > opens_at then (extract(epoch from closes_at) / 60)::int else 1440 end
  ) with &&)
);
create index opening_hours_day_idx on public.opening_hours (day_of_week);
create trigger opening_hours_updated_at before update on public.opening_hours
  for each row execute function public.set_updated_at();

-- Optional named service periods for reporting and per-period capacity rules.
create table public.service_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at time not null,
  ends_at time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger service_periods_updated_at before update on public.service_periods
  for each row execute function public.set_updated_at();

-- Blackout dates and partial closures (private hire, holidays).
create table public.closures (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,                      -- internal
  public_message text,              -- shown to guests, e.g. 'Closed for a private event'
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index closures_range_idx on public.closures using gist (tstzrange(starts_at, ends_at));
create trigger closures_updated_at before update on public.closures
  for each row execute function public.set_updated_at();

create table public.dining_areas (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z_]+$'),   -- indoor, outdoor, private
  name text not null,
  description text,
  bookable_online boolean not null default true,        -- only these appear as seating options
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger dining_areas_updated_at before update on public.dining_areas
  for each row execute function public.set_updated_at();

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,                           -- e.g. 'T1', 'Patio 3'
  area_id uuid not null references public.dining_areas (id) on delete restrict,
  min_capacity int not null default 1 check (min_capacity >= 1),
  max_capacity int not null check (max_capacity >= 1),
  bookable_online boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_capacity <= max_capacity)
);
create index restaurant_tables_area_idx on public.restaurant_tables (area_id);
create trigger restaurant_tables_updated_at before update on public.restaurant_tables
  for each row execute function public.set_updated_at();
