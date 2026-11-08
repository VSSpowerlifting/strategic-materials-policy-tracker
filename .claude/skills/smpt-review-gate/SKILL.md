---
name: smpt-review-gate
description: Run SMPT's pre-publication review of an Applied Strategy or Financial Intelligence product — the seven evidence and analytical gates of the Applied Strategy Standard plus the five editorial gates A–E — with independent recalculation, hard-hold detection and a QC record that ends at READY FOR HUMAN PUBLICATION REVIEW or HOLD. Use when a deck, memo or model is presented as finished, before any handoff for publication, or when asked whether a research product is ready.
---

# SMPT review gate

An adversarial, evidence-producing review. It checks; it does not fix silently, approve, merge or publish. Its highest outcome is **READY FOR HUMAN PUBLICATION REVIEW**. Human approval is recorded only by a human.

Governing rules: `docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md` §5–6 and `docs/design/presentations/EDITORIAL_AUTHENTICITY_AND_VISUAL_INTEGRITY.md` §4–6 (gates, hard holds, review record). Read both; this skill gives the procedure.

## When to use

- A product is described as complete, ready or final.
- Before a publication handoff, a format-only revision, or a successor version.
- When a reviewer wants an independent second read of figures and claims.

## Method

1. **Pin the artifacts.** Record the exact files, versions, commit, research cutoff and publication status reviewed. Review only pinned artifacts; read-only throughout.
2. **Evidence gate.** Sample material claims back to the source register and the original documents (not summaries). Check dates, issuers, status words and translation provenance.
3. **Four-layer gate.** For each causal or cross-layer claim, confirm the evidence supports the link; otherwise it must be qualified as temporal, shared-material or hypothesis.
4. **Financial integrity gate.** Reconcile instruments, roles, currencies, periods and bases. Look for double counting, commitment-as-cash, mixed fee bases, private capital shown as public support, and capacity-to-output conversion.
5. **Model QA gate.** Recompute every headline figure independently, using `../smpt-investment-appraisal/scripts/strategy_calc.py` (bridge, totals, threshold, npv, annuity, irr) or a rebuild from inputs. Record payloads and results in `references/reconciliation-template.md`. Any mismatch beyond display rounding is a hold.
6. **Decision value gate.** Decision-maker named, credible alternatives assessed, recommendation conditional, next diligence question stated (or N/A for a non-recommending product, recorded as such).
7. **Editorial gates A–E.** A analytical substance; B prose authenticity (full-copy read); C visual integrity (every slide rendered and inspected — if rendering is unavailable, C cannot PASS); D quantitative and source fidelity (from steps 2 and 5); E publication coherence (title-only and whole-deck read).
8. **Governance gate.** Confirm no draft, candidate or unpublished finding enters the public site, API or data exports, and that human approval is absent or recorded by a human.
9. **Hard holds.** Apply `references/hard-holds.md`. Any one → overall HOLD.
10. **Record.** Fill the review record (Editorial Authenticity §6) plus the seven-gate table in `references/gate-record-template.md`, including what did **not** run.

## Deliverables

- Gate record with PASS / REVISE / HOLD and evidence per gate.
- Reconciliation table of independently recomputed figures.
- Findings list: location, issue, evidence, severity, suggested correction.
- Overall assessment: READY FOR HUMAN PUBLICATION REVIEW or HOLD.

## Verification

- Every PASS cites observable evidence; a gate that could not run is recorded as a limitation, not a pass.
- Headline figures recomputed, not re-read.
- Heuristic prose flags treated as prompts for editor judgment, never as proof.
- Valid caveats and technical negations not marked as defects.

## Completion

Complete when every gate has an outcome with evidence, hard holds are checked, unrun checks are listed, and the assessment is one of the two permitted states.

## Boundaries

- Never edits the reviewed product, model, research conclusions, seed data or publication state during review; corrections go back to the owning skill or author.
- Never records human approval, merges, deploys or republishes.
- Automated or agent review is not human editorial review.
