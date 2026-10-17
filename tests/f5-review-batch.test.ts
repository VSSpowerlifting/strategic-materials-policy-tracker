import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { site } from "../lib/site";
import { emptyPrivateEditorialLedger } from "../scripts/editorial-ledger";
import type { F5SourceCapture } from "../lib/f5-source-drift";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import {
  buildF5PrivateReviewBatch, renderF5PrivateReviewBatch,
  type F5CaptureSequence,
} from "../scripts/f5-review-batch";

const sources = getAllSources();
const neo = sources.find(s => s.id === "src-neo-commercial-production-2026")!;
const alcoa = sources.find(s => s.id === "src-alcoa-wagerup-groundbreaking-2026")!;
const stibnite = sources.find(s => s.id === "src-perpetua-stibnite-early-works-2025")!;
assert.ok(neo && alcoa && stibnite);
const oldBody = "Original synthetic paragraph.\n\nA grant is described as planned.\n\nContext.";
const newBody = "Original synthetic paragraph.\n\nA grant is amended in this SYNTHETIC fixture; inspect the issuer.\n\nContext.";
const sha = (body: string) => createHash("sha256").update(body, "utf8").digest("hex");
function cap(
  src: typeof neo, body: string, day: number,
  extra: Partial<F5SourceCapture> = {},
): F5SourceCapture {
  return {
    sourceId: src.id, url: src.url,
    retrievedAt: "2026-10-" + String(day).padStart(2, "0") + "T10:00:00Z",
    health: "ok", httpStatus: 200, sha256: sha(body),
    publicationDate: "2026-09-14", ...extra,
  };
}
const seq = (...arr: F5SourceCapture[][]): F5CaptureSequence => ({
  schemaVersion: "f5-5-private-capture-sequence-1",
  snapshots: arr.map((captures, i) => ({ label: "run" + (i + 1), captures })),
});
function m3() {
  return buildM3ReviewerPackets(structuredClone(queue), {
    projects: getAllProjects(), sources,
    commitments: getAllFinancialCommitments(), corpusCutoff: site.lastUpdated,
    publicMilestoneCount: getAllProjectMilestones().length,
  });
}
function build(sequence: unknown, opts: {
  bodyPairs?: unknown; acknowledgments?: unknown;
  requireContentDiffs?: boolean; privateLedger?: unknown;
} = {}) {
  return buildF5PrivateReviewBatch({ sequence, sources, m3: m3(), ...opts });
}
const changed = () => seq([cap(neo, oldBody, 12)], [cap(neo, newBody, 13)]);

test("end-to-end multi-capture preview: exact M3 candidate, SHA-pinned diff and ZERO publication authority", () => {
  const financeBefore = JSON.stringify(getAllFinancialCommitments());
  const report = build(changed(), {
    bodyPairs: [{ reviewKey: build(changed()).cases[0].reviewKey,
      beforeText: oldBody, afterText: newBody }],
    requireContentDiffs: true,
  });
  assert.equal(report.schemaVersion, "f5-5-private-multicapture-review-batch-1");
  assert.equal(report.stats.snapshots, 2);
  assert.equal(report.stats.uniqueReviewCases, 1);
  assert.equal(report.stats.hashCheckedDiffCases, 1);
  assert.equal(report.cases[0].sourceId, neo.id);
  assert.equal(report.cases[0].candidateEntityLinks[0].m3ReviewId, "review-m3-2-neo-narva-magnets");
  assert.equal(report.cases[0].candidateEntityLinks[0].projectId, "prj-ee-neo-rare-earth-magnet-project");
  assert.equal(report.cases[0].versionComparison?.sourceAccessVerified, false);
  assert.equal(report.cases[0].acknowledgment, null);
  assert.equal(report.sourceAccessVerified, false);
  assert.equal(report.originalSourceReviewApproved, false);
  assert.equal(report.publicReleaseAuthorized, false);
  assert.equal(report.automaticPublicationAuthorized, false);
  assert.equal(report.publicSeedMutationAuthorized, false);
  assert.equal(getAllProjectMilestones().length, 1);
  assert.equal(JSON.stringify(getAllFinancialCommitments()), financeBefore);
  const markdown = renderF5PrivateReviewBatch(report);
  assert.match(markdown, /SYNTHETIC fixture/);
  assert.match(markdown, /NO PUBLICATION AUTHORIZATION/);
  assert.match(markdown, /existing M3 worksheets/i);
});

test("retry A-to-B transition deduplicates after B-to-A reversal, with stable review-set digest", () => {
  const first = build(changed());
  const again = build(seq(
    [cap(neo, oldBody, 12)], [cap(neo, newBody, 13)],
    [cap(neo, oldBody, 14)], [cap(neo, newBody, 15)],
  ));
  assert.equal(again.stats.observedReviewTransitions, 3);
  assert.equal(again.stats.uniqueReviewCases, 2);
  assert.equal(again.stats.repeatTransitionsDeduplicated, 1);
  const repeated = again.cases.find(c => c.reviewKey === first.cases[0].reviewKey)!;
  assert.equal(repeated.repeatedObservationCount, 1);
  assert.deepEqual(repeated.occurrences, [
    { from: "run1", to: "run2" }, { from: "run3", to: "run4" },
  ]);
  const retryOnly = build(seq(
    [cap(neo, oldBody, 12)], [cap(neo, newBody, 13)],
    [cap(neo, newBody, 14)],
  ));
  assert.equal(first.reviewSetDigestSha256, retryOnly.reviewSetDigestSha256);
  assert.equal(first.cases[0].bridgeInputDigestSha256, retryOnly.cases[0].bridgeInputDigestSha256);
});

test("one Alcoa groundbreaking with three financier references stays ONE review, not three events", () => {
  const r = build(seq(
    [cap(alcoa, oldBody, 12)], [cap(alcoa, newBody, 13)],
  ));
  assert.equal(r.stats.uniqueReviewCases, 1);
  assert.equal(r.projectGroups.length, 1);
  assert.equal(r.projectGroups[0].relatedFinanceIds.length, 3);
  assert.equal(r.projectGroups[0].reviewKeys.length, 1);
  assert.equal(r.projectGroups[0].sourceIds.length, 1);
  assert.equal(r.projectGroups[0].meaning,
    "candidate_cross_references_not_independent_industrial_events");
  assert.equal(r.publicReleaseAuthorized, false);
});

test("parallel source revisions group by registered project without cross-source financial aggregation", () => {
  const r = build(seq(
    [cap(neo, oldBody, 12), cap(alcoa, oldBody, 12)],
    [cap(alcoa, newBody, 13), cap(neo, newBody, 13)],
  ));
  assert.equal(r.stats.uniqueReviewCases, 2);
  assert.equal(r.projectGroups.length, 2);
  assert.equal(r.projectGroups.find(g => g.projectId === "prj-au-alcoa-sojitz-gallium")?.relatedFinanceIds.length, 3);
  const reverse = build(seq(
    [cap(alcoa, oldBody, 12), cap(neo, oldBody, 12)],
    [cap(neo, newBody, 13), cap(alcoa, newBody, 13)],
  ));
  assert.deepEqual(r, reverse);
});

test("source 404/410 and subsequent restoration are access observations, never signed agreement or production", () => {
  const lost = cap(stibnite, "", 13, {
    health: "not_found", httpStatus: 410, sha256: null, publicationDate: null,
  });
  const r = build(seq(
    [cap(stibnite, oldBody, 12)], [lost], [cap(stibnite, oldBody, 14)],
  ));
  assert.equal(r.stats.uniqueReviewCases, 2);
  assert.equal(r.stats.accessOnlyCases, 2);
  assert.ok(r.cases.every(c => c.bodyEvidence === "access_only"));
  assert.ok(r.cases.every(c => c.nextStep === "investigate_access_failure"));
  assert.ok(r.cases.every(c => c.candidateEntityLinks[0].gate === "taxonomy_blocked"));
  assert.equal(r.stats.taxonomyHeldCases, 2);
  assert.ok(r.cases.every(c => !c.versionComparison && !c.positiveIndustrialEventInferred));
  assert.equal(r.publicSeedMutationAuthorized, false);
});

test("schedule outage and absent scans retain NOT SCANNED; recovery after gap is baseline, not a new event", () => {
  const r = build(seq(
    [cap(neo, oldBody, 12)], [], [cap(neo, newBody, 14)],
  ));
  assert.equal(r.stats.uniqueReviewCases, 0);
  assert.equal(r.transitionCoverage[0].notScanned, 1);
  assert.equal(r.transitionCoverage[1].baseline, 1);
  assert.equal(r.stats.sourcesNotScannedInTransitions, 1);
  assert.equal(r.cases.length, 0);
  assert.match(renderF5PrivateReviewBatch(r), /NOT SCANNED/);
});

test("blocked network retrieval is access-only, not proof of agreement amendment", () => {
  const blocked = cap(neo, "", 13, {
    health: "blocked", httpStatus: 403, sha256: null, publicationDate: null,
  });
  const r = build(seq([cap(neo, oldBody, 12)], [blocked]));
  assert.equal(r.stats.accessOnlyCases, 1);
  assert.deepEqual(r.cases[0].reasons, ["retrieval_failed"]);
  assert.equal(r.cases[0].bodyEvidence, "access_only");
  assert.equal(r.cases[0].publicReleaseAuthorized, false);
});

test("changed publication clock, with unchanged bytes, cannot manufacture a physical occurrence date", () => {
  const r = build(seq(
    [cap(neo, oldBody, 12, { publicationDate: "2026-09-14" })],
    [cap(neo, oldBody, 13, { publicationDate: "2026-09-15" })],
  ));
  assert.equal(r.cases.length, 1);
  assert.deepEqual(r.cases[0].reasons, ["publication_date_changed"]);
  assert.equal(r.cases[0].bodyEvidence, "metadata_only");
  assert.equal(r.stats.missingContentBodyCases, 0);
  assert.equal(r.cases[0].positiveIndustrialEventInferred, false);
});

test("missing original text is clearly flagged, while strict mode refuses incomplete content review", () => {
  const r = build(changed());
  assert.equal(r.stats.missingContentBodyCases, 1);
  assert.equal(r.cases[0].bodyEvidence, "content_body_not_supplied");
  assert.throws(() => build(changed(), { requireContentDiffs: true }),
    /missing required original body pair/);
  assert.throws(() => build(changed(), {
    bodyPairs: [{ reviewKey: r.cases[0].reviewKey,
      beforeText: oldBody, afterText: newBody + "fabrication" }],
  }), /hash/);
});

test("orphan, duplicate and access-only body pairs fail closed without silent dropping", () => {
  const key = build(changed()).cases[0].reviewKey;
  const pair = { reviewKey: key, beforeText: oldBody, afterText: newBody };
  assert.throws(() => build(changed(), { bodyPairs: [pair, pair] }), /duplicate body pairs/);
  assert.throws(() => build(changed(), {
    bodyPairs: [{ ...pair, reviewKey: "f".repeat(64) }],
  }), /orphan/);
  const missing = seq([cap(neo, oldBody, 12)], [cap(neo, "", 13, {
    health: "not_found", httpStatus: 404, sha256: null, publicationDate: null,
  })]);
  const accessKey = build(missing).cases[0].reviewKey;
  assert.throws(() => build(missing, {
    bodyPairs: [{ ...pair, reviewKey: accessKey }],
  }), /access-only/);
});

test("acknowledgment attaches only to matching existing M3 context and never becomes source verification", () => {
  const first = build(changed());
  const ack = {
    reviewKey: first.cases[0].reviewKey,
    bridgeInputDigestSha256: first.cases[0].bridgeInputDigestSha256,
    acknowledgedBy: "Synthetic reviewer (test only)",
    acknowledgedAt: "2026-10-14T12:00:00Z",
    note: "Private packet received, original-source review pending.",
  };
  const r = build(changed(), { acknowledgments: [ack] });
  assert.equal(r.stats.acknowledgedForReceiptOnly, 1);
  assert.equal(r.cases[0].acknowledgment?.meaning, "receipt_seen_only_not_original_source_review");
  assert.equal(r.originalSourceReviewApproved, false);
  assert.equal(r.cases[0].m3AdjudicationCompleted, false);
  assert.throws(() => build(changed(), {
    acknowledgments: [{ ...ack, bridgeInputDigestSha256: "0".repeat(64) }],
  }), /stale/);
  assert.throws(() => build(changed(), {
    acknowledgments: [{ ...ack, verdict: "approved" }],
  }), /invalid acknowledgments/);
  assert.throws(() => build(changed(), { acknowledgments: [ack, ack] }), /duplicate acknowledgments/);
  assert.throws(() => build(changed(), { acknowledgments: [{
    ...ack, reviewKey: "f".repeat(64) }] }), /orphan/);
});

test("unmatched registered original stays manually unresolved; no sponsor/subsidiary heuristic", () => {
  const matchIds = new Set(m3().worksheets.map(w => w.originalSource.id));
  const unmatched = sources.find(s => s.url.startsWith("https://") && !matchIds.has(s.id))!;
  assert.ok(unmatched);
  const r = build(seq(
    [cap(unmatched, oldBody, 12)], [cap(unmatched, newBody, 13)],
  ));
  assert.equal(r.stats.unresolvedM3Links, 1);
  assert.equal(r.cases[0].candidateEntityLinks.length, 0);
  assert.equal(r.projectGroups.length, 0);
  assert.match(renderF5PrivateReviewBatch(r), /MANUAL IDENTITY REVIEW/);
});

test("invalid capture history, same-time contradiction, unknown URL and repeated labels fail closed", () => {
  assert.throws(() => build({}), /2-24/);
  assert.throws(() => build(seq([cap(neo, newBody, 15)], [cap(neo, oldBody, 13)])),
    /stale/);
  assert.throws(() => build(seq([cap(neo, oldBody, 12)], [cap(neo, newBody, 12)])),
    /conflicting/);
  assert.throws(() => build(seq([cap(neo, oldBody, 12)], [cap(neo, newBody, 13, {
    url: "https://example.com/other",
  })])), /exactly match/);
  const labels = seq([cap(neo, oldBody, 12)], [cap(neo, newBody, 13)]);
  labels.snapshots[1].label = labels.snapshots[0].label;
  assert.throws(() => build(labels), /repeated snapshot label/);
  const bad = seq([cap(neo, oldBody, 12)], [cap(neo, newBody, 13)]);
  bad.snapshots[1].captures.push(cap(neo, newBody, 13));
  assert.throws(() => build(bad), /duplicate current source ID/);
});

test("private offline CLI: deterministic multi-case JSON/Markdown, bounded input, no files written", () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-f5-batch-"));
  try {
    const sequence = join(dir, "sequence.json"), manifest = join(dir, "bodies.json");
    const before = join(dir, "original.txt"), after = join(dir, "current.txt");
    const key = build(changed()).cases[0].reviewKey;
    writeFileSync(sequence, JSON.stringify(changed()));
    writeFileSync(before, oldBody); writeFileSync(after, newBody);
    writeFileSync(manifest, JSON.stringify({
      schemaVersion: "f5-5-private-body-paths-1",
      entries: [{ reviewKey: key, beforePath: "original.txt", afterPath: "current.txt" }],
    }));
    const cmd = ["--import", "tsx", "scripts/run-f5-private-review-batch.ts"];
    const args = [...cmd, "--sequence", sequence, "--bodies", manifest, "--require-content-diffs", "--json"];
    const a = execFileSync(process.execPath, args, { encoding: "utf8" });
    const b = execFileSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(a, b);
    const p = JSON.parse(a);
    assert.equal(p.stats.hashCheckedDiffCases, 1);
    assert.equal(p.publicReleaseAuthorized, false);
    assert.deepEqual(readdirSync(dir).sort(), ["bodies.json","current.txt","original.txt","sequence.json"]);
    assert.equal(readFileSync(before, "utf8"), oldBody);
    assert.deepEqual(getAllProjectMilestones().map(x => x.id), ["mil-au-alcoa-wagerup-groundbreaking-2026-08-24"]);
    const md = execFileSync(process.execPath, args.filter(x => x !== "--json"), { encoding: "utf8" });
    assert.match(md, /private reviewer worklist/);
    for (const flag of ["--approve", "--publish", "--write-seed"]) {
      const denied = spawnSync(process.execPath, [...args, flag], { encoding: "utf8" });
      assert.equal(denied.status, 2);
      assert.match(denied.stderr, /Usage:/);
      assert.equal(denied.stdout, "");
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("body manifest disallows traversal and symlinks; no private artifacts exported", () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-f5-private-paths-"));
  try {
    const seqFile = join(dir, "sequence.json"), manifest = join(dir, "pairs.json");
    writeFileSync(seqFile, JSON.stringify(changed()));
    writeFileSync(manifest, JSON.stringify({
      schemaVersion: "f5-5-private-body-paths-1", entries: [{
        reviewKey: build(changed()).cases[0].reviewKey,
        beforePath: "../outside.txt", afterPath: "after.txt",
      }],
    }));
    const args = ["--import","tsx","scripts/run-f5-private-review-batch.ts",
      "--sequence", seqFile, "--bodies", manifest, "--json"];
    const proc = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(proc.status, 2);
    assert.match(proc.stderr, /escapes private manifest/);
    assert.equal(proc.stdout, "");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("private reviewer scripts are not imported by public app, components, search, exports or data", () => {
  const files = [
    "lib/data.ts", "lib/export.ts", "lib/search.ts", "app/page.tsx",
    "app/api/export/dataset.json/route.ts", "app/api/v1/projects/route.ts",
  ];
  for (const path of files) {
    const contents = readFileSync(path, "utf8");
    assert.doesNotMatch(contents, /(?:from|require\()[^\n]*(?:f5-review-batch|f5-private-review-bridge|run-f5-private-review-batch)/);
  }
  const ignored = readFileSync(".gitignore", "utf8");
  assert.match(ignored, /^\.f5-drift\/$/m);
  assert.match(ignored, /^\.project-execution-review\/$/m);
  assert.match(ignored, /^\.monitor-editorial\/$/m);
});


test("separate Stibnite originals remain two observations of ONE project, with taxonomy held", () => {
  const burntlog = sources.find(s => s.id === "src-perpetua-stibnite-construction-2026")!;
  const r = build(seq(
    [cap(stibnite, oldBody, 12), cap(burntlog, oldBody, 12)],
    [cap(stibnite, newBody, 13), cap(burntlog, newBody, 13)],
  ));
  assert.equal(r.stats.uniqueReviewCases, 2);
  assert.equal(r.projectGroups.length, 1);
  assert.equal(r.projectGroups[0].projectId, "prj-us-stibnite");
  assert.equal(r.projectGroups[0].sourceIds.length, 2);
  assert.equal(r.projectGroups[0].reviewKeys.length, 2);
  assert.equal(r.projectGroups[0].relatedFinanceIds.length, 2);
  assert.equal(r.projectGroups[0].taxonomyBlocked, true);
  assert.equal(r.publicReleaseAuthorized, false);
});

test("optional M1 ledger remains independently owned and changes invalidate receipt context", () => {
  
  const ledger = emptyPrivateEditorialLedger();
  const obsId = "f".repeat(64);
  ledger.items.push({
    key: "watch-us-exim-news-shadow:" + obsId,
    watchSourceId: "watch-us-exim-news-shadow",
    observationId: obsId, firstObservedAt: "2026-10-12T10:00:00Z",
    lastObservedAt: "2026-10-12T10:00:00Z",
    officialUrl: "https://www.exim.gov/news/synthetic-batch",
    titleAsListed: "Synthetic official listing", publicationDate: null,
    keywordHintOnly: true, exactCitationSourceIds: [neo.id],
    status: "investigating", candidateId: null,
    changes: [{ observedAt: "2026-10-12T10:00:00Z", change: "revised" }], audit: [],
  });
  const original = structuredClone(ledger);
  const one = build(changed(), { privateLedger: ledger });
  assert.equal(one.cases[0].existingEditorialObservations.length, 1);
  assert.deepEqual(ledger, original);
  const changedLedger = structuredClone(ledger);
  changedLedger.items[0].status = "needs_verification";
  const two = build(changed(), { privateLedger: changedLedger });
  assert.notEqual(one.cases[0].bridgeInputDigestSha256, two.cases[0].bridgeInputDigestSha256);
});
