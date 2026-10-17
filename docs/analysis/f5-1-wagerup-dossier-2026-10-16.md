# F5-1 dossier: Alcoa–Sojitz gallium facility at Wagerup (2026-10-16)

**Status: UNSIGNED RESEARCH. Not a review, not an approval, not publishable.**
Machine-readable evidence: `research/f5/industrial-evidence-pilot-chronology.json`
(case `review-m3-2-alcoa-wagerup`). Run `npm run audit:f5-industrial-evidence` to check it.

| Field | Value |
| --- | --- |
| M3 review | `review-m3-2-alcoa-wagerup` (gate `human_source_review`) |
| Worksheet digest | `90e165224587e2d87d05b6a0216a0cc0e94dff50eac87719c2d14f048928b3a9` |
| Project | `prj-au-alcoa-sojitz-gallium` |
| Canonical source | `src-alcoa-wagerup-groundbreaking-2026` (Alcoa Corporation, published 2026-08-24, accessed 2026-10-02) |
| Proposal | `construction_started` / `named_facility` / occurred 2026-08-24 |
| Scope as stated | "gallium production plant co-located at Alcoa’s Wagerup alumina refinery" |
| Finance refs (context only) | `fin-au-alcoa-sojitz-gallium-2025-equity`, `fin-au-alcoa-sojitz-gallium-2025-offtake-right`, `fin-us-alcoa-sojitz-gallium-2025-equity` |
| **Disposition** | **Conditionally supportable with a specified caveat** |

## Caveat

The record can only describe one named-facility event dated 2026-08-24. The reviewer
has to choose between two kinds. `construction_started` follows the issuer's wording.
`groundbreaking_reported` follows the ministerial wording. Neither kind may be used
to infer commissioning, output or disbursement.

## Evidence packages

| # | Publisher / title | Published / accessed | Type | Time as stated | Pinpoint and quote (≤15 words) | Limitation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Alcoa Corporation, *Australia, Japan, the United States and Alcoa Break Ground on Gallium Project in Western Australia* ([link](https://news.alcoa.com/press-releases/press-release-details/2026/Australia-Japan-the-United-States-and-Alcoa-Break-Ground-on-Gallium-Project-in-Western-Australia/default.aspx)), registered | 2026-08-24 / 2026-10-02 | event | 2026-08-24 | Opening paragraph: "The ceremony marked the start of construction of the new facility" | An issuer ceremony is not evidence of sustained works, drawdown or output |
| 2 | Ministers for the Department of Industry, Science and Resources, *Ground broken on landmark gallium project* ([link](https://www.minister.industry.gov.au/king/media/ground-broken-landmark-gallium-project)), **unregistered** | 2026-08-24 / 2026-10-16 | event | 2026-08-24 | Para. 1: "the first sod has been turned on the Alcoa-Sojitz Gallium Recovery Project" | Independent government corroboration of the date. It describes a first-sod event, not a construction start |
| 3 | Same release, **unregistered** | 2026-08-24 / 2026-10-16 | aspiration | future | "up to 10 per cent of the world's gallium supply" | An upper-bound aspiration. It is not output or a market share |
| 4 | JOGMEC, *Final Investment Decision for Gallium Production Project in Australia* ([EN](https://www.jogmec.go.jp/english/news/release/release_00445.html), [JA](https://www.jogmec.go.jp/news/release/release_01306.html)), **unregistered** | 2026-07-15 / 2026-10-16 | event | by 2026-07-15 | "has made a final investment decision" | An FID is not construction. The English page is JOGMEC's official translation |
| 5 | Alcoa, *Q3 2026 results* ([link](https://news.alcoa.com/press-releases/press-release-details/2026/Alcoa-Corporation-Reports-Third-Quarter-2026-Results/default.aspx)), **unregistered** | 2026-10-15 / 2026-10-16 | state | 2026-Q3 | Not verified; quote null | **Post-cutoff.** It cannot support any disposition |

All sources are English (`translation: na`), except lead 4, whose English text is the
agency's own official translation.

## Discrepancies and contradictions

| Topic | Disposition | Basis |
| --- | --- | --- |
| Ceremony wording: construction start versus first sod | Conditionally supportable with a specified caveat | Both originals date the event to 2026-08-24. Only the issuer calls it a construction start |
| Three financing rows, one physical event | Resolved and source-supported | Several financers do not create several milestones. The validator's duplicate-event rule enforces one dated event (§7 test 1) |
| JOGMEC FID versus construction | Resolved and source-supported | The FID on 15 July and the ceremony on 24 August are distinct events |
| Gallium Recovery Project versus gallium production plant | Conditionally supportable with a specified caveat | Both names refer to the facility co-located at Wagerup. Keep the issuer's scopeAsStated |
| Up to 10% of world supply as an outcome | Contradicted or unsupported | This is an aspiration only |
| Commissioning or production after the ceremony | Missing original documentation | No pre-cutoff original reports either. The only later lead is post-cutoff and unread |

## Finance references (no causal claim)

The three financing rows are listed so the reviewer can see their context. The ceremony
does not change their status histories. It does not evidence drawdown, and it does not
make any Australian, Japanese or US amount attributable to the event. /response keeps
Alcoa at `binding_not_evidenced` / `not_yet_binding` / `construction_or_later` (§7 test 12).

## Adjudication question

The issuer says the 24 August 2026 ceremony marked the start of construction of the
Wagerup gallium facility. Does that statement support `construction_started`? Or should
the record use `groundbreaking_reported`, because the government release describes only
a first sod being turned?

## Blockers before any publication

1. A named human reviewer must read the full original and record the verdict locally
   against the digest above.
2. Every real review is dated 2026-10-16 or later, which is after the corpus cutoff
   (`site.lastUpdated` 2026-10-09). The adjudicator therefore blocks it until a
   site.lastUpdated advance is approved separately.
3. If the reviewer wants to cite the ministerial release or the JOGMEC release, those
   sources must be registered through authorized curation first.
