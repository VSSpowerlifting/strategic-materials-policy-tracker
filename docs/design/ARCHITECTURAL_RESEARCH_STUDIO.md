# Architectural Research Studio — SMPT design system

Status: current site design system (November 2026 redesign). Tokens and shared classes live in
`app/globals.css`; this file says how to use them. It replaces the dark "atlas" look. Presentation decks keep
their own standard (`docs/design/presentations/`).

## Idea

SMPT reads as an editorial research studio with a record engine underneath. Pages are composed like
architectural drawing sheets: a centred title block, a hairline rule with a registration tick, generous
margins, and content hung from a visible grid. Research is the foreground; the record, the exhibits and the
market data sit behind it and are always one link away.

One memorable device per page, everything else quiet. On the homepage it is the opening plate; on a record it
is the status line and the evidence; on Markets it is the chart.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--bg` Plaster | `#f6f5f1` | page |
| `--surface` Chalk | `#fbfaf7` | quiet panels (`bg-card`) |
| `--elevated` | `#eeece5` | hover, selected rows, table heads |
| `--plate` | `#fdfdfb` | exhibits, menus, charts |
| `--fg` Graphite | `#1b1e21` | text, primary buttons, rules that matter |
| `--muted` Slate | `#555b61` | secondary text |
| `--faint` | `#61666c` | captions and labels (AA on every surface) |
| `--border` / `--border-strong` | `#dbd8cf` / `#b5b1a5` | hairlines |
| `--accent` Malachite | `#1f5c4d` | links on hover, the one emphasised mark in an exhibit |
| `--negative` Hematite | `#9a3324` | declines, controls, ended or lapsed status |
| `--ochre` | `#9a6a12` | designations, cautions |

Colour carries meaning or nothing. No gradients, no tinted cards, no drop shadows except the menu shadow. Never
hard-code a hex in a component: use the token utilities (`text-foreground`, `text-muted`, `text-faint`,
`text-accent`, `bg-card`, `bg-elevated`, `bg-plate`, `border-border`, `border-border-strong`) or `var(--…)`.
Chart series use the categorical set in `components/markets/types.ts`.

## Type

- **Spectral** (`font-editorial`, weights 300/400/500): page titles, publication titles, standfirsts and large
  figures. Classes: `.display-1`, `.display-2`, `.display-3`, `.page-title`, `.standfirst`, `.figure-xl`.
- **Archivo** (`font-display`, the body default): reading text, interface, tables, data, section headings.
- **JetBrains Mono** (`font-mono`): record identifiers and the keyboard hint only.
- Labels are sentence case, 13px, medium weight (`.label`). No tracked all-caps, no middot-joined meta strings
  where a list or a definition grid would do, no arrows appended to links.
- Numerals in tables and exhibits use `tnum`.

## Layout

- Page headings are centred title blocks (`PageHeading`, or `.title-block` by hand) closed by `.sheet-rule`
  with `data-centre`. Homepage, Research and featured studies are centred compositions.
- Paragraphs, tables, filters and analytical interfaces stay left-aligned on the grid. Do not centre them.
- Measures: prose 34–38rem; `Container` widths `narrow` (3xl), default (6xl), `wide` (7xl).
- Corners are square. Remove `rounded-*` from panels, tiles, inputs and buttons when touching a component
  (status dots and avatars excepted).
- Section spacing is generous (`py-16`–`py-24`); inside analytical interfaces density is welcome.
- Record facts are definition grids (`.fact-grid`), not sentence strings.

## Photography

Identity: mines and plants seen from above. Public-domain or openly licensed plan-view imagery (NASA astronaut
photography, NASA Earth Observatory, USGS), each registered in `lib/photography.ts` with site, what is shown,
date, image ID, credit and licence. Every plate carries its caption (`.photo-plate` + `.plate-caption`). An
image illustrates a named place; it is never offered as evidence of a specific facility unless the caption can
say exactly what is in frame. No generated imagery.

## Exhibits and charts

- Flat ink on plate. 1.25–1.5px lines, straight segments between observations, no smoothing, no area fills
  except where a filled band is the datum.
- Axis labels in `--faint`, gridlines in `--border`, the zero or base line in `--border-strong`.
- A missing observation is a gap, not an interpolated line. Annual data is drawn as annual points.
- Transformed series (indexed, log) say so in the chart header; the raw values stay one control away.
- Every exhibit names its source and the date of its data.
- Money exhibits follow the Capital & Control rules: totals only from `totalCommitments`; never sum unlike
  instruments or value roles; an undrawn or lapsed commitment is drawn as such and never as realised funding.

## Motion

One page-load settle (`.settle`, staggered, 400ms) on centred title blocks; chart lines draw left to right
once. Hover changes colour or underline only. Everything is disabled under `prefers-reduced-motion`.

## Copy

Follow `AGENTS.md` (website editorial standard) and the research house style. A visible sentence states a
fact, clarifies a distinction, or helps the reader move. Cut introductions that restate the title, interface
self-description and repeated method notes; keep every qualifier, status distinction, unit, date and source.
Buttons say what happens. Navigation: Research, Explore, Markets, About; the record journeys (Government
action, Public capital, Projects, Compare) sit under Explore and Evidence sits under About, all at their
existing URLs.

## Status and remaining work (11 November 2026)

Converted end to end: global tokens, header and footer, homepage, `/research` and the five articles (layout
only; content fingerprints unchanged), `/explore`, `/about`, the four record templates (`/events/[id]`,
`/capital/[id]`, `/projects/[id]`, `/materials/[slug]`), the capital-flow exhibit, `/markets` and the homepage
market preview. List, tool and evidence pages took the palette, type and hairline conversion.

Not yet converted, or converted only in colour:

- Boxed shared components still used inside the new templates: `FramingQuote`, `SourceCard`, `CiteBlock`,
  `RecordReadingGuide`, `ProjectFinancialRecord`, `ProjectPolicyContext`, `ReviewedProjectMilestones`, the
  dossier stage cards, `programme-research-trail.tsx`, `project-comparison.tsx`.
- `/controls` end-date clock cards, `/actors` cards, currency tiles in `components/intelligence/totals.tsx`,
  the reading-key disclosure box, and roughly a hundred `text-accent` list links that should become
  `.link-quiet`.
- `ProjectOverview` keeps the question heading "What does the record establish?", and the reading guide and
  evidence tables stay open, because QA scripts and a source-pin test hold them. Change the pins with the copy.
- Components the new templates no longer use (`Dossier`/`DossierHeader`, `InstrumentsPanel`, `CommitmentRow`,
  `ControlRow`, `DesignationRow`, `LayerStack`) have not been checked for other users or removed.
- `--ochre` is 4.33:1 on the page background. It is used for rules and markers only; do not set small text in it.
- The root Open Graph image title renders in the built-in sans; a serif title needs a bundled Spectral file.
- Photography: one registered plate (Escondida tailings, ISS022-E-8282) serves the homepage, the Escondida
  cover and its article. The other four research covers are typographic. Candidates are listed in the pull
  request; each needs the maintainer's permission to download and a caption that says exactly what is in frame.
- Market Monitor: no pinch zoom on touch (buttons, presets, dates and the navigator work). Gap rendering is
  unit-tested only, because no stored series has an interior gap. On a phone the chart starts just below the
  first screen. A "High" annotation can sit on the base point of a falling indexed series. The latest-values
  table no longer links each row to the policy record; the material link remains under benchmark
  specifications. The coverage-gaps introduction is read from the market data file and uses file paths; the
  data file was left untouched and needs the maintainer's edit.
- Capital-flow exhibit: three classification and wording calls await the maintainer (the NdPr price floor is
  drawn as contingent, not commercial; an executed option reads "no exercise recorded"; lapsed financing reads
  "Lapsed <date>. Not in force."). Reduced-motion, no-JavaScript and real-touch behaviour were not tested.
