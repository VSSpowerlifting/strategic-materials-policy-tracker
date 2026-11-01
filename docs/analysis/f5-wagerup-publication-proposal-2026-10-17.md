# F5 Wagerup — first human-reviewed milestone publication proposal

**October 17, 2026 · DRAFT ONLY · do not merge or publish.** References [F5 original-source review #110](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/110), [F5 public casefiles #112](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/112), and the [unsigned research handoff #172](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/172).

## Scope of this PR

Prepare the exact first *prospective* project-native milestone, with a deliberate proposed corpus revision, **without** changing `data/seed/project-milestones.json`, `site.lastUpdated`, any public route, production data endpoint, export, financing history, monitored state or private reviewer ledger. The application and Vercel preview continue using **zero** published milestones. A draft preview must not expose the candidate as live industrial reporting.

The machine-readable proposal is [`research/project-execution/release-candidates/wagerup-groundbreaking-2026-10-17.json`](../../research/project-execution/release-candidates/wagerup-groundbreaking-2026-10-17.json). It specifies:

| Release element | Prospective value | Currently published |
| --- | --- | --- |
| Curated corpus cutoff | **2026-10-17** | **2026-10-09** |
| Milestone ID | `mil-au-alcoa-wagerup-groundbreaking-2026-08-24` | No registered project-native milestone |
| Project | `prj-au-alcoa-sojitz-gallium` | Existing registry entry unchanged |
| Kind / mode | `groundbreaking_reported` / `occurred` | None |
| Scope | `named_facility`, new gallium plant co-located at Wagerup alumina refinery | None |
| Explicit event date | **2026-08-24** | None |
| Registered source | `src-alcoa-wagerup-groundbreaking-2026` | Existing primary source unchanged |
| Human source review | **2026-10-17**, Benjamin Yang | Private original-review ledger is NOT imported |
| Publication authorization | **NOT GRANTED** | None |

The candidate's public-reviewer name and review date are intended publication fields, **not** a copy of the private M3 file. The private rationale, unapproved candidates, full review ledger, downloaded source evidence and reviewer acknowledgments remain strictly gitignored. Only the maintainer-reported successful local offline rehearsal is known from the decision maker's shared terminal results; this repo cannot inspect their local device and cannot represent it as independent machine authentication.

## Original-source pinpoint and limits

[Alcoa Corporation, August 24, 2026, **Australia, Japan, the United States and Alcoa Break Ground on Gallium Project in Western Australia**](https://news.alcoa.com/press-releases/press-release-details/2026/Australia-Japan-the-United-States-and-Alcoa-Break-Ground-on-Gallium-Project-in-Western-Australia/default.aspx), opening Perth dateline / first body paragraph. It reports an August 24 **ceremonial groundbreaking at the named gallium production facility** and describes the ceremony as marking the start of construction. Later paragraphs separately describe prospective jobs and future investment/production, and the issuer's forward-looking caution qualifies future outcomes.

The publishable kind is `groundbreaking_reported`, **not** `construction_started` or `construction_completed`. The source does not independently establish the date that sustained earthworks began, project completion, commissioning, commercial gallium output, financier-to-project causality, executed grant obligations or **any actual government disbursement**. The August 24 source date is an issuer-observed event/reporting day; it must not substitute for an unknown physical commissioning date. Source registry's `dateAccessed` remains **2026-10-02**, not overwritten by a later research check.

Three linked financing observations cite this single physical project event; no threefold milestone counting or sum of Australian concessional equity, offtake rights, and unstated U.S. financing is permitted.

## Attestation boundary

On October 17, the maintainer reported personally reading the complete Alcoa announcement, completing all five M3 checks, and recording a genuine local `approved` source-review entry with true review date and the `groundbreaking_reported` packet fingerprint. Their **local-only read-only rehearsal** reported:

- Published milestone count **0**; one hypothetical proposed milestone ID.
- Structural staging eligibility **true**, after Wagerup becoming eligible **only for further manual casefile QA**.
- No public-source authentication, seed write, or publication authorization by that rehearsal.

The candidate pins the **public-metadata review digest** merely to detect later changes to canonical inputs; it is **not** a source-body SHA-256, reviewer signature, independent authentication, or authorization to publish. The private source-review rationale should independently articulate the limited scope before final disclosure, especially distinguishing ceremony, continuous construction and future operations. No assistant may amend or forge that rationale.

## Required final release gate — NOT authorized by this PR

An authorized maintainer must separately make a *new explicit final release decision*, after personally inspecting the proposed public reviewer attribution, source pinpoint, wording, and the maintained private ledger. When and only when this occurs:

1. Recheck latest `origin/main`, other open PRs, the registered original and the user's local M3 decision. Verify the current review-input fingerprint and proposed cutoff. If any project/source/finance/corpus input has changed, request renewed human review; do not silently transplant a digest.
2. Review whether the proposed `site.lastUpdated` revision represents a genuinely curated **whole-corpus revision**. A global corpus date advances source time boundaries throughout SMPT; it is **not** merely a display timestamp for this single Wagerup event. Document the actual coverage/corpus implications, not only the one milestone.
3. After explicit final authorization, in a **new release-specific commit**, copy `proposedProjectMilestones` into `data/seed/project-milestones.json` and change `lib/site.ts` `lastUpdated` to the separately approved cutoff. The proposal and published seed must be byte/field consistent. Remove the prepublication-only test assumptions, replacing with post-release production assertions without weakening historical/no-publication safety checks.
4. Rerun `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run audit:pathways`, `npm run audit:f5-casefiles`, and all required exact-head CI / browser QA. Ensure no negative changed statuses and no unexpected inclusion of an unreviewed candidate in site routes or exports.
5. Independently inspect the resulting casefile and source public presentation at multiple desktop/mobile sizes and perform human citation review. F5-3 `/pathways` remains a separate **future** public-route approval.
6. Merge the release PR and allow production deployment **only with additional explicit authorization**. If conditions are not satisfied, stay draft and unmerged. Do not fast-forward the production corpus merely because tests pass.

The current draft explicitly blocks publication and stays review-only, preserving the published site's zero native milestones. This separation also avoids creating a remotely accessible Vercel preview of an unapproved physical claim before its final release decision.

## Exact-head PR validation

`tests/f5-wagerup-prepublication-proposal.test.ts` asserts: the release flags remain false, current seed stays empty and corpus cutoff unchanged, proposed source/claim fields match the canonical signed *input identity*, digest agrees with current M3 packet for the proposed date, structural milestone validation fails under the **old** cutoff but succeeds under the **proposed** cutoff, and hypothetical casefile QA eligibility never becomes publication authority.

No task in CI, Vercel or these tests can create a real reviewer decision. A green build only certifies the intended prepublication separation.
