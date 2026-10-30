/**
 * Ephemeral cache for PUBLIC, reviewed, contract-derived metadata only.
 *
 * Never cache prompts, user queries, generated JSON, tokens, private/tenant data,
 * authorizations or execution results. A hit is not evidence of Pi admission.
 */
const fingerprintPattern = /^[a-f0-9]{64}$/;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const maxKeyLength = 128 * 1024;
const maxValueLength = 512 * 1024;

function describe(request) {
  if (request?.scope !== 'public-contract-derived' ||
      typeof request.namespace !== 'string' || !/^[a-z][a-z0-9:-]{0,79}$/.test(request.namespace) ||
      typeof request.key !== 'string' || request.key.length > maxKeyLength ||
      !Array.isArray(request.contracts) || request.contracts.length === 0 ||
      request.contracts.length > 512) return null;

  const dependencies = new Map();
  for (const contract of request.contracts) {
    if (!contract || typeof contract.name !== 'string' ||
        !/^[A-Za-z][A-Za-z0-9-]*$/.test(contract.name) ||
        typeof contract.version !== 'string' || !versionPattern.test(contract.version) ||
        typeof contract.fingerprint !== 'string' || !fingerprintPattern.test(contract.fingerprint) ||
        dependencies.has(contract.name)) return null;
    dependencies.set(contract.name, contract.version + ':' + contract.fingerprint);
  }
  const sorted = [...dependencies].sort(([a], [b]) => a.localeCompare(b, 'en'));
  return {id: JSON.stringify([request.namespace, request.key, sorted]), dependencies};
}

export function createContractVersionedCache({
  maxEntries = 32, ttlMs = 5 * 60 * 1000, now = Date.now,
} = {}) {
  if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 1024 ||
      !Number.isInteger(ttlMs) || ttlMs < 1 || ttlMs > 24 * 60 * 60 * 1000 ||
      typeof now !== 'function') throw new TypeError('Invalid contract cache limits');
  const entries = new Map();

  function prune(dependencies, time) {
    for (const [id, entry] of entries) {
      if (entry.expiresAt <= time ||
          [...dependencies].some(([name, identity]) =>
            entry.dependencies.has(name) && entry.dependencies.get(name) !== identity))
        entries.delete(id);
    }
  }

  return {
    get(request) {
      const descriptor = describe(request);
      if (!descriptor) return undefined; // Never use unverified metadata as a key.
      const time = now();
      prune(descriptor.dependencies, time);
      const entry = entries.get(descriptor.id);
      if (!entry) return undefined;
      entries.delete(descriptor.id);
      entries.set(descriptor.id, entry); // LRU touch
      return globalThis.structuredClone(entry.value); // Callers cannot poison stored objects.
    },
    set(request, value) {
      const descriptor = describe(request);
      if (!descriptor || value === undefined) return false;
      let copy;
      try {
        // Bounded JSON-serializable metadata only; no streams, functions or huge blobs.
        const json = JSON.stringify(value);
        if (typeof json !== 'string' || json.length > maxValueLength) return false;
        copy = globalThis.structuredClone(value);
      } catch { return false; } // Functions/non-cloneable data are not cached.
      const time = now();
      prune(descriptor.dependencies, time);
      entries.delete(descriptor.id);
      entries.set(descriptor.id, {
        value: copy, dependencies: descriptor.dependencies, expiresAt: time + ttlMs,
      });
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value);
      return true;
    },
    clear() { entries.clear(); },
    size() { return entries.size; },
  };
}
