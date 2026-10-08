# U.S. Antimony DPA Title III award: sourced geographic allocation

Review date: 2026-10-07. Draft tranche only; no merge/deployment authorized.

## Reader decision

One **$27M DoW DPA Title III grant** funds two work streams. The recipient's May 2026 SEC-furnished transcript disaggregates the *same* award into **$20M for Thompson Falls** and **$7M for Alaska**. The parts are not incremental grants. The project's capital stacks can cite each part, while national aggregate totals count the parent once.

## Claim ledger

| Claim | Primary source and locator | Treatment |
| --- | --- | --- |
| USAC received one $27M DoW Title III award dated February 24, 2026 | DoW release, March 4, 2026, opening/award-scope paragraphs, `src-dow-usac-antimony-2026` | Existing parent row unchanged in amount/instrument/provider |
| $20M for Thompson Falls; $7M for Alaska | USAC May 14 Q1 2026 earnings call transcript furnished as EX-99.1 to May 15 SEC Form 8-K, answer by CEO Gary Evans to Jonathan Miller, pp. 14–16, `src-usac-2026-q1-call-sec-exhibit` | Two exact child rows with `part_of` relationships to the $27M parent; source attributed to company, not the government |
| Thompson Falls smelting/processing expansion | DoW release; USAC Form 10-Q for Q2 2026, Note 9 and PP&E, `src-usac-2026-q2-10q` | First-class `processing` and `refining` project; no stage-level amount split |
| Alaska mining/feedstock | DoW release and USAC earnings-call transcript | Generic Alaska project, `mining` stage; no unsourced identification with any particular Alaska mine |
| $12.8M accepted milestone payments received in April 2026 and recorded against Thompson Falls construction | USAC Q2 Form 10-Q, Note 9 | Thompson Falls row `partially_disbursed` with undated entry: only month stated; $12.8M is a subset of its $20M, not a third commitment |
| $16.2M currently obligated, $10.8M subject to future authorization | USAC Q2 Form 10-Q, Note 9 | Parent terms retained; **not** equated with 20/7 geographic split |
| Future Alaska payment timing and processing throughput | Company CEO's May call; forward-looking comments | **Not** promoted to payment/physical-status facts |

## Constraints and acceptance

1. No new event, control, economic estimate or physical-production claim.
2. One parent grant plus two child allocations, each with source-specific `part_of` evidence and one registry project. Global totals still count exactly $27M, and the individual project stacks show $20M and $7M respectively.
3. The Thompson $12.8M milestone receipt is not presented as total disbursement; the Alaska $7M is not presumed paid or separately obligated.
4. Validate, typecheck, lint, test and build on the **final** revision. Visual/preview verification is deferred while Vercel is rate limited.

Sources:
- https://www.war.gov/News/Releases/Release/Article/4421101/department-of-war-invests-27m-for-the-domestic-excavation-extraction-processing/
- https://www.sec.gov/Archives/edgar/data/101538/000110465926062742/tm2614820d1_ex99-1.htm
- https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/uamy-20260630x10q.htm
