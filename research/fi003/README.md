# FI003 — JPMorgan Chase / MP Materials

**Financial case and working model 1.0 · November 6, 2026 cutoff · Benjamin financial/methodological review pending**

**Recommended thesis:** JPMorgan supported financing flexibility before 10X production through a replaceable joint construction commitment, equity underwriting and continuing corporate credit. Received equity supplied capital without scheduled repayment at the cost of ownership dilution. Government support is visible in subsequent cash and credit terms, including a conditional preferred-funding fallback; contractual allocation rules constrain flexibility. MP retained construction, corporate funding and operating exposure. The ordinary equity takeout is the strongest explanation; optimality and government-to-equity causality remain unproven.

Read [analysis.md](analysis.md) for the argument, ranked competing explanations, financing comparison and retained-risk map. [PUBLICATION_PLAN.md](PUBLICATION_PLAN.md) is the **single tracker** for owners, dependencies, proposed dates, the bounded workbook specification and revised 12-slide storyline. [JIHO_HANDOFF.md](JIHO_HANDOFF.md) asks one strongest-objection question and includes an unsent message. [VERIFICATION.md](VERIFICATION.md) records current checks, corrections and limits, with previous environment results distinguished.

| Evidence / calculation artifact | Purpose |
|---|---|
| [evidence.csv](evidence.csv), [sources.json](sources.json), [chronology.csv](chronology.csv) | Claims, original locators, dates, evidence classes and source-retrieval fingerprints; includes the November 6 Q3 10-Q |
| [inputs.json](inputs.json) | Sourced numeric facts separated from hypothetical assumptions; original USD units retained |
| [prototype.py](prototype.py), [test_prototype.py](test_prototype.py) | Standard-library Decimal calculations, independent anchors and material failure cases |
| [exhibits/](exhibits/) | Eleven reproducible schedules; publication plan ranks their usefulness and combines/demotes exploratory tables |
| [model.py](model.py), [test_model.py](test_model.py) | Controlling cell/formula specification, independent baseline/scenario outputs and strict-quarter timing analysis |
| [build_workbook.mjs](build_workbook.mjs) | Single artifact-tool authoring entry point, including layout, validation, scenarios and render QA |
| [Editable Excel](outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx) / [native private Google Sheet](https://docs.google.com/spreadsheets/d/1Lrfoe4sNRBc6IBfwyNTwgKINOYWCsHkWZb0EH4wzdYI/edit) | Six formula-driven tabs, model 1.0. Owner-only native file; no automatic sync after later manual edits |
| [verify_workbook.py](verify_workbook.py), [verify_native.py](verify_native.py), [model outputs and QA](outputs/fi003-model-v1/) | Read-only OOXML/effectiveValue reconciliation, source mapping, evaluated results and visual previews |

Reproduce from the repository root:

```sh
python3 research/fi003/prototype.py
python3 -m unittest discover -s research/fi003 -p 'test_*.py' -v
python3 research/fi003/prototype.py --check
python3 research/fi003/model.py --check
python3 research/fi003/verify_native.py
```

Use ordinary Python execution; `python -O` disables assertions. Retained CSV precision supports audit; eventual displays must round to source precision. No project valuation, actual covenant headroom or debt-service forecast is produced.

## Rebuild and cross-platform verification

`inputs.json` contains 70 calculation facts plus separate hypothetical assumptions/controls. Other contractual terms in the workbook’s text matrix have adjacent source/section references and claims C51–C52; they are not extra cash inputs. `model.py` emits one cell/formula specification and independent expected results; financial formulas reference the factual input cells rather than repeating constants. `prototype.py:first_test_quarter` implements a quarter-end strictly after trigger delivery. An editable delivery date is an illustration, not an asserted legal deadline.

The initial reviewed repository baseline is `66e42a4b32d65b902dc2eea5f852fc8d944522c2`. Main `677da73b12f4d60694be6c686b173c188cccfef5` was integrated before this phase’s edits. Technical verification does not record Benjamin’s financial approval.

Author with the bundled Node runtime and `@oai/artifact-tool`; `FI003_NODE_MODULES` points to that runtime’s `node_modules` directory. The app’s `load_workspace_dependencies` returns the machine-specific paths. On this machine:

```sh
python3 research/fi003/model.py
FI003_NODE_MODULES=/Users/benjaminyang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
  /Users/benjaminyang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node research/fi003/build_workbook.mjs
soffice -env:UserInstallation=file:///tmp/fi003-lo-model-v1 --headless --convert-to xlsx \
  --outdir research/fi003/outputs/fi003-model-v1/recalculated \
  research/fi003/outputs/fi003-model-v1/FI003_Working_Model_v1.xlsx
python3 research/fi003/verify_workbook.py \
  research/fi003/outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx \
  --engine 'LibreOfficeDev 26.8.0.0.alpha0, Calc OOXML recalculation' \
  --report research/fi003/outputs/fi003-model-v1/libreoffice-validation.json
```

The single builder also supports `--no-render` and `--export-scenario=full_draw_post_milestone` for a separate QA file. Recalculate that QA file with Calc and pass its path plus `--scenario full_draw_post_milestone` to the read-only verifier. Authoring intermediates and verbose inspect dumps are locally ignored; the delivery workbook, controlling specification, QA reports and 18 previews are retained. Formula/results are reproducible; export timestamps and engine serialization can change binary hashes.

Native conversion/QA recipe (connected Google Drive tools; account with the existing SMPT FI002 folder):

1. Import the recalculated XLSX with `import_spreadsheet`, `upload_mode=native_google_sheets`, into the restricted FI003 folder. This was done once; reuse the existing native file for this phase. Do not duplicate it or enable sharing.
2. Read spreadsheet metadata, then bounded `get_spreadsheet_cells` for all six populated ranges with `userEnteredValue,effectiveValue,formattedValue,dataValidation,hyperlink`. The committed `native-restored.json` preserves the final baseline. Source links resolve to the originals in `sources.json`.
3. Use the eleven exact controls and ten cases in `model_spec.json`. For each case, `batch_update_spreadsheet` / `updateCells` writes only `userEnteredValue` to those control cells. Read evaluated Credit/Support outputs, all 76 fixed/historical anchors and the 70 factual inputs. Verify outputs against `model.scenario`; restore all controls in a `finally` step.
4. Read all populated ranges again. Run `verify_native.py` against the saved readback and scenario log; inspect every tab in the authenticated native UI. Check Drive metadata for native MIME type, correct parent and owner-only permissions.

Platform differences: LibreOffice normalizes formula references and number formats without changing the tested meaning. Google import retains all eleven validations, but whole-number validation is represented as a numeric range; integer/date formula guards remain decisive. Its date-validation limits are localized strings. The bundled artifact evaluator does not implement HYPERLINK: the actual formulas/labels are verified in Calc and native Sheets, and render-only copies use friendly labels. No Microsoft Excel application test was performed. All dates are date-only serials; there are no time-zone-sensitive formulas. Post-import edits matched the controlling text/layout, including the added conditional-backstop row, and were read back; no financial formula was substituted with a pasted result.

## Guidance, scope and provenance

On November 6, Codex retrieved through GitHub **AGENTS.md, CLAUDE.md, operating-playbook.md, the Applied Strategy Standard, Presentation Standard v2, Exhibit and Chart Rules, and Editorial Authenticity & Visual Integrity** at starting live main `fe1d5b3b2fd9ef99018fe2be6b032466b69c5771` and PR head `c1a700a1713e5300ee7506d418fae566e26e822a`. All seven matched exactly at those starting references. Before delivery, main advanced to `b7e67994de5ac96bc7fa9a1cf8ef823eb1b420fc` through PR #213. The seven guides were retrieved through GitHub again: only AGENTS.md changed, adding the website editorial/interface rule. That rule was read and applied to new public notes; the approved upstream copy changes were merged intact and checks rerun. The linked research-publication house style and FI002 financial-model specification were also consulted through GitHub. No separate overriding FI003 modeling guide was found in those references.

For the working-model phase, the seven guides were retrieved through GitHub again at reviewed head `66e42a4` and live main `677da73`; all seven matched. The linked publication house style and FI002 model specification were reread through GitHub. Main’s later PR #216 editorial changes were integrated intact; no new corpus or site feature work belongs to this phase. Financial formula colors are functional workbook conventions; the written-publication palette and slide typography remain format-specific.

Before delivery, main advanced to `bb0934b87cc257032fe79e92e500ebfe928a2a1e` through PR #218. The seven guides were retrieved through GitHub again: Presentation Standard v2.1 and the editorial-integrity standard now specify Archivo for future decks. Those upstream assets and changes were integrated intact. The exhibit specification follows Archivo; the editable financial workbook uses the documented Arial spreadsheet convention. This phase produced no deck or publication asset.

The newer presentation rule’s **20-slide total cap**, including appendices, governs over the earlier Applied Strategy wording about a main-deck ceiling. Presentation Standard v2.1’s **Archivo** replaces the earlier Georgia/Source Sans 3 pairing for future decks; the house style’s single sans family governs its named written formats. No conflict requires changing source facts. The user explicitly authorizes this branch’s scoped commit/push; CLAUDE’s separate integration-branch rule concerns tooling integration, outside this task. No PR merge, deployment, public release, external message or human approval is inferred.

The initial foundation used standards from the FI002 branch because its first checkout predated their arrival on main; they are now verified on main and the PR. The existing foundation branch/worktree remains canonical. The attached older FI003 checkout, unrelated untracked screenshots and other worktrees are preserved. The globally referenced RTK.md remains unavailable at the assigned checkout; no missing instructions were invented.

The added candidate task first reviewed existing MP event, source, finance and project records. The current candidate disposition and schema limits are recorded in PUBLICATION_PLAN and VERIFICATION. Private candidate payloads remain in the documented candidate workflow; analytical calculations remain here. Benjamin explicitly approved all three concrete packages; the admitted public seed changes are in this draft PR. Public release remains separately gated.

Benjamin retains major methodological, editorial and publication decisions. Jiho’s prospective independent challenge is pending and does not block research preparation. This packet is Codex-assisted research and makes no claim of Jiho’s findings or approval.
