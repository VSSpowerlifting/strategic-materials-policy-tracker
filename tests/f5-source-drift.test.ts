import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  auditF5SourceDrift, formatF5DriftReceipt, type F5SourceCapture,
} from "@/lib/f5-source-drift";
import { getAllSources, getAllProjectMilestones } from "@/lib/data";

const registered = getAllSources();
const source = registered.find(s => s.id === "src-neo-commercial-production-2026")!;
assert.ok(source, "real source registry must contain the pilot Neo record");

function observed(overrides: Partial<F5SourceCapture> = {}): F5SourceCapture {
  return {
    sourceId: source.id,
    url: source.url,
    retrievedAt: "2026-10-12T10:00:00Z",
    health: "ok",
    httpStatus: 200,
    sha256: "a".repeat(64),
    publicationDate: "2026-09-14",
    ...overrides,
  };
}
function later(overrides: Partial<F5SourceCapture> = {}): F5SourceCapture {
  return observed({ retrievedAt: "2026-10-13T10:00:00Z", ...overrides });
}
const audit = (before: unknown, after: unknown) => auditF5SourceDrift(before, after, registered);
const sole = (before: unknown, after: unknown) => audit(before, after).cases[0];

test("F5-5 absent prior state is baseline only; never a newly occurred industrial event", () => {
  const result = audit([], [later()]);
  assert.equal(result.schemaVersion, "f5-5-offline-source-drift-1");
  assert.equal(result.mode, "private_prepublication_review_only");
  assert.equal(result.baselineCount, 1);
  assert.equal(result.candidateCount, 0);
  assert.equal(result.cases[0].disposition, "baseline_only");
  assert.equal(result.cases[0].reviewKey, null);
  assert.equal(result.publicReleaseAuthorized, false);
  assert.equal(result.automatedSourceOrMilestonePromotionAuthorized, false);
  assert.equal(getAllProjectMilestones().length, 0);
});

test("F5-5 original bytes and metadata unchanged: no review candidate or re-approval", () => {
  const original = observed();
  const incoming = later();
  const data = structuredClone([original, incoming]);
  const r = audit([original], [incoming]);
  assert.equal(r.candidateCount, 0);
  assert.equal(r.unchangedCount, 1);
  assert.equal(r.cases[0].reviewStatus, "not_applicable");
  assert.equal(r.cases[0].positiveEventInferred, false);
  assert.equal(JSON.stringify([original, incoming]), JSON.stringify(data), "read only");
});

test("F5-5 different original bytes: one unresolved review, NOT an inferred grant amendment or production start", () => {
  const changed = later({ sha256: "b".repeat(64) });
  const r = audit([observed()], [changed]);
  assert.equal(r.candidateCount, 1);
  assert.equal(r.cases[0].disposition, "content_or_metadata_revised");
  assert.deepEqual(r.cases[0].reasons, ["content_digest_changed"]);
  assert.equal(r.cases[0].reviewStatus, "unreviewed");
  assert.equal(r.cases[0].needsHumanSourceAccess, true);
  assert.equal(r.cases[0].publicSeedChangeAuthorized, false);
  assert.equal(r.cases[0].positiveEventInferred, false);
  assert.ok(r.cases[0].reviewKey?.match(/^[a-f0-9]{64}$/));
  assert.ok(!("fundingAmount" in r.cases[0]));
  assert.ok(!("commissioningDate" in r.cases[0]));
});

test("F5-5 correction of source publication date is separate from event occurrence clock", () => {
  const revised = later({ publicationDate: "2026-09-15" });
  const r = sole([observed()], [revised]);
  assert.deepEqual(r.reasons, ["publication_date_changed"]);
  assert.equal(r.previous?.publicationDate, "2026-09-14");
  assert.equal(r.current?.publicationDate, "2026-09-15");
  assert.equal(r.current?.retrievedAt, "2026-10-13T10:00:00Z");
  assert.equal(r.positiveEventInferred, false);
});

test("F5-5 combined checksum and date corrections create ONE reviewer ticket", () => {
  const r = audit([observed()], [later({
    sha256: "f".repeat(64), publicationDate: "2026-09-15",
  })]);
  assert.equal(r.candidateCount, 1);
  assert.deepEqual(r.cases[0].reasons, ["content_digest_changed", "publication_date_changed"]);
});

test("F5-5 explicit 404/410 and outage produce access-only dispositions", () => {
  const gone = later({ health: "not_found", httpStatus: 404, sha256: null, publicationDate: null });
  const timeout = later({ health: "timeout", httpStatus: null, sha256: null, publicationDate: null });
  const absent = sole([observed()], [gone]);
  const degraded = sole([observed()], [timeout]);
  assert.equal(absent.disposition, "source_unavailable");
  assert.deepEqual(absent.reasons, ["source_not_found"]);
  assert.equal(degraded.disposition, "retrieval_degraded");
  assert.deepEqual(degraded.reasons, ["retrieval_failed"]);
  assert.ok(absent.needsHumanSourceAccess && degraded.needsHumanSourceAccess);
  assert.equal(absent.positiveEventInferred, false);
  assert.equal(degraded.positiveEventInferred, false);
  assert.equal(absent.current?.sha256, null);
});

test("F5-5 not scanning a source does not invent a 404 or advance continuity", () => {
  const r = audit([observed()], []);
  assert.equal(r.notScannedCount, 1);
  assert.equal(r.candidateCount, 0);
  assert.equal(r.cases[0].disposition, "not_scanned");
  assert.equal(r.cases[0].current, null);
  assert.deepEqual(r.cases[0].reasons, []);
});

test("F5-5 restored missing source is not a new signed agreement", () => {
  const gone = observed({ health: "not_found", httpStatus: 410, sha256: null, publicationDate: null });
  const restored = sole([gone], [later()]);
  assert.equal(restored.disposition, "source_restored");
  assert.deepEqual(restored.reasons, ["source_restored"]);
  assert.equal(restored.positiveEventInferred, false);
  const blocked = observed({ health: "blocked", httpStatus: 429, sha256: null, publicationDate: null });
  assert.equal(sole([blocked], [later()]).disposition, "retrieval_recovered");
});

test("F5-5 retry keys do not depend on retrieval clock and deterministic ordering is stable", () => {
  const s2 = registered.find(s => s.id !== source.id && s.url.startsWith("https://"))!;
  const previous: F5SourceCapture = { ...observed(), sourceId: s2.id, url: s2.url };
  const current = { ...previous, retrievedAt: "2026-10-13T10:00:00Z", sha256: "c".repeat(64) };
  const before = [observed(), previous];
  const after = [later({ sha256: "b".repeat(64) }), current];
  const a = audit(before, after);
  const b = audit([...before].reverse(), [...after].reverse());
  assert.deepEqual(a, b);
  assert.deepEqual(a.cases.map(c => c.sourceId), [source.id, s2.id].sort());
  const retry = sole([observed()], [later({
    retrievedAt: "2026-10-14T10:00:00Z", sha256: "b".repeat(64),
  })]);
  assert.equal(a.cases.find(c => c.sourceId === source.id)?.reviewKey, retry.reviewKey);
  assert.equal(formatF5DriftReceipt(a), formatF5DriftReceipt(b));
});

test("F5-5 source mismatches and repeated identity fail closed", () => {
  assert.throws(() => audit([observed()], [later({ url: "https://example.com/not-original" })]),
    /exactly match registered HTTPS/);
  assert.throws(() => audit([observed(), observed()], [later()]), /duplicate prior source ID/);
  assert.throws(() => audit([], [later({ sourceId: "src-fake" })]), /unknown source identity/);
  assert.throws(() => audit([], [later({ sourceId: "__proto__" })]), /unknown source identity/);
});

test("F5-5 failed access has no digest; corrupt hashes/statuses/dates are rejected", () => {
  const bad = [
    later({ sha256: "xyz" }),
    later({ health: "not_found", httpStatus: 404 }),
    later({ health: "ok", httpStatus: 404 }),
    later({ health: "blocked", httpStatus: 200, sha256: null, publicationDate: null }),
    later({ publicationDate: "2026-02-30" }),
    later({ publicationDate: "2027-01-01" }),
    later({ retrievedAt: "2026-10-99T10:00:00Z" }),
    later({ retrievedAt: "2026-10-13T10:00:00-04:00" }),
  ];
  for (const observation of bad) assert.throws(() => audit([], [observation]));
});

test("F5-5 cannot treat stale observations or conflicting same-time captures as a revision", () => {
  assert.throws(() => audit([later()], [observed()]), /stale out-of-order/);
  assert.throws(() => audit([observed()], [observed({ sha256: "b".repeat(64) })]),
    /conflicting captures at same retrieval clock/);
  assert.equal(sole([observed()], [observed()]).disposition, "unchanged");
});

test("F5-5 CLI consumes synthetic offline files with identical deterministic JSON; no published writes", () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-f5-drift-"));
  try {
    const before = join(dir, "before.json"), after = join(dir, "after.json");
    writeFileSync(before, JSON.stringify([observed()]));
    writeFileSync(after, JSON.stringify([later({ sha256: "b".repeat(64) })]));
    const command = [process.execPath, "--import", "tsx", "scripts/audit-f5-source-drift.ts",
      "--before", before, "--after", after, "--json"];
    const first = execFileSync(command[0], command.slice(1), { encoding: "utf8" });
    const second = execFileSync(command[0], command.slice(1), { encoding: "utf8" });
    assert.equal(first, second);
    assert.equal(JSON.parse(first).candidateCount, 1);
    assert.equal(JSON.parse(first).publicReleaseAuthorized, false);
    assert.equal(readFileSync(before, "utf8"), JSON.stringify([observed()]));
    assert.deepEqual(getAllProjectMilestones(), []);
    assert.throws(() => execFileSync(command[0], [...command.slice(1), "--publish"],
      { encoding: "utf8", stdio: "pipe" }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
