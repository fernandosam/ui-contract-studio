[English](README.md) | [Português](README.pt-BR.md)

# UI Contract Studio

**Declarative UI components with verifiable contracts for AI agents.**

UI Contract Studio is an independent React project for exploring shadcn/ui (Base UI) components, compositions, and ReUI examples, as well as generating and validating JSON screens with **json-render**, **Zod**, and **Pi Agent**. Its goal is to control which components, properties, events, and actions an agent is allowed to use.

## What's available

- **Primitive explorer:** contracts, properties, previews, and usage guidance.
- **Composite explorer:** reusable compositions and their approved APIs.
- **Example explorer:** inspection and local editing of declarative specs.
- **ReUI:** a gallery of React examples grouped by component family, with filters and agent notes.
- **shadcn/ui blocks:** demonstration pages for Login, Sign-up, and Sidebars.
- **Pi Agent:** manifests, schemas, examples, selected context, and spec validation.

The Pi catalog is **closed (allowlisted)**: ReUI components and shadcn/ui files do not automatically become approved contracts. Agent-generated screens are **JSON**, without arbitrary JSX/HTML, callbacks, external URLs, or actions. Authentication, payments, and remote data shown in demos are not production integrations.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui Base UI · Zod 4 · json-render · Playwright.

## Getting started

Requires Node.js **22+** and npm.

~~~bash
git clone https://github.com/fernandosam/ui-contract-studio.git
cd ui-contract-studio
npm ci
npm run dev
~~~

## Verification

~~~bash
npm run test:offline   # invariants without additional dependencies
npm run docs:check     # local links and manifest consistency
npm run validate       # catalog checks, lint, and tests
npm run build          # TypeScript and Vite
~~~

The quality CI runs on pull requests and pushes to `main`. The **full E2E suite** runs manually on `main` under **Actions → E2E manual (main)**; visual auditing follows a separate workflow. The presence of components, structural tests, or pixel differences alone does not constitute visual approval.

## Repository structure

| Location | Contents |
| --- | --- |
| `src/components/ui/` | Local shadcn/ui primitives |
| `src/ui-catalog/` | Zod contracts, registry, sources, and manifests |
| `src/ui-runtime/` | Rendering, navigation, and explorers |
| `src/ui-screens/`, `src/ui-patterns/` | JSON screens and patterns |
| `pi-catalog/` | APIs and examples consumed by the agent |
| `docs/` | Current guides and audit records |
| `sandbox/` | Connected validation tools |

Read the [documentation index](docs/README.md), [agent instructions](AGENTS.md), [contributing guide](CONTRIBUTING.md), and [changelog](CHANGELOG.md).

## License and publication

Original project code is distributed under the [MIT License](LICENSE); third-party rights, trademarks, and licenses still apply. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

**This repository is already public.** Publication does not replace audits of confidential information, copyrights, or permissions: see [governance and ongoing auditing](docs/governance.md) and [security](SECURITY.md). This project is not an official product of any public institution. Do not include personal data, credentials, or restricted internal resources.
