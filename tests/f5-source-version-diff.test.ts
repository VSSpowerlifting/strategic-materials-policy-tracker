import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getAllSources, getAllProjectMilestones } from "@/lib/data";
import { auditF5SourceDrift, type F5SourceCapture } from "@/lib/f5-source-drift";
import { buildF5PrivateVersionHandoff, formatF5PrivateVersionHandoff } from "@/lib/f5-source-version-diff";

const source = getAllSources().find(s => s.id === "src-neo-commercial-production-2026")!;
assert.ok(source);
const oldText = "Opening paragraph.\n\nAward proposed, not executed.\n\nClosing paragraph.";
const newText = "Opening paragraph.\n\nAward revised; verify original amendment.\n\nClosing paragraph.";
const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
function capture(body: string, at: string, publicationDate = "2026-09-14"): F5SourceCapture {
  return { sourceId: source.id, url: source.url, retrievedAt: at, health: "ok",
    httpStatus: 200, sha256: sha(body), publicationDate };
}
const prior = capture(oldText, "2026-10-12T10:00:00Z");
const current = capture(newText, "2026-10-13T10:00:00Z");
function candidate(a: F5SourceCapture = prior, b: F5SourceCapture = current) {
  return auditF5SourceDrift([a], [b], [source]).cases[0];
}

test("F5-5 private handoff anchors exact bytes, review key and readable context", () => {
  const r = buildF5PrivateVersionHandoff(candidate(), oldText, newText);
  assert.equal(r.schemaVersion, "f5-5-private-version-handoff-1");
  assert.equal(r.reviewKey, candidate().reviewKey);
  assert.deepEqual(r.rows.map(x => x.kind), ["context", "changed", "context"]);
  assert.match(formatF5PrivateVersionHandoff(r), /Award revised/);
  assert.equal(r.sourceAccessVerified, false);
  assert.equal(r.reviewVerdict, "unreviewed");
  assert.equal(r.publicReleaseAuthorized, false);
  assert.equal(r.automatedPromotionAuthorized, false);
  assert.equal(r.entityLinksAdjudicated, false);
  assert.equal(getAllProjectMilestones().length,1);
});

test("F5-5 refuses altered body, wrong source, outage and absent review key", () => {
  assert.throws(() => buildF5PrivateVersionHandoff(candidate(), oldText + "!", newText), /hash/);
  assert.throws(() => buildF5PrivateVersionHandoff(candidate(), oldText, "fabricated"), /hash/);
  const outage = { ...current, health: "not_found" as const, httpStatus: 404,
    sha256: null, publicationDate: null };
  assert.throws(() => buildF5PrivateVersionHandoff(candidate(prior, outage), oldText, newText), /audited/);
  assert.throws(() => buildF5PrivateVersionHandoff({ ...candidate(), reviewKey: null }, oldText, newText), /audited/);
});

test("F5-5 publication metadata-only and raw-whitespace changes remain unreviewed", () => {
  const meta = capture(oldText, "2026-10-13T10:00:00Z", "2026-09-15");
  const r = buildF5PrivateVersionHandoff(candidate(prior, meta), oldText, oldText);
  assert.deepEqual(r.rows, []);
  assert.deepEqual(r.reasons, ["publication_date_changed"]);
  const spaces = oldText + "\n";
  const raw = buildF5PrivateVersionHandoff(candidate(prior, capture(spaces, "2026-10-13T10:00:00Z")), oldText, spaces);
  assert.equal(raw.rawOnlyChange, true);
});

test("F5-5 rejects excessive source text and excessive changed paragraphs", () => {
  const huge = "x".repeat(130000);
  assert.throws(() => buildF5PrivateVersionHandoff(candidate(prior, capture(huge, "2026-10-13T10:00:00Z")), oldText, huge), /oversized/);
  const many = Array.from({ length: 90 }, (_, i) => "Paragraph " + i).join("\n\n");
  assert.throws(() => buildF5PrivateVersionHandoff(candidate(prior, capture(many, "2026-10-13T10:00:00Z")), oldText, many), /too many/);
});

test("F5-5 local CLI is deterministic and never writes a review or published milestone", () => {
  const dir = mkdtempSync(join(tmpdir(), "f5-version-"));
  try {
    const files = ["before.json", "after.json", "before.txt", "after.txt"].map(x => join(dir, x));
    writeFileSync(files[0], JSON.stringify([prior]));
    writeFileSync(files[1], JSON.stringify([current]));
    writeFileSync(files[2], oldText);
    writeFileSync(files[3], newText);
    const args = ["--import", "tsx", "scripts/compare-f5-source-versions.ts",
      "--before", files[0], "--after", files[1], "--source-id", source.id,
      "--before-body", files[2], "--after-body", files[3], "--json"];
    const a = execFileSync(process.execPath, args, { encoding: "utf8" });
    const b = execFileSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(a, b);
    assert.equal(JSON.parse(a).reviewVerdict, "unreviewed");
    assert.equal(readFileSync(files[2], "utf8"), oldText);
    assert.equal(getAllProjectMilestones().length,1);
    assert.throws(() => execFileSync(process.execPath, [...args, "--publish"], { stdio: "pipe" }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
