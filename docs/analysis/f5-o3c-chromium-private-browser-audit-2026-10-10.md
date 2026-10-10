# F5 O3c — Automated Chromium checks for the private local Observatory

**Engineering-only QA.** This phase deliberately introduces **no public Observatory route**, no reviewer approval, no physical project milestone and no source ingestion. It builds on O3b's local-only HTML preview, which is currently in a separate dependent branch/PR.

## Purpose

SMPT's local Observatory preview currently produces four source-linked project casefiles with the genuine Tailwind/Lattice stylesheet. Static HTML tests can verify labels and element nesting, but they cannot detect **real browser text overflow, scroll behavior, computed contrast or keyboard focus**.

This phase uses **headless Chromium** to inspect the exact O3b-generated `.project-execution-review/observatory-preview.html` as a local `file://` page. Its parent QA plan remains unsigned, all original-source adjudications remain pending, and no automated test can authorize industrial-outcome publication.

## Design

- `scripts/qa-f5-observatory-browser.mjs` launches Chromium through pinned Playwright **1.55.0**, reads the HTML and JSON local QA plan, and checks the file's exact SHA-256 against the plan. The script does **not** mutate or stamp the local plan.
- `.github/workflows/f5-observatory-browser-qa.yml` triggers only for relevant component/preview/workflow changes (plus manual workflow runs), installs dependencies on an ephemeral Ubuntu runner, downloads the matching Chromium, generates the local preview and runs the automated checks.
- The Playwright runtime is installed in the isolated job using a **pinned version** and without touching SMPT's normal tracked `package-lock.json` or production dependencies.
- There is **no screenshot creation, browser trace, HTML dump, artifact upload, public test server, external source crawl or Next route**. The local HTML and QA plan exist only within the short-lived runner and are ignored by Git.
- CI logs only short descriptions of checked viewport sizes and passes/failures. Production code still builds without importing a browser dependency.

## Automated viewport checks

| Browser viewport | Checks |
|---|---|
| 320×720 | Whole document/body do not scroll horizontally; the comparison table scrolls inside its own labeled region; arrow-key horizontal scroll and Tab to first casefile link |
| 768×1024 | Same width and keyboard checks; casefile grid may reorganize, but document cannot clip outside viewport |
| 1440×900 | Desktop width/overflow and all structural, source, and contrast assertions |

At every viewport the browser verifies four actual casefile articles, seven column headings, four row headings, document title and strict **Publication gate: CLOSED**, internal evidence-gap wording, secure source links, no network requests for scripts/fonts/images, and computed contrast of representative foreground/background text classes at **4.5:1 or above**. This is a **sampled contrast check**, not a comprehensive WCAG audit.

## Integrity gates

The browser runner refuses to proceed if the QA plan indicates browser review, original-source review, or release signoff are already completed, because this is a *prepublication baseline test*. The generated plan's statuses stay `not_run`. SHA-256 compares the local preview bytes only, **not** the original issuer's web content.

All browser-side assertions are automated smoke checks, not a substitute for human evaluation. In particular, Chromium tests do **not** establish original-document authenticity, actual project construction, a source-accurate translation, page design quality, screen-reader usability, or a causal effect of government support.

## Use after both dependent PRs have merged

```bash
# Ordinary checks; neither command starts a server or publishes the preview
npm ci
npm run preview:f5-observatory

# Browser runner needs the isolated pinned browser package and executable
npm install --no-save --package-lock=false --ignore-scripts --no-audit --no-fund playwright@1.55.0
npx playwright install chromium
node scripts/qa-f5-observatory-browser.mjs
```

Local browser inspection of the HTML itself remains recommended via `open .project-execution-review/observatory-preview.html`. On CI, the dependency step uses `npx playwright install --with-deps chromium` because fresh Ubuntu workers need Chromium's shared-library dependencies.

## Remaining steps

1. Record a genuine **manual visual** inspection of 320/768/1440 screenshots and content in the maintainer's browser, checking typographic hierarchy, clipping, line wrapping, and source legibility. CI neither generates nor uploads screenshots.
2. Complete actual **screen-reader** and keyboard-only checks, including heading navigation and reading the source index.
3. Independently adjudicate the M3 original sources using signed local reviewer decisions before promoting any project-native physical milestone seed.
4. Only after verified physical evidence, real QA, source-link checks and explicit maintainer authorization, consider a separate O4 public release PR.

**Dependency chain:** #128 O3b local preview must merge first; this O3c branch is stacked on its exact head, not directly on current main. Merge/order must preserve this dependency.
