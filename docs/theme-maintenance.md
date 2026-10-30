[English](theme-maintenance.md) | [Português](theme-maintenance.pt-BR.md)

# E06 — Creating, reviewing and maintaining themes

## Sources of truth and boundaries

- `src/globals.css` provides the effective CSS for `:root, .light-theme` and `.dark-theme`; `src/index.css` has local adapters, not global tokens.
- `src/ui-theme/themes.json` declares IDs, versions, modes and **closed** token choices. `src/ui-theme/theme-policy.mjs` validates permitted choices and resolves only trusted `light-theme`/`dark-theme` classes.
- `src/ui-theme/themes.lock.json` fingerprints the theme manifest. It protects **registry** versioning, not the entire global CSS implementation.
- `tests/fixtures/theme-visual-tokens.json` pins a reviewed subset of CSS values for both modes; `tests/e2e/theme-visual-regression.spec.ts` exercises Primitives, Composites and JSON examples on desktop/mobile and attaches PNG evidence.

**Important:** registered themes currently share the host's two global classes. Adding an ID or manifest version **does not produce a new visual palette** or independent per-preview themes. Additional palettes need explicitly reviewed host/CSS support; never accept arbitrary agent-provided CSS or styles.

## Creating or evolving a version

1. Inventory the requirement and check whether approved tokens and the two modes suffice. Record expected effects on colors, typography, spacing, radii, borders, shadows, density and interaction states.
2. Implement needed behavior **within the trusted host**, preserving `theme-policy.mjs` boundaries. Reject `style`, `className`, `css` and arbitrary values; never expand Zod, Pi or Admission Engine permissions as a consequence. A manifest-only version must not be presented as a new appearance.
3. Add a new ID/SemVer entry to `themes.json`, preserving every previous version verbatim. Extend allowed policy values **only after** an implementation review. Do not silently change `defaultTheme`.
4. Compute the fingerprint using existing `fingerprintTheme` (below), review it and add the matching entry to `themes.lock.json`. Never overwrite an old version's fingerprint. CI compares previous entries with the PR base SHA.
5. Update `tests/fixtures/theme-visual-tokens.json` **only for intentional CSS changes** with an explanation of effects on old versions. The CSS is shared: a new registry version cannot isolate old CSS. Verify `docs/design-token-inventory.json` using the inventory command.
6. Run gates and inspect screenshots for light/dark, desktop/mobile, hover/focus/disabled, responsiveness, overlays and long text as applicable. Record findings and limits in the PR.
7. Merge only after independent visual review and applicable checks. PNG files, fingerprints and passing tests do not grant pixel-fidelity approval or Pi certification.

Read fingerprints **without rewriting the registry/lock**:

~~~bash
node --input-type=module -e 'import {readFileSync} from "node:fs"; import {fingerprintTheme} from "./scripts/lib/theme-lock.mjs"; const themes=JSON.parse(readFileSync("src/ui-theme/themes.json","utf8")).themes; console.log(themes.map(t=>({id:t.id,version:t.version,fingerprint:fingerprintTheme(t)})))'
~~~

## Automated regression and evidence

~~~bash
npm run themes:check
npm run themes:a11y
node --test tests/theme-visual-regression.test.mjs
npm run test:offline
npx playwright test tests/e2e/theme-visual-regression.spec.ts --project=desktop --project=mobile
npm run docs:check
npm run semantic:check
npm run semantic:report
~~~

The existing focused browser job in `quality.yml` runs Primitives (`Button`), Composites (`Dashboard01`), and JSON examples at 390px on mobile and 1280px on desktop. Tests verify approved computed CSS tokens, a visibly different light/dark preview, and **pixel-for-pixel restoration of the preview region** after light → dark → light. They attach both modes as PNGs; existing artifacts retain `test-results/` for 14 days.

This comparison **does not ship persistent cross-commit golden screenshots**: it detects round-trip state leaks, while pinned token values and `themes:a11y` catch token and contrast drift. It cannot catch all cross-commit pixel changes or replace human approval. For an intentional theme change, review evidence and update the pinned fixture/inventory with a documented rationale; never auto-approve diffs or regenerate snapshots blindly.

Full E2E remains manual on `main`. These tests do not modify JSON screens, admitted contracts, Pi permissions, Admission Engine decisions or publication gates.
