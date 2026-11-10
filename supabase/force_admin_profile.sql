-- After swagstack_schema.sql: ensure owner profile for Studio admin.
-- Auth user id for mukundimukhuba8@gmail.com on kxibxwvigejfzbhkksgu:
--   bd7e5afa-bdaa-48fb-9af9-a0a332614c11

insert into public.ss_profiles (id, email, full_name, role, status, plan_id)
values (
  'bd7e5afa-bdaa-48fb-9af9-a0a332614c11',
  'mukundimukhuba8@gmail.com',
  'Mukundi Mukhuba',
  'super_admin',
  'active',
  'agency'
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = 'super_admin',
  status = 'active',
  plan_id = coalesce(nullif(public.ss_profiles.plan_id, ''), 'agency');

select id, email, role, status, plan_id
from public.ss_profiles
where id = 'bd7e5afa-bdaa-48fb-9af9-a0a332614c11';
