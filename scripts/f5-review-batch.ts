/**
 * F5-5 Phase 3: deterministic, offline reconciliation of MANY source captures
 * into one private human-review workload. This is NOT a scheduler, crawler,
 * semantic event classifier, M3 adjudicator, publication path or database.
 */
import { createHash } from "node:crypto";
import type { Source } from "../lib/types";
import {
  auditF5SourceDrift, type F5DriftCase, type F5SourceCapture,
} from "../lib/f5-source-drift";
import { buildF5PrivateVersionHandoff } from "../lib/f5-source-version-diff";
import {
  buildF5PrivateReviewerBridge, type F5PrivateReviewerBridge,
} from "./f5-private-review-bridge";
import type { M3ReviewerPacketReport } from "./project-execution-review-packets";

export type F5CaptureSequence = {
  schemaVersion: "f5-5-private-capture-sequence-1";
  snapshots: { label: string; captures: F5SourceCapture[] }[];
};
export type F5PrivateBodyPair = {
  reviewKey: string; beforeText: string; afterText: string;
};
export type F5BatchInput = {
  sequence: unknown;
  sources: readonly Pick<Source, "id" | "publisher" | "url">[];
  m3: M3ReviewerPacketReport;
  privateLedger?: unknown;
  bodyPairs?: unknown;
  acknowledgments?: unknown;
  requireContentDiffs?: boolean;
};
type ReviewOccurrence = { from: string; to: string };
type ReconciledCase = F5PrivateReviewerBridge & {
  occurrences: ReviewOccurrence[];
  repeatedObservationCount: number;
  bodyEvidence: "hash_checked_diff" | "content_body_not_supplied" |
    "metadata_only" | "access_only";
  nextStep: "check_original_and_m3" | "investigate_access_failure";
};
type ProjectGroup = {
  projectId: string; projectName: string;
  reviewKeys: string[]; sourceIds: string[]; m3ReviewIds: string[];
  relatedFinanceIds: string[];
  taxonomyBlocked: boolean;
  meaning: "candidate_cross_references_not_independent_industrial_events";
};
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const hash = (x: unknown): string => createHash("sha256")
  .update(JSON.stringify(x), "utf8").digest("hex");
const object = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const HEX = /^[a-f0-9]{64}$/;
const SNAP_LABEL = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/;
function exactKeys(x: Record<string, unknown>, names: string[]): boolean {
  return Object.keys(x).sort().join("|") === [...names].sort().join("|");
}
function fingerprint(x: F5SourceCapture | null): unknown {
  return x && [x.sourceId, x.url, x.health, x.httpStatus, x.sha256, x.publicationDate];
}
function caseIdentity(x: F5DriftCase): string {
  return JSON.stringify([
    x.sourceId, x.publisher, x.officialUrl, x.disposition, x.reasons,
    fingerprint(x.previous), fingerprint(x.current),
  ]);
}
function captureIdentity(x: F5SourceCapture): string {
  return JSON.stringify(fingerprint(x));
}
function compareStringSets(values: Iterable<string>): string[] {
  return [...new Set(values)].sort(compare);
}
function normalizedOptional<T>(
  raw: unknown, label: string, limit: number,
  isItem: (v: Record<string, unknown>) => boolean,
): Record<string, unknown>[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > limit)
    throw Error("F5 batch: " + label + " must be a bounded array");
  const seen = new Set<string>();
  for (const x of raw) {
    if (!object(x) || !isItem(x)) throw Error("F5 batch: invalid " + label + " row");
    const key = x.reviewKey as string;
    if (seen.has(key)) throw Error("F5 batch: duplicate " + label + " review key " + key);
    seen.add(key);
  }
  return raw as Record<string, unknown>[];
}

/**
 * All snapshots are manually supplied, ordered, and validated through the
 * existing Phase 0 auditor. Missing a scan remains NOT SCANNED, never 404.
 * Repeated transitions share one reviewKey and one downstream review packet.
 */
export function buildF5PrivateReviewBatch(input: F5BatchInput) {
  const raw = input.sequence;
  if (!object(raw) || !exactKeys(raw, ["schemaVersion", "snapshots"]) ||
    raw.schemaVersion !== "f5-5-private-capture-sequence-1" ||
    !Array.isArray(raw.snapshots) || raw.snapshots.length < 2 ||
    raw.snapshots.length > 24)
    throw Error("F5 batch: 2-24 ordered, explicitly supplied capture snapshots required");
  const registry = input.sources;
  if (!Array.isArray(registry) || !registry.length)
    throw Error("F5 batch: source registry required");
  const snapshotLabels: string[] = [];
  const snapshots: F5SourceCapture[][] = [];
  const seenLabels = new Set<string>();
  const lastCapture = new Map<string, F5SourceCapture>();
  for (const snapshot of raw.snapshots) {
    if (!object(snapshot) || !exactKeys(snapshot, ["label", "captures"]) ||
      typeof snapshot.label !== "string" || !SNAP_LABEL.test(snapshot.label) ||
      seenLabels.has(snapshot.label))
      throw Error("F5 batch: invalid or repeated snapshot label");
    seenLabels.add(snapshot.label);
    // Reuse the exact registered URL, clock, HTTP-status and SHA validator.
    const validated = auditF5SourceDrift([], snapshot.captures, registry);
    const captures = validated.cases.flatMap(c => c.current ? [c.current] : []);
    for (const x of captures) {
      const prior = lastCapture.get(x.sourceId);
      if (prior && (x.retrievedAt < prior.retrievedAt ||
        (x.retrievedAt === prior.retrievedAt &&
         captureIdentity(x) !== captureIdentity(prior))))
        throw Error("F5 batch: stale/conflicting capture history for " + x.sourceId);
      lastCapture.set(x.sourceId, x);
    }
    snapshots.push(captures);
    snapshotLabels.push(snapshot.label);
  }

  const byKey = new Map<string, {
    item: F5DriftCase; signature: string; occurrences: ReviewOccurrence[];
  }>();
  const coverage: {
    from: string; to: string; reviewed: number; baseline: number;
    unchanged: number; notScanned: number; accessOnly: number;
  }[] = [];
  let observedReviewTransitions = 0;
  for (let i = 1; i < snapshots.length; i++) {
    const receipt = auditF5SourceDrift(snapshots[i - 1], snapshots[i], registry);
    const occurrence = { from: snapshotLabels[i - 1], to: snapshotLabels[i] };
    coverage.push({
      ...occurrence, reviewed: receipt.candidateCount,
      baseline: receipt.baselineCount, unchanged: receipt.unchangedCount,
      notScanned: receipt.notScannedCount,
      accessOnly: receipt.cases.filter(c =>
        c.needsHumanSourceAccess && c.disposition !== "content_or_metadata_revised").length,
    });
    for (const item of receipt.cases) {
      if (!item.needsHumanSourceAccess) continue;
      observedReviewTransitions++;
      if (!item.reviewKey || !HEX.test(item.reviewKey))
        throw Error("F5 batch: reviewed drift lacks valid stable identity");
      const signature = caseIdentity(item);
      const prior = byKey.get(item.reviewKey);
      if (prior) {
        if (prior.signature !== signature)
          throw Error("F5 batch: conflicting evidence for identical review key");
        prior.occurrences.push(occurrence);
      } else byKey.set(item.reviewKey, { item, signature, occurrences: [occurrence] });
    }
  }
  const bodyRows = normalizedOptional(input.bodyPairs, "body pairs", 128, x =>
    exactKeys(x, ["reviewKey", "beforeText", "afterText"]) &&
    typeof x.reviewKey === "string" && HEX.test(x.reviewKey) &&
    typeof x.beforeText === "string" && typeof x.afterText === "string");
  const ackRows = normalizedOptional(input.acknowledgments, "acknowledgments", 128, x =>
    exactKeys(x, ["reviewKey", "bridgeInputDigestSha256", "acknowledgedBy", "acknowledgedAt", "note"]) &&
    typeof x.reviewKey === "string" && HEX.test(x.reviewKey));
  const bodies = new Map(bodyRows.map(row => [row.reviewKey as string, row]));
  const acknowledgments = new Map(ackRows.map(row => [row.reviewKey as string, row]));
  for (const key of [...bodies.keys(), ...acknowledgments.keys()]) {
    if (!byKey.has(key)) throw Error("F5 batch: orphan body or acknowledgment review key " + key);
  }

  const privateLedger = input.privateLedger ?? null;
  const cases: ReconciledCase[] = [];
  for (const [key, entry] of [...byKey].sort(([a], [b]) => compare(a, b))) {
    const { item, occurrences } = entry;
    const rawBodies = bodies.get(key);
    if (rawBodies && item.disposition !== "content_or_metadata_revised")
      throw Error("F5 batch: bodies supplied for access-only review " + key);
    const hasChangedBytes = item.disposition === "content_or_metadata_revised" &&
      item.previous?.sha256 !== item.current?.sha256;
    if (input.requireContentDiffs && hasChangedBytes && !rawBodies)
      throw Error("F5 batch: missing required original body pair for " + key);
    const diff = rawBodies ? buildF5PrivateVersionHandoff(
      item, rawBodies.beforeText as string, rawBodies.afterText as string,
    ) : null;
    const bridge = buildF5PrivateReviewerBridge(
      item, input.m3, privateLedger, diff, acknowledgments.get(key) ?? null,
    );
    const bodyEvidence: ReconciledCase["bodyEvidence"] =
      diff ? "hash_checked_diff" :
      item.disposition !== "content_or_metadata_revised" ? "access_only" :
      hasChangedBytes ? "content_body_not_supplied" : "metadata_only";
    cases.push({
      ...bridge, occurrences: occurrences.map(x => ({ ...x })),
      repeatedObservationCount: occurrences.length - 1, bodyEvidence,
      nextStep: bodyEvidence === "access_only" ?
        "investigate_access_failure" : "check_original_and_m3",
    });
  }
  const byProject = new Map<string, {
    projectId: string; projectName: string;
    keys: Set<string>; sourceIds: Set<string>;
    m3Ids: Set<string>; financeIds: Set<string>; blocked: boolean;
  }>();
  for (const c of cases) {
    for (const link of c.candidateEntityLinks) {
      const k = link.projectId;
      const prev = byProject.get(k);
      if (prev && prev.projectName !== link.projectName)
        throw Error("F5 batch: conflicting project metadata in M3 candidate links");
      const group = prev ?? {
        projectId: k, projectName: link.projectName,
        keys: new Set<string>(), sourceIds: new Set<string>(),
        m3Ids: new Set<string>(), financeIds: new Set<string>(), blocked: false,
      };
      group.keys.add(c.reviewKey);
      group.sourceIds.add(c.sourceId);
      group.m3Ids.add(link.m3ReviewId);
      for (const f of link.financeIds) group.financeIds.add(f);
      if (link.gate === "taxonomy_blocked") group.blocked = true;
      byProject.set(k, group);
    }
  }
  const projectGroups: ProjectGroup[] = [...byProject.values()]
    .sort((a, b) => compare(a.projectId, b.projectId)).map(x => ({
      projectId: x.projectId, projectName: x.projectName,
      reviewKeys: compareStringSets(x.keys),
      sourceIds: compareStringSets(x.sourceIds),
      m3ReviewIds: compareStringSets(x.m3Ids),
      relatedFinanceIds: compareStringSets(x.financeIds),
      taxonomyBlocked: x.blocked,
      meaning: "candidate_cross_references_not_independent_industrial_events",
    }));
  const stats = {
    snapshots: snapshots.length,
    observedReviewTransitions,
    uniqueReviewCases: cases.length,
    repeatTransitionsDeduplicated: observedReviewTransitions - cases.length,
    accessOnlyCases: cases.filter(c => c.bodyEvidence === "access_only").length,
    missingContentBodyCases: cases.filter(c => c.bodyEvidence === "content_body_not_supplied").length,
    hashCheckedDiffCases: cases.filter(c => c.bodyEvidence === "hash_checked_diff").length,
    acknowledgedForReceiptOnly: cases.filter(c => c.acknowledgment !== null).length,
    unresolvedM3Links: cases.filter(c => c.candidateEntityLinks.length === 0).length,
    taxonomyHeldCases: cases.filter(c => c.candidateEntityLinks.some(l =>
      l.gate === "taxonomy_blocked")).length,
    sourcesNotScannedInTransitions: coverage.reduce((n, w) => n + w.notScanned, 0),
  };
  return {
    schemaVersion: "f5-5-private-multicapture-review-batch-1" as const,
    mode: "private_offline_review_only" as const,
    snapshotLabels, transitionCoverage: coverage, stats,
    // Stable under equivalent retries, while coverage keeps every scan gap visible.
    reviewSetDigestSha256: hash(cases.map(c => [
      c.reviewKey, c.sourceId, c.bridgeInputDigestSha256,
    ])),
    cases, projectGroups,
    limitations: [
      "All snapshots and source bytes are manually supplied, not independently authenticated.",
      "Source metadata and exact M3 project/finance links are review leads, not adjudicated events or cash flows.",
      "Multiple financiers citing the same construction statement are not multiple physical events.",
      "Missing scans, 404/410, outages, and body changes cannot establish any new positive occurrence.",
      "Acknowledgment records private receipt only; all human source review remains in existing M3/M1 workflows.",
      "Never put private packet output in a public GitHub artifact, issue, API route, export, or tracked file.",
    ],
    sourceAccessVerified: false as const,
    originalSourceReviewApproved: false as const,
    publicReleaseAuthorized: false as const,
    automaticPublicationAuthorized: false as const,
    publicSeedMutationAuthorized: false as const,
  };
}
export type F5PrivateReviewBatch = ReturnType<typeof buildF5PrivateReviewBatch>;

const safe = (s: string) => s.replace(/\s+/g, " ")
  .replace(/[\\\u0060*_{}\[\]<>|]/g, "\\$&");
export function renderF5PrivateReviewBatch(r: F5PrivateReviewBatch): string {
  const lines = [
    "# F5-5 multi-capture private reviewer worklist", "",
    "**PRIVATE / UNREVIEWED / NO PUBLICATION AUTHORIZATION**", "",
    "Review-set digest: " + r.reviewSetDigestSha256,
    "Snapshots: " + r.stats.snapshots +
      " | unique reviews: " + r.stats.uniqueReviewCases +
      " | duplicate transitions: " + r.stats.repeatTransitionsDeduplicated,
    "Body diffs: " + r.stats.hashCheckedDiffCases +
      " | changed bodies missing: " + r.stats.missingContentBodyCases +
      " | access-only reviews: " + r.stats.accessOnlyCases,
    "Receipt acknowledgments: " + r.stats.acknowledgedForReceiptOnly +
      " | unlinked to M3: " + r.stats.unresolvedM3Links +
      " | taxonomy-held: " + r.stats.taxonomyHeldCases, "",
    "## Capture continuity", "",
  ];
  for (const t of r.transitionCoverage) lines.push(
    "- " + safe(t.from) + " → " + safe(t.to) +
    ": reviewed " + t.reviewed + "; baseline " + t.baseline +
    "; unchanged " + t.unchanged + "; NOT SCANNED " + t.notScanned +
    "; access-only " + t.accessOnly);
  lines.push("", "## Candidate project clusters (NOT events or financing totals)", "");
  if (!r.projectGroups.length) lines.push("NONE — all candidate entity identities unresolved.");
  for (const g of r.projectGroups) lines.push(
    "- " + safe(g.projectName) + " (" + safe(g.projectId) + ")",
    "  Evidence review keys: " + g.reviewKeys.length +
      "; distinct registered sources: " + g.sourceIds.length +
      "; taxonomy hold: " + (g.taxonomyBlocked ? "YES" : "no"),
    "  M3 review rows: " + g.m3ReviewIds.map(safe).join(", "),
    "  Existing finance cross-references only: " +
      (g.relatedFinanceIds.length ? g.relatedFinanceIds.map(safe).join(", ") : "NONE"));
  lines.push("", "## Reviewer worklist (no decisions recorded)", "");
  if (!r.cases.length) lines.push("No new review-worthy transitions; unscanned coverage above remains unresolved.");
  for (const c of r.cases) {
    lines.push("", "### " + safe(c.sourceId),
      "Original URL: " + safe(c.officialUrl),
      "Key: " + c.reviewKey + " | context digest: " + c.bridgeInputDigestSha256,
      "Reason: " + c.reasons.map(safe).join(", ") +
        " | body evidence: " + safe(c.bodyEvidence),
      "Seen in: " + c.occurrences.map(o => safe(o.from) + "→" + safe(o.to)).join(", "),
      "M3 candidate links: " + (c.candidateEntityLinks.length ?
        c.candidateEntityLinks.map(l => safe(l.m3ReviewId) +
          " [" + safe(l.gate) + "]").join(", ") : "NONE — MANUAL IDENTITY REVIEW"),
      "Received by human: " + (c.acknowledgment ?
        safe(c.acknowledgment.acknowledgedBy) + " at " +
          safe(c.acknowledgment.acknowledgedAt) : "NO"),
      "Next: " + safe(c.nextStep));
    if (c.versionComparison) {
      lines.push("Private changed paragraphs (hash-checked, not source-authenticated):");
      for (const row of c.versionComparison.rows) {
        if (row.before !== null) lines.push("- " + safe(row.before));
        if (row.after !== null) lines.push("+ " + safe(row.after));
      }
    }
  }
  lines.push("", "## Mandatory limitations", "");
  for (const caution of r.limitations) lines.push("- " + safe(caution));
  lines.push("", "Use existing M3 worksheets and private adjudications for actual review. " +
    "Do not treat this batch as authority to publish or change the corpus.", "");
  return lines.join("\n");
}
