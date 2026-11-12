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


## 12 November 2026 original-source editorial adjudication — PASS for source classification

**Review scope and authority.** This review was conducted with AI assistance in response to the maintainer's request to review and sign off on the No. 55 records. All five official Chinese texts were opened and inspected directly, rather than relying on summaries. **Decision: PASS for source transcription, clause classification, translation anchor and recorded legal chronology.** This is an editorial source-review finding, not a legal opinion, a claim that an independent human lawyer reviewed the translations, or authorization to alter the published corpus cutoff. The maintainer's release decision remains separate.

**Original government pages read (12 November 2026):**
- [2025 No. 55 — original announced restrictions](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_949f47563b834dad95b0010f375a892c.html)
- [2025 No. 70 — suspension from 7 November 2025 through 10 November 2026](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_b1ec77dd3f0d4762952904df7cdaadec.html)
- [2026 No. 58 — continuing suspension 11 November 2026 through 10 January 2027](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_91466027f465467985942a639a9485f4.html)
- [2024 No. 46 — distinct U.S.-destination restrictions, paragraph 2](https://www.mofcom.gov.cn/zwgk/zcfb/art/2024/art_3d5e990b43424e60828030f58a547b60.html)
- [2025 No. 72 — suspends only paragraph 2 of No. 46 through 27 November 2026](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_5c68985a6b1a46778e2e8dbff1bb1601.html)

### Independent cross-check against the primary No. 55 text

| Clause and record | Exact controlling facts | Adjudication |
| --- | --- | --- |
| 1 / 2C902.a | Artificial-diamond micropowder with average grain diameter <=50 μm; reference customs heading 71051020 | PASS — goods |
| 2 / 2C902.b | Artificial-diamond single crystal average diameter >50 and <=500 μm; excludes cultivated diamonds for decoration and jewellery; 71051020 | PASS — goods, express exclusion retained |
| 3 / 2C902.c | Artificial-diamond wire saw meeting **all**: wire diameter <=45 μm, diamond average grain <=8 μm, break force <=16 N | PASS — goods, conjunctive tests retained |
| 4 / 2C902.d | Artificial-diamond grinding wheel meeting **all**: diamond-tooth hardness <=30 HRB, diamond grain <=5 μm, maximum operating speed >=40 m/s; reference 68042110 | PASS — goods, conjunctive tests retained |
| 5 / 2B005.b | DCPCVD apparatus; reference heading 84798999 | PASS — equipment |
| 6 / 2E902 | DCPCVD process technology | PASS — technology |
| Customs declaration paragraph | Covered goods require the dual-use declaration/code; close-but-uncontrolled items require a noncoverage declaration with technical parameters; customs may withhold release while questioning a declaration | PASS — distinct customs enforcement row |

The general export-licensing paragraph applies to the **six enumerated item clauses** and adds no separate controlled-item scope. **Seven rows are approved, not eight**; an eighth licensing row would duplicate the existing clause coverage. These requirements are general export-item rules, not limited by the source to U.S. destinations. Customs/HTS reference codes remain reference fields rather than legal control identifiers; the six numbered 2C/2B/2E codes are the controlled-item codes.

**Source fields:** Chinese title and national-security/non-proliferation quotation match No. 55 verbatim. The English quotation is correctly marked a nonofficial translation. For this corpus, no named taxonomy material is assigned: `materialIds: []`, `materialAttribution: includes_untracked` and the original untracked material phrase are appropriate. `controlledStages: []` avoids inventing a production-stage claim. The national-security and compliance/non-proliferation framing matches the existing No. 56–58 quoted classification precedent; this is attribution of the issuer's stated rationale, not an assertion of policy effect.

**Dates/status:** No. 55 was issued 2025-10-09, with commencement announced for 2025-11-08. No. 70 suspended the instrument beginning 2025-11-07 **before commencement**, inclusive through 2026-11-10. No. 58 of 2026 continued suspension 2026-11-11 through 2027-01-10, with no intervening day in force. The scheduled entry therefore must never be treated as proof of effective controls. No. 46 (2024), paragraph 2, and No. 72 (2025) remain a separate U.S.-destination legal sequence. No. 72 leaves paragraph 1 of No. 46 untouched. Neither source supplies a basis to infer what will happen after the currently announced suspension end.

### Release boundary: source review passes; publication admission is separate

- The branch's source access and event verification dates are both **2026-11-11**, later than `site.lastUpdated=2026-11-08` (the last approved, frozen research corpus release). Historical tests deliberately exclude the pending No. 55 records when reconstructing that frozen release. **Those test exclusions are not publication authorization.**
- The site control-status date is independently `site.legalStatusAsOf=2026-11-09`; the No. 55 No. 58 suspension takes effect **2026-11-11**. A release must decide whether to advance and verify the applicable publication metadata or explicitly disclose this as a subsequent admission, without silently rewriting an earlier corpus snapshot.
- CI passing confirms schema, tests and build; it does not constitute legal review. Marking the draft pull request ready for review may proceed on this source PASS, but **do not merge or deploy before the maintainer explicitly accepts the dated corpus-admission decision**. An independent qualified legal reviewer may additionally be warranted before presenting the tracker as compliance advice.

**Editorial disposition:** No factual correction to the seven source-backed controls was needed after this primary-text comparison. Approved for PR review, subject to the dated publication-release gate above.