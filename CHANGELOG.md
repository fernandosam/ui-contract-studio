[English](CHANGELOG.md) | [Português](CHANGELOG.pt-BR.md)

# Changelog — UI Contract Studio

## ReUI Family Functional Expansion (PR #5) — Pending Review

- Reassessed 31 families / 559 versioned examples within the limits of Zod contracts and React compositions.
- Added capabilities to 22 distinct base primitives (14 in the first phase and 8 in the second, including further improvements to Avatar and Alert).
- Updated manifests, fingerprints, contract tests, and coverage of representative interactions; the full E2E suite remains manual on main.
- The traceable matrix at docs/reui-functional-coverage-31.md explicitly identifies examples that cannot be certified by static auditing.

## ReUI Shared-Property Evolution Candidates — Review Pending

- The audit of 559 ReUI files grouped in 31 families now includes the frequency of JSX attributes and their mapping to declared properties.
- Evolved the base contracts for `Carousel`, `Avatar`, `Alert`, `DropdownMenu`, and `Pagination` to 2.1.0, with updated previews and Zod validation.
- No automatic admission of external media, transactional actions, unrestricted JSX, or ReUI components. Independent review and functional/visual certification are required.

## Documentation and Consistency — 0.24.0

- Reorganized current guides by purpose: architecture, components, agents, development, and governance; identified older audits as historical.
- Consolidated README, AGENTS.md, the UI Catalog skill, and CONTRIBUTING.md, removing redundant rules and references to superseded plans.
- Described public status, independent inventories (Pi, shadcn/ui, and ReUI), and manual E2E execution according to current manifests and workflows.
- Added `npm run docs:check` to validate relative links and consistency across contracts, plans, and sources; integrated it with offline tests and CI.

## Navigation and Catalog Adjustments — 0.24.0

- Removed Gallery 1 and Gallery 2, along with their 54 exclusive contracts and composition examples/fixtures.
- Renamed Gallery 3 to **ReUI** and made it the home page.
- Removed the Dashboard page while preserving `Dashboard01` and other composite components in the block.
- Updated registries, agent guidance, checks, and active manifests (102 contracts).

## Initial Independent Snapshot — 0.24.0

- Baseline of the declarative React / json-render / shadcn-ui component studio.
- Component schemas, approved UI contracts, agent fixtures, and automated checks.
- This repository begins with an independent Git history. Third-party authorship and licensing remain attributed in THIRD_PARTY_NOTICES.md.
