import assert from "node:assert/strict";
import test from "node:test";

import {
  bundleLifecycleRefreshQueue,
  deriveLifecycleRefreshQueue,
  formatLifecycleRefreshReport,
} from "@/lib/lifecycle-refresh";
import type { FinancialCommitment } from "@/lib/types";

const AS_OF = "2026-10-02";

function fin(id: string, over: Partial<FinancialCommitment> = {}): FinancialCommitment {
  return {
    id,
    eventId: "evt-test",
    relationships: [],
    instrument: "grant",
    valueRole: "commitment",
    capitalSource: "public",
    amount: {
      value: "100",
      currency: "USD",
      qualifier: "exact",
      amountAsStated: "$100",
      currencyBasis: "issuer_context",
    },
    provider: "Test Agency",
    providerJurisdiction: "us",
    providerOrgIds: ["org-test-agency"],
    legalAuthority: null,
    programmeId: null,
    recipient: "Test Recipient",
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
    financialStatusHistory: [
      { status: "announced", date: "2026-09-01", sourceId: "src-test" },
    ],
    implementationStatusHistory: [],
    terms: [],
    outcomes: [],
    evidence: [],
    ...over,
  };
}

test("review timestamps refresh a clock without adding fake status history", () => {
  const c = fin("fin-reviewed", {
    project: "Reviewed Project",
    projectId: "prj-reviewed",
    stages: ["processing"],
    stageAllocation: "single_stage",
    financialStatusHistory: [
      { status: "announced", date: "2025-01-01", sourceId: "src-test" },
    ],
    lifecycleReview: {
      financialStatusCheckedAt: "2026-09-30",
      implementationStatusCheckedAt: "2026-09-30",
    },
  });

  const [row] = deriveLifecycleRefreshQueue([c], AS_OF);
  assert.equal(row.financial.latestStatusDate, "2025-01-01");
  assert.equal(row.financial.freshnessDate, "2026-09-30");
  assert.equal(row.financial.ageDays, 2);
  assert.equal(row.financial.priority, "P3");
  assert.equal(row.implementation.currentStatus, null);
  assert.equal(row.implementation.ageDays, 2);
  assert.equal(row.implementation.priority, "P3");
  assert.equal(c.financialStatusHistory.length, 1);
  assert.equal(c.implementationStatusHistory.length, 0);
});

test("a stale pre-binding named project is P1 on both lifecycle clocks when implementation was never checked", () => {
  const c = fin("fin-stale-project", {
    project: "Stale Project",
    projectId: "prj-stale",
    stages: ["mining"],
    stageAllocation: "single_stage",
    financialStatusHistory: [
      { status: "announced", date: "2026-01-01", sourceId: "src-test" },
    ],
  });

  const [row] = deriveLifecycleRefreshQueue([c], AS_OF);
  assert.equal(row.financial.priority, "P1");
  assert.match(row.financial.reasons.join(" "), /named project remains announced/);
  assert.equal(row.implementation.priority, "P1");
  assert.match(row.implementation.reasons.join(" "), /never been reviewed/);
  assert.equal(row.priority, "P1");
});

test("stage-tagged policy support without a named undertaking does not create a fake physical lifecycle", () => {
  const c = fin("fin-generic-policy", {
    project: null,
    projectId: null,
    facility: null,
    stages: ["processing"],
    stageAllocation: "single_stage",
    financialStatusHistory: [
      { status: "authorized", date: "2026-09-20", sourceId: "src-test" },
    ],
  });

  const [row] = deriveLifecycleRefreshQueue([c], AS_OF);
  assert.equal(row.implementation.priority, "P3");
  assert.deepEqual(row.implementation.reasons, ["physical implementation tracking is not applicable"]);
});

test("a binding named project with no implementation review is P1 even when financing is recent", () => {
  const c = fin("fin-binding-project", {
    project: "Binding Project",
    projectId: "prj-binding",
    stages: ["refining"],
    stageAllocation: "single_stage",
    financialStatusHistory: [
      { status: "contracted", date: "2026-09-20", sourceId: "src-test" },
    ],
  });

  const [row] = deriveLifecycleRefreshQueue([c], AS_OF);
  assert.equal(row.financial.priority, "P3");
  assert.equal(row.implementation.priority, "P1");
  assert.equal(row.priority, "P1");
});

test("advanced physical execution against a still pre-binding financial row is an explainable P0", () => {
  const c = fin("fin-tension", {
    project: "Operating Project",
    projectId: "prj-operating",
    stages: ["processing"],
    stageAllocation: "single_stage",
    financialStatusHistory: [
      { status: "decided", date: "2026-09-01", sourceId: "src-test" },
    ],
    implementationStatusHistory: [
      { status: "operational", date: "2026-09-15", sourceId: "src-test" },
    ],
  });

  const [row] = deriveLifecycleRefreshQueue([c], AS_OF);
  assert.equal(row.implementation.priority, "P0");
  assert.match(row.implementation.reasons.join(" "), /operational while financial status remains decided/);
  assert.equal(row.priority, "P0");
});

test("a passed exact target milestone triggers a refresh without inventing progression", () => {
  const c = fin("fin-milestone", {
    project: "Milestone Project",
    projectId: "prj-milestone",
    stages: ["processing"],
    stageAllocation: "single_stage",
    implementationStatusHistory: [
      { status: "construction", date: "2026-08-01", sourceId: "src-test" },
    ],
    outcomes: [
      {
        metric: "target_date",
        value: null,
        qualifier: null,
        unit: null,
        targetDate: "2026-09-15",
        asStated: "commissioning by September 15",
        statedBy: "recipient",
        sourceId: "src-test",
      },
    ],
  });

  const [row] = deriveLifecycleRefreshQueue([c], AS_OF);
  assert.equal(row.implementation.currentStatus, "construction");
  assert.equal(row.implementation.priority, "P1");
  assert.match(row.implementation.reasons.join(" "), /milestone date has passed/);
});

test("project bundles take precedence over relationship families and provider fallback", () => {
  const a = fin("fin-project-a", {
    project: "One Project",
    projectId: "prj-one",
    stages: ["processing"],
    stageAllocation: "single_stage",
  });
  const b = fin("fin-project-b", {
    project: "One Project",
    projectId: "prj-one",
    stages: ["refining"],
    stageAllocation: "single_stage",
    relationships: [
      { commitmentId: "fin-family-root", relationship: "part_of", sourceId: "src-test" },
    ],
  });
  const root = fin("fin-family-root", { providerOrgIds: ["org-other"] });
  const child = fin("fin-family-child", {
    providerOrgIds: ["org-other"],
    relationships: [
      { commitmentId: "fin-family-root", relationship: "part_of", sourceId: "src-test" },
    ],
  });
  const providerOnlyA = fin("fin-provider-a", { providerOrgIds: ["org-provider"] });
  const providerOnlyB = fin("fin-provider-b", { providerOrgIds: ["org-provider"] });
  const all = [a, b, root, child, providerOnlyA, providerOnlyB];

  const rows = deriveLifecycleRefreshQueue(all, AS_OF);
  const bundles = bundleLifecycleRefreshQueue(all, rows);

  const project = bundles.find((bundle) => bundle.key === "project:prj-one");
  assert.deepEqual(project?.commitmentIds, ["fin-project-a", "fin-project-b"]);

  const family = bundles.find((bundle) => bundle.key === "family:fin-family-child");
  assert.deepEqual(family?.commitmentIds, ["fin-family-child", "fin-family-root"]);

  const provider = bundles.find((bundle) => bundle.key === "provider:org-provider");
  assert.deepEqual(provider?.commitmentIds, ["fin-provider-a", "fin-provider-b"]);
});

test("report is deterministic and exposes both clocks", () => {
  const c = fin("fin-report", {
    financialStatusHistory: [
      { status: "authorized", date: "2025-01-01", sourceId: "src-test" },
    ],
  });
  const rows = deriveLifecycleRefreshQueue([c], AS_OF);
  const bundles = bundleLifecycleRefreshQueue([c], rows);
  const report = formatLifecycleRefreshReport(bundles, AS_OF);

  assert.match(report, /^# Lifecycle refresh queue — 2026-10-02/m);
  assert.match(report, /financial authorized/);
  assert.match(report, /implementation none/);
  assert.match(report, /## P0 — 0 bundles/);
});

test("future review dates are rejected against the explicit as-of date", () => {
  const c = fin("fin-future-review", {
    lifecycleReview: {
      financialStatusCheckedAt: "2026-10-03",
      implementationStatusCheckedAt: null,
    },
  });

  assert.throws(
    () => deriveLifecycleRefreshQueue([c], AS_OF),
    /after asOf 2026-10-02/,
  );
});
