import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildDataset,
  eventsCsv,
  framingCsv,
  materialsCsv,
  jurisdictionsCsv,
  sourcesCsv,
  financialCommitmentsCsv,
  projectsCsv,
  controlMeasuresCsv,
  organizationsCsv,
  programmesCsv,
  projectDesignationsCsv,
  financialStatusHistoryCsv,
  controlStatusHistoryCsv,
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


test("eventsCsv accepts a subset and keeps the same columns and quoting rules", () => {
  const all = getAllEvents();
  const subset = all.slice(0, 2);
  const rows = dataRows(eventsCsv(subset));
  assert.equal(rows.length, subset.length);
  const header = eventsCsv().split("\r\n")[0];
  assert.equal(eventsCsv(subset).split("\r\n")[0], header);
  // The default (no argument) keeps exporting the whole corpus, unchanged.
  assert.equal(dataRows(eventsCsv()).length, all.length);
});

test("eventsCsv on an empty subset yields a header with no data rows", () => {
  assert.deepEqual(dataRows(eventsCsv([])), []);
});


test("shared project associations have separate append-only CSV columns", () => {
  const financialHeader = financialCommitmentsCsv().split("\r\n")[0].split(",");
  assert.equal(financialHeader.at(-1), "associatedProjectIds");
  const projectHeader = projectsCsv().split("\r\n")[0].split(",");
  assert.equal(projectHeader.at(-1), "associatedFinancialRowIds");
});


/** Minimal RFC-4180 reader for injection fixtures, including embedded newlines. */
function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [], row: string[] = [];
  let field = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (quoted) {
      if (ch === '"') {
        if (csv[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\r" || ch === "\n") {
      row.push(field); rows.push([...row]); row.length = 0; field = "";
      if (ch === "\r" && csv[i + 1] === "\n") i++;
    } else field += ch;
  }
  assert.equal(quoted, false, "CSV unterminated quote");
  assert.equal(row.length, 0, "CSV missing final record terminator");
  assert.equal(field, "", "CSV trailing fragment");
  return rows;
}

test("public event CSV neutralizes spreadsheet-active text without splitting records", () => {
  const original = getAllEvents()[0];
  const cases = [
    "=1+1", "+1+1", "-1+1", "@SUM(1,1)",
    "＝1+1", "＋1+1", "－1+1", "＠SUM(1,1)",
    "   =1+1", "\t=1+1", "\r=1+1", "\n=1+1",
    "\u0000 =1+1", '=1+1",@SUM(1,1)', 'a",=1+1',
  ];
  const headers = parseCsvRows(eventsCsv([]))[0];
  const column = headers.indexOf("issuingBody");
  assert.ok(column >= 0);
  for (const input of cases) {
    const event = structuredClone(original);
    event.issuingBody = input;
    const rows = parseCsvRows(eventsCsv([event]));
    assert.equal(rows.length, 2, "one data row for " + JSON.stringify(input));
    assert.equal(rows[1].length, headers.length, "no new cell for " + JSON.stringify(input));
    const expectsProtection = input !== 'a",=1+1';
    assert.equal(rows[1][column], expectsProtection ? "\t" + input : input,
      "only active *leading* formulas need spreadsheet escaping");
    assert.equal(rows[1][headers.indexOf("id")], original.id, "IDs unchanged");
    if (expectsProtection) assert.ok(eventsCsv([event]).includes('"\t'),
      "tab protection must be inside a quoted CSV field");
  }
  assert.equal(getAllEvents()[0].issuingBody, original.issuingBody,
    "fixture changes never mutate canonical published data");
});

test("plain signed decimal values, normal source text and raw JSON remain unchanged", () => {
  const original = getAllEvents()[0];
  for (const input of ["-42", "+42", "-0.125", "+0.125", "No. 61", "稀土", "2026-10-09"]) {
    const event = structuredClone(original);
    event.issuingBody = input;
    assert.equal(parseCsvRows(eventsCsv([event]))[1][3], input,
      "simple decimal or ordinary source text is byte-exact in CSV");
  }
  const before = JSON.stringify(buildDataset());
  eventsCsv([{...original, issuingBody: "=1+1"}]);
  assert.equal(JSON.stringify(buildDataset()), before, "JSON retains original evidence verbatim");
});

test("all public CSV projections preserve one structured row per header and never break out of quoted fields", () => {
  for (const [name, csv] of Object.entries({
    events: eventsCsv(), framing: framingCsv(), materials: materialsCsv(),
    jurisdictions: jurisdictionsCsv(), sources: sourcesCsv(),
    finance: financialCommitmentsCsv(), controls: controlMeasuresCsv(),
    organizations: organizationsCsv(), projects: projectsCsv(),
    programmes: programmesCsv(), designations: projectDesignationsCsv(),
    financialHistory: financialStatusHistoryCsv(), controlHistory: controlStatusHistoryCsv(),
  })) {
    const rows = parseCsvRows(csv);
    assert.ok(rows.length > 1, name + " has records");
    const width = rows[0].length;
    assert.ok(width > 2);
    for (const row of rows.slice(1))
      assert.equal(row.length, width, name + " row respects CSV field boundaries");
  }
});
