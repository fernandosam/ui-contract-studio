[English](versioned-themes.md) | [Português](versioned-themes.pt-BR.md)

# E06 — Versioned, closed theme contract

The trusted host owns theme selection. The versioned registry lives in `src/ui-theme/themes.json`, the immutable-version lock in `src/ui-theme/themes.lock.json`, and the dependency-free validator in `src/ui-theme/theme-policy.mjs`.

A selection has **exactly** `{id, version, mode}`. The approved initial selection is `studio@1.0.0` in `dark` mode (with `light` also supported). Its palette, typography, spacing, border, radius, shadow and density choices are **closed identifiers**, not CSS property values. The currently approved combinations reflect `src/globals.css`; they do not create new design tokens or visual variants.

- Color: `studio-neutral`; typography: `inter-jetbrains-playfair`; spacing: `tailwind-v4-default`; border: `semantic`; radius: `base-8px`; shadow: `studio`; density: `comfortable`.
- Modes resolve only to the host-owned `light-theme` / `dark-theme` classes already defined in the stylesheet. No inline styles, custom CSS, dynamic Tailwind class construction, `className`, `style`, arbitrary `var()` or new color strings are accepted.
- Unknown IDs, versions, fields, token values and modes fail closed. Even a syntactically valid but unregistered version cannot be used.
- Additions must be explicitly reviewed: add a **new version** while retaining old entries, add any new choice to the validator only when backed by reviewed implementation, update the lock, and run the tests. The lock detects local drift; the pull-request base check additionally rejects edits/deletions of registered versions. The lock alone does not confer review or admission.
- Theme selection remains host-controlled and **is not an additional field in generated screen JSON**, nor an expanded Zod/Pi contract. Theme definition does not approve new APIs, Pi permissions or Admission Engine candidates.

Run `npm run themes:check`, `npm run test:offline`, `npm run semantic:check`, and `npm run semantic:report`. In the quality workflow, `THEME_BASE_REF` points to the PR base commit for immutability checks. Existing CSS token implementation remains authoritative; changing actual values in CSS must undergo an independent design review (the theme lock guards registry data, not the stylesheet). Full browser/visual E2E remains a later manual gate.


## E06 — Preview selection integration

The host now presents the **same closed, versioned theme selector** in the Primitives editor, approved Composites editor, React ReUI composite preview, ReUI example gallery, JSON example/tree editor, standalone JSON screens, and pattern/requirements generators. The structured-tree before/after comparison shares the same selection. Options are enumerated from the validated registry; there is no editable CSS box and no unregistered value can be selected.

**Theme selection is application-wide, not an independent theme per embedded preview.** This avoids inconsistent nested light/dark Tailwind variants and ensures every preview, overlay and host control uses one consistent mode. Changing the selector updates the HTML root with only the approved `light-theme` or `dark-theme` class; the existing toolbar light/dark button stays synchronized. A versioned selection is stored under `ui-contract-studio-preview-theme`, while `ui-contract-studio-theme` remains the compatibility mode key used by the pre-render bootstrap. Stored selections are untrusted and resolved against the registry each time; invalid or deleted versions fall back to a validated default.

This is **host presentation state only**. It never enters a generated JSON spec, copied JSON, primitive/component props, Pi APIs, remote action payloads, or Admission Engine approval. No CSS classes, tokens or styles are read from the spec to set the theme. Adding a future version requires explicit registry/lock review and corresponding host CSS support, not a screen attribute.

Regression coverage: `node --test tests/preview-theme-selection.test.mjs` for rejected selector values, forged persistence and all preview integration entrypoints; `npx playwright test tests/e2e/preview-themes.spec.ts --project=desktop --project=mobile` for synchronization across catalogues/screens, persistence and fallback. Use `npm run themes:check`, `npm run semantic:check`, `npm run semantic:report` and the normal project checks. Full visual/browser validation is a separate gate and should not be inferred from static tests.

## E06 — Contrast, interactive states and responsive parity

Run \`npm run themes:a11y\` to audit the **actual stylesheet**. It converts approved literal OKLCH values to linear sRGB and checks 12 semantic text combinations at **WCAG AA ≥ 4.5:1** plus two focus-indicator combinations at **≥ 3:1**, in both light and dark modes (28 checks). The gate fails on missing semantic tokens, unsupported values or low contrast. It also validates one/two-column grid cascade at 520, 600, 639, 640 and 800px; this is not a claim about every border, translucent layer or SVG.

Two baseline violations were found and corrected: light \`muted-foreground/muted\` (~4.12:1 before, ~4.66:1 after) and dark \`destructive-foreground/destructive\` (~2.67:1 before, ~6.26:1 after). A source-order override at 521–639px was also corrected: the 850px two-column rule now precedes the 639px single-column rule. These targeted CSS adjustments require visual review even though the \`studio@1.0.0\` registry and lock stay unchanged.

\`node --test tests/theme-accessibility.test.mjs\` exercises regressions and \`npx playwright test tests/e2e/theme-accessibility.spec.ts --project=desktop --project=mobile\` exercises hover, keyboard focus, disabled state, browser-calculated preview contrast, mode parity and 390/600/800/1440px. The existing quality workflow runs both gates. Browser success and full manual visual E2E must be reported from real runs; source checks alone do not certify them.
