[English](governance.md) | [Português](governance.pt-BR.md)

# Public Repository Governance

**ui-contract-studio is already public.** The checks described here are ongoing maintenance responsibilities; they **do not** claim that all audits have been completed. A new Git history does not establish ownership of the content or permission to publish it.

## Change review

1. Use branches and PRs with a clear scope. Changes to schemas, contracts, and actions require independent human review.
2. Update `sources.json`, `contracts.lock.json`, fingerprints, the Pi API, fixtures, and affected consumers. `status: approved` is metadata, **not evidence of human approval**.
3. Configure `main` protection, required checks, and reviewers **on GitHub**. [CODEOWNERS.template](CODEOWNERS.template) is an example, not proof that remote policies are in effect.
4. The `integration` job validates code and dependencies; it **does not execute manual E2E**. Visual audits have separate steps and evidence.
5. Do not allow agents to modify trust policies, actions, permissions, or approval records without authorization.

## Ongoing audit checklist

- [ ] Check relevant changes and history for secrets, personal data, private endpoints, and binary files.
- [ ] Assess authorship, licenses, and any institutional permission for significant contributions.
- [ ] Review dependencies, images, fonts, examples, trademarks, and third-party materials.
- [ ] Keep [LICENSE](../LICENSE), [third-party notices](../THIRD_PARTY_NOTICES.md), and [SECURITY.md](../SECURITY.md) up to date.
- [ ] Run `npm ci`, `npm run test:offline`, `npm run docs:check`, `npm run validate`, and `npm run build` as appropriate.
- [ ] Run manual E2E and visual review when necessary, documenting outcomes and blockers.
- [ ] Verify branch protection directly on Git before claiming that governance controls are enforced.

Security reports must follow [SECURITY.md](../SECURITY.md), never public issues containing exploitable details. Also see the [publication checklist](publicacao-open-source.md) and [repository protection](protecao-repositorio.md).
