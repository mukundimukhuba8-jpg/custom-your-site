-- Optional Postgres table for own-app auth (no Supabase Auth / auth.users).
-- Browser Studio currently uses localStorage via src/swagstack/lib/localAuth.js.
-- Use this when you later move credentials to a server-side Postgres DB.

create table if not exists public.ss_app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null default '',
  role text not null default 'customer'
    check (role in ('customer', 'super_admin')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'deleted')),
  plan_id text not null default 'starter',
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ss_app_users_status_idx on public.ss_app_users (status);
