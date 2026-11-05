# Hemerdon financial intelligence — Phase 1A

Research cutoff: **4 November 2026**. Research draft for review, outside the website build and publication pipeline. Source corpus base: `2286648f3bbb699eee5b6171f334792ffa2d545d`. Existing dossier R001 has its own 3 November cutoff, which this case does not change.

The defensible output is a partial financial model: historical reconciliation, financing status, original August-plan receipt/timing sensitivities, remaining capital guidance, incremental funding stresses and FY2028 tungsten revenue coverage. Current cash, a complete remaining funding gap, independent NPV/IRR and lender DSCR remain unavailable. The final register contains 147 claims/inputs and 12 sources.

| Deliverable | File |
|---|---|
| Capability audit | [capability-audit.md](capability-audit.md) |
| Source register | [sources.json](sources.json) |
| Classified claims and inputs | [evidence.json](evidence.json) |
| Claim-to-source matrix | [claim-source-matrix.csv](claim-source-matrix.csv) |
| Editable model | [hemerdon-financial-model.xlsx](hemerdon-financial-model.xlsx) |
| Generator and dependency | [model.py](model.py), [requirements.txt](requirements.txt) |
| Engine verification | [verify.mjs](verify.mjs), [model-results.json](model-results.json) |
| Financial assessment | [financial-assessment.md](financial-assessment.md) |
| Architecture proposal | [architecture-proposal.md](architecture-proposal.md) |
| Quality control | [quality-control.md](quality-control.md) |
| Next-phase handoff | [next-phase-handoff.md](next-phase-handoff.md) |

## Reproduce the model without retrieving sources again

Requires Python 3.10+ and `openpyxl==3.1.5`. Use a virtual environment or the Codex bundled Python. These commands run from this directory:

```sh
python -m pip install -r requirements.txt
python -m unittest discover -s . -p 'test_*.py' -v
python model.py
```

`evidence.json` and `sources.json` are the curated source of truth. The generator validates them, writes the CSV matrix and produces formulas and formatting. Excel is set to recalculate on opening. The generator does not retrieve live data or amend published seeds. A standalone Python generation leaves formula caches for Excel to calculate; the delivered file additionally has cached results from the separately executed engine verification.

To repeat that verification, make `@oai/artifact-tool` available to Node in a temporary runtime directory, copy `verify.mjs` there, and run it with the absolute workbook path as its argument. This session used the Codex dependency loader, a temporary `node_modules` symlink to the bundled library, and bundled Node v24.22.1. The verifier changes and restores inputs, recalculates, exports the verified workbook and writes `model-results.json` beside it. `HEMERDON_QA_DIR` sets the preview directory; default `/tmp/smpt-hemerdon/qa`. Native Excel execution remains a next-phase check.

## Refresh and rights

Add a new source ID for a changed document, retaining publication, reporting and retrieval dates, locator and rights. Resolve each input by stable `hfi-*` ID. Do not refresh an old value in place while retaining its original date. PDF hashes identify downloaded bytes, not permission to redistribute or proof of every extraction.

Raw issuer PDFs and RNS text are not included. In particular, the AMC executive summary contains an explicit consent requirement. Its metadata and rights are indexed; its tables are not used as model input. Obtain the necessary rights before a public memo or presentation reuses protected material.

The files here are research artifacts. They do not represent maintainer approval to promote seed records, alter the public corpus date, publish, deploy, or send a memo to anyone.
