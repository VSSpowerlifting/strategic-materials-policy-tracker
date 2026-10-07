# Shared project financing associations — draft review (2026-10-07)

Base: main fc6671b21f0473b2688b6f05294e6f9acba8735c (PR #57).
Status: review candidate only. No merge or deployment.

Add optional `associatedProjectIds` for a single financing row that spans two or more explicit projects without a sourced allocation. It cannot coexist with `projectId`. Singular attributed financing and project capital totals remain unaltered; shared associations are separately exposed in profiles, API, search and exports.

Three existing rows: JARE/Lynas AUD 200m equity, MP up-to-USD 600m company cash (not public support), USAC USD 27m DPA award. Six project registry entries were added. Neither financial amount nor financial status was changed. No stage amount or per-project allocation is inferred.

Review gate: validate, typecheck, lint, all tests and build; confirm project and capital detail pages and CSV/API additive fields; scrutinize source descriptions for Lynas heavy-REE scope, MP Mountain Pass hydrochloric acid facilities, and Alaska project wording. Stop before merge.
