# Force-create Studio super_admin

Target email: `mukundimukhuba8@gmail.com`  
Supabase project used by Studio fallback: `qgixypagvtylyqzvzsbe`

## A) Preferred — service role script

1. Supabase Dashboard → **SQL Editor** → paste/run [`supabase/swagstack_schema.sql`](../supabase/swagstack_schema.sql) (skip if `ss_*` already exist).
2. Dashboard → **Project Settings → API** → copy **Project URL** and **`service_role`** key (secret).
3. From repo root (password via env only — do not commit it):

```bash
export SUPABASE_URL='https://qgixypagvtylyqzvzsbe.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='…'          # service_role secret
export SEED_ADMIN_EMAIL='mukundimukhuba8@gmail.com'
export SEED_ADMIN_PASSWORD='…'               # chosen admin password
npm install
node scripts/seed-super-admin.mjs
```

4. Open `/studio` → **Sign in** with that email + password.

The script creates the Auth user (or resets password if the email already exists), confirms email, and sets `ss_profiles.role = 'super_admin'`.

## B) Dashboard only (no service role in agent/CI)

### Auth user

1. [Supabase Dashboard](https://supabase.com/dashboard) → project **`qgixypagvtylyqzvzsbe`**
2. **Authentication** → **Users**
3. If `mukundimukhuba8@gmail.com` is listed: open the user → **…** → **Update user** / set password → save. Ensure email is confirmed.
4. If not listed: **Add user** → **Create new user**
   - Email: `mukundimukhuba8@gmail.com`
   - Password: (your admin password)
   - Enable **Auto Confirm User**
   - **Create user**
5. **Authentication → Providers → Email** → Email enabled. For MVP, Confirm email can be off.

### Schema + super_admin role

6. **SQL Editor** → run [`supabase/swagstack_schema.sql`](../supabase/swagstack_schema.sql) if `ss_profiles` is missing.
7. **SQL Editor** → run [`supabase/seed_super_admin.sql`](../supabase/seed_super_admin.sql)
8. Confirm the select at the bottom shows `role = super_admin`.
9. Studio `/studio` → Sign in.

## Notes

- Public anon signup cannot reliably force-set an existing user’s password (returns obfuscated responses / `invalid_credentials`).
- Never put `SUPABASE_SERVICE_ROLE_KEY` in `VITE_*` or client bundles.
- Rotate any password or service_role value that was shared in chat.
