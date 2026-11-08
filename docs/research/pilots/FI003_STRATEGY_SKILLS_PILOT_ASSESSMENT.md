# FI003 Strategy Skills Pilot Assessment

**Status:** Local draft. Uncommitted. Not a publication review or authorization.
**Prepared:** 8 November 2026, agent-assisted (Claude), for Benjamin Yang's review.
**Object reviewed:** FI003 *JPMorgan and MP Materials*. Branch `codex/fi003-jpmorgan-financing-foundation` at `2b3ce5c` (PR #215). It was read through a read-only `git archive` extract. No FI003 file, PR, website or publication status was changed.
**FI003 state at review:**
- Research cutoff: 6 November 2026.
- Model 1.0.
- Draft deck 0.7, 13 slides.
- Publication HOLD.
- Human financial and editorial review pending.
- Jiho's independent feedback expected 16–17 November.

## How the skills were applied

The eight `smpt-*` skills merged in PR #229 were not registered in this session. `Skill("smpt-engagement-framing")` returned "Unknown skill". Each skill was therefore applied by reading its `SKILL.md` and following its procedure by hand. The skills' own deterministic calculator (`strategy_calc.py`) was run directly.

| Skill | Used | Contribution |
| --- | --- | --- |
| smpt-engagement-framing | Yes | Mandate, decision test, issue tree and hypotheses below. Its scale check caught the risk of an unbounded rework. |
| smpt-evidence-baseline | Partly | Checked the claim-matrix structure (`evidence.csv`, C01–C54, with evidence class, status and limitation) and the four-layer map. Primary sources S01–S20 were **not reopened**, so this is inherited from FINAL_REVIEW. |
| smpt-financing-structure | Yes | Status-ladder audit: commitment, available, drawn and letters of credit. Substitution map. Fee and dilution bases. Use of proceeds. Attribution ranking. |
| smpt-investment-appraisal | Yes (calculator) | Independent recompute of the bridge, dilution, threshold, PPA receivable and revolver illustrations. No NPV or IRR, correctly, because FI003 has no project cash-flow basis. |
| smpt-options-decision | Yes | Built a sponsor option set to test whether FI003's per-owner table is a real decision structure. |
| smpt-executive-narrative | Yes | Read the 13 deck titles in sequence, titles only, without the slide bodies. |
| smpt-review-gate | Yes (adversarial) | Seven-gate record and hard-hold screen below. No hard hold; outcome READY FOR HUMAN PUBLICATION REVIEW with limitations. |
| smpt-market-competitive | No | FI003 is a financing-architecture case. A competitor or market-position analysis would add scope without decision value. |

## 1. Framed question (engagement framing)

- **Decision-maker:** The CFO and treasury team of a sponsor arranging construction financing for a government-supported industrial build. Their lenders are a secondary audience. This is a labelled hypothetical, consistent with FI003's own primary audience.
- **Decision:** On what conditions should a sponsor release committed construction debt in favour of an equity or revolver takeout, and what must it monitor between closing and commissioning?
- **Horizon:** Signing through commissioning, plus the first covenant tests.
- **Alternatives:**
  - keep the committed debt (draw it);
  - replace it with equity plus a revolver, as MP did;
  - keep the debt and raise equity in parallel;
  - defer the choice by holding the commitment to expiry.
- **Mechanism:** Policy (the DoD agreements) changes financing terms and covenant definitions. Capital (the commitment, then equity, then the revolver) changes liquidity and dilution. Execution (10X construction, commissioning 2028) determines when covenant and offtake conditions bind. The commercial result is retained liquidity and covenant exposure.
- **Decision test:** The question passes, because the answer changes cancellation conditions, the monitoring cadence and diligence requests. Two framings fail the test and are rejected:
  - "Did JPMorgan succeed?" is a question about the bank's reputation, not a decision.
  - "What is MP's optimal capital structure?" cannot be answered without the original loan terms.

**Issue tree.** Each branch is followed by its routing.

1. Was the replacement like-for-like in amount, certainty, cost and permitted use? → financing-structure
2. What liquidity and covenant exposure does the sponsor keep through commissioning? → financing-structure and appraisal
3. What did government support contribute, separately from the causal claim? → evidence-baseline
4. What is the decision rule for a comparable sponsor, and where does MP's case fail to generalize? → options-decision

**Hypotheses.** Each states what would refute it.

- **H1.** The commitment was a bridge to an available equity window. *Refuted by* evidence that the commitment was unusable despite compliance.
- **H2.** Government support is financially material, but its effect on equity demand is not isolable. *Refuted by* a management or underwriter account attributing demand.
- **H3.** The binding exposure is the corporate liquidity and covenant transition before commissioning. *Refuted by* a disclosed cost-to-complete schedule showing a wide margin.

**Result of the framing.** FI003's analysis.md already holds an equivalent frame: it names the audience, rejects the bank-success and optimal-mix framings, and ranks the explanations. The skill reproduced FI003's frame; it did not improve it. The frame lives in analysis.md but **does not reach the deck** (finding 1).

## 2. The most consequential findings

**Finding 1. The deck has no executive answer.** *Category: decision value.* Read titles only, slides 2–13 give a correct sequence of facts:

- roles
- sequence
- dilution
- replacement
- revolver availability
- addback mechanics
- test timing
- support scope
- threshold mechanics
- PPA accounting
- the liquidity decline
- considerations

None of them states the thesis in analysis.md line 7. The Standard (§3) puts an executive answer second. A reader who gets only the titles learns what happened. They do not learn what FI003 concludes, or what a sponsor should do. This is the largest gap the skills exposed, and it involves no new research: the answer already exists in analysis.md and MANAGERIAL_ACCEPTANCE.

**Finding 2. Draft 0.7 weakened decision value relative to the report.** *Category: decision value. This is a tension, not an error.*

- analysis.md's "Decisions and conditions through commissioning" table assigns actions, the evidence each needs, and the conditions that change them.
- Slide 13 in draft 0.7 recasts this as "considerations … not decisions by MP Materials or JPMorgan" with keyed words ("Price dilution", "LC usage"). Its key reads "Analytical judgment, not sourced decisions."
- QUALITY_REVIEW_V07 records this as maintainer Decision B. It correctly avoids implying that MP or JPMorgan made those choices.
- The cost is that the deck no longer satisfies the decision-value gate (§5): it has no stated recommendation, no change conditions and no next diligence question.
- The two concerns can be separated. A recommendation addressed to the hypothetical sponsor is attributed to SMPT's analysis, not to MP.

**Finding 3. The missing original loan terms are the binding constraint. The option set makes this visible, and it is not a defect.** *Category: methodological.* The table below is the options-decision matrix for the hypothetical sponsor. Cells are categorical and cite claim IDs. "NE" means not established from the public record.

| Criterion | A. Draw committed debt | B. Replace with equity + RCF (MP's path) | C. Keep debt, raise equity in parallel | D. Hold commitment to expiry and decide later (baseline) |
| --- | --- | --- | --- | --- |
| Funding certainty at signing | Committed but not funded, subject to conditions (C01, C03) | Depends on the equity window and contractual reduction rights. Realized for MP (C04, C05, C07) | Highest, if both are available | Commitment held until expiry (C05) |
| Cost | **NE**: original pricing and tenor undisclosed | 3.0% discount ($22.4m) and 7.68% of the isolated base; RCF SOFR + 2.50% at Level 1 | **NE**: sum of both | $7.4m commitment and structuring fees, nonrefundable (C06) |
| Repayment and covenant burden | **NE**: terms undisclosed | No scheduled equity repayment. RCF tests after the trigger | Highest | None beyond the fee |
| Liquidity through commissioning | Draw-dependent | Absorbed by the corporate balance sheet (liquid assets −$492.4m over FI003's bridge period) | Largest buffer | Unchanged until expiry |
| Permitted use | 10X Facility Funding restricted to 10X through commissioning (S02 §6.01(g)) | Prospectus states broader purposes (S06), but proceeds up to the $350m threshold fall within the Specified Funding Sources reserved by S02 §6.01(g) (C51) | Both sets of restrictions apply | n/a |

The matrix cannot rank A against B, and FI003 rightly declines to rank them. Its contribution is narrower: every cell that would decide between A and B reads **NE** in the same row. That shows in a single exhibit why FI003's recommendation has to be conditional. Compared with analysis.md's per-owner table, this is mostly a reformatting. It adds value only if the deck needs one exhibit that explains *why* there is no ranking.

**Finding 4. The financing figures reconcile. The skills found no figure, status or causal-ranking error.** *Category: methodological. It confirms FI003's numbers.* Independent recompute with `strategy_calc.py` and exact decimals:

| Check | Result |
| --- | --- |
| Liquidity bridge, $1,830.286m → $1,337.911m, seven components | Sum −492.375. Residual **0.000**, ties |
| Same bridge with PPA receipts added again | Residual −110.869, fails. This confirms FI003's warning against double counting |
| PPA receipts: 51.016 + 67.962 − 8.109 | **110.869** |
| Dilution: 13,590,908 / 163,477,816 and / 177,068,724 | **8.31%** and **7.68%** |
| Gross equity 13,590,908 × $55 | $747.49994m. Discount $22.425m is 3.00% |
| 2029 full-year threshold: 140 × 1.02⁴ | **151.54**; 50% = 75.77; 25% = 37.89 |
| Revolver: availability 275 − 72; $150m at 6.5% for 360 days | **203**; 9.750 interest; unused fee 0.1855 (no loan: 0.7105) |

The status ladder holds throughout:

- The commitment is never shown as drawn, and it expired undrawn.
- Letters of credit are shown as reducing availability, not as borrowings.
- PPA income and PPA cash are kept separate.
- July equity exceeded the $350m threshold, so no DoD backstop cash is counted.
- The dilution base is stated on both denominators.

**Finding 5. Two external-validity and attribution judgments need explicit treatment in the deck.** *Category: decision value and methodological.*

- **Applicability.** MP's takeout depended on conditions a "comparable sponsor" may lack:
  - a $55 share price into an equity window;
  - the Apple agreement announced one day before pricing;
  - a DoD price floor, offtake and $400m preferred.
  
  FI003 treats the lessons as transferable. Whether a sponsor without that support could replace committed debt at all is an untested assumption. It should be stated as such, ideally on slide 13 or in the executive answer.
- **JPMorgan's role.** The commitment was joint with Goldman Sachs, and the initial share allocation was 4,727,272 each to JPMorgan and Goldman and 2,363,637 to Morgan Stanley (C09; initial tranche only). JPMorgan's distinct position is the revolver agency. Its fees, retention and credit decisions are undisclosed (slide 2 says so). The title carries JPMorgan's name, but the evidence supports a joint financing route with one agency role. FI003 does not overclaim: slide 2 is careful. Whether the case should keep JPMorgan in its title is a framing decision for Benjamin, not an error.

## 3. The brief's challenge points

| Point | FI003's existing treatment | Assessment |
| --- | --- | --- |
| Financing substitution | Like-for-like rejected; cash and capacity shown together and not summed (slide 5); $999.2m vs $1bn reconciled (analysis.md line 146) | Strong. Slide 5 shows 747.5 − 22.4 next to a reported 724.2 without naming the roughly $0.9m of other expenses. This is a low-severity labelling gap, already reconciled in the analysis |
| Liquidity | Fully tied bridge; balance-sheet reliance shown without asserting a deficit | Strong. Recomputed with zero residual |
| JPMorgan's economic role | Roles matrix; fees undisclosed | Accurate. Title emphasis is a judgment (Finding 5) |
| Government support | Separates cash, contract terms and causality; backstop shown as a fallback | Strong. Ranked "strong mechanism, unisolated causality" |
| Causal attribution | Four ranked explanations; bank rejection ranked poorly supported | Strong. The skill's attribution ranking yields the same order |
| Execution risk (layer 3) | Commissioning 2028 with no date; no budget or spend schedule | Correctly described as missing in the analysis. Slides flag pieces of it (slide 8: no commissioning date; slide 13: the remaining funding gap cannot be forecast), but the gap is **not stated at the four-layer level** |
| Applicability | Audience is "comparable sponsors" | Under-examined (Finding 5) |

## 4. Improvements ranked by decision value

1. **Add an executive-answer slide after the cover.** It should give the thesis in 3–5 sentences, the conditional sponsor recommendation and the decisive caveats, all drawn from existing analysis.md text. *Decision value: high. Cost: low. No new research.*
2. **Restore a conditional recommendation on slide 13, addressed to the hypothetical sponsor.** It should name the action, the evidence it needs, the condition that changes it and the next diligence question, without attributing any decision to MP or JPMorgan. *Decision value: high. Requires Benjamin to revisit Decision B.*
3. **State the external-validity limit and the execution-layer gap explicitly**, in the executive answer or on slide 13. *Decision value: medium. Methodological.*
4. **Add a methods/source/model slide or appendix pointer** (Standard §3, last bullet), and put the research cutoff (6 November 2026) on the cover. *Category: governance and editorial. Low cost.*
5. **Optional: the NE option matrix** (Finding 3) as a backup exhibit. *Decision value: low to medium. Largely a reformatting.*
6. **Housekeeping.** Name the roughly $0.9m of other expenses on slide 5. Update the README link that still points to draft v03. *Category: editorial. Low.*

Considered and rejected as stylistic preferences, with no decision value:

- re-titling mechanics slides 7, 10 and 11;
- swapping chart forms;
- adding DCF, WACC or a covenant-headroom model. The data do not support those, and FI003 correctly withholds them.

## 5. Errors, unsupported assumptions and evidence gaps

- **Errors found:** none material. No hard hold was triggered by a figure, status or causal claim.
- **Unsupported assumption:** that MP's lessons transfer to sponsors without comparable government and market support.
- **Evidence gaps, all already disclosed by FI003:**
  - original loan pricing and tenor;
  - covenant certificates and headroom;
  - cost to complete and the spend or draw schedule (reported to DoD under S02 §6.04(c), but not public);
  - JPMorgan's fees and retention;
  - the isolated effect of government support on equity demand.
- **Limits of this assessment:**
  - S01–S20 were not reopened.
  - The workbook cells (`Financing!`, `Credit!`) were not opened.
  - The accessible PDF, the PPTX and the hyperlinks were not tested.
  
  The evidence and model-QA gates rely on FINAL_REVIEW and VERIFICATION, not on independent re-verification.

## 6. Review gate record (adversarial; not authorization)

| Gate | Result | Basis |
| --- | --- | --- |
| 1. Evidence | Pass (inherited) | C01–C54 matrix with classes and limits; primaries not reopened |
| 2. Four-layer | Pass with limitation | Policy and capital strong; execution layer thin, flagged slide by slide but not as a layer |
| 3. Financial integrity | Pass | Status ladder clean; no double counting; bridge ties |
| 4. Model QA | Pass (partial) | Headline figures recomputed exactly; workbook ties inherited |
| 5. Decision value | **Limitation** | The report passes. Deck 0.7 lacks an executive answer and a stated recommendation |
| 6. Editorial | Pass with limitation | Assertion titles are accurate. Accessibility gaps already recorded in FINAL_REVIEW; cutoff not on cover |
| 7. Governance | Not satisfiable by an agent | Human financial and editorial review pending; this is why the ceiling is READY FOR HUMAN PUBLICATION REVIEW |

**Outcome: READY FOR HUMAN PUBLICATION REVIEW, with the decision-value limitation recorded.** No hard hold was found in figures, statuses, geometry or causal claims. FI003's maintainer publication HOLD stays in force; this assessment does not change it, and only a human records approval.

## 7. Judgment: supplement, not revise

FI003's research and model already answer the strategic question well. The skills found no change to any figure, any claim's status or the causal ranking, so a *revise* judgment is not warranted, and FI003 should be **preserved** for its cutoff, model 1.0, registers and evidence. The deck should be **supplemented**. The skills' real contribution is a narrative and decision-value gap at the deck level: FI003 has the answer, but the deck does not say it. Most other outputs of the skills restated what FI003's extensive reviews had already done.

Self-skepticism: the skills were applied by an agent that read FI003's own reviews first, so the frame may have been anchored on them. That convergence is weaker evidence of FI003's quality than an independent read would be. Jiho's review is a better test of the framing.

## 8. Recommended next phase

1. **Benjamin's review (PUBLICATION_PLAN's suggested 10 November milestone):** decide improvements 1–2. That means reopening Decision B on whether slide 13 carries a sponsor-addressed recommendation, and approving an executive-answer slide built from existing text.
2. **Fold Jiho's feedback (16–17 November) in alongside this assessment** before any draft 0.8, so the deck is revised once.
3. Make draft 0.8 a format-only revision. It should add the executive answer and the conditional recommendation, state the external-validity and execution limits, put the cutoff on the cover, add a methods pointer and handle the housekeeping, with no change to the cutoff, model or registers.
4. Open no new research unless a specific claim is disputed, consistent with MANAGERIAL_ACCEPTANCE's advice against a parallel research project.
5. For the skills system: register the `smpt-*` skills so they can be invoked rather than hand-applied. Treat executive-narrative and review-gate as the skills that earned their place on a mature product. Framing and options-decision add most value at the *start* of a case, not on a seventh draft.
