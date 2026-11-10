/**
 * Own-app auth (no Supabase Auth).
 * Users + password digests live in localStorage (browser DB).
 * Password plaintext is never stored — only SHA-256 hex digests.
 */
export const OWNER_EMAIL = "mukundimukhuba8@gmail.com";
export const OWNER_USER_ID = "00000000-0000-4000-8000-000000000001";
/** SHA-256 of the seeded owner password (plaintext not stored in repo). */
export const OWNER_PASSWORD_HASH =
  "8761a23522d5b41dd81e549cd9c69ae10ec84ab71d0c0ea9477b0505a953dce3";

const USERS_KEY = "ss_app_users_v1";
const SESSION_KEY = "ss_app_session_v1";

function cleanPassword(value) {
  return String(value ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export async function hashPassword(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(cleanPassword(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `user_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readUsers() {
  try {
    const rows = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeUsers(rows) {
  localStorage.setItem(USERS_KEY, JSON.stringify(rows));
  return rows;
}

export function ensureOwnerSeeded() {
  const users = readUsers();
  const email = OWNER_EMAIL;
  const existing = users.find((row) => cleanEmail(row.email) === email);
  if (existing) {
    // Always re-assert seeded owner credentials so login cannot stick on a
    // stale/wrong hash from an earlier signup or partial seed.
    let dirty = false;
    if (existing.id !== OWNER_USER_ID) {
      existing.id = OWNER_USER_ID;
      dirty = true;
    }
    if (existing.role !== "super_admin") {
      existing.role = "super_admin";
      dirty = true;
    }
    if (existing.status !== "active") {
      existing.status = "active";
      dirty = true;
    }
    if (existing.plan_id !== "agency") {
      existing.plan_id = "agency";
      dirty = true;
    }
    if (existing.password_hash !== OWNER_PASSWORD_HASH) {
      existing.password_hash = OWNER_PASSWORD_HASH;
      dirty = true;
    }
    if (!existing.full_name) {
      existing.full_name = "Mukundi Mukhuba";
      dirty = true;
    }
    if (dirty) {
      existing.updated_at = new Date().toISOString();
      writeUsers(users);
    }
    return existing;
  }
  const owner = {
    id: OWNER_USER_ID,
    email,
    full_name: "Mukundi Mukhuba",
    role: "super_admin",
    status: "active",
    plan_id: "agency",
    password_hash: OWNER_PASSWORD_HASH,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.unshift(owner);
  writeUsers(users);
  return owner;
}

function publicUser(row) {
  if (!row) return null;
  const { password_hash: _omit, ...rest } = row;
  return rest;
}

export function listAppUsers() {
  ensureOwnerSeeded();
  return readUsers().map(publicUser);
}

export function getAppUser(userId) {
  ensureOwnerSeeded();
  return publicUser(readUsers().find((row) => row.id === userId) || null);
}

export function getAppUserByEmail(email) {
  ensureOwnerSeeded();
  const needle = cleanEmail(email);
  return publicUser(readUsers().find((row) => cleanEmail(row.email) === needle) || null);
}

export async function signUpLocal({ email, password, fullName }) {
  ensureOwnerSeeded();
  const normalized = cleanEmail(email);
  if (!normalized) throw new Error("Email is required.");
  if (cleanPassword(password).length < 6) throw new Error("Password must be at least 6 characters.");

  const users = readUsers();
  if (users.some((row) => cleanEmail(row.email) === normalized)) {
    throw new Error("An account with that email already exists. Sign in instead.");
  }

  const isOwner = normalized === OWNER_EMAIL;
  const row = {
    id: isOwner ? OWNER_USER_ID : newId(),
    email: normalized,
    full_name: String(fullName || "").trim(),
    role: isOwner ? "super_admin" : "customer",
    status: isOwner ? "active" : "pending",
    plan_id: isOwner ? "agency" : "starter",
    password_hash: await hashPassword(password),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.unshift(row);
  writeUsers(users);
  saveLocalSession(row);
  return {
    user: { id: row.id, email: row.email },
    session: { local: true, userId: row.id },
    profile: publicUser(row),
  };
}

export async function signInLocal({ email, password }) {
  ensureOwnerSeeded();
  const normalized = cleanEmail(email);
  const users = readUsers();
  let row = users.find((item) => cleanEmail(item.email) === normalized);
  if (!row) throw new Error("Invalid login credentials");
  const digest = await hashPassword(password);
  if (digest !== row.password_hash) {
    // Owner recovery: if the typed password matches the seeded digest, repair
    // the stored hash and continue (handles corrupted browser DB).
    if (normalized === OWNER_EMAIL && digest === OWNER_PASSWORD_HASH) {
      row = ensureOwnerSeeded();
    } else {
      throw new Error("Invalid login credentials");
    }
  }
  saveLocalSession(row);
  return {
    user: { id: row.id, email: row.email },
    session: { local: true, userId: row.id },
    profile: publicUser(row),
  };
}

export function saveLocalSession(row) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ userId: row.id, email: row.email, at: Date.now() })
  );
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function loadLocalSession() {
  try {
    ensureOwnerSeeded();
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.userId) return null;
    const user = readUsers().find((row) => row.id === parsed.userId);
    if (!user) return null;
    return { userId: user.id, email: user.email, at: parsed.at };
  } catch {
    return null;
  }
}

export async function updateLocalPassword(userId, password) {
  if (cleanPassword(password).length < 6) throw new Error("Password must be at least 6 characters.");
  const users = readUsers();
  const idx = users.findIndex((row) => row.id === userId);
  if (idx < 0) throw new Error("User not found.");
  users[idx] = {
    ...users[idx],
    password_hash: await hashPassword(password),
    updated_at: new Date().toISOString(),
  };
  writeUsers(users);
  return publicUser(users[idx]);
}

export function updateAppUser(userId, patch) {
  const users = readUsers();
  const idx = users.findIndex((row) => row.id === userId);
  if (idx < 0) throw new Error("User not found.");
  const next = {
    ...users[idx],
    ...patch,
    password_hash: users[idx].password_hash,
    updated_at: new Date().toISOString(),
  };
  if (patch.password_hash) next.password_hash = patch.password_hash;
  users[idx] = next;
  writeUsers(users);
  return publicUser(next);
}

export function setAppUserStatus(userId, status) {
  return updateAppUser(userId, { status });
}
