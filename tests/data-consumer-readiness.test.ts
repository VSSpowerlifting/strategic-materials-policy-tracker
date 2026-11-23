/**
 * Data-consumer readiness: the dataset manifest, the integration guide's
 * claims, and the public download and API contracts they describe.
 *
 * Fixtures are built in memory from cloned records; the seed corpus is never
 * edited.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { buildDatasetManifest, INTEGRATION_GUIDE_PATH, MANIFEST_PATH, MANIFEST_VERSION, type ManifestJoin } from "@/lib/dataset-manifest";
import { datasetCounts, datasetIdentity } from "@/lib/dataset-metadata";
import { buildDataset, controlMeasuresCsv, controlStatusHistoryCsv } from "@/lib/export";
import { addDecimals, controlEndPassed, controlEntryOn, scheduledControlEntry } from "@/lib/capital-control";
import { getAllControlMeasures, getControlMeasureById, getDatasetSummary } from "@/lib/data";
import { FINANCING_EXAMPLE, WALKTHROUGH, financingExample, sourceDateGaps, walkthrough } from "@/lib/integration-guide";
import { site } from "@/lib/site";
import type { ControlMeasure, ControlStatusEntry } from "@/lib/types";

const ROOT = process.cwd();
const BOM = "﻿";
const manifest = buildDatasetManifest();

type Handler = (request: Request, context?: { params: Promise<{ id: string }> }) => Response | Promise<Response>;

/** Import the route handler serving a public path such as `/api/v1/events/{id}`. */
async function routeFor(path: string): Promise<Handler> {
  const file = resolve(ROOT, "app", `.${path.replace("{id}", "[id]")}`, "route.ts");
  assert.ok(existsSync(file), `no route file for ${path}`);
  const mod = (await import(pathToFileURL(file).href)) as { GET: Handler };
  return mod.GET;
}

async function call(path: string, id?: string): Promise<Response> {
  const GET = await routeFor(path);
  return id === undefined
    ? GET(new Request(`http://localhost${path}`))
    : GET(new Request(`http://localhost${path.replace("{id}", id)}`), { params: Promise.resolve({ id }) });
}

/** A CSV response's text after checking its UTF-8 byte-order mark (which `Response.text()` would strip). */
async function csvBody(res: Response): Promise<string> {
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], "CSV lacks a UTF-8 BOM");
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes).slice(BOM.length);
}

/** RFC 4180 parser for the export CSVs (CRLF rows, quoted cells). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\r" && text[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function csvRecords(text: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(text);
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

// --- Manifest identity, determinism and independence ----------------------------------

test("manifest is deterministic, semver-versioned and distinct from the corpus version", () => {
  assert.equal(JSON.stringify(buildDatasetManifest()), JSON.stringify(manifest));
  assert.match(MANIFEST_VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.manifestVersion, MANIFEST_VERSION);
  assert.notEqual(manifest.manifestVersion, manifest.corpus.version);
  assert.equal(manifest.manifestUrl, MANIFEST_PATH);
  assert.equal(manifest.corpus.version, site.version);
  assert.equal(manifest.dates.releasedOn, site.lastUpdated);
  assert.equal(manifest.dates.legalStatusAsOf, site.legalStatusAsOf);
  assert.equal(manifest.controlStatus.asOfDate, site.legalStatusAsOf);
});

test("manifest and shared metadata never import the full export or financial summaries", () => {
  for (const file of ["lib/dataset-manifest.ts", "lib/dataset-metadata.ts"]) {
    const imports = [...readFileSync(resolve(ROOT, file), "utf8").matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
    for (const spec of imports) {
      assert.doesNotMatch(spec, /export|capital-control|capital-intelligence|summary|markets/, `${file} imports ${spec}`);
    }
  }
});

test("manifest, dataset.json, loaders and list endpoints agree on counts and identity", async () => {
  const dataset = buildDataset();
  const summary = getDatasetSummary();
  assert.deepEqual(manifest.counts, datasetCounts());
  assert.deepEqual(dataset.counts, manifest.counts);
  assert.equal(manifest.counts.framing, summary.framingClaims);
  const identity = datasetIdentity();
  assert.deepEqual(
    { name: dataset.name, version: dataset.version, generatedAt: dataset.generatedAt, scopeFrom: dataset.scopeFrom, notice: dataset.notice },
    identity,
  );
  assert.equal(manifest.corpus.name, identity.name);
  assert.equal(manifest.corpus.scopeFrom, identity.scopeFrom);
  assert.equal(manifest.corpus.notice, identity.notice);
  assert.deepEqual(manifest.collections.map((c) => c.key), Object.keys(manifest.counts));
  for (const c of manifest.collections) {
    const body = await (await call(c.json)).json();
    assert.ok(Array.isArray(body), `${c.json} is not an array`);
    assert.equal(body.length, manifest.counts[c.key], `${c.json} length`);
    assert.equal((dataset as unknown as Record<string, unknown[]>)[c.key].length, manifest.counts[c.key], `dataset.${c.key}`);
  }
});

test("manifest route serves the manifest with the v1 JSON headers", async () => {
  const res = await call(MANIFEST_PATH);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(res.headers.get("cache-control"), "public, max-age=3600");
  assert.deepEqual(await res.json(), JSON.parse(JSON.stringify(manifest)));
});

test("manifest links resolve to real pages and methodology anchors", () => {
  const methodology = readFileSync(resolve(ROOT, "app/methodology/page.tsx"), "utf8");
  for (const link of Object.values(manifest.coverage.links)) {
    const [path, anchor] = link.split("#");
    const page = path === "/" ? "app/page.tsx" : `app${path}/page.tsx`;
    const route = `app${path}/route.ts`;
    assert.ok(existsSync(resolve(ROOT, page)) || existsSync(resolve(ROOT, route)), `${link} has no page`);
    if (anchor) assert.match(methodology, new RegExp(`id="${anchor}"`), `${link} anchor missing`);
  }
  assert.equal(manifest.coverage.links.integrationGuide, INTEGRATION_GUIDE_PATH);
});

test("manifest describes the curated corpus only", () => {
  const text = JSON.stringify(manifest).toLowerCase();
  for (const banned of ["candidate", "review queue", "customer", "billing", "cand-"]) assert.ok(!text.includes(banned), `manifest mentions ${banned}`);
  const collectionKeys = manifest.collections.map((c) => c.key as string);
  for (const key of ["watchlist", "candidates", "markets"]) assert.ok(!collectionKeys.includes(key));
});

// --- Legacy route and CSV contracts -----------------------------------------------------

const CSV_HEADERS: Record<string, string[]> = {
  "smpt-events.csv": ["id", "date", "jurisdiction", "issuingBody", "titleEn", "titleOriginal", "titleOriginalLang", "titleEnSource", "documentNumber", "policyStatus", "mechanism", "affectedMaterialIds", "affectedSectors", "supersededByEventId", "sourceIds", "summary", "analyticalSignificance"],
  "smpt-framing.csv": ["id", "eventId", "actor", "category", "quoteOriginal", "quoteEn", "quoteEnSource", "sourceId", "notes"],
  "smpt-materials.csv": ["id", "slug", "nameEn", "nameZh", "grouping", "statusSummary", "chinaPositionNote", "diversificationNote", "downstreamIndustries", "eventIds", "sourceIds"],
  "smpt-jurisdictions.csv": ["id", "code", "name", "roles", "supplyChainPosition", "keyBodies", "framingPosture", "eventIds", "sourceIds"],
  "smpt-sources.csv": ["id", "title", "publisher", "url", "language", "datePublished", "dateAccessed", "sourceType", "confidence", "notes"],
  "smpt-financial-commitments.csv": ["id", "eventId", "actor", "instrument", "valueRole", "capitalSource", "amountValue", "amountCurrency", "amountQualifier", "amountAsStated", "currencyBasis", "provider", "providerJurisdiction", "legalAuthority", "recipient", "project", "facility", "locations", "stages", "stageAllocation", "materialIds", "materialAttribution", "untrackedMaterialsAsStated", "partOf", "drawnFrom", "currentFinancialStatus", "currentImplementationStatus", "termCount", "outcomeCount", "sourceIds", "notes", "providerOrgIds", "recipientOrgIds", "projectId", "programmeId", "layer", "amountBasisLabel", "amountBasisNote", "associatedProjectIds"],
  "smpt-control-measures.csv": ["id", "eventId", "issuer", "measureType", "direction", "clause", "targetScopes", "targetJurisdictions", "targetEntities", "targetEndUsersAsStated", "targetEndUsesAsStated", "materialIds", "materialAttribution", "untrackedMaterialsAsStated", "productScopeAsStated", "productCodes", "legalBasisEventIds", "legalBasisAsStated", "modifiesMeasureIds", "modifiesExternalInstruments", "currentStatus", "currentStatusDate", "currentStatusUntil", "sourceIds", "notes", "controlledItemTypes", "controlledStages", "statusAsOf", "scheduledStatus", "scheduledStatusFrom", "scheduledStatusUntil"],
  "smpt-organizations.csv": ["id", "name", "nameOriginal", "aliases", "kind", "countryCode", "actor", "partOf", "establishedBy", "rowsProvided", "rowsReceived", "sourceIds", "notes"],
  "smpt-projects.csv": ["id", "name", "sponsorOrgIds", "locations", "stages", "materialIds", "materialAttribution", "untrackedMaterialsAsStated", "financialRowIds", "designationIds", "sourceIds", "notes", "associatedFinancialRowIds"],
  "smpt-programmes.csv": ["id", "name", "nameOriginal", "actor", "kind", "administeringOrgIds", "parentProgrammeId", "legalAuthorityAsStated", "financialRowIds", "designationIds", "sourceIds", "notes"],
  "smpt-project-designations.csv": ["id", "eventId", "programmeId", "projectId", "projectNameAsStated", "holderOrgIds", "locations", "stages", "materialIds", "materialAttribution", "untrackedMaterialsAsStated", "currentStatus", "currentStatusDate", "sourceIds", "notes"],
  "smpt-financial-status-history.csv": ["commitmentId", "history", "sequence", "status", "date", "sourceId", "isCurrent", "note"],
  "smpt-control-status-history.csv": ["measureId", "sequence", "status", "date", "until", "sourceId", "isCurrent", "note"],
};

const manifestCsvs = () => [
  ...manifest.collections.flatMap((c) => (c.csv ? [c.csv] : [])),
  ...manifest.histories.map((h) => h.csv),
];

test("every manifest CSV is served with its pinned header, BOM, content type and download name", async () => {
  const csvs = manifestCsvs();
  assert.deepEqual(csvs.map((c) => c.filename).sort(), Object.keys(CSV_HEADERS).sort());
  for (const { url, filename } of csvs) {
    const res = await call(url);
    assert.equal(res.status, 200, url);
    assert.equal(res.headers.get("content-type"), "text/csv; charset=utf-8", url);
    assert.equal(res.headers.get("content-disposition"), `attachment; filename="${filename}"`, url);
    assert.deepEqual(parseCsv(await csvBody(res))[0], CSV_HEADERS[filename], `${filename} header`);
  }
});

test("dataset.json keeps its download name, headers and key order", async () => {
  const res = await call(manifest.fullExport.url);
  assert.equal(res.headers.get("content-disposition"), `attachment; filename="${manifest.fullExport.filename}"`);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.notEqual(bytes[0], 0xef, "dataset.json has no BOM");
  const text = new TextDecoder().decode(bytes);
  assert.deepEqual(Object.keys(JSON.parse(text)), [
    "name", "version", "generatedAt", "scopeFrom", "notice", "counts", "events", "framing", "materials", "jurisdictions", "sources",
    "financialCommitments", "controlMeasures", "capitalControlSummary", "organizations", "projects", "programmes",
    "projectDesignations", "projectMilestones", "capitalIntelligenceSummary",
  ]);
});

const RECORD_KEYS: Record<string, string[]> = {
  events: ["event", "framing", "sources"],
  financialCommitments: ["commitment", "event", "parents", "children", "sources"],
  controlMeasures: ["measure", "event", "modifiedBy", "sources"],
  organizations: ["organization", "rolledUpOrganizationIds", "providedRowIds", "receivedRowIds", "sponsoredProjectIds", "administeredProgrammeIds", "heldDesignationIds", "children", "sources"],
  projects: ["project", "governments", "providerOrgIds", "layers", "associatedRowIds", "designationIds", "latestImplementation", "reviewedProjectMilestones", "reviewedMilestoneSources", "reviewedMilestoneEvidenceBasis", "sources"],
  programmes: ["programme", "parentProgrammeId", "childProgrammeIds", "envelopesListedNotSummed", "recordedAwardTotals", "recordedAwardIds", "otherLayers", "designationIds", "sources"],
  projectDesignations: ["designation", "event", "sources"],
};

test("record endpoints keep their envelopes, bundle sources and 404 unknown IDs", async () => {
  const dataset = buildDataset() as unknown as Record<string, { id: string }[]>;
  const withRecords = manifest.collections.filter((c) => c.record);
  assert.deepEqual(withRecords.map((c) => c.key).sort(), Object.keys(RECORD_KEYS).sort());
  for (const c of withRecords) {
    const first = dataset[c.key][0];
    const res = await call(c.record!, first.id);
    assert.equal(res.status, 200, c.record!);
    const body = await res.json();
    assert.deepEqual(Object.keys(body), RECORD_KEYS[c.key], `${c.key} envelope`);
    assert.ok(Array.isArray(body.sources) && c.recordBundlesSources);
    const missing = await call(c.record!, "no-such-record");
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: "not found", id: "no-such-record" });
  }
});

// --- IDs and joins over the emitted data ---------------------------------------------------

test("IDs are unique and use each collection's prefix", () => {
  const dataset = buildDataset() as unknown as Record<string, { id: string }[]>;
  for (const c of manifest.collections) {
    const ids = dataset[c.key].map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, `${c.key} has duplicate IDs`);
    if (c.idPrefix) for (const id of ids) assert.ok(id.startsWith(c.idPrefix), `${c.key} ${id} lacks ${c.idPrefix}`);
  }
});

/** Every leaf value a join path such as `relationships[].commitmentId` reaches in one record. */
function leaves(record: unknown, field: string): unknown[] {
  let current: unknown[] = [record];
  for (const segment of field.split(".")) {
    const many = segment.endsWith("[]");
    const key = many ? segment.slice(0, -2) : segment;
    current = current.flatMap((v) => {
      const next = v && typeof v === "object" ? (v as Record<string, unknown>)[key] : undefined;
      if (!many) return [next];
      return Array.isArray(next) ? next : [];
    });
  }
  return current;
}

type JoinProblem = { join: string; recordId: string; value: unknown; kind: "broken" | "missing" };

/**
 * Check every manifest join against a dataset. A reference is broken when its
 * value names no record; missing when a non-nullable field is null or empty.
 * Null and empty values in nullable fields pass. Fields the manifest lists as
 * out of corpus are never joined, so free-text names there cannot break.
 */
function checkJoins(dataset: Record<string, Record<string, unknown>[]>, joins: readonly ManifestJoin[]): JoinProblem[] {
  const problems: JoinProblem[] = [];
  for (const j of joins) {
    const targets = new Set(dataset[j.to].map((r) => r[j.targetKey]));
    for (const record of dataset[j.from]) {
      const values = leaves(record, j.field);
      const present = values.filter((v) => v !== null && v !== undefined && v !== "");
      if (!j.nullable && (present.length === 0 || present.length !== values.length)) {
        problems.push({ join: `${j.from}.${j.field}`, recordId: String(record.id), value: values, kind: "missing" });
      }
      for (const v of present) {
        if (!targets.has(v)) problems.push({ join: `${j.from}.${j.field}`, recordId: String(record.id), value: v, kind: "broken" });
      }
    }
  }
  return problems;
}

test("every manifest join resolves in the served dataset.json", async () => {
  const body = await (await call(manifest.fullExport.url)).json();
  assert.deepEqual(checkJoins(body, manifest.joins), []);
});

test("join checker reports broken and missing references and accepts nullable and out-of-corpus values", () => {
  const dataset = structuredClone(buildDataset()) as unknown as Record<string, Record<string, unknown>[]>;
  const measure = dataset.controlMeasures.find((m) => m.id === WALKTHROUGH.measureId)!;
  const commitment = dataset.financialCommitments.find((c) => c.projectId === null || c.projectId === undefined)!;
  // Out of corpus: free-text entity names and external instruments are not joins.
  measure.targetEntities = ["An entity named only in the source"];
  measure.modifiesExternalInstruments = ["An untracked instrument"];
  // Nullable: a null project link is not a broken reference.
  assert.ok(commitment);
  assert.deepEqual(checkJoins(dataset, manifest.joins), []);

  (measure.statusHistory as { sourceId: string }[])[0].sourceId = "src-does-not-exist";
  measure.eventId = null;
  const problems = checkJoins(dataset, manifest.joins);
  assert.deepEqual(
    problems.map((p) => [p.join, p.kind]).sort(),
    [["controlMeasures.eventId", "missing"], ["controlMeasures.statusHistory[].sourceId", "broken"]],
  );

  const outOfCorpus = manifest.outOfCorpusFields.map((f) => f.field);
  for (const j of manifest.joins) assert.ok(!outOfCorpus.includes(`${j.from}.${j.field}`), `${j.from}.${j.field} is listed both ways`);
});

/** Every path in the emitted records whose key names an ID reference. */
function idPaths(value: unknown, prefix = ""): Set<string> {
  const out = new Set<string>();
  if (Array.isArray(value)) {
    for (const v of value) for (const p of idPaths(v, `${prefix}[]`)) out.add(p);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (/(Id|Ids)$/.test(k)) out.add(Array.isArray(v) ? `${path}[]` : path);
      for (const p of idPaths(v, path)) out.add(p);
    }
  }
  return out;
}

test("the manifest declares a join for every ID-reference field the corpus emits", () => {
  const dataset = buildDataset() as unknown as Record<string, unknown[]>;
  const declared = new Set(manifest.joins.map((j) => `${j.from}.${j.field}`));
  const undeclared: string[] = [];
  for (const c of manifest.collections) {
    for (const path of idPaths(dataset[c.key])) {
      const field = path.replace(/^\[\]\./, "");
      if (!declared.has(`${c.key}.${field}`)) undeclared.push(`${c.key}.${field}`);
    }
  }
  assert.deepEqual(undeclared, []);
});

test("history CSV rows join to their parent clause or commitment and to a source", async () => {
  const dataset = buildDataset();
  const measures = new Set(dataset.controlMeasures.map((m) => m.id));
  const commitments = new Set(dataset.financialCommitments.map((c) => c.id));
  const sources = new Set(dataset.sources.map((s) => s.id));
  const control = csvRecords(await csvBody(await call("/api/export/control-status-history.csv")));
  const financial = csvRecords(await csvBody(await call("/api/export/financial-status-history.csv")));
  assert.equal(control.length, dataset.controlMeasures.reduce((n, m) => n + m.statusHistory.length, 0));
  for (const r of control) assert.ok(measures.has(r.measureId) && sources.has(r.sourceId), `control row ${r.measureId}/${r.sequence}`);
  for (const r of financial) assert.ok(commitments.has(r.commitmentId) && sources.has(r.sourceId), `financial row ${r.commitmentId}/${r.sequence}`);
});

// --- Status semantics, with in-memory fixtures ---------------------------------------------

const base = getControlMeasureById(WALKTHROUGH.measureId)!;
const fixture = (id: string, statusHistory: ControlStatusEntry[]): ControlMeasure => ({ ...structuredClone(base), id, statusHistory });
const entry = (status: ControlStatusEntry["status"], date: string | null, until?: string): ControlStatusEntry => ({
  status,
  date,
  sourceId: base.statusHistory[0].sourceId,
  ...(until ? { until } : {}),
  note: null,
});
const asOf = site.legalStatusAsOf;
const dayAfter = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

test("a future-effective entry is scheduled, not current, and isCurrent marks it as the last entry", () => {
  const future = dayAfter(asOf);
  const m = fixture("ctl-fixture-future", [entry("in_force", "2025-01-01"), entry("expired", future)]);
  assert.equal(controlEntryOn(m, asOf)?.status, "in_force");
  assert.equal(scheduledControlEntry(m, asOf)?.status, "expired");

  const [row] = csvRecords(controlMeasuresCsv([m]));
  assert.equal(row.statusAsOf, asOf);
  assert.equal(row.currentStatus, "in_force");
  assert.equal(row.currentStatusDate, "2025-01-01");
  assert.equal(row.scheduledStatus, "expired");
  assert.equal(row.scheduledStatusFrom, future);

  const history = csvRecords(controlStatusHistoryCsv([m]));
  assert.deepEqual(history.map((h) => [h.sequence, h.status, h.isCurrent]), [["0", "in_force", "false"], ["1", "expired", "true"]]);
});

test("a measure with no entry yet in effect shows its first entry as current and as scheduled", () => {
  const future = dayAfter(asOf);
  const m = fixture("ctl-fixture-not-yet", [entry("scheduled", future)]);
  assert.equal(controlEntryOn(m, asOf), null);
  const [row] = csvRecords(controlMeasuresCsv([m]));
  assert.equal(row.currentStatus, "scheduled");
  assert.equal(row.currentStatusDate, future);
  assert.equal(row.scheduledStatusFrom, future);
  assert.ok(row.currentStatusDate > row.statusAsOf, "consumers detect this by comparing currentStatusDate with statusAsOf");
});

test("an undated entry takes effect only after an earlier dated entry and exports as empty dates", () => {
  const leading = fixture("ctl-fixture-undated-first", [entry("announced", null)]);
  assert.equal(controlEntryOn(leading, asOf), null);
  const trailing = fixture("ctl-fixture-undated-later", [entry("in_force", "2025-01-01"), entry("suspended", null)]);
  assert.equal(controlEntryOn(trailing, asOf)?.status, "suspended");
  assert.equal(scheduledControlEntry(trailing, asOf), null);
  const [row] = csvRecords(controlMeasuresCsv([trailing]));
  assert.equal(row.currentStatus, "suspended");
  assert.equal(row.currentStatusDate, "");
  const history = csvRecords(controlStatusHistoryCsv([trailing]));
  assert.equal(history[1].date, "");
  assert.equal(history[1].until, "");
});

test("a stated end is inclusive: it passes only the day after until", () => {
  const m = fixture("ctl-fixture-until", [entry("suspended", "2026-01-01", asOf)]);
  assert.equal(controlEndPassed(m, asOf), false);
  assert.equal(controlEntryOn(m, dayAfter(asOf))?.status, "suspended");
  assert.equal(controlEndPassed(m, dayAfter(asOf)), true);
  const [row] = csvRecords(controlMeasuresCsv([m]));
  assert.equal(row.currentStatusUntil, asOf);
});

test("the corpus control CSVs keep their status semantics", () => {
  const rows = csvRecords(controlMeasuresCsv());
  const measures = getAllControlMeasures();
  assert.equal(rows.length, measures.length);
  for (const [i, m] of measures.entries()) {
    const cur = controlEntryOn(m, asOf) ?? m.statusHistory[0];
    assert.equal(rows[i].currentStatus, cur.status, m.id);
    assert.equal(rows[i].statusAsOf, asOf);
  }
  const history = csvRecords(controlStatusHistoryCsv());
  for (const m of measures) {
    const mine = history.filter((h) => h.measureId === m.id);
    assert.deepEqual(mine.map((h) => h.isCurrent), m.statusHistory.map((_, i) => String(i === m.statusHistory.length - 1)));
  }
});

// --- Integration guide claims -----------------------------------------------------------------

test("walkthrough IDs resolve and its chain holds: event → clause → status entries → sources", () => {
  const w = walkthrough();
  assert.equal(w.measure.eventId, w.event.id);
  assert.ok(w.clauses.some((c) => c.id === w.measure.id));
  assert.equal(w.entries.length, w.measure.statusHistory.length);
  for (const e of w.entries) assert.equal(e.source.id, e.sourceId);
  // The first entry was scheduled to take effect after the suspension that followed it was issued.
  const [scheduled, suspension] = w.entries;
  assert.equal(scheduled.status, "scheduled");
  assert.equal(suspension.status, "suspended");
  assert.ok(scheduled.until! > suspension.date!, "suspended before the scheduled effective date");
  assert.equal(w.inEffect, w.measure.statusHistory.findLast((e) => e.date !== null && e.date <= w.asOf) ?? null);
  assert.ok(w.latest.isCurrent);
});

test("source date gaps are counted from the corpus", () => {
  const gaps = sourceDateGaps();
  assert.equal(gaps.total, getDatasetSummary().sources);
  assert.ok(gaps.withoutDatePublished > 0 && gaps.withoutDatePublished < gaps.total);
});

test("financing example: a naive sum double counts; totalCommitments counts the package once", () => {
  const f = financingExample();
  const pkg = f.rows.find((r) => r.id === FINANCING_EXAMPLE.packageId)!;
  for (const id of FINANCING_EXAMPLE.componentIds) {
    const part = f.rows.find((r) => r.id === id)!;
    assert.ok(part.relationships.some((r) => r.relationship === "part_of" && r.commitmentId === pkg.id), `${id} is part_of the package`);
  }
  assert.ok(pkg.relationships.some((r) => r.relationship === "drawn_from" && r.commitmentId === FINANCING_EXAMPLE.authorityId));
  assert.notEqual(f.authority.valueRole, pkg.valueRole);
  assert.equal(f.naive, addDecimals([pkg.amount.value, pkg.amount.value]), "components sum to the package, so the naive total is twice it");

  const cur = f.counted.currencies[0];
  assert.equal(f.counted.currencies.length, 1);
  assert.equal(cur.status, "summed");
  assert.ok(cur.status === "summed" && cur.instruments.length === 1);
  if (cur.status === "summed") {
    assert.equal(cur.instruments[0].byQualifier?.exact, pkg.amount.value);
  }
  const peer = f.withPeer.currencies[0];
  assert.ok(peer.status === "summed");
  if (peer.status === "summed") {
    assert.equal(peer.instruments[0].binding?.exact, f.peer.amount.value);
    assert.equal(peer.instruments[0].notYetBinding?.exact, pkg.amount.value);
  }
});

// --- /data discoverability ----------------------------------------------------------------------

test("/data links the manifest and the integration guide, and the guide is in the sitemap", () => {
  const data = readFileSync(resolve(ROOT, "app/data/page.tsx"), "utf8");
  assert.match(data, /href=\{MANIFEST_PATH\}/);
  assert.match(data, /href=\{INTEGRATION_GUIDE_PATH\}/);
  assert.ok(existsSync(resolve(ROOT, `app${INTEGRATION_GUIDE_PATH}/page.tsx`)));
  assert.match(readFileSync(resolve(ROOT, "app/sitemap.ts"), "utf8"), /entry\("\/data\/guide"/);
});
