import test from "node:test";
import assert from "node:assert/strict";
import { getAllControlMeasures, getEventById, getSourceById } from "../lib/data";
import { controlEndPassed, controlStatusOn } from "../lib/capital-control";

const eventId = "evt-cn-mofcom-55-2025";
const originalTitle = "商务部 海关总署公告2025年第55号 公布对超硬材料相关物项实施出口管制的决定";
const clauses = [
  ["2C902.a", "goods"],
  ["2C902.b", "goods"],
  ["2C902.c", "goods"],
  ["2C902.d", "goods"],
  ["2B005.b", "equipment"],
  ["2E902", "technology"],
] as const;

const rows = getAllControlMeasures().filter((m) => m.eventId === eventId);

test("MOFCOM No. 55: original-title provenance and six bounded controls plus customs clause", () => {
  assert.equal(getEventById(eventId)?.titleOriginal, originalTitle);
  assert.equal(getSourceById("src-mofcom-55")?.title, originalTitle);
  assert.equal(
    getSourceById("src-mofcom-55")?.url,
    "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_949f47563b834dad95b0010f375a892c.html",
  );
  assert.equal(rows.length, 7);

  const licensing = rows.filter((m) => m.measureType === "export_licensing");
  assert.equal(licensing.length, clauses.length);
  for (const [code, itemType] of clauses) {
    const row = licensing.find((m) => m.productCodes.some((p) => p.code === code && p.role === "legal_scope"));
    assert.ok(row, "Missing original-source controlled item " + code);
    assert.deepEqual(row.controlledItemTypes, [itemType]);
    assert.deepEqual(row.controlledStages, []);
    assert.deepEqual(row.materialIds, []);
    assert.equal(row.materialAttribution, "includes_untracked");
    assert.ok(
      row.evidence.some((e) => e.sourceId === "src-mofcom-55" && e.supports.includes("item_scope")),
      "Missing same-source item-scope provenance for " + code,
    );
  }

  const customs = rows.find((m) => m.measureType === "customs_enforcement");
  assert.ok(customs);
  assert.equal(customs.clause, "Customs declaration paragraph");
  assert.deepEqual(customs.controlledItemTypes, []);
  assert.deepEqual(customs.productCodes, []);
});

test("MOFCOM No. 55: suspension predates announced commencement, without invented in-force period", () => {
  for (const row of rows) {
    assert.deepEqual(
      row.statusHistory.map((entry) => [entry.status, entry.date, entry.until, entry.sourceId]),
      [
        ["scheduled", "2025-10-09", "2025-11-08", "src-mofcom-55"],
        ["suspended", "2025-11-07", "2026-11-10", "src-mofcom-70"],
        ["suspended", "2026-11-11", "2027-01-10", "src-mofcom-2026-58"],
      ],
      row.id,
    );
    assert.equal(controlStatusOn(row, "2025-11-06"), "scheduled");
    assert.equal(controlStatusOn(row, "2025-11-07"), "suspended");
    assert.equal(controlStatusOn(row, "2025-11-08"), "suspended");
    assert.equal(controlStatusOn(row, "2026-11-10"), "suspended");
    assert.equal(controlStatusOn(row, "2026-11-11"), "suspended");
    assert.equal(controlEndPassed(row, "2027-01-10"), false);
    assert.equal(controlEndPassed(row, "2027-01-11"), true);
    assert.ok(row.statusHistory.every((entry) => entry.status !== "in_force"));
  }
});
