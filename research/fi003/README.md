# FI003 — JPMorgan Chase / MP Materials

**Financial research revision · November 6, 2026 cutoff · Benjamin review pending**

**Recommended thesis:** JPMorgan supported financing flexibility before 10X production through a replaceable joint construction commitment, equity underwriting and continuing corporate credit. Equity supplied cash without scheduled repayment; government support entered both cash flows and the bank contract; MP retained construction, liquidity and operating risks. The evidence establishes a financing outcome, with dilution and conditional credit access, rather than proving the chosen structure optimal.

Read [analysis.md](analysis.md) for the argument, ranked competing explanations, financing comparison and retained-risk map. [PUBLICATION_PLAN.md](PUBLICATION_PLAN.md) is the **single tracker** for owners, dependencies, proposed dates, the bounded workbook specification and revised 12-slide storyline. [JIHO_HANDOFF.md](JIHO_HANDOFF.md) asks one strongest-objection question and includes an unsent message. [VERIFICATION.md](VERIFICATION.md) records current checks, corrections and limits, with previous environment results distinguished.

| Evidence / calculation artifact | Purpose |
|---|---|
| [evidence.csv](evidence.csv), [sources.json](sources.json), [chronology.csv](chronology.csv) | Claims, original locators, dates, evidence classes and source-retrieval fingerprints; includes the November 6 Q3 10-Q |
| [inputs.json](inputs.json) | Sourced numeric facts separated from hypothetical assumptions; original USD units retained |
| [prototype.py](prototype.py), [test_prototype.py](test_prototype.py) | Standard-library Decimal calculations, independent anchors and material failure cases |
| [exhibits/](exhibits/) | Eleven reproducible schedules; publication plan ranks their usefulness and combines/demotes exploratory tables |

Reproduce from the repository root:

```sh
python3 research/fi003/prototype.py
python3 -m unittest discover -s research/fi003 -p 'test_*.py' -v
python3 research/fi003/prototype.py --check
```

Use ordinary Python execution; `python -O` disables assertions. Retained CSV precision supports audit; eventual displays must round to source precision. No project valuation, actual covenant headroom or debt-service forecast is produced.

## Guidance, scope and provenance

On November 6, Codex retrieved through GitHub **AGENTS.md, CLAUDE.md, operating-playbook.md, the Applied Strategy Standard, Presentation Standard v2, Exhibit and Chart Rules, and Editorial Authenticity & Visual Integrity** at starting live main `fe1d5b3b2fd9ef99018fe2be6b032466b69c5771` and PR head `c1a700a1713e5300ee7506d418fae566e26e822a`. All seven matched exactly at those starting references. Before delivery, main advanced to `b7e67994de5ac96bc7fa9a1cf8ef823eb1b420fc` through PR #213. The seven guides were retrieved through GitHub again: only AGENTS.md changed, adding the website editorial/interface rule. That rule was read and applied to new public notes; the approved upstream copy changes were merged intact and checks rerun. The linked research-publication house style and FI002 financial-model specification were also consulted through GitHub. No separate overriding FI003 modeling guide was found in those references.

The newer presentation rule’s **20-slide total cap**, including appendices, governs over the earlier Applied Strategy wording about a main-deck ceiling. The slide standard’s Georgia/Source Sans 3 pairing governs slides; the house style’s single sans family governs its named written formats. No conflict requires changing source facts. The user explicitly authorizes this branch’s scoped commit/push; CLAUDE’s separate integration-branch rule concerns tooling integration, outside this task. No merge, deployment, public release, external message or human approval is inferred.

The initial foundation used standards from the FI002 branch because its first checkout predated their arrival on main; they are now verified on main and the PR. The existing foundation branch/worktree remains canonical. The attached older FI003 checkout, unrelated untracked screenshots and other worktrees are preserved. The globally referenced RTK.md remains unavailable at the assigned checkout; no missing instructions were invented.

The added candidate task first reviewed existing MP event, source, finance and project records. The current candidate disposition and schema limits are recorded in PUBLICATION_PLAN and VERIFICATION. Private candidate payloads remain in the documented candidate workflow; analytical calculations remain here. Benjamin explicitly approved all three concrete packages; the admitted public seed changes are in this draft PR. Public release remains separately gated.

Benjamin retains major methodological, editorial and publication decisions. Jiho’s prospective independent challenge is pending and does not block research preparation. This packet is Codex-assisted research and makes no claim of Jiho’s findings or approval.
