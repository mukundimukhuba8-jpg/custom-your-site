# SwagStack Studio

Multi-tenant website customizer SaaS with a cyber / Pixably-inspired editor.

- Studio app: `/studio`
- Published customer sites: `/s/:slug`
- Setup + env docs: [`docs/SWAGSTACK.md`](docs/SWAGSTACK.md)
- Supabase connect: [`docs/SUPABASE_CONNECT.md`](docs/SUPABASE_CONNECT.md) → [API keys](https://supabase.com/dashboard/project/kxibxwvigejfzbhkksgu/settings/api)
- DB migration: [`supabase/swagstack_schema.sql`](supabase/swagstack_schema.sql)

```bash
npm install
npm run supabase:connect   # or: cp .env.example .env and fill keys
npm run dev
```

Open `http://localhost:5173/studio`.

```bash
npm test
npm run build
```

## Deploy (Vercel)

See [`docs/SWAGSTACK.md`](docs/SWAGSTACK.md#deploy-vercel). Import this GitHub repo in the Vercel dashboard (Vite, root `.`, env from `.env.example`), then open `/studio` on the production URL. CLI `vercel --prod` works only when logged in or `VERCEL_TOKEN` is set.
