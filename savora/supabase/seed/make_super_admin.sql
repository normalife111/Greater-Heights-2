-- Run ONCE in the Supabase SQL editor after the owner has signed up on the site
-- (or been created under Authentication → Users). Replace the email first.
insert into public.staff_members (user_id, role_id)
select p.id, r.id
from public.profiles p, public.roles r
where p.email = 'owner@example.com'      -- ← the owner's real sign-in email
  and r.key = 'super_admin'
on conflict (user_id) do update set role_id = excluded.role_id, active = true;
