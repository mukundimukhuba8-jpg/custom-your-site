import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import {
  OWNER_EMAIL,
  OWNER_PASSWORD_HASH,
  ensureOwnerSeeded,
  hashPassword,
  listAppUsers,
  setAppUserStatus,
  signInLocal,
  signUpLocal,
  clearLocalSession,
} from "./localAuth.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const store = new Map();
globalThis.localStorage = {
  getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  setItem(key, value) {
    store.set(key, String(value));
  },
  removeItem(key) {
    store.delete(key);
  },
};

test("owner seed is super_admin active without storing plaintext password", () => {
  store.clear();
  const owner = ensureOwnerSeeded();
  assert.equal(owner.email, OWNER_EMAIL);
  assert.equal(owner.role, "super_admin");
  assert.equal(owner.status, "active");
  assert.equal(owner.password_hash, OWNER_PASSWORD_HASH);
  assert.equal(Object.prototype.hasOwnProperty.call(owner, "password_hash"), true);
  const listed = listAppUsers();
  assert.equal(listed[0].email, OWNER_EMAIL);
  assert.equal("password_hash" in listed[0], false);
});

test("signup creates pending customer and can be approved", async () => {
  store.clear();
  ensureOwnerSeeded();
  const created = await signUpLocal({
    email: "pending.user@example.com",
    password: "sample-pass-1",
    fullName: "Pending User",
  });
  assert.equal(created.profile.status, "pending");
  assert.equal(created.profile.role, "customer");
  const approved = setAppUserStatus(created.user.id, "active");
  assert.equal(approved.status, "active");
  clearLocalSession();
});

test("owner password hash matches digest helper", async () => {
  const digest = await hashPassword("sample-pass");
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(digest, await hashPassword("sample-pass"));
  assert.notEqual(digest, OWNER_PASSWORD_HASH);
});

test("signInLocal rejects wrong password", async () => {
  store.clear();
  ensureOwnerSeeded();
  await assert.rejects(() => signInLocal({ email: OWNER_EMAIL, password: "definitely-not-it" }), /Invalid login credentials/);
});

test("ensureOwnerSeeded repairs stale owner password hash", async () => {
  store.clear();
  store.set(
    "ss_app_users_v1",
    JSON.stringify([
      {
        id: "00000000-0000-4000-8000-000000000001",
        email: OWNER_EMAIL,
        full_name: "Mukundi Mukhuba",
        role: "customer",
        status: "pending",
        plan_id: "starter",
        password_hash: "0".repeat(64),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  );
  const owner = ensureOwnerSeeded();
  assert.equal(owner.role, "super_admin");
  assert.equal(owner.status, "active");
  assert.equal(owner.password_hash, OWNER_PASSWORD_HASH);
});
