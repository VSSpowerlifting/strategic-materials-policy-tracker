# Thompson Falls Q2 2026 — physical implementation evidence

Review date: 2026-10-08. Existing registry: `fin-us-dow-usac-antimony-2026-thompson-falls` and `prj-us-usac-thompson-falls-expansion`.
This is a **physical lifecycle correction**, not a new award, payment, borrower, project or capital amount.

## What the SEC filing establishes
[US Antimony Corp. June 30, 2026 Form 10-Q](https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/uamy-20260630x10q.htm) (filed August 11, 2026), **Note 9 (Government Grant)** states the expansion was substantially completed in Q2 and approximately **$4.1M** related assets were placed in service late in the quarter. **Note 16 (Thompson Falls, Montana Facility Expansion)** says the roughly **$39M total expansion cost** had approximately **$33M incurred** as of June 30, with about **$29M gross cost still in construction in progress**. The $29M is shown net of the grant recognition in the PP&E balance sheet; do not mix these bases. These expansion costs are corporate project spending, **not** additional federal grants.

**Financial clock remains unchanged:** the existing federal DPA Title III package is **$27M** (only **$16.2M then obligated**, **$10.8M requiring further authorization**), with subsidiary allocations **$20M Thompson Falls** and **$7M Alaska**. The Form 10-Q confirmed **$12.8M cash received in April 2026**, already coded to the parent and Thompson Falls child as partially disbursed, not to a second award.

## Conservative physical-state decision
- Add a single `implementationStatusHistory` entry to the Thompson Falls **child row only**, `status: construction`, `date: null`, `sourceId: src-usac-2026-q2-10q`. Physical expansion substantially complete by Q2, with some assets in service, but **not enough evidence for the entire grant-supported expansion to be operational/completed**. `date: null` avoids inventing the construction start or exact activation date based on a quarter-end filing.
- Preserve both processing/refining stages as unallocated and no new per-stage finance. Do not add a parallel physical row on the $27M parent, which is nonallocative and also covers Alaska.
- Expand the existing SEC source provenance and project evidence, record implementation lifecycle review dated 2026-10-08. Do not mark the independently maintained financial lifecycle reviewed by this physical-only check.
- Keep Alaska's $7M work stream at its evidence-based decided standing; no inferred mine, construction or payment.

## Recheck criteria
Run seed/schema validation, TypeScript, lint, full tests and production build on exact PR SHA. The focal tests enforce a construction-only maturity stage, explicit Q2 physical evidence, conserved $27M parent totals, and untouched $12.8M finance history. No EXIM, UpCatalyst, Thacker Pass, Rhyolite Ridge #84 or monitor changes. Vercel preview can remain rate-limited independently; no merge without maintainer authorization.
