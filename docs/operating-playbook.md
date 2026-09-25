# SMPT operating playbook

Load this on demand for task workflow, review, and skill routing. It is **not** an
`@` import in `CLAUDE.md`; read it when starting substantial work or a review.

Derived from `IPR_SMPT_Operating_Playbook.md` v1 (2026-09-25), keeping only what
applies to this repository. It adds procedure; it does not restate the data rules.

## Precedence

1. The newest approved instruction from Ben defines intent and authorization.
2. `CLAUDE.md` and `AGENTS.md` define the project's rules. Where this document
   repeats or differs from them, they win. **Notably, no currency conversion:**
   amounts stay in the source's original currency (`CLAUDE.md`, rule 6).
3. Live evidence defines technical state: the checkout, and CI for a given
   revision (`.github/workflows/ci.yml`). `PROJECT_STATE.md` is a dated history.
   Older summaries, SHAs, PR numbers and file counts are leads, not facts.
4. Primary documents support domain claims. Headroom summaries never do (see the
   compression boundary in `CLAUDE.md`).

A conflict between any of these is reported, not blended.

## Standing practice

1. **Start from a reader decision.** State what someone should understand or do
   with the result: what an action does, whom it affects, what an amount is.
2. **Make evidence inspectable.** A displayed amount, status or classification
   traces to a source locator, a date and the transformation behind it.
3. **Define the completion test first**, including the meaningful failure cases.
4. **Keep current state out of chat history.** Re-read files and live Git/CI state.
5. **Turn a recurring failure into a durable fix**: a test, a validator, a rule
   here or in `CLAUDE.md`, or a narrow procedure, whichever matches the cause.

## Additions specific to capital and controls

`CLAUDE.md` already covers unknown values (rule 5: unknown is `null` or
`"Not yet coded"`), no currency conversion and no adding of unlike instruments
or `part_of`/`drawn_from` double counting (rule 6), and never totalling money
outside `lib/capital-control.ts` (the Architecture section). Also hold to the
standards below.

These are review standards, not statements about current `main` behavior. Verify
the live code and data before relying on any of them or reporting a defect; `main`
may not yet meet every one.

- **Dimensions stay separate** unless a documented rule joins them: announcement,
  authorization, agreement, obligation and payment describe different facts and
  are not one linear ladder. Legal status, conditions, financial stage and as-of
  date are likewise separate. Ceiling, committed and disbursed amounts are
  different measures.
- **An ended, withdrawn or lapsed parent does not by itself make its children
  ineligible.** Evaluate each child under the actual inclusion rule for the
  measure named. Optional, conditional and historical items need the treatment
  that measure requires.
- **A restriction's existence is not measured supply-chain impact.**
- **Where a record carries a stage classification, a missing one stays
  visible** in denominators and comparison notes; never drop it from the base.
  This applies only to fields the schema actually has. Confirm the field exists
  before auditing for it.
- **Check the whole publication path for a private candidate** (pages, search,
  `/api/v1`, exports, `sitemap.ts`, derived totals), not only a visible table.
- **Tests take expected values from reviewed sources and explicit rules**, not
  from the transformation under test. For an important regression, show the check
  fails on the old behavior where practical.
- **Use a browser for user-visible behavior** (desktop and mobile). A green build
  proves neither behavior nor layout.

### Scenarios to keep covered

Proposed cases, not a claim that coverage is missing. Check `tests/` first.

| Scenario | Required behavior |
| --- | --- |
| Package plus child instruments | No overlap in one total |
| Binding agreement with conditions | State the commitment; assert no payment |
| Unknown status | Stays unknown; never zero, non-binding or inactive |
| Ended parent, eligible child | Child judged under the real rule |
| Amendment and superseded record | History kept; correct as-of state chosen |
| Partial payment | Paid amount distinct from the larger commitment |
| Mixed currencies or incompatible stages | Shown separately; never summed |
| Missing stage classification (where the schema has one) | Unknown share shown; denominator correct |
| Candidate reaches an export path | Publication gate fails |
| Same entity under an alias | Identity resolved; no invented relationship |

## Task packet (for substantial work)

Give the builder a complete outcome and let it choose the implementation.
Boundaries protect real invariants only: provenance, accounting, candidate
isolation, repository identity and release rules.

```text
OUTCOME      Deliver [observable result] so [reader] can [decision/action].
STATE        Repo/worktree/branch known or unverified. Run preflight first.
EVIDENCE     Authoritative files/sources; invariants that apply to this task.
SCOPE        The complete approved slice. Note unrelated findings; don't fix them.
DONE WHEN    Behavior, domain correctness, key edge case, compatibility and
             (for UI) browser evidence are verified against the final revision.
AUTHORITY    As the task states; without explicit approval, no commit, push, PR, merge or deploy.
STOP         Acceptance met, or a resumable checkpoint with cause and next step.
```

## Checks and enforcement

Instructions guide; tests and validators check; permissions constrain; CI gates
delivery. A hook existing is not evidence a boundary is enforced. Use
deterministic code for arithmetic, hashing, deduplication, schema checks and
lifecycle rules; use a model for ambiguous interpretation and drafting.

- **CI gate:** `npm run validate`, `typecheck`, `lint`, `test`, `build`
  (`.github/workflows/ci.yml`). Run targeted checks first, then the full gate
  where the affected surface warrants it. `npm run check:links` is a separate
  network check, not part of the gate.
- **Stop optional checking** once the acceptance standard is met. If repair
  attempts stop yielding new evidence, checkpoint and change approach.
- **Review is a separate responsibility, not a reason to spawn agents.** Prefer
  direct validation. Use a project agent in `.claude/agents/` only when role
  separation helps and the task authorizes it, with bounded, read-only work.

## Skills

Personal skills installed under `~/.claude/skills/`. They are **not
version-controlled here**: `.claude/skills/` is git-ignored, so a fresh clone or
CI runner does not have them. A skill holds method only; project facts live in
the repo.

| Skill | Use for | Invocation |
| --- | --- | --- |
| `ben-repo-preflight` | Read-only identity check before any write, PR work, or resuming | Manual (`/ben-repo-preflight`) |
| `ben-build-task` | Execute a bounded task packet with scoped autonomy | Manual |
| `ben-checkpoint` | Source-verified handoff at a phase boundary or block | Manual |
| `ben-review-change` | Independent review of a diff, branch, PR or slice, findings ranked P0-P3 | Model or manual |
| `ben-source-verify` | Claim ledger against primary sources (citations, translations, facts) | Model or manual |
| `ben-smpt-review` | Audit or repair SMPT records, accounting, controls, APIs, exports, UI | Model or manual |
| `ben-ipr-brief` | Indo-Pacific Record briefs. **IPR repository only; not used for SMPT work.** | Model or manual |

Overlap with `.claude/agents/`: `ben-source-verify` and `ben-smpt-review` are
procedures run in the main session; the `source-verifier`, `methodology-auditor`
and `publishing-qa-engineer` agents are read-only role-separated subagents. Use
the skill by default and an agent only when separate context adds value. Neither
replaces reading the complete original source for authoritative fields.

## Session routing

Resume in the existing project session when its repository and task are correct.
Start fresh when the phase changes, context is stale or contradictory, or the
attachment is wrong; make `ben-repo-preflight` its first action. Update
`PROJECT_STATE.md` after meaningful work, as `CLAUDE.md` requires; keep transient
test failures and changing SHAs out of `CLAUDE.md` and this document.
