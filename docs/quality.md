[English](quality.md) | [Português](quality.pt-BR.md)

# Quality and Certification

This path remains for compatibility with existing links. The **current guide** is [Development and Quality](development.md), which describes actual commands, CI, manual E2E, and visual auditing.

Summary: run `npm run test:offline` and `npm run docs:check` for documentation; `npm run validate` and `npm run build` in the complete environment. The quality job validates PRs and pushes to `main`; the full E2E suite has a **manual workflow on main**. None of these checks alone proves visual equivalence.
