# Signup approval (owner gate)

New customer signups land as `ss_profiles.status = 'pending'`. They can sign in, but Studio shows **Waiting for approval** until a super-admin Approves.

## Flow

1. User signs up → Auth user created → trigger inserts `ss_profiles` with `status=pending` (unless bootstrap admin email).
2. User signs in → sees waiting screen (no dashboard/editor).
3. Super-admin opens `/studio/admin/approvals` → **Approve** (`active`) or **Reject** (`suspended`).
4. Approved users get full Studio access.

## Schema

- Fresh install: `supabase/swagstack_schema.sql` (default status `pending`).
- Existing DB: also run `supabase/ss_profiles_pending_status.sql`.

## Admin URL

`/studio/admin/approvals`
