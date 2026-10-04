import test from "node:test";
import assert from "node:assert/strict";
import { publicCommitmentRows, totalCommitments } from "@/lib/capital-control";

import {
  getAllFinancialCommitments,
  getAllProjects,
  getFinancialCommitmentById,
  getProjectById,
} from "@/lib/data";
import {
  deriveLifecycleRefreshQueue,
  formatLifecycleRefreshQueue,
} from "@/lib/lifecycle-refresh";

const AS_OF = "2026-10-02";

test("10X construction remains tracked after private financing expires", () => {
  const bank = getFinancialCommitmentById("fin-us-dod-mp-2025-bank-financing")!;
  const offtake = getFinancialCommitmentById("fin-us-dod-mp-2025-magnet-offtake")!;
  const project = getProjectById("prj-us-mp-10x-facility")!;
  assert.deepEqual(
    bank.financialStatusHistory.map(({ status, date }) => ({ status, date })),
    [{ status: "decided", date: "2025-07-09" }, { status: "lapsed", date: "2025-08-26" }],
  );
  assert.equal(bank.valueRole, "private_financing");
  assert.equal(bank.capitalSource, "private");
  assert.equal(bank.amount?.value, "1000000000");
  assert.deepEqual(publicCommitmentRows([bank, offtake]).map(({ id }) => id), [offtake.id]);
  assert.equal(offtake.financialStatusHistory.at(-1)?.status, "contracted");
  assert.equal(offtake.financialStatusHistory.at(-1)?.date, "2025-07-09");
  assert.equal(offtake.amount, null);
  for (const commitment of [bank, offtake]) {
    const physical = commitment.implementationStatusHistory.at(-1)!;
    assert.equal(physical.status, "construction");
    assert.equal(physical.date, null, "a reporting date is not a construction start date");
    assert.equal(physical.sourceId, "src-mp-10q-2026-q2");
  }
  const reviewedAt = "2026-10-03";
  const q = deriveLifecycleRefreshQueue([bank, offtake], [project], reviewedAt);
  assert.equal(q.bundles.length, 1);
  assert.equal(q.bundles[0].priority, "P3");
  for (const row of q.rows) {
    assert.equal(row.financial.referenceDate, reviewedAt);
    assert.equal(row.implementation.referenceDate, reviewedAt);
    assert.equal(row.implementation.applicable, true);
    assert.equal(row.implementation.status, "construction");
  }
  assert.equal(offtake.outcomes.find(({ metric }) => metric === "target_date")?.targetDate, "2028");
});

test("Allied Material's planned plant does not imply construction or grant payment", () => {
  const commitment = getFinancialCommitmentById("fin-jp-jogmec-almt-tungsten-grant")!;
  const project = getProjectById("prj-jp-almt-tungsten")!;
  assert.equal(commitment.financialStatusHistory.at(-1)?.status, "decided");
  assert.equal(commitment.financialStatusHistory.at(-1)?.date, null);
  assert.equal(commitment.amount?.value, "7500000000");
  assert.equal(commitment.amount?.qualifier, "approximately");
  const physical = commitment.implementationStatusHistory.at(-1)!;
  assert.ok(physical, "the announced physical project is recorded");
  assert.equal(physical.status, "announced");
  assert.equal(physical.date, "2026-04-09");
  assert.equal(physical.sourceId, "src-allied-tungsten-expansion-20260409");
  assert.equal(project.locations[0].countryCode, "JP");
  assert.match(project.locations[0].asStated!, /富山製作所/);
  const target = commitment.outcomes.find(({ metric }) => metric === "target_date")!;
  assert.equal(target.targetDate, "2028");
  assert.match(target.asStated, /2028年度上期/);
  assert.equal(target.statedBy, "recipient");
  assert.equal(commitment.terms[0].qualifier, "up_to");
  const reviewedAt = "2026-10-03";
  const q = deriveLifecycleRefreshQueue([commitment], [project], reviewedAt);
  assert.equal(q.bundles[0].priority, "P3");
  assert.equal(q.rows[0].financial.referenceDate, reviewedAt);
  assert.equal(q.rows[0].implementation.referenceDate, reviewedAt);
  assert.equal(q.rows[0].financial.statusDate, null);
  assert.equal(q.rows[0].implementation.statusDate, "2026-04-09");
});

test("Lofdal's initial SPC investment, pending project transfer and feasibility work stay separate", () => {
  const commitment = getFinancialCommitmentById("fin-jp-jogmec-lofdal-2026-equity")!;
  const project = getProjectById("prj-na-lofdal")!;
  assert.deepEqual(
    commitment.financialStatusHistory.map(({ status, date }) => ({ status, date })),
    [
      { status: "decided", date: null },
      { status: "partially_disbursed", date: "2026-07-23" },
    ],
  );
  assert.equal(commitment.amount?.value, "47668000");
  assert.equal(commitment.amount?.currency, "CAD");
  assert.equal(commitment.amount?.qualifier, "up_to");
  assert.equal(commitment.implementationStatusHistory.at(-1)?.status, "feasibility");
  assert.equal(commitment.implementationStatusHistory.at(-1)?.date, null);
  assert.match(project.notes!, /shareholder consent.*regulatory approvals/);
  assert.match(commitment.notes!, /initial investment amount is not disclosed/);
  assert.match(commitment.notes!, /C\$23 million earn-in/);
  assert.equal(commitment.terms.length, 0, "underlying JV conditions are not terms of the SPC equity row");
  const reviewedAt = "2026-10-03";
  const q = deriveLifecycleRefreshQueue([commitment], [project], reviewedAt);
  assert.equal(q.bundles[0].priority, "P3");
  assert.equal(q.rows[0].financial.referenceDate, reviewedAt);
  assert.equal(q.rows[0].implementation.referenceDate, reviewedAt);
  assert.equal(q.rows[0].financial.statusDate, "2026-07-23");
  assert.equal(q.rows[0].implementation.statusDate, null);
});

test("GGT's Regolith financing stays announced while its Mississauga demonstration facility is commissioning", () => {
  const commitment = getFinancialCommitmentById("fin-ca-pdac-2026-ggt-eip")!;
  const project = getProjectById("prj-ca-ggt-regolith-graphite")!;
  assert.equal(commitment.financialStatusHistory.at(-1)?.status, "announced");
  assert.equal(commitment.financialStatusHistory.at(-1)?.date, "2026-03-03");
  const physical = commitment.implementationStatusHistory.at(-1)!;
  assert.equal(physical.status, "commissioning");
  assert.equal(physical.date, "2026-08-11");
  assert.equal(physical.sourceId, "src-ggt-mississauga-demo-commissioning-20260811");
  assert.deepEqual(project.locations.map(({ countryCode, subnational }) => ({ countryCode, subnational })), [
    { countryCode: "CA", subnational: "British Columbia" },
    { countryCode: "CA", subnational: "Ontario" },
  ]);
  const reviewedAt = "2026-10-03";
  const q = deriveLifecycleRefreshQueue([commitment], [project], reviewedAt);
  assert.equal(q.bundles[0].priority, "P3");
  assert.equal(q.rows[0].financial.referenceDate, reviewedAt);
  assert.equal(q.rows[0].implementation.referenceDate, reviewedAt);
  assert.equal(q.rows[0].financial.statusDate, "2026-03-03");
  assert.equal(q.rows[0].implementation.statusDate, "2026-08-11");
});

function queue() {
  return deriveLifecycleRefreshQueue(
    getAllFinancialCommitments(),
    getAllProjects(),
    AS_OF,
  );
}

function wicheeda() {
  const commitment = structuredClone(
    getFinancialCommitmentById("fin-ca-pdac-2026-wicheeda-flmf")!,
  );
  const project = getProjectById(commitment.projectId!)!;
  // Keep synthetic freshness cases independent of the live seed's latest review.
  delete commitment.lifecycleReview;
  commitment.implementationStatusHistory = [];
  return { commitment, project };
}

test("Matawinie refresh preserves transaction identity and independent lifecycle dates", () => {
  const equity = getFinancialCommitmentById("fin-ca-g7-2025-nmg-canada-growth-fund")!;
  const indication = getFinancialCommitmentById("fin-ca-g7-2025-nmg-edc-letter-of-interest")!;
  const offtake = getFinancialCommitmentById("fin-ca-g7-2025-nmg-offtake")!;
  assert.equal(equity.instrument, "equity");
  assert.deepEqual(equity.amount, {
    value: "35000000", currency: "CAD", qualifier: "at_least",
    amountAsStated: "more than $35 million from the Canada Growth Fund",
    currencyBasis: "issuer_context",
  });
  assert.deepEqual(equity.financialStatusHistory.slice(-2).map(({ status, date }) => ({ status, date })), [
    { status: "contracted", date: "2024-12-16" },
    { status: "disbursed", date: "2024-12-20" },
  ]);
  assert.equal(indication.valueRole, "indication");
  assert.equal(indication.amount?.value, "430000000");
  assert.equal(indication.amount?.currency, "USD");
  assert.equal(indication.amount?.qualifier, "up_to");
  assert.deepEqual(indication.financialStatusHistory.map(({ status, date }) => ({ status, date })), [
    { status: "announced", date: null },
  ]);
  assert.equal(offtake.amount, null);
  assert.equal(offtake.financialStatusHistory.at(-1)?.status, "contracted");
  assert.equal(offtake.financialStatusHistory.at(-1)?.date, "2026-05-13");
  assert.equal(offtake.terms.find((term) => term.kind === "quantity_covenant")?.value, "30000");
  const duration = offtake.terms.find((term) => term.kind === "duration")!;
  assert.equal(duration.value, "7");
  assert.match(duration.note ?? "", /start of commercial production/);
  for (const commitment of [equity, indication, offtake]) {
    assert.equal(commitment.implementationStatusHistory.at(-1)?.status, "construction");
    assert.equal(commitment.implementationStatusHistory.at(-1)?.date, "2026-04-13");
    assert.deepEqual(commitment.lifecycleReview, {
      financialStatusCheckedAt: AS_OF, implementationStatusCheckedAt: AS_OF,
    });
  }
  const bundle = queue().bundles.find((item) => item.projectId === "prj-ca-nmg-matawinie")!;
  assert.equal(bundle.priority, "P3");
  assert.equal(bundle.rows.length, 3);
  const publicRows = publicCommitmentRows([equity, indication, offtake]);
  assert.deepEqual(publicRows.map((row) => row.id), [equity.id, offtake.id]);
  const totals = totalCommitments(publicRows, [equity, indication, offtake]);
  assert.deepEqual(totals.currencies.map((row) => row.currency), ["CAD"]);
  assert.deepEqual(totals.currencies[0].instruments?.[0].binding, { at_least: "35000000" });
  assert.deepEqual(totals.unquantifiedIds, [offtake.id]);
});

test("the refreshed Cyclic demonstration bundle is complete and no longer a P0 mismatch", () => {
  const bundle = queue().bundles.find(
    (item) => item.projectId === "prj-ca-cyclic-kingston-demonstration-plant",
  );
  assert.ok(bundle, "Cyclic Materials bundle is present");
  assert.equal(bundle.priority, "P3");
  assert.ok(bundle.rows.every((row) => row.financial.status === "contracted"));
  assert.ok(bundle.rows.every((row) => row.implementation.status === "completed"));
  assert.ok(
    bundle.rows.every((row) =>
      row.implementation.reasons.every(
        (reason) => !reason.includes("project evidence states completion"),
      ),
    ),
  );
});

test("expected future completion is not treated as completed", () => {
  const bundle = queue().bundles.find(
    (item) => item.projectId === "prj-ca-ggt-graphite-recycling-pilot",
  );
  assert.ok(bundle, "Green Graphite Technologies bundle is present");
  assert.notEqual(bundle.priority, "P0");
  assert.ok(
    bundle.rows.every((row) =>
      row.implementation.reasons.every(
        (reason) => !reason.includes("project evidence states completion"),
      ),
    ),
  );
});

test("umbrella funding relationships do not collapse distinct named projects", () => {
  const q = queue();
  const cyclic = q.bundles.find(
    (item) => item.projectId === "prj-ca-cyclic-kingston-demonstration-plant",
  );
  const graphite = q.bundles.find(
    (item) => item.projectId === "prj-ca-ggt-graphite-recycling-pilot",
  );
  assert.ok(cyclic);
  assert.ok(graphite);
  assert.notEqual(cyclic.id, graphite.id);
  assert.deepEqual(cyclic.commitmentIds, ["fin-ca-cmrdd-2024-cyclic-materials"]);
  assert.deepEqual(graphite.commitmentIds, ["fin-ca-cmrdd-2024-green-graphite"]);
});

test("human research bundles collapse commitments that name one project", () => {
  const bundle = queue().bundles.find(
    (item) => item.projectId === "prj-au-alcoa-sojitz-gallium",
  );
  assert.ok(bundle);
  assert.deepEqual(bundle.commitmentIds, [
    "fin-au-alcoa-sojitz-gallium-2025-equity",
    "fin-au-alcoa-sojitz-gallium-2025-offtake-right",
    "fin-us-alcoa-sojitz-gallium-2025-equity",
  ]);
});

test("financial and implementation freshness are independent clocks", () => {
  const { commitment, project } = wicheeda();
  commitment.lifecycleReview = {
    financialStatusCheckedAt: "2026-10-01",
    implementationStatusCheckedAt: "2026-06-24",
  };

  const [row] = deriveLifecycleRefreshQueue(
    [commitment],
    [project],
    AS_OF,
  ).rows;
  assert.equal(row.financial.ageDays, 1);
  assert.equal(row.financial.priority, "P3");
  assert.equal(row.implementation.ageDays, 100);
  assert.equal(row.implementation.priority, "P2");
});

test("a fresh implementation review clears physical staleness even when financing is old", () => {
  const { commitment, project } = wicheeda();
  commitment.lifecycleReview = {
    financialStatusCheckedAt: null,
    implementationStatusCheckedAt: "2026-10-01",
  };

  const [row] = deriveLifecycleRefreshQueue(
    [commitment],
    [project],
    AS_OF,
  ).rows;
  assert.equal(row.financial.priority, "P1");
  assert.equal(row.implementation.ageDays, 1);
  assert.equal(row.implementation.priority, "P3");
});

test("a newer review date, not an old status date, sets financial freshness", () => {
  const { commitment, project } = wicheeda();
  commitment.lifecycleReview = {
    financialStatusCheckedAt: "2026-09-30",
    implementationStatusCheckedAt: null,
  };

  const [row] = deriveLifecycleRefreshQueue(
    [commitment],
    [project],
    AS_OF,
  ).rows;
  assert.equal(row.financial.referenceDate, "2026-09-30");
  assert.equal(row.financial.ageDays, 2);
});

test("ended financing does not switch off physical-project tracking", () => {
  const { commitment, project } = wicheeda();
  commitment.financialStatusHistory = [
    {
      ...commitment.financialStatusHistory.at(-1)!,
      status: "lapsed",
      date: "2026-03-03",
    },
  ];

  const [row] = deriveLifecycleRefreshQueue(
    [commitment],
    [project],
    AS_OF,
  ).rows;
  assert.equal(row.financial.priority, "P3");
  assert.equal(row.implementation.applicable, true);
  assert.notEqual(row.implementation.priority, "P3");
});

test("an operational project is routine even if financing is still live", () => {
  const { commitment, project } = wicheeda();
  commitment.implementationStatusHistory = [
    {
      status: "operational",
      date: "2026-09-01",
      sourceId: commitment.financialStatusHistory[0].sourceId,
    },
  ];

  const [row] = deriveLifecycleRefreshQueue(
    [commitment],
    [project],
    AS_OF,
  ).rows;
  assert.equal(row.implementation.status, "operational");
  assert.equal(row.implementation.priority, "P3");
});

test("a completed project is routine even when its completion day is not stated", () => {
  const { commitment, project } = wicheeda();
  commitment.implementationStatusHistory = [
    {
      status: "completed",
      date: null,
      sourceId: commitment.financialStatusHistory[0].sourceId,
    },
  ];

  const [row] = deriveLifecycleRefreshQueue(
    [commitment],
    [project],
    AS_OF,
  ).rows;
  assert.equal(row.implementation.status, "completed");
  assert.equal(row.implementation.priority, "P3");
});

test("queue output is deterministic and states what inclusion means", () => {
  const first = queue();
  const second = queue();
  assert.deepEqual(first, second);
  const output = formatLifecycleRefreshQueue(first);
  assert.match(
    output,
    /cannot yet distinguish unchanged status from insufficient follow-up/,
  );
  assert.match(output, /^Lifecycle refresh queue — as of 2026-10-02/m);
});

test("Lynas equity cash receipt has no invented payment day or whole-plan completion", () => {
  const commitment = getFinancialCommitmentById("fin-jp-jare-lynas-2023-equity")!;
  assert.equal(commitment.amount?.value, "200000000");
  assert.equal(commitment.amount?.currency, "AUD");
  assert.deepEqual(
    commitment.financialStatusHistory.map(({ status, date }) => ({ status, date })),
    [
      { status: "decided", date: "2023-03-07" },
      { status: "contracted", date: "2023-03-07" },
      { status: "disbursed", date: null },
    ],
  );
  // The signing day comes from Lynas' own 7 March 2023 announcement ("signed today"), not
  // from the quarterly report, which only says "As announced on 7 March 2023".
  const [, contracted, disbursed] = commitment.financialStatusHistory;
  assert.equal(contracted.sourceId, "src-lynas-asx-20230307-jare-agreements");
  assert.match(contracted.note ?? "", /The agreements were signed today at a signing ceremony in Tokyo/);
  assert.equal(disbursed.sourceId, "src-lynas-q3-2023-jare-cash");
  assert.ok(
    commitment.evidence.some(
      (e) => e.sourceId === "src-lynas-asx-20230307-jare-agreements" && e.supports.includes("status"),
    ),
  );
  assert.deepEqual(commitment.implementationStatusHistory, []);
  assert.equal(commitment.lifecycleReview?.financialStatusCheckedAt, AS_OF);
  assert.equal(commitment.lifecycleReview?.implementationStatusCheckedAt, null);
  const [row] = deriveLifecycleRefreshQueue([commitment], [], AS_OF).rows;
  assert.equal(row.financial.status, "disbursed");
  assert.equal(row.financial.priority, "P3");
  assert.equal(row.implementation.applicable, false);
});

test("Wicheeda feasibility does not advance its conditional infrastructure funding", () => {
  const commitment = getFinancialCommitmentById("fin-ca-pdac-2026-wicheeda-flmf")!;
  assert.equal(commitment.amount?.currency, "CAD");
  assert.equal(commitment.amount?.value, "1878250");
  assert.equal(commitment.amount?.qualifier, "exact");
  assert.equal(commitment.financialStatusHistory.at(-1)!.status, "decided");
  assert.equal(commitment.financialStatusHistory.at(-1)!.date, "2026-03-03");
  assert.equal(commitment.implementationStatusHistory.at(-1)!.status, "feasibility");
  assert.equal(commitment.implementationStatusHistory.at(-1)!.date, "2026-07-13");
  assert.match(commitment.implementationStatusHistory.at(-1)!.note!, /linked Wicheeda mine/);
  const bundle = queue().bundles.find((item) => item.projectId === "prj-ca-wicheeda")!;
  assert.equal(bundle.priority, "P3");
  assert.ok(bundle.rows.every((row) => row.financial.referenceDate === AS_OF && row.implementation.referenceDate === AS_OF));
});

test("Ucore's proposed commercial facility is distinct from its demonstration plant and US funding", () => {
  const ids = ["fin-ca-g7-2025-ucore-package", "fin-ca-g7-2025-ucore-nrcan", "fin-ca-g7-2025-ucore-feddev"];
  const rows = ids.map((id) => getFinancialCommitmentById(id)!);
  assert.deepEqual(rows.map((row) => row.amount?.value), ["36300000", "26300000", "10000000"]);
  for (const row of rows) {
    assert.equal(row.financialStatusHistory.at(-1)!.status, "decided");
    assert.equal(row.financialStatusHistory.at(-1)!.date, "2025-10-31");
    assert.equal(row.implementationStatusHistory.at(-1)!.status, "announced");
    assert.equal(row.implementationStatusHistory.at(-1)!.date, "2025-10-31");
    assert.match(row.notes!, /no definitive agreement/i);
  }
  assert.equal(rows[1].instrument, "grant");
  assert.equal(rows[2].instrument, "unspecified");
  for (const row of rows.slice(1)) {
    assert.ok(row.relationships.some((link) => link.relationship === "part_of" && link.commitmentId === rows[0].id));
  }
  const bundle = queue().bundles.find((item) => item.projectId === "prj-ca-ucore-kingston")!;
  assert.equal(bundle.priority, "P3");
  assert.deepEqual(bundle.commitmentIds, [...ids].sort());
  assert.ok(bundle.rows.every((row) => row.financial.referenceDate === AS_OF && row.implementation.referenceDate === AS_OF));
});
