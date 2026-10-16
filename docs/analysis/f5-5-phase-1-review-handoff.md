# F5-5 Phase 1 — private source-version comparison and unsigned handoff

**Engineering-only companion to issue #114 and the merged Phase 0 receipt contract (#135).** No live source access, new factual finding, review attestation, seed promotion or public casefile is authorized.

## Maintainer-operated workflow

1. Independently preserve both exact original UTF-8 text bodies in `.f5-drift/`, which is gitignored. This bounded comparator is **not** a PDF, binary, HTML semantic, OCR or source-fetch tool. Do not transcribe an excerpt and pretend its hash is the full original body.
2. Supply the existing Phase 0 prior/current capture JSON arrays. Each successful capture's `sha256` must match the exact UTF-8 bytes of its corresponding body file. These digests establish only consistency between *supplied local inputs*, not that a publisher actually served the content.
3. Run the offline handoff manually:

```sh
npm run review:f5-versions -- --check-runtime
npm run review:f5-versions -- --before .f5-drift/prior.json --after .f5-drift/current.json --source-id REGISTERED_SOURCE_ID --before-body .f5-drift/prior.txt --after-body .f5-drift/current.txt
npm run review:f5-versions -- --before .f5-drift/prior.json --after .f5-drift/current.json --source-id REGISTERED_SOURCE_ID --before-body .f5-drift/prior.txt --after-body .f5-drift/current.txt --json
```

The CLI recomputes the Phase 0 receipt against the registered source list and selects one **unreviewed successful-source revision**. It rejects outages, baseline-only observations, unknown IDs, hash mismatch, duplicate or conflicting captures, and excess text. It reads only explicit files and writes only to stdout. **Do not redirect private output into tracked files, public build logs, CI artifacts or public issues.** Use a private local review worksheet instead.

## Diff and review meaning

The result carries the stable Phase 0 review key, source identity, official URL, prior/current retrieval clocks, original publication dates and SHA-256 digests. It shows an exact paragraph-based changed window with adjacent context. It does not attempt to infer whether changed bytes represent a legal amendment, new signed agreement, financial disbursement, physical milestone, new beneficiary or corrected event date. Whitespace-only byte changes remain flagged even when normalized paragraphs are equal.

Bounds: 128,000 UTF-8 bytes per text body, 160 paragraphs per body, 2,400 characters per paragraph and 80 changed-window paragraphs. Exceeding bounds **fails closed** for manual review rather than silently truncating the difference. The exact-prefix/suffix alignment is deliberately conservative: inserted or reordered middle paragraphs can show a larger changed window; it is not a semantic diff.

The handoff is always `unreviewed` with `sourceAccessVerified: false`, no reviewer identity, no review timestamp, no adjudicated entity links, and explicit no-promotion/no-publication flags. A maintainer must independently inspect both publisher originals and apply existing M3/editorial human source review to any candidate claim. The handoff is not a signature or a second publication authority.

## Verification and exclusions

Tests use synthetic bodies and an existing source *identifier* only. No real-world source revision or original-source access is asserted. No API, page, search, CSV, export, seed, financial status, project milestone, monitor schedule or existing M3 review state is changed.

**Next independent phase:** source-aware entity-link candidate preparation and human acknowledgment schema, explicitly subordinate to the existing M3/editorial adjudication. Real source access, any factual claim, human identity, and promotion remain blocked pending actual reviewer decisions.
