import test from "node:test";
import assert from "node:assert/strict";

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
  return { commitment, project };
}

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
