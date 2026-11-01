# Public CSV spreadsheet-formula boundary — October 16, 2026

## Risk and reason for this change

The canonical `lib/export.ts` CSV writer escaped commas, quotes and line breaks but did not neutralize **spreadsheet formulas**. A source title, publisher-supplied note, original-language quote, or later curated text starting with `=`, `+`, `-` or `@` could therefore be interpreted as a formula by spreadsheet applications even when RFC-4180 quoting is correct. Unicode full-width variants and leading whitespace/control characters complicate that boundary. The newer `/search` reference download separately protects its user-visible CSV text; full `/data` exports and saved-event CSVs shared the older writer.

OWASP identifies this issue and the absence of a universal strategy across spreadsheet applications: [CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection), [Web Security Testing Guide — CSV Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Injection/21-CSV_Injection).

## Implementation

- Apply protection **at the shared serialization cell boundary**, after constructing the immutable curated record and before RFC-4180 quoting. Protect only cells that begin with a trigger or have a trigger after leading whitespace/control; include Unicode full-width forms. Leading tab/CR/LF also receive protection.
- Prefix protected text with a tab **inside a double-quoted field**. Quote escaping remains unchanged. This follows the Excel-oriented OWASP example, rather than relying on CSV quoting or a bare apostrophe alone (which Excel can strip on resave).
- Preserve unadorned signed decimal tokens (such as `-42` and `+0.125`) and normal IDs, dates, languages, financial columns, headers, record order, and row count. Do not convert numeric amounts or mutate any seed data.
- **Trade-off:** protective tab bytes become part of affected CSV text values for programmatic consumers. CSV is a spreadsheet-friendly projection; `/api/export/dataset.json` remains canonical for exact original text, financial amount strings and nested source evidence. This is not a promise of universal protection in every spreadsheet program or after arbitrary re-export transformations.
- Transparently disclose the distinction on `/data`. Route names, content types, headers, UTF-8 BOMs, API payloads and stable URL contracts remain unchanged. Saved-event subset CSVs inherit protection from `eventsCsv()`; `/search` reference-list CSV remains its own tested writer.

## Tests and release criteria

- Harmless arithmetic-style strings for all ASCII and full-width formula prefixes, whitespace/control prefixes, and quote/delimiter breakout attempts.
- Synthetic in-memory event fixture confirms a single record, same field count, and tab protection within the encoded CSV field; no seed edits.
- Signed numeric strings and ordinary non-formula source text round-trip unchanged.
- Every public CSV builder round-trips through a minimal RFC-4180 reader with the same number of columns in each row; current data/API compatibility and byte-faithful JSON checked.
- CI: exact-head dependency audit, validation, TypeScript, lint, tests, production build. No merge or Vercel release with quota status red. No claimed real Excel QA without an actual spreadsheet-app test.

## Isolation

Separate from open #166 comparison, #162 financial vocabulary, #164 browser storage, and F4/F5 research PRs. No source-review decisions, legal history, industrial outcomes, monitoring, published data revisions, private notes, or automated web source collection changed.
