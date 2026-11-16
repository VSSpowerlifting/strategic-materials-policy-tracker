# SMPT presentation engine — upgrade roadmap

**Status:** Proposed engineering backlog, not implemented. **Owner:** SMPT maintainer. **Date:** 16 November 2026.

The current system already has 39 synthetic-data exhibit patterns in 11 families, an editable PPTX renderer, deterministic contracts and a draft-only research entry point. Eight specialist `smpt-*` skills cover analytical work. The new `smpt-deck-architect` skill coordinates the existing components; adding a skill does **not** by itself extend renderer features, run historical migrations, or authorize publication.

## Where depth can improve

1. **From charts to analysis.** Stronger linkage of claim → source → model cell → displayed value → economic mechanism → decision. Formalize this trace in a versioned slide-spec layer, with evidence-class and status validators.
2. **From isolated exhibits to a whole argument.** A deterministic presentation planner should make topic-only titles, duplicated claims, long runs of one pattern, disproportionate appendices and unexplained exhibit choices visible before rendering.
3. **From static numbers to model-backed views.** Add reusable connectors for named model outputs, sources-and-uses bridges, scenario tables, borrowing/repayment timelines, unit conversions and sensitivity data. Preserve explicit reporting/assumption boundaries; do not auto-fill unknowns.
4. **From limited layouts to rich native composition.** Expand components only for genuine gaps: multi-step cash conversion, covenant/trigger diagrams, contractual obligations, industrial capacity ramp and case comparisons. Keep an editable data model, consistent SMPT visual tokens and sufficient visual restraint.
5. **From output checks to visual evidence.** Produce a versioned, inspectable PDF and contact sheet, plus automated overflow/contrast/link/label assertions and an explicit human slide-by-slide pass. A successful render alone is not a production-quality deck.
6. **From one-off case work to repeatability.** Release a reusable, pinned workflow with a sample case, input contract, output manifest, QA record and regression fixtures; keep private research and synthetic fixtures strictly separate.

## Coherent engineering phases

| Phase | Scope | Acceptance test |
| --- | --- | --- |
| 0 · Skill/orchestration | Canonical Claude Code workflow, Codex wrapper, brief, QA rubric and production contract | Paths resolve; discovery metadata is present; workflow uses current commands and correct approval boundaries |
| 1 · Contract and regression foundations | Slide-level source/claim/model lineage with strict schema, invariant validation and a small golden deck | Existing research renders unchanged; invalid statuses, model links, dates and source IDs are rejected; tests cover edge cases |
| 2 · High-value analytical components | Deliver 2–3 genuine gap-filling native-editable exhibits chosen from active FI cases; model-backed values with controlled formatting | Numeric round-trips, negative/zero/missing cases, direct labels, fidelity and editability tests |
| 3 · Visual QA pipeline | Generate PDF/contact sheet, structured visual checklist, automated layout warnings and a documented manual PowerPoint check | Inspectable outputs for every slide, no silent font substitution or unchecked export; environment-specific checks recorded |
| 4 · End-to-end pilot | Rebuild a **copy** of a selected FI case with unchanged frozen research assumptions and documented before/after scoring | Side-by-side argument/visual review, same headline values, reproducible command transcript and explicit sign-off request |

## Guardrails

- Scope each phase to one engineering objective and one reviewable PR. Never bundle unrelated site or tracker changes.
- Start from current main and verify any concurrently open deck/exhibit PRs before making changes.
- Do not overwrite FI001, FI002 or FI003 publication artifacts, adjust frozen models, move cutoffs, or release a successor without separate owner review.
- Preserve deterministic PPTX behaviour, source URLs, original asset provenance and automated/HUMAN authority separation.
- A proposed numeric rubric helps locate defects. It cannot replace mandatory analytical and editorial hard holds.
- Do not recreate proprietary consulting templates; the visual language and assets remain SMPT's own.

**Suggested next engineering objective:** Phase 1, a versioned slide-lineage contract and validation suite, before adding new renderer patterns. It supplies the infrastructure for model-connected exhibits and makes subsequent design expansion safer.
