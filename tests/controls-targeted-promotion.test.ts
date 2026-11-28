import assert from "node:assert/strict";
import test from "node:test";
import { getAllControlMeasures, getAllEvents, getAllSources } from "@/lib/data";
import { buildDataset, eventsCsv } from "@/lib/export";
import { site } from "@/lib/site";
import { readControlsArchive } from "@/lib/controls-release-archive";
import { buildPublishedControlsSnapshotBundle } from "@/lib/published-controls-download";

test("No. 72 and No. 59 are unique source-linked events and separate from No. 58", () => {
  for (const [id, date, source] of [
    ["evt-cn-mofcom-72-2025", "2025-11-09", "src-mofcom-72"],
    ["evt-cn-mofcom-59-2026", "2026-11-24", "src-mofcom-2026-59"],
  ]) {
    const hits = getAllEvents().filter(e => e.id === id);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].date, date);
    assert.ok(hits[0].sourceIds.includes(source));
    assert.ok(getAllSources().some(s => s.id === source));
    assert.ok(buildDataset().events.some(e => e.id === id));
    assert.ok(eventsCsv().includes(id));
  }
  assert.ok(getAllEvents().some(e => e.id === "china-rare-earth-suspension-extension-2026-11"));
});

test("No. 59 adds exactly two continuation statuses and leaves the military clause unchanged", () => {
  const measures = getAllControlMeasures();
  const affected = measures.filter(m => m.statusHistory.some(s => s.sourceId === "src-mofcom-2026-59"));
  assert.deepEqual(affected.map(m => m.id).sort(), ["ctl-cn-us-2024-gallium-germanium-antimony-denial", "ctl-cn-us-2024-graphite-end-use-review"]);
  for (const m of affected) {
    assert.equal(m.eventId, "evt-cn-us-ban-2024");
    const first = m.statusHistory.find(s => s.sourceId === "src-mofcom-72");
    assert.equal(first?.until, "2026-11-27");
    const next = m.statusHistory.find(s => s.sourceId === "src-mofcom-2026-59");
    assert.equal(next?.date, "2026-11-28");
    assert.equal(next?.until, "2027-01-27");
    assert.equal(next?.status, "suspended");
  }
  const military = measures.find(m => m.id === "ctl-cn-us-2024-military-end-use-ban")!;
  assert.equal(military.statusHistory.at(-1)?.status, "in_force");
  assert.ok(!military.statusHistory.some(s => ["src-mofcom-72","src-mofcom-2026-59"].includes(s.sourceId)));
});

test("limited graphite successor and historical repeal preserve global cutoff and issued archive", () => {
  const measures = getAllControlMeasures();
  const replacement = measures.find(m => m.id === "ctl-cn-list-2024-graphite-licensing")!;
  assert.deepEqual(replacement.productCodes.map(c => c.code), ["1C108.b", "1C108.c"]);
  assert.deepEqual(replacement.modifiesMeasureIds, ["ctl-cn-graphite-2023-export-licensing"]);
  assert.equal(replacement.statusHistory[0].date, "2024-12-01");
  for (const id of ["ctl-cn-graphite-2023-export-licensing", "ctl-cn-graphite-2023-decontrol"]) {
    const m = measures.find(x => x.id === id)!;
    assert.equal(m.statusHistory.at(-1)?.status, "revoked");
    assert.equal(m.statusHistory.at(-1)?.date, "2024-12-01");
  }
  assert.equal(site.legalStatusAsOf, "2026-11-12");
  assert.equal(site.controlsTargetedRevision.date, "2026-11-27");
  assert.equal(buildPublishedControlsSnapshotBundle().manifest.datasetVersion, readControlsArchive("2026-11-12").manifest.datasetVersion);
});
