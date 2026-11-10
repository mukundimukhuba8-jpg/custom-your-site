#!/usr/bin/env node
/**
 * One-time: create/update Studio Auth user + ensure ss_profiles.role = super_admin.
 *
 * Requires service role (never put this in VITE_*):
 *   SUPABASE_URL                 (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_ADMIN_EMAIL             (default mukundimukhuba8@gmail.com)
 *   SEED_ADMIN_PASSWORD          (required — do not commit)
 *
 * Usage:
 *   SEED_ADMIN_PASSWORD='…' SUPABASE_SERVICE_ROLE_KEY='…' node scripts/seed-super-admin.mjs
 *
 * Apply supabase/swagstack_schema.sql in the SQL editor first if ss_* tables are missing.
 */
import { createClient } from "@supabase/supabase-js";

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const email = (process.env.SEED_ADMIN_EMAIL || "mukundimukhuba8@gmail.com").trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || "";
const fullName = process.env.SEED_ADMIN_NAME || "Mukundi Mukhuba";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!url) fail("Missing SUPABASE_URL or VITE_SUPABASE_URL");
if (!serviceKey) fail("Missing SUPABASE_SERVICE_ROLE_KEY (Dashboard → Project Settings → API → service_role)");
if (!password) fail("Missing SEED_ADMIN_PASSWORD");
if (password.length < 6) fail("SEED_ADMIN_PASSWORD must be at least 6 characters");

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function findUserByEmail(users) {
  return (users || []).find((u) => String(u.email || "").toLowerCase() === email) || null;
}

async function ensureAuthUser() {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (!created.error) {
    return { user: created.data.user, action: "created" };
  }

  const msg = String(created.error.message || created.error).toLowerCase();
  const already =
    created.error.status === 422 ||
    msg.includes("already") ||
    msg.includes("registered") ||
    msg.includes("exists");

  if (!already) {
    fail(`createUser failed: ${created.error.message || created.error}`);
  }

  let found = null;
  for (let page = 1; page <= 20 && !found; page += 1) {
    const listed = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (listed.error) fail(`listUsers failed: ${listed.error.message}`);
    found = findUserByEmail(listed.data?.users);
    if (!(listed.data?.users || []).length) break;
  }
  if (!found?.id) fail(`User ${email} already exists but could not be listed — set password in Dashboard → Authentication → Users`);

  const updated = await admin.auth.admin.updateUserById(found.id, {
    password,
    email_confirm: true,
    user_metadata: { ...(found.user_metadata || {}), full_name: fullName },
  });
  if (updated.error) fail(`updateUserById failed: ${updated.error.message}`);
  return { user: updated.data.user, action: "updated" };
}

async function ensureProfile(userId) {
  const { data: existing, error: selectError } = await admin
    .from("ss_profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    fail(
      `ss_profiles read failed (${selectError.message}). Apply supabase/swagstack_schema.sql in the SQL editor, then re-run.`
    );
  }

  if (!existing) {
    const { error: insertError } = await admin.from("ss_profiles").insert({
      id: userId,
      email,
      full_name: fullName,
      role: "super_admin",
      status: "active",
      plan_id: "agency",
    });
    if (insertError) {
      fail(
        `ss_profiles insert failed (${insertError.message}). If the auth trigger did not fire, apply swagstack_schema.sql then run supabase/seed_super_admin.sql`
      );
    }
    return { action: "inserted", role: "super_admin" };
  }

  const { error: updateError } = await admin
    .from("ss_profiles")
    .update({ role: "super_admin", email, full_name: fullName, status: "active" })
    .eq("id", userId);
  if (updateError) fail(`ss_profiles update failed: ${updateError.message}`);
  return { action: "updated", role: "super_admin", previousRole: existing.role };
}

const { user, action } = await ensureAuthUser();
const profile = await ensureProfile(user.id);

console.log(
  JSON.stringify(
    {
      ok: true,
      email,
      userId: user.id,
      auth: action,
      profile,
      next: "Sign in at /studio with this email and SEED_ADMIN_PASSWORD",
    },
    null,
    2
  )
);
