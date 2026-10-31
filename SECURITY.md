# Security Policy

## Supported Versions

The table below indicates which versions of Satori are currently supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 6.5.5   | :white_check_mark: |
| <= 6.5.4| :x:                |

If you are running a version older than `6.5.5`, please upgrade immediately via `npx skills add MetcalfSolutions/Satori` or `git pull`.

## Reporting a Vulnerability Privately

We take the security of Satori very seriously. If you discover a security vulnerability, please report it privately.

- **Private Disclosure**: Report suspected security vulnerabilities privately via [GitHub Security Advisories](https://github.com/MetcalfSolutions/Satori/security/advisories/new) on `https://github.com/MetcalfSolutions/Satori/security/advisories`.
- **Public Issues**: Do not open a public GitHub issue for exploitable vulnerabilities. For non-sensitive security hardening suggestions or general bug reports, please open an issue at `https://github.com/MetcalfSolutions/Satori/issues`.

## Scope

This security policy covers the following components within the repository:
- `scripts/satori_memory.py` (Local SQLite vault, path validation, cloud-sync guard, prompt-injection sanitization in Continuity Notes, and optional AES-256-GCM encryption)
- `scripts/cli.js`
- `scripts/build_release.py`
- `scripts/validate_skill.py`
- GitHub Actions workflows

## What to Expect

When you report a vulnerability, you can expect:
- **Acknowledgment**: Initial acknowledgment within 72 hours.
- **Triage**: Triage and reproduction assessment within 7 days.
- **Resolution**: A coordinated fix release with reporter credit (unless anonymity is requested).
