import test from "node:test";
import assert from "node:assert/strict";
import { BINDING_FINANCIAL_STATUSES, currentFinancialStatus } from "@/lib/capital-control";
import {
  getAllFinancialCommitments,
  getFinancialCommitmentById,
  getProjectById,
  getSourceById,
} from "@/lib/data";
import { deriveLifecycleRefreshQueue } from "@/lib/lifecycle-refresh";

// Review of the two 5N Plus St. George awards, sources read 2026-10-04.
const REVIEWED_AT = "2026-10-04";
const dod = () => getFinancialCommitmentById("fin-us-dod-5n-germanium-2024")!;
const dow = () => getFinancialCommitmentById("fin-us-dow-5n-germanium-2025")!;
const EXPANSION = "src-5n-st-george-expansion-2026";

test("2024 award: executed per the federal award record; partially disbursed on federal-reporting attribution only", () => {
  const row = dod();
  const history = row.financialStatusHistory.map(({ status, date, sourceId }) => ({ status, date, sourceId }));
  assert.deepEqual(history, [
    { status: "decided", date: null, sourceId: "src-dod-5n-germanium-2024" },
    { status: "contracted", date: "2024-04-11", sourceId: "src-usaspending-fa86502425501" },
    // A File C reporting period is not a payment date, so this entry is undated.
    { status: "partially_disbursed", date: null, sourceId: "src-usaspending-fa86502425501" },
  ]);
  const source = getSourceById("src-usaspending-fa86502425501")!;
  assert.equal(source.datePublished, null, "a living federal record has no publication date");
  assert.equal(source.dateAccessed, REVIEWED_AT);
  assert.ok(
    row.evidence.some((e) => e.sourceId === source.id && e.supports.includes("status")),
    "the contracted and partially_disbursed entries' source must support status",
  );
  assert.equal(currentFinancialStatus(row), "partially_disbursed");
  assert.ok(BINDING_FINANCIAL_STATUSES.includes(currentFinancialStatus(row)!));

  // Three distinct figures: the announced amount stays as stated; the federal obligation and the
  // non-federal funding differ from it and are documented, never substituted or reconciled.
  assert.equal(row.amount?.value, "14400000");
  assert.equal(row.amount?.qualifier, "exact");
  const contracted = row.financialStatusHistory[1].note!;
  for (const text of [row.notes!, contracted]) {
    for (const figure of ["14.4M", "12,458,128", "2,505,981"]) assert.ok(text.includes(figure), `${figure} must appear`);
    assert.match(text, /not reconciled/);
  }
  assert.match(row.notes!, /None of these is confirmed as the amount executed or paid/);
  // The reported obligation is a federal-dataset fact; the open question is how it relates to the announced figure.
  assert.match(row.notes!, /the federal obligation reported for the award, \$12,458,128/);
  assert.match(row.notes!, /how the announced figure relates to the reported federal obligation\. That relationship is the unresolved question/);
  assert.match(contracted, /the federal obligation reported in the record is \$12,458,128/);
  const dodEvidence = row.evidence.find((e) => e.sourceId === "src-dod-5n-germanium-2024")!;
  assert.match(dodEvidence.note!, /announced amount\. It is unreconciled with the \$12,458,128 federal obligation.*no amount paid is recorded/);

  // Execution comes from the federal award record, whose agreement text was not inspected.
  assert.match(contracted, /establishes an executed agreement; the agreement text was not inspected/);
  assert.match(row.notes!, /execution of a cooperative agreement is established by the federal award record/);

  // Partial disbursement is attributed to federal reporting, not to DoD or 5N+, with no date or amount paid.
  const partial = row.financialStatusHistory[2].note!;
  assert.match(partial, /^Federal-reporting attribution only: neither DoD nor 5N\+ states a payment/);
  for (const amount of ["998,701.28", "1,032,342.24", "399,308.73"]) {
    assert.match(partial, new RegExp(amount.replace(/\./g, "\\.")));
  }
  assert.match(partial, /fiscal-year-beginning-to-period-end/);
  assert.match(partial, /A reporting period is not a payment date, so the date is left null/);
  assert.match(partial, /no amount paid is recorded/);
  assert.match(partial, /\$0 account outlay does not contradict them/);
  assert.match(partial, /first partial disbursement resting on federal-reporting data/);
  assert.match(partial, /human review/);
  // Year-end data: available-but-empty (FY2024, FY2025) is kept apart from not-yet-available (FY2026 at retrieval).
  assert.match(partial, /for FY2024 the period-12 submission is available and holds account rows for other awards but no outlay line for this award/);
  assert.match(partial, /for FY2025 the period-12 submission is available but the File C data retrieved hold no rows for the account in it/);
  assert.match(partial, /for FY2026 no year-end submission existed at retrieval on 4 October 2026/);
  assert.doesNotMatch(partial, /final submissions retrieved/);
  // Undated entry: evidence as reviewed, not a claim about any earlier date.
  assert.match(partial, /does not establish that any disbursement had occurred at an earlier date/);
  assert.match(row.notes!, /Some payment is reported in federal-reporting data only/);
  assert.match(row.notes!, /no date of payment or amount paid is recorded/);
  assert.equal(row.financialStatusHistory[1].date, "2024-04-11", "the contracted date is the signing date, not a reporting period");
});

test("no germanium record or source note says 'no payment' or 'nothing funded', or calls the outlay lines non-payments", () => {
  // Also bans a total of the three outlay lines: one observation per fiscal year, never a cumulative paid figure.
  const banned = [/no payment/i, /nothing funded/i, /not dated payments/i, /not payments/i, /2,430,352/];
  const texts: string[] = [];
  for (const row of [dod(), dow()]) {
    texts.push(row.notes ?? "");
    for (const entry of [...row.financialStatusHistory, ...row.implementationStatusHistory]) texts.push(entry.note ?? "");
    for (const ev of row.evidence) texts.push(ev.note ?? "");
    for (const term of row.terms) texts.push(term.note ?? "");
  }
  for (const id of ["src-usaspending-fa86502425501", "src-5n-mda-q1-2024", "src-5n-mda-q2-2024", "src-5n-mda-q4-2025", "src-5n-sustainability-2025"]) {
    texts.push(getSourceById(id)!.notes ?? "");
  }
  for (const text of texts) for (const pattern of banned) assert.doesNotMatch(text, pattern);
});

test("'pre-set milestones' is attributed to the recipient's MD&As, not the April 2024 press release", () => {
  const row = dod();
  for (const id of ["src-5n-mda-q1-2024", "src-5n-mda-q2-2024"]) {
    assert.match(getSourceById(id)!.notes!, /pre-set milestones/);
    assert.ok(row.evidence.some((e) => e.sourceId === id && e.supports.includes("terms")));
  }
  const release = row.evidence.find((e) => e.sourceId === "src-5n-germanium-2024")!;
  assert.match(release.note!, /does not mention milestones/);
  assert.match(row.terms[0].note!, /only in 5N\+'s Q1 and Q2 2024 MD&As/);
});

test("2025 award stays decided: no execution or payment evidence is established in the reviewed sources", () => {
  const row = dow();
  assert.deepEqual(
    row.financialStatusHistory.map(({ status, date }) => ({ status, date })),
    [{ status: "decided", date: "2025-12-15" }],
  );
  assert.ok(!BINDING_FINANCIAL_STATUSES.includes(currentFinancialStatus(row)!));
  assert.ok(!row.evidence.some((e) => e.sourceId === "src-usaspending-fa86502425501"));
  assert.match(row.financialStatusHistory[0].note!, /not advanced to contracted/);
  assert.match(row.notes!, /no execution or payment evidence established in the reviewed sources/);
  assert.match(row.financialStatusHistory[0].note!, /No execution or payment evidence is established in the reviewed sources/);
  // The FY2025 MD&A is a recipient disclosure that calls the grant awarded and does not name the facility.
  const mda = row.evidence.find((e) => e.sourceId === "src-5n-mda-q4-2025")!;
  assert.ok(!mda.supports.includes("facility") && !mda.supports.includes("location") && !mda.supports.includes("status"));
  // The sustainability report names St. George but is future-tense, undated, and supports no status.
  const report = row.evidence.find((e) => e.sourceId === "src-5n-sustainability-2025")!;
  assert.deepEqual(report.supports, ["facility", "location"]);
  const source = getSourceById("src-5n-sustainability-2025")!;
  assert.equal(source.datePublished, null, "the report states no publication date; file metadata is not recorded as one");
  assert.match(source.notes!, /planned expansion/);
});

test("neither award has a physical stage beyond announced, and the 50% facility expansion is not attributed to either", () => {
  const announced = { "fin-us-dod-5n-germanium-2024": "2024-04-16", "fin-us-dow-5n-germanium-2025": "2026-01-29" };
  for (const row of [dod(), dow()]) {
    assert.deepEqual(
      row.implementationStatusHistory.map(({ status, date, sourceId }) => ({ status, date, sourceId })),
      [
        {
          status: "announced",
          date: announced[row.id as keyof typeof announced],
          sourceId: row.financialStatusHistory[0].sourceId,
        },
      ],
    );
    assert.match(row.implementationStatusHistory[0].note!, /no later physical stage of the funded scope is evidenced/);
    assert.match(row.implementationStatusHistory[0].note!, /records this stated plan, not construction/);
    assert.match(row.notes!, /records the stated plan and not construction/);
    assert.equal(row.facility, "St. George facility");
    assert.ok(!row.evidence.some((e) => e.sourceId === EXPANSION));
    assert.match(row.notes!, /does not attribute it to this award/);
    assert.deepEqual(row.lifecycleReview, {
      financialStatusCheckedAt: REVIEWED_AT,
      implementationStatusCheckedAt: REVIEWED_AT,
    });
    assert.ok(!getProjectById(row.projectId!)!.evidence.some((e) => e.sourceId === EXPANSION));
  }
  assert.match(getSourceById(EXPANSION)!.notes!, /existing capital expenditure plans and support from customers/);
  assert.notEqual(dod().projectId, dow().projectId, "the awards remain distinct project scopes");
});

test("review stamps keep the financial and physical clocks apart and stay within the queue's categories", () => {
  const rows = [dod(), dow()];
  const q = deriveLifecycleRefreshQueue(
    rows,
    rows.map((row) => getProjectById(row.projectId!)!),
    REVIEWED_AT,
  );
  for (const row of q.rows) {
    assert.equal(row.financial.checkedAt, REVIEWED_AT);
    assert.equal(row.implementation.checkedAt, REVIEWED_AT);
    assert.equal(row.implementation.status, "announced", "the physical status comes from the status entry, not the review date");
    assert.equal(row.financial.priority, "P3");
    assert.equal(row.implementation.priority, "P3");
  }
  // At a later date the unevidenced physical clock reopens without any new status entry.
  const later = deriveLifecycleRefreshQueue(rows, rows.map((row) => getProjectById(row.projectId!)!), "2027-01-03");
  assert.ok(later.rows.every((row) => row.implementation.priority === "P2" && row.financial.priority !== "P1"));
});

test("germanium has exactly one binding government commitment among the St. George awards", () => {
  const binding = getAllFinancialCommitments().filter(
    (row) =>
      row.materialIds.includes("germanium") &&
      row.valueRole === "commitment" &&
      row.capitalSource === "public" &&
      row.projectId?.startsWith("prj-us-5n-st-george") &&
      BINDING_FINANCIAL_STATUSES.includes(currentFinancialStatus(row)!),
  );
  assert.deepEqual(binding.map((row) => row.id), ["fin-us-dod-5n-germanium-2024"]);
});
