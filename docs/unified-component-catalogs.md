[English](unified-component-catalogs.md) | [Português](unified-component-catalogs.pt-BR.md)

# Unified component catalogs

The navigation contains **Primitivas** and **Compostos**, without a separate Pi catalog menu. The legacy `?screen=catalogo-pi` query opens Compostos without changing the internal Admission Engine.

Both catalogs reuse the same component explorer: a searchable list, maturity filter, a clear empty state, and detail tabs for preview/properties, contract metadata, and semantic guidance/testing. Contract details read version, SHA-256 semantic fingerprint, and stability directly from the reviewed lock. Pi availability is a read-only projection checked against the generated Pi manifest; this UI never promotes or authorizes an API.

**Compostos** includes the previously separate experimental admission previews under its **Candidatos experimentais** tab. This retains local-only Zod previews, the channel selector, and existing source-digest/E2E boundaries. The ReUI examples stay in their own tab. No E2E proof or remote execution permission is fabricated.

The existing visual editor continues to validate changes with Zod before previewing, with reversible temporary edits. No new runtime contract type, property, or action is introduced. Keyboard-focus indicators, labels, selection state, and explicit empty states help keyboard and assistive-technology users.

Verify using `npm run test:offline`, `npm run check`, `npm run typecheck`, `npm run build`, and the existing Playwright projects. The invariant test is `tests/unified-catalog-navigation.test.mjs`.
