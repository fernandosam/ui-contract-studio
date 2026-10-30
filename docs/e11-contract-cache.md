[English](e11-contract-cache.md) | [Português](e11-contract-cache.pt-BR.md)

# E11 — Secure caching of public contract metadata

## Scope and source of truth

The **Primitives/Composites** explorer caches only its normalized, **advisory discovery index**. Every identity comes from `src/ui-catalog/contracts.lock.json` (`version` and `semanticFingerprint`), passed through `catalog-explorer.tsx` to `catalog-discovery.ts`. The cache is process/tab-local memory: **no localStorage, IndexedDB, disk or backend**.

The key includes its namespace, a snapshot of relevant public fields (name, description, purpose, `whenUse`, maturity and Pi availability), and the **exact identities of all indexed contracts**. A version-only change, fingerprint-only change or public guidance edit produces a new key. Missing or malformed metadata bypass caching. Conflicting entries are evicted immediately when a new dependency identity is observed. Entries expire after five minutes, with at most eight LRU index snapshots.

## Security policy

- Explicit `public-contract-derived` classification only: reviewed, public metadata indexes. **Never** cache user search strings, prompts, model outputs, generated specs, credentials, secrets, personal/multi-tenant data, authorizations, or execution results.
- Search terms and filters are evaluated afresh on every query. Neither queries nor result sets are cached. The index stores only normalized public text and functional groups.
- `contract-cache.mjs` limits entry count, TTL, key size, identity names and version/fingerprint formats. It defensively copies values when writing and reading. Unverified inputs are computed without caching.
- **A cache hit is not an admission decision**: Pi availability remains governed by the reviewed lock and published manifest match, maturity, approval and authoritative Zod schemas. Admission Engine and permissions remain unchanged.

## Verification

```sh
node --test tests/contract-cache.test.mjs
npx tsx --test tests/catalog-discovery.integration.test.ts
npm run semantic:check
npm run semantic:report
```

Tests cover version/fingerprint invalidation, public guidance changes, isolation, capacity/expiry and search equivalence. Performance benefit must be measured using the separate E11 baseline runner; **no latency improvement is assumed**. This cache does not cover ReUI galleries, Pi, model responses or remote data.
