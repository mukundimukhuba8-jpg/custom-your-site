# Connect Studio → Supabase `kxibxwvigejfzbhkksgu`

**Region:** `eu-west-1`  
**API / keys page:** https://supabase.com/dashboard/project/kxibxwvigejfzbhkksgu/settings/api  
**Project URL:** `https://kxibxwvigejfzbhkksgu.supabase.co`

## One-command wire (when you have keys)

```bash
VITE_SUPABASE_ANON_KEY='…' \
SUPABASE_SERVICE_ROLE_KEY='…' \   # optional, server-only
node scripts/connect-supabase.mjs
```

This writes gitignored `.env` with `VITE_SUPABASE_URL` + anon (+ service_role if provided). It never prints full secrets.

Without keys yet:

```bash
node scripts/connect-supabase.mjs
# → opens instructions; copy anon (+ service_role) from the keys page, re-run
```

## After connect

1. SQL Editor → run `supabase/swagstack_schema.sql`  
   https://supabase.com/dashboard/project/kxibxwvigejfzbhkksgu/sql/new
2. Authentication → Providers → Email → enabled
3. Vercel → Environment Variables → set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` → Redeploy
4. Open `/studio` and Sign up / Sign in

Never put `service_role` in `VITE_*` or the browser bundle.

## Auth: no email confirmation

Dashboard → [Authentication → Providers → Email](https://supabase.com/dashboard/project/kxibxwvigejfzbhkksgu/auth/providers) → **Confirm email = OFF**.

See [`AUTH_EMAIL_CONFIRM.md`](AUTH_EMAIL_CONFIRM.md). Project service/secret keys cannot change this via API (Management token required).
