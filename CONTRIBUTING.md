[English](CONTRIBUTING.md) | [Português](CONTRIBUTING.pt-BR.md)

# Contributing to UI Contract Studio

1. For significant contract API changes, open an issue before the PR. Work in a dedicated branch with small, well-described changes.
2. Reuse existing components. To add a contract, follow the [component admission guidelines](docs/components.md): strict Zod schema, provenance/license, React/registry where necessary, examples, and tests.
3. Keep agent-generated screens in JSON: no arbitrary JSX, HTML, callbacks, URLs, or unauthorized integrations. Do not include credentials, personal data, or unlicensed third-party assets.
4. Run `npm run test:offline`, `npm run docs:check` when changing documentation, `npm run validate`, and `npm run build` in a prepared environment. Clearly report any steps not run.
5. Request human review for changes to the catalog, manifests, and contracts. Passing CI does not establish security approval or visual fidelity.

See [AGENTS.md](AGENTS.md), the [development guide](docs/development.md), [governance](docs/governance.md), and the [security policy](SECURITY.md).
