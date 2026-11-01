# Saved-event storage reliability

## Reproduced failure

The saved-event reader accessed `window.localStorage` and `getItem` without catching storage denial. The toggle returned the requested state even when `setItem` failed, allowing “Saved to my list” to appear without persistence. Removal and clear failures had no visible explanation. Duplicate IDs from edited storage could also render duplicate rows.

## Result

Storage access is guarded, including the localStorage getter. Mutations first read the existing list and return an explicit success result; a failed read cannot overwrite an unread list, and a failed write retains the last confirmed IDs without broadcasting success. The existing boolean toggle helper remains available and now returns confirmed state. The button and saved-list page consume explicit results, announce failures and permit retry. Parsing deduplicates IDs and ignores empty/non-string entries. The storage key and browser-only privacy model are unchanged.

No in-memory fallback pretends to be persisted storage. No finance data, source registry, public export, private review or monitoring behavior changes. This phase is independent of financing-reading PR #162 and requires no Vercel deployment for verification.

## Verification

- `node --import tsx --test tests/saved-events-storage.test.ts tests/watchlist-client.test.ts`: blocked getter/read, failed writes, preserved IDs, no false notifications, recovery, successful mutations, subscription cleanup, cross-tab event filtering, duplicates and server guards.
- `npm run typecheck`, `npm run lint`, full repository CI and production build.
- `scripts/qa-saved-events-storage-browser.mjs` against the production build: actual saved button, persisted reload, failed save/unsave/remove/clear, denial feedback, recovery, duplicate/stale IDs, real cross-tab synchronization, keyboard and responsive widths.

Release remains separate from the draft implementation and its GitHub-only verification. Do not merge while an applicable release gate is failing.
