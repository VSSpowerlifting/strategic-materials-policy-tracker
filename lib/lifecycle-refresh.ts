import type {
  FinancialCommitment,
  FinancialStatus,
  ImplementationStatus,
  Project,
} from "./types";

export const LIFECYCLE_REFRESH_PRIORITIES = ["P0", "P1", "P2", "P3"] as const;
export type LifecycleRefreshPriority = (typeof LIFECYCLE_REFRESH_PRIORITIES)[number];

export type LifecycleClockAssessment<S extends string> = {
  status: S | null;
  statusDate: string | null;
  checkedAt: string | null;
  referenceDate: string | null;
  ageDays: number | null;
  applicable: boolean;
  priority: LifecycleRefreshPriority;
  reasons: string[];
};

export type LifecycleRefreshRow = {
  commitmentId: string;
  projectId: string | null;
  eventId: string;
  provider: string | null;
  financial: LifecycleClockAssessment<FinancialStatus>;
  implementation: LifecycleClockAssessment<ImplementationStatus>;
  priority: LifecycleRefreshPriority;
};

export type LifecycleRefreshBundle = {
  id: string;
  title: string;
  projectId: string | null;
  commitmentIds: string[];
  priority: LifecycleRefreshPriority;
  rows: LifecycleRefreshRow[];
};

export type LifecycleRefreshQueue = {
  asOf: string;
  rows: LifecycleRefreshRow[];
  bundles: LifecycleRefreshBundle[];
  counts: Record<LifecycleRefreshPriority, number>;
};

const PRIORITY_RANK: Record<LifecycleRefreshPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

const PRE_BINDING_FINANCIAL = new Set<FinancialStatus>([
  "announced",
  "authorized",
  "allocated",
  "decided",
  "not_stated",
]);
const BINDING_OR_FUNDED = new Set<FinancialStatus>([
  "contracted",
  "partially_disbursed",
  "disbursed",
]);
const ENDED_FINANCIAL = new Set<FinancialStatus>(["withdrawn", "lapsed"]);
const PHYSICAL_STAGES = new Set([
  "exploration",
  "mining",
  "separation",
  "processing",
  "refining",
  "component_manufacturing",
  "final_manufacturing",
  "recycling",
  "research_development",
]);

const byCodePoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

function priorityOf(...priorities: LifecycleRefreshPriority[]): LifecycleRefreshPriority {
  return [...priorities].sort((a, b) => PRIORITY_RANK[a] - PRIORITY_RANK[b])[0] ?? "P3";
}

function dayNumber(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function ageDays(asOf: string, referenceDate: string | null): number | null {
  return referenceDate === null ? null : dayNumber(asOf) - dayNumber(referenceDate);
}

function laterDate(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a >= b ? a : b;
}

function latestDatedEntry<S extends string>(
  history: readonly { status: S; date: string | null }[],
): { status: S; date: string | null } | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].date !== null) return history[i];
  }
  return history.length > 0 ? history[history.length - 1] : null;
}

function currentStatus<S extends string>(
  history: readonly { status: S; date: string | null }[],
): { status: S; date: string | null } | null {
  return history.length === 0 ? null : history[history.length - 1];
}

function projectProgressSignals(project: Project | undefined): string[] {
  if (!project) return [];
  const text = project.evidence
    .map((reference) => reference.note ?? "")
    .filter(Boolean)
    .join(" ");
  const signals: string[] = [];
  const tests: [RegExp, string][] = [
    [/\bcompleted in\b|\bstatus:[^.;]{0,160}\bcompleted\b/i, "project evidence states completion"],
    [/\bentered (?:commercial )?production\b|\bcommercial production\b|\bprocessing operations (?:have )?commenced\b/i, "project evidence states production or processing has begun"],
    [/\bcommissioned\b|\bcommissioning (?:has )?(?:begun|commenced|started)\b/i, "project evidence states commissioning"],
    [/\bground broke\b|\bgroundbreaking\b|\bunder construction\b|\bconstruction (?:has )?(?:begun|commenced|started)\b/i, "project evidence states construction"],
  ];
  for (const [pattern, message] of tests) if (pattern.test(text) && !signals.includes(message)) signals.push(message);
  return signals;
}

function financialAssessment(
  commitment: FinancialCommitment,
  asOf: string,
): LifecycleClockAssessment<FinancialStatus> {
  const current = currentStatus(commitment.financialStatusHistory);
  const dated = latestDatedEntry(commitment.financialStatusHistory);
  const checkedAt = commitment.lifecycleReview?.financialStatusCheckedAt ?? null;
  const referenceDate = laterDate(dated?.date ?? null, checkedAt);
  const age = ageDays(asOf, referenceDate);
  const status = current?.status ?? null;
  const reasons: string[] = [];

  if (status !== null && (ENDED_FINANCIAL.has(status) || status === "disbursed")) {
    reasons.push(
      status === "disbursed"
        ? "financial lifecycle is fully disbursed"
        : `financial lifecycle ended as ${status}`,
    );
    return {
      status,
      statusDate: current?.date ?? null,
      checkedAt,
      referenceDate,
      ageDays: age,
      applicable: true,
      priority: "P3",
      reasons,
    };
  }

  const namedProject = commitment.projectId !== null;
  const preBinding = status === null || PRE_BINDING_FINANCIAL.has(status);

  if (age === null) {
    reasons.push("financial lifecycle has no dated status evidence or review");
    return {
      status,
      statusDate: current?.date ?? null,
      checkedAt,
      referenceDate,
      ageDays: age,
      applicable: true,
      priority: namedProject ? "P1" : "P2",
      reasons,
    };
  }

  if (age > 365) {
    reasons.push(`financial lifecycle has not been evidenced or reviewed for ${age} days`);
    return {
      status,
      statusDate: current?.date ?? null,
      checkedAt,
      referenceDate,
      ageDays: age,
      applicable: true,
      priority: "P1",
      reasons,
    };
  }

  if (namedProject && preBinding && age > 180) {
    reasons.push(`named-project financial status is pre-binding and ${age} days old`);
    return {
      status,
      statusDate: current?.date ?? null,
      checkedAt,
      referenceDate,
      ageDays: age,
      applicable: true,
      priority: "P1",
      reasons,
    };
  }

  if ((preBinding && age >= 90) || (!namedProject && age > 180)) {
    reasons.push(
      namedProject
        ? `pre-binding named-project status is ${age} days old`
        : `non-project financial status is ${age} days old`,
    );
    return {
      status,
      statusDate: current?.date ?? null,
      checkedAt,
      referenceDate,
      ageDays: age,
      applicable: true,
      priority: "P2",
      reasons,
    };
  }

  reasons.push(`financial lifecycle is within the routine refresh window (${age} days)`);
  return {
    status,
    statusDate: current?.date ?? null,
    checkedAt,
    referenceDate,
    ageDays: age,
    applicable: true,
    priority: "P3",
    reasons,
  };
}

function implementationApplicable(commitment: FinancialCommitment): boolean {
  const current = currentStatus(commitment.implementationStatusHistory)?.status ?? null;
  if (current === "not_applicable") return false;
  if (commitment.projectId !== null || commitment.facility !== null) return true;
  if (commitment.valueRole !== "commitment") return false;
  if (commitment.instrument === "tax_credit") return false;
  if (commitment.locations.length === 0) return false;
  return commitment.stages.some((stage) => PHYSICAL_STAGES.has(stage));
}

function implementationAssessment(
  commitment: FinancialCommitment,
  project: Project | undefined,
  financial: LifecycleClockAssessment<FinancialStatus>,
  asOf: string,
): LifecycleClockAssessment<ImplementationStatus> {
  const applicable = implementationApplicable(commitment);
  const current = currentStatus(commitment.implementationStatusHistory);
  const dated = latestDatedEntry(commitment.implementationStatusHistory);
  const checkedAt = commitment.lifecycleReview?.implementationStatusCheckedAt ?? null;
  const referenceDate = laterDate(dated?.date ?? null, checkedAt);
  const age = ageDays(asOf, referenceDate);
  const status = current?.status ?? null;
  const reasons: string[] = [];

  if (!applicable) {
    reasons.push("no physical-project lifecycle is applicable to this row");
    return {
      status,
      statusDate: current?.date ?? null,
      checkedAt,
      referenceDate,
      ageDays: age,
      applicable: false,
      priority: "P3",
      reasons,
    };
  }

  const signals = projectProgressSignals(project);
  const substantiveStatus = status !== null && status !== "not_stated" && status !== "announced";
  if (!substantiveStatus && signals.length > 0) {
    reasons.push(...signals.map((signal) => `${signal}, but implementation history has no matching physical stage`));
    return {
      status,
      statusDate: current?.date ?? null,
      checkedAt,
      referenceDate,
      ageDays: age,
      applicable: true,
      priority: "P0",
      reasons,
    };
  }

  if (status === "operational" || status === "cancelled") {
    reasons.push(`physical lifecycle is ${status}`);
    return {
      status,
      statusDate: current?.date ?? null,
      checkedAt,
      referenceDate,
      ageDays: age,
      applicable: true,
      priority: "P3",
      reasons,
    };
  }

  if (status === "feasibility" || status === "construction" || status === "suspended") {
    if (age === null || age > 365) {
      reasons.push(
        age === null
          ? `${status} status has no dated evidence or review`
          : `${status} status has not been evidenced or reviewed for ${age} days`,
      );
      return {
        status,
        statusDate: current?.date ?? null,
        checkedAt,
        referenceDate,
        ageDays: age,
        applicable: true,
        priority: "P1",
        reasons,
      };
    }
    if (age > 180) {
      reasons.push(`${status} status is ${age} days old`);
      return {
        status,
        statusDate: current?.date ?? null,
        checkedAt,
        referenceDate,
        ageDays: age,
        applicable: true,
        priority: "P2",
        reasons,
      };
    }
  }

  if (status === "commissioning") {
    if (age === null || age > 365) {
      reasons.push(
        age === null
          ? "commissioning status has no dated evidence or review"
          : `commissioning status is ${age} days old`,
      );
      return {
        status,
        statusDate: current?.date ?? null,
        checkedAt,
        referenceDate,
        ageDays: age,
        applicable: true,
        priority: "P1",
        reasons,
      };
    }
    if (age >= 90) {
      reasons.push(`commissioning status is ${age} days old`);
      return {
        status,
        statusDate: current?.date ?? null,
        checkedAt,
        referenceDate,
        ageDays: age,
        applicable: true,
        priority: "P2",
        reasons,
      };
    }
  }

  if (status === null || status === "not_stated" || status === "announced") {
    const binding = financial.status !== null && BINDING_OR_FUNDED.has(financial.status);

    // Once the physical clock has its own evidence or review date, classify it
    // from that clock. A fresh implementation review must not remain stale just
    // because the financing is old.
    if (age !== null) {
      if (age > 180) {
        reasons.push(`physical implementation has no substantive later stage after ${age} days`);
        return {
          status,
          statusDate: current?.date ?? null,
          checkedAt,
          referenceDate,
          ageDays: age,
          applicable: true,
          priority: "P1",
          reasons,
        };
      }
      if (age >= 90) {
        reasons.push(`physical implementation was last evidenced or reviewed ${age} days ago`);
        return {
          status,
          statusDate: current?.date ?? null,
          checkedAt,
          referenceDate,
          ageDays: age,
          applicable: true,
          priority: "P2",
          reasons,
        };
      }
      reasons.push(`physical implementation was reviewed recently (${age} days)`);
      return {
        status,
        statusDate: current?.date ?? null,
        checkedAt,
        referenceDate,
        ageDays: age,
        applicable: true,
        priority: "P3",
        reasons,
      };
    }

    // No physical status date and no physical review yet: use the financing
    // clock only to decide how urgently that first implementation check is due.
    if (financial.ageDays === null || financial.ageDays > 180) {
      reasons.push(
        binding
          ? "binding or funded commitment has never had a substantive physical-status review"
          : "named physical undertaking has never had an implementation review and its financial evidence is old or undated",
      );
      return {
        status,
        statusDate: current?.date ?? null,
        checkedAt,
        referenceDate,
        ageDays: age,
        applicable: true,
        priority: "P1",
        reasons,
      };
    }
    if (binding || financial.ageDays >= 90) {
      reasons.push(
        binding
          ? "recent binding commitment has never had a substantive physical-status review"
          : "physical implementation has not yet been reviewed within the normal refresh window",
      );
      return {
        status,
        statusDate: current?.date ?? null,
        checkedAt,
        referenceDate,
        ageDays: age,
        applicable: true,
        priority: "P2",
        reasons,
      };
    }
  }

  reasons.push(
    age === null
      ? "physical lifecycle has no dated evidence but is not yet due under another rule"
      : `physical lifecycle is within the routine refresh window (${age} days)`,
  );
  return {
    status,
    statusDate: current?.date ?? null,
    checkedAt,
    referenceDate,
    ageDays: age,
    applicable: true,
    priority: "P3",
    reasons,
  };
}

class UnionFind {
  private readonly parent = new Map<string, string>();

  constructor(ids: readonly string[]) {
    ids.forEach((id) => this.parent.set(id, id));
  }

  find(id: string): string {
    const parent = this.parent.get(id);
    if (parent === undefined) throw new Error(`unknown union-find id: ${id}`);
    if (parent === id) return id;
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const [first, second] = [ra, rb].sort(byCodePoint);
    this.parent.set(second, first);
  }
}

function providerKey(commitment: FinancialCommitment): string {
  return (
    commitment.providerOrgIds[0] ??
    commitment.provider ??
    commitment.providerJurisdiction ??
    "provider-not-stated"
  );
}

export function deriveLifecycleRefreshQueue(
  commitments: readonly FinancialCommitment[],
  projects: readonly Project[],
  asOf: string,
): LifecycleRefreshQueue {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const sortedCommitments = [...commitments].sort((a, b) => byCodePoint(a.id, b.id));
  const rows = sortedCommitments.map((commitment) => {
    const financial = financialAssessment(commitment, asOf);
    const implementation = implementationAssessment(
      commitment,
      commitment.projectId === null ? undefined : projectById.get(commitment.projectId),
      financial,
      asOf,
    );
    return {
      commitmentId: commitment.id,
      projectId: commitment.projectId,
      eventId: commitment.eventId,
      provider: commitment.provider,
      financial,
      implementation,
      priority: priorityOf(financial.priority, implementation.priority),
    } satisfies LifecycleRefreshRow;
  });

  const byCommitment = new Map(sortedCommitments.map((commitment) => [commitment.id, commitment]));
  const uf = new UnionFind(sortedCommitments.map((commitment) => commitment.id));

  const firstByProject = new Map<string, string>();
  for (const commitment of sortedCommitments) {
    if (commitment.projectId === null) continue;
    const first = firstByProject.get(commitment.projectId);
    if (first) uf.union(first, commitment.id);
    else firstByProject.set(commitment.projectId, commitment.id);
  }

  for (const commitment of sortedCommitments) {
    for (const relationship of commitment.relationships) {
      if (byCommitment.has(relationship.commitmentId)) uf.union(commitment.id, relationship.commitmentId);
    }
  }

  const firstByProviderEvent = new Map<string, string>();
  for (const commitment of sortedCommitments) {
    if (commitment.projectId !== null || commitment.relationships.length > 0) continue;
    const key = `${commitment.eventId}\u0000${providerKey(commitment)}`;
    const first = firstByProviderEvent.get(key);
    if (first) uf.union(first, commitment.id);
    else firstByProviderEvent.set(key, commitment.id);
  }

  const grouped = new Map<string, LifecycleRefreshRow[]>();
  for (const row of rows) {
    const root = uf.find(row.commitmentId);
    grouped.set(root, [...(grouped.get(root) ?? []), row]);
  }

  const bundles: LifecycleRefreshBundle[] = [...grouped.entries()].map(([root, bundleRows]) => {
    const commitmentRows = bundleRows.map((row) => byCommitment.get(row.commitmentId)!);
    const projectIds = [...new Set(commitmentRows.map((commitment) => commitment.projectId).filter((id): id is string => id !== null))];
    const projectId = projectIds.length === 1 ? projectIds[0] : null;
    const project = projectId === null ? undefined : projectById.get(projectId);
    const provider = commitmentRows.map((commitment) => commitment.provider).find((value): value is string => value !== null);
    const priority = priorityOf(...bundleRows.map((row) => row.priority));
    return {
      id: `bundle:${root}`,
      title: project?.name ?? (provider ? `${provider} — ${commitmentRows[0].eventId}` : commitmentRows[0].eventId),
      projectId,
      commitmentIds: bundleRows.map((row) => row.commitmentId).sort(byCodePoint),
      priority,
      rows: [...bundleRows].sort((a, b) => byCodePoint(a.commitmentId, b.commitmentId)),
    };
  });

  bundles.sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      byCodePoint(a.title, b.title) ||
      byCodePoint(a.id, b.id),
  );

  const counts: Record<LifecycleRefreshPriority, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  bundles.forEach((bundle) => counts[bundle.priority]++);

  return { asOf, rows, bundles, counts };
}

function clockText(clock: LifecycleClockAssessment<string>): string {
  if (!clock.applicable) return "n/a";
  const status = clock.status ?? "none recorded";
  const freshness =
    clock.ageDays === null
      ? "never dated/reviewed"
      : `${clock.ageDays}d since evidence/review`;
  return `${status} · ${freshness} · ${clock.priority}`;
}

export function formatLifecycleRefreshQueue(queue: LifecycleRefreshQueue): string {
  const lines = [
    `Lifecycle refresh queue — as of ${queue.asOf}`,
    `P0 ${queue.counts.P0} bundles · P1 ${queue.counts.P1} · P2 ${queue.counts.P2} · P3 ${queue.counts.P3}`,
    "",
    "This is a maintenance queue: inclusion means the tracker cannot yet distinguish unchanged status from insufficient follow-up, not that a policy or project has failed.",
    "",
  ];

  for (const bundle of queue.bundles) {
    lines.push(`[${bundle.priority}] ${bundle.title}`);
    lines.push(`  ${bundle.commitmentIds.length} linked commitment${bundle.commitmentIds.length === 1 ? "" : "s"}`);
    for (const row of bundle.rows) {
      lines.push(`  - ${row.commitmentId}`);
      lines.push(`    financial: ${clockText(row.financial)}`);
      lines.push(`    implementation: ${clockText(row.implementation)}`);
      for (const reason of [...row.financial.reasons, ...row.implementation.reasons]) lines.push(`    reason: ${reason}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
