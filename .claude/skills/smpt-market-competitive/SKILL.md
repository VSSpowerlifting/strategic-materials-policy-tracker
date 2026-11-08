---
name: smpt-market-competitive
description: Analyse market structure and competitive response for an SMPT strategy product — supply-chain stage map, concentration and chokepoints, competitor and buyer positions, and bounded market sizing labelled as modeled. Use when a deck or memo needs to say who supplies what at which stage, how a policy changes competitors' or buyers' options, or how large an addressable volume could be under stated assumptions.
---

# SMPT market and competitive analysis

Describes the industrial terrain a policy or capital decision sits in: which stages exist, who occupies them, where concentration creates leverage, and how competitors and buyers can respond. It produces structure and bounded ranges, never market-price forecasts or supply-risk scores.

Governing rules: `docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md` §1 (execution and commercial layers), §4 (reported / derived / modeled labels) and §5 Evidence and Decision value; the market-model exclusion in `CLAUDE.md` (no market prices, reserve or tonnage estimates, supply-risk numbers or projections in the tracker).

## When to use

- The question depends on stage structure (mining, separation, metal/alloy, magnet, component, recycling) or on who else can supply.
- A recommendation assumes competitors or buyers will behave in a certain way.
- A sizing figure is needed to judge whether an option is material.

Use `smpt-evidence-baseline` first for the facts each position rests on. Hand sizing outputs to `smpt-investment-appraisal` only as labelled assumptions.

## Method

1. **Stage map.** Lay out the value chain for the material in question using the tracker's stage vocabulary (`lib/types.ts`). For each stage record known producers, capacity *as reported* and its status (planned, commissioned, nameplate, achieved), with source IDs. Capacity is not output.
2. **Concentration and chokepoints.** Describe concentration with sourced shares where a credible source states them; otherwise describe it qualitatively ("single non-Chinese commercial separator at scale, per S04"). A control measure on a stage is a fact about the measure, not a measured supply effect.
3. **Positions.** For each relevant competitor, buyer and government, state its position, its stated intent (attributed), its observable options and the evidence for each. Use `references/competitor-position-template.md`.
4. **Response scenarios.** Where the decision depends on how others respond, write two to four named response scenarios with the trigger, the expected response, the evidence that would confirm it, and the evidence that would refute it. Label them **scenario**.
5. **Sizing (optional).** If sizing is needed, build it bottom-up from reported inputs with every assumption named, give a range not a point, and label the result **modeled**. Run arithmetic through `smpt-investment-appraisal/scripts/strategy_calc.py` or a workbook with checks; never compute in prose. See `references/sizing-rules.md`.
6. **Implications.** Say what the structure means for the decision — which options it enlarges or closes — and what it does not establish.

## Deliverables

- Stage map with producers, capacity status and sources.
- Position table for competitors, buyers and governments.
- Response scenarios (if decision-relevant), each with confirming and refuting signals.
- Sizing range with assumption register (if used), labelled modeled.

## Verification

- Every share, capacity and volume has a source ID and a status; issuer capacity claims are attributed.
- No price forecast, reserve estimate or risk score appears; any sizing is a range with named assumptions.
- Competitor intent is quoted or attributed, never inferred from timing alone.
- Scenarios are labelled and kept out of any observed-outcome exhibit.

## Completion

Complete when a reader can see who occupies each relevant stage, on what evidence, which responses are plausible and what would tell them apart, and how any size figure was built.

## Boundaries

- Nothing here enters `data/seed/*`. Sizing and scenarios live only in the analytical product.
- Do not convert capacity to output, nameplate to achieved, or a stated plan to a commitment.
- Do not rank competitors with a composite score; compare on named dimensions.
- Private market-data subscriptions are out of scope unless the maintainer supplies them with their licence terms.
