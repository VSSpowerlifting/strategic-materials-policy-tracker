# FI003 draft 1.0 candidate: quality-control handoff

## Status

**Draft 1.0 candidate, 10 November 2026. Not adopted; 0.9.1 remains the reviewer baseline until Benjamin decides.**

- The publication HOLD stands. Nothing is merged, pushed, published or deployed, and no reviewer was contacted.
- The research cutoff is 6 November 2026. Today, 10 November 2026, is the scheduled end of China's October 2025 suspension. What happens after it is outside this draft (see the addendum note below).
- The 0.7–0.9.1 outputs, model 1.0, C01–C54 and the registered source fingerprints in `sources.json` are unchanged.
- What changed and why: [DECISION_NOTE_V100.md](DECISION_NOTE_V100.md).

## Editorial authenticity and visual integrity review

- **Publication / version:** FI003, *MP Materials' 10X Financing: Cash, Covenants, and Construction Risk*, draft 1.0 candidate
- **Deck source / rendered PDF:** `v100/spec.json` (`85da3492…`) / `fi003-mp-materials-10x-financing-draft-1.0.pdf` (`c8ed02a3…`)
- **Research cutoff:** 6 November 2026
- **Reviewers:** Claude (lead agent), plus one independent adversarial read by a read-only methodology-auditor agent. No human review has taken place.
- **Slides rendered and inspected:** 18 / 18 on the contact sheet before and after the adversarial corrections; after the final render, slides 2, 9, 11, 16 and 17 (the slides the corrections changed most) were re-inspected at full size
- **Model/source checks executed:** `model.py --check`, `prototype.py --check`, 65 FI003 Python tests, clause arithmetic asserted in `build_spec.py`, and a live SEC re-read of S09 and S19 on 10 November
- **Full-copy read completed:** yes. **Headline-only read completed:** yes

| Gate | Result | Evidence and substantive correction |
| --- | --- | --- |
| A. Analytical substance | **PASS (agent) after REVISE**; human review pending | The adversarial read returned three HOLD items, all corrected (see below). New mechanism: §8.01(m) ties revolver access to the Defense agreements. The consequence is correlated availability: the revolver is weakest in the stress the sponsor most faces. The recommendation was narrowed to equity first, with the revolver for LCs and company-specific overruns, and go/slow decisions set on cash. Four explicit reversal conditions (S17), including a quantified leverage break-even (C63). Alternatives are compared on matched dates (S13) and by stress (S16). Each of cost to complete, headroom, DSCR, funding gap and WACC is written as "Not determined". See the adversarial read below. |
| B. Prose authenticity | **PASS (agent) after REVISE** | The adversarial read flagged contrast clauses, slogans and overclaiming titles, and they were corrected (see below). Every title states a specific claim. Material negations that carry fact are kept: no such event is reported; not legal advice; illustrative dates. The cover no longer repeats the title. |
| C. Visual integrity | **PASS (agent)** | All 18 slides inspected. Fixes made: the state diagram overflowed into the interpretation band in the wide layout and was moved to the standard layout; milestone labels collided and were thinned, with revolver maturity moved into the annotation; one criterion label ran over 40 characters and was shortened. Archivo only; 16:9; no generated imagery; no bank graphics. The state diagram labels its transitions as contract conditions and says no such event is reported. Illustrative model dates are marked "targeted / illustrative". |
| D. Quantitative/source fidelity | **PASS (agent)**; the adversarial read independently matched every figure | See the reconciliation table. All 51 links resolve to `sources.json` URLs (tested). S09 and S19 were re-read live; see the retrieval note for the 11-byte difference. |
| E. Publication coherence | **PASS (agent), human review pending** | The title chain runs answer → roles → sequence → replacement → dilution → revolver use → liquidity → default path → cash tests → timing → support linkage → options → criteria → addback → stress comparison → reversal → objections. There are no duplicate headlines, and 18 slides is within the 20 maximum. JPMorgan's role is described from filings only, and the cover disclaims commission and review. |

### Reconciliation (independently recomputed 10 November)

| Figure | Recompute | Basis |
|---|---|---|
| Gross / underwriting discount | 13,590,908 × $55 = $747.5m; × $1.65 = $22.4m | Source values (inputs.json) |
| Net equity $724.2m | Reported net after offering expenses; before them, 13,590,908 × $53.35 = $725.1m | Source value |
| Dilution 8.31% / 7.68% | 13,590,908 ÷ 163,477,816 = 8.31%; ÷ (163,477,816 + 13,590,908) = 7.68% | Model arithmetic |
| Revolver capacity $203m | $275m − $72m LCs − $0 loans | Source values |
| Liquid assets −$492.4m | $1,830.286m − $1,337.911m = $492.375m | Model arithmetic |
| Unused fee ≈ $0.71m a year | $203m × 0.35% (model 1.0, illustrative 360-day year); letter-of-credit fees excluded | Model arithmetic, illustrative |
| Grace-extension cash test $343.75m | 125% × $275m (C59) | Clause arithmetic |
| Springing-maturity test $1,078.491m | 125% × $862.793m (C61) | Clause arithmetic, conditional |
| Leverage break-even ≈ $232m / $209m covenant EBITDA | $1,043.133m ÷ 4.5 (50% cash-netting cap) or ÷ 5.0 (100% cap) (C63) | Clause arithmetic; a threshold, not headroom |
| 2026 capex | $420.250m gross / $413.750m net, 9m; guidance $500–600m (C62) | Source values; Q4 remainder is arithmetic only |

**Retrieval note.** The live SEC copies retrieved on 10 November are each 11 bytes shorter than the registered fingerprints:

- S09: 1,091,480 bytes against 1,091,491 registered.
- S19: 2,144,954 bytes against 2,144,965 registered.

The hashes differ for the same reason. Clause and figure text read from the live copies matches the claim register. `sources.json` was not changed. The re-read is consistent with the registered copies but is not a hash-verified match. The live S09 copy was also 1,091,480 bytes on 8 November (`33b1ed8d…`) and on 10 November (`3748014a…`), with different hashes, which points to variation in what SEC serves rather than a changed filing.

### Independent adversarial read

A read-only methodology-auditor agent tried to refute the deck against the S09 text as filed. It found no figure errors: every reconciliation above matched, as did the springing date of 30 Nov 2029, which is 1 Mar 2030 less 91 days. It confirmed the grace mechanics, the springing test and the discretionary §8.02 remedies. The verdict was that the recommendation survives in a narrower form. It raised three HOLD and six REVISE items. All were checked against S09 and corrected before re-rendering:

| Finding | Correction |
|---|---|
| HOLD: "a stop in Defense payments" overstates §8.01(m)(i). The trigger is an event permitting a payment *obligation* to be suspended, not performed or released; a late payment or one not due is not clearly covered | Slides 2, 9, 10, 14, 16 and 17 now say a Defense payment obligation is *suspended or released*. The word "exactly" is gone |
| HOLD: the deciding covenant condition was not quantified | New C63. The 4.00x leverage test (§7.11(b)) needs about $232m of covenant EBITDA under the 50% netting cap, or $209m under the 100% cap. Shown on slide 11; it replaces the addback-reliance node on slide 17 and is named on slide 16. Which cap governs is left to counsel |
| HOLD: "plan on cash" ignored the $500m floor | "Cash above the $500m floor" on slides 2 and 17; slide 10 says the floor is met at each quarter-end |
| Slide 9: the immediate Event-of-Default path covered only disaffirmation | Now "Termination default, lapse or disaffirmation". The annotation adds that any other Default, or a material adverse effect, also blocks draws |
| Slide 11: "targeted" implied MP plans; springing availability during a Default | The subtitle says "not MP plans"; the labels read "illustrative", "latest" and "conditional"; the annotation says availability is arguably nil during a Default |
| Slide 16: the fee omitted LC fees; the stress row omitted acceleration | "plus LC fees"; "loans can be accelerated after 60 or 90 days" |
| Slide 3: "shared each role" contradicted the sole-adviser self-description (C33) | Retitled "held every financing role, sharing the commitment and underwriting with Goldman Sachs"; "own account" is now "self-described" |
| Slide 5: equity alone credited with replacing the commitment (C04, C05) | Retitled "Net equity of $724.2m and a $275m revolver replaced…" |
| Prose: "not X but Y" constructions, slogans and overclaiming titles | Slides 2, 6, 10, 16, 17 and 18 rewritten. "Bridge, not a loan" is now "bridged to equity and was never drawn" |

Not adopted: an LC-fee estimate at an assumed 2.50% margin. The applicable rate is not computed in the deck, so it stays qualitative. The strongest alternative the auditor named, equity only with the LCs cash-collateralized, is now the explicit outcome when covenant EBITDA falls below the break-even (slide 17).

### Material edits from 0.9.1

See the slide table in [DECISION_NOTE_V100.md](DECISION_NOTE_V100.md). Each edit was re-rendered and passed `exhibits:review --strict` with 0 hold, 0 review and 0 info findings.

### Open issues and release decision

- **Legal:** the reading of §8.01(m), §4.02 and §8.02 is a plain reading, not counsel's.
  - Whether a *permitted but not yet exercised* suspension is already a Default is arguable (C56).
  - No equity cure was found (C60). That comes from a full-text search, and waivers or amendments are possible.
  - Counsel review is recommended before release.
- **Economic:** cost to complete, eligible-cash certificates, covenant headroom and Required Lender composition are not public. All are written as "Not determined".
- **Covenant break-even (C63):** this is a threshold, not headroom. It assumes covenant debt equals reported principal and enough cash to reach the netting cap. Which netting cap governs needs counsel. The 3.00x interest-coverage test is not computed. If holders convert the 2030 notes (convertible in Q4 2026, C47), the threshold and the springing exposure both fall.
- **Model:** model 1.0 is unchanged. The private native Google Sheet was not touched.
- **Accessibility:** structural remediation PASS:
  - 18 H1 and 4 H2 headings
  - 8 tables (30 TH / 150 TD)
  - 10 figures with alt text
  - 51 links, pixel- and text-identical to the export

  Not run: a screen-reader pass and a PDF/UA or WCAG audit. Link annotations lack `/Contents`.
- **Renderer label:** the timeline legend and milestone status read "TARGETED" for dates that are illustrative (covenant trigger) or conditional (springing maturity). The subtitle and milestone labels say so, but the renderer has no "illustrative" or "conditional" status. A renderer change is out of scope for this draft.
- **Slide source lines:** four slides carry a claim whose register source is not in that slide's source line (see the slide-to-claim map). None changes a figure; adding the sources needs one more render.
- **PowerPoint:** verified only through XML, LibreOffice and the strict review. Native Microsoft PowerPoint open, edit (including chart Edit Data), save and reopen was not verified.
- **Rights:** only public SEC filings and issuer pages are linked. No originals or bank graphics are embedded.
- **What automated checks did not run:** a native PowerPoint tier, a screen reader, a live link fetch for every URL other than S09 and S19, and counsel review.
- **Agent assessment:** READY FOR HUMAN PUBLICATION REVIEW as a candidate. The publication HOLD remains.
- **Human editorial approval:** PENDING.

## Slide-to-claim map

The spec cites sources per slide; this table maps each slide to the `evidence.csv` claims it relies on. It is an agent-built index checked by script against each slide's source line, not a human review.

| Slide | Claims | Note |
|---|---|---|
| 1 Cover | C32 (cutoff) | — |
| 2 Executive answer | C07 C10 C14 C15 C29 C55 C56 | — |
| 3 Roles | C02 C08 C09 C11 C12 C33 | C11/C12 are registered to S09; the slide cites S08 for the revolver roles |
| 4 Replacement sequence | C01 C05 C13 C35 C51 | C05 (expiry, S10/S11) is not in the slide's source line |
| 5 Bridge | C01 C05 C06 C07 C10 C37 | — |
| 6 Dilution | C07 C46 | — |
| 7 Revolver availability | C13 C14 | C13 (S08/S09) is not in the slide's source line; C14 carries the figures |
| 8 Liquid assets | C29 C30 C48 C62 | — |
| 9 Default path | C55 C56 C57 C58 | — |
| 10 Cash tests | C15 C16 C17 C59 C60 | — |
| 11 Timing | C13 C15 C45 C50 C61 C63 | — |
| 12 Counterparty map | C18 C19 C20 C21 C24 C26 C36 C40 C53 C55 | — |
| 13 Gaps by path | C01 C10 C13 C14 C29 | — |
| 14 Criteria | C15 C46 C55 C58 | — |
| 15 Covenant EBITDA addback | C38 C39 | — |
| 16 Strongest alternative | C07 C14 C55 C56 C58 C61 C63 | C07 ($724.2m, S11) is not in the slide's source line |
| 17 Reversal triggers | C52 C55 C63 | — |
| 18 Objections | C01 C29 C51 C55 C56 | — |

The remaining claims (C03 C04 C22 C23 C25 C27 C28 C31 C34 C41–C44 C47 C49 C54) support the model, the appendix, or earlier drafts and are not stated on a 1.0 slide.

## Checks run on 10 November (this worktree, uncommitted head at time of run)

| Check | Result |
|---|---|
| `exhibits:review --strict` | 0 hold · 0 review · 0 info |
| `verify_editability.py --deck --manifest` | structural pass (research mode; LibreOffice/PowerPoint tiers not run) |
| `model.py --check` | PASS: specification and Python anchors reproduce |
| `prototype.py --check` | PASS: 11 schedules reproduce exactly |
| FI003 unittests (`discover -p 'test_*.py'`) | 65 tests OK, including 12 in `test_presentation_v100_accessibility.py` |
| `npm run validate` | pass |
| `npm run lint` | 0 errors, 28 warnings (unchanged) |
| `npm run typecheck` | pass |
| `npm test` | 1,158 / 1,158 pass |
| `npm run build` | pass |

## Outputs

Inputs: `v100/build_spec.py`, `v100/spec.json`, `v100/export_pdf.sh`, `v100/remediate_pdf_v100.py`, `v100/contact_sheet.py`. Outputs are in `outputs/presentation-draft-v100/`.

| File | Role | SHA-256 |
|---|---|---|
| `fi003-mp-materials-10x-financing-draft-1.0.pptx` | Editable PowerPoint (native charts with embedded workbooks) | `8c98e7ae8ac07423ffd048e3efe7585bfbaecb1d65d35178f6ea63ffb56d6d2c` |
| `fi003-mp-materials-10x-financing-draft-1.0-accessible.pdf` | Remediated accessible PDF (reading copy) | `4dae79fa6c8d70c469f83d1518007f96764d1c676e39699c7f92610282e62610` |
| `fi003-mp-materials-10x-financing-draft-1.0-accessible.receipt.json` | Remediation receipt | `a5491293e36701bdfd63eec48e4a0b4c27812f468130190c49ac02d3e3932811` |
| `fi003-mp-materials-10x-financing-draft-1.0.pdf` | LibreOffice export (remediation source) | `c8ed02a36f113f6ada25710ed9f7a044c2bc9ad03eb664a50aa9294f82aa653d` |
| `fi003-mp-materials-10x-financing-draft-1.0.manifest.json` | Render manifest | `bce4d3ff88f3d10ae1b91beb74bf7f10bae4d4fd498d052146b032ecd17b6e24` |
| `fi003-draft-1.0-contact-sheet.png` | Contact sheet | `7e163e63fec098d0793a43b41e7551eac5110638c436f72da4a5106aa8ac16e7` |
| `v100/spec.json` | Deck spec | `85da349267b8e7cb393138113252241ff341efcc04def87ad159d9779ddd8e04` |

```sh
python3 research/fi003/presentation/v100/build_spec.py
npm run -s exhibits:review -- research/fi003/presentation/v100/spec.json --strict
npm run exhibits:render -- research/fi003/presentation/v100/spec.json research/fi003/outputs/presentation-draft-v100/fi003-mp-materials-10x-financing-draft-1.0.pptx
bash research/fi003/presentation/v100/export_pdf.sh
uv run -q --no-project --with pymupdf==1.26.4 --with pypdf==6.14.2 python research/fi003/presentation/v100/remediate_pdf_v100.py
uv run -q --no-project --with pypdf==6.14.2 python -m unittest research/fi003/test_presentation_v100_accessibility.py
```

## Post-cutoff addendum note

No post-cutoff evidence is used anywhere in the deck. China's October 2025 suspension is scheduled to end on 10 November 2026. Any change in MP's Defense agreements, NdPr price-floor payments or credit filings after 6 November belongs in a dated addendum, and only after Benjamin authorizes a new research version.

## Decisions for Benjamin

1. Adopt 1.0 as the reviewer baseline in place of 0.9.1, or keep 0.9.1 and treat 1.0 as a proposal.
2. Accept the narrowed recommendation, or send it back.
3. Decide whether to obtain a counsel reading of §8.01(m), §4.02(b) and §8.02 before release.
4. Approve sending Jiho and Ambrose the 1.0 baseline. Their handoffs currently point at 0.9.1 and are unsent.
5. Authorize a push to PR #215. This commit is local only.
