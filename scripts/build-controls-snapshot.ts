import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDataset } from "../lib/export";
import { site } from "../lib/site";
import type { ControlStatusEntry } from "../lib/types";

const schemaVersion = 1;
const asOf = site.legalStatusAsOf;
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

function index<T extends { id: string }>(rows: readonly T[]) {
  const indexed = new Map<string, T>();
  for (const row of rows) {
    assert(row.id && !indexed.has(row.id), `Missing or duplicate ID: ${row.id}`);
    indexed.set(row.id, row);
  }
  return indexed;
}

function lookup<T>(rows: ReadonlyMap<string, T>, id: string, from: string): T {
  const row = rows.get(id);
  assert(row, `${from} references missing ID ${id}`);
  return row;
}

function buildSnapshot() {
  const dataset = buildDataset();
  const controls = index(dataset.controlMeasures);
  const eventIndex = index(dataset.events);
  const sourceIndex = index(dataset.sources);
  const materialIndex = index(dataset.materials);
  const eventIds = new Set<string>();
  const sourceIds = new Set<string>();
  const statusSourceIds = new Set<string>();

  function addEvent(id: string, from: string) {
    const event = lookup(eventIndex, id, from);
    if (eventIds.has(id)) return;
    eventIds.add(id);
    assert(event.sourceIds.length, `${id} has no event citations`);
    for (const sourceId of event.sourceIds) sourceIds.add(sourceId);
    if (event.supersededByEventId) addEvent(event.supersededByEventId, id);
  }

  const statusHistory: (ControlStatusEntry & { measureId: string; sequence: number })[] = [];
  const clauses = [];
  for (const { statusHistory: history, ...clause } of controls.values()) {
    const { id, eventId } = clause;
    const parent = lookup(eventIndex, eventId, id);
    addEvent(eventId, id);
    for (const relatedId of clause.legalBasisEventIds) addEvent(relatedId, id);
    for (const modifiedId of clause.modifiesMeasureIds) lookup(controls, modifiedId, id);
    for (const materialId of clause.materialIds) lookup(materialIndex, materialId, id);
    assert(clause.evidence.length, `${id} has no clause citations`);
    for (const ref of clause.evidence) sourceIds.add(ref.sourceId);

    assert(history.length, `${id} has no status history`);
    history.forEach((entry, sequence) => {
      assert(
        clause.evidence.some((ref) => ref.sourceId === entry.sourceId && ref.supports.includes("status")),
        `${id} status ${sequence} has no matching evidence citation`,
      );
      statusSourceIds.add(entry.sourceId);
      statusHistory.push({ measureId: id, sequence, ...entry });
    });
    clauses.push({ ...clause, issuer: parent.jurisdiction });
  }

  // A shared status citation is useful for discovery and is not an event identity.
  for (const event of eventIndex.values()) {
    if (event.sourceIds.some((id) => statusSourceIds.has(id))) addEvent(event.id, "status citations");
  }

  const events = [...eventIds].sort().map((id) => {
    const event = lookup(eventIndex, id, "events");
    const {
      date, jurisdiction, issuingBody, documentNumber, titleEn, titleOriginal,
      titleOriginalLang, titleEnSource, policyStatus, mechanism, affectedMaterialIds,
      verificationStatus, supersededByEventId, sourceIds,
    } = event;
    return {
      id, date, jurisdiction, issuingBody, documentNumber: documentNumber ?? null,
      documentLabel: titleEn,
      titleOriginal, titleOriginalLang, titleEnSource, policyStatus, mechanism,
      affectedMaterialIds, verificationStatus, supersededByEventId: supersededByEventId ?? null, sourceIds,
    };
  });

  const sources = [...sourceIds].sort().map((id) => {
    const source = lookup(sourceIndex, id, "citations");
    const { url, title, publisher, language, datePublished, dateAccessed, sourceType, confidence } = source;
    assert(/^https?:\/\//.test(url) && new URL(url).hostname, `${id} has no HTTP(S) citation URL`);
    return { id, url, title, publisher, language, datePublished: datePublished ?? null, dateAccessed, sourceType, confidence };
  });
  return {
    "control-clauses.json": clauses,
    "policy-events.json": events,
    "control-status-history.json": statusHistory,
    "sources.json": sources,
  };
}

const [out, ...extra] = process.argv.slice(2);
if (!out || extra.length) throw new Error("Usage: npm run snapshot:controls -- <new-output-directory>");

const files = Object.entries(buildSnapshot()).map(([name, rows]) => ({
  name, rows: rows.length, content: json(rows),
}));
const datasets = Object.fromEntries(files.map(({ name, rows, content }) => [name, { rows, sha256: sha256(content) }]));
const datasetVersion = `smpt-controls-v${schemaVersion}-${asOf}-${sha256(json(datasets))}`;
const manifest = { datasetVersion, schemaVersion, asOf, sourceDatasetVersion: site.version, datasets };

const companions = ["README.md", "worked_example.py"].map((name) => ({
  name,
  content: readFileSync(new URL(`../docs/engineering/controls-snapshot/${name}`, import.meta.url)),
}));

// Require a fresh output directory so unrelated files and partial retries cannot mix with this build.
// Write the manifest last. Consumers use its checksums to verify the dataset files.
mkdirSync(out);
for (const { name, content } of [...files, ...companions]) writeFileSync(join(out, name), content);
writeFileSync(join(out, "manifest.json"), json(manifest));
console.log(datasetVersion);
