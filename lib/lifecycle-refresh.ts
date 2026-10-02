import type { FinancialCommitment, FinancialStatus, ImplementationStatus } from "./types";

export type LifecycleReviewFlag = "internal_contradiction" | "known_milestone_passed";

export type LifecycleReviewRecord = {
  commitmentId: string;
  financialStatusCheckedAt: string | null;
  implementationStatusCheckedAt: string | null;
  flags?: LifecycleReviewFlag[];
  note?: string | null;
};

export type LifecyclePriority = "P0" | "P1" | "P2" | "P3";

export type LifecycleTrack = {
  status: string | null;
  statusDate: string | null;
  checkedAt: string | null;
  freshnessDate: string | null;
  ageDays: number | null;
};

export type LifecycleQueueItem = {
  commitmentId: string;
  projectId: string | null;
  project: string | null;
  providerJurisdiction: string | null;
  priority: LifecyclePriority;
  financial: LifecycleTrack;
  implementation: LifecycleTrack;
  reasons: string[];
  flags: LifecycleReviewFlag[];
};

export type LifecycleQueueBundle = {
  key: string;
  projectId: string | null;
  project: string | null;
  priority: LifecyclePriority;
  commitmentIds: string[];
  reasons: string[];
  items: LifecycleQueueItem[];
};

const DAY_MS = 86_400_000;
const PRIORITY_ORDER: Record<LifecyclePriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

const PRE_BINDING_FINANCIAL = new Set<FinancialStatus>(["announced", "authorized", "allocated", "decided", "not_stated"]);
const BINDING_FINANCIAL = new Set<FinancialStatus>(["contracted", "partially_disbursed", "disbursed"]);
const TERMINAL_FINANCIAL = new Set<FinancialStatus>(["disbursed", "withdrawn", "lapsed"]);
const ACTIVE_IMPLEMENTATION = new Set<ImplementationStatus>(["announced", "feasibility", "construction", "commissioning", "suspended", "not_stated"]);
const ENDED_IMPLEMENTATION = new Set<ImplementationStatus>(["operational", "cancelled", "not_applicable"]);

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!isoDate.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function maxDate(...values: (string | null | undefined)[]): string | null {
  const dates = values.filter((value): value is string => Boolean(value));
  return dates.length ? dates.sort().at(-1)! : null;
}

function lastDatedStatus<T extends string>(history: readonly { status: T; date: string | null }[]): string | null {
  for (let i = history.length - 1; i >= 0; i -= 1) if (history[i].date) return history[i].date;
  return null;
}

function ageDays(date: string | null, asOf: string): number | null {
  if (!date) return null;
  const start = Date.parse(`${date}T00:00:00Z`);
  const end = Date.parse(`${asOf}T00:00:00Z`);
  return Math.floor((end - start) / DAY_MS);
}

function track(
  history: readonly { status: string; date: string | null }[],
  checkedAt: string | null | undefined,
  asOf: string,
): LifecycleTrack {
  const statusEntry = history.at(-1);
  const statusDate = lastDatedStatus(history);
  const freshnessDate = maxDate(statusDate, checkedAt);
  return {
    status: statusEntry?.status ?? null,
    statusDate,
    checkedAt: checkedAt ?? null,
    freshnessDate,
    ageDays: ageDays(freshnessDate, asOf),
  };
}

function olderThan(trackValue: LifecycleTrack, days: number): boolean {
  return trackValue.ageDays !== null && trackValue.ageDays > days;
}

function reviewFor(id: string, reviews: readonly LifecycleReviewRecord[]): LifecycleReviewRecord | undefined {
  return reviews.find((review) => review.commitmentId === id);
}

export function validateLifecycleReviews(
  reviews: readonly LifecycleReviewRecord[],
  commitmentIds?: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const review of reviews) {
    if (!review.commitmentId) errors.push("lifecycle review has an empty commitmentId");
    else if (seen.has(review.commitmentId)) errors.push(`duplicate lifecycle review for "${review.commitmentId}"`);
    seen.add(review.commitmentId);

    if (commitmentIds && review.commitmentId && !commitmentIds.has(review.commitmentId))
      errors.push(`lifecycle review "${review.commitmentId}" does not resolve to a financial commitment`);

    for (const [field, value] of [
      ["financialStatusCheckedAt", review.financialStatusCheckedAt],
      ["implementationStatusCheckedAt", review.implementationStatusCheckedAt],
    ] as const)
      if (value !== null && !isIsoDate(value)) errors.push(`${review.commitmentId}.${field} is not an ISO date: ${JSON.stringify(value)}`);

    const flags = review.flags ?? [];
    if (new Set(flags).size !== flags.length) errors.push(`${review.commitmentId}.flags contains duplicates`);
    for (const flag of flags)
      if (flag !== "internal_contradiction" && flag !== "known_milestone_passed")
        errors.push(`${review.commitmentId}.flags contains unknown value ${JSON.stringify(flag)}`);
  }
  return errors;
}

export function deriveLifecycleQueueItem(
  commitment: FinancialCommitment,
  asOf: string,
  reviews: readonly LifecycleReviewRecord[] = [],
): LifecycleQueueItem {
  if (!isIsoDate(asOf)) throw new Error(`invalid lifecycle as-of date: ${asOf}`);

  const review = reviewFor(commitment.id, reviews);
  const flags = review?.flags ?? [];
  const financial = track(commitment.financialStatusHistory, review?.financialStatusCheckedAt, asOf);
  const implementation = track(commitment.implementationStatusHistory, review?.implementationStatusCheckedAt, asOf);
  const financialStatus = financial.status as FinancialStatus | null;
  const implementationStatus = implementation.status as ImplementationStatus | null;
  const namedProject = commitment.projectId !== null || commitment.project !== null;
  const reasons: string[] = [];

  let priority: LifecyclePriority = "P3";

  if (flags.includes("internal_contradiction")) {
    priority = "P0";
    reasons.push("internal contradiction is flagged for review");
  }
  if (flags.includes("known_milestone_passed")) {
    priority = "P0";
    reasons.push("a known lifecycle milestone has passed");
  }

  if (priority !== "P0") {
    const financialUnknown = financial.freshnessDate === null;
    const implementationUnknown = implementation.freshnessDate === null;

    if (
      (namedProject && financialStatus !== null && PRE_BINDING_FINANCIAL.has(financialStatus) && (olderThan(financial, 180) || financialUnknown)) ||
      (financialStatus !== null && !TERMINAL_FINANCIAL.has(financialStatus) && olderThan(financial, 365))
    ) {
      priority = "P1";
      reasons.push(financialUnknown ? "named project has no dated financial status or review" : "financial status needs a high-priority refresh");
    }

    if (
      namedProject &&
      (
        (implementationStatus === null && financialStatus !== null && BINDING_FINANCIAL.has(financialStatus) && (implementationUnknown || olderThan(implementation, 180))) ||
        (implementationStatus === null && (olderThan(financial, 180) || financialUnknown) && (implementationUnknown || olderThan(implementation, 180))) ||
        (implementationStatus !== null && ACTIVE_IMPLEMENTATION.has(implementationStatus) && olderThan(implementation, 365)) ||
        implementationUnknown && implementationStatus !== null && ACTIVE_IMPLEMENTATION.has(implementationStatus)
      )
    ) {
      priority = "P1";
      reasons.push(
        implementationStatus === null
          ? "named project lacks implementation follow-up"
          : "physical implementation status needs a high-priority refresh",
      );
    }

    if (priority === "P3") {
      if (namedProject && financialStatus !== null && PRE_BINDING_FINANCIAL.has(financialStatus) && olderThan(financial, 90)) {
        priority = "P2";
        reasons.push("named project has a pre-binding financial status older than 90 days");
      } else if (!namedProject && financialStatus !== null && !TERMINAL_FINANCIAL.has(financialStatus) && (olderThan(financial, 180) || financialUnknown)) {
        priority = "P2";
        reasons.push(financialUnknown ? "non-project commitment has no dated financial status or review" : "non-project commitment is older than 180 days");
      } else if (
        namedProject &&
        financialStatus !== null &&
        BINDING_FINANCIAL.has(financialStatus) &&
        implementationStatus === null &&
        olderThan(implementation, 90)
      ) {
        priority = "P2";
        reasons.push("binding named project has no implementation status and its last physical check is older than 90 days");
      } else {
        reasons.push("routine lifecycle review");
      }
    }
  }

  if (
    financialStatus !== null &&
    TERMINAL_FINANCIAL.has(financialStatus) &&
    namedProject &&
    implementationStatus !== null &&
    !ENDED_IMPLEMENTATION.has(implementationStatus)
  )
    reasons.push("financial lifecycle ended but physical implementation remains active");

  return {
    commitmentId: commitment.id,
    projectId: commitment.projectId,
    project: commitment.project,
    providerJurisdiction: commitment.providerJurisdiction,
    priority,
    financial,
    implementation,
    reasons: [...new Set(reasons)],
    flags,
  };
}

function betterPriority(a: LifecyclePriority, b: LifecyclePriority): LifecyclePriority {
  return PRIORITY_ORDER[a] <= PRIORITY_ORDER[b] ? a : b;
}

export function deriveLifecycleRefreshQueue(
  commitments: readonly FinancialCommitment[],
  asOf: string,
  reviews: readonly LifecycleReviewRecord[] = [],
): LifecycleQueueItem[] {
  return commitments
    .map((commitment) => deriveLifecycleQueueItem(commitment, asOf, reviews))
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (b.financial.ageDays ?? -1) - (a.financial.ageDays ?? -1) ||
        (a.commitmentId < b.commitmentId ? -1 : a.commitmentId > b.commitmentId ? 1 : 0),
    );
}

function bundleKey(item: LifecycleQueueItem, byId: ReadonlyMap<string, FinancialCommitment>): string {
  if (item.projectId) return `project:${item.projectId}`;
  const commitment = byId.get(item.commitmentId);
  if (commitment?.project) return `project-name:${commitment.providerJurisdiction ?? "none"}:${commitment.project}`;
  const parent = commitment?.relationships.find((relationship) => relationship.relationship === "part_of")?.commitmentId;
  return parent ? `package:${parent}` : `commitment:${item.commitmentId}`;
}

export function bundleLifecycleRefreshQueue(
  commitments: readonly FinancialCommitment[],
  items: readonly LifecycleQueueItem[],
): LifecycleQueueBundle[] {
  const byId = new Map(commitments.map((commitment) => [commitment.id, commitment]));
  const groups = new Map<string, LifecycleQueueItem[]>();

  for (const item of items) {
    const key = bundleKey(item, byId);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const firstProject = group.find((item) => item.projectId !== null);
      return {
        key,
        projectId: firstProject?.projectId ?? null,
        project: firstProject?.project ?? null,
        priority: group.reduce<LifecyclePriority>((p, item) => betterPriority(p, item.priority), "P3"),
        commitmentIds: group.map((item) => item.commitmentId).sort(),
        reasons: [...new Set(group.flatMap((item) => item.reasons))],
        items: [...group].sort((a, b) => (a.commitmentId < b.commitmentId ? -1 : a.commitmentId > b.commitmentId ? 1 : 0)),
      };
    })
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
    );
}
