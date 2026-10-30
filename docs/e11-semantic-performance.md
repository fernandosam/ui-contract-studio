[English](e11-semantic-performance.md) | [Português](e11-semantic-performance.pt-BR.md)

# E11 — Semantic search and catalog loading

## Scope

The catalog search index is **advisory**, not an admission mechanism. Its only inputs are the existing reviewed component metadata and ReUI guidance. Excluded/unsupported capabilities cannot become approved Pi capabilities through indexing.

- **Contract discovery:** `buildDiscoveryIndex` normalizes name, description and positive purposes/when-use once per catalog revision. `discoverIndexedContracts` reuses that index for queries and filters with the same deterministic ordering; `semanticScore` and `discoverContracts` remain callable.
- **ReUI gallery:** `buildReuiExampleIndex` normalizes 559 examples across 31 families once. `filterIndexedReuiExamples` preserves title/ID/family/bestFor/whenNotUse search and original order. The composite library likewise precomputes its searchable fields once.
- **Catalog previews:** approved and experimental examples are resolved against build-time Vite glob allowlists using the existing Pi manifest. Only the selected JSON is imported; the first result is cached in memory for subsequent selections. Pattern JSONs are loaded on selection; app screen JSONs reuse the existing screen registry.
- **Failure and race safety:** inactive requests cannot update component state, and missing/unavailable examples produce explicit UI feedback. Dynamic paths are keys in a build-time allowlist, never arbitrary user-controlled imports.

The large Pi manifest, semantic guidance metadata and the application screen registry are still loaded as before. This change is not an overall lazy-loading rewrite of the renderer.

## Validation and measurement

Run `npm run test`, `npm run typecheck`, `npm run semantic:check` and `npm run semantic:report`. Index equivalence is tested against all 559 examples, accent-insensitive queries, multiple fields, and stability/Pi filters. Use `npm run perf:catalog` for reproducible illustrative cold-index versus reused-index timings; there is no brittle timing threshold in CI. Measure network bytes and route load separately in a production build before making quantitative bundle or latency claims.

No Zod schemas, contract fingerprints, admission status, generated Pi APIs or execution permissions are changed.
