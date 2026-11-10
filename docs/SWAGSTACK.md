# SwagStack Studio

Multi-tenant website customizer SaaS in the dedicated `custom-your-site` repository.

- Studio app: `/studio` (bare `/` redirects here)
- Published customer sites: `/s/:slug`
- This repo contains Studio only — no EdgeX desk / admin products

## What works in this MVP

| Phase | Capability | Status |
| --- | --- | --- |
| 1 | Supabase Auth sign-up / sign-in / password reset UI | Works when Supabase Auth + `ss_*` schema are applied |
| 1 | Customer dashboard + template library (6 templates) | Works (builtins offline; DB templates when schema applied) |
| 1 | Super-admin dashboard (customers, sites, plans, audit) | Works for `ss_profiles.role = super_admin` |
| 1 | Tenant isolation via RLS on `ss_*` tables | Works after schema apply |
| 2 | Live editor (text, colors, services/prices, CTA, SEO) | Works |
| 2 | Desktop / mobile preview | Works |
| 2 | Create-flow Laptop / Phone preference (`preferred_viewport`) | Works — forced at create; editor defaults to it |
| 2 | Autosave draft + media uploads to `swagstack-media` | Works after storage policies + auth |
| 3 | Draft vs published config, publish / unpublish | Works after schema apply |
| 3 | In-app publish path `/s/:slug` | Works for `status = published` |
| 3 | Custom domain records + DNS instruction architecture | Works as pending workflow; DNS/Vercel attach needs ops config |
| 4 | Configurable plans in DB + billing UI | Works |
| 4 | Payment provider interfaces (PayFast / Stripe) | Interface only — refuses fake success until secrets + checkout/webhook wiring are finished |
| 5 | Drag-and-drop / advanced section ordering | Not in MVP (by design) |

## Local run

```bash
npm install
cp .env.example .env   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

Open:

- Studio: `http://localhost:5173/studio`
- Example published path: `http://localhost:5173/s/<slug>`

## GitHub Pages preview

Project URL pattern: `https://mukundimukhuba8-jpg.github.io/custom-your-site/studio`

```bash
npm run build:pages
```

This builds with `base=/custom-your-site/`, writes `404.html` + `studio/index.html` SPA fallbacks, and `.nojekyll`.

### Enable Pages (required once — agent tokens cannot flip this)

1. Repo **Settings → Pages**
2. Either:
   - **Source: GitHub Actions** (uses `.github/workflows/github-pages.yml`), or
   - **Source: Deploy from a branch** → branch `gh-pages` / folder `/ (root)`
3. Wait for the deploy, then open `/studio` (or `/studio/login`) on the `*.github.io` URL.

## Database setup

1. Run `supabase/swagstack_schema.sql` in the Supabase SQL editor.
2. Optionally seed helper rows with `supabase/swagstack_template_versions.sql`.
3. Enable Email auth in Supabase Authentication.
4. Confirm storage bucket `swagstack-media` exists (created by the SwagStack SQL).
5. Promote a super-admin after first signup (or force-create — see [`SEED_SUPER_ADMIN.md`](SEED_SUPER_ADMIN.md)):

```sql
update public.ss_profiles
set role = 'super_admin'
where email = 'you@example.com';
```

   One-time service-role seed: `node scripts/seed-super-admin.mjs` (needs `SUPABASE_SERVICE_ROLE_KEY` + `SEED_ADMIN_PASSWORD`). SQL helper: `supabase/seed_super_admin.sql`.

## Environment variables

### Required for Studio auth + data

| Name | Where | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Vite + Vercel | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Vite + Vercel | Public anon key only |

### Payments (optional; not live until fully configured)

| Name | Where | Notes |
| --- | --- | --- |
| `VITE_PAYFAST_MERCHANT_ID` / `VITE_PAYFAST_MERCHANT_KEY` | Vite | Public identifiers only |
| `PAYFAST_MERCHANT_ID` / `PAYFAST_MERCHANT_KEY` / `PAYFAST_PASSPHRASE` | Vercel server | Required for real PayFast |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Vite | Publishable only |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Vercel server | Required for real Stripe |

`/api/swagstack-payments` returns `requires_configuration` until server secrets and checkout/webhook verification are completed. It will not invent a successful charge.

## Domain architecture

1. **Platform path (MVP):** every published site is available at `/s/:slug` on the same Vercel deployment.
2. **Platform subdomain (ops):** point `*.your-platform-domain` to the Vercel project, then map host → slug (future edge middleware / host rewrite). Rows are stored in `ss_domains` with `kind = subdomain`.
3. **Custom domain:** customer adds hostname in Studio → pending row with TXT + CNAME instructions → attach domain in Vercel / DNS provider → mark `active` after verification. Verification automation is intentionally not claimed as complete.

## Deploy (Vercel)

Studio must stay on the `/studio` path (and published sites on `/s/:slug`). Bare `/` redirects to `/studio`.

### Dashboard import (required when CLI has no token)

Agent/CLI deploy needs a logged-in Vercel account or `VERCEL_TOKEN`. Without that, do this once in the browser:

1. Open [https://vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → choose `mukundimukhuba8-jpg/custom-your-site`  
   (authorize the Vercel GitHub app for that org/user if prompted)
3. Project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `.` (repo root — leave blank / default)
   - **Build Command:** `npm run build` (from `vercel.json`)
   - **Output Directory:** `dist`
4. **Environment Variables** — add from [`.env.example`](../.env.example) for Production + Preview:

   | Name | Required now? |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Yes for real auth/data |
   | `VITE_SUPABASE_ANON_KEY` | Yes for real auth/data |
   | `VITE_PAYFAST_*` / `PAYFAST_*` / `VITE_STRIPE_*` / `STRIPE_*` | Only when enabling live checkout |

5. Deploy. Prefer Production Branch `main` after merging PR #1, or use the Git integration preview for branch `cursor/swagstack-studio-port-a43a`.
6. After deploy, open `https://YOUR-PROJECT.vercel.app/studio` (keep `/studio`).

### CLI (when authenticated)

```bash
# one-time: vercel login   OR   export VERCEL_TOKEN=...
npx vercel link --yes
npx vercel --prod
```

### After first deploy

1. Apply `supabase/swagstack_schema.sql` in the Supabase SQL editor (Email auth on).
2. Confirm `/api/swagstack-payments` responds (listed in `vercel.json`; returns `requires_configuration` until payment secrets exist).
3. Smoke-test `/studio` → sign-up → create site (Laptop/Phone) → publish → `/s/:slug`.

## Design references

Reference images for the Aeon / Pixably cyber aesthetic live in [`docs/design-refs/`](design-refs/).

## Tests

```bash
npm test
```

Unit coverage currently includes validation, route parsing, bootstrap, and payment status helpers.

## Security notes

- Customers only read/write their own `ss_websites`, configs, media, domains, subscriptions, and payments (RLS).
- Super-admins use `ss_is_super_admin()`.
- Uploads limited to image MIME types and 5MB; paths are namespaced by `auth.uid()`.
- Config values are sanitized; script tags / `javascript:` URLs are stripped before save.
- Never put PayFast passphrase or Stripe secret keys in `VITE_*` variables.

## Promoting templates

Template definitions also ship as builtins in `src/swagstack/lib/templates.js` so the library remains usable before/without DB rows. Prefer DB `ss_templates` + `ss_template_versions` for production edits from the admin tools / SQL.
