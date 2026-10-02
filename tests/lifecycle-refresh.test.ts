import { test } from "node:test";
import assert from "node:assert/strict";

import {
  bundleLifecycleRefreshQueue,
  deriveLifecycleQueueItem,
  deriveLifecycleRefreshQueue,
  validateLifecycleReviews,
  type LifecycleReviewRecord,
} from "@/lib/lifecycle-refresh";
import type { FinancialCommitment } from "@/lib/types";

const AS_OF = "2026-10-02";

function fin(id: string, patch: Partial<FinancialCommitment> = {}): FinancialCommitment {
  return {
    id,
    eventId: "evt-fixture",
    relationships: [],
    instrument: "grant",
    valueRole: "commitment",
    capitalSource: "public",
    amount: null,
    provider: "Fixture government",
    providerJurisdiction: "us",
    providerOrgIds: [],
    legalAuthority: null,
    programmeId: null,
    recipient: "Fixture recipient",
    recipientOrgIds: [],
    project: null,
    projectId: null,
    facility: null,
    locations: [],
    stages: [],
    stageAllocation: "not_stated",
    materialIds: [],
    materialAttribution: "not_stated",
    untrackedMaterialsAsStated: [],
    financialStatusHistory: [{ status: "announced", date: "2026-09-01", sourceId: "src-fixture" }],
    implementationStatusHistory: [],
    terms: [],
    outcomes: [],
    evidence: [],
    notes: null,
    ...patch,
  };
}

test("a recent lifecycle review resets freshness without inventing a new status entry", () => {
  const c = fin("fin-reviewed", {
    project: "Reviewed project",
    projectId: "prj-reviewed",
    financialStatusHistory: [{ status: "announced", date: "2025-01-01", sourceId: "src-fixture" }],
  });
  const reviews: LifecycleReviewRecord[] = [{
    commitmentId: c.id,
    financialStatusCheckedAt: "2026-09-30",
    implementationStatusCheckedAt: "2026-09-30",
  }];
  const item = deriveLifecycleQueueItem(c, AS_OF, reviews);
  assert.equal(item.priority, "P3");
  assert.equal(item.financial.status, "announced");
  assert.equal(item.financial.statusDate, "2025-01-01");
  assert.equal(item.financial.freshnessDate, "2026-09-30");
  assert.equal(item.financial.ageDays, 2);
  assert.equal(item.implementation.freshnessDate, "2026-09-30");
});

test("an old pre-binding named project with no review is P1", () => {
  const item = deriveLifecycleQueueItem(
    fin("fin-stale-project", {
      project: "Stale project",
      projectId: "prj-stale",
      financialStatusHistory: [{ status: "announced", date: "2025-10-01", sourceId: "src-fixture" }],
    }),
    AS_OF,
  );
  assert.equal(item.priority, "P1");
  assert.ok(item.reasons.some((reason) => reason.includes("financial status")));
  assert.ok(item.reasons.some((reason) => reason.includes("implementation")));
});

test("an old non-project commitment is P2 rather than P1", () => {
  const item = deriveLifecycleQueueItem(
    fin("fin-programme", {
      project: null,
      projectId: null,
      financialStatusHistory: [{ status: "decided", date: "2026-01-01", sourceId: "src-fixture" }],
    }),
    AS_OF,
  );
  assert.equal(item.priority, "P2");
});

test("a binding named project with no physical follow-up is P1 even when recent", () => {
  const item = deriveLifecycleQueueItem(
    fin("fin-binding", {
      project: "Binding project",
      projectId: "prj-binding",
      financialStatusHistory: [{ status: "contracted", date: "2026-09-20", sourceId: "src-fixture" }],
    }),
    AS_OF,
  );
  assert.equal(item.priority, "P1");
  assert.ok(item.reasons.includes("named project lacks implementation follow-up"));

  const reviewed = deriveLifecycleQueueItem(itemToCommitment(), AS_OF, [{
    commitmentId: "fin-binding",
    financialStatusCheckedAt: "2026-10-01",
    implementationStatusCheckedAt: "2026-10-01",
  }]);
  assert.equal(reviewed.priority, "P3");

  function itemToCommitment(): FinancialCommitment {
    return fin("fin-binding", {
      project: "Binding project",
      projectId: "prj-binding",
      financialStatusHistory: [{ status: "contracted", date: "2026-09-20", sourceId: "src-fixture" }],
    });
  }
});

test("financial completion does not hide an active physical project", () => {
  const item = deriveLifecycleQueueItem(
    fin("fin-built", {
      project: "Construction project",
      projectId: "prj-built",
      financialStatusHistory: [{ status: "disbursed", date: "2025-01-01", sourceId: "src-fixture" }],
      implementationStatusHistory: [{ status: "construction", date: "2025-01-01", sourceId: "src-fixture" }],
    }),
    AS_OF,
  );
  assert.equal(item.priority, "P1");
  assert.ok(item.reasons.includes("financial lifecycle ended but physical implementation remains active"));

  const operational = deriveLifecycleQueueItem(
    fin("fin-operational", {
      project: "Operational project",
      projectId: "prj-operational",
      financialStatusHistory: [{ status: "disbursed", date: "2025-01-01", sourceId: "src-fixture" }],
      implementationStatusHistory: [{ status: "operational", date: "2025-01-01", sourceId: "src-fixture" }],
    }),
    AS_OF,
  );
  assert.equal(operational.priority, "P3");
});

test("manual contradiction and milestone flags force P0", () => {
  for (const flag of ["internal_contradiction", "known_milestone_passed"] as const) {
    const c = fin(`fin-${flag}`);
    const item = deriveLifecycleQueueItem(c, AS_OF, [{
      commitmentId: c.id,
      financialStatusCheckedAt: "2026-10-01",
      implementationStatusCheckedAt: "2026-10-01",
      flags: [flag],
    }]);
    assert.equal(item.priority, "P0");
  }
});

test("the queue bundles rows by project before individual commitments", () => {
  const commitments = [
    fin("fin-a", { project: "Shared project", projectId: "prj-shared", financialStatusHistory: [{ status: "announced", date: "2025-01-01", sourceId: "s" }] }),
    fin("fin-b", { project: "Shared project", projectId: "prj-shared", financialStatusHistory: [{ status: "decided", date: "2025-02-01", sourceId: "s" }] }),
    fin("fin-c", { project: null, projectId: null, financialStatusHistory: [{ status: "decided", date: "2025-01-01", sourceId: "s" }] }),
  ];
  const items = deriveLifecycleRefreshQueue(commitments, AS_OF);
  const bundles = bundleLifecycleRefreshQueue(commitments, items);
  const shared = bundles.find((bundle) => bundle.key === "project:prj-shared")!;
  assert.equal(shared.priority, "P1");
  assert.deepEqual(shared.commitmentIds, ["fin-a", "fin-b"]);
  assert.ok(bundles.some((bundle) => bundle.key === "commitment:fin-c"));
});

test("review-ledger validation rejects duplicates, bad dates and unknown commitments", () => {
  const errors = validateLifecycleReviews(
    [
      { commitmentId: "fin-a", financialStatusCheckedAt: "2026-10-02", implementationStatusCheckedAt: null },
      { commitmentId: "fin-a", financialStatusCheckedAt: "not-a-date", implementationStatusCheckedAt: null },
      { commitmentId: "fin-missing", financialStatusCheckedAt: null, implementationStatusCheckedAt: null },
    ],
    new Set(["fin-a"]),
  );
  assert.ok(errors.some((error) => error.includes("duplicate lifecycle review")));
  assert.ok(errors.some((error) => error.includes("not an ISO date")));
  assert.ok(errors.some((error) => error.includes("does not resolve")));
});
