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

test("the live corpus surfaces Cyclic Materials as a P0 evidence mismatch", () => {
  const bundle = queue().bundles.find(
    (item) => item.projectId === "prj-ca-cyclic-kingston-demonstration-plant",
  );
  assert.ok(bundle, "Cyclic Materials bundle is present");
  assert.equal(bundle.priority, "P0");
  assert.ok(
    bundle.rows.some((row) =>
      row.implementation.reasons.some((reason) =>
        reason.includes("project evidence states completion"),
      ),
    ),
  );
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
