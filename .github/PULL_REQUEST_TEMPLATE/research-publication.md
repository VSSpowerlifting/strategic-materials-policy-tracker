# Research publication PR: editorial signoff

Before asking for merge, read `docs/research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md`.

- [ ] Read every changed publication paragraph and the complete article in context.
- [ ] Open the candidate site at desktop width and check typography, links, dates and tables.
- [ ] Open the same candidate at mobile width and check table overflow, spacing and readability.
- [ ] Reconcile material factual/legal/financial distinctions and check source links.
- [ ] Run `npm run editorial:check` with `EDITORIAL_BASE_SHA` set to the PR's merge base (`git merge-base origin/main HEAD`).
- [ ] Add/update `docs/editorial/reviews/<slug>.json` with the current `contentSha256` (`npm run editorial:check -- --hash <page>`), actual reviewer and specific notes. A presentation-only change (layout, typography, styling, markup) leaves the fingerprint unchanged and needs no new record.
- [ ] Rewrite flagged artificial contrasts or document narrowly justified exceptions in the review JSON.
- [ ] Confirm CI checks pass and Vercel preview is ready.

Automated tools can help flag wording and draft review notes, but do not mark the human review checkboxes complete unless a person actually performed those steps. Passing tests alone is not editorial approval.
