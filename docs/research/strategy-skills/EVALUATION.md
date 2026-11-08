# Strategy skills — evaluation record

Date: 2026-11-08. Branch `claude/smpt-consulting-skills-c70ab2`, base `d5b59bb`.

## What kind of evaluation this is

| Mode | What it covers | Status |
| --- | --- | --- |
| **Simulated walkthrough** | The evaluator read each `SKILL.md` and applied its method by hand to FI003 and FI002, checking whether the method would surface the right decision, methods, distinctions and challenges | Done (below) |
| **Deterministic recomputation** | `strategy_calc.py` run on payloads built from the products' exhibits and inputs | Done; every anchor reproduced |
| **Structural validation** | Frontmatter, naming, body order, referenced files, tests | Done |
| **Claude Code runtime behavior** | Whether Claude Code discovers the skills, selects them from `description`, and loads `references/` on demand | **Observed 2026-11-08** in three fresh sessions. See [Runtime status](#runtime-status) |

The walkthrough is a reasoned reading, not observed model behavior. It shows whether the instructions are sufficient and correctly aimed. It cannot show that a model will follow them.

Read-only throughout. No FI003 or FI002 output, frozen model, exhibit, deck or publication record was modified. The FI003 inputs were read from the `fi003-integration-review` worktree (`research/fi003/`: `analysis.md`, `FINAL_REVIEW.md`, `PUBLICATION_PLAN.md`, `exhibits/*.csv`). The FI002 inputs came from `docs/research/fi002-bhp-copper/output/` in this worktree.

## Criteria

1. **Decision and stakeholder.** The skill identifies the decision and the stakeholder.
2. **Methods.** It chooses methods suited to the question.
3. **Distinctions.** It recognises financing-status and evidence-class distinctions.
4. **Alternatives.** It produces alternatives and a conditional recommendation.
5. **Challenge.** It challenges weaknesses in the thesis.
6. **Narrative.** It improves the narrative.

Rating: **Strong** means the method alone would reach the point. **Adequate** means it reaches the point with an obvious reading. **Gap** means it would miss the point or mislead.

## Main case — FI003 (JPMorgan × MP Materials)

FI003's facts as given in its pinned files: the $1bn commitment expired undrawn and was replaced by $724.2m net equity and a $275m RCF. Price-protection cash was $110.9m. The DoD backstop is conditional. The research cutoff is 6 Nov 2026. Publication is on HOLD.

| Skill | Criteria tested | Rating | What the method would produce on FI003 |
| --- | --- | --- | --- |
| engagement-framing | 1, 2 | Strong | The mandate step demands a named decision-maker. FI003 names "a corporate finance team arranging a comparable government-supported industrial build" (`analysis.md` l.131) and labels this "an analytical stakeholder perspective, not a mandate" (l.9). The skill's hypothetical-stakeholder rule matches that labelling. The routing plan selects evidence-baseline, then financing-structure as the core, then options-decision, narrative and review. It deliberately leaves market-competitive and investment-appraisal out, because FI003 is not a project appraisal. Inherited holds (publication HOLD, frozen exhibits) are recorded in the mandate. |
| evidence-baseline | 3 | Strong | The status ladder separates the $1bn *commitment*, which ended undrawn, from the equity *proceeds* and the RCF *availability*. Price-protection cash is recorded as *paid* ($110.9m) and the backstop as *conditional*. The cutoff freeze matches the 6 Nov 2026 cutoff. |
| financing-structure | 2, 3, 5 | Strong | Every FI003 trap maps to a method step. Commitment ≠ cash (step 2). Letters of credit reduce RCF availability rather than counting as borrowing: 275 − 0 − 72 = 203 (step 2). Replacement is not additional (step 3). Gross, discount and net are kept apart (step 3). Fee bases differ: the 3% discount on gross proceeds and the 0.74% fee on the $1bn headline are not comparable, and neither is annualised (step 4). Dilution is reported on both labelled bases (step 5). The backstop is not cash (step 6). The tied bridge is step 8. Step 9's attribution forces the "ordinary takeout vs policy-enabled terms" contest rather than asserting causality. |
| investment-appraisal | 2 | Adequate (by design) | Correctly not routed for FI003's core question. Its calculator still serves FI003 through the `bridge` and `totals` commands (see recomputation). |
| options-decision | 4 | Strong | It would build options for the stakeholder: replicate the commitment-then-takeout structure, seek direct public equity, use a conventional RCF only, or do nothing. The categorical matrix carries evidence IDs, and the recommendation is conditional (e.g. "if a government price floor is available, …"). Triggers include the 2029 threshold doubling after the milestone ($75.77m → $151.54m). |
| market-competitive | 5 | Adequate | Optional for FI003. If run, the response-scenario step would test whether other buyers or governments could replicate the structure, which supports the challenge on generalisability. |
| executive-narrative | 6 | Strong | Answer-first with assertion titles, and the Financial Intelligence budget of 12–18 slides fits draft 0.5's 15 slides. Each claim is tied to its evidence class, which separates the observed takeout from the judgment that policy enabled it. |
| review-gate | 3, 5 | Strong | It would reproduce FI003's current state. Accessibility (30 untagged figures), the native PPT test, rights and Benjamin's decisions remain open, so the gate cannot exceed HOLD. It recomputes headline figures by script. Its ceiling is READY FOR HUMAN PUBLICATION REVIEW, which matches the product's governance. |

**Thesis challenges the skills surface on FI003.** These follow from the methods. They are not new research conclusions, and FI003's analysis was not changed.

- **A shared date is not causation.** The commitment expiring as the equity raise priced is timing evidence. That the policy *enabled* the terms remains a judgment needing refuting evidence (financing-structure step 9).
- **Do not over-read the fee.** Ranking the 0.74% commitment fee against the 3% discount as a "cost of support" mixes bases (financing-structure step 4).
- **Liquidity fell over the period.** The bridge's largest item is cash PP&E (−420.250), not financing. Any "financing strengthened liquidity" line must sit beside that.
- **The backstop is conditional.** It must not appear in a liquidity or capacity total.

## Contrast case — FI002 (BHP copper)

FI002 is an investment threshold question, not a financing-structure question. The test is whether the routing switches.

| Skill | Rating | Result |
| --- | --- | --- |
| engagement-framing | Strong | Routes to investment-appraisal and probably market-competitive. Financing-structure is optional, because no facility mechanics are in question. |
| evidence-baseline | Strong | Splits inputs by source. The price (10494.00368/t) is BHP's. The draw schedule, rate, origin, benefit window, burden and tax wedge are SMPT assumptions and must be labelled as such. |
| investment-appraisal | Strong | Threshold rather than an NPV verdict. Sensitivities on the benefit window and the price–burden margin. Refuses to forecast output. The calculator returns `n.a.` when price equals burden instead of dividing by zero. |
| market-competitive | Adequate | Range-only sizing. It does not estimate stage margins, which is consistent with SMPT's scope. |
| options-decision / narrative / review | Adequate | Same methods. The narrative must present 198.8 ktpa (20-year window) and 275.4 ktpa (10-year window) as *thresholds under stated assumptions*, never as expected output. review-gate's "scenario shown as observed" hold covers this. |

The contrast confirms that the skills are routed by question rather than run as a fixed pipeline.

## Recomputation

Commands run: `python3 -B .claude/skills/smpt-investment-appraisal/scripts/strategy_calc.py <cmd> --json '<payload>'`. Payloads were built from the product exhibits and inputs. Figures were not copied from slides.

| # | Figure | Command | Recomputed | Matches product |
| --- | --- | --- | --- | --- |
| 1 | FI003 liquid-asset bridge, 1830.286 → 1337.911 | `bridge`: operating −7.757, cash PP&E −420.250, govt construction award +6.500, financing −91.145, accretion +20.876, restricted-cash release +0.821, unrealised valuation −1.420 | Sum −492.375; residual 0 | Yes |
| 1a | Same bridge without the accretion line | `bridge` | Fails, residual 20.876 | Expected failure |
| 2 | RCF availability | arithmetic | 275 − 0 drawn − 72 LC = 203. The Dec 2025 snapshot was 40 LC and 235 available | Yes |
| 3 | New shares | arithmetic | 177,068,724 − 163,477,816 = 13,590,908 | Yes |
| 4 | Dilution, labelled bases | arithmetic | 8.3136% of pre-offering shares; 7.6755% of post-offering shares | Yes |
| 5 | Underwriting discount | arithmetic | 3% × $747.499940m = $22.4249982m | Yes |
| 6 | Commitment fee (not annualised) | arithmetic | 0.74% × $1bn = $7.4m | Yes |
| 7 | 2029 threshold after milestone | arithmetic | $75.77m × 2 = $151.54m | Yes |
| 8 | FI003 instrument totals | `totals` | Refuses a grand total. The expired commitment, the equity and the RCF fall in separate currency/instrument/status groups | Expected |
| 9 | FI002 PV of capital | `npv`: 5 × 1170 draws 2027–31, 10%, origin 2026 | 4435.220520 | Yes |
| 10 | FI002 annuity factor, 2032–51 | `annuity` | 5.286253249 | Yes |
| 11 | FI002 threshold, 20-year window | `threshold` | Benefit per year 839.010224; threshold 198.765665 ktpa | Yes |
| 12 | FI002 threshold, 10-year window (2032–41) | `threshold` | 275.398 ktpa (matches Methodology l.72) | Yes |
| 13 | FI002 price equal to burden | `threshold` | `n.a.` | Expected |

## Findings and refinements

| # | Finding | Severity | Resolution |
| --- | --- | --- | --- |
| F1 | `threshold` (via `npv`) raised `ValueError: too many values to unpack` when `capital_flows` was passed as a `{year: amount}` mapping, the form a reviewer naturally writes from a workbook | Defect | Fixed. A `_pairs` helper accepts a mapping or a list of pairs, sorts them by year, and is used by `npv` and `sign_changes`. Regression test `test_flows_accept_mapping_or_pairs` asserts that both forms give PV 4435.220520 |
| F2 | `--help` claimed to show payload shapes but did not | Usability | Fixed. A `PAYLOADS` epilog lists each command's payload shape |
| F3 | `totals` drops a child only through `part_of` / `drawn_from`. Acceptance testing found three gaps: an item carrying both links had only `part_of` checked, indirect chains were not followed, and `replaced_by` is not read at all, so an original and its replacement with the same currency, instrument and status were summed (the earlier claim that they never share a group was wrong) | Medium → Low | Fixed: both links and indirect chains are now followed, with regression tests. `replaced_by`, `refinanced_by` and `backstopped_by` remain unread by design; financing-structure step 3 tells the analyst to give a replaced original its ended status or leave it out before totalling, and a test pins that behaviour |
| F4 | README said every `description` contains "Use when …"; two use "Use after …" and "Use before …" | Documentation | README wording corrected. The descriptions were left as they are, because their triggers are more precise |
| F5 | FI003's thesis-level challenges (causality, fee bases, liquidity direction, conditional backstop) are each reachable from a named method step | Confirmation | None needed |

No finding required changing a skill's analytical method.

## Structural validation

Checks run on 2026-11-08:

| Check | Result |
| --- | --- |
| Eight directories `.claude/skills/smpt-*/`, each with `SKILL.md` | Pass |
| Frontmatter `name` equals the directory name | Pass (8/8) |
| `description` present, with a trigger sentence ("Use when / after / before …") | Pass (8/8) |
| Body order: purpose paragraph and `Governing rules:` line, then `##` When to use, Method, Deliverables, Verification, Completion, Boundaries | Pass (8/8). engagement-framing adds a `## Routing` section after Method |
| `SKILL.md` length | 49–66 lines each; supporting material sits in `references/` |
| Every `references/` and `scripts/` path named in a `SKILL.md` exists | Pass |
| `python3 -B -m unittest` in `smpt-investment-appraisal/scripts/` | 21 tests, OK |
| Calculator dependencies | Standard library only (`argparse`, `json`, `sys`, `decimal`) |
| `.gitignore` tracks `smpt-*` only | `.claude/skills/*` stays ignored with `!.claude/skills/smpt-*/` negated. `git status` shows only the eight skill directories under `.claude/skills/` |

To repeat the frontmatter check:

```bash
for f in .claude/skills/smpt-*/SKILL.md; do d=$(basename "$(dirname "$f")"); n=$(sed -n 's/^name: //p' "$f" | head -1); [ "$d" = "$n" ] && echo "ok $d" || echo "MISMATCH $d"; done
```

## Runtime status

**Observed 2026-11-08, Claude Code 2.1.310.** Three fresh, non-interactive sessions (`claude -p … --output-format stream-json --verbose`) were started from this worktree with `Edit`, `Write`, `Bash` and `NotebookEdit` disallowed, so none could change files. The observations below come from the session event streams, not from re-reading the definitions. The earlier simulated walkthrough (above) remains a reasoned reading and is not replaced by these runs.

| Check | Prompt | Observed |
| --- | --- | --- |
| 1. Discovery | Any prompt; read the `init` event | All eight skills listed in `skills` and `slash_commands`: `smpt-engagement-framing`, `smpt-evidence-baseline`, `smpt-executive-narrative`, `smpt-financing-structure`, `smpt-investment-appraisal`, `smpt-market-competitive`, `smpt-options-decision`, `smpt-review-gate`. The parent checkout's `.claude/skills/` holds no `smpt-*` directory and `~/.claude/skills/` holds only `ben-smpt-review`, so the listed copies are this worktree's |
| 2. Explicit load | `/smpt-engagement-framing` with a hypothetical state-agency question on a heavy rare earth separation plant | Skill body loaded. The session read `references/mandate-template.md` and returned a mandate table with a labelled hypothetical decision-maker and the "no organization commissioned or endorsed" statement. It did not open `issue-tree-template.md`, which the prompt's scope did not reach. 2 turns, no error |
| 3. Selection without naming | A JOGMEC equity-stake deck request that named no skill | The first tool call was `Skill {"skill": "smpt-engagement-framing"}`. The session then read the Applied Strategy Standard, both framing references, `PROJECT_STATE.md` and Japan seed records (read-only), inherited the 2026-11-08 cutoff from `lib/site.ts`, and flagged the 10 November 2026 suspension end. 13 turns, no error |
| 4. References on demand | Checks 2 and 3 | References were opened with `Read` after the skill loaded, when the method pointed to them; none were preloaded into the skill body |

Limits: one run per check, print mode rather than an interactive session, and only the entry-point skill was selected. Selection of the seven downstream skills from their own descriptions was not separately exercised.

## Assessment

**Strengths**

- Method steps map one-to-one onto the traps FI003 actually contains: commitment versus cash, LC availability, replacement, fee bases, dilution bases, conditional backstops and tied bridges.
- Routing changes with the question (FI003 financing versus FI002 appraisal).
- Arithmetic is deterministic, refuses floats and fails visibly. The bridge residual and the refused grand total show this.
- Human authority is built in: recommendations stay draft and conditional, and review stops at READY FOR HUMAN PUBLICATION REVIEW.

**Limitations**

- Runtime selection and progressive loading are unverified (see above).
- The walkthrough was run by the same agent that wrote the skills. An independent read, by a human or the `methodology-auditor` agent, would be less anchored.
- Only two products were tested, both financing or appraisal cases. A pure policy-instrument comparison has not been run through options-decision.
- Gate C (visual integrity) depends on the product's own render pipeline. The skills cannot pass it alone.

**Extensions worth considering (not built)**

- An `irr`/`npv` sensitivity grid command, if repeated appraisal work needs one.
- A lint script that checks a slide-spec table for topic-label titles and missing evidence classes.
- A third evaluation on a policy-comparison product once one exists.
