# Production dependency security refresh — 2026-10-08

## Why

Maintainer's `npm audit --omit=dev` on `main` pinned `next@16.2.9` and `eslint-config-next@16.2.9`; it reported six affected production dependency packages, one at critical severity: Next.js, its transitive Sharp and PostCSS dependencies, Nano ID, source-map-js, and baseline-browser-mapping. An audit warning is **not** proof that the SMPT deployment exposes every affected code path.

The bundled advisories concern request handling, app routing, image processing and other library behaviors. Prompt remediation is prudent even if some specific vulnerable runtime features are unused. Never infer SMPT financial/source-integrity status from dependency advisories.

## Remediation in this PR

- Pin **`next@16.4.0` and `eslint-config-next@16.4.0`** as the matching stable pair. This is a deliberate minor upgrade, not an unattended `npm audit fix --force` downgrade/upgrade.
- Regenerate `package-lock.json` using official npm dependency resolution in a *temporary, single-purpose GitHub Actions runner*. It executed `npm install --package-lock-only --ignore-scripts`, a **nonforcing** `npm audit fix --package-lock-only --ignore-scripts`, then a production-only audit and `npm ci --ignore-scripts` consistency check. The temporary workflow was **deleted before opening the final PR**; no elevated workflow permissions are added to production.
- Locked direct/transitive versions in that successful runner: Next.js 16.4.0; eslint-config-next 16.4.0; postcss 8.5.23; nanoid 3.3.20; source-map-js 1.2.2; sharp 0.35.5; baseline-browser-mapping 2.11.27. Versions are npm-resolved, not hand-authored.
- Gate future standard GitHub CI runs with `npm audit --omit=dev --audit-level=moderate` **after `npm ci`**. The isolated production audit reported **zero known vulnerabilities** on October 8, 2026. Passing an audit is a point-in-time dependency check, not a full penetration test.
- Retain normal `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` acceptance before owner review or merge. **No application feature, public policy/financial data, monitoring code, or editorial private files are touched.**

## Remaining development-only finding

The full audit still reported **five high-severity affected dependency entries** via ESLint's chain `eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces`, attributable to the braces denial-of-service advisory **GHSA-vfj7-8cjw-p6xm**. Npm's force recommendation would install `eslint-config-next@14.2.35`, an incompatible downgrade relative to Next.js 16.4.0. Do **not** force it. The production-only audit excludes those development dependencies and reports zero known findings.

Follow-up: track upstream fixes and assess a separate nonbreaking dependency override only after reproducing the actual range constraints and running ESLint/typecheck tests. Do not assert the dev toolchain is free of security risks.

## Independent validation

Before merging, require a fresh exact-head CI pass against the clean PR without the temporary helper workflow. Also check npm's production audit in CI; the full audit may remain nonzero for the *known development-only chain*. The maintainer should then verify real deployment/production health (Vercel may be rate-limited) independently after merge. Never bypass required branch protection just because the production audit is green.
