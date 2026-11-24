-- SAVORA · 0400 · Reservations, notes and waitlist
--
-- Capacity model: every active reservation (pending or confirmed) holds exactly one table for
-- [starts_at, ends_at). An exclusion constraint makes it impossible for two active bookings to
-- overlap on the same table, so overbooking is prevented by the database itself, including when
-- two requests arrive at the same moment. A trigger also rejects parties larger than the table.
-- Combining tables for very large parties is a known limitation (handled as an event enquiry).
set search_path = public, extensions;

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.generate_booking_reference(),
  customer_id uuid references public.profiles (id) on delete set null,
  guest_name text not null check (char_length(guest_name) between 2 and 120),
  guest_email citext not null check (guest_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  guest_phone text not null check (char_length(guest_phone) between 7 and 30),
  party_size int not null check (party_size between 1 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  table_id uuid references public.restaurant_tables (id) on delete restrict,
  preferred_area_id uuid references public.dining_areas (id) on delete set null,
  occasion text check (char_length(occasion) <= 60),
  dietary_notes text check (char_length(dietary_notes) <= 500),
  special_request text check (char_length(special_request) <= 500),
  status public.reservation_status not null default 'pending',
  source text not null default 'website' check (source in ('website', 'phone', 'walk_in', 'staff', 'waitlist')),
  arrived_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text check (char_length(cancellation_reason) <= 500),
  -- Guest self-service link: only a SHA-256 hash of the token is stored.
  manage_token_hash text unique,
  manage_token_expires_at timestamptz,
  deposit_required boolean not null default false,
  payment_status public.payment_status not null default 'not_required',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (status not in ('pending', 'confirmed') or table_id is not null),
  constraint reservations_no_table_overlap exclude using gist (
    table_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);
create index reservations_starts_idx on public.reservations (starts_at);
create index reservations_status_starts_idx on public.reservations (status, starts_at);
create index reservations_customer_idx on public.reservations (customer_id);
create index reservations_email_idx on public.reservations (guest_email);
create trigger reservations_updated_at before update on public.reservations
  for each row execute function public.set_updated_at();

-- Party must fit the assigned table; status timestamps are kept consistent.
create or replace function public.reservations_validate()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  t record;
begin
  if new.table_id is not null then
    select min_capacity, max_capacity, active into t from public.restaurant_tables where id = new.table_id;
    if not found or not t.active then
      raise exception 'Table is not available' using errcode = 'check_violation';
    end if;
    if new.party_size > t.max_capacity then
      raise exception 'Party of % exceeds table capacity of %', new.party_size, t.max_capacity
        using errcode = 'check_violation';
    end if;
  end if;

  if new.status = 'confirmed' and new.confirmed_at is null then new.confirmed_at := now(); end if;
  if new.status = 'cancelled' and new.cancelled_at is null then new.cancelled_at := now(); end if;
  return new;
end;
$$;
create trigger reservations_validate before insert or update on public.reservations
  for each row execute function public.reservations_validate();

create table public.reservation_notes (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index reservation_notes_reservation_idx on public.reservation_notes (reservation_id);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles (id) on delete set null,
  guest_name text not null check (char_length(guest_name) between 2 and 120),
  guest_email citext not null,
  guest_phone text not null check (char_length(guest_phone) between 7 and 30),
  party_size int not null check (party_size between 1 and 100),
  preferred_date date not null,
  preferred_time time,
  flexibility_minutes int not null default 60 check (flexibility_minutes between 0 and 480),
  notes text check (char_length(notes) <= 500),
  status public.waitlist_status not null default 'waiting',
  converted_reservation_id uuid references public.reservations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index waitlist_date_status_idx on public.waitlist_entries (preferred_date, status);
create trigger waitlist_updated_at before update on public.waitlist_entries
  for each row execute function public.set_updated_at();
