[English](README.md) | [Português](README.pt-BR.md)

# Documentation — UI Contract Studio

This page separates **current guides** from **historical audit records**. For current behavior, consult the manifests and source code listed under [architecture](architecture.md) first.

## Current guides

| Guide | Purpose |
| --- | --- |
| [README](../README.md) | Introduction and installation |
| [Architecture](architecture.md) | Sources of truth and layers |
| [Components and contracts](components.md) | shadcn/ui, ReUI, compositions, and admission |
| [Admission Engine](admission-engine.md) | Experimental publication and post-E2E distribution |
| [Composition strategy](composition-strategy.md) | Dependency map, semantic classification and new ReUI examples |
| [Component semantic checklist](semantic-knowledge-checklist.md) | Per-component knowledge review, code evidence, gaps, and validation |
| [Semantic enrichment priority (T25)](semantic-enrichment-priority-t25.md) | Deterministic, advisory-only scores and evidence for AI composition review |
| [Semantic enrichment workflow (T30)](semantic-enrichment-workflow.md) | Repeatable shadcn/ReUI process with priority, code evidence, CI and E2E |
| [Semantic contract conformance audit (T31)](semantic-contract-conformance-t31.md) | Zod/Pi bindings, gap decisions and mandatory audit for knowledge edits |
| [Agents and Pi](agents.md) | Safe generation and spec validation |
| [Development](development.md) | Environment, tests, CI, and E2E |
| [Governance](governance.md) | Review and ongoing audits of the public repository |

## Specialized references

- [T19 semantic coverage audit of the 31 ReUI families](semantic-knowledge-coverage-t19.md) — 31/559/39 matrix and T01 checklist
- [T17 semantic review (Alert, Card, Textarea, Progress)](semantic-knowledge-t17.md)

- [T14 integrated semantic validation (forms and candidates)](semantic-knowledge-integration-t14.md)
- [T08 prior semantic integration](semantic-knowledge-integration-t08.md)
- [Data sources and DataTable](integracao-dados.md)
- [ReUI library](reui-composite-library.md)
- [Functional coverage of 31 ReUI families](reui-functional-coverage-31.md) — implementations, limits, and pending certification
- [Visual fidelity of compositions](revisao-visual-shadcn.md)
- [Official example audit](official-component-visual-audit.md)
- [Connected sandbox](../sandbox/README.md)
- [Security](../SECURITY.md) and [third-party notices](../THIRD_PARTY_NOTICES.md)

## History and audits

The [historical index](history/README.md) groups decisions and findings from previous versions. Counts and instructions recorded in older audits **do not automatically apply to the current version**.

Also see the [changelog](../CHANGELOG.md) and [contributing guide](../CONTRIBUTING.md).
