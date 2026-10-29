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
