-- Migration: new signups start as pending until a super_admin Approves.
-- Safe to re-run. Apply after swagstack_schema.sql (or on existing projects).

alter table public.ss_profiles
  drop constraint if exists ss_profiles_status_check;

alter table public.ss_profiles
  add constraint ss_profiles_status_check
  check (status in ('pending', 'active', 'suspended', 'deleted'));

create or replace function public.ss_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_email text := lower(coalesce(current_setting('app.ss_bootstrap_admin_email', true), ''));
  is_bootstrap boolean;
begin
  is_bootstrap := bootstrap_email <> '' and lower(coalesce(new.email, '')) = bootstrap_email;

  insert into public.ss_profiles (id, email, full_name, role, status, plan_id)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when is_bootstrap then 'super_admin' else 'customer' end,
    case when is_bootstrap then 'active' else 'pending' end,
    case when is_bootstrap then 'agency' else 'starter' end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.ss_profiles.full_name);

  return new;
end;
$$;

drop trigger if exists ss_on_auth_user_created on auth.users;
create trigger ss_on_auth_user_created
  after insert on auth.users
  for each row execute function public.ss_handle_new_user();
