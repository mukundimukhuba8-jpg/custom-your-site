#!/usr/bin/env node
/**
 * Wire SwagStack Studio to Supabase project kxibxwvigejfzbhkksgu (eu-west-1).
 *
 * Accepts (env or --flags). Writes local `.env` (gitignored). Never prints secret values.
 *
 *   VITE_SUPABASE_URL              default https://kxibxwvigejfzbhkksgu.supabase.co
 *   VITE_SUPABASE_ANON_KEY         required for a working client
 *   SUPABASE_SERVICE_ROLE_KEY      optional; stored for seed/admin scripts only (no VITE_)
 *
 * Usage:
 *   node scripts/connect-supabase.mjs
 *   VITE_SUPABASE_ANON_KEY='…' SUPABASE_SERVICE_ROLE_KEY='…' node scripts/connect-supabase.mjs
 *   node scripts/connect-supabase.mjs --url … --anon … --service-role …
 *
 * Keys page:
 *   https://supabase.com/dashboard/project/kxibxwvigejfzbhkksgu/settings/api
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_REF = "kxibxwvigejfzbhkksgu";
const REGION = "eu-west-1";
const DEFAULT_URL = `https://${PROJECT_REF}.supabase.co`;
const KEYS_PAGE = `https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api`;
const SQL_EDITOR = `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`;
const ROOT = resolve(import.meta.dirname, "..");
const ENV_PATH = resolve(ROOT, ".env");
const EXAMPLE_PATH = resolve(ROOT, ".env.example");

function argValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return "";
  return String(process.argv[idx + 1] || "").trim();
}

function mask(value) {
  const v = String(value || "");
  if (!v) return "(missing)";
  if (v.length <= 12) return `${v.slice(0, 4)}…`;
  return `${v.slice(0, 8)}…${v.slice(-4)} (len=${v.length})`;
}

const url = (
  argValue("--url") ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  DEFAULT_URL
).trim().replace(/\/$/, "");

const anon = (
  argValue("--anon") ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ""
).trim();

const serviceRole = (
  argValue("--service-role") ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ""
).trim();

function upsertEnv(existing, key, value) {
  if (!value) return existing;
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(existing)) return existing.replace(re, line);
  const trimmed = existing.replace(/\s*$/, "");
  return `${trimmed}${trimmed ? "\n" : ""}${line}\n`;
}

let base = "";
if (existsSync(ENV_PATH)) {
  base = readFileSync(ENV_PATH, "utf8");
} else if (existsSync(EXAMPLE_PATH)) {
  base = readFileSync(EXAMPLE_PATH, "utf8");
}

let next = base || "";
next = upsertEnv(next, "VITE_SUPABASE_URL", url);
next = upsertEnv(next, "VITE_SUPABASE_ANON_KEY", anon || "your-anon-key");
if (serviceRole) {
  next = upsertEnv(next, "SUPABASE_SERVICE_ROLE_KEY", serviceRole);
  // Keep a non-VITE alias for server scripts
  next = upsertEnv(next, "SUPABASE_URL", url);
}

writeFileSync(ENV_PATH, next.endsWith("\n") ? next : `${next}\n`, { mode: 0o600 });

const report = {
  ok: Boolean(url && anon),
  projectRef: PROJECT_REF,
  region: REGION,
  keysPage: KEYS_PAGE,
  sqlEditor: SQL_EDITOR,
  wrote: ".env",
  url,
  anon: mask(anon),
  serviceRole: serviceRole ? mask(serviceRole) : "(not provided — seed/admin scripts unavailable)",
  nextSteps: [],
};

if (!anon) {
  report.nextSteps.push(`Open ${KEYS_PAGE} and copy the anon public key`);
  report.nextSteps.push(
    `Re-run: VITE_SUPABASE_ANON_KEY='…' node scripts/connect-supabase.mjs`
  );
} else {
  report.nextSteps.push("Apply supabase/swagstack_schema.sql in the SQL editor");
  report.nextSteps.push(`SQL editor: ${SQL_EDITOR}`);
  report.nextSteps.push("Add the same VITE_SUPABASE_* values on Vercel → Project → Settings → Environment Variables, then Redeploy");
  report.nextSteps.push("npm run dev → open /studio → Sign up or Sign in");
  if (serviceRole) {
    report.nextSteps.push(
      "Optional admin seed: SEED_ADMIN_PASSWORD='…' npm run seed:super-admin (if that script is present)"
    );
  } else {
    report.nextSteps.push(
      "Optional: pass SUPABASE_SERVICE_ROLE_KEY to this script for server-side seed/admin tooling"
    );
  }
}

async function probe() {
  if (!anon) return { skipped: true };
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
    return { status: res.status, ok: res.ok };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

const health = await probe();
report.authHealth = health;

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 2;
