import test from "node:test";
import assert from "node:assert/strict";
import { createProtectedContractGateway } from "../src/sdk/server.mjs";

const validToken = "t".repeat(32);
const transport = (peerId = "verified-peer-1", bearerToken = validToken) => ({ peerId, bearerToken });
const principal = (tenantId = "tenant-1", scopes = ["contracts:read"]) => ({
  subject: "user-1", tenantId, scopes: new Set(scopes),
});
function fakeSdk(channel = "stable", overrides = {}) {
  return {
    channel,
    list: () => [{ type: "Card" }],
    inspect: type => ({ type, version: "1.0.0" }),
    validate: input => ({ valid: true, spec: input }),
    generate: input => ({ valid: true, spec: input }),
    ...overrides,
  };
}
function gateway(options = {}) {
  return createProtectedContractGateway({
    stableSdk: fakeSdk(),
    authenticate: async token => token === validToken ? principal() : null,
    ...options,
  });
}

test("E12: requires a trusted authenticator and an SDK with a stable channel", () => {
  assert.throws(() => createProtectedContractGateway({ stableSdk: fakeSdk() }), /authenticator/);
  assert.throws(() => createProtectedContractGateway({
    stableSdk: fakeSdk("experimental"), authenticate: async () => principal(),
  }), /authenticator/);
  assert.throws(() => gateway({ limits: { requestsPerMinute: 0 } }), /policy/);
  assert.throws(() => gateway({ limits: { unknown: 10 } }), /policy/);
  assert.throws(() => gateway({ limits: { concurrentPerPrincipal: 12, concurrentGlobal: 5 } }), /capacity/);
});

test("E12: authentication is host-resolved; no identity or tenant is accepted in commands", async () => {
  const g = gateway();
  assert.deepEqual(await g.execute(transport("p", "invalid"), { operation: "list" }), {
    ok: false, status: 401, error: "unauthorized",
  });
  assert.equal((await g.execute({ peerId: "p" }, { operation: "list" })).status, 401);
  assert.equal((await g.execute(transport(), { operation: "list", tenantId: "admin" })).status, 400);
  assert.equal((await g.execute(transport(), { operation: "inspect", input: "Card" })).status, 200);
  assert.equal((await g.execute(transport(), { operation: "validate", input: {} })).status, 403);
});

test("E12: missing grants and explicit experimental grants fail closed", async () => {
  const stable = fakeSdk(), experimental = fakeSdk("experimental");
  const g = gateway({ stableSdk: stable, experimentalSdk: experimental });
  assert.equal((await g.execute(transport(), { operation: "list", channel: "experimental" })).status, 403);
  assert.equal((await g.execute(transport(), { operation: "generate", input: { root: "r" } })).status, 403);
  const allowed = gateway({
    stableSdk: stable, experimentalSdk: experimental,
    authenticate: async () => principal("tenant-1", ["contracts:read", "contracts:experimental"]),
  });
  const answer = await allowed.execute(transport(), { operation: "list", channel: "experimental" });
  assert.equal(answer.status, 200);
  const missingSdk = gateway({ authenticate: async () =>
    principal("tenant-1", ["contracts:read", "contracts:experimental"]) });
  assert.equal((await missingSdk.execute(transport(), {
    operation: "list", channel: "experimental",
  })).status, 403);
});

test("E12: peer authentication attempts are limited, recover after window, and exceptions deny", async () => {
  let now = 1_000, checks = 0;
  const g = gateway({
    clock: () => now,
    limits: { authAttemptsPerMinute: 2, globalAuthAttemptsPerMinute: 5 },
    authenticate: async token => { checks++; return token === validToken ? principal() : null; },
  });
  assert.equal((await g.execute(transport("a", "x".repeat(25)), { operation: "list" })).status, 401);
  assert.equal((await g.execute(transport("a"), { operation: "list" })).status, 200);
  assert.deepEqual(await g.execute(transport("a"), { operation: "list" }), {
    ok: false, status: 429, error: "rate_limited", retryAfterSeconds: 59,
  });
  assert.equal(checks, 2);
  now += 61_000;
  assert.equal((await g.execute(transport("a"), { operation: "list" })).status, 200);
  const broken = gateway({ authenticate: async () => { throw Error("secret auth detail"); } });
  assert.deepEqual(await broken.execute(transport(), { operation: "list" }), {
    ok: false, status: 401, error: "unauthorized",
  });
});

test("E12: per-tenant per-user minute and day quotas are enforced independently", async () => {
  let now = 1_000, tenant = "tenant-1";
  const g = gateway({
    clock: () => now,
    limits: { requestsPerMinute: 2, requestsPerDay: 3 },
    authenticate: async () => principal(tenant),
  });
  for (let i = 0; i < 2; i++) assert.equal((await g.execute(transport(), { operation: "list" })).status, 200);
  assert.equal((await g.execute(transport(), { operation: "list" })).error, "rate_limited");
  now += 61_000;
  assert.equal((await g.execute(transport(), { operation: "list" })).status, 200);
  assert.equal((await g.execute(transport(), { operation: "list" })).error, "quota_exceeded");
  tenant = "tenant-2";
  assert.equal((await g.execute(transport(), { operation: "list" })).status, 200);
  tenant = "tenant-1";
  now += 86_400_000;
  assert.equal((await g.execute(transport(), { operation: "list" })).status, 200);
});

test("E12: aggregate tenant quotas cannot be bypassed by creating more subjects", async () => {
  let now = 1_000, subject = "user-0";
  const g = gateway({
    clock: () => now,
    limits: { requestsPerMinute: 10, requestsPerDay: 20,
      requestsPerTenantMinute: 2, requestsPerTenantDay: 3 },
    authenticate: async () => ({ ...principal(), subject }),
  });
  for (let index = 0; index < 2; index++) {
    subject = "user-" + index;
    assert.equal((await g.execute(transport(), { operation: "list" })).status, 200);
  }
  subject = "user-3";
  assert.equal((await g.execute(transport(), { operation: "list" })).error, "rate_limited");
  now += 61_000;
  assert.equal((await g.execute(transport(), { operation: "list" })).status, 200);
  subject = "user-4";
  assert.equal((await g.execute(transport(), { operation: "list" })).error, "quota_exceeded");
});

test("E12: request size, cyclic data, unexpected attributes and poison keys are rejected", async () => {
  const g = gateway({ authenticate: async () => principal("t", ["contracts:validate"]) ,
    limits: { maxRequestBytes: 100 } });
  assert.equal((await g.execute(transport(), {
    operation: "validate", input: { text: "é".repeat(100) },
  })).status, 413);
  const cyclic = {}; cyclic.self = cyclic;
  assert.equal((await g.execute(transport(), { operation: "validate", input: cyclic })).error, "invalid_request");
  assert.equal((await g.execute(transport(), {
    operation: "validate", input: JSON.parse('{"__proto__":{"admin":true}}'),
  })).status, 400);
  assert.equal((await g.execute(transport(), { operation: "invalid", input: 1 })).status, 400);
});

test("E12: per-principal concurrency is reserved atomically and released after success", async () => {
  let proceed, started;
  const ready = new Promise(resolve => { started = resolve; });
  const held = new Promise(resolve => { proceed = resolve; });
  const g = gateway({
    stableSdk: fakeSdk("stable", { list: () => { started(); return held; } }),
    limits: { concurrentPerPrincipal: 1, concurrentGlobal: 1 },
  });
  const first = g.execute(transport(), { operation: "list" });
  await ready;
  assert.equal((await g.execute(transport(), { operation: "list" })).error, "busy");
  proceed(["released"]);
  assert.deepEqual((await first).value, ["released"]);
  assert.equal((await g.execute(transport(), { operation: "inspect", input: "Card" })).status, 200);
});

test("E12: errors are sanitized and in-flight slots are freed on failure", async () => {
  const g = gateway({ stableSdk: fakeSdk("stable", {
    list: () => { throw Error("private credential leaked"); },
  }), limits: { concurrentPerPrincipal: 1, concurrentGlobal: 1 } });
  assert.deepEqual(await g.execute(transport(), { operation: "list" }), {
    ok: false, status: 503, error: "unavailable",
  });
  assert.equal((await g.execute(transport(), { operation: "inspect", input: "Card" })).status, 200);
});

test("E12: tracked peer cardinality is bounded until old entries expire", async () => {
  let now = 0;
  const g = gateway({ clock: () => now, limits: { maxTrackedPeers: 1 } });
  assert.equal((await g.execute(transport("peer-a"), { operation: "list" })).status, 200);
  assert.equal((await g.execute(transport("peer-b"), { operation: "list" })).status, 429);
  now += 120_000;
  assert.equal((await g.execute(transport("peer-b"), { operation: "list" })).status, 200);
});

test("E12: slow concurrent authentication is bounded separately from SDK work", async () => {
  let release, started;
  const ready = new Promise(resolve => { started = resolve; });
  const unresolved = new Promise(resolve => { release = resolve; });
  const g = gateway({
    authenticate: () => { started(); return unresolved; },
    limits: { concurrentAuthentication: 1 },
  });
  const first = g.execute(transport(), { operation: "list" });
  await ready;
  assert.equal((await g.execute(transport(), { operation: "list" })).error, "busy");
  release(principal());
  assert.equal((await first).status, 200);
});
