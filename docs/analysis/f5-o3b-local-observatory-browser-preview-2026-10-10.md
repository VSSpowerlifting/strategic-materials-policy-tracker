# F5-O3b — Local-only Observatory browser preview and QA protocol

**Engineering status: prepublication, Oct 10, 2026. No public casefile route, human source approval, visual certification, or industrial-outcome release.**

## Purpose and architecture

O3a's React casefile renderer exists in the repository but deliberately has no `app/` route. O3b gives a human maintainer a **real browser-viewable static HTML file using the project's own Lattice Register CSS**, without needing to create a temporary routable Next page, touch the site's compiled assets or open a remotely accessible development server. This is the safe visual-review bridge for the four current Observatory projects: Alcoa–Sojitz gallium, Neo Narva magnets, Stibnite and Thompson Falls antimony.

The local builder:
1. Loads the existing **curated seed corpus**, `site.lastUpdated` and the already merged `buildF5ObservatoryScaffold`; validates the four-project private review baseline and release flags before rendering.
2. Renders `PrivateObservatoryReview` to static HTML via React's server renderer. It preserves the real source-linked policy, finance, designation and approved-physical lanes, including the correct current lack of independently reviewed native physical milestones.
3. Passes **`app/globals.css`** through **the same Tailwind v4 PostCSS plugin** as the actual site to compile the Lattice tokens and responsive utilities. This avoids introducing a separate mock stylesheet or visual drift; local system font fallbacks replace Next's embedded/loaded font assets.
4. Inlines CSS, adds viewport and `noindex/nofollow/noarchive` tags, disables scripts/remote fetches through a restrictive document CSP and does not embed iframes, scripts, remote fonts or analytics.
5. Creates two **gitignored local files** under `.project-execution-review/` only: `observatory-preview.html` and `observatory-qa-plan.json`. The latter pins the generated HTML SHA-256 and explicitly leaves all review outcomes `not_run` and every release attestation false.

The preview artifact's SHA-256 is a checksum **of the local HTML file only**. It does not authenticate a primary source, provide a human review identity, prove a browser check passed or attest a policy-to-industrial causal relationship.

## Maintainer commands

```bash
# Verify current source, full static HTML and real CSS pipeline; NO file writes
npm run preview:f5-observatory -- --check

# Generate files only in the gitignored local M3 human-review directory
npm run preview:f5-observatory

# On macOS, inspect directly using the local browser (file://, not a web host)
open .project-execution-review/observatory-preview.html

# On Linux, open with the system's file viewer
xdg-open .project-execution-review/observatory-preview.html
```

Do **not** copy the HTML into `public/`, upload it to object storage, add a Next `app/observatory` route, commit it, or use its presence as evidence that casefile data has been published. The CLI intentionally supports only `--check`; it refuses `--publish`, `--serve`, arbitrary `--output`, duplicate flags and unknown flags. A real symlinked local output directory is also refused. The generated content includes original publisher hyperlinks: opening those links requires separate human source inspection and network access, but rendering the file does not fetch sources.

## Responsive and manual accessibility matrix

Record **actual** local browser observations for the following sizes; the generated QA plan merely lists tasks as `not_run`:

| Viewport | Why it matters | Check |
|---|---|---|
| 320 × 720 | Small mobile screen | no unintended body overflow, source URLs/names wrap, four evidence lanes stack, table scroll horizontally within its own region |
| 768 × 1024 | Tablet | source-index layout, heading hierarchy, policy/finance/status legibility, no clipped issuer quotes |
| 1440 × 900 | Desktop | comparative table readability, two-column casefile layout, typography/contrast and source evidence scanning |

At **every** size check that table headers and row associations remain meaningful. Keyboard Tab should reach the comparison scroll region, and arrows should scroll it horizontally; keyboard users must be able to follow source links and jump to each project casefile. Perform actual contrast checks against the live CSS output, inspect focus visibility and table/heading navigation with a screen reader, and review real publisher URLs against original documents and pinned passages.

The standalone preview includes local generic fallback fonts, not Next.js self-hosted `Archivo`, `Newsreader`, and `JetBrains Mono` files. A later release candidate therefore still needs actual site-browser typography QA. No tools in this phase claim a manual test was run or passed.

## Fail-closed acceptance

- If the public-release flag, casefile route-authorization flag, or expected four-project/no-human-milestone baseline changes, **generation aborts**; a later phase must make a conscious model/release decision rather than silently publish newly reviewed claims.
- If the real Lattice stylesheet fails to compile expected background/gold tokens and essential grid/scroll utilities, **generation aborts**, rather than emitting unstyled HTML.
- The resulting file must contain source links, source dates, four casefiles, explicit unknown physical-evidence messaging and a final **Publication gate: CLOSED**. There must be no JS or remote asset fetch and no public `app/` or `public/` output.
- The JSON QA plan's viewport tasks and source-review/visual-review/maintainer-release flags remain **unsigned and false**. It must not be treated as a QA certification. A future reviewer may create a separate **human-authored** signed receipt if the actual browser checks are performed.
- Exact-head GitHub CI must pass dependency security auditing, curated data validation, TypeScript, lint, all repository tests and Next production build. A Vercel preview failure from rate limits is a *separate* deployment status and no substitute for local visual QA.

## Next milestone after O3b

Once the private preview is mergeable, actual visual browser QA can occur on the maintainer's computer. Separately, the original M3 reviewer workbench must yield **genuine** human source adjudication and a maintainer-approved project-native physical milestone seed PR for any project facts intended to go public. Only after both evidence and interface gates pass should a separate O4 public route/nav/sitemap/release PR be considered.

**Out of scope:** publishing `/observatory`, automatically reviewing sources, source archive ingestion, new financing sums/statuses, financial as-of reconstruction (F4), real-time monitoring, browser QA attestation by CI, or claiming industrial outcomes from unsigned records.
