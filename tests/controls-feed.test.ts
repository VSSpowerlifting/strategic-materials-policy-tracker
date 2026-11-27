import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { auditFeedPayload, buildControlsFeed, verifyFeedFiles } from "../lib/controls-feed";
import { buildFeedRelease, loadFeedRelease, loadReviewOverlay, writeFeedDir } from "../lib/controls-feed-io";
import { readControlsArchive, stableJson, type JsonObject } from "../lib/controls-release-archive";
import { applyReviewOverlay } from "../lib/controls-review-overlay";

const cutoff = "2026-11-12";
const candidateDate = "2026-11-27";
const overlayPath = "research/controls-review/rc-cn-mofcom-59-2026.json";
const base = () => buildFeedRelease({ curatedOn: cutoff });
const candidate = () => buildFeedRelease({ curatedOn: candidateDate, overlayPath });

test("the profile withholds populated research fields, unreviewed field names and text at every depth", () => {
  const snapshot = readControlsArchive(cutoff);
  const before = buildControlsFeed({ snapshot, curatedOn: cutoff });
  const clause = snapshot.rows.clauses.find((row) => (row.productCodes as unknown[]).length)!;
  const sentinel = "Synthetic withheld text";
  clause.notes = sentinel;
  clause.productScopeAsStated = sentinel;
  clause.clause = sentinel;
  const ref = (clause.evidence as JsonObject[])[0];
  ref.note = sentinel;
  ref.locator = sentinel;
  const code = (clause.productCodes as JsonObject[])[0];
  code.syntheticQualifier = { syntheticSubfield: sentinel };
  snapshot.rows.sources[0].title = sentinel;
  for (const event of snapshot.rows.events) {
    event.documentLabel = sentinel;
    event.titleOriginal = sentinel;
  }
  snapshot.rows.statusHistory[0].note = sentinel;
  const after = buildControlsFeed({ snapshot, curatedOn: cutoff, previous: before });
  assert.doesNotMatch(Object.values(after.files).join(""), /Synthetic withheld text|syntheticQualifier|syntheticSubfield/);
  assert.equal(after.manifest.excluded.unreviewedUpstreamPathCount, 1);
  const measure = after.datasets["measures.json"].find((row) => row.measureId === clause.id)!;
  assert.equal(measure.clauseLabel, null);
  const limitations = new Map(measure.limitations.map((row) => [row.field, row]));
  for (const field of ["product_scope_text", "unreviewed_scope"] as const) {
    const marker = limitations.get(field)!;
    assert.equal(marker.effect, "qualifies_scope");
    assert.ok(marker.sourceIds.length > 0);
    for (const id of marker.sourceIds) assert.ok(after.datasets["sources.json"].some((row) => row.sourceId === id && row.url));
  }
  assert.ok(after.datasets["evidence.json"].some((row) => row.measureId === clause.id && row.sourceId === ref.sourceId && row.locator === null && row.locatorWithheld));
});

test("validators check fields of each individual object and reject empty objects where scalars are required", () => {
  const bundle = base();
  const measure = bundle.datasets["measures.json"].find((row) => row.productCodes.length)!;
  const code = measure.productCodes[0] as unknown as JsonObject;
  delete code.role;
  assert.throws(() => auditFeedPayload(bundle.datasets), /unexpected or missing fields/);
  code.role = "reference";
  code.extra = {};
  assert.throws(() => auditFeedPayload(bundle.datasets), /unexpected or missing fields/);
  delete code.extra;
  code.code = {};
  assert.throws(() => auditFeedPayload(bundle.datasets), /invalid value/);
});

test("private adjudicator details are confined to the overlay and the release binds curation and review dates", () => {
  const snapshot = readControlsArchive(cutoff);
  const overlay = loadReviewOverlay(overlayPath);
  overlay.reviewState = "adjudicated";
  overlay.reviewer = "Synthetic Reviewer";
  overlay.approvedBy = "Synthetic Approver";
  overlay.title = "Synthetic private review annotation";
  overlay.reviewedAt = "2026-11-28";
  const result = applyReviewOverlay(snapshot, overlay);
  const input = { snapshot: result.snapshot, review: { overlay, result } };
  assert.throws(() => buildControlsFeed({ ...input, curatedOn: candidateDate }), /precede adjudication/);
  const bundle = buildControlsFeed({ ...input, curatedOn: overlay.reviewedAt });
  assert.equal(bundle.manifest.reviewState, "review_candidate_adjudicated_unpublished");
  assert.doesNotMatch(Object.values(bundle.files).join(""), /Synthetic (Reviewer|Approver|private)/);
  assert.notEqual(buildFeedRelease({ curatedOn: candidateDate }).manifest.releaseId, base().manifest.releaseId);
});

test("an immutable directory round-trips atomically and rejects a conflicting release", (t) => {
  const temp = mkdtempSync(join(tmpdir(), "feed-profile-"));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const bundle = base();
  assert.equal(writeFeedDir(temp, bundle.files), "written");
  assert.equal(writeFeedDir(temp, bundle.files), "unchanged");
  assert.throws(() => writeFeedDir(temp, candidate().files), /already holds different content/);
  assert.deepEqual(loadFeedRelease(temp).datasets, bundle.datasets);
  const rc = buildFeedRelease({ curatedOn: candidateDate, overlayPath, previousDir: temp });
  assert.deepEqual(rc.files, buildFeedRelease({ curatedOn: candidateDate, overlayPath, previousDir: temp }).files);
  assert.notEqual(rc.manifest.releaseId, candidate().manifest.releaseId);
  assert.equal(verifyFeedFiles(rc.files).manifest.releaseId, rc.manifest.releaseId);
  for (const name of ["profile.json", "changes.json", "measures.json"]) {
    const files = { ...rc.files };
    delete files[name];
    assert.throws(() => verifyFeedFiles(files));
  }
  assert.throws(() => verifyFeedFiles({ ...rc.files, "unlisted.json": "[]" }), /unexpected/);
  const manifest = { ...rc.manifest, curatedOn: "2026-12-01" };
  assert.throws(() => verifyFeedFiles({ ...rc.files, "manifest.json": stableJson(manifest) }), /releaseId does not match/);
});

test("correcting an existing status cannot silently reassign its source or clause", () => {
  const snapshot = readControlsArchive(cutoff);
  const overlay = loadReviewOverlay(overlayPath);
  const entry = snapshot.rows.statusHistory[0];
  overlay.operations.push({
    op: "correct_status", measureId: String(entry.measureId), match: { sourceId: String(entry.sourceId), date: entry.date as string | null },
    set: Object.assign({ note: null }, { measureId: "synthetic-id" }), reason: "Synthetic correction",
  });
  assert.throws(() => applyReviewOverlay(snapshot, overlay), /correction can change only/);
});

test("adding a pending measure retains its parent, source, status and evidence without mutating either input", () => {
  const snapshot = readControlsArchive(cutoff);
  const baselineRows = stableJson(snapshot.rows);
  const overlay = loadReviewOverlay(overlayPath);
  const row = structuredClone(snapshot.rows.clauses[0]);
  row.id = "ctl-synthetic-pending";
  const measureId = String(row.id);
  const sourceId = String((row.evidence as JsonObject[])[0].sourceId);
  const secondSourceId = String(snapshot.rows.sources.find((source) => !(row.evidence as JsonObject[]).some((ref) => ref.sourceId === source.id))!.id);
  overlay.instrumentDates = [];
  overlay.operations = [
    { op: "add_measure", row },
    { op: "add_status", measureId, entry: { date: "2025-01-01", until: null, sourceId: secondSourceId, status: "in_force", note: null },
      evidence: { supports: ["status"], evidence: "explicit", locator: null, note: null } },
  ];
  const draft = stableJson(overlay);
  const result = applyReviewOverlay(snapshot, overlay);
  const bundle = buildControlsFeed({ snapshot: result.snapshot, review: { overlay, result }, curatedOn: candidateDate });
  const measure = bundle.datasets["measures.json"].find((entry) => entry.measureId === measureId);
  assert.equal(measure?.reviewState, "pending_human_adjudication");
  assert.equal(measure.instrumentId, row.eventId);
  const refs = bundle.datasets["evidence.json"].filter((ref) => ref.measureId === measureId);
  assert.ok(refs.every((ref) => ref.reviewState === "pending_human_adjudication"));
  assert.ok(refs.some((ref) => ref.sourceId === sourceId));
  assert.ok(refs.some((ref) => ref.sourceId === secondSourceId));
  assert.equal(stableJson(snapshot.rows), baselineRows);
  assert.equal(stableJson(overlay), draft);
});
