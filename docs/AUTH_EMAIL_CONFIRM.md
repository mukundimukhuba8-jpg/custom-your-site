# Disable email confirmation (Studio signup)

**Project:** `kxibxwvigejfzbhkksgu` (eu-west-1)

## Dashboard (source of truth)

1. Open [Authentication → Providers](https://supabase.com/dashboard/project/kxibxwvigejfzbhkksgu/auth/providers)
2. Open **Email**
3. Set **Confirm email** to **OFF**
4. Save

With Confirm email OFF, GoTrue reports `mailer_autoconfirm: true` and new signups can sign in immediately (no verify-email step).

## API note

- Public `GET /auth/v1/settings` exposes `mailer_autoconfirm` (read-only).
- `PUT /auth/v1/settings` → **405** with the project service/secret key.
- Supabase Management API (`/v1/projects/{ref}/config/auth`) needs a **personal access token**, not the project service_role/secret. This agent cannot flip the toggle without that token.

## Verify

After Confirm email is OFF:

1. Sign up a new user in `/studio`
2. Sign in with the same password without opening a confirmation email
