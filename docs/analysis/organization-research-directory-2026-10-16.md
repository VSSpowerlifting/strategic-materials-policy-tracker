# Organization research directory — 2026-10-16

## Product problem

SMPT has 99 source-backed registered organizations: 68 companies, 20 government bodies, 6 public financiers, 2 project companies, 2 banks and a joint vehicle. Previously /organizations displayed an unfilterable long list, limiting research into recipients, agencies, corporate sponsors and programme administrators.

## Reader capability

The public /organizations page now searches original-language names, corporate aliases, IDs and the source-coded location, and filters by organization type, recorded country of constitution, government affiliation and **the existing canonical financial/project/programme/designation relationship**. Organization detail pages, original-source evidence, CSV, API and government portfolios stay intact. Reader filters have shareable URL parameters, visible result counts, empty state and accessible controls, while all 99 entries remain rendered into the initial static HTML.

## Evidentiary distinctions

- Providing or receiving a **financial record** is not an assertion of capital disbursement, a binding public commitment or industrial output. Such rows may include financing options, intentions, private money or withdrawn commitments. Each record's own financial status and value role remain the authority.
- Provider links reuse **organizationRoles** in lib/capital-intelligence. Only the typed `part_of` office relation rolls up its provider records. Joint-vehicle `established_by` links do not transfer financing to the founders.
- Sponsor, programme administrator and designation holder are separate explicit roles. A designation is recognition, not financing.
- Government affiliation is the organization registry's exact actor field, not inferred from residence, ownership, funding agreements or joint-vehicle sponsors.
- Country code missing is not guessed. It can be absent for supranational bodies.
- Ended financial rows remain indexed for historical provenance; they do not count as current capital backing. Ended counts use distinct record IDs even when the same financial row both provides and receives under a single organization.
- Missing recorded relationship means no coded relationship, not an inactive/irrelevant organization. No country, institutional hierarchy, spending, causal or industrial impact is inferred.

## Isolation

No source or financial seed, human M3/F5 milestone review, amounts, status histories, APIs, controls, workflow collectors or Observatory artifacts changed. The client gets a small projected directory rather than the entire funding corpus.

## Verification

Unit tests check exact membership and role parity against organizationRoles for every entity; project sponsors, programmes, designations; established-by exclusion and part-of rollup; ended row deduplication; synthetic invalid identities; original-language/alias search; and determinism. Dedicated browser CI verifies static HTML, shareable role/category filters, 99 initial records, keyboard organization navigation, and mobile/tablet/desktop viewport widths. Full main CI production validation remains mandatory.
