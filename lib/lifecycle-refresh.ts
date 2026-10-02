import {
  BINDING_FINANCIAL_STATUSES,
  NOT_YET_BINDING_FINANCIAL_STATUSES,
  currentFinancialStatus,
  daysBetween,
  isEnded,
} from "./capital-control";
import type {
  FinancialCommitment,
  FinancialStatus,
  ImplementationStatus,
  StatusEntry,
} from "./types";

export const LIFECYCLE_REFRESH_PRIORITIES = ["P0", "P1", "P2", "P3"] as const;
export type LifecycleRefreshPriority = (typeof LIFECYCLE_REFRESH_PRIORITIES)[number];

export type LifecycleRefreshSide<S extends string> = {
  currentStatus: S | null;
  latestStatusDate: string | null;
  checkedAt: string | null;
  freshnessDate: string | null;
  ageDays: number | null;
  priority: LifecycleRefreshPriority;
  reasons: string[];
};

export type LifecycleRefreshRow = {
  commitmentId: string;
  projectId: string | null;
  project: string | null;
  provider: string | null;
  providerOrgIds: string[];
  providerJurisdiction: FinancialCommitment["providerJurisdiction"];
  valueRole: FinancialCommitment["valueRole"];
  instrument: FinancialCommitment["instrument"];
  financial: LifecycleRefreshSide<FinancialStatus>;
  implementation: LifecycleRefreshSide<ImplementationStatus>;
  priority: LifecycleRefreshPriority;
  reasons: string[];
};

export type LifecycleRefreshBundle = {
  key: string;
  label: string;
  priority: LifecycleRefreshPriority;
  commitmentIds: string[];
  projectIds: string[];
  rows: LifecycleRefreshRow[];
  reasons: string[];
};

const PRIORITY_RANK: Record<LifecycleRefreshPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

const ACTIVE_IMPLEMENTATION = new Set<ImplementationStatus>([
  "announced",
  "feasibility",
  "construction",
  "commissioning",
]);

const ADVANCED_IMPLEMENTATION = new Set<ImplementationStatus>([
  "commissioning",
  "operational",
  "completed",
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertIsoDate(value: string, label: string): void {
  if (!ISO_DATE.test(value)) throw new Error(`${label}: expected ISO yyyy-mm-dd, got ${JSON.stringify(value)}`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    throw new Error(`${label}: expected a real ISO calendar date, got ${JSON.stringify(value)}`);
}

function latestDatedStatus<S extends string>(entries: readonly StatusEntry<S>[]): string | null {
  let latest: string | null = null;
  for (const entry of entries)
    if (entry.date !== null && (latest === null || entry.date > latest))
      latest = entry.date;
  return latest;
}

function laterDate(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a > b ? a : b;
}

function ageOf(date: string | null, asOf: string, label: string): number | null {
  if (date === null) return null;
  assertIsoDate(date, label);
  const days = daysBetween(date, asOf);
  if (days < 0) throw new Error(`${label}: ${date} is after asOf ${asOf}`);
  return days;
}

function higherPriority(a: LifecycleRefreshPriority, b: LifecycleRefreshPriority): LifecycleRefreshPriority {
  return PRIORITY_RANK[a] <= PRIORITY_RANK[b] ? a : b;
}

function side<S extends string>(
  currentStatus: S | null,
  latestStatusDate: string | null,
  checkedAt: string | null,
  asOf: string,
): Omit<LifecycleRefreshSide<S>, "priority" | "reasons"> {
  const freshnessDate = laterDate(latestStatusDate, checkedAt);
  return {
    currentStatus,
    latestStatusDate,
    checkedAt,
    freshnessDate,
    ageDays: ageOf(freshnessDate, asOf, "lifecycle freshness date"),
  };
}

function hasNamedPhysicalProject(c: FinancialCommitment): boolean {
  const current = c.implementationStatusHistory.at(-1)?.status ?? null;
  if (current === "not_applicable") return false;
  return c.projectId !== null || c.project !== null || c.facility !== null;
}

function financialSide(c: FinancialCommitment, asOf: string): LifecycleRefreshSide<FinancialStatus> {
  const current = currentFinancialStatus(c);
  const latestStatusDate = latestDatedStatus(c.financialStatusHistory);
  const checkedAt = c.lifecycleReview?.financialStatusCheckedAt ?? null;
  const base = side(current, latestStatusDate, checkedAt, asOf);
  const reasons: string[] = [];
  let priority: LifecycleRefreshPriority = "P3";

  if (isEnded(c)) {
    reasons.push(`financial lifecycle ended at ${current}`);
    return { ...base, priority, reasons };
  }

  if (base.ageDays === null) {
    priority = "P1";
    reasons.push("financial status has no dated evidence or lifecycle review");
  } else if (base.ageDays > 365) {
    priority = "P1";
    reasons.push(`financial status/review is ${base.ageDays} days old`);
  } else if (
    hasNamedPhysicalProject(c) &&
    NOT_YET_BINDING_FINANCIAL_STATUSES.includes(current) &&
    base.ageDays > 180
  ) {
    priority = "P1";
    reasons.push(`named project remains ${current} after ${base.ageDays} days`);
  } else if (
    hasNamedPhysicalProject(c) &&
    NOT_YET_BINDING_FINANCIAL_STATUSES.includes(current) &&
    base.ageDays >= 90
  ) {
    priority = "P2";
    reasons.push(`named project remains ${current} after ${base.ageDays} days`);
  } else if (c.projectId === null && base.ageDays > 180) {
    priority = "P2";
    reasons.push(`non-project financial record is ${base.ageDays} days beyond its latest evidence/review`);
  }

  return { ...base, priority, reasons };
}

function exactPassedMilestones(c: FinancialCommitment, asOf: string): string[] {
  return c.outcomes
    .filter((outcome) => outcome.metric === "target_date" && outcome.targetDate !== null && ISO_DATE.test(outcome.targetDate))
    .filter((outcome) => outcome.targetDate! <= asOf)
    .map((outcome) => outcome.targetDate!);
}

function implementationSide(
  c: FinancialCommitment,
  asOf: string,
  financial: LifecycleRefreshSide<FinancialStatus>,
): LifecycleRefreshSide<ImplementationStatus> {
  const current = c.implementationStatusHistory.at(-1)?.status ?? null;
  const latestStatusDate = latestDatedStatus(c.implementationStatusHistory);
  const checkedAt = c.lifecycleReview?.implementationStatusCheckedAt ?? null;
  const base = side(current, latestStatusDate, checkedAt, asOf);
  const reasons: string[] = [];
  let priority: LifecycleRefreshPriority = "P3";
  const physical = hasNamedPhysicalProject(c);
  const financialStatus = financial.currentStatus!;

  if (!physical || current === "not_applicable") {
    reasons.push("physical implementation tracking is not applicable");
    return { ...base, priority, reasons };
  }

  if (
    current !== null &&
    ADVANCED_IMPLEMENTATION.has(current) &&
    NOT_YET_BINDING_FINANCIAL_STATUSES.includes(financialStatus)
  ) {
    priority = "P0";
    reasons.push(`implementation is ${current} while financial status remains ${financialStatus}`);
  } else if (
    current === "cancelled" &&
    BINDING_FINANCIAL_STATUSES.includes(financialStatus)
  ) {
    priority = "P0";
    reasons.push(`project is cancelled while financial status remains ${financialStatus}`);
  }

  if (current === null) {
    if (checkedAt !== null) {
      if (base.ageDays !== null && base.ageDays > 180) {
        priority = higherPriority(priority, "P1");
        reasons.push(`implementation was last checked ${base.ageDays} days ago and no status is recorded`);
      } else if (base.ageDays !== null && base.ageDays >= 90) {
        priority = higherPriority(priority, "P2");
        reasons.push(`implementation was last checked ${base.ageDays} days ago and no status is recorded`);
      }
    } else if (
      hasNamedPhysicalProject(c) &&
      (BINDING_FINANCIAL_STATUSES.includes(financialStatus) || (financial.ageDays !== null && financial.ageDays > 180))
    ) {
      priority = higherPriority(priority, "P1");
      reasons.push("named physical project has no implementation status and has never been reviewed");
    } else {
      priority = higherPriority(priority, "P2");
      reasons.push("physical project has no implementation status and has never been reviewed");
    }
  } else if (
    ACTIVE_IMPLEMENTATION.has(current) &&
    base.ageDays !== null &&
    base.ageDays > 365
  ) {
    priority = higherPriority(priority, "P1");
    reasons.push(`implementation status ${current} is ${base.ageDays} days old`);
  }

  const passed = exactPassedMilestones(c, asOf);
  if (
    passed.length > 0 &&
    current !== "operational" &&
    current !== "completed" &&
    current !== "cancelled"
  ) {
    priority = higherPriority(priority, "P1");
    reasons.push(`stated implementation milestone date has passed (${passed.sort().at(-1)})`);
  }

  return { ...base, priority, reasons };
}

/**
 * Derive row-level lifecycle freshness as of an explicit date. No call to
 * Date.now() is permitted here: reproducible reports must state their as-of date.
 */
export function deriveLifecycleRefreshQueue(
  commitments: readonly FinancialCommitment[],
  asOf: string,
): LifecycleRefreshRow[] {
  assertIsoDate(asOf, "asOf");

  return commitments
    .map((c): LifecycleRefreshRow => {
      if (c.lifecycleReview?.financialStatusCheckedAt)
        assertIsoDate(c.lifecycleReview.financialStatusCheckedAt, `${c.id}.lifecycleReview.financialStatusCheckedAt`);
      if (c.lifecycleReview?.implementationStatusCheckedAt)
        assertIsoDate(c.lifecycleReview.implementationStatusCheckedAt, `${c.id}.lifecycleReview.implementationStatusCheckedAt`);

      const financial = financialSide(c, asOf);
      const implementation = implementationSide(c, asOf, financial);
      const priority = higherPriority(financial.priority, implementation.priority);
      return {
        commitmentId: c.id,
        projectId: c.projectId,
        project: c.project,
        provider: c.provider,
        providerOrgIds: [...c.providerOrgIds],
        providerJurisdiction: c.providerJurisdiction,
        valueRole: c.valueRole,
        instrument: c.instrument,
        financial,
        implementation,
        priority,
        reasons: [...financial.reasons, ...implementation.reasons],
      };
    })
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        (a.commitmentId < b.commitmentId ? -1 : a.commitmentId > b.commitmentId ? 1 : 0),
    );
}

function relationshipComponents(commitments: readonly FinancialCommitment[]): Map<string, string> {
  const known = new Set(commitments.map((c) => c.id));
  const edges = new Map<string, Set<string>>(commitments.map((c) => [c.id, new Set<string>()]));
  for (const c of commitments)
    for (const link of c.relationships)
      if (known.has(link.commitmentId)) {
        edges.get(c.id)!.add(link.commitmentId);
        edges.get(link.commitmentId)!.add(c.id);
      }

  const componentKey = new Map<string, string>();
  const seen = new Set<string>();
  for (const id of [...known].sort()) {
    if (seen.has(id)) continue;
    const stack = [id];
    const members: string[] = [];
    while (stack.length) {
      const here = stack.pop()!;
      if (seen.has(here)) continue;
      seen.add(here);
      members.push(here);
      for (const next of edges.get(here) ?? []) if (!seen.has(next)) stack.push(next);
    }
    if (members.length > 1) {
      const key = members.sort()[0];
      for (const member of members) componentKey.set(member, key);
    }
  }
  return componentKey;
}

/**
 * Bundle human research tasks in the order the maintenance workflow uses:
 * project first, then relationship family, then provider.
 */
export function bundleLifecycleRefreshQueue(
  commitments: readonly FinancialCommitment[],
  rows: readonly LifecycleRefreshRow[],
): LifecycleRefreshBundle[] {
  const byId = new Map(commitments.map((c) => [c.id, c]));
  const family = relationshipComponents(commitments);
  const grouped = new Map<string, LifecycleRefreshRow[]>();

  for (const row of rows) {
    const c = byId.get(row.commitmentId);
    if (!c) throw new Error(`bundleLifecycleRefreshQueue: missing commitment ${row.commitmentId}`);
    const key =
      c.projectId !== null
        ? `project:${c.projectId}`
        : family.has(c.id)
          ? `family:${family.get(c.id)}`
          : c.providerOrgIds[0]
            ? `provider:${c.providerOrgIds[0]}`
            : c.providerJurisdiction
              ? `provider-jurisdiction:${c.providerJurisdiction}`
              : c.provider
                ? `provider-name:${c.provider}`
                : `commitment:${c.id}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return [...grouped.entries()]
    .map(([key, bundleRows]): LifecycleRefreshBundle => {
      const sorted = [...bundleRows].sort((a, b) =>
        a.commitmentId < b.commitmentId ? -1 : a.commitmentId > b.commitmentId ? 1 : 0,
      );
      const priority = sorted.reduce<LifecycleRefreshPriority>(
        (best, row) => higherPriority(best, row.priority),
        "P3",
      );
      const projects = [...new Set(sorted.flatMap((row) => (row.projectId ? [row.projectId] : [])))].sort();
      const first = byId.get(sorted[0].commitmentId)!;
      const projectLabel = sorted.find((row) => row.project !== null)?.project ?? null;
      const label =
        projectLabel ??
        (first.projectId ? first.projectId : null) ??
        first.provider ??
        first.providerOrgIds[0] ??
        first.providerJurisdiction ??
        first.id;
      return {
        key,
        label,
        priority,
        commitmentIds: sorted.map((row) => row.commitmentId),
        projectIds: projects,
        rows: sorted,
        reasons: [...new Set(sorted.flatMap((row) => row.reasons))],
      };
    })
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
    );
}

export function formatLifecycleRefreshReport(
  bundles: readonly LifecycleRefreshBundle[],
  asOf: string,
): string {
  assertIsoDate(asOf, "asOf");
  const lines = [`# Lifecycle refresh queue — ${asOf}`, ""];

  for (const priority of LIFECYCLE_REFRESH_PRIORITIES) {
    const group = bundles.filter((bundle) => bundle.priority === priority);
    lines.push(`## ${priority} — ${group.length} bundle${group.length === 1 ? "" : "s"}`, "");
    if (group.length === 0) {
      lines.push("_None._", "");
      continue;
    }
    for (const bundle of group) {
      lines.push(`### ${bundle.label}`);
      lines.push(`Commitments: ${bundle.commitmentIds.join(", ")}`);
      for (const row of bundle.rows) {
        const fAge = row.financial.ageDays === null ? "never checked/dated" : `${row.financial.ageDays}d`;
        const iAge = row.implementation.ageDays === null ? "never checked/dated" : `${row.implementation.ageDays}d`;
        lines.push(
          `- ${row.commitmentId} [${row.valueRole}/${row.instrument}]: financial ${row.financial.currentStatus ?? "none"} (${fAge}); implementation ${row.implementation.currentStatus ?? "none"} (${iAge})`,
        );
      }
      if (bundle.reasons.length) lines.push(...bundle.reasons.map((reason) => `  - ${reason}`));
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}
