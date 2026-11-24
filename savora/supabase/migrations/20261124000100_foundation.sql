-- SAVORA · 0100 · Extensions, enums and shared helpers
-- Every table uses UUID keys, created_at/updated_at timestamps and lives in `public`.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists btree_gist with schema extensions;

set search_path = public, extensions;

create type public.reservation_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
create type public.payment_status as enum ('not_required', 'unpaid', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded');
create type public.waitlist_status as enum ('waiting', 'offered', 'converted', 'expired', 'cancelled');
create type public.enquiry_status as enum ('new', 'contacted', 'quoted', 'booked', 'declined', 'closed');
create type public.message_status as enum ('new', 'read', 'replied', 'archived');
create type public.approval_mode as enum ('instant', 'staff_approval');

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Non-guessable booking reference, e.g. SAV-7KQ2-M9XD (40 random bits from a 32-letter alphabet
-- with no 0/O/1/I to avoid misreading over the phone).
create or replace function public.generate_booking_reference()
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  bytes bytea := gen_random_bytes(8);
  out text := '';
  i int;
begin
  for i in 0..7 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return 'SAV-' || substr(out, 1, 4) || '-' || substr(out, 5, 4);
end;
$$;
