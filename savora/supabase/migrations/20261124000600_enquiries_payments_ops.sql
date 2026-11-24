-- SAVORA · 0600 · Enquiries, contact, newsletter, payments, notifications and audit log
set search_path = public, extensions;

create table public.event_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email citext not null,
  phone text not null check (char_length(phone) between 7 and 30),
  event_type text not null check (char_length(event_type) <= 40),
  preferred_date date,
  estimated_guests int not null check (estimated_guests between 1 and 2000),
  budget_range text check (char_length(budget_range) <= 60),
  message text not null check (char_length(message) between 10 and 2000),
  status public.enquiry_status not null default 'new',
  assigned_to uuid references public.profiles (id) on delete set null,
  follow_up_on date,
  internal_notes text check (char_length(internal_notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index event_enquiries_status_idx on public.event_enquiries (status, created_at desc);
create trigger event_enquiries_updated_at before update on public.event_enquiries
  for each row execute function public.set_updated_at();

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email citext not null,
  subject text check (char_length(subject) <= 120),
  message text not null check (char_length(message) between 10 and 2000),
  status public.message_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create trigger contact_messages_updated_at before update on public.contact_messages
  for each row execute function public.set_updated_at();

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,                              -- duplicate prevention
  consent_given_at timestamptz not null,
  consent_text text not null,                                -- the exact wording agreed to
  confirmed_at timestamptz,                                  -- double opt-in
  unsubscribed_at timestamptz,
  unsubscribe_token_hash text unique,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger newsletter_subscribers_updated_at before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();

-- Payments: provider references and amounts only. Never card numbers, CVV or credentials.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete restrict,
  provider text not null check (provider in ('paystack', 'flutterwave')),
  provider_reference text not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency char(3) not null default 'NGN',
  status public.payment_status not null default 'pending',
  verified_at timestamptz,                                   -- set only after server-side verification
  refunded_amount_kobo bigint not null default 0 check (refunded_amount_kobo >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference),
  check (status <> 'paid' or verified_at is not null)       -- cannot be 'paid' without verification
);
create index payments_reservation_idx on public.payments (reservation_id);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Raw webhook log. The unique event id makes processing idempotent.
create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('paystack', 'flutterwave')),
  provider_event_id text not null,
  event_type text not null,
  signature_valid boolean not null,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  received_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

-- In-app notifications for staff and customers.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,                                        -- e.g. 'booking.new', 'enquiry.new'
  title text not null,
  body text,
  link text,
  dedupe_key text,                                           -- prevents duplicate notifications
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_id, dedupe_key)
);
create index notifications_recipient_idx on public.notifications (recipient_id, read_at, created_at desc);

-- Outbound email log, used to send each email once and to retry failures.
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  recipient citext not null,
  dedupe_key text not null unique,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger email_log_updated_at before update on public.email_log
  for each row execute function public.set_updated_at();

-- Audit log of staff actions. Stores which columns changed, not their values, so no customer
-- personal data is copied into the log.
create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,                                             -- auth.uid() at the time; null = system
  action text not null,                                      -- INSERT / UPDATE / DELETE or custom
  target_table text not null,
  target_id text,
  changed_columns text[],
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);
create index activity_logs_target_idx on public.activity_logs (target_table, target_id);

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed text[];
  rec jsonb := to_jsonb(coalesce(new, old));
begin
  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into changed
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o using (key)
    where n.value is distinct from o.value and n.key <> 'updated_at';
    if changed is null then return new; end if;
  end if;

  insert into public.activity_logs (actor_id, action, target_table, target_id, changed_columns)
  values (auth.uid(), tg_op, tg_table_name, rec ->> 'id', changed);
  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'reservations', 'reservation_notes', 'waitlist_entries', 'restaurant_settings',
    'restaurant_private_settings', 'opening_hours', 'closures', 'dining_areas', 'restaurant_tables',
    'menu_categories', 'menu_items', 'gallery_images', 'content_sections', 'chef_profiles',
    'testimonials', 'event_enquiries', 'contact_messages', 'staff_members', 'role_permissions',
    'payments', 'customer_notes'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_row_change()', t || '_audit', t);
  end loop;
end;
$$;
