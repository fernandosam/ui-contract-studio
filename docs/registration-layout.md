[English](registration-layout.md) | [Português](registration-layout.pt-BR.md)

# Semantic layout contract: registration

The registration wizard now uses `src/ui-requirements/registration-layout.json` as **reviewed guidance for composition**, not a newly admitted Pi type, Zod prop or runtime permission. The bounded helper `registration-layout.ts` maps the existing `RequirementSpec` fields to a deterministic layout plan.

## Contract and decision rules

- **Purpose:** improve the hierarchy and legibility of local-only registration previews without inventing forms, APIs or backend behavior.
- **Container:** existing `Card`, centered, `maxWidth: md`, title and description before controls.
- **Groups in semantic order:** identification (name/document/company), contact (email/phone/city), access (password), then extra fields. Empty groups are removed. Every input is kept exactly once with its original name, type, label, validation and required state.
- **Responsive policy:** mobile remains one reading column; on wider viewports, `two-columns` produces an existing `Grid` with two columns only for groups containing at least two fields. `single` uses the existing `Stack`. No new layout API is exposed to Pi.
- **Hierarchy:** group titles use admitted `Heading` (h3); groups are nested in `Stack`; a local confirmation `AlertDialog` or a demo-only note comes after all fields. No inferred primary submit action or remote side effect is inserted.
- **Boundaries:** backend persistence, business rules, arbitrary callbacks, URLs, JSX and changes to authorized Zod/Pi contracts remain blocked. The interactive `DeclarativeFormFlow` keeps its *existing* stable, local-only schema; the policy does not silently add grouping props to that type.
- **Evidence:** static generation and independent `traceRegistration`/ `verifyInterface` checks; browser responsiveness and accessibility require later E2E. The layout guidance never attests runtime correctness.

## How to review

`RequirementsWizard` displays the group plan and the generated approved Pi preview. `assessChangeImpact` now maps edits to the layout policy/helper to the registration flow, instead of leaving them unmapped. A reviewer can use:

```sh
npm run semantic:check
npm run semantic:report
npm run test:offline
npx tsx --test tests/registration-layout.integration.test.ts tests/ui-requirements.integration.test.ts tests/requirements-traceability.integration.test.ts
npm run build
```

The existing CI runs all integration tests and production checks. **Full browser E2E is postponed** to the later E2E expansion and is not a new requirement for native PR auto-merge. Rules stay conservative until supported by independent runtime evidence.
