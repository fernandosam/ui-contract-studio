/**
 * E12: opt-in Node host boundary for the local contract SDK.
 * Authentication is delegated to a trusted host; this module does not listen
 * on a socket, parse HTTP headers, issue credentials or elevate Pi permissions.
 */
import { createHmac, randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";

const MINUTE = 60_000;
const DAY = 86_400_000;
const SCOPES = Object.freeze({
  list: "contracts:read",
  inspect: "contracts:read",
  validate: "contracts:validate",
  generate: "contracts:generate",
});
const DEFAULT_LIMITS = Object.freeze({
  authAttemptsPerMinute: 60,
  globalAuthAttemptsPerMinute: 5_000,
  requestsPerMinute: 120,
  requestsPerDay: 2_000,
  requestsPerTenantMinute: 600,
  requestsPerTenantDay: 10_000,
  concurrentPerPrincipal: 4,
  concurrentGlobal: 32,
  concurrentPerTenant: 16,
  concurrentAuthentication: 32,
  maxRequestBytes: 256_000,
  maxInputNodes: 6_000,
  maxInputDepth: 40,
  maxTrackedPeers: 2_000,
  maxTrackedPrincipals: 10_000,
  maxTrackedTenants: 2_000,
});
const MAX_LIMITS = Object.freeze({
  authAttemptsPerMinute: 10_000,
  globalAuthAttemptsPerMinute: 100_000,
  requestsPerMinute: 10_000,
  requestsPerDay: 1_000_000,
  requestsPerTenantMinute: 100_000,
  requestsPerTenantDay: 1_000_000,
  concurrentPerPrincipal: 1_000,
  concurrentGlobal: 10_000,
  concurrentPerTenant: 10_000,
  concurrentAuthentication: 10_000,
  maxRequestBytes: 512_000,
  maxInputNodes: 8_000,
  maxInputDepth: 50,
  maxTrackedPeers: 100_000,
  maxTrackedPrincipals: 100_000,
  maxTrackedTenants: 100_000,
});
const DENY = (status, error, retryAfterSeconds) => Object.freeze({
  ok: false, status, error,
  ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
});

function policyFor(overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new TypeError("Invalid usage policy");
  }
  for (const key of Object.keys(overrides)) {
    if (!Object.hasOwn(DEFAULT_LIMITS, key)) throw new TypeError("Unknown usage policy");
  }
  const limits = { ...DEFAULT_LIMITS, ...overrides };
  for (const [key, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1 || value > MAX_LIMITS[key]) {
      throw new TypeError("Invalid usage policy limit");
    }
  }
  if (limits.concurrentPerPrincipal > limits.concurrentGlobal) {
    throw new TypeError("Per-principal concurrency exceeds global capacity");
  }
  return Object.freeze(limits);
}
function validIdentifier(value, max = 160) {
  return typeof value === "string" && value.length >= 1 &&
    value.length <= max && !/[\x00-\x1f\x7f]/.test(value) && value.trim() === value;
}
function validCredential(token) {
  return typeof token === "string" && token.length >= 16 && token.length <= 2048 &&
    /^[\x21-\x7e]+$/.test(token);
}
function validIdentity(identity) {
  return identity && typeof identity === "object" &&
    validIdentifier(identity.subject, 128) && validIdentifier(identity.tenantId, 128) &&
    identity.scopes instanceof Set &&
    [...identity.scopes].every(scope => typeof scope === "string" && scope.length <= 80);
}
function boundedJson(value, limits) {
  try {
    const todo = [{ value, depth: 0 }], seen = new Set();
    let items = 0, lowerBound = 0;
    while (todo.length) {
      const entry = todo.pop();
      if (++items > limits.maxInputNodes || entry.depth > limits.maxInputDepth) return "payload_too_large";
      const current = entry.value;
      if (typeof current === "string") {
        lowerBound += Buffer.byteLength(current, "utf8");
      } else if (current === null || typeof current === "boolean") {
        lowerBound += 5;
      } else if (typeof current === "number" && Number.isFinite(current)) {
        lowerBound += 24;
      } else if (typeof current === "object" && current !== null) {
        if (seen.has(current)) return "invalid_request";
        seen.add(current);
        const proto = Object.getPrototypeOf(current);
        if (!Array.isArray(current) && proto !== null && proto !== Object.prototype) return "invalid_request";
        if (Object.getOwnPropertySymbols(current).length) return "invalid_request";
        for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(current))) {
          if (!("value" in desc) || key === "__proto__" || key === "constructor" || key === "prototype") {
            return "invalid_request";
          }
          if (Array.isArray(current) && key === "length") continue;
          lowerBound += Buffer.byteLength(key, "utf8") + 4;
          todo.push({ value: desc.value, depth: entry.depth + 1 });
        }
      } else {
        return "invalid_request";
      }
      if (lowerBound > limits.maxRequestBytes) return "payload_too_large";
    }
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" &&
      Buffer.byteLength(serialized, "utf8") <= limits.maxRequestBytes ? null : "payload_too_large";
  } catch {
    return "invalid_request";
  }
}
function normalizedCommand(command, limits) {
  const jsonProblem = boundedJson(command, limits);
  if (jsonProblem) return { error: jsonProblem };
  if (!command || typeof command !== "object" || Array.isArray(command)) return { error: "invalid_request" };
  if (Object.keys(command).some(key => !["operation", "channel", "input"].includes(key))) {
    return { error: "invalid_request" };
  }
  const operation = command.operation;
  const channel = command.channel ?? "stable";
  if (!Object.hasOwn(SCOPES, operation) || !["stable", "experimental"].includes(channel)) {
    return { error: "invalid_request" };
  }
  if (operation === "list" && Object.hasOwn(command, "input")) return { error: "invalid_request" };
  if (operation === "inspect" && (!validIdentifier(command.input, 128) ||
      !/^[A-Za-z][A-Za-z0-9_-]*$/.test(command.input))) return { error: "invalid_request" };
  if (["validate", "generate"].includes(operation) && !Object.hasOwn(command, "input")) {
    return { error: "invalid_request" };
  }
  return { operation, channel, input: command.input };
}
function windowCount(window, now, span) {
  const slot = Math.floor(now / span);
  if (window.slot !== slot) {
    window.slot = slot;
    window.count = 0;
  }
  return window.count;
}
function expirySeconds(now, span) {
  return Math.max(1, Math.ceil((span - now % span) / 1_000));
}

/**
 * A single-process limiter: deterministic, bounded state and no secret logging.
 * For multiple replicas the host MUST enforce distributed quotas upstream.
 */
export function createProtectedContractGateway({
  stableSdk, experimentalSdk, authenticate, limits: overrides = {},
  clock = Date.now,
}) {
  if (!stableSdk || stableSdk.channel !== "stable" ||
      ["list", "inspect", "validate", "generate"].some(op => typeof stableSdk[op] !== "function") ||
      (experimentalSdk && (experimentalSdk.channel !== "experimental" ||
        ["list", "inspect", "validate", "generate"].some(op => typeof experimentalSdk[op] !== "function"))) ||
      typeof authenticate !== "function" || typeof clock !== "function") {
    throw new TypeError("A trusted authenticator and matching local SDK are required");
  }
  const limits = policyFor(overrides);
  const secret = randomBytes(32);
  const hash = value => createHmac("sha256", secret).update(value).digest("hex");
  const peers = new Map();
  const principals = new Map();
  const tenants = new Map();
  const globalAttempts = { slot: -1, count: 0 };
  let globalActive = 0, authenticationActive = 0, lastNow = 0;

  function nowValue() {
    const sampled = clock();
    if (!Number.isSafeInteger(sampled) || sampled < 0) throw new TypeError("Invalid clock");
    lastNow = Math.max(lastNow, sampled);
    return lastNow;
  }
  function tracked(map, key, capacity, now, staleAfter) {
    let entry = map.get(key);
    if (entry) { entry.lastSeen = now; return entry; }
    if (map.size >= capacity) {
      for (const [oldKey, old] of map) {
        if (old.active === 0 && now - old.lastSeen >= staleAfter) map.delete(oldKey);
      }
    }
    if (map.size >= capacity) return null;
    entry = {
      minute: { slot: -1, count: 0 },
      day: { slot: -1, count: 0 },
      active: 0, lastSeen: now,
    };
    map.set(key, entry);
    return entry;
  }

  async function execute(transport, command) {
    try {
      const now = nowValue();
      if (!transport || !validIdentifier(transport.peerId, 200) ||
          !validCredential(transport.bearerToken)) return DENY(401, "unauthorized");
      const peerKey = hash(transport.peerId);
      const globalCount = windowCount(globalAttempts, now, MINUTE);
      if (globalCount >= limits.globalAuthAttemptsPerMinute) {
        return DENY(429, "rate_limited", expirySeconds(now, MINUTE));
      }
      globalAttempts.count++;
      const peer = tracked(peers, peerKey, limits.maxTrackedPeers, now, MINUTE * 2);
      if (!peer) return DENY(429, "rate_limited", expirySeconds(now, MINUTE));
      if (windowCount(peer.minute, now, MINUTE) >= limits.authAttemptsPerMinute) {
        return DENY(429, "rate_limited", expirySeconds(now, MINUTE));
      }
      peer.minute.count++;

      if (authenticationActive >= limits.concurrentAuthentication) return DENY(429, "busy", 1);
      let identity;
      authenticationActive++;
      try {
        identity = await authenticate(transport.bearerToken);
      } catch {
        return DENY(401, "unauthorized");
      } finally {
        authenticationActive--;
      }
      if (!validIdentity(identity)) return DENY(401, "unauthorized");
      const normalized = normalizedCommand(command, limits);
      if (normalized.error) {
        return DENY(normalized.error === "payload_too_large" ? 413 : 400, normalized.error);
      }
      if (!identity.scopes.has(SCOPES[normalized.operation]) ||
          (normalized.channel === "experimental" &&
            (!experimentalSdk || !identity.scopes.has("contracts:experimental")))) {
        return DENY(403, "forbidden");
      }
      const sdk = normalized.channel === "experimental" ? experimentalSdk : stableSdk;
      const principalKey = hash(JSON.stringify([identity.tenantId, identity.subject]));
      const principal = tracked(principals, principalKey, limits.maxTrackedPrincipals, now, DAY * 2);
      if (!principal) return DENY(429, "quota_exceeded", expirySeconds(now, DAY));
      const tenant = tracked(tenants, hash(identity.tenantId), limits.maxTrackedTenants, now, DAY * 2);
      if (!tenant) return DENY(429, "quota_exceeded", expirySeconds(now, DAY));
      const perMinute = windowCount(principal.minute, now, MINUTE);
      const perDay = windowCount(principal.day, now, DAY);
      const tenantMinute = windowCount(tenant.minute, now, MINUTE);
      const tenantDay = windowCount(tenant.day, now, DAY);
      if (tenantMinute >= limits.requestsPerTenantMinute) {
        return DENY(429, "rate_limited", expirySeconds(now, MINUTE));
      }
      if (tenantDay >= limits.requestsPerTenantDay) {
        return DENY(429, "quota_exceeded", expirySeconds(now, DAY));
      }
      if (perMinute >= limits.requestsPerMinute) {
        return DENY(429, "rate_limited", expirySeconds(now, MINUTE));
      }
      if (perDay >= limits.requestsPerDay) {
        return DENY(429, "quota_exceeded", expirySeconds(now, DAY));
      }
      if (principal.active >= limits.concurrentPerPrincipal ||
          tenant.active >= limits.concurrentPerTenant || globalActive >= limits.concurrentGlobal) {
        return DENY(429, "busy", 1);
      }
      principal.minute.count++;
      principal.day.count++;
      tenant.minute.count++;
      tenant.day.count++;
      principal.active++;
      tenant.active++;
      globalActive++;
      try {
        const result = await Promise.resolve().then(() => {
          if (normalized.operation === "list") return sdk.list();
          if (normalized.operation === "inspect") return sdk.inspect(normalized.input);
          if (normalized.operation === "validate") return sdk.validate(normalized.input);
          return sdk.generate(normalized.input);
        });
        return { ok: true, status: 200, value: result };
      } catch {
        return DENY(503, "unavailable");
      } finally {
        principal.active--;
        tenant.active--;
        globalActive--;
      }
    } catch {
      return DENY(503, "unavailable");
    }
  }
  return Object.freeze({ execute, limits });
}
