# Public two-project evidence comparison — October 16, 2026

## Why it exists

The new project directory makes each registered undertaking searchable, but a reader still has to switch tabs to compare two projects and can accidentally treat different kinds of evidence as comparable capital or industrial outcomes. `/projects/compare` is a deliberately *qualitative* two-project research view. It makes source trails and important absences visible without producing a ranking.

## Data boundary

The builder `lib/project-comparison.ts` consumes four existing, approved public inputs:

1. `buildProjectDirectory()`, which already delegates government-commitment qualification to `buildIndustrialResponse(site.lastUpdated)` and distinguishes direct project IDs from shared/unallocated associations.
2. `getAllProjects()` for original project-level evidence citations and registry facts.
3. `getAllSources()` for canonical source labels and links.
4. `getAllProjectMilestones()`, **public, human-reviewed seed only**, with no private M3/F5 review queue or legacy financier implementation entry promoted to a milestone.

Every row shows locations, recorded sponsors, tracked materials and stages, directly linked instruments (any value role or status), separately listed shared/unallocated instruments, designation references, and the presence or absence of a qualifying government commitment at the curated legal cutoff. Direct instruments are clickable; source links go to the original source registry detail. Designations are contextual and link through the existing detailed project view. The UI also shows specifically sourced, reviewed physical milestones if any have actually been published.

**No numbers are added across projects, financing roles, or currencies.** Instrument/source/designation counts describe records, not amounts, strength of corroboration, outcomes, financing completeness, disbursements or effectiveness. An absence is an absence in SMPT, not evidence of inactivity.

## Experience

- Two searchable-by-browser-native-select project dropdowns, alphabetized from the actual corpus; results do not appear until two distinct projects are chosen.
- URL parameters `left` and `right` allow precise, shareable comparison links. Unrecognized project IDs fail closed to unselected state. Clearing and swapping selections update the same parameters.
- Side-by-side cards on desktop and stacked cards on narrow screens. Every record ID and original source remains linkable; comparison is navigable by keyboard.
- Displays only the intersection of *recorded* material and stage labels, explicitly not implying trade relationships, shared ownership or policy causal effects.
- Reachable from the normal Project directory and static sitemap. The comparison page's base HTML can remain statically prerendered; URL selection is applied after mount.

## Safety and compatibility

Does not change any curated data seed, original source contents, financial status or amount logic, monitoring workflow, API, export schema, project directories, private provenance receipts, human adjudications or Observatory publication rules. Independent of #86, #130, #132, #133, #134, #162 and #164.

## Verification / gate

Focused tests cover a one-to-one project projection, real Lynas/JARE shared/unallocated relationship, project-citation provenance, synthetic approved-public milestone isolation, invalid foreign sources, stale registry rows, duplicate milestones and stable ordering. CI must still validate, typecheck, lint, test and production build this PR's exact head. Browser/preview verification must be recorded before release; the Vercel account's build rate limit is a separate gate and must not be worked around by silently merging a red deployment.
