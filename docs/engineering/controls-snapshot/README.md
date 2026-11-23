# SMPT Controls snapshot

The snapshot packages the public SMPT control clauses, their dated status evidence and the documents behind them. Use it to count restrictions across the covered corpus and trace a material-and-destination match back to the relevant clause and source.

## Build and import

From a checkout of the snapshot generator, install the locked dependencies with `npm ci` and run:

```sh
output=$(mktemp -d)
npm run snapshot:controls -- "$output/controls"
python3 "$output/controls/worked_example.py"
```

The generator requires a new output directory whose parent exists. It uses the existing public JSON export builder without fetching sources or consulting the wall clock. Archive the entire directory with its manifest. The included Python example reads only that directory and uses the standard library. It verifies file checksums, keys, joins and status boundary cases before printing its results.

`manifest.json` records the schema version, the source dataset version, the legal-status cutoff (`asOf`), and each dataset's row count and SHA-256. The dataset version combines the schema version, cutoff, and a digest of the dataset entries in the manifest. The same inputs produce the same files. `asOf` is SMPT's legal-status cutoff, and individual source publication and access dates remain in the source records.

To verify reproducibility:

```sh
npm run snapshot:controls -- "$output/rebuild"
diff -r "$output/controls" "$output/rebuild"
```

## Data dictionary

Each dataset is a UTF-8 JSON array of objects. Arrays preserve typed lists and evidence locators. Dates use `YYYY-MM-DD`. A missing optional field or `null` means no value was supplied. Empty arrays mean no values were coded for that field. Use IDs for joins and document labels for display.

| Dataset | Row key | Joins and interpretation |
| --- | --- | --- |
| `control-clauses.json` | `id` | `eventId` and each `legalBasisEventIds[]` entry join to `policy-events.id`. `modifiesMeasureIds[]` joins back to `control-clauses.id`. `evidence[].sourceId` joins to `sources.id`. |
| `policy-events.json` | `id` | Each `sourceIds[]` entry joins to `sources.id`. `supersededByEventId` is a nullable self-join. The subset covers parent events, legal-basis events, events sharing status citations, and their linked successors. |
| `control-status-history.json` | `(measureId, sequence)` | `measureId` joins to `control-clauses.id`, and `sourceId` joins to `sources.id`. Match the same source in the clause's `evidence[]` where `supports` includes `status` to get the pinpoint and evidence strength. Sequence is the zero-based order within the bundled history. Use it within the snapshot, since historical backfill can shift positions. |
| `sources.json` | `id` | Cited documents only. Includes `title`, `publisher`, `url`, `language`, `datePublished`, `dateAccessed`, `sourceType` and `confidence`. Use `sourceType: official` and `confidence: primary` to identify official primary documents. |

**Clauses.** `issuer` copies the parent jurisdiction. `direction` describes the regulated flow, and `measureType` gives the legal mechanism. `clause` is the source's provision label when available. `targetScopes` describes which dimensions apply. `targetJurisdictions` contains ISO alpha-2 destination codes for named targets. `targetEntities`, `targetEndUsersAsStated` and `targetEndUsesAsStated` carry additional conditions. Use the item description and any parameters in `productScopeAsStated` alongside `productCodes`, whose entries contain `system`, `code` and `role` (`reference` or `legal_scope`). `controlledItemTypes` and `controlledStages` describe the items and supply-chain stages.

`materialIds` are SMPT material keys usable directly for grouping. `materialAttribution` distinguishes `tracked_only`, `includes_untracked` and `not_stated`. `untrackedMaterialsAsStated` preserves names outside that taxonomy. `legalBasisAsStated` and `modifiesExternalInstruments` are descriptions with no guaranteed ID join. Each `evidence[]` entry supplies `supports`, `evidence` (`explicit` or `ambiguous`), `locator` and optional `note`. The clause can also have its own `notes`.

**Events.** `date` is the corpus event date and can be the announcement or operative date. The dated history supports the clause's effective date. `jurisdiction`, `issuingBody`, `documentNumber` and `documentLabel` identify the document. The label uses the full English title, which distinguishes No. 58 of 2025 from No. 58 of 2026. `titleOriginal`, `titleOriginalLang` and `titleEnSource` preserve title provenance. `verificationStatus` is the corpus's `verified` or `provisional` standing. `policyStatus`, `mechanism` and `affectedMaterialIds` describe the event at instrument level. An event sharing a status source can provide context for a change. A shared citation alone cannot establish an amendment or its scope.

**Status history.** `status` is the recorded state, `date` starts that entry, and `until` is its stated inclusive end when supplied. `note` can carry a qualification about the date or legal reading. For a date within the cutoff, use the last applicable history entry in sequence and check its end. A later dated entry wins from its start date. Before any dated entry, coverage is unresolved. An undated entry after a dated one leaves the timing unresolved until a later dated entry applies. A passed end with no applicable replacement gives an unresolved post-window status. The stated end boundary can be tested from the retained source record, even when it falls after the cutoff. Queries for legal standing stop at the cutoff.

## Worked result

**Introduced during a period** means the first dated `in_force` entry for a restriction clause falls within the inclusive window. The example selects verified events, export and re-export directions, and the types `export_licensing`, `export_prohibition`, `extraterritorial_licensing`, and `end_use_restriction`. A planned measure can be issued within the period and have no first effective date. The filter excludes suspensions, decontrols, investigations and customs enforcement measures. Later resumption cannot qualify as a second introduction of the same clause.

From **2025-01-01 through 2026-11-12**, the example finds **11 distinct clauses under four instruments**. The script lists the IDs and citations and groups the clause counts by issuing jurisdiction, material and measure type. A clause can appear in several material groups, so count distinct clause IDs for the total. The instrument denominator is distinct parent event IDs. Of the 11, **eight clauses under the same four instruments** have explicit official primary status evidence. The other three No. 61 clauses have an inferred start date flagged as ambiguous in the codings. [MOFCOM No. 61 of 2025, Item 8](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_7fc9bff0fb4546ecb02f66ee77d0e5f6.html)

**In force on a date** uses all applicable historic clauses, even those first effective before 2025. The graphite-to-US query counts coded material matches with a matching named or worldwide destination, no additional coded target condition, and a dated `in_force` entry with explicit official primary support. The match covers the items specified by the clause. Shipment-level applicability still depends on the product and conditions in the source.

| Query date | Clauses | Instruments | Included clause IDs and sources |
| --- | ---: | ---: | --- |
| 2025-11-08 | 2 | 2 | `ctl-cn-graphite-2023-export-licensing` and `ctl-cn-us-2024-graphite-end-use-review`. [MOFCOM and GACC No. 39 of 2023](https://aqygzj.mofcom.gov.cn/qdml/art/2023/art_28aca48820d94a1ca822047d6716c1d6.html), [MOFCOM No. 46 of 2024](https://www.mofcom.gov.cn/zwgk/zcfb/art/2024/art_3d5e990b43424e60828030f58a547b60.html) |
| 2025-11-09 | 1 | 1 | `ctl-cn-graphite-2023-export-licensing`. [MOFCOM and GACC No. 39 of 2023](https://aqygzj.mofcom.gov.cn/qdml/art/2023/art_28aca48820d94a1ca822047d6716c1d6.html), [MOFCOM No. 72 of 2025](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_5c68985a6b1a46778e2e8dbff1bb1601.html) |
| 2026-11-12 | 1 | 1 | `ctl-cn-graphite-2023-export-licensing`. [MOFCOM and GACC No. 39 of 2023](https://aqygzj.mofcom.gov.cn/qdml/art/2023/art_28aca48820d94a1ca822047d6716c1d6.html), [MOFCOM No. 72 of 2025](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_5c68985a6b1a46778e2e8dbff1bb1601.html) |

- **The two No. 58 announcements.** The 2025 instrument scheduled graphite anode licensing for 8 November 2025. No. 70 suspended it from 7 November, and No. 58 of 2026 continued the suspension from 11 November 2026 through 10 January 2027. The example checks both sides of each boundary. After the stated end, the exported evidence cannot establish resumption. [No. 58 of 2025](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_79646f0161564975a938fe00fee158d5.html), [No. 70 of 2025](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_b1ec77dd3f0d4762952904df7cdaadec.html), [No. 58 of 2026](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_91466027f465467985942a639a9485f4.html)
- **The partial suspension.** No. 72 of 2025 suspended only item 2 of No. 46 of 2024 through 27 November 2026. In the snapshot, precisely two clause histories change on 9 November 2025, `ctl-cn-us-2024-gallium-germanium-antimony-denial` and `ctl-cn-us-2024-graphite-end-use-review`. Item 1, `ctl-cn-us-2024-military-end-use-ban`, stays in force with additional end-user and end-use conditions and no material tags. It remains outside the graphite count. No. 72 is cited by the affected histories on main. Its standalone event is under separate review. The partial suspension and the No. 58 continuation contribute zero new restrictions. [No. 46 of 2024](https://www.mofcom.gov.cn/zwgk/zcfb/art/2024/art_3d5e990b43424e60828030f58a547b60.html), [No. 72 of 2025](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_5c68985a6b1a46778e2e8dbff1bb1601.html), [PR #283](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/283)

## Coverage gaps for the next phase

- The snapshot contains the public, selective corpus. Missing rows and material tags cannot establish that a jurisdiction, material or destination is unrestricted. Unreviewed candidates are absent, provisional event records retain their flag, and ambiguous evidence stays attached to the corresponding field. The import reports unresolved material or destination scope separately from coded matches. Treat country and material counts as counts of the curated records.
- Seven superhard-material clauses under No. 55 of 2025 contain dated status and source links for both suspensions. Both suspension records still name No. 55 in `modifiesExternalInstruments` and omit its clause IDs in `modifiesMeasureIds`. Follow the status citations for these clauses. The next data review can reconcile the relationship fields. [No. 70 of 2025](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_b1ec77dd3f0d4762952904df7cdaadec.html), [No. 58 of 2026](https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_91466027f465467985942a639a9485f4.html)
- The No. 61 effective dates marked ambiguous, broad end-use terms, untracked materials, and source-specific product parameters require review before use in transaction screening. Many clause records cover multiple sub-items. Counts describe coded clauses and their parent instruments, with no denominator for legal sub-items or products. Preserve reference codes as reference codes. [No. 61 of 2025](https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_7fc9bff0fb4546ecb02f66ee77d0e5f6.html)
