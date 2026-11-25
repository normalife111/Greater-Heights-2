-- SAVORA security & integrity tests. Run via supabase/tests/run.sh (local PostgreSQL only).
-- Each block impersonates a role the same way Supabase does: SET ROLE + the JWT subject claim.
\set ON_ERROR_STOP 1
\set QUIET 1

-- ---------- Fixtures (as superuser) ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ada@example.com',   '{"full_name":"Ada Customer"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bayo@example.com',  '{"full_name":"Bayo Customer"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'owner@example.com', '{"full_name":"Owner"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'mgr@example.com',   '{"full_name":"Manager"}'),
  ('00000000-0000-0000-0000-0000000000a3', 'host@example.com',  '{"full_name":"Host"}'),
  ('00000000-0000-0000-0000-0000000000a4', 'cms@example.com',   '{"full_name":"Content"}');

insert into public.staff_members (user_id, role_id)
select u, r.id from (values
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'super_admin'),
  ('00000000-0000-0000-0000-0000000000a2'::uuid, 'manager'),
  ('00000000-0000-0000-0000-0000000000a3'::uuid, 'reservation_staff'),
  ('00000000-0000-0000-0000-0000000000a4'::uuid, 'content_manager')
) s(u, k) join public.roles r on r.key = s.k;

insert into public.reservations (id, customer_id, guest_name, guest_email, guest_phone, party_size, starts_at, ends_at, table_id, status)
select v.id, v.cust, v.name, v.email, '+2348000000000', 2, v.s, v.s + interval '2 hours',
       (select id from public.restaurant_tables where label = 'T1'), 'confirmed'
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-00000000000a'::uuid, 'Ada Customer', 'ada@example.com', timestamptz '2030-01-10 19:00+01'),
  ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-00000000000b'::uuid, 'Bayo Customer', 'bayo@example.com', timestamptz '2030-01-11 19:00+01')
) v(id, cust, name, email, s);

insert into public.event_enquiries (name, email, phone, event_type, estimated_guests, message)
values ('Chi', 'chi@example.com', '+2348000000001', 'birthday', 20, 'Birthday dinner for twenty guests.');

insert into public.menu_categories (slug, name, published) values ('hidden', 'Hidden draft', false);
insert into public.menu_items (category_id, name, price_kobo, archived_at)
  select id, 'Archived dish', 100000, now() from public.menu_categories where slug = 'starters';
insert into public.menu_items (category_id, name, price_kobo)
  select id, 'Draft-category dish', 100000 from public.menu_categories where slug = 'hidden';

-- ---------- 1. Signup trigger creates profiles ----------
do $$ begin
  assert (select count(*) from public.profiles) = 6, 'profiles auto-created on signup';
  assert (select full_name from public.profiles where email = 'ada@example.com') = 'Ada Customer', 'profile name copied';
end $$;

-- ---------- 2. Anonymous visitor ----------
begin;
set local role anon;
do $$
declare n int;
begin
  assert (select count(*) from public.menu_items) = 86, 'anon sees the 86 current menu items only';
  assert not exists (select 1 from public.menu_items where name in ('Archived dish', 'Draft-category dish')), 'anon cannot see archived/draft dishes';
  assert not exists (select 1 from public.menu_categories where slug = 'hidden'), 'anon cannot see unpublished categories';
  assert (select count(*) from public.restaurant_settings) = 1, 'anon reads public profile';
  assert (select count(*) from public.opening_hours) = 7, 'anon reads opening hours';
  assert (select count(*) from public.reservations) = 0, 'anon sees no reservations';
  assert (select count(*) from public.restaurant_tables) = 0, 'anon sees no table layout';
  assert (select count(*) from public.event_enquiries) = 0, 'anon sees no enquiries';
  assert (select count(*) from public.restaurant_private_settings) = 0, 'anon sees no private settings';
  assert (select count(*) from public.profiles) = 0, 'anon sees no profiles';
  begin
    insert into public.reservations (guest_name, guest_email, guest_phone, party_size, starts_at, ends_at)
    values ('Hacker', 'h@example.com', '+2340000000', 2, now(), now() + interval '2h');
    raise exception 'anon insert into reservations should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.newsletter_subscribers (email, consent_given_at, consent_text) values ('x@example.com', now(), 'x');
    raise exception 'anon insert into newsletter should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.menu_items set price_kobo = 1;
    raise exception 'anon price change should fail';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

-- ---------- 3. Customer sees only their own data ----------
begin;
-- Customers cannot read the roles table, so pass the role id in from the superuser session.
select set_config('test.super_role', (select id::text from public.roles where key = 'super_admin'), true) \g /dev/null
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
declare n int;
begin
  assert (select count(*) from public.reservations) = 1, 'customer sees exactly one reservation';
  assert (select guest_name from public.reservations) = 'Ada Customer', 'and it is their own';
  assert (select count(*) from public.profiles) = 1, 'customer sees only own profile';
  update public.profiles set full_name = 'Ada O.' where id = auth.uid();
  assert (select full_name from public.profiles) = 'Ada O.', 'customer can rename themselves';
  begin
    update public.profiles set email = 'stolen@example.com' where id = auth.uid();
    raise exception 'customer email change should fail';
  exception when insufficient_privilege then null;
  end;
  update public.reservations set party_size = 8;
  get diagnostics n = row_count;
  assert n = 0, 'customer cannot edit reservations directly';
  begin
    insert into public.staff_members (user_id, role_id) values (auth.uid(), current_setting('test.super_role')::uuid);
    raise exception 'privilege escalation should fail';
  exception when insufficient_privilege then null;
  end;
  assert not public.has_permission('reservations.read'), 'customer has no staff permissions';
end $$;
rollback;

-- ---------- 4. Reservation staff ----------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
do $$
declare n int;
begin
  assert (select count(*) from public.reservations) = 2, 'host sees all reservations';
  update public.reservations set arrived_at = now() where reference is not null and guest_name = 'Ada Customer';
  get diagnostics n = row_count;
  assert n = 1, 'host can mark a guest arrived';
  assert (select count(*) from public.profiles) = 1, 'host cannot browse the customer directory';
  assert (select count(*) from public.restaurant_private_settings) = 0, 'host cannot read private settings';
  update public.menu_items set price_kobo = 1;
  get diagnostics n = row_count;
  assert n = 0, 'host cannot change menu prices';
  begin
    update public.staff_members set active = false;
    get diagnostics n = row_count;
    assert n = 0, 'host cannot change staff';
  end;
  assert (select count(*) from public.event_enquiries) = 0, 'host cannot read enquiries';
  assert (select count(*) from public.activity_logs) = 0, 'host cannot read audit log';
end $$;
rollback;

-- ---------- 5. Content manager ----------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a4';
do $$
declare n int;
begin
  update public.menu_items set price_kobo = 1500000 where name = 'Jollof Rice & Chicken';
  get diagnostics n = row_count;
  assert n = 1, 'content manager can change a price';
  assert (select count(*) from public.menu_items) = 88, 'content manager also sees draft and archived dishes';
  assert (select count(*) from public.reservations) = 0, 'content manager sees no reservations';
  assert (select count(*) from public.profiles) = 1, 'content manager sees no customer data';
end $$;
rollback;

-- ---------- 6. Manager ----------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
do $$
declare n int;
begin
  assert (select count(*) from public.profiles) = 6, 'manager can browse customers';
  assert (select count(*) from public.event_enquiries) = 1, 'manager reads enquiries';
  update public.restaurant_settings set max_party_size = 10;
  get diagnostics n = row_count;
  assert n = 1, 'manager can change booking policy';
  begin
    update public.restaurant_settings set phone = '+2340000000000';
    raise exception 'manager should not change core profile';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.staff_members (user_id, role_id)
      select '00000000-0000-0000-0000-00000000000b', id from public.roles where key = 'manager';
    assert found, 'manager can see roles, so this insert is a real attempt';
    raise exception 'manager should not manage staff';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from public.restaurant_private_settings) = 0, 'manager cannot read deposit/email settings';
end $$;
rollback;

-- ---------- 7. Super admin + audit log ----------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ begin
  update public.restaurant_settings set phone = '+2340000000000';
  update public.restaurant_private_settings set deposit_enabled = true;
  assert (select count(*) from public.activity_logs
          where actor_id = auth.uid() and target_table = 'restaurant_settings'
            and changed_columns = array['phone']) = 1, 'audit log records actor and changed column';
end $$;
rollback;

-- ---------- 8. Capacity and data integrity ----------
do $$
declare t1 uuid := (select id from public.restaurant_tables where label = 'T1');
begin
  -- Overlapping booking on the same table is rejected by the exclusion constraint.
  begin
    insert into public.reservations (guest_name, guest_email, guest_phone, party_size, starts_at, ends_at, table_id)
    values ('Clash', 'c@example.com', '+2348000000002', 2, '2030-01-10 20:00+01', '2030-01-10 22:00+01', t1);
    raise exception 'overlap should be rejected';
  exception when exclusion_violation then null;
  end;
  -- Back-to-back booking (starts exactly when the previous ends) is allowed.
  insert into public.reservations (guest_name, guest_email, guest_phone, party_size, starts_at, ends_at, table_id)
  values ('Next', 'n@example.com', '+2348000000003', 2, '2030-01-10 21:00+01', '2030-01-10 23:00+01', t1);
  -- A cancelled booking frees the table.
  update public.reservations set status = 'cancelled' where guest_name = 'Next';
  insert into public.reservations (guest_name, guest_email, guest_phone, party_size, starts_at, ends_at, table_id)
  values ('Rebook', 'r@example.com', '+2348000000004', 1, '2030-01-10 21:00+01', '2030-01-10 23:00+01', t1);
  -- Party larger than the table is rejected.
  begin
    insert into public.reservations (guest_name, guest_email, guest_phone, party_size, starts_at, ends_at, table_id)
    values ('Big', 'b@example.com', '+2348000000005', 5, '2030-02-01 19:00+01', '2030-02-01 21:00+01', t1);
    raise exception 'oversize party should be rejected';
  exception when check_violation then null;
  end;
  -- Active bookings must hold a table.
  begin
    insert into public.reservations (guest_name, guest_email, guest_phone, party_size, starts_at, ends_at, status)
    values ('NoTable', 'x@example.com', '+2348000000006', 2, '2030-02-01 19:00+01', '2030-02-01 21:00+01', 'pending');
    raise exception 'active booking without table should be rejected';
  exception when check_violation then null;
  end;
  -- References look like SAV-XXXX-XXXX and are unique.
  assert (select bool_and(reference ~ '^SAV-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$') from public.reservations), 'reference format';
  -- A payment cannot be marked paid without server verification.
  begin
    insert into public.payments (reservation_id, provider, provider_reference, amount_kobo, status)
    values ('10000000-0000-0000-0000-000000000001', 'paystack', 'ref_1', 500000, 'paid');
    raise exception 'unverified paid payment should be rejected';
  exception when check_violation then null;
  end;
  -- Newsletter duplicates are prevented (case-insensitive).
  insert into public.newsletter_subscribers (email, consent_given_at, consent_text) values ('Dup@Example.com', now(), 'I agree');
  begin
    insert into public.newsletter_subscribers (email, consent_given_at, consent_text) values ('dup@example.com', now(), 'I agree');
    raise exception 'duplicate subscriber should be rejected';
  exception when unique_violation then null;
  end;
end $$;

-- ---------- 9. Every public table has RLS enabled ----------
do $$ begin
  assert not exists (
    select 1 from pg_tables where schemaname = 'public' and not rowsecurity
  ), 'RLS enabled on all public tables';
end $$;

\echo '  all security and integrity assertions passed'
