# Issue #235 — MOFCOM/GACC No. 55 (2025) source adjudication

Research cut: 2026-11-11. Draft; requires maintainer review before corpus admission.

## Official primary text

- [No. 55, issued 2025-10-09](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_949f47563b834dad95b0010f375a892c.html): six item clauses, licensing paragraph, customs paragraph, announced effective date 2025-11-08.
- [No. 70, issued 2025-11-07](https://www.mofcom.gov.cn/zcfb/blgg/gg/2025/art/2025/art_da147202d0934ddebe252772e95ed7b3.html): No. 55 suspended from issuance through 2026-11-10, preceding its announced effective date.
- [No. 58 (2026), issued 2026-11-09](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_91466027f465467985942a639a9485f4.html): continued suspension 2026-11-11 through 2027-01-10.
- [No. 46 (2024), paragraph 2](https://www.mofcom.gov.cn/zwgk/zcfb/art/2024/art_3d5e990b43424e60828030f58a547b60.html): separate U.S.-destination presumption of licence denial for gallium, germanium, antimony, superhard materials; graphite subject to stricter end-use review.
- [No. 72 (2025)](https://www.mofcom.gov.cn/zcfb/dwmygl/art/2025/art_23fd9e81b68646d390baef0a888261fc.html): suspends No. 46 paragraph 2 from 2025-11-09 through 2026-11-27. It does not suspend No. 46 paragraph 1.

## Clause-level intake specification

| No. 55 clause | Control code | Original scope / parameters | Reference customs code |
| --- | --- | --- | --- |
| 1 | 2C902.a | Synthetic-diamond micropowder, mean particle size <= 50 μm | 71051020 |
| 2 | 2C902.b | Synthetic-diamond single crystals, > 50 μm and <= 500 μm; excludes lab-grown diamonds for decoration/jewellery | 71051020 |
| 3 | 2C902.c | Synthetic-diamond wire saw meeting **all three**: wire diameter <= 45 μm; mean diamond grain <= 8 μm; breaking tensile force <= 16 N | — |
| 4 | 2C902.d | Synthetic-diamond grinding wheel meeting **all three**: diamond tooth hardness <= 30 HRB; mean diamond grain <= 5 μm; maximum operating speed >= 40 m/s | 68042110 |
| 5 | 2B005.b | Direct-current arc plasma jet chemical-vapour deposition (DCPCVD) equipment | 84798999 |
| 6 | 2E902 | DCPCVD process technology | — |

No. 55 also contains a general licensing paragraph and a separate customs-declaration/enforcement paragraph. The customs paragraph requires controlled goods to be declared as dual-use with control code; close-but-uncontrolled goods must carry a declaration of noncoverage and relevant parameters. The source states that customs may question the declaration and withhold release pending inquiry. This is a seventh potential control row, distinct from the six listed items.

## Proposed schema interpretation

- Create `src-mofcom-55`, `evt-cn-mofcom-55-2025`, six item-specific `export_licensing` controls and one `customs_enforcement` row, matching the existing No. 56 pattern.
- No. 55 superhard materials are outside the current named materials taxonomy. Use `materialIds: []` and `materialAttribution: includes_untracked`, with explicit `untrackedMaterialsAsStated` (compare existing `ctl-cn-antimony-2024-superhard-licensing`). Do not attribute to antimony or other tracked materials.
- For each control, record a `scheduled` status dated 2025-10-09 with announced commencement 2025-11-08, then `suspended` from 2025-11-07 to 2026-11-10 under `src-mofcom-70`, then `suspended` from 2026-11-11 through 2027-01-10 under `src-mofcom-2026-58`. The scheduled record is not proof of any interval in force. Include precise item and operative-sentence evidence locators.
- Keep the U.S.-destination No. 46 paragraph 2 suspension separate. Existing `ctl-cn-us-2024-gallium-germanium-antimony-denial` already captures untracked superhard materials and the `src-mofcom-72` suspension; do not copy its status into No. 55 controls.

## Reviewer decision and remaining verification

Confirm whether the general licensing paragraph merits an additional standalone control row or is adequately expressed by the six item rows. The customs paragraph is distinct. Verify the exact `controlledItemTypes` and `controlledStages` taxonomy; do not invent physical production stages from the item names. Then implement in the three seed JSON files, run `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` in a proper repository checkout. No tests were run for this research-only checkpoint. No authoritative data rows, legal status, website or FI003 files were changed.

## 12 November 2026 implementation review — branch only

The original MOFCOM No. 55 text, No. 70 (2025), and No. 58 (2026) were independently reread against the proposed records. This checkpoint documents a source comparison and code corrections; it is **not** a human legal/editorial attestation or authorization to publish.

- The branch contains one official source, one policy event, six item-specific export-licensing controls and one separate customs-enforcement control. The six items are 2C902.a, 2C902.b, 2C902.c, 2C902.d, 2B005.b, 2E902. The general licensing sentence applies to the six listed items; **review recommendation:** do not create a duplicative eighth licensing row unless the independent reviewer identifies separate operative scope. Keep the customs declaration paragraph as the seventh row.
- The exact Chinese title in both the event and source records was corrected to match the original instrument: “商务部 海关总署公告2025年第55号 公布对超硬材料相关物项实施出口管制的决定” (the original has no “部分”).
- Each of the six item rows now cites `item_scope` from No. 55, as required by `CONTROL_FIELD_EVIDENCE`. Classification: four item rows are goods, one is equipment and one is technology; no unsupported physical supply-chain stages are asserted. The customs clause defines declaration/enforcement rules rather than item categories, so its item-scope array remains empty.
- The source-linked chronological entries remain scheduled 2025-10-09 (announced start 2025-11-08), suspended from 2025-11-07 through 2026-11-10, then continuously suspended from 2026-11-11 through 2027-01-10. No in-force interval is asserted, and no later resumption is inferred. The U.S.-destination paragraph in No. 46 (2024) and its No. 72 suspension remain separate.
- New regression coverage: `tests/mofcom-55-data.test.ts` checks original-title provenance, seven-row identity and classification, same-source item-scope evidence, and status selection on the critical dates. This supplements, rather than replaces, the full data validator.
- **Outstanding before merge:** independent human review of classifications and legal chronology; full CI (`npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`), any branch integration regressions, and explicit authorization of the corpus publication revision. No source content, scope or legal status is authorized merely by these machine-side corrections.
