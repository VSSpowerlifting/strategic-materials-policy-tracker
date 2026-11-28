import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { GET } from "../app/controls/changes/[caseId]/brief/route";
import { controlBriefCases } from "../lib/control-brief-cases";
import { buildControlBrief, changeSummary, renderControlBrief } from "../lib/control-briefs";
import { PUBLISHED_CONTROLS_RELEASES } from "../lib/controls-release-archive";

const [superhard, rareEarth] = controlBriefCases;

test("No. 55 stays suspended as its supporting notice and stated window change", () => {
  const brief = buildControlBrief(superhard);
  assert.ok(brief.valid);
  assert.equal(brief.rows.length, 7);
  assert.deepEqual([brief.statusChanges, brief.sourceChanges], [0, 7]);
  assert.equal(brief.summary.length, 1);
  assert.deepEqual(brief.summary.map(({ before, after }) => [before.state, after.state]), [["suspended", "suspended"]]);
  for (const row of brief.rows) {
    assert.equal(row.before.sourceId, "src-mofcom-70");
    assert.equal(row.after.sourceId, "src-mofcom-2026-58");
    assert.equal(brief.entries.get(row.before.entryId!)?.effectiveThrough, "2026-11-10");
    assert.equal(brief.entries.get(row.after.entryId!)?.effectiveThrough, "2027-01-10");
  }
  assert.match(changeSummary(brief), /same recorded standing.*notice changed for 7 clauses/);
});

test("publication and effective dates remain distinct in the November 2026 replay", () => {
  const brief = buildControlBrief(superhard, { from: "2026-11-08", to: "2026-11-09" });
  assert.ok(brief.valid);
  assert.equal(brief.sources.get("src-mofcom-2026-58")?.datePublished, "2026-11-09");
  assert.equal(brief.summary[0].after.sourceId, "src-mofcom-70");
  const opening = buildControlBrief(superhard, { from: "2025-11-06", to: "2025-11-07" });
  assert.ok(opening.valid);
  assert.deepEqual(opening.summary.map(({ before, after }) => [before.state, after.state]), [["scheduled", "suspended"]]);
  assert.equal(opening.entries.get(opening.summary[0].before.entryId!)?.takesEffectOn, "2025-11-08");
});

test("No. 61 distinguishes three unresolved starts from the scheduled and operative provisions", () => {
  const brief = buildControlBrief(rareEarth);
  assert.ok(brief.valid);
  assert.equal(brief.rows.length, 6);
  assert.deepEqual(brief.summary.map(({ before, after, count }) => [before.basis, before.state, after.state, count]), [
    ["undated_only", "unresolved", "suspended", 3],
    ["in_effect", "scheduled", "suspended", 2],
    ["in_effect", "in_force", "suspended", 1],
  ]);
  assert.equal(brief.entries.get(brief.summary[0].before.entryId!)?.effectiveFrom, null);
  assert.equal(brief.entries.get(brief.summary[0].before.entryId!)?.evidenceLevel, "ambiguous");
});

test("date validation rejects invalid, duplicate, reversed and post-cutoff values", () => {
  for (const input of [
    { from: "" },
    { to: "2026-02-30" },
    { from: "2026-11-11" },
    { from: "2026-11-12", to: "2026-11-11" },
    { from: "2025-10-08" },
    { to: "2026-11-13" },
    { to: ["2026-11-11", "2026-11-12"] },
  ]) {
    assert.deepEqual(buildControlBrief(superhard, input), { valid: false, firstDate: "2025-10-09", cutoff: "2026-11-12" });
  }
});

test("both notes are reproducible projections of the issued archive and omit pending content", () => {
  for (const item of controlBriefCases) {
    const brief = buildControlBrief(item);
    assert.ok(brief.valid);
    assert.equal(brief.manifest.datasetVersion, PUBLISHED_CONTROLS_RELEASES[0].datasetVersion);
    const note = renderControlBrief(brief);
    assert.equal(note, renderControlBrief(brief));
    assert.match(note, /2026-11-12/);
    assert.match(note, /Commercial integration and redistribution require separate permission/);
    assert.doesNotMatch(note, /FI003|research\/fi003|rc-cn-mofcom-59-2026|src-mofcom-2026-59|src-mofcom-51|pending_human_adjudication/i);
    assert.equal(brief.sources.size, 3);
    for (const source of brief.sources.values()) {
      assert.equal(source.reviewState, "published");
      assert.equal(source.confidence, "primary");
      assert.ok(note.includes(source.url), source.sourceId);
    }
  }
  const publicModule = readFileSync("lib/control-briefs.ts", "utf8");
  assert.match(publicModule, /readControlsArchive\(date\)/);
  assert.doesNotMatch(publicModule, /controls-feed-io|loadReviewOverlay|applyReviewOverlay|\.\.\/research\//);
});

test("the attachment matches the selected comparison and ignores candidate opt-ins", async () => {
  const params = (caseId: string) => ({ params: Promise.resolve({ caseId }) });
  const request = (query: string) => new Request(`http://localhost/controls/changes/superhard-materials/brief?${query}`);
  const dates = { from: "2025-11-06", to: "2025-11-07" };
  const query = new URLSearchParams(dates).toString();
  const response = await GET(request(`${query}&includePending=true&release=2026-11-27`), params(superhard.slug));
  const brief = buildControlBrief(superhard, dates);
  assert.ok(brief.valid);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.match(response.headers.get("content-disposition")!, /2025-11-06-to-2025-11-07\.txt/);
  assert.equal(await response.text(), renderControlBrief(brief));

  assert.equal((await GET(request(""), params("rc-cn-mofcom-59-2026"))).status, 404);
  assert.equal((await GET(request("to=2026-11-11&to=2026-11-12"), params(superhard.slug))).status, 400);
  assert.equal((await GET(request("to=2026-11-27"), params(superhard.slug))).status, 400);
});
