# Security Policy

## Threat model

The Layered Data Architecture Checklist is a **local-only dev tool**. It is designed to run on your own machine, alongside Claude Code or another local AI assistant. It is NOT designed for:

- Multi-user deployment
- LAN exposure
- Internet-facing deployment
- Storing sensitive / regulated data

The dev server binds to `127.0.0.1:5120` and the SvelteKit `+server.ts` API routes write JSON files directly to `data/`. There is no authentication. Anyone who can reach the port can read, overwrite, or delete your architectures, lookups, and policies.

If you need to share an architecture, use the **Export JSON / CSV / Excel** buttons and share the downloaded files — never the server.

## Supported versions

Only the latest commit on `main` is supported. We don't backport security fixes to older releases. If you're running a fork, rebase onto current `main` to pick up patches.

## Reporting a vulnerability

Please report security issues privately to [security@AgileDataGuides.com](mailto:security@AgileDataGuides.com). Include:

- A description of the issue and the impact you believe it has.
- Steps to reproduce, or a proof-of-concept if available.
- The commit SHA you tested against.

**Do NOT** open a public GitHub issue for vulnerability reports — opening one accidentally is fine, just close it and email us instead.

## Out of scope

The following are intentional design choices, not vulnerabilities:

- **No authentication.** The app runs locally, so there's no user to authenticate.
- **CSP `'unsafe-inline'`.** Required by SvelteKit hydration and Tailwind. Removing it breaks the app.
- **Filesystem writes from the dev API routes.** The threat model assumes you trust your own machine. The API rejects oversize bodies and structurally invalid models, but it doesn't try to defend against an attacker who already has shell access.
- **`data/*.json` file format.** Anyone with shell access can hand-edit the JSON files. That's by design — it's also how the included Claude skill reads your architectures.
- **Reading XLSX files is intentionally unsupported.** The Export Excel feature is write-only via `exceljs`. A CI guardrail (monorepo-level `scripts/check-no-xlsx.sh`) blocks any future re-introduction of the abandoned `xlsx` package (which ships unfixed read-side CVEs).

## Hardening

We do enforce some hardening even within the local-only threat model:

- The dev server binds to loopback (`127.0.0.1`), never `0.0.0.0`. Do NOT change `vite.config.ts` `server.host`.
- File paths from URL params are filtered through a kebab-case regex + path-prefix check so `../../etc/passwd`-style traversal can't escape `data/`.
- We don't ship the abandoned `xlsx` package. Writing XLSX is done via `exceljs`; reading XLSX is intentionally unsupported and a CI script (monorepo-level `scripts/check-no-xlsx.sh`) blocks it from being reintroduced.
- Dependabot watches `package.json` and the GitHub Actions workflows weekly for vulnerable updates.
