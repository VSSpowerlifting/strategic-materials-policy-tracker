# Importing the Stratellar Controls feed

Use a release directory to answer a dated question, keep the release that produced the answer, and compare it with a later directory after a correction or amendment. The pilot covers China’s US-specific dual-use provisions, their worldwide graphite context and a separate six-instrument suspension. The candidate is available for local review. The existing [public research ZIP](../controls-snapshot/README.md) is the source for the historical baseline.

## Reproduce both releases

From a clean checkout with Node 20.9 or later, npm, Git, tar and Python 3.9 or later, run the following in one shell. The pinned commit must be available locally for the archive rebuild. Build output and the import database go into a temporary directory.

```sh
npm ci
out=$(mktemp -d)
npm run feed:controls:verify-baseline -- --from-git --write "$out/archive"
python3 "$out/archive/2026-11-12/worked_example.py"
npm run --silent feed:controls -- build --out "$out/base" --curated-on 2026-11-27
for name in candidate repeat; do
  npm run --silent feed:controls -- build --out "$out/$name" --curated-on 2026-11-27 \
    --overlay research/controls-review/rc-cn-mofcom-59-2026.json --previous "$out/base"
done
diff -r "$out/candidate" "$out/repeat"
npm run --silent feed:controls -- verify "$out/candidate"

consumer=docs/engineering/controls-feed/consumer.py
for name in base base candidate; do
  python3 "$consumer" load "$out/$name" --db "$out/feed.db"
done
base=$(node -p 'require(process.argv[1]).releaseId' "$out/base/manifest.json")
next=$(node -p 'require(process.argv[1]).releaseId' "$out/candidate/manifest.json")
python3 "$consumer" diff --db "$out/feed.db" --from "$base" --to "$next"
python3 "$consumer" query --db "$out/feed.db" --release "$base" --issuer china \
  --material graphite --destination US --on 2025-11-09
python3 "$consumer" query --db "$out/feed.db" --release "$next" --issuer china \
  --material graphite --destination US --on 2025-11-09 --include-pending
```

The immutable archive comes from commit `ecffb92c1b2bdbcfb6c560d0573b6a0666642e8a`. The rebuild checks all dataset bytes, the manifest and the original ZIP, including its two companion files. The baseline feed projects that published record. Both feed directories use November 27 for their curation date. The published legal-status cutoff is November 12 in both.

| Artifact | Expected identity |
| --- | --- |
| Research ZIP SHA-256 | `40e142cc257d04ade1f2b36aa573872d3322bd5b7b1b15bc6dd666a20d403b55` |
| Historical research manifest | `smpt-controls-v1-2026-11-12-be5b774228b6206368a6873fee5ab3945b116e346be85ef54e3aa4ab4a6b8ecb` |
| Baseline feed | `stratellar-controls-feed-p1-2026-11-12-2152ceb9a74aba3e3143a637f4a4d67faf9c1d47812be4bd84ec0aa66824a5e4` |
| Candidate feed built against that baseline | `stratellar-controls-feed-p1-2026-11-12-rc-cn-mofcom-59-2026-2e3940626b48c740ae533fd022ab2d694b65ba62c0e44ee7573a030f44172999` |

## File contract

| Dataset | Key | Baseline → candidate rows | How to use it |
| --- | --- | ---: | --- |
| instruments.json | instrumentId | 24 → 27 | Join parent instrument, jurisdiction, identifying metadata and source IDs. Match the year as well as the number. |
| instrument-dates.json | instrumentId | 0 → 6 | Separate signed, published and operative dates with a source. A missing value can reflect disagreement. |
| measures.json | measureId | 53 → 54 | Select coded materials, destinations, item types, flow and legal mechanism. Resolve legal bases to instruments and modified provisions to measures. |
| status-entries.json | entryId | 119 → 124 | Join measure and source, then replay the dated history. Retain null dates. |
| evidence.json | evidenceId | 138 → 144 | Join the measure and source to the supported fields, evidence strength and permitted locator. |
| sources.json | sourceId | 49 → 53 | Follow the URL and retain publisher, language, source type, confidence, publication and access dates. |

`manifest.json` names the review state, coverage, inputs, profile version and file digests. Its release identity binds the ordered manifest fields except the release ID itself, using the producer’s UTF-8 indented JSON with a final newline. This includes the profile digest, curation and cutoff, overlay digest and any predecessor comparison. For identity checks, use the supplied implementations or reproduce that serialization. Protect the expected manifest identity in your intake process. `profile.json` describes the allowed paths, types, reviewed labels and recomputation rules. Version 1.0.0 is pinned in the independent importer.

The six tables form a full replacement. The Python implementation verifies files and joins before committing a single SQLite transaction. Store releases side by side. The example writes **383**, **0** and **408** rows on its three loads. For a diff, compare by table key and row contents. When a predecessor is provided, `changes.json` ships additions, deletions and changes against that exact ID. The consumer independently computes the same comparison and exposes the citations behind changed histories.

An entry key uses measure, start date and source. Backfilling a prior date preserves the other keys. A correction to a key field appears as a removal plus an addition. A value change under the same key appears as a changed row. Instrument supersession is represented by a successor ID. Recompute affected clause histories, material/destination matches and instrument totals for the interval affected by a change. Keep both releases when an overlay corrects or removes an existing entry. For such overlays the reference tools require the original baseline for published-only replay.

## Worked answers and coverage

The candidate pilot has **33 coded clauses under 13 Chinese instruments**, beginning with the October 20, 2023 graphite notice. It includes the worldwide graphite licensing family and its corrected consolidated-list basis, US-destination paragraph-specific measures under No. 46, and the October 2025 package on superhard materials, batteries, graphite, rare-earth items and technology. The other **21 clauses under 14 instruments** are carried from the wider published record. Their release preserves existing coding, including historical legal bases that may need separate review. [Originals, dates and coverage limits](../../analysis/mofcom-59-continuation-source-adjudication-2026-11-26.md)

| Question | Reproduced answer |
| --- | --- |
| First introductions from Jan 1, 2025 through the published cutoff | Eight distinct restriction clauses under four parent instruments. A clause with several material tags contributes once to the total. |
| Coded China-to-US graphite restrictions on Nov 8 and 9, 2025 | Two clauses under two instruments, then one clause under one instrument. No. 72 suspends the US-specific clause. The baseline cites No. 39 for the worldwide clause. The opt-in corrected candidate cites No. 51, Annex 1, entries 1C108.b and .c. |
| No. 59 as knowable on Nov 25, 2026 | Published Nov 24, scheduled start Nov 28. No. 72 supplies the paragraph-2 suspension through Nov 27 inclusive. A Nov 23 vintage cannot know the continuation. |
| Paragraph 2 on Nov 28, and on Jan 27 and 28, 2027 | With pending rows included, projected suspended on Nov 28 and Jan 27 under No. 59. Unresolved on Jan 28. Applies to the graphite limb and the gallium, germanium, antimony and superhard-material limb. Zero first-introduced restrictions from this continuation. |
| Military end-use or end-user provision | The last stated status remains in force under paragraph 1. Neither suspension modifies it. It has no material attribution, so the graphite-specific count excludes it and the query flags it for review. |
| Six-instrument package on Jan 10 and 11, 2027 | All 25 affected clauses have projected suspended status through Jan 10 under No. 58 of **2026** and unresolved standing on Jan 11. No. 58 of **2025** is one of the underlying instruments. Three clauses of No. 61 retain an undated initial status. |

For a dated replay specify both the day in question and the public-information vintage. The special vintage `release` uses everything held in the selected release, subject to the pending-row option. A calendar vintage filters status evidence by source publication. `--include-pending` enables the candidate reading. It does not confer approval. Dates after the published cutoff or selected vintage can yield `state: projected` with a `lastStatedStatus`. A time-limited entry that has expired without a known successor yields `unresolved`. The query separates confirmed and projected counts.

```sh
npm run --silent feed:controls -- vintage "$out/candidate" --vintage 2026-11-25 --include-pending
python3 "$consumer" standing --db "$out/feed.db" --release "$next" \
  --measure ctl-cn-us-2024-graphite-end-use-review --on 2026-11-28 --vintage 2026-11-25 --include-pending
node --import tsx --test tests/controls-feed*.test.ts tests/controls-release-archive.test.ts tests/controls-source-watch.test.ts
```

## Distribution and interpretation

Only the allowlisted paths reach the integration files. The projection omits clause, status and nested evidence notes, source and instrument titles, source documents, unapproved translations, and product or end-user wording. An applicable withheld qualifier appears in `limitations[]` with its effect and source IDs. A new upstream field stays outside the profile. A new unreviewed clause qualifier produces a source-linked scope limitation. The public research ZIP retains its historical wording. Finance, project, market and framing tables are outside the feed.

Count restrictions by distinctive clause IDs and instruments by their parent IDs. Count first introductions separately from all restrictions in force. Match a named destination or a worldwide provision to material tags, retaining additional party, end-use and product conditions. A missing material tag or uncovered issuer leaves applicability undetermined. A customs reference code points to relevant text. Even a legal-scope code requires the item specification in its source. The query includes classification and exclusion reasons, citation IDs and source URLs so the importer can explain each result.

The next update begins with the [source-check procedure](SOURCE_WATCH.md) and [operator runbook](RUNBOOK.md). Both the candidate and the rights profile require a separate release decision before distribution.
