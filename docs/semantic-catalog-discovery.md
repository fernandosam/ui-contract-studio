[English](semantic-catalog-discovery.md) | [Português](semantic-catalog-discovery.pt-BR.md)

# Semantic component discovery

The **Primitivas** and **Compostos** views share one read-only discovery implementation. Search accepts component names, contract descriptions, curated purposes, and positive **whenUse** guidance. Diacritics are normalized; each search term must match a supported field. Deterministic relevance prefers names over descriptions over semantic use cases. **whenNotUse**, suggestions, missing capabilities and unimplemented claims are never considered positive search evidence.

Components are grouped by a predictable name-based functional heuristic, not by new authorization data. Filters for functional group, reviewed maturity and Pi availability can be combined. Query state is reflected in `catalogSearch`, `catalogGroup`, `catalogStability`, and `catalogPi` URL parameters, preserving the current screen. A clear action resets all filters.

Pi availability is shown only when the reviewed stable lock agrees with the generated Pi manifest on version, fingerprint, maturity and approval. The UI remains advisory: it does not modify contracts, schemas, E2E proofs, permissions or the Admission Engine. Component previews remain validated by Zod.

Validation: run the existing `npm run check`, `npm run test:offline`, integration tests, typecheck, build and existing CI browser review. Targeted additions: `tests/catalog-discovery.integration.test.ts` and `tests/e2e/semantic-catalog-discovery.spec.ts`.
