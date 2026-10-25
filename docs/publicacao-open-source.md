[English](publicacao-open-source.md) | [Português](publicacao-open-source.pt-BR.md)

# Ongoing Publication Audit — UI Contract Studio

**Current status:** the `fernandosam/ui-contract-studio` repository **is already public**. This page is no longer a checklist for "going public"; it tracks security and compliance **after** publication.

An independent Git history does not eliminate confidentiality, copyright, or licensing obligations. Do not assume any of the following checks have been completed merely because the repository is visible.

- [ ] Review secrets, personal data, internal endpoints, and binary files introduced in future changes.
- [ ] Verify ownership and any required permission for included code and materials.
- [ ] Check licenses and attribution for third-party components, images, examples, fonts, and trademarks.
- [ ] Keep `LICENSE`, `THIRD_PARTY_NOTICES.md`, and `SECURITY.md` reviewed.
- [ ] Run `npm ci`, `npm run test:offline`, `npm run docs:check`, `npm run validate`, and `npm run build` in the appropriate context.
- [ ] Assess whether manual E2E and screenshots are needed for significant visual changes.
- [ ] Verify PR review and protection rules directly on GitHub before claiming they are active.

Do not import history, credentials, logs, or confidential artifacts from another project. See the general policy under [governance](governance.md) and the reporting channel in [SECURITY.md](../SECURITY.md).
