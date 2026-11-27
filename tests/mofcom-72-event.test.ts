import { test } from "node:test";
import assert from "node:assert/strict";

import { getAllControlMeasures, getAllEvents, getAllSources } from "@/lib/data";
import { buildDataset, eventsCsv } from "@/lib/export";

test("MOFCOM Announcement No. 72 is a distinct source-linked policy event", () => {
  const event = getAllEvents().find((e) => e.id === "evt-cn-mofcom-72-2025");
  assert.ok(event, "November 2025 suspension decision is a standalone event");
  assert.equal(event.date, "2025-11-09");
  assert.equal(event.documentNumber, "MOFCOM Announcement No. 72 (2025)");
  assert.equal(event.titleOriginalLang, "zh");
  assert.ok(event.titleOriginal.includes("2025年第72号"));
  assert.ok(event.sourceIds.includes("src-mofcom-72"));
  assert.ok(getAllSources().some((s) => s.id === "src-mofcom-72"));
  assert.ok(event.affectedMaterialIds.includes("graphite"));
  assert.ok(buildDataset().events.some((e) => e.id === event.id));
  assert.ok(eventsCsv().includes(event.id));

  // The October 2025 package's suspension is a different decision and timeline.
  assert.ok(getAllEvents().some((e) => e.id === "china-rare-earth-suspension-2025-11"));
  assert.ok(getAllEvents().some((e) => e.id === "china-rare-earth-suspension-extension-2026-11"));
});

test("No. 72 suspends only paragraph 2 of No. 46, preserving clause histories", () => {
  const byId = new Map(getAllControlMeasures().map((m) => [m.id, m]));
  const affected = [
    "ctl-cn-us-2024-gallium-germanium-antimony-denial",
    "ctl-cn-us-2024-graphite-end-use-review",
  ];
  for (const id of affected) {
    const clause = byId.get(id);
    assert.ok(clause, id);
    assert.equal(clause.eventId, "evt-cn-us-ban-2024");
    const change = clause.statusHistory.find((entry) => entry.sourceId === "src-mofcom-72");
    assert.ok(change, id + " references the primary suspension decision");
    assert.equal(change.status, "suspended");
    assert.equal(change.date, "2025-11-09");
    assert.equal(change.until, "2026-11-27");
  }

  const military = byId.get("ctl-cn-us-2024-military-end-use-ban");
  assert.ok(military);
  assert.equal(military.statusHistory.some((entry) => entry.sourceId === "src-mofcom-72"), false);
  assert.equal(military.statusHistory.at(-1)?.status, "in_force");
});
