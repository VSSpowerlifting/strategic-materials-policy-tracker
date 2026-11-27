# Checking the controls sources

The operator checks two ministry listings for new notices and thirteen known notice pages for amendments. The register contains their URLs, the expected interval between listing checks, and Chinese title fragments that suggest a notice deserves a reading. Compare the register with the issuer's index when its publishing year or page layout changes. [Source register](../../../research/controls-review/source-watch-register.json)

Run from the repository root after `npm ci`. Start with the offline exercise to see a missed check, an HTTP failure, recovery, an amendment, a human triage decision and its correction. All names, URLs and notice bodies in the exercise are synthetic.

```sh
node --import tsx --test tests/controls-source-watch.test.ts
```

The No. 39 check uses the ministry’s central copy of the notice. The archived source record retains the bureau URL. [Central copy](https://www.mofcom.gov.cn/zwgk/zcfb/art/2023/art_2b2f5a88d0354d6ea761a1de0fa427de.html)

For the worldwide graphite legal basis, the checker fingerprints the HTML of Announcement No. 51 of 2024. Read its two annexes manually on every review of this family. Record the file URL, access date, digest and provision locator. Annex 1 holds the item descriptions. Annex 2 identifies the repealed notices. The parent page can link to a later copy of the list, so preserve the original edition for historical questions and check the current consolidation separately. [No. 51](https://www.mofcom.gov.cn/zwgk/zcfb/art/2024/art_a429e4686e0c4df39588431afbff4b83.html) · [2024 Gazette Annex 1](https://www.mofcom.gov.cn/cms_files/filemanager/600926013/attach/202411/4c2b07bcf8664fb4b04c8b69bb0fd26f.pdf) · [2024 Annex 2](https://www.mofcom.gov.cn/cms_files/filemanager/600926013/attach/202411/dc05a2e6db2749f7b9d3c0ad9a6f6254.pdf) · [List updated November 18, 2026](https://exportcontrol.mofcom.gov.cn/upload/uploadfile/attach/202611/19/20261119102925281.pdf)

## Perform a check

```sh
npm run watch:controls -- status
npm run watch:controls -- check --live
npm run watch:controls -- status
```

Each live check reads the current time and attempts each registered URL once. With a one-day interval, the next check after a longer absence records a missed check. The status report shows which listings are overdue in the meantime. Exit code 0 means the command completed. Inspect the observations and open items even on success. Exit code 2 means at least one source failed and the journal recorded the failure. Exit code 1 means an input, journal or command error.

On a first successful fetch, inspect the matching titles already present, including their links. Later checks queue matching new URLs and flag revisions to a known notice's document number, body or signature date. Repeated matches share an item ID. A failure preserves the last successful observations for the next comparison. After a gap, inspect intervening index pages by hand and check any client-rendered sections. A listing match is a reading suggestion. Items that lack a title match still appear in the newly seen URLs. Use manual intake for discoveries outside the parser's view.

```sh
npm run watch:controls -- intake --url "$official_url" --by "$operator" --reason "$discovery_reason"
npm run watch:controls -- status
npm run watch:controls -- triage --item "$item_id" --to investigating --by "$operator" --reason "$reason"
```

Open the complete primary notice. Verify its number and year, signed and issued dates, operative sentence, affected provisions, exceptions, and inclusive end. Record a disposition of `out_of_scope`, `already_covered`, or `needs_verification` with a reason. If a candidate is warranted, create the scoped overlay and use `candidate_started` with `--overlay` and its existing ID. Each real decision uses the actual person's name and current time. A mistaken disposition can be corrected.

```sh
npm run watch:controls -- correct --item "$item_id" --to needs_verification --by "$operator" --reason "$correction_reason"
```

A correction appends an entry pointing to the preceding decision. A new revision of a previously triaged notice flags it for another reading. Status changes here affect the private review queue only. [Source review and release procedure](RUNBOOK.md)

## Private journal and replay

The default directory is the git-ignored `.monitor-controls/`. Each numbered JSON receipt records the action, the resulting state, and the decision ledger. Checks retain the register hash, observations, outcomes and last successful fingerprints. The command writes one complete generation atomically. Concurrent updates to the same generation require a retry. Preserve the entire sequence in private backups. For a corrupt or missing receipt, restore a known complete journal, then check the unobserved period manually. Keep the journal outside published artifacts.

For replay, supply `--replay DIRECTORY --state-dir TEMP_DIRECTORY --at ISO_UTC_TIME` in place of `--live`. A replay directory contains a `replay.json` file with `version: 1` and a `responses` object keyed by exact URLs. Values have a local `file`, a numeric HTTP `status`, or an `error` such as `timeout`. Omitted URLs produce failed observations. Use `--register PATH` to point replay at a synthetic listing and notice register. The CLI refuses to mix live and replay observations in one journal. [Executable replay](../../../tests/controls-source-watch.test.ts)

The checker reads article links in fetched HTML on the listed host. It has no browser, automatic pagination or schedule. Page metadata outside the fingerprint, a title edit at an existing listing URL, attachments, differently hosted notices and changes that briefly appear between reads can escape detection. Read the official index and cross-check original metadata during adjudication. A first fingerprint for a known notice establishes a comparison point. It carries no attestation of the page's contents.
