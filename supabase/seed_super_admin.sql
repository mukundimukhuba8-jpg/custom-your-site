-- One-time: promote Studio admin after Auth user exists.
-- Project expected by Studio fallback: qgixypagvtylyqzvzsbe
--
-- 1) Apply swagstack_schema.sql first if ss_* tables are missing.
-- 2) Create/confirm Auth user in Dashboard (Authentication → Users → Add user,
--    Auto Confirm User ON) OR run: node scripts/seed-super-admin.mjs
-- 3) Run this file in SQL Editor.

-- Optional: future signups with this email become super_admin via trigger.
select set_config('app.ss_bootstrap_admin_email', 'mukundimukhuba8@gmail.com', false);

update public.ss_profiles
set
  role = 'super_admin',
  status = 'active',
  plan_id = coalesce(nullif(plan_id, ''), 'agency'),
  full_name = coalesce(nullif(full_name, ''), 'Mukundi Mukhuba')
where lower(email) = lower('mukundimukhuba8@gmail.com');

-- If the Auth user exists but the profile row is missing (trigger not applied yet):
insert into public.ss_profiles (id, email, full_name, role, status, plan_id)
select
  u.id,
  coalesce(u.email, 'mukundimukhuba8@gmail.com'),
  coalesce(u.raw_user_meta_data->>'full_name', 'Mukundi Mukhuba'),
  'super_admin',
  'active',
  'agency'
from auth.users u
where lower(coalesce(u.email, '')) = lower('mukundimukhuba8@gmail.com')
on conflict (id) do update
set
  role = 'super_admin',
  status = 'active',
  email = excluded.email,
  full_name = excluded.full_name;

select id, email, role, status, plan_id
from public.ss_profiles
where lower(email) = lower('mukundimukhuba8@gmail.com');
