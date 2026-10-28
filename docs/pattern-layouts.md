[English](pattern-layouts.md) | [Português](pattern-layouts.pt-BR.md)

# Semantic layout contracts: login, search and dashboard

This change extends the [registration layout](registration-layout.md) strategy to the existing pattern wizard, **without another admission mechanism**.

The versioned guidance is `src/ui-requirements/pattern-layouts.json`. `planPatternLayout` derives a deterministic, bounded layout plan from explicit pattern answers. The existing `generatePatternPreview` renders **admitted Pi nodes only**, and the independent `tracePattern` rejects schema-valid deviations from semantic hierarchy, reading order and density.

## Screen rules

- **Login:** centered `Card` with `maxWidth: md`, identifier before password, optional remember option immediately after credentials, optional help before the demonstration-only action, then the no-authentication notice. Never infer a session or backend login.
- **Search:** heading, optional date filters inside an admitted `Stack`, then the existing `DataTable`. Search/pagination/selection remain internal to the approved table; no remote query is invented.
- **Dashboard KPI:** `Heading` before the explicitly selected 2/4-card `Grid`, with the optional data note **after** the grid rather than inside the first metric.
- **Dashboard graphs:** `Card`, local two-chart `Grid`, then optional data note; no external feeds.

**Responsiveness:** existing `src/index.css` already collapses approved grids to at most two columns on medium screens and one on phones, while preserving the Pi reading order. No new breakpoint props or Zod variants are introduced.

## Traceability and limits

`PatternWizard` displays the ordered sections before rendering. `tracePattern` independently checks the output, and `assessChangeImpact` recognizes changes to the policy/helper as affecting precisely login, search and dashboard. Listings are not modified.

`tests/pattern-semantic-layout.integration.test.ts` covers variants, density, optional groups, schema-valid semantic drift and no remote actions.

```sh
npm run semantic:check
npm run semantic:report
npm run test:offline
npx tsx --test tests/pattern-semantic-layout.integration.test.ts tests/requirements-traceability.integration.test.ts tests/requirements-impact.integration.test.ts
npm run build
```

**Boundary:** passing static checks is not a browser, accessibility or runtime certification. Full E2E remains deferred as agreed; native auto-merge's required checks are unchanged.
