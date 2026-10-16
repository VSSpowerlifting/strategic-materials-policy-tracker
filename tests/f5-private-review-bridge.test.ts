import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources } from "../lib/data";
import { auditF5SourceDrift, type F5SourceCapture } from "../lib/f5-source-drift";
import { buildF5PrivateVersionHandoff } from "../lib/f5-source-version-diff";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { site } from "../lib/site";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import { emptyPrivateEditorialLedger } from "../scripts/editorial-ledger";
import { buildF5PrivateReviewerBridge, renderF5PrivateReviewerBridge } from "../scripts/f5-private-review-bridge";

const source = getAllSources().find(s => s.id === "src-neo-commercial-production-2026")!;
assert.ok(source);
const oldText = "Issuer opening.\n\nSynthetic pilot output statement.\n\nEnd.";
const newText = "Issuer opening.\n\nRevised synthetic statement; original review required.\n\nEnd.";
const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
function capture(body: string, at: string): F5SourceCapture {
  return { sourceId: source.id, url: source.url, health: "ok",
    httpStatus: 200, retrievedAt: at, sha256: sha(body), publicationDate: "2026-09-14" };
}
const prior = capture(oldText, "2026-10-12T10:00:00Z");
const current = capture(newText, "2026-10-13T10:00:00Z");
const audited = (p: F5SourceCapture = prior, c: F5SourceCapture = current) =>
  auditF5SourceDrift([p], [c], getAllSources()).cases[0];
function m3(rows: unknown = structuredClone(queue)) {
  return buildM3ReviewerPackets(rows, {
    projects: getAllProjects(), sources: getAllSources(),
    commitments: getAllFinancialCommitments(), corpusCutoff: site.lastUpdated,
    publicMilestoneCount: getAllProjectMilestones().length,
  });
}
const diff = () => buildF5PrivateVersionHandoff(audited(), oldText, newText);

test("F5 drift/diff integrates exact M3 candidate identity without any approval or publication", () => {
  const r = buildF5PrivateReviewerBridge(audited(), m3(), null, diff());
  assert.equal(r.schemaVersion, "f5-5-private-m3-review-bridge-1");
  assert.equal(r.reviewKey, audited().reviewKey);
  assert.equal(r.candidateEntityLinks.length, 1);
  const link = r.candidateEntityLinks[0];
  assert.equal(link.m3ReviewId, "review-m3-2-neo-narva-magnets");
  assert.equal(link.projectId, "prj-ee-neo-rare-earth-magnet-project");
  assert.deepEqual(link.financeIds, ["fin-eu-jtf-2025-neo-magnet-project"]);
  assert.equal(link.m3ReviewInputDigestSha256,
    m3().worksheets.find(w => w.id === link.m3ReviewId)!.reviewInputDigestSha256);
  assert.equal(link.gate, "unsigned_source_review");
  assert.equal(r.acknowledgment, null);
  assert.equal(r.sourceAccessVerified, false);
  assert.equal(r.m3AdjudicationCompleted, false);
  assert.equal(r.positiveIndustrialEventInferred, false);
  assert.equal(r.publicReleaseAuthorized, false);
  assert.equal(r.automatedPromotionAuthorized, false);
  assert.equal(r.publicSeedMutationAuthorized, false);
  assert.match(renderF5PrivateReviewerBridge(r), /Receipt acknowledgment/);
  assert.deepEqual(getAllProjectMilestones(), []);
});

test("stable review identity and bridge context fingerprint under equivalent capture retries", () => {
  const first = buildF5PrivateReviewerBridge(audited(), m3());
  const retried = audited(prior, { ...current, retrievedAt: "2026-10-14T10:00:00Z" });
  const second = buildF5PrivateReviewerBridge(retried, m3());
  assert.equal(first.reviewKey, second.reviewKey);
  assert.equal(first.bridgeInputDigestSha256, second.bridgeInputDigestSha256);
  assert.deepEqual(first.candidateEntityLinks, second.candidateEntityLinks);
});

test("private receipt acknowledgment is non-authoritative and fails on changed M3 context", () => {
  const base = buildF5PrivateReviewerBridge(audited(), m3());
  const ack = {
    reviewKey: base.reviewKey, bridgeInputDigestSha256: base.bridgeInputDigestSha256,
    acknowledgedBy: "Synthetic test reviewer", acknowledgedAt: "2026-10-14T12:00:00Z",
    note: "Acknowledges receipt only; independent source adjudication still pending.",
  };
  const r = buildF5PrivateReviewerBridge(audited(), m3(), null, null, ack);
  assert.equal(r.acknowledgment?.meaning, "receipt_seen_only_not_original_source_review");
  assert.equal(r.m3AdjudicationCompleted, false);
  assert.match(renderF5PrivateReviewerBridge(r), /Synthetic test reviewer/);
  assert.throws(() => buildF5PrivateReviewerBridge(audited(), m3(), null, null, {
    ...ack, bridgeInputDigestSha256: "0".repeat(64),
  }), /stale/);
  assert.throws(() => buildF5PrivateReviewerBridge(audited(), m3(), null, null, {
    ...ack, acknowledgedAt: "2026-10-11T00:00:00Z",
  }), /stale/);
  assert.throws(() => buildF5PrivateReviewerBridge(audited(), m3(), null, null, {
    ...ack, verdict: "approved",
  }), /stale/);
  const rows = structuredClone(queue);
  rows.find(x => x.id === "review-m3-2-neo-narva-magnets")!.editorialCaution += " Synthetic amendment.";
  const changed = m3(rows);
  assert.notEqual(base.bridgeInputDigestSha256,
    buildF5PrivateReviewerBridge(audited(), changed).bridgeInputDigestSha256);
  assert.throws(() => buildF5PrivateReviewerBridge(audited(), changed, null, null, ack), /stale/);
});

test("exact source-ID private M1 ledger links do not mutate original editorial authority", () => {
  const ledger = emptyPrivateEditorialLedger();
  const obs = "b".repeat(64);
  ledger.items.push({
    key: "watch-us-exim-news-shadow:" + obs,
    watchSourceId: "watch-us-exim-news-shadow", observationId: obs,
    firstObservedAt: "2026-10-13T10:00:00Z", lastObservedAt: "2026-10-13T10:00:00Z",
    officialUrl: "https://www.exim.gov/news/synthetic-original",
    titleAsListed: "Synthetic private observation", publicationDate: null,
    keywordHintOnly: true, exactCitationSourceIds: [source.id],
    status: "investigating", candidateId: null,
    changes: [{ observedAt: "2026-10-13T10:00:00Z", change: "revised" }], audit: [],
  });
  const original = structuredClone(ledger);
  const r = buildF5PrivateReviewerBridge(audited(), m3(), ledger);
  assert.equal(r.existingEditorialObservations.length, 1);
  assert.equal(r.existingEditorialObservations[0].status, "investigating");
  assert.deepEqual(ledger, original);
  const unrelated = structuredClone(ledger);
  unrelated.items[0].exactCitationSourceIds = ["src-unrelated"];
  assert.equal(buildF5PrivateReviewerBridge(audited(), m3(), unrelated)
    .existingEditorialObservations.length, 0);
  assert.throws(() => buildF5PrivateReviewerBridge(audited(), m3(), { version: 1, items: [] }),
    /ledger|corrupt/);
});

test("taxonomy hold remains blocked; unmatched source and 404 never infer an industrial event", () => {
  const held = getAllSources().find(s => s.id === "src-perpetua-stibnite-early-works-2025")!;
  const p = { ...prior, sourceId: held.id, url: held.url };
  const c = { ...current, sourceId: held.id, url: held.url };
  const r = buildF5PrivateReviewerBridge(audited(p, c), m3());
  assert.equal(r.candidateEntityLinks.length, 1);
  assert.equal(r.candidateEntityLinks[0].gate, "taxonomy_blocked");
  const absent = getAllSources().find(s =>
    s.url.startsWith("https://") && !m3().worksheets.some(w => w.originalSource.id === s.id))!;
  assert.ok(absent);
  const noM3 = audited({ ...p, sourceId: absent.id, url: absent.url },
    { ...c, sourceId: absent.id, url: absent.url });
  assert.deepEqual(buildF5PrivateReviewerBridge(noM3, m3()).candidateEntityLinks, []);
  const outage: F5SourceCapture = { ...current, health: "not_found", httpStatus: 404,
    sha256: null, publicationDate: null };
  const offline = buildF5PrivateReviewerBridge(audited(prior, outage), m3());
  assert.equal(offline.driftDisposition, "source_unavailable");
  assert.equal(offline.versionComparison, null);
  assert.equal(offline.positiveIndustrialEventInferred, false);
  assert.throws(() => buildF5PrivateReviewerBridge(audited(prior, outage), m3(), null, diff()),
    /diff does not match/);
  assert.throws(() => buildF5PrivateReviewerBridge({ ...audited(), reviewKey: null }, m3()), /audited/);
});

test("synthetic end-to-end offline CLI is deterministic and cannot write/publicly publish", () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-f5-private-bridge-"));
  try {
    const paths = ["prior.json", "current.json", "prior.txt", "current.txt"].map(n => join(dir, n));
    writeFileSync(paths[0], JSON.stringify([prior]));
    writeFileSync(paths[1], JSON.stringify([current]));
    writeFileSync(paths[2], oldText);
    writeFileSync(paths[3], newText);
    const args = ["--import", "tsx", "scripts/print-f5-private-review-bridge.ts",
      "--before", paths[0], "--after", paths[1], "--source-id", source.id,
      "--before-body", paths[2], "--after-body", paths[3], "--json"];
    const a = execFileSync(process.execPath, args, { encoding: "utf8" });
    const b = execFileSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(a, b);
    const result = JSON.parse(a);
    assert.equal(result.publicReleaseAuthorized, false);
    assert.equal(result.versionComparison.reviewKey, audited().reviewKey);
    assert.equal(result.candidateEntityLinks.length, 1);
    assert.equal(readFileSync(paths[2], "utf8"), oldText);
    assert.deepEqual(readdirSync(dir).sort(), ["current.json", "current.txt", "prior.json", "prior.txt"]);
    assert.deepEqual(getAllProjectMilestones(), []);
    for (const flag of ["--publish", "--approve"]) {
      const run = spawnSync(process.execPath, [...args, flag], { encoding: "utf8" });
      assert.equal(run.status, 2);
      assert.match(run.stderr, /Usage:/);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
