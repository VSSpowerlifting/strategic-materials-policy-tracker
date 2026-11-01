# Downloadable search reference lists

## Reader outcome

An active search with results offers CSV and JSON downloads of exactly the currently displayed, ranked rows. It works across all eleven indexed kinds. No selection, second matching implementation, account, server request or source-data edit is introduced.

The JSON manifest carries a versioned format identifier, curated corpus revision, scope start, the query and all filters, replayable canonical search URL, count and a minimal public reference projection. Each row includes record kind, ID, displayed title/context and canonical record URL, preserving framing/watchlist anchors. Internal haystacks and the index's mixed-semantics dates are omitted. The corpus revision is not a claim that every row was rechecked then. References point to SMPT records; readers must follow their citations for original evidence. Record counts are not finance totals or evidence of industrial outcomes.

CSV repeats the corpus revision and replayable search path alongside each row. Fields are quoted, quotes escaped and spreadsheet-active prefixes neutralized. JSON remains lossless. Browser CSV downloads use a UTF-8 BOM for native-script spreadsheet compatibility. Existing /data exports and their contracts are untouched.

## Boundaries

Only the existing global search UI, a browser-safe reference builder, tests, browser QA and this note change. No data/finance/source edits, new public route, indexing or ranking changes, inferred government/project attribution, private review, monitor or deployment changes. Work is independent of open #162/#164 and F4/F5 review PRs. Vercel release availability is separate from local-production browser verification.

## Verification

Focused tests cover all eleven kinds, exact real filtered row identity/order, replayable actor/mechanism/native-script queries, canonical anchors, deterministic metadata, CSV round trips/formula prefixes, empty lists and invalid inputs. Chromium checks actual downloaded contents against displayed links at 320/768/1440px, Unicode and mixed-kind searches, keyboard use, absence of controls for inactive/zero-result searches, and recovery after a failed download.

Run full exact-head CI, existing search browser QA and new reference-download browser QA. Do not merge while an applicable release gate is red. If main advances before release, reconcile and repeat applicable verification.
