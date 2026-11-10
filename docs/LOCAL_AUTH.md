# Own-database auth (no Supabase Auth)

Studio login/signup uses **hashed passwords in the app DB** (`localStorage` key `ss_app_users_v1` in the browser). Supabase Auth is not used.

## Owner login

1. Open `/studio/login`
2. Email: `mukundimukhuba8@gmail.com`
3. Password: the seeded owner password (shared with the owner out of band — not stored in git)

Owner is auto-seeded as `super_admin` + `active`.

## New users

1. `/studio/signup` → account created with `status=pending`
2. User sees **Waiting for approval**
3. Owner opens `/studio/admin/approvals` → Approve / Reject

## What still needs config

- Deploy/host the Vite app (Vercel or local `npm run dev`)
- Set any payment env vars only if you enable checkout
- Optional later: migrate `ss_app_users` to Postgres using `supabase/ss_app_users.sql` + a server API (browser store is per-device today)

## URLs

- Login: `/studio/login`
- Admin approvals: `/studio/admin/approvals`
