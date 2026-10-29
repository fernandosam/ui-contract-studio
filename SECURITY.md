[English](SECURITY.md) | [Português](SECURITY.pt-BR.md)

# Security Policy

Do not publish credentials, personal data, or details of exploitable vulnerabilities in public issues.

To report a vulnerability, use GitHub's private **Security Advisories → Report a vulnerability** channel if enabled for this repository. If unavailable, contact maintainers through a previously established private channel; do not include sensitive details in public issues or pull requests.

Useful details to include: version/commit, impact, minimal reproduction steps, and proposed mitigation. Never share valid secrets or real user data.

This project is a UI demonstration environment and **must not be treated as an authentication, authorization, or payment backend**. Security of external integrations must be assessed separately.

For dependency advisory gates, committed secret checks, log minimization, and retention limits, see the [E09 security audit](docs/e09-security-audit.md). Do not attach raw Pi prompts/specs, actual user records, or provider errors to public GitHub Actions artifacts.
