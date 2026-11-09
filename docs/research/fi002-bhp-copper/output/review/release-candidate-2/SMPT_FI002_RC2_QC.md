# FI002 executive deck — release candidate 2 quality-control record

- **Publication / version:** SMPT Financial Intelligence 002, *Goldman Sachs' Copper Outlook and BHP's $6 Billion Escondida Decision*, executive deck release candidate 2 (RC2). It is a candidate only. Nothing is live, and no human has approved it.
- **Derived from:**
  - **Editorial baseline:** RC1, archived unchanged in [`../release-candidate-1/`](../release-candidate-1/) with its own [QC record](../release-candidate-1/SMPT_FI002_RC1_QC.md).
  - **Source deck:** RC2 is built from revision 5, which is saved in [`../revision-5/`](../revision-5/). Revision 5 is the revision-4 spec with the three corrections below.
  - **Release step:** RC2 then goes through the same step that turned revision 4 into RC1.
  - **Historical hashes:** revision 4, RC1 and revision 5 were re-hashed after RC2 was built, and none of them changed.
- **Builder:** [`release/make_release_candidate.py --candidate rc2`](../../../release/make_release_candidate.py). The `rc1` entry is unchanged.
- **Research cutoff:** 5 November 2026, unchanged. RC2 changes no findings, sources, evidence references or figures.

## Files

| File | Path (from `docs/research/fi002-bhp-copper/`) | SHA-256 |
| --- | --- | --- |
| Editable deck | `output/review/release-candidate-2/SMPT_FI002_BHP_Copper_Strategy_Deck_RC2.pptx` | `fcadecae7053fe490ec8adf5be796f1c2847d990ef140e0f39807c99fd8cd8f5` |
| PDF | `output/review/release-candidate-2/SMPT_FI002_BHP_Copper_Strategy_Deck_RC2.pdf` | `599e5502ee7af5159a017e83d6103d84ff484ec5e963a3cc221fb613100f1ede` |
| Contact sheet | `output/review/release-candidate-2/SMPT_FI002_RC2_contact_sheet.png` | `750c7343d4d8e09a5e5e5f28fca57418940c11f56f88e8c86e9c34aa0bcacf3e` |
| Manifest | `output/review/release-candidate-2/SMPT_FI002_BHP_Copper_Strategy_Deck_RC2.manifest.json` | `28d4e494e20f19116225981c25b58f914b4f9dd3ec6a9d694c30c0f408170afe` |
| Slide renders | `output/review/release-candidate-2/renders/slide-01.png` to `slide-11.png` | listed in the manifest |
| Revision 5 spec | `output/review/revision-5/SMPT_FI002_BHP_Copper_Strategy_Deck_rev5.spec.json` | `7b07df249f5b8b0ecec82b375534ac8cbc26c02f3a0602fd3807933285da1a6c` |
| Revision 5 PPTX (draft badge kept) | `output/review/revision-5/SMPT_FI002_BHP_Copper_Strategy_Deck_rev5.pptx` | `071a67e82a2fcb3b0031ad18ce1c2ec93127d8e8d77496e70cd31e6c3ca483b6` |
| Revision 5 PDF | `output/review/revision-5/SMPT_FI002_BHP_Copper_Strategy_Deck_rev5.pdf` | `2e449d0c86262d7036b4b516846d041cb3674a215d7e5e7cb4441936c6623109` |
| Revision 5 manifest | `output/review/revision-5/SMPT_FI002_BHP_Copper_Strategy_Deck_rev5.manifest.json` | `dab173b66cb7a400e71623f79ef06dde47868c809c7200b61daa25d98cad61f8` |

## What changed from RC1

Only slides 2, 6 and 11 change. Each keeps its source line and evidence references.

| Slide | RC1 | RC2 |
| --- | --- | --- |
| 2 title | "Goldman's revision is worth about $2.8bn on BHP's own FY2026 sensitivity" | "Goldman's $1,600/t revision implies a $2.83bn FY2026-static EBITDA sensitivity" |
| 6 title | "A guidance-volume proxy puts the FY2027 effect near $2.27bn" | "A FY2027-volume proxy yields a smaller $2.27bn EBITDA illustration" |
| 11 exhibit | Decision tree with connectors, Yes/No/Not shown branch labels, a path legend and a "Rounded boxes…" key | Four rows, one per timing action, each giving the evidence that action would need. "Maintain funded pre-FID readiness" comes first as the supported position, marked with an accent rule. The three alternatives follow: accelerate selected preparatory work; accelerate major construction, which needs an annual operating plan showing unavoidable retirement losses worth more than the acceleration premium and added execution risk, plus approved permits, safe interfaces, supplier availability and a costed schedule; and stage, re-scope or defer. |

The two title changes use the brief's wording. Both say "sensitivity" or "illustration" and give the volume basis, so neither figure reads as realized or forecast earnings.

Slide 11's subtitle is now "Timing actions and the evidence each would need; the first is the supported position". The rows exhibit:
- keeps the three alternatives to readiness and what each would need;
- keeps the caveat that construction timing cannot be ranked without BHP's with-build/no-build operating plan;
- has no legend, connectors, branch labels, decorative boxes or new category headings.

All other slides match RC1 text for text. The RC1 release step is applied unchanged:
- the badge and cover notice are removed;
- the renderer labels are removed from the speaker notes;
- the master and theme fonts are mapped to Archivo.

**Renderer change.** The `condition-tree` exhibit has a new opt-in `form: "rows"`.
- **Notes:** each outcome must carry a `note`. The `rows-note` and `cell-length` rules enforce this, with a 230-character limit.
- **Output:** it draws a native, editable table with the highlighted outcome first, and no legend or connectors.
- **Default:** the tree form is unchanged.

`tests/exhibit-research.test.ts` asserts the following:
- an invalid form is rejected;
- a missing note is rejected;
- notes are rejected in tree form;
- rows output has no connectors or legend;
- rows output is a native table;
- the highlighted outcome comes first;
- the tree form still draws its legend and branch labels.

## Verification

| Check | Result |
| --- | --- |
| Strict exhibit review (`exhibits:review --strict`, rev5 spec) | 0 hold, 0 review, 0 info. Mix: 4 Comparison, 3 Lookup and decision, 2 Reconciliation, 1 Structure. |
| Spec diff, rev4 → rev5 | The evidence list is identical. Only slides 2, 6 and 11 differ. The classification, `plain_frame`, title and cover lines are equal. |
| Numbers | Slide 2: 15,400 − 13,800 = $1,600/t; 1,600 ÷ 22.0462 = 72.575 c/lb; × $39m per c/lb = $2,830.4m, which rounds to $2.83bn. Slide 6: 1.575 Mt × 0.95 × 1,600 = $2,394m; × 0.95 = $2,274.3m, which rounds to $2.27bn. This matches Methodology line 36. |
| PDF text, RC1 vs RC2 | Only pages 2, 6 and 11 differ, as listed above. No "DRAFT" or "REVIEW GATES" text appears. "5 November 2026" appears on the cover as before, and the with-build/no-build caveat is on page 11. |
| PDF export | LibreOffice, headless, with the Archivo TTFs in the temporary profile, as for RC1. |
| Font embedding (`pdffonts`) | All 11 fonts are Archivo Regular or Bold, embedded and subset. No Liberation Sans, Arial or Calibri. |
| PDF properties (`pdfinfo`) | Tagged: yes. 11 pages. Same document title as RC1. |
| Visual inspection | All 11 slides and the contact sheet were inspected. There is no badge, internal label, overflow, overlap or clipping. Slide 11's rows sit clear of each other with no crossing lines. |
| `verify_editability.py`, structural tier | Run against the rev5 element manifest. The only flags are the intended removals: `frame:draft-badge` on slides 2–11 and `frame:cover-notice` on slide 1, each reported as "research draft badge absent". The CLI exits 0 on the rev5 deck, which still has its badge. |
| `verify_editability.py`, LibreOffice tier | PASS. The PDF has 11 pages, the re-saved PPTX keeps all 5 native chart parts, and there are 0 raster `p:pic` elements. |
| PowerPoint tier | Not run. Microsoft PowerPoint is not installed on this machine. A manual open, Edit Data and save test is still outstanding. |
| Source links | No sources or URLs changed since RC1. The 9 Nov 2026 browser check recorded in the RC1 QC record (all 6 BHP URLs load) still covers them. They were not re-checked. |
| Repository gates | `npm run validate`, `npm run lint` (0 errors), `npm run typecheck`, `npm test` (1145/1145), `npm run build` and `npm run exhibits:build` each exited 0. The tracked gallery files are unchanged. |

### Notes for the human reviewer

- **Slide 11 overlap (raised in RC1): resolved.** The tree and its connectors are replaced by rows.
- **Stale metadata, carried over from RC1:** `docProps/app.xml` still lists Arial and Calibri in its font summary. The slides do not use them, and PowerPoint rewrites this field on save.

## Google Drive review copies: BLOCKED

Nothing was uploaded, for the same reason as RC1. The Drive connector in this session cannot see the FI002 folder `1gSNclpsNdzgCbGy3EaQDqsV_NOUrI8Zf`. The brief requires `ben.yang@gwmail.gwu.edu` and forbids a personal account. Once the connector uses the university account, upload the PPTX, PDF and contact sheet under the RC2 filenames, alongside the existing files and without overwriting them.

## Release decision

- **Agent assessment:** READY FOR HUMAN INSPECTION OF THE EXACT CANDIDATE FILES
- **Unchanged:**
  - the website;
  - the public downloads;
  - the live 12-slide deck in `output/`;
  - the current Drive presentation;
  - the revision 4 and RC1 archives.
- **Human editorial approval (name/date/version):** PENDING
