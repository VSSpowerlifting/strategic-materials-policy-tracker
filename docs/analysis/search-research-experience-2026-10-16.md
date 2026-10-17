# Search research-experience pass — GitHub-only offline phase, October 16, 2026

## User problem

SMPT already has an exact-substring global index for events, financial instruments, control clauses, projects, organizations, programmes, materials, jurisdictions, framing claims, sources and source monitors. Reimplementing search would create conflicting databases. Instead, the existing `/search` page needs clearer default navigation, better inputs and verified keyboard/mobile behaviour. Its server index is also currently imported indirectly into a client component, which risks bundling all public seed files in the browser twice.

## Changes

- Move pure query matching, index type and taxonomy to `lib/search-core.ts`, imported directly by `SearchExplorer`. Keep `lib/search.ts` as the canonical **server-side index constructor**, reexporting the original public functions/types for backward compatibility. All exact legal identifiers, original-language text, source labels, organization aliases, and raw records remain unchanged. The browser receives only the existing serializable search projection.
- Improve the initial search page with a server-rendered **Browse the published record** panel, including exact count shortcuts for the six principal research types. Counts derive from the 11-kind canonical search index, not manually written totals or independent-source counts. Other types remain available through Record type.
- Give the query and filters the same 44px touch targets and readable labels as the redesigned capital directories. Use 16px input text on mobile to avoid browser zoom, promote titles and subtitles, and maintain direct source/record links and full keyboard focus.
- Clarify how actor and mechanism filters are scoped, including that sources and projects have no assigned issuing government in the global index; avoid false "no evidence" inferences. Improve zero-result reset.
- Preserve exact substring matching, no fuzzy document-number search, original CJK-script search, URL filter serialization, and static prerendered initial page.

## Scope and isolation

No published financial, source, milestone, programme, agency, original-document, monitor or project seeds changed. No funding attribution, source authority or human M3/F5 review altered. This does not overlap with the open conceptual financial explanations PR #162 or programme evidence pathways PR #160. No new Vercel deployment is requested while the account's build limit is exhausted. Work stays in a named GitHub development branch; do not merge without a fresh exact-head PR verification and a successful deployment check once the quota permits.

## Verification

- Six new unit/contract tests verify full type parity, unique IDs across index, exact number + Chinese-script search, preserved government attribution boundaries, browser module not importing server seeds, and dynamic browse/accessibility semantics.
- GitHub **push-only branch QA** executes validation, TypeScript, lint, the full unit suite, production Next build and a dedicated pinned Playwright Chromium run in one job. This can run even if a Vercel preview deployment cannot.
- Browser QA checks 320/375/768/1440px, default category shortcuts, actual project filter/deep URL restoration, exact original-source queries, actor-filter boundaries, 44px form control sizes, reset by keyboard and no horizontal overflow.

## Release after deployment capacity returns

Review branch against current main, open PR, require exact-head tests and Vercel green preview, then merge. Existing PR #162 and #160 release blockers should be resolved on their own merits before combining new code.

## Follow-on: exact registered-organization relationship search

The search server now resolves only canonical `providerOrgIds`, `recipientOrgIds`, `sponsorOrgIds` and `administeringOrgIds` against published organization records. It adds exact registered organization names, original-language names, and aliases to their directly linked finance/project/programme search text. Project and programme subtitles explicitly label **registered sponsor** and **registered administrator** where present, so users can tell why an organization-name query returned those records. The organization record remains linked via its existing own search result.

No government ownership, financed project allocation, legal obligation, disbursement, source corroboration or project milestone is inferred. Project search records intentionally retain `jurisdiction=null`, even for sponsors with a government designation. Missing organization IDs fail closed during static index generation. These new relations are text-discovery metadata only and do not alter published seeds or finance counts.

Three focused regression cases use Umicore (Belgian projects), Cyclic Materials Inc. alias, METI/JOGMEC and European Commission administering schemes, and the Arafura financial row to ensure named organizations map to actual registered links rather than lookalike text or inferred public spending.
