# SMPT strategy skills

Eight project skills in `.claude/skills/smpt-*/` support SMPT's Applied Strategy and Financial Intelligence products (decks, memos, models). They apply the [Four-Layer Analytical Framework & Applied Strategy Standard](../SMPT_APPLIED_STRATEGY_STANDARD.md) and the presentation standards. They do not replace either one. They are not used for tracker data work (records, candidates, classifications), which stays with `ben-smpt-review`, the candidate workflow and the project agents.

Status: skill definitions are frontmatter-valid and version-controlled. Runtime discovery and invocation by Claude Code are recorded in [EVALUATION.md](EVALUATION.md). That file separates what was simulated from what was observed.

## The eight skills

| Skill | Question it answers | Main deliverables |
| --- | --- | --- |
| `smpt-engagement-framing` | What decision, for whom, by when, on what evidence? Which skill does each piece? | Mandate, issue tree with falsifiable hypotheses, routing plan |
| `smpt-evidence-baseline` | What is known, at what status, from which source, as of the cutoff? | Source register, four-layer map, status ladder, fact/assumption split |
| `smpt-market-competitive` | What does the stage structure look like, and how might competitors, buyers and governments respond? | Stage map, position table, response scenarios, optional sizing range |
| `smpt-financing-structure` | What actually funded this, what is still available, and what did government support change? | Instrument register, facility timeline, substitution map, fee/dilution bases, tied bridge |
| `smpt-investment-appraisal` | Does the investment clear its hurdle, and under what conditions? | Workbook structure, thresholds, sensitivities, scenarios, recomputed by script |
| `smpt-options-decision` | Which option, under which conditions, and what would change the answer? | Options with baseline, categorical matrix, conditional recommendation, triggers, KPIs |
| `smpt-executive-narrative` | How should the argument be told so a headline-only read stands up? | Executive judgment, headline sequence, slide specs, language pass |
| `smpt-review-gate` | Is the product ready for a human publication review? | Seven-gate and A–E record, reconciliation table, findings, READY or HOLD |

Shared calculator: `smpt-investment-appraisal/scripts/strategy_calc.py` (npv, annuity, threshold, irr, bridge, totals). It uses decimal arithmetic, refuses floats and has no dependencies outside the standard library. Tests are in `test_strategy_calc.py`.

## Lifecycle and routing

```
framing ─► evidence-baseline ─┬─► market-competitive ──┐
                              ├─► financing-structure ─┼─► options-decision ─► executive-narrative ─► review-gate ─► human review
                              └─► investment-appraisal ┘
```

- **Framing first.** It is the router. Its mandate names the decision-maker (real or a labelled hypothetical), the cutoff and any inherited holds or frozen models.
- **Evidence before calculation.** Run `smpt-evidence-baseline` before any skill that calculates.
- **Analysis skills are optional and composable.** Use only those the issue tree needs. A financing case note may need only financing-structure. A copper appraisal needs investment-appraisal and probably market-competitive.
- **Review is separate.** `smpt-review-gate` never edits what it reviews, and its highest outcome is READY FOR HUMAN PUBLICATION REVIEW.

Invocation: type `/smpt-<name>`, or let Claude Code select a skill from its `description` (each one has a trigger sentence such as "Use when …" or "Use before …"). Supporting files load only when a skill's method points to them (progressive disclosure). Each `SKILL.md` stays under about 70 lines.

## How the skills relate to existing tools

| Existing | Relationship |
| --- | --- |
| Applied Strategy Standard, Presentation Standard v2, Exhibit rules, Visual repertoire, Editorial Authenticity, House style | Governing documents. Skills link to the relevant sections and do not restate them. |
| `ben-source-verify` | Claim-ledger verification. evidence-baseline and review-gate can call on it for a material claim. |
| `ben-smpt-review`, candidate workflow | Tracker records. The strategy skills never edit `data/seed/*`. Tracker changes go through candidates. |
| `methodology-auditor` agent | Optional adversarial second read ("hostile Q&A") during review-gate, when separate context adds value. |
| `publishing-qa-engineer` agent | Rendering and build checks for a web publication of a product. |
| Deck build scripts in a product folder | Rendering stays with the product's own build. executive-narrative writes slide specs, not rendering code. |

No new agents, MCP servers or package dependencies were added.

## Capability map

The brief listed 20 consulting capabilities. Each one below is either owned by a skill or deliberately left out, with the reason. Building 20 skills would have duplicated method, so related capabilities are grouped where SMPT products use them together.

| Brief capability | Owner | Notes |
| --- | --- | --- |
| Problem Framer | `smpt-engagement-framing` | Mandate and decision test (§2 of the standard) |
| Situation Assessor | `smpt-evidence-baseline` | Situation as a sourced, status-graded baseline instead of a narrative |
| Hypothesis Builder | `smpt-engagement-framing` | Each hypothesis carries a refutation test and a competing explanation |
| Issue Tree Architect | `smpt-engagement-framing` | Four-layer chain as the default first cut |
| Market Sizer | `smpt-market-competitive` | Optional. Bottom-up, range only, labelled modeled. No price or reserve forecasts. |
| Profit Pool Mapper | `smpt-market-competitive` (partial) | Stage map and concentration only. Stage margins need data SMPT does not hold, so they are not estimated. |
| Competitor War-Gamer | `smpt-market-competitive` | Response scenarios with confirming and refuting signals |
| Customer Segmenter | Not built | Rarely decision-relevant for policy and financing questions. Buyer positions are covered in the market-competitive position table. |
| Strategic Options Grid | `smpt-options-decision` | Categorical matrix, no weighted score |
| Pricing Strategist | Not built | SMPT is not a pricing advisor and keeps market prices out of scope. A price term stated in an instrument is recorded as evidence. |
| Business Case Builder | `smpt-investment-appraisal` | Thresholds and conditions instead of a single NPV verdict |
| Portfolio Reviewer | `smpt-options-decision` (partial) | Options across a portfolio of projects. Portfolio facts come from the tracker's derived views, not new totals. |
| Operating Model Designer | Not built | Outside a research platform's remit |
| Initiative Prioritizer | `smpt-options-decision` | Implementation sequencing step |
| Transformation Roadmapper | Not built | Outside remit. options-decision gives a short implementation sketch only. |
| KPI Architect | `smpt-options-decision` | Monitoring indicators observable from public sources. No invented targets. |
| Pyramid Story Builder | `smpt-executive-narrative` | Answer first, headline sequence |
| Decision Memo Writer | `smpt-executive-narrative` | The memo is the lightest product framing can choose |
| Hostile Q&A Simulator | `smpt-review-gate` (+ `methodology-auditor`) | Adversarial gates, recomputation and hard holds |
| Executive Deck Packager | `smpt-executive-narrative` | Slide specs and budget. Rendering stays with the product build. |
| *(SMPT addition)* Financing structure analysis | `smpt-financing-structure` | Commitment vs drawdown, substitution, fee and dilution bases, backstops, bridges. These are the most frequent analytical traps in FI products. |

## Design rules applied

- **Separate evidence classes.** Evidence, assumption, calculation, scenario and judgment are labelled separately in every template.
- **No arithmetic in prose.** Figures come from the script or a checked workbook, and review-gate recomputes them.
- **No composite scores or false precision.** Matrices are categorical. Sizing is a range. No risk scores.
- **No unsupported causality.** A shared date or material is reported as temporal or shared-material, and attribution lists competing explanations.
- **Human authority preserved.** Recommendations stay draft judgments. Review ends at READY FOR HUMAN PUBLICATION REVIEW.
- **Original method.** The method is SMPT's own and uses generic structuring terms (issue tree, MECE). It does not reproduce any firm's proprietary frameworks or templates.

## Extending

1. Add a skill only when a recurring product need is not served by an existing skill's method. Otherwise add a step or a reference file to the closest skill.
2. Create `.claude/skills/smpt-<name>/SKILL.md` with `name` equal to the directory and a `description` that says what the skill does and ends with a trigger sentence ("Use when …", "Use before …"). Follow the body order used by the other skills: purpose, governing rules, When to use, Method, Deliverables, Verification, Completion, Boundaries.
3. Put templates and checklists in `references/` and deterministic code in `scripts/` with tests.
4. Add the skill to the routing table in `smpt-engagement-framing` and to this README.
5. Run the structural check in [EVALUATION.md](EVALUATION.md#structural-validation) and evaluate the skill against a real product read-only before relying on it.

Version control: `.gitignore` ignores `.claude/skills/*` except `smpt-*/`, so personal and plugin skills stay untracked.
