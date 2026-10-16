/** Offline F5-5 private UTF-8 diff. No fetching, decisions, writes or publication. */
import { createHash } from "node:crypto";
import type { F5DriftCase } from "./f5-source-drift";
export type DiffRow = { kind: "context" | "changed" | "removed" | "added"; before: string | null; after: string | null };
const hash = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
function split(s: string): string[] {
  if (!s || Buffer.byteLength(s, "utf8") > 128000 || s.includes("\0"))
    throw Error("F5 private diff: invalid or oversized text");
  const p = s.split(/\r?\n[ \t]*\r?\n/).map(x => x.trim()).filter(Boolean);
  if (!p.length || p.length > 160 || p.some(x => x.length > 2400))
    throw Error("F5 private diff: paragraph limit; review manually");
  return p;
}
export function buildF5PrivateVersionHandoff(item: F5DriftCase, priorText: string, currentText: string) {
  if (!item?.reviewKey || item.reviewStatus !== "unreviewed" ||
      item.disposition !== "content_or_metadata_revised" ||
      item.previous?.health !== "ok" || item.current?.health !== "ok" ||
      !item.previous.sha256 || !item.current.sha256 ||
      item.previous.sourceId !== item.sourceId || item.current.sourceId !== item.sourceId ||
      item.previous.url !== item.officialUrl || item.current.url !== item.officialUrl)
    throw Error("F5 private diff: audited successful revision required");
  const a = split(priorText), b = split(currentText);
  if (hash(priorText) !== item.previous.sha256 || hash(currentText) !== item.current.sha256)
    throw Error("F5 private diff: body hash does not match capture");
  // Exact common prefix/suffix keep the changed window readable without
  // guessing semantic equivalence. Reordering remains an unresolved change.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length, endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  if (Math.max(endA - start, endB - start) > 80)
    throw Error("F5 private diff: too many changed paragraphs; review manually");
  const rows: DiffRow[] = [];
  if (start > 0 && (endA !== start || endB !== start))
    rows.push({ kind: "context", before: a[start - 1], after: b[start - 1] });
  for (let k = 0; k < Math.max(endA - start, endB - start); k++) {
    const before = a[start + k] ?? null, after = b[start + k] ?? null;
    rows.push({ kind: before && after ? "changed" : before ? "removed" : "added", before, after });
  }
  if (endA < a.length && (endA !== start || endB !== start))
    rows.push({ kind: "context", before: a[endA], after: b[endB] });
  return {
    schemaVersion: "f5-5-private-version-handoff-1" as const,
    mode: "offline_private_human_review_only" as const,
    sourceId: item.sourceId, publisher: item.publisher, officialUrl: item.officialUrl,
    reviewKey: item.reviewKey, reasons: [...item.reasons],
    previous: { sha256: item.previous.sha256, retrievedAt: item.previous.retrievedAt,
      publicationDate: item.previous.publicationDate },
    current: { sha256: item.current.sha256, retrievedAt: item.current.retrievedAt,
      publicationDate: item.current.publicationDate },
    rows, omittedUnchanged: start + a.length - endA - rows.filter(x => x.kind === "context").length,
    rawOnlyChange: item.previous.sha256 !== item.current.sha256 && start === a.length && start === b.length,
    reviewerChecks: [
      "Authenticate publisher originals independently; matching supplied hashes do not establish original-source access.",
      "Read full source context, amendments, appendices and translations.",
      "Separate source publication, retrieval and physical event clocks.",
      "Adjudicate project, sponsor, subsidiary and financier identities in existing M3/editorial workflow.",
    ],
    sourceAccessVerified: false as const, reviewVerdict: "unreviewed" as const,
    reviewerIdentity: null, reviewedAt: null, entityLinksAdjudicated: false as const,
    publicReleaseAuthorized: false as const, automatedPromotionAuthorized: false as const,
  };
}
export function formatF5PrivateVersionHandoff(r: ReturnType<typeof buildF5PrivateVersionHandoff>): string {
  const lines = ["F5-5 PRIVATE SOURCE-VERSION DIFF (UNREVIEWED)", r.sourceId + " | " + r.officialUrl,
    "Review key: " + r.reviewKey, "Previous: " + r.previous.sha256 + " | " + r.previous.retrievedAt,
    "Current: " + r.current.sha256 + " | " + r.current.retrievedAt,
    "Reasons: " + r.reasons.join(", ")];
  for (const row of r.rows) {
    if (row.kind === "context") lines.push("  " + row.before);
    else {
      if (row.before !== null) lines.push("- " + row.before);
      if (row.after !== null) lines.push("+ " + row.after);
    }
  }
  if (r.rawOnlyChange) lines.push("WARNING: raw bytes changed but trimmed paragraphs appear equal.");
  lines.push("Unchanged paragraphs omitted: " + r.omittedUnchanged);
  lines.push("HUMAN ORIGINAL-SOURCE REVIEW REQUIRED; NO SOURCE AUTHENTICATION OR PUBLICATION APPROVAL");
  return lines.join("\n") + "\n";
}
