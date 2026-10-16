/**
 * F5-5 private, read-only bridge to EXISTING M3 and M1 review workflows.
 * No source fetching, approval, status update, monitoring or publication.
 */
import { createHash } from "node:crypto";
import type { F5DriftCase } from "../lib/f5-source-drift";
import {
  formatF5PrivateVersionHandoff, type buildF5PrivateVersionHandoff,
} from "../lib/f5-source-version-diff";
import { parsePrivateEditorialLedger } from "./editorial-ledger";
import type { M3ReviewerPacketReport } from "./project-execution-review-packets";

type VersionDiff = ReturnType<typeof buildF5PrivateVersionHandoff>;
type ReceiptAck = {
  reviewKey: string; bridgeInputDigestSha256: string;
  acknowledgedBy: string; acknowledgedAt: string; note: string;
};
const hash = (v: unknown) => createHash("sha256").update(JSON.stringify(v), "utf8").digest("hex");
const hex = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const obj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const order = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function clock(v: unknown): v is string {
  if (typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)) return false;
  const n = Date.parse(v);
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 19) === v.slice(0, 19);
}
const text = (v: unknown, n: number): v is string =>
  typeof v === "string" && !!v.trim() && v.length <= n &&
  !/[\u0000-\u001f\u007f]/.test(v);

/**
 * Inputs must come from auditF5SourceDrift, buildM3ReviewerPackets, and (if
 * supplied) buildF5PrivateVersionHandoff. Acknowledgment is receipt of the
 * handoff only; M3 adjudication stays exclusively in its original workflow.
 */
export function buildF5PrivateReviewerBridge(
  item: F5DriftCase, m3: M3ReviewerPacketReport,
  privateLedger: unknown = null, diff: VersionDiff | null = null,
  receiptAck: unknown = null,
) {
  if (!item || !hex(item.reviewKey) || item.reviewStatus !== "unreviewed" ||
    !item.needsHumanSourceAccess || item.positiveEventInferred !== false ||
    item.publicSeedChangeAuthorized !== false || !item.previous || !item.current ||
    !item.reasons.length || !text(item.sourceId, 200) || !text(item.publisher, 400) ||
    !item.officialUrl.startsWith("https://") ||
    item.previous.sourceId !== item.sourceId || item.current.sourceId !== item.sourceId ||
    item.previous.url !== item.officialUrl || item.current.url !== item.officialUrl)
    throw Error("F5 bridge: audited source drift candidate required");
  if (!m3 || m3.schemaVersion !== "m3-reviewer-packet-1" ||
    m3.publicationAuthorized !== false || m3.automaticSourceApprovalAuthorized !== false ||
    !Array.isArray(m3.worksheets))
    throw Error("F5 bridge: existing M3 reviewer packets required");

  const seen = new Set<string>();
  const candidates = [];
  for (const w of m3.worksheets) {
    if (!w || !text(w.id, 200) || seen.has(w.id))
      throw Error("F5 bridge: duplicate or invalid M3 worksheet");
    seen.add(w.id);
    if (w.originalSource.id !== item.sourceId) continue;
    if (w.originalSource.url !== item.officialUrl ||
      w.originalSource.publisher !== item.publisher || !hex(w.reviewInputDigestSha256) ||
      w.humanAttestationPresent !== false ||
      !["taxonomy_blocked", "unsigned_source_review"].includes(w.status))
      throw Error("F5 bridge: conflicting M3 source/worksheet context");
    candidates.push({
      m3ReviewId: w.id, projectId: w.project.id, projectName: w.project.name,
      financeIds: [...w.financingObservationReferences],
      gate: w.status, m3ReviewInputDigestSha256: w.reviewInputDigestSha256,
      linkMeaning: "candidate_only_not_a_verified_event" as const,
    });
  }
  candidates.sort((a, b) => order(a.m3ReviewId, b.m3ReviewId));
  const editorial = [];
  if (privateLedger !== null) {
    const ledger = parsePrivateEditorialLedger(privateLedger);
    for (const x of ledger.items) {
      if (!x.exactCitationSourceIds.includes(item.sourceId)) continue;
      editorial.push({
        ledgerKey: x.key, observationUrl: x.officialUrl, status: x.status,
        candidateId: x.candidateId,
        linkMeaning: "existing_editorial_observation_not_a_review_verdict" as const,
      });
    }
  }
  editorial.sort((a, b) => order(a.ledgerKey, b.ledgerKey));
  if (diff && (diff.reviewKey !== item.reviewKey || diff.sourceId !== item.sourceId ||
    diff.officialUrl !== item.officialUrl || diff.previous.sha256 !== item.previous.sha256 ||
    diff.current.sha256 !== item.current.sha256 ||
    diff.previous.retrievedAt !== item.previous.retrievedAt ||
    diff.current.retrievedAt !== item.current.retrievedAt ||
    diff.sourceAccessVerified !== false || diff.reviewVerdict !== "unreviewed" ||
    diff.publicReleaseAuthorized !== false || diff.automatedPromotionAuthorized !== false))
    throw Error("F5 bridge: source diff does not match drift receipt");

  // Fingerprint context without capture clocks; equivalent retry keeps identity.
  const bridgeInputDigestSha256 = hash([
    "f5-5-private-m3-bridge-1", item.reviewKey, item.sourceId,
    item.officialUrl, item.publisher, item.disposition, item.reasons,
    candidates, editorial,
  ]);
  let acknowledgment: (ReceiptAck & {
    meaning: "receipt_seen_only_not_original_source_review"
  }) | null = null;
  if (receiptAck !== null) {
    const fields = ["reviewKey", "bridgeInputDigestSha256", "acknowledgedBy", "acknowledgedAt", "note"];
    if (!obj(receiptAck) || Object.keys(receiptAck).sort().join("|") !== fields.sort().join("|") ||
      receiptAck.reviewKey !== item.reviewKey ||
      receiptAck.bridgeInputDigestSha256 !== bridgeInputDigestSha256 ||
      !text(receiptAck.acknowledgedBy, 120) || !clock(receiptAck.acknowledgedAt) ||
      receiptAck.acknowledgedAt < item.current.retrievedAt || !text(receiptAck.note, 1200))
      throw Error("F5 bridge: stale or invalid receipt acknowledgment");
    acknowledgment = {
      reviewKey: receiptAck.reviewKey as string,
      bridgeInputDigestSha256: receiptAck.bridgeInputDigestSha256 as string,
      acknowledgedBy: receiptAck.acknowledgedBy as string,
      acknowledgedAt: receiptAck.acknowledgedAt as string,
      note: receiptAck.note as string,
      meaning: "receipt_seen_only_not_original_source_review",
    };
  }
  return {
    schemaVersion: "f5-5-private-m3-review-bridge-1" as const,
    mode: "private_offline_handoff_only" as const,
    sourceId: item.sourceId, publisher: item.publisher, officialUrl: item.officialUrl,
    driftDisposition: item.disposition, reasons: [...item.reasons],
    reviewKey: item.reviewKey, bridgeInputDigestSha256,
    previous: { ...item.previous }, current: { ...item.current },
    versionComparison: diff,
    candidateEntityLinks: candidates, existingEditorialObservations: editorial,
    acknowledgment,
    existingM3Authority: "original_M3_worksheet_and_gitignored_adjudications_only" as const,
    sourceAccessVerified: false as const, m3AdjudicationCompleted: false as const,
    positiveIndustrialEventInferred: false as const,
    publicReleaseAuthorized: false as const, automatedPromotionAuthorized: false as const,
    publicSeedMutationAuthorized: false as const,
  };
}
export type F5PrivateReviewerBridge = ReturnType<typeof buildF5PrivateReviewerBridge>;
const safe = (s: string) => s.replace(/\s+/g, " ")
  .replace(/[\\\u0060*_{}\[\]<>|]/g, "\\$&");
export function renderF5PrivateReviewerBridge(r: F5PrivateReviewerBridge): string {
  const lines = [
    "# F5-5 private M3/editorial reviewer handoff", "",
    "**UNREVIEWED SOURCE OBSERVATION — NO PUBLICATION AUTHORIZATION**", "",
    "Source: " + safe(r.sourceId) + " — " + safe(r.publisher),
    "Original URL: " + safe(r.officialUrl),
    "Disposition: " + safe(r.driftDisposition),
    "Stable review key: " + r.reviewKey,
    "Context digest: " + r.bridgeInputDigestSha256,
    "Prior capture: " + safe(r.previous.retrievedAt) + " | " + safe(r.previous.sha256 ?? "UNAVAILABLE"),
    "Current capture: " + safe(r.current.retrievedAt) + " | " + safe(r.current.sha256 ?? "UNAVAILABLE"),
    "Reasons: " + r.reasons.map(safe).join(", "), "",
    "## Candidate entity links from existing M3 queue", "",
  ];
  if (!r.candidateEntityLinks.length) lines.push(
    "NONE — no exact M3 source-ID match; investigate identity manually.", "");
  for (const x of r.candidateEntityLinks) lines.push(
    "- " + safe(x.m3ReviewId) + ": " + safe(x.projectName) + " (" + safe(x.projectId) + ")",
    "  Gate: " + safe(x.gate) + "; M3 digest: " + x.m3ReviewInputDigestSha256,
    "  Existing financing references (NOT new financing): " +
      (x.financeIds.length ? x.financeIds.map(safe).join(", ") : "NONE"), "");
  lines.push("## Existing private editorial observations", "");
  if (!r.existingEditorialObservations.length)
    lines.push("No exact source-ID-linked M1 editorial observation supplied.", "");
  for (const x of r.existingEditorialObservations)
    lines.push("- " + safe(x.ledgerKey) + " [" + safe(x.status) + "] " +
      safe(x.observationUrl) + " | candidate " + safe(x.candidateId ?? "NONE"));
  if (r.versionComparison)
    lines.push("", "## Hash-checked source-version difference", "",
      formatF5PrivateVersionHandoff(r.versionComparison).trimEnd(), "");
  else lines.push("", "No body comparison supplied; inspect publisher originals manually.", "");
  lines.push("## Receipt acknowledgment (NOT original-source review)", "");
  if (r.acknowledgment)
    lines.push("Seen by " + safe(r.acknowledgment.acknowledgedBy) + " at " +
      safe(r.acknowledgment.acknowledgedAt), "Note: " + safe(r.acknowledgment.note), "");
  else lines.push("PENDING — no human receipt acknowledgment.", "");
  lines.push(
    "Next: independently inspect the full originals; use the existing M3 worksheet and",
    "gitignored M3 adjudication file, or original M1 editorial process, for genuine decisions.",
    "A receipt acknowledgment does not establish source access, facts, reviewer approval or publication.",
    "Missing/blocked originals are not new positive events. No public/seed/corpus changes authorized.", "",
  );
  return lines.join("\n");
}
