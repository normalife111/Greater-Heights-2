-- SAVORA · 0500 · Menu, gallery and website content (CMS)
set search_path = public, extensions;

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) <= 80),
  description text,
  sort_order int not null default 0,
  published boolean not null default true,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger menu_categories_updated_at before update on public.menu_categories
  for each row execute function public.set_updated_at();

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  name text not null check (char_length(name) <= 120),
  description text check (char_length(description) <= 600),
  price_kobo bigint not null check (price_kobo >= 0),     -- NGN in minor units; never trust client prices
  image_path text,                                         -- path in the 'menu' storage bucket
  available boolean not null default true,                 -- "unavailable today"
  featured boolean not null default false,                 -- chef's selection on the home page
  tags text[] not null default '{}',
  allergens text check (char_length(allergens) <= 300),
  sort_order int not null default 0,
  archived_at timestamptz,                                 -- archived items are hidden, not deleted
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_category_idx on public.menu_items (category_id, sort_order);
create index menu_items_featured_idx on public.menu_items (featured) where featured and archived_at is null;
create trigger menu_items_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,                               -- path in the 'gallery' bucket
  alt_text text not null check (char_length(alt_text) between 3 and 200),
  category text not null default 'Food' check (category in ('Food', 'Interior', 'Drinks', 'Events', 'Team')),
  sort_order int not null default 0,
  published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger gallery_images_updated_at before update on public.gallery_images
  for each row execute function public.set_updated_at();

-- Editable copy blocks keyed by page and section, e.g. ('home', 'hero').
create table public.content_sections (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page ~ '^[a-z_-]+$'),
  section text not null check (section ~ '^[a-z_-]+$'),
  title text,
  body jsonb not null default '{}'::jsonb,
  image_path text,
  published boolean not null default true,
  is_sample boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page, section)
);
create trigger content_sections_updated_at before update on public.content_sections
  for each row execute function public.set_updated_at();

create table public.chef_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  bio text,
  portrait_path text,
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger chef_profiles_updated_at before update on public.chef_profiles
  for each row execute function public.set_updated_at();

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null check (char_length(quote) between 5 and 600),
  author text not null,
  source text,                                              -- e.g. 'Google review'
  consent_confirmed boolean not null default false,
  sort_order int not null default 0,
  published boolean not null default false,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not published or consent_confirmed or is_sample)   -- real quotes need recorded consent
);
create trigger testimonials_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();
