import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildControlsFeed } from "../lib/controls-feed";
import { buildFeedRelease, loadFeedRelease, loadReviewOverlay, writeFeedDir } from "../lib/controls-feed-io";
import { readControlsArchive, snapshotFromRows, type ControlsSnapshotRows } from "../lib/controls-release-archive";
import { periodCounts, qualifyingMeasures, standing, vintageReport } from "../lib/controls-standing";

const overlayPath = "research/controls-review/rc-cn-mofcom-59-2026.json";
const graphite = "ctl-cn-us-2024-graphite-end-use-review";
const worldwide = "ctl-cn-graphite-2023-export-licensing";
const replacement = "ctl-cn-list-2024-graphite-licensing";
const military = "ctl-cn-us-2024-military-end-use-ban";
const denial = "ctl-cn-us-2024-gallium-germanium-antimony-denial";
const rareEarth = "ctl-cn-ree-2025-10-advanced-chip-ai-review";
const successor = "src-mofcom-2026-59";
const cutoff = "2026-11-12";

function workspace(t: { after: (fn: () => void) => void }) {
  const dir = mkdtempSync(join(tmpdir(), "controls-consumer-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const run = (...args: string[]) => spawnSync("python3", [
    "docs/engineering/controls-feed/consumer.py", ...args, "--db", join(dir, "feed.db"),
  ], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  function request(...args: string[]) {
    const result = run(...args);
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  return { dir, run, request };
}

test("SQLite independently reproduces the pilot, notices, denominators and inclusive dates across a release upgrade", (t) => {
  const { dir, request, run } = workspace(t);
  const baseDir = join(dir, "base");
  const nextDir = join(dir, "candidate");
  const base = buildFeedRelease({ curatedOn: "2026-11-27" });
  writeFeedDir(baseDir, base.files);
  const next = buildFeedRelease({ curatedOn: "2026-11-27", overlayPath, previousDir: baseDir });
  writeFeedDir(nextDir, next.files);
  const { view } = loadFeedRelease(nextDir);
  const old = base.manifest.releaseId;
  const current = next.manifest.releaseId;
  assert.equal(old, "stratellar-controls-feed-p1-2026-11-12-2152ceb9a74aba3e3143a637f4a4d67faf9c1d47812be4bd84ec0aa66824a5e4");
  assert.equal(current, "stratellar-controls-feed-p1-2026-11-12-rc-cn-mofcom-59-2026-2e3940626b48c740ae533fd022ab2d694b65ba62c0e44ee7573a030f44172999");
  const getStanding = (release: string, measure: string, day: string, vintage: string, pending = true) =>
    request("standing", "--release", release, "--measure", measure, "--on", day, "--vintage", vintage, ...(pending ? ["--include-pending"] : []));
  const load = request("load", baseDir);
  assert.equal(load.outcome, "loaded");
  assert.equal(load.rowsWritten, 383);
  const repeated = request("load", baseDir);
  assert.equal(repeated.outcome, "already_loaded");
  assert.equal(repeated.rowsWritten, 0);
  const before = getStanding(old, graphite, "2026-11-28", "2026-11-25");
  assert.equal(before.state, "unresolved");
  const nextLoad = request("load", nextDir);
  assert.equal(nextLoad.rows["measures.json"], 54);
  assert.equal(nextLoad.outcome, "loaded");
  assert.deepEqual(getStanding(old, graphite, "2026-11-28", "2026-11-25"), before);
  const difference = request("diff", "--from", old, "--to", current);
  assert.equal(difference.publisherChanges.agrees, true);
  assert.deepEqual(difference.summary["status-entries.json"], { added: 5, removed: 0, changed: 0 });
  const continuationCitations = difference.citations.filter((row: { source: { sourceId: string } }) => row.source.sourceId === successor);
  assert.equal(continuationCitations.length, 2);
  for (const citation of continuationCitations) {
    assert.equal(citation.source.sourceId, successor);
    assert.equal(citation.source.datePublished, "2026-11-24");
    assert.match(citation.source.url, /^https:\/\/www\.mofcom\.gov\.cn\//);
    assert.equal(citation.evidence[0].locator, "Operative sentence");
  }

  // Both independent implementations must label projections even with a vintage later than the cutoff.
  for (const [measure, day, vintage, expectedState, lastStatus, sourceId] of [
    [graphite, "2025-11-08", "release", "in_force", "in_force", "src-mofcom-46"],
    [graphite, "2025-11-09", "release", "suspended", "suspended", "src-mofcom-72"],
    [graphite, "2026-11-27", "2026-11-25", "projected", "suspended", "src-mofcom-72"],
    [graphite, "2026-11-28", "2026-11-23", "unresolved", "suspended", "src-mofcom-72"],
    [graphite, "2026-11-28", "2026-11-25", "projected", "suspended", successor],
    [denial, "2027-01-27", "2027-02-01", "projected", "suspended", successor],
    [denial, "2027-01-28", "2027-02-01", "unresolved", "suspended", successor],
    [military, cutoff, "release", "in_force", "in_force", "src-mofcom-46"],
    [military, "2027-01-28", "2027-02-01", "projected", "in_force", "src-mofcom-46"],
    [rareEarth, "2025-11-06", "release", "unresolved", "not_stated", "src-mofcom-61"],
    [rareEarth, "2027-01-10", "2026-11-25", "projected", "suspended", "src-mofcom-2026-58"],
    [rareEarth, "2027-01-11", "2026-11-25", "unresolved", "suspended", "src-mofcom-2026-58"],
  ]) {
    const local = standing(view, measure, day, { vintage, includePending: true });
    const consumer = getStanding(current, measure, day, vintage);
    for (const [key, value] of Object.entries(local)) assert.deepEqual(consumer[key], value, key);
    assert.deepEqual([local.state, local.lastStatedStatus, local.sourceId], [expectedState, lastStatus, sourceId]);
  }
  assert.equal(getStanding(current, graphite, "2026-11-28", "2026-11-25", false).state, "unresolved");
  const packageRows = view.datasets["status-entries.json"].filter(row => row.sourceId === "src-mofcom-2026-58" && row.status === "suspended");
  assert.equal(packageRows.length, 25);
  const packageIds = new Set(packageRows.map(row => row.measureId));
  assert.equal(new Set(view.datasets["measures.json"].filter(row => packageIds.has(row.measureId)).map(row => row.instrumentId)).size, 6);
  const checks = packageRows.flatMap(row => ["2027-01-10", "2027-01-11"].map(on => ({
    command: "standing", release: current, measure: row.measureId, on, vintage: "2026-11-25",
  })));
  const requestsFile = join(dir, "separate-package-checks.json");
  writeFileSync(requestsFile, JSON.stringify(checks));
  const batch = request("batch", "--requests", requestsFile);
  assert.equal(batch.failed, 0);
  for (const { result } of batch.results) {
    assert.equal(result.state, result.onDate === "2027-01-10" ? "projected" : "unresolved");
    assert.equal(result.lastStatedStatus, "suspended");
    assert.equal(result.sourceId, "src-mofcom-2026-58");
  }
  const undated = view.datasets["status-entries.json"].filter(row => row.sourceId === "src-mofcom-61" && row.effectiveFrom === null);
  assert.equal(undated.length, 3);
  for (const entry of undated) assert.equal(standing(view, entry.measureId, "2025-11-06", { vintage: "release" }).basis, "undated_only");
  const vintageRow = vintageReport(view, { vintage: "2026-11-25", includePending: true }).find(row => row.measureId === graphite)!;
  assert.deepEqual(vintageRow.scheduled.map(entry => [entry.effectiveFrom, entry.sourceId, entry.knownFrom]), [
    ["2026-11-28", successor, "2026-11-24"],
  ]);
  for (const [day, expected] of [["2025-11-08", [worldwide, graphite]], ["2025-11-09", [worldwide]]] as const) {
    const query = { material: "graphite", destination: "US", onDate: day, vintage: day, issuer: "china", includePending: true };
    const local = qualifyingMeasures(view, query);
    const independent = request("query", "--release", current, "--material", "graphite", "--destination", "US", "--on", day, "--vintage", day, "--issuer", "china", "--include-pending");
    const corrected = expected.map(id => id === worldwide ? replacement : id).sort();
    assert.deepEqual(independent.inForceCoded.sort(), corrected);
    assert.deepEqual(local.inForceCoded.sort(), corrected);
    const published = request("query", "--release", old, "--material", "graphite", "--destination", "US", "--on", day, "--vintage", day, "--issuer", "china");
    assert.deepEqual(published.inForceCoded, expected);
    const withoutPending = qualifyingMeasures(view, { ...query, includePending: false });
    assert.deepEqual(withoutPending.inForceCoded, expected);
    assert.ok(!withoutPending.matches.some(row => row.measureId === replacement));
    assert.equal(local.matches.find(row => row.measureId === replacement)?.reviewState, "pending_human_adjudication");
    assert.equal(local.matches.find(row => row.measureId === worldwide)?.standing.state, "revoked");
    assert.equal(local.matches.find(row => row.measureId === military)?.match, "material_scope_requires_review");
    assert.equal(local.matches.find(row => row.measureId === graphite)?.target, "named");
    const global = local.matches.find(row => row.measureId === worldwide)!;
    assert.equal(global.target, "worldwide");
    assert.ok(global.productScope.referenceCodes.length > 0);
    assert.ok(global.productScope.wordingSourceIds.length > 0);
    assert.ok(!JSON.stringify(independent.matches.find((row: { measureId: string }) => row.measureId === graphite).citations).includes(successor));
    assert.ok(!local.matches.find(row => row.measureId === graphite)?.citations.some(row => row.sourceId === successor));
  }
  for (const [start, end, clauseCount, instrumentCount] of [
    ["2025-01-01", cutoff, 8, 4], ["2026-11-24", "2026-11-28", 0, 0],
  ] as const) {
    const independent = request("counts", "--release", current, "--start", start, "--end", end, "--include-pending");
    const local = periodCounts(view, start, end, { vintage: "release", includePending: true });
    for (const [key, value] of Object.entries(local)) assert.deepEqual(independent[key], value, key);
    assert.equal(local.introducedClauses.length, clauseCount);
    assert.equal(local.introducedInstruments.length, instrumentCount);
    if (end > cutoff) {
      assert.equal(local.inForceClausesAtEnd.length, 0);
      assert.ok(local.projectedInForceClausesAtEnd.includes(military));
    }
  }
  const uncovered = qualifyingMeasures(view, { material: "synthetic-material", destination: "US", issuer: "synthetic-issuer", onDate: cutoff, vintage: "release" });
  assert.equal(uncovered.issuerCovered, false);
  assert.equal(uncovered.materialTracked, false);
  assert.equal(run("standing", "--release", current, "--measure", graphite, "--on", "2026-02-31").status, 1);
  const path = join(nextDir, "measures.json");
  const bytes = readFileSync(path);
  writeFileSync(path, Buffer.concat([bytes, Buffer.from(" ")]));
  assert.match(run("load", nextDir).stderr, /sha256/);
  writeFileSync(path, bytes);
  unlinkSync(join(nextDir, "changes.json"));
  assert.match(run("load", nextDir).stderr, /changes.json.*missing/);
  assert.equal(request("releases").releases.length, 2);
});

test("a backfill preserves existing keys; corrections, deletions and a supersession survive repeat imports", (t) => {
  const { dir, request } = workspace(t);
  const archive = readControlsArchive(cutoff);
  const sourceId = "src-synthetic-notice";
  const first = "evt-synthetic-first";
  const second = "evt-synthetic-second";
  const clauseId = "ctl-synthetic-test";
  const event = { ...archive.rows.events[0], id: first, documentNumber: null,
    documentLabel: "Synthetic notice", titleOriginal: "Synthetic notice", titleOriginalLang: "en",
    issuingBody: "Synthetic issuer", sourceIds: [sourceId], supersededByEventId: null };
  const clause = { ...archive.rows.clauses.find(row => row.id === graphite), id: clauseId, eventId: first,
    legalBasisEventIds: [], evidence: [{ sourceId, supports: ["status"], evidence: "explicit", locator: null, note: null }] };
  const entry = { measureId: clauseId, sequence: 0, status: "in_force", date: "2025-01-01", sourceId, until: null, note: null };
  const rows: ControlsSnapshotRows = {
    sources: [{ ...archive.rows.sources[0], id: sourceId, title: "Synthetic notice", url: "https://example.org/notice", publisher: "Synthetic issuer" }],
    events: [event, { ...event, id: second }], clauses: [clause], statusHistory: [entry],
  };
  function build(name: string, previous?: ReturnType<typeof buildControlsFeed>) {
    const snapshot = snapshotFromRows(rows, { schemaVersion: 1, asOf: cutoff, sourceDatasetVersion: "synthetic-fixture" });
    const bundle = buildControlsFeed({ snapshot, curatedOn: cutoff, previous });
    const path = join(dir, name);
    writeFeedDir(path, bundle.files);
    assert.equal(request("load", path).outcome, "loaded");
    assert.equal(request("load", path).rowsWritten, 0);
    return bundle;
  }
  const original = build("original");
  const originalKey = original.datasets["status-entries.json"][0].entryId;
  rows.statusHistory[0].sequence = 1;
  rows.statusHistory.unshift({ ...entry, sequence: 0, date: "2024-09-01", status: "scheduled", until: "2025-01-01" });
  const backfill = build("backfill", original);
  const compare = (a: typeof original, b: typeof original) => request("diff", "--from", a.manifest.releaseId, "--to", b.manifest.releaseId);
  assert.deepEqual(compare(original, backfill).summary["status-entries.json"], { added: 1, removed: 0, changed: 0 });
  assert.ok(backfill.datasets["status-entries.json"].some(row => row.entryId === originalKey));
  rows.statusHistory.shift();
  rows.statusHistory[0].sequence = 0;
  rows.statusHistory[0].status = "suspended";
  rows.events[0].supersededByEventId = second;
  const corrected = build("corrected", backfill);
  const diff = compare(backfill, corrected);
  assert.equal(diff.publisherChanges.agrees, true);
  assert.deepEqual(diff.summary["status-entries.json"], { added: 0, removed: 1, changed: 1 });
  assert.equal(diff.datasets["status-entries.json"].changed[0].key, originalKey);
  assert.equal(diff.datasets["instruments.json"].changed[0].fields[0].after, second);
  const stored = (release: string) => request("standing", "--release", release, "--measure", clauseId, "--on", "2025-02-01").state;
  assert.equal(stored(original.manifest.releaseId), "in_force");
  assert.equal(stored(corrected.manifest.releaseId), "suspended");
});

test("correction overlays require the archived release for a published-only answer", (t) => {
  const { dir, run, request } = workspace(t);
  const overlay = loadReviewOverlay(overlayPath);
  overlay.operations.push({ op: "correct_status", measureId: graphite, match: { date: "2024-12-03", sourceId: "src-mofcom-46" },
    set: { status: "suspended" }, reason: "Synthetic correction to exercise review isolation." });
  const path = join(dir, "test-overlay.json");
  writeFileSync(path, JSON.stringify(overlay));
  const bundle = buildFeedRelease({ curatedOn: "2026-11-27", overlayPath: path });
  const releaseDir = join(dir, "candidate");
  writeFeedDir(releaseDir, bundle.files);
  request("load", releaseDir);
  const { view } = loadFeedRelease(releaseDir);
  assert.throws(() => standing(view, graphite, "2025-01-01", { vintage: "release" }), /baseline/);
  assert.match(run("standing", "--release", "latest", "--measure", graphite, "--on", "2025-01-01").stderr, /baseline/);
});
