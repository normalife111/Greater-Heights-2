-- SAVORA · 0700 · Row Level Security
--
-- Principles
--  * RLS is enabled on every table in `public`.
--  * Visitors (anon) can only read published content and the public restaurant profile.
--  * Customers can read their own profile, reservations, waitlist entries and notifications.
--  * Staff access is granted per permission through has_permission(), never by role name.
--  * Public forms (bookings, enquiries, contact, newsletter) have NO insert policy: they are
--    written by Edge Functions using the service role after validation and rate limiting.
--  * Tables with no policy at all (webhook events, email log) are service-role only.
set search_path = public, extensions;

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    -- Visitors never write directly; customers only where a column grant below allows it.
    execute format('revoke insert, update, delete, truncate on public.%I from anon', t.tablename);
  end loop;
end;
$$;

-- ---------- Restaurant profile & configuration ----------
create policy "public reads restaurant profile" on public.restaurant_settings
  for select to anon, authenticated using (true);
create policy "staff update restaurant profile" on public.restaurant_settings
  for update to authenticated
  using (public.has_permission('settings.manage') or public.has_permission('policies.manage'))
  with check (public.has_permission('settings.manage') or public.has_permission('policies.manage'));

-- Managers may change booking policy, but only settings.manage may change identity/contact fields.
create or replace function public.guard_restaurant_core_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.has_permission('settings.manage') and (
       new.name, new.descriptor, new.address, new.phone, new.email, new.whatsapp, new.maps_url,
       new.social_links, new.time_zone, new.currency, new.is_setup_placeholder)
     is distinct from (
       old.name, old.descriptor, old.address, old.phone, old.email, old.whatsapp, old.maps_url,
       old.social_links, old.time_zone, old.currency, old.is_setup_placeholder) then
    raise exception 'Changing restaurant profile details requires settings.manage'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
create trigger restaurant_settings_guard before update on public.restaurant_settings
  for each row execute function public.guard_restaurant_core_fields();

create policy "settings admins manage private settings" on public.restaurant_private_settings
  for all to authenticated
  using (public.has_permission('settings.manage'))
  with check (public.has_permission('settings.manage'));

create policy "public reads opening hours" on public.opening_hours
  for select to anon, authenticated using (true);
create policy "policy managers manage opening hours" on public.opening_hours
  for all to authenticated
  using (public.has_permission('policies.manage'))
  with check (public.has_permission('policies.manage'));

create policy "public reads active service periods" on public.service_periods
  for select to anon, authenticated using (active or public.has_permission('policies.manage'));
create policy "policy managers manage service periods" on public.service_periods
  for all to authenticated
  using (public.has_permission('policies.manage'))
  with check (public.has_permission('policies.manage'));

-- Closures hold internal reasons, so the public sees them only through the availability function.
create policy "staff read closures" on public.closures
  for select to authenticated
  using (public.has_permission('reservations.read') or public.has_permission('policies.manage'));
create policy "policy managers manage closures" on public.closures
  for all to authenticated
  using (public.has_permission('policies.manage'))
  with check (public.has_permission('policies.manage'));

create policy "public reads bookable areas" on public.dining_areas
  for select to anon, authenticated
  using ((active and bookable_online) or public.has_permission('reservations.read') or public.has_permission('tables.manage'));
create policy "table managers manage areas" on public.dining_areas
  for all to authenticated
  using (public.has_permission('tables.manage'))
  with check (public.has_permission('tables.manage'));

create policy "staff read tables" on public.restaurant_tables
  for select to authenticated
  using (public.has_permission('reservations.read') or public.has_permission('tables.manage'));
create policy "table managers manage tables" on public.restaurant_tables
  for all to authenticated
  using (public.has_permission('tables.manage'))
  with check (public.has_permission('tables.manage'));

-- ---------- People ----------
create policy "users read own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.has_permission('customers.read'));
create policy "users update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Customers may only edit these columns; email changes go through Supabase Auth.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, marketing_opt_in) on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated;

create policy "staff read roles" on public.roles
  for select to authenticated using (public.is_staff());
create policy "staff read permissions" on public.permissions
  for select to authenticated using (public.is_staff());
create policy "staff read role permissions" on public.role_permissions
  for select to authenticated using (public.is_staff());
create policy "staff admins manage role permissions" on public.role_permissions
  for all to authenticated
  using (public.has_permission('staff.manage'))
  with check (public.has_permission('staff.manage'));

create policy "staff read staff list" on public.staff_members
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
create policy "staff admins manage staff" on public.staff_members
  for all to authenticated
  using (public.has_permission('staff.manage'))
  with check (public.has_permission('staff.manage'));

create policy "staff read customer notes" on public.customer_notes
  for select to authenticated using (public.has_permission('customers.read'));
create policy "staff write customer notes" on public.customer_notes
  for insert to authenticated
  with check (public.has_permission('customers.notes') and author_id = auth.uid());

-- ---------- Reservations ----------
create policy "customers read own reservations" on public.reservations
  for select to authenticated
  using (customer_id = auth.uid() or public.has_permission('reservations.read'));
create policy "staff create reservations" on public.reservations
  for insert to authenticated with check (public.has_permission('reservations.manage'));
create policy "staff update reservations" on public.reservations
  for update to authenticated
  using (public.has_permission('reservations.manage'))
  with check (public.has_permission('reservations.manage'));
-- No delete policy: reservations are cancelled, never deleted, to keep history and reports.

create policy "staff read reservation notes" on public.reservation_notes
  for select to authenticated using (public.has_permission('reservations.read'));
create policy "staff add reservation notes" on public.reservation_notes
  for insert to authenticated
  with check (public.has_permission('reservations.manage') and author_id = auth.uid());

create policy "customers read own waitlist entries" on public.waitlist_entries
  for select to authenticated
  using (customer_id = auth.uid() or public.has_permission('waitlist.manage'));
create policy "staff manage waitlist" on public.waitlist_entries
  for all to authenticated
  using (public.has_permission('waitlist.manage'))
  with check (public.has_permission('waitlist.manage'));

-- ---------- Content (public reads published rows only) ----------
create policy "public reads published categories" on public.menu_categories
  for select to anon, authenticated using (published or public.has_permission('menu.manage'));
create policy "menu managers manage categories" on public.menu_categories
  for all to authenticated
  using (public.has_permission('menu.manage')) with check (public.has_permission('menu.manage'));

create policy "public reads current menu items" on public.menu_items
  for select to anon, authenticated
  using (
    (archived_at is null and exists (
       select 1 from public.menu_categories c where c.id = category_id and c.published))
    or public.has_permission('menu.manage')
  );
create policy "menu managers manage items" on public.menu_items
  for all to authenticated
  using (public.has_permission('menu.manage')) with check (public.has_permission('menu.manage'));

create policy "public reads published gallery" on public.gallery_images
  for select to anon, authenticated using (published or public.has_permission('gallery.manage'));
create policy "gallery managers manage gallery" on public.gallery_images
  for all to authenticated
  using (public.has_permission('gallery.manage')) with check (public.has_permission('gallery.manage'));

create policy "public reads published content" on public.content_sections
  for select to anon, authenticated using (published or public.has_permission('content.manage'));
create policy "content managers manage content" on public.content_sections
  for all to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

create policy "public reads published chefs" on public.chef_profiles
  for select to anon, authenticated using (published or public.has_permission('content.manage'));
create policy "content managers manage chefs" on public.chef_profiles
  for all to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

create policy "public reads published testimonials" on public.testimonials
  for select to anon, authenticated using (published or public.has_permission('content.manage'));
create policy "content managers manage testimonials" on public.testimonials
  for all to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

-- ---------- Enquiries, contact, newsletter ----------
create policy "staff read enquiries" on public.event_enquiries
  for select to authenticated using (public.has_permission('enquiries.read'));
create policy "staff update enquiries" on public.event_enquiries
  for update to authenticated
  using (public.has_permission('enquiries.manage')) with check (public.has_permission('enquiries.manage'));

create policy "staff read contact messages" on public.contact_messages
  for select to authenticated using (public.has_permission('enquiries.read'));
create policy "staff update contact messages" on public.contact_messages
  for update to authenticated
  using (public.has_permission('enquiries.manage')) with check (public.has_permission('enquiries.manage'));

create policy "staff read subscribers" on public.newsletter_subscribers
  for select to authenticated using (public.has_permission('newsletter.manage'));

-- ---------- Payments, notifications, audit ----------
create policy "staff and owners read payments" on public.payments
  for select to authenticated
  using (
    public.has_permission('payments.read')
    or exists (select 1 from public.reservations r where r.id = reservation_id and r.customer_id = auth.uid())
  );
-- payment_webhook_events and email_log: no policies → service role only.

create policy "users read own notifications" on public.notifications
  for select to authenticated using (recipient_id = auth.uid());
create policy "users mark own notifications read" on public.notifications
  for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "auditors read activity log" on public.activity_logs
  for select to authenticated using (public.has_permission('audit.read'));
revoke insert, update, delete on public.activity_logs from authenticated;
