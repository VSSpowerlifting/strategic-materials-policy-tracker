# FI003 draft 1.0: quality-control handoff

## Status

**Draft 1.0 candidate, 11 November 2026. This is the version 1.0 production package for human review. It is not approved for publication.**

- The publication HOLD stands. Nothing is merged or deployed and nothing is published externally. No reviewer was contacted.
- The package is pushed to PR #215 as a draft for review. Jiho's and Ambrose's reviews have not taken place, and no finding is attributed to them. No counsel has reviewed the legal reading.
- The research cutoff is 6 November 2026. No post-cutoff evidence is used.
- Unchanged:
  - the 0.7–0.9.1 outputs;
  - model 1.0;
  - C01–C55 and C57–C62;
  - the registered source fingerprints in `sources.json`.
- What changed and why: [DECISION_NOTE_V100.md](DECISION_NOTE_V100.md).
- A second pass on 11 November revised the wording of every slide and replaced the generic cover. The recommendation, model 1.0 and every figure are unchanged. See [Editorial and cover revision](#editorial-and-cover-revision-11-november-second-pass).

## Editorial and cover revision (11 November, second pass)

### Cover

The generic `coverSlide()` gave 1.0 a title, a byline and a badge. It had lost what the 0.5 cover carried: the series line, the two-tier title, the gold rule, the 10X context, and linked citations. The new cover restores those and adds one visual element. It is an original layout drawn by the exhibit system in Archivo on the graphite SMPT ground. It uses no imagery and no bank or company marks.

- **Left column.** It carries:
  - the series line "SMPT / FINANCIAL INTELLIGENCE 003";
  - the title, *MP Materials' 10X Financing*, with the subtitle as one heading;
  - a gold rule;
  - the dek, naming the commitment, the equity and the revolver;
  - one context line on 10X (Northlake, more than $1.25bn, commissioning expected in 2028);
  - the byline: Benjamin Yang, research draft 1.0 of 11 November 2026, evidence to 6 November 2026.
- **Right column: an instrument ledger.** It shows the three instruments on one USD scale, as separate rows that are never stacked or summed:
  - the joint commitment of at least $1bn, with a dashed outline because it expired undrawn on 26 Aug 2025;
  - net equity of $724.2m, in solid gold because the cash was received;
  - the $275m revolver, in outline, with its $72m of letters of credit shaded.

  Every amount and status is also given as text, so the bars only support the text.
- **Attribution line.** It reads: independent research, not commissioned or reviewed by JPMorgan or MP Materials, held from publication pending human review. Five evidence IDs (S01, S07, S08, S11, S19) follow as live links. The DRAFT badge stays at top right.
- **Code.**
  - `scripts/exhibit-system/research-cover.ts` adds an optional `cover` object to the research-spec contract. The contract enforces field limits, at most three ledger rows, part bounds, the three treatments and resolved evidence references.
  - A spec without `cover` renders exactly as before: the 0.9.1 re-render is byte-identical.
  - `tests/exhibit-system-v100-cover.test.ts` covers the contract (5 tests).
- **Contrast.** Cover link text (#C8993E on #12110F) measures about 7.2:1 in the raster. The body tints are about 13:1 and 8:1.

### Copy

Every title, subtitle, interpretation, row label, legend, note and cover field was read in context and rewritten where it narrated process, set up a manufactured contrast, used a generic label or repeated a disclaimer. Negations that carry fact or law were kept, among them:

- expired undrawn;
- no loans drawn;
- no equity cure found;
- no suspension right in the price agreement;
- not legal advice;
- "Not determined" and "Not stated".

| Slide | Main change |
|---|---|
| All | The long per-slide judgment stamp is now "Analyst judgment." The draft status and date sit on the cover and in metadata. The legal stamp is now "Plain reading of the filed credit agreement; not legal advice." |
| 2 | The title states the reason: "…because a suspended Defense payment obligation blocks new draws". The interpretation says what equity and the revolver each are. The row is "Quarter-end liquidity test"; the notes give each figure's basis |
| 3 | The annotation names JPMorgan as administrative agent and says that bank-level fees and retained positions are undisclosed |
| 4 | "The filings do not show how much they added to investor demand" replaces "the record does not isolate their effect" |
| 5 | The title gives the commitment as "at least $1bn … expired undrawn". The interpretation explains the dollar-for-dollar reduction. The notes become "Status of each amount" |
| 6 | It states what the dilution figure distinguishes (equity versus committed debt) and the basis of each percentage |
| 7 | It explains why capacity is not cash (draw conditions) and that loans and LCs share the $275m |
| 8 | The title names the two drivers: $420.3m of capital spending and $91.1m of financing outflows. The $7.8m operating outflow is shown to include $110.9m of price-protection receipts |
| 9 | The subtitle gives the current state (available at 30 Sep 2026). The legal caveats are merged into one sentence |
| 10 | The title is in plain prose. The interpretation explains why the projected quarter-end balance sets the spending limit. "Day-60 extension test" replaces "Grace-extension test" |
| 11 | "None is an MP plan" is dropped from the subtitle. The threshold sentence names covenant EBITDA |
| 12 | It names the risks the price floor and offtake reduce (NdPr price, magnet volume) and the risks MP keeps (10X cost, timing). It states why a 10X breach is the likelier path |
| 13 | Each path "leaves a different question open". Cost of capital is left unranked because the terms were never disclosed |
| 14 | Criteria are positive ("Avoids…", "Provides…", "Limits…"). The interpretation names the four criteria that separate the two equity paths |
| 15 | It explains the addback mechanism and its one-time effect before the open question |
| 16 | The subtitle names the five situations. Qualifiers are in plain prose ("Permanent capital; nothing to repay") |
| 17 | The title states the four conditions, including covenant EBITDA near $232m |
| 18 | The title names the main open item (cost to complete 10X). The government-support row names the retained risks |

The figures on slide 8 are now computed with half-up decimal rounding (`m1()` in `build_spec.py`), so the title matches the exhibit labels.

## What changed in the final pass (10 → 11 November)

The 10 November candidate had a QC record, but the brief set out issues it left open. Each was resolved against the full filed documents:

| Issue | Resolution | Claims |
|---|---|---|
| Default timing under the Defense agreements | Read in full: S02 (transaction agreement), S03 (offtake) and S04 (price protection). Under S02 §9.02(a), an uncured material breach needs at least 120 days, including cure, plus at least 90 days' notice. Clause (ii) lets DoD terminate when MP breaches its 10X development, construction or commissioning duties. Once termination is permitted, credit agreement §8.01(m)(ii) treats it as an Event of Default. Under S03 §8.4.1, DoD can suspend offtake payments only after an uncured Project Company payment default. S04 contains no suspension right; §8(q) makes payment subject to appropriations | C65, C66 |
| A right to suspend versus an actual suspension | §8.01(m)(i) runs its 60-day clock from the date the obligation is actually suspended or released. If it is restored in time, no Event of Default arises. Whether a mere right to suspend is already a Default is arguable. A late DoD payment is not clearly a trigger | C56 (revised) |
| The $500m minimum liquidity | §7.11(a) is a quarter-end test before the covenant trigger. It is not a locked reserve. Slides 2, 10, 16 and 17 now say "quarter-end" | C68 |
| $232m and $209m | Both clauses of the Consolidated Net Indebtedness cash-netting cap are now quoted. The 50% cap applies "for purposes of determining compliance with Article VII"; the 100% cap applies for the Applicable Rate or "any Financial Covenant". $232m (÷4.5) is the decision threshold; $209m (÷5.0) is the alternative reading. Counsel should settle which governs | C63 (revised) |
| 3.00x interest coverage | Cash interest net of interest income. Gross coupons are $35.9–36.4m, so coverage needs at most about $108–109m of covenant EBITDA. Leverage binds first | C64 |
| Trigger date | The covenant trigger is no later than 14 Aug 2027: the Q2 2027 financials are due under §6.01(b), at the later of 45 days after quarter-end and 5 days after the SEC deadline, absent a 12b-25 filing. The first leverage test is no later than 30 Sep 2027. C67 supersedes C50's illustrative 15 Aug | C67 |
| Letters of credit | The equity-only path now names its replacement cost: $72m of LCs need cash collateral or another issuer (slides 13 and 16) | C14 |
| "TARGETED" labels | The renderer gains two additive states, `contractual` (hollow marker, solid outline) and `conditional` (hollow, dotted). The legend lists only the states present, so other decks render unchanged. No FI003 slide says "targeted" (PDF text search: 0) | — |
| Missing slide sources | Slide 3 adds S09; slide 4 adds S11 (2025 10-K, Note 3); slide 7 adds S09; slide 12 adds S11 (Note 3, the $400m preferred); slide 16 adds S02 and S19. No claim on any slide now relies on a source missing from that slide's source line (checked by script; see the map) | — |

## Editorial authenticity and visual integrity review

- **Publication / version:** FI003, *MP Materials' 10X Financing: Cash, Covenants, and Construction Risk*, draft 1.0 candidate.
- **Deck source / rendered PDF:**
  - `v100/spec.json` (`51ae21a9…`)
  - `fi003-mp-materials-10x-financing-draft-1.0.pdf` (`24bb1a95…`)
- **Research cutoff:** 6 November 2026.
- **Reviewers:**
  - Claude (lead agent);
  - one read-only methodology-auditor agent (10 November);
  - one read-only five-perspective adversarial agent (11 November).
  - No human review has taken place.
- **Slides rendered and inspected:** all 18, on the contact sheet of the final render. Slides 9 and 11 were re-inspected at full size after the final edits.
- **Model/source checks executed:**
  - `model.py --check` and `prototype.py --check`;
  - 65 FI003 Python tests;
  - clause arithmetic asserted in `build_spec.py`;
  - full-document reads of S02, S03 and S04 (11 November);
  - live SEC re-reads of S09 and S19 (10 November).
- **Full-copy read completed:** yes. **Headline-only read completed:** yes.

| Gate | Result | Evidence |
| --- | --- | --- |
| A. Analytical substance | **PASS (agent)**; human review pending | The recommendation is narrowed, not reversed. Equity comes first. The revolver is kept for LCs and for fundable overruns. Construction spending is judged against quarter-end cash of at least $500m and against covenant EBITDA near $232m. The recommendation names the revolver's failure cases: an actual suspension of a Defense payment obligation, and a 10X breach that makes a Defense agreement terminable. Alternatives are compared on the same dates (S13) and by stress (S16). Slide 17 gives four reversal conditions. Cost to complete, headroom, DSCR, funding gap and WACC each appear as "Not determined". |
| B. Prose authenticity | **PASS (agent)** | Second pass: every slide's copy was reread and revised (see the table above). Titles state specific claims. Process narration, manufactured contrasts, generic labels and repeated status stamps were removed. Negations that carry fact or law were kept: expired undrawn; no equity cure found; no suspension right; not legal advice; "Not determined". |
| C. Visual integrity | **PASS (agent)** | 18 / 18 inspected at full size after the second-pass render. The new cover was checked for hierarchy, alignment, contrast and the ledger's one shared scale. The three-line interpretations on slides 11, 12 and 15–17 sit close to the source rule at the renderer's standard placement and do not overlap. Archivo only (PDF font check). 16:9, no generated imagery, no bank graphics. |
| D. Quantitative/source fidelity | **PASS (agent)** | See the reconciliation table. The cover ledger's amounts come from the model exports in `build_spec.py`, which asserts $1,000m, $275m and $72m. All 64 evidence links resolve to `sources.json` URLs (tested). Every slide claim's source is on that slide's source line. |
| E. Publication coherence | **PASS (agent)**; human review pending | The title, the 11 November candidate date, the 6 November cutoff and the HOLD agree across the cover, PDF metadata, the decision note, this record and the publication plan. The deck has 18 slides (maximum 20) and no duplicate headlines. JPMorgan's roles are described from filings only. |

Every gate above is an agent result. Under the presentation standard, automated review never grants PASS on Benjamin's behalf, so the human gates remain open.

### Reconciliation (recomputed 11 November)

| Figure | Recompute | Basis |
|---|---|---|
| Gross / underwriting discount | 13,590,908 × $55 = $747.5m; × $1.65 = $22.4m | Source values (inputs.json) |
| Net equity $724.2m | As reported, net of offering expenses. Before them, 13,590,908 × $53.35 = $725.1m | Source value |
| Dilution 8.31% / 7.68% | 13,590,908 ÷ 163,477,816 = 8.31%; ÷ (163,477,816 + 13,590,908) = 7.68% | Model arithmetic |
| Revolver capacity $203m | $275m − $72m LCs − $0 loans | Source values |
| Liquid assets −$492.4m | $1,830.286m − $1,337.911m = $492.375m | Model arithmetic |
| Unused fee ≈ $0.71m a year | $203m × 0.35% (model 1.0, illustrative 360-day year); excludes LC fees | Model arithmetic, illustrative |
| Grace-extension cash test $343.75m | 125% × $275m (C59) | Clause arithmetic |
| Springing-maturity test $1,078.491m | 125% × $862.793m (C61); springs to 30 Nov 2029 | Clause arithmetic, conditional |
| Leverage threshold ≈ $232m / $209m covenant EBITDA | $1,043.133m ÷ 4.5 (50% netting cap under Article VII) or ÷ 5.0 (100% cap) (C63) | Clause arithmetic; a threshold, not headroom |
| Coverage threshold ≤ ≈ $108–109m | 3.00 × $35.9–36.4m gross coupons; interest income reduces it further (C64) | Clause arithmetic; an upper bound |
| Covenant trigger ≤ 14 Aug 2027; first test ≤ 30 Sep 2027 | 30 Jun 2027 + 45 days; the SEC deadline + 5 days is no later, absent a 12b-25 (C67) | Contract deadline |
| 2026 capex | $420.250m gross / $413.750m net over nine months; guidance $500–600m (C62) | Source values; the Q4 remainder is arithmetic only |

### The 11-byte S09/S19 difference (resolved as SEC response variation)

The live SEC copies retrieved on 10 November are each 11 bytes shorter than the registered fingerprints:

- S09: 1,091,480 bytes against 1,091,491 registered.
- S19: 2,144,954 bytes against 2,144,965 registered.

The hashes also differ between same-day fetches. The cause is SEC's bot-management layer, which appends a randomized script tag to each response, so the byte count and hash change from one request to the next. With that tag stripped, the 10 November copies give stable content fingerprints:

- S09: 1,091,372 bytes, `2338d629c238b88b31627737fbf924017a10c1c62a2f9b17213cd9a60dd2433d`
- S19: 2,144,846 bytes, `9dec629f8db6e2a357a2bb91e0d80c3dbd3fab256f54b815ab00452105b0f35a`

Clause and figure text read from the live copies matches the claim register. `sources.json` was not changed; its registered hashes remain the archived record. A future fingerprint should hash the document with the injected tag removed. That is a proposed method change and has not been adopted.

### Adversarial reads

**10 November (methodology auditor).** It found no figure errors. It raised three HOLD and six REVISE items: payment-obligation wording, quantifying the covenant condition, the $500m floor, the Event-of-Default paths, the timing labels, LC fees, roles wording, replacement attribution, and prose. All were corrected before the 10 November render. The final pass then revised its "cash above the $500m floor" correction to "quarter-end cash of at least $500m". The floor is a quarter-end test, not a reserve.

**11 November (five perspectives: banker, CFO, lender, credit analyst, editor).** See [the final adversarial read](#final-adversarial-read-11-november) below.

## Open issues and release decision

- **Legal:** the reading of §8.01(m), §4.02, §8.02, S02 §9.02(a), S03 §8.4.1 and S04 §8 is an editorial plain reading, not counsel's.
  - Whether a right to suspend, before DoD acts, is already a Default is arguable (C56).
  - Which netting cap governs Article VII is arguable (C63).
  - No equity cure was found (C60). That comes from a full-text search, and waivers or amendments are possible.
- **Economic:** none of the following is public, and each appears as "Not determined":
  - cost to complete;
  - eligible-cash certificates;
  - covenant headroom;
  - DSCR;
  - WACC;
  - funding gap;
  - banking fees;
  - the composition of Required Lenders.
- **Thresholds:** $232m, $209m and $108m are thresholds, not headroom. They assume covenant debt equals reported principal and that cash reaches the netting cap. If holders convert the 2030 notes (convertible in Q4 2026, C47), the leverage threshold and the springing exposure both fall.
- **Model:** model 1.0 is unchanged. The private Google Sheet was not touched.
- **Accessibility:** structural remediation PASS:
  - 18 H1 and 4 H2 headings;
  - 8 tables (30 TH / 150 TD);
  - 10 figures with alt text;
  - 64 links (the cover adds five);
  - all 18 pages pixel- and text-identical to the export.

  Not run: a screen-reader pass (NVDA, JAWS or VoiceOver), or a PDF/UA (ISO 14289) or WCAG audit. No certification is claimed. Link annotations lack `/Contents`; the visible evidence ID serves as the link text.
- **PowerPoint:** verified only through XML, the structural editability check and the strict review. Native Microsoft PowerPoint was not run: no open, edit (including chart Edit Data), save or reopen.
- **Rights:** only public SEC filings and issuer pages are linked. No originals, bank graphics or font binaries are embedded in the repository.
- **Automated checks not run:**
  - a native PowerPoint tier;
  - a screen reader;
  - live link fetches for URLs other than S02–S04, S09 and S19;
  - counsel review.
- **Agent assessment:** READY FOR HUMAN PUBLICATION REVIEW. The publication HOLD remains.
- **Human editorial approval:** PENDING.

## Slide-to-claim map

The spec cites sources per slide. This table maps each slide to the `evidence.csv` claims it relies on. It is an agent-built index. On 11 November a script checked that every claim's sources appear among its slide's `evidence_refs`, and found no gaps. It is not a human review.

| Slide | Claims |
|---|---|
| 1 Cover | C01 C02 C05 C07 C13 C14 C27 C28 C32. The 2028 commissioning expectation rests on S19, as recorded in C50; C50's illustrative trigger date is superseded by C67 |
| 2 Executive answer | C07 C10 C14 C15 C29 C55 C56 C68 |
| 3 Roles | C02 C08 C09 C11 C12 C33 |
| 4 Replacement sequence | C01 C05 C13 C35 C51 |
| 5 Bridge | C01 C05 C06 C07 C10 C37 |
| 6 Dilution | C07 C46 |
| 7 Revolver availability | C13 C14 |
| 8 Liquid assets | C29 C30 C48 C62 |
| 9 Default path | C55 C56 C57 C58 C65 |
| 10 Cash tests | C15 C16 C17 C59 C60 C68 |
| 11 Timing | C13 C15 C45 C61 C63 C64 C67 |
| 12 Counterparty map | C18 C19 C20 C21 C24 C25 C26 C36 C40 C53 C55 C65 C66 |
| 13 Gaps by path | C01 C10 C13 C14 C29 |
| 14 Criteria | C15 C46 C55 C58 |
| 15 Covenant EBITDA addback | C38 C39 |
| 16 Strongest alternative | C07 C14 C55 C56 C58 C61 C63 C65 |
| 17 Reversal triggers | C52 C55 C63 C68 |
| 18 Objections | C01 C29 C51 C55 C56 C66 |

The remaining claims are not stated on a 1.0 slide. They support the model, the appendix or earlier drafts: C03 C04 C22 C23 C27 C28 C31 C34 C41–C44 C47 C49 C54. C67 supersedes C50, which stays in the register for the history of earlier drafts.

## Checks run on 11 November (this worktree, before the commit)

| Check | Result |
|---|---|
| `exhibits:review --strict` | 0 hold · 0 review · 0 info |
| `verify_editability.py --deck --manifest` | Structural pass (research mode; LibreOffice and PowerPoint tiers not run) |
| `model.py --check` | PASS: specification and Python anchors reproduce |
| `prototype.py --check` | PASS: 11 schedules reproduce exactly |
| FI003 unittests (`discover -p 'test_*.py'`) | 66 tests OK (links 59 → 64 for the cover; new test that the cover keeps its publication fields as text) |
| Cover contract (`tests/exhibit-system-v100-cover.test.ts`) | 5 / 5 pass |
| PDF / accessible PDF | 18 / 18 pages; Archivo only; 0 occurrences of "targeted" |
| `npm run validate` | Pass (50 registry warnings, unchanged; no seed data edited) |
| `npm run lint` | 0 errors, 28 warnings (unchanged) |
| `npm run typecheck` | Pass |
| `npm test` | 1,163 / 1,163 pass (includes the 5 cover tests) |
| `npm run build` | Pass |

## Outputs

Inputs: `v100/build_spec.py`, `v100/spec.json`, `v100/export_pdf.sh`, `v100/remediate_pdf_v100.py`, `v100/contact_sheet.py`. Outputs are in `outputs/presentation-draft-v100/`. The earlier hashes, including the first 11 November render, are superseded.

| File | Role | SHA-256 |
|---|---|---|
| `fi003-mp-materials-10x-financing-draft-1.0.pptx` | Editable PowerPoint (native charts with embedded workbooks) | `73bf4518fc29dc8b460781cf6dbf4fd005bbed67d820ee0c9e9163eac92360d8` |
| `fi003-mp-materials-10x-financing-draft-1.0-accessible.pdf` | Remediated accessible PDF (reading copy) | `cc6d06f902822d0f3ecf294b7c880593cee2c608d84451ce9b8eba4b290fc424` |
| `fi003-mp-materials-10x-financing-draft-1.0-accessible.receipt.json` | Remediation receipt | `df0339d7c80f323483d403a6e8f034c1dc10fc45953299551a263a85fb5db72f` |
| `fi003-mp-materials-10x-financing-draft-1.0.pdf` | LibreOffice export (matching PDF; remediation source) | `24bb1a95cd732b1a4ef615d92d2ea5896dc24f02f7b9f351429566581e94a238` |
| `fi003-mp-materials-10x-financing-draft-1.0.manifest.json` | Render manifest | `a6acc7f2b5b2f7b0549e8aa5da014d91cef14203f6a96e275528fc73e7d45682` |
| `fi003-draft-1.0-contact-sheet.png` | Contact sheet | `cd0df0b3fc75f13005935b7c0602063af0ce6b968f5f9f14f0454a668bd90a2a` |
| `v100/spec.json` | Deck spec | `51ae21a9a4443c84bc8e4203018a85f7e76444d293dcd81720929946c9da7524` |
| `evidence.csv` | Claim register (C01–C68) | `c2df4b70c8ae7b2cf97ac0d8701fed0d76fe905b0680d9c107366b2eed2aad64` |

```sh
python3 research/fi003/presentation/v100/build_spec.py
npm run -s exhibits:review -- research/fi003/presentation/v100/spec.json --strict
npm run exhibits:render -- research/fi003/presentation/v100/spec.json research/fi003/outputs/presentation-draft-v100/fi003-mp-materials-10x-financing-draft-1.0.pptx
bash research/fi003/presentation/v100/export_pdf.sh
uv run -q --no-project --with pymupdf==1.26.4 --with pypdf==6.14.2 python research/fi003/presentation/v100/remediate_pdf_v100.py
(cd research/fi003 && python3 -m unittest discover -p 'test_*.py')
```

Render refuses to overwrite existing outputs, so delete them first. After a new export, update `SOURCE_SHA256` in `remediate_pdf_v100.py` and in `test_presentation_v100_accessibility.py`.

## Post-cutoff addendum note

No post-cutoff evidence is used anywhere in the deck. China's October 2025 suspension was scheduled to end on 10 November 2026. Any change after 6 November to the following belongs in a dated addendum, and only after Benjamin authorizes a new research version:

- MP's Defense agreements;
- NdPr price-floor payments;
- credit filings.

## Final adversarial read (11 November)

A read-only agent reviewed the deck from five perspectives against `spec.json`, `evidence.csv`, `sources.json`, `inputs.json` and the contact sheet. It reproduced every figure except one and found no fabricated cost-to-complete, DSCR, headroom, WACC or funding-gap figure, and no "targeted" label. Its gate verdicts on the 11 November render were: A FAIL, B FAIL, C FAIL, D PASS (conditional), E PASS. Each finding was checked against the evidence. The table shows what was done; the deck was then re-rendered and every check rerun.

| Finding (severity) | Resolution |
|---|---|
| Slide 11: "3.00x coverage needs at most about $108m" understates C64's $108–109m (blocker) | Now "at most $108–109m" |
| Slide 9: no path for day 60 without a cash certificate (blocker) | The Event-of-Default state now reads "Day 60 without a certificate, or day 90; lenders may act". A separate arrow was tried first, but it crossed another transition label, so the path sits in the state note |
| Slide 11: "Covenant trigger, latest" ignores a 12b-25 extension | Label is now "Covenant trigger deadline"; the annotation says the trigger is later only on a late filing. The first test (30 Sep 2027) still holds with a 12b-25 |
| Slide 11: springing maturity omitted C61's precondition | "If enough 2030 notes remain, maturity springs unless…" |
| Slide 16: "loans can be accelerated", but none are drawn | "Draws blocked; after day 60/90, lenders may call LC cash cover" (C58) |
| Slide 12: $400m preferred cites S11, missing from the slide | S11 and "2025 10-K, Note 3" added; C25 mapped |
| Slide 12: "lets DoD terminate" dropped materiality, cure and notice | "A material 10X breach left uncured past cure and notice periods lets DoD terminate"; "the filed price agreement has no suspension right" |
| Slide 3 / 18: Goldman named as the only co-underwriter; "two of four roles were joint" | Title: "Goldman Sachs shared the commitment and, with Morgan Stanley, the underwriting"; the annotation adds that both were joint lead arrangers of the revolver (C12), wording since revised in the second pass; slide 18 reads "The commitment and underwriting were shared" |
| Slide 18: "bridged to equity" goes beyond C37 | "It backed closing until equity and the revolver replaced it" (C37, C05) |
| Slide 2: title omitted the revolver's retained role | "Raise equity first and keep the revolver for letters of credit; a suspension of Defense payment obligations would block its draws"; revised in the second pass to "Fund 10X with equity first and keep the revolver for letters of credit, because a suspended Defense payment obligation blocks new draws" |
| Slide 14: lender remedies read as a benefit | "…adds later liquidity but exposes MP to lender remedies if Defense payments are suspended" |
| Slide 17: the Defense-risk outcome named no path | "Fund on cash; treat revolver as unavailable" |
| Slide 16 fee ($0.71m) and slide 7 snapshots (Dec 2025, Jun 2026) lack evidence rows | Not changed; documented instead. The figures trace to model 1.0's verified input register (`inputs.json`): `pretrigger_commit_fee` 0.35% (S09 §1.01 Applicable Rate Level 1, §2.09(a), confirmed in the filed text on 11 November); `available_2025` and LCs (S11 Note 10); `available_q2` and `unused_lc_q2` (S13 Note 8). The fee is contract-rate arithmetic on reported unused capacity, not an estimated bank fee. Adding claim rows would require fresh quotes from S11 and S13 |
| Notes not changed | Slide 14's "Does not" for committed debt under the debt-and-covenants criterion (now "Avoids pre-revenue debt and covenants") stays: drawn construction debt carries debt service. Slide 15's "can reverse" rests on the addback's anti-duplication clause (C38) as analysed in `analysis.md`; a precise clause quote is a follow-up. Slide 16 keeps "Equity+revolver" because the renderer caps role labels at 16 characters. The slide 4 labels around 9–16 July and the slide 11 trigger and first-test markers sit close but do not overlap text |

After these corrections the lead agent records A–E as **PASS (agent)**. A second adversarial pass was not run on the corrected render.

## Decisions for Benjamin

1. Accept the narrowed recommendation, or send it back.
2. Decide whether to obtain counsel's reading of §8.01(m), §4.02(b), §8.02, the Article VII netting cap and S02 §9.02(a) before release.
3. Approve sending Jiho and Ambrose the 1.0 baseline. Their handoffs are unsent.
4. Lift the publication HOLD only after the human gates A–E and the independent reviews are complete.
