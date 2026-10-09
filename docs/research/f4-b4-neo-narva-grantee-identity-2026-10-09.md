# F4-B4 — Correct the present legal beneficiary of Neo's Estonia JTF grant

**Evidence review: 9 October 2026.** Base: F4-B3 Neo audit PR #106 squash-merged `c9c4bfe`. This is a **current organization-identity repair**, not historical amount backfill, disbursement revision, project-delivery assertion, or editorial publishing action.

## Determination: sponsor versus legal grant beneficiary

SMPT's current financial record `fin-eu-jtf-2025-neo-magnet-project` names "Neo Performance" and links `org-neo-performance` as **recipient**. The European Commission RESourceEU action plan speaks about "Neo Performance's Rare earths magnet project in Estonia", which identifies a **group-level sponsor/project** but does not prove that the listed parent corporation was the Estonian JTF contracting grantee.

Two first-party Estonian government records independently resolve the **current** legal beneficiary:

1. **Estonian Business and Innovation Agency, [supported-project register](https://eis.ee/toetatud-projektid/?grant_size_from=0&grant_size_to=30000000&recipient=&s%5Bprogram%5D=ida-viru-ettev-tluse-investeeringute-toetus&s%5Byear%5D=all&sort=project_recipient%3Aasc)**: `Magnetitehas Narva`, `Toetuse saaja: NPM Narva OÜ`, registry **16493223**, current grant **€14,790,898**, project cost **€63,327,184**, JTF. This is a currently published *award listing*; it is not an audited payment ledger or historical 2024 amendment ceiling.
2. **Estonian Ministry of Finance, [JTF-2/2025 audit](https://www.fin.ee/sites/default/files/documents/2025-11/A1-1_Auditi_l6pparuanne.pdf)**: printed **p. 3**, section 1.1, explicitly identifies `Toetuse saaja ja partner(id): NPM Narva OÜ ja partner NPM Silmet OÜ`. On printed **p. 7, footnote 8** and corresponding audit finding, it states that the original NPM Silmet OÜ was replaced as main recipient, with **95% of project activities/budget transferred to NPM Narva OÜ** and NPM Silmet retained as 5%-budget partner. Official decision `11-2/23/3085` is dated **3 November 2023**. The audit independently documents original decision `11-2/22/3107` (2022), later `11-2/24/4882` (28 Nov 2024), and `11-2/25/4023` (16 Sep 2025).

This is sufficient for a **current identity fix**: the recipient is NPM Narva OÜ, not the publicly described parent group Neo Performance. It is **not** sufficient to assert an exact legal grant-recipient-effective instant in November 2023 without the original decision's effectiveness/notification terms. The 2022 status remains source-linked to the issuer's original public announcement and is not silently rewritten into a historical NPM Narva award.

## Narrow changes

- Adds **one separate company** `org-npm-narva-ou`, country `EE`, registration 16493223 in notes, and independent official-source name/kind/country citations. The older `org-neo-performance` remains and can still represent project/group sponsorship.
- Does **not** add an `OrganizationLink` direct-parent claim: the audit describes group involvement, but the **intermediate legal holding chain** is not established by this evidence. Parent-company aliases do not stand in for separate legal persons.
- Changes just one existing finance recipient: `recipient: "NPM Narva OÜ"`, `recipientOrgIds: ["org-npm-narva-ou"]`. EIS and Ministry existing evidence now explicitly supports `recipient`; the parent-level EC action plan/2022 press release no longer asserts formal legal recipient.
- Updates F4 research reconciliation to `current_legal_recipient_corrected`. This resolves the **current** entity-identity review, but leaves the historic 2022→2023 recipient effective-day and the 2024/2025 grant amendment amount/effectiveness questions *open*.
- Updates Neo F4 research queue and prior tests, with a dedicated regression suite testing source support, legal-identity distinction, historic uncertainty and **unchanged present totals**.

## Deliberate non-actions

- Current finance amount remains **approximately €14.8 million** in canonical form. Official EIS **€14,790,898** is supporting a current displayed approximation, not a newly added grant/standalone paid receipt or a universal exact figure for all historical dates.
- Existing `valueRole: commitment`, `instrument: grant`, statuses `decided 2022-11-09` and `partially_disbursed 2025-12-31`, project `prj-ee-neo-rare-earth-magnet-project`, 96 finance rows, methods of summation and **public capital totals** all remain unchanged.
- **No `financialAmountHistory`** on Neo. Full decisions `11-2/24/4882` and `11-2/25/4023` (including signed/served effective day and euro amount), and `11-2/23/3085` for historic transfer, are **not located in a verified accessible original**. The source-audit report points to them, but does not reproduce their operative terms.
- No new project event, shadow collector, bank disbursement, financial aggregation algorithm, public analytics page or deployment.

## Next source-access task (not sent)

The responsible program authority identified by the Ministry audit is **Ettevõtluse ja Innovatsiooni Sihtasutus (EIS)**. When primary decisions cannot be obtained from its public registry, submit a document-access request through an official EIS public channel, specifying the exact project and four decision references. Do not imply all documents will be public without privacy/commercial redactions. Suggested request text (Estonian) for **human review before sending**:

> Palun võimaldada juurdepääs projekti `2021-2027.6.01.22-0002` „Magnetitehas Narva” taotluse rahuldamise otsusele `11-2/22/3107` (03.11.2022) ning muutmise otsustele `11-2/23/3085` (03.11.2023), `11-2/24/4882` (28.11.2024) ja `11-2/25/4023` (16.09.2025), sealhulgas otsuste lisad ja jõustumise/teatavakstegemise tingimused. Eelkõige soovin kontrollida toetuse saaja muutumist, toetuse täpset summat ning muudatuste õiguslikku jõustumisaega iga otsuse alusel. Kui dokumentide osad on juurdepääsupiiranguga, palun võimalusel väljastada avalikustatav osa või teada anda õiguslik alus ja taotluse esitamise sobiv viis.

Only after these complete decision texts (or equivalent verified legal instruments) have been received and checked can another phase consider a **dated grant amount and recipient series**. Record source publication and legal effectiveness separately. Nothing was sent as part of this branch.

## Acceptance gate

Human review of government identity citations and organizational taxonomy, then exact-head CI: `npm audit --omit=dev --audit-level=moderate`, `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run audit:f4`. Verify the amount-history coverage remains 2/96, 94 finance rows unreviewed and 3 pending amendment candidates. Do not merge/deploy before maintainer approval. F4-C historical sums stay unauthorized.
