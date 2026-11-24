-- SAVORA · 0200 · Customer profiles, staff, roles and permissions
set search_path = public, extensions;

-- One profile per Supabase Auth user (customers and staff alike).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  email citext,
  phone text check (char_length(phone) <= 30),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_email_idx on public.profiles (email);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Roles and granular permissions. Role names are data; code checks permissions, never role names.
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z_]+$'),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();

create table public.permissions (
  key text primary key check (key ~ '^[a-z_]+\.[a-z_]+$'),
  description text not null
);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission text not null references public.permissions (key) on delete cascade,
  primary key (role_id, permission)
);

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  active boolean not null default true,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index staff_members_role_idx on public.staff_members (role_id);
create trigger staff_members_updated_at before update on public.staff_members
  for each row execute function public.set_updated_at();

-- Permission check used by every RLS policy. SECURITY DEFINER so it can read the role tables
-- without exposing them; it only ever answers about the calling user.
create or replace function public.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_members sm
    join public.role_permissions rp on rp.role_id = sm.role_id
    where sm.user_id = auth.uid()
      and sm.active
      and rp.permission = perm
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff_members where user_id = auth.uid() and active);
$$;

revoke all on function public.has_permission(text) from public;
revoke all on function public.is_staff() from public;
grant execute on function public.has_permission(text) to anon, authenticated, service_role;
grant execute on function public.is_staff() to anon, authenticated, service_role;

-- Staff-only notes about a customer (never visible to the customer).
create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index customer_notes_customer_idx on public.customer_notes (customer_id);

-- ---------- Role and permission catalogue (configuration, not demo data) ----------
insert into public.permissions (key, description) values
  ('reservations.read',   'View reservations and guest booking details'),
  ('reservations.manage', 'Create, edit, approve, cancel and complete reservations'),
  ('waitlist.manage',     'View and manage the waitlist'),
  ('tables.manage',       'Manage dining areas, tables and capacity'),
  ('customers.read',      'View the customer directory and booking history'),
  ('customers.notes',     'Add internal notes to customers'),
  ('menu.manage',         'Manage menu categories and items'),
  ('content.manage',      'Manage website content, chefs and testimonials'),
  ('gallery.manage',      'Upload and manage gallery images'),
  ('enquiries.read',      'View event enquiries and contact messages'),
  ('enquiries.manage',    'Update, assign and annotate enquiries and messages'),
  ('newsletter.manage',   'View and export newsletter subscribers'),
  ('reports.read',        'View reports and dashboard analytics'),
  ('payments.read',       'View payment records'),
  ('policies.manage',     'Manage booking policies, opening hours and closures'),
  ('settings.manage',     'Manage core restaurant, email and deposit settings'),
  ('staff.manage',        'Invite, deactivate and assign roles to staff'),
  ('audit.read',          'View the audit log'),
  ('data.export',         'Export records to CSV');

insert into public.roles (key, name, description) values
  ('super_admin',       'Super Admin',       'All modules and settings'),
  ('manager',           'Manager',           'Bookings, customers, menu, reports and enquiries'),
  ('reservation_staff', 'Reservation Staff', 'Bookings, waitlist and guest arrival'),
  ('content_manager',   'Content Manager',   'Website content, gallery and menu');

insert into public.role_permissions (role_id, permission)
select r.id, p.key from public.roles r cross join public.permissions p where r.key = 'super_admin';

insert into public.role_permissions (role_id, permission)
select r.id, p from public.roles r,
  unnest(array['reservations.read','reservations.manage','waitlist.manage','tables.manage',
               'customers.read','customers.notes','menu.manage','enquiries.read','enquiries.manage',
               'newsletter.manage','reports.read','payments.read','policies.manage','data.export']) p
where r.key = 'manager';

insert into public.role_permissions (role_id, permission)
select r.id, p from public.roles r,
  unnest(array['reservations.read','reservations.manage','waitlist.manage']) p
where r.key = 'reservation_staff';

insert into public.role_permissions (role_id, permission)
select r.id, p from public.roles r,
  unnest(array['menu.manage','content.manage','gallery.manage']) p
where r.key = 'content_manager';
