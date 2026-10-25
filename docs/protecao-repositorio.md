[English](protecao-repositorio.md) | [Português](protecao-repositorio.pt-BR.md)

# Repository Protection

Current policy is documented in [Governance](governance.md). [CODEOWNERS.template](CODEOWNERS.template) is only a configuration suggestion and **does not indicate that any branch protection rule is active**.

Configure required PRs, quality checks, and independent review for contract changes on GitHub. The `integration` job checks dependencies, schemas, build, and integration tests, **not the complete Playwright suite**: E2E runs manually on `main`. Do not make E2E a mandatory PR status check if it is not triggered by PRs.

Pi cannot self-approve `sources.json` or `contracts.lock.json`. `approved` in those files is metadata; protection and reviewer identity must be verified on the platform.
