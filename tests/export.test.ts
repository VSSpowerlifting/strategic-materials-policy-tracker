import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildDataset,
  eventsCsv,
  framingCsv,
  materialsCsv,
  jurisdictionsCsv,
  sourcesCsv,
} from "@/lib/export";
import {
  getAllEvents,
  getAllFramingClaims,
  getAllMaterials,
  getAllJurisdictions,
  getAllSources,
} from "@/lib/data";
import { site } from "@/lib/site";

const dataRows = (csv: string) => csv.replace(/\r\n$/, "").split("\r\n").slice(1);

test("dataset counts match the loaders", () => {
  const d = buildDataset();
  assert.equal(d.counts.events, getAllEvents().length);
  assert.equal(d.counts.framing, getAllFramingClaims().length);
  assert.equal(d.counts.materials, getAllMaterials().length);
  assert.equal(d.counts.jurisdictions, getAllJurisdictions().length);
  assert.equal(d.counts.sources, getAllSources().length);
});

test("dataset is deterministic — no wall-clock, stable across calls", () => {
  assert.equal(buildDataset().generatedAt, site.lastUpdated);
  assert.equal(JSON.stringify(buildDataset()), JSON.stringify(buildDataset()));
});

test("each CSV has exactly one row per record", () => {
  assert.equal(dataRows(eventsCsv()).length, getAllEvents().length);
  assert.equal(dataRows(framingCsv()).length, getAllFramingClaims().length);
  assert.equal(dataRows(materialsCsv()).length, getAllMaterials().length);
  assert.equal(dataRows(jurisdictionsCsv()).length, getAllJurisdictions().length);
  assert.equal(dataRows(sourcesCsv()).length, getAllSources().length);
});

test("CSV quoting keeps embedded commas from breaking the column count", () => {
  const header = eventsCsv().split("\r\n")[0].split(",").length;
  // Every data row must expose the same number of top-level (unquoted) columns.
  for (const row of dataRows(eventsCsv())) {
    let cols = 1;
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === "," && !inQuotes) cols++;
    }
    assert.equal(cols, header, `row column count drifted: ${row.slice(0, 60)}`);
  }
});

test("NO candidate data leaks into any public export", () => {
  const blob = [
    JSON.stringify(buildDataset()),
    eventsCsv(),
    framingCsv(),
    materialsCsv(),
    jurisdictionsCsv(),
    sourcesCsv(),
  ].join("\n");
  assert.ok(!/\bcand-/.test(blob), "candidate ids (cand-*) must never appear in exports");
});
