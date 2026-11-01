# The 2027 DFARS Upstream Test and Recorded US Public Capital — draft brief, 2026-11-01

**Status:** DRAFT, not human-reviewed. This is a proposed analytical brief, not an approved editorial conclusion, a legal opinion or a revised classification. The rule itself is **not yet a seed record**: 10 U.S.C. 4872, DFARS 225.7018 / 252.225-7052 and the FY2026 NDAA amendments are held as unreviewed candidates in the private candidate queue, pending source verification and promotion. Capital facts below come only from existing seed records. Repository baseline: `main` at `f3df7c041a7aaa5086338b3c4fc4e6efc402c078`; isolated feature branch.

## Reader decision

Ask **which US public financing rows already in SMPT sit at the supply-chain stages that a US defense sourcing rule begins to test on 1 January 2027, and what each row's recorded legal standing is.** The question is for a reader who has to explain the rule's reach to a defense contractor or a government-affairs team. The brief does not estimate compliance, supply, capacity or cost. It does not claim that any financing was made because of the rule.

## The rule

**What it restricts.** 10 U.S.C. 4872 bars the Department of Defense from acquiring *covered material* from a *covered nation*. The restriction applies at any subcontract tier.
- Covered material: samarium-cobalt magnets, neodymium-iron-boron (NdFeB) magnets, tungsten metal powder, tungsten heavy alloy and tantalum.
- Covered nations: North Korea, China, Russia and Iran.

**Two stages.** DFARS clause 252.225-7052 (MAY 2024) implements the statute in two stages:

| Period | Test in the clause |
| --- | --- |
| Through 31 December 2026 | covered material "melted or produced" in a covered nation |
| From 1 January 2027 | covered material "mined, refined, separated, melted, or produced" in a covered nation |

The second stage comes from FY2021 NDAA section 844, as amended. It moves the test from where a magnet or alloy is made back to where its feedstock is mined and processed.

**Exceptions.** The statute's exceptions include:
- waivers;
- use outside the United States;
- commercially available off-the-shelf items, except items that are at least 50% tungsten by weight;
- electronic devices;
- recycled NdFeB magnets milled and sintered in the United States.

**Enacted changes (Pub. L. 119-60, FY2026 NDAA, 18 December 2025).**
- **Section 844(a)** adds molybdenum to covered material. It extends the recycled-magnet exception to samarium-cobalt magnets and adds a recycled exception for tantalum, tungsten and molybdenum. No delayed effective date is specified.
- **Section 844(b)** adds gallium and germanium to covered material, effective two years after enactment (18 December 2027).
- **Section 843** lets a 10 U.S.C. 4863(k) end-item waiver also cover the 4872(a) restrictions.
- **Section 848** restructures the 2027 upstream prohibition. It keeps the 1 January 2027 date.

The DFARS clause is dated MAY 2024 and predates these amendments. Whether a DFARS case implements them is an open question (see below).

**Pending only.** H.R. 9073 (introduced 29 May 2026, referred to the House Armed Services Committee) would delay the upstream stage. The new date would be the earlier of 1 January 2032 or 180 days after a Secretary of Defense certification. It is a proposal, not law. Re-check its status before relying on the 2027 date.

## Method and counting boundary

- **Scope.** The brief reads five existing seed events and their `fin-*` rows. All are US federal actions on rare earths, magnets or germanium, recorded from 2024 to 2026. Antimony rows are left out: antimony is not covered material under 4872, before or after Pub. L. 119-60.
- **Status.** Each row shows its own `amountAsStated` (the source's words) and the **last entry** of its financial status history, which is the current status. "Date not stated" means the seed records the status without a source-given date.
- **No totals.** Nothing is summed: not within an event, not across instruments and not across value roles.
- **Parts are not additive.** Rows marked *part of* are allocations of a parent row and must never be added to it.
- **Private rows** are shown only so the record is complete. They are not public support.
- **Indications** are statements of intent. A non-binding letter of intent is not a commitment.
- **Stage and material** are the tracker's codes for each row (`stages`, `materialIds`). They describe what the financed activity covers. They do not say whether any output will be sold to DoD or will meet the clause.

## Recorded capital, by event

### MP Materials — DoD public-private partnership (`evt-us-dod-mp-2025`, 10 July 2025)

| Row | Instrument / role | Amount as stated | Current status | Stages · materials |
| --- | --- | --- | --- | --- |
| `fin-us-dod-mp-2025-preferred-equity` | equity · commitment | "$400 million equity investment" | disbursed (date not stated; the company's 10-Q says "In July 2025") | separation, processing, component manufacturing · rare earths, NdFeB magnets |
| `fin-us-dod-mp-2025-additional-preferred-option` | equity · **funding option** | "up to $350 million in additional funding in the form of additional Series A Preferred Stock" | contracted 2025-07-09 | rare earths, NdFeB magnets |
| `fin-us-dod-mp-2025-samarium-loan` | loan · commitment, *drawn from* the Office of Strategic Capital (OSC) lending authority | "$150,000,000 (the "Samarium Project Loan")" | disbursed (date not stated; the 10-K reports the note issued in August 2025) | separation · rare earths |
| `fin-us-dod-mp-2025-price-floor` | price floor · commitment | — (no amount stated) | contracted 2025-07-09 | neodymium, praseodymium |
| `fin-us-dod-mp-2025-magnet-offtake` | offtake · commitment | — (no amount stated) | contracted 2025-07-09 | component manufacturing · NdFeB magnets |
| `fin-us-dod-mp-2025-bank-financing` | loan · **private financing** | "at least $1,000,000,000 (the "10X Facility Funding")" | **lapsed** 2025-08-26 | — |
| `fin-us-dod-mp-2025-company-cash` | **recipient's own funds** (private) | "up to $600,000,000 of its existing cash" | decided 2025-07-09 | refining, component manufacturing · rare earths, NdFeB magnets |

The option is not backing until it is exercised. The lapsed bank facility and the company's cash are private and are not public support.

### Vulcan Elements and ReElement — OSC conditional loans (`evt-us-osc-vulcan-reelement-2025`, 21 November 2025)

| Row | Instrument / role | Amount as stated | Current status | Stages · materials |
| --- | --- | --- | --- | --- |
| `fin-us-osc-vulcan-reelement-2025-joint-commitment` | loan · commitment, *drawn from* the OSC lending authority | "a joint $700 million conditional loan commitment" | decided 2025-11-21 | separation, refining, component manufacturing · rare earths, NdFeB magnets |
| `fin-us-osc-vulcan-reelement-2025-vulcan-elements-loan` | loan · *part of* the joint commitment | "one to Vulcan for $620 million" | decided 2025-11-21 | rare earths, NdFeB magnets |
| `fin-us-osc-vulcan-reelement-2025-reelement-loan` | loan · *part of* the joint commitment | "one to ReElement for $80 million" | decided 2025-11-21 | rare earths, NdFeB magnets |
| `fin-us-commerce-chips-vulcan-2025-incentives` | **indication** | "a preliminary non-binding letter of intent to provide $50 million in proposed federal incentives under the CHIPS and Science Act" | announced 2025-11-21 | — |

The two parts are allocations of the joint commitment, not additions to it. The commitment is *conditional*, and its recorded status is decided, not contracted.

### USA Rare Earth — CHIPS award (`evt-us-chips-usar-2026`, 26 January 2026)

| Row | Instrument / role | Amount as stated | Current status | Stages · materials |
| --- | --- | --- | --- | --- |
| `fin-us-chips-usar-2026-direct-funding` | instrument unspecified · commitment | "a maximum award amount of $277.0 million in the aggregate" | contracted 2026-06-03 | mining, processing, refining, component manufacturing · rare earths, gallium, dysprosium, terbium, NdFeB magnets |
| `fin-us-chips-usar-2026-loan-guarantee` | **loan guarantee** · commitment | guarantee of "advances in an aggregate principal amount of $1.3 billion … made by the Federal Financing Bank" | contracted 2026-06-03 | same as above |

Each aggregate has five project-level *part of* rows in the seed: Round Top, Stillwater Magnet, Stillwater Metal, Magnet Project 2 and Metal Project 2. They are allocations, not additions. The guarantee covers the government's exposure on Federal Financing Bank advances. It is a different instrument from the direct funding and is never added to it.

### 5N Plus — germanium (`evt-us-dod-5n-germanium-2024`, 16 April 2024; `evt-us-dow-5n-germanium-2025`, 15 December 2025)

| Row | Instrument / role | Amount as stated | Current status | Stages · materials |
| --- | --- | --- | --- | --- |
| `fin-us-dod-5n-germanium-2024` | grant · commitment | "$14.4 million" | partially disbursed (date not stated) | refining, component manufacturing · germanium |
| `fin-us-dow-5n-germanium-2025` | grant · commitment | "$18.1 million" | decided 2025-12-15 | recycling, refining · germanium |

## Analysis (draft; alignment, not causation)

This section maps recorded stages and materials against the rule's text. It makes no claim about why any financing was made.

1. **Magnet feedstock.** The 2027 test reaches the mining, refining and separation of feedstock for NdFeB and samarium-cobalt magnets. The MP preferred equity and samarium loan and the Vulcan/ReElement joint commitment are coded at separation or refining for rare earths (the joint commitment's two part loans carry no stage coding of their own). The USA Rare Earth awards are coded from mining through component manufacturing. The financing and the 2027 test therefore sit at the same stages. The legal standing differs by row:
   - **Disbursed:** the MP equity and the MP samarium loan.
   - **Contracted:** the USA Rare Earth awards.
   - **Decided but conditional, not yet contracted:** the Vulcan and ReElement loans.
2. **Magnet manufacture.** Before 2027, the clause already tests where a magnet is "melted or produced". Rows coded at component manufacturing therefore fall under the rule's current stage, not only its 2027 stage. Among public rows, these are the MP preferred equity, the MP offtake, the Vulcan/ReElement joint commitment, and the USA Rare Earth awards and their magnet allocations. MP's own cash is also coded there, but it is private money, not public support. The recycled-magnet exception (NdFeB milled and sintered in the US, extended to samarium-cobalt by section 844(a)) is a separate route. No row in this set is coded to it.
3. **Germanium timing.** Gallium and germanium become covered material only on 18 December 2027. The two 5N Plus grants (2024 and 2025) and the USA Rare Earth award's gallium coding come before that date. Shared materials and dates do not establish that the grants respond to the amendment.
4. **Outside the frame.** Tantalum, tungsten and molybdenum are covered material, but this set has no tracked US financing row for them. That reflects SMPT's coverage, not evidence that no such financing exists.

## Open questions for review

- Promote the two candidate rule records only after source verification. Check the effective-date coding, the untracked materials (samarium, tantalum, molybdenum) and whether to split the rule into one record per stage.
- Confirm whether a DFARS case implements Pub. L. 119-60 sections 843, 844 and 848. The current clause is dated MAY 2024.
- Re-check H.R. 9073 before relying on 1 January 2027.
- Decide whether each covered-material clause should become a `ctl-*` control row once the rule is promoted.

## Sources

Rule (primary):
- 10 U.S.C. 4872 (U.S. Code, 2024 ed.): https://www.govinfo.gov/content/pkg/USCODE-2024-title10/pdf/USCODE-2024-title10-subtitleA-partV-subpartI-chap385-subchapIII-sec4872.pdf
- DFARS 252.225-7052 (MAY 2024): https://www.acquisition.gov/dfars/252.225-7052-restriction-acquisition-certain-magnets-tantalum-and-tungsten
- DFARS 225.7018-1 Definitions: https://www.acquisition.gov/dfars/225.7018-1-definitions
- DFARS 225.7018-2 Restriction: https://www.acquisition.gov/dfars/225.7018-2-restriction
- Pub. L. 119-60, National Defense Authorization Act for Fiscal Year 2026 (S. 1071, approved 18 December 2025), enrolled text, secs. 843, 844 and 848 at 139 Stat. 975–979: https://www.govinfo.gov/content/pkg/PLAW-119publ60/html/PLAW-119publ60.htm
- House Armed Services Committee Print 119-3 (secondary reproduction of the same text, with the joint explanatory statement): https://www.govinfo.gov/content/pkg/CPRT-119HPRT62529/html/CPRT-119HPRT62529.htm
- H.R. 9073 (introduced): https://govinfo.gov/content/pkg/BILLS-119hr9073ih/html/BILLS-119hr9073ih.htm

Capital (from existing seed records; each row's status sources are in its `evidence` and status histories):
- MP Materials 8-K: https://www.sec.gov/Archives/edgar/data/1801368/000119312525157310/d43796d8k.htm
- OSC first-loan release: https://www.war.gov/News/Releases/Release/Article/4270722/office-of-strategic-capital-announces-first-loan-through-dod-agreement-with-mp/
- OSC Vulcan/ReElement release: https://www.war.gov/News/Releases/Release/Article/4339788/office-of-strategic-capital-agrees-to-joint-700m-conditional-loan-commitment-wi/
- NIST CHIPS letter-of-intent announcement (USA Rare Earth): https://www.nist.gov/news-events/news/2026/01/department-commerces-chips-program-announces-letter-intent-usa-rare-earth
- USA Rare Earth 8-K: https://www.sec.gov/Archives/edgar/data/1970622/000121390026064453/ea0293402-8k_usarare.htm
- DoD 5N Plus award (2024): https://www.defense.gov/News/Releases/Release/Article/3743467/dod-awards-144-million-to-sustain-and-enhance-the-space-qualified-solar-cell-su/
- Department of War 5N Plus investment (2025): https://www.war.gov/serve-from-netstorage/News/Releases/Release/Article/4393075/department-of-war-invests-181m-to-increase-us-refining-capacity-for-germanium-m/index.html
