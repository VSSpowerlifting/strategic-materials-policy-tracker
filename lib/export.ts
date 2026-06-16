/**
 * Builders for the /data export. Pure and deterministic (no wall-clock reads)
 * so the route handlers can be prerendered with `dynamic = "force-static"`.
 */
import { site } from "./site";
import {
  getAllEvents,
  getAllFramingClaims,
  getAllJurisdictions,
  getAllMaterials,
  getAllSources,
} from "./data";

const LIST_SEP = "; ";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return lines.join("\r\n") + "\r\n";
}

export function buildDataset() {
  return {
    name: site.name,
    version: site.version,
    generatedAt: site.lastUpdated,
    scopeFrom: site.scopeStart,
    notice:
      "Categorical, source-grounded labels only — no synthetic risk scores. Framing claims are anchored to quoted passages. Not legal or compliance advice.",
    counts: {
      events: getAllEvents().length,
      framing: getAllFramingClaims().length,
      materials: getAllMaterials().length,
      jurisdictions: getAllJurisdictions().length,
      sources: getAllSources().length,
    },
    events: getAllEvents(),
    framing: getAllFramingClaims(),
    materials: getAllMaterials(),
    jurisdictions: getAllJurisdictions(),
    sources: getAllSources(),
  };
}

export function eventsCsv(): string {
  return toCsv(
    [
      "id",
      "date",
      "jurisdiction",
      "issuingBody",
      "titleEn",
      "titleOriginal",
      "titleOriginalLang",
      "titleEnSource",
      "documentNumber",
      "policyStatus",
      "mechanism",
      "affectedMaterialIds",
      "affectedSectors",
      "supersededByEventId",
      "sourceIds",
      "summary",
      "analyticalSignificance",
    ],
    getAllEvents().map((e) => [
      e.id,
      e.date,
      e.jurisdiction,
      e.issuingBody,
      e.titleEn,
      e.titleOriginal,
      e.titleOriginalLang,
      e.titleEnSource,
      e.documentNumber ?? "",
      e.policyStatus,
      e.mechanism.join(LIST_SEP),
      e.affectedMaterialIds.join(LIST_SEP),
      e.affectedSectors.join(LIST_SEP),
      e.supersededByEventId ?? "",
      e.sourceIds.join(LIST_SEP),
      e.summary,
      e.analyticalSignificance,
    ]),
  );
}

export function framingCsv(): string {
  return toCsv(
    [
      "id",
      "eventId",
      "actor",
      "category",
      "quoteOriginal",
      "quoteEn",
      "quoteEnSource",
      "sourceId",
      "notes",
    ],
    getAllFramingClaims().map((f) => [
      f.id,
      f.eventId,
      f.actor,
      f.category.join(LIST_SEP),
      f.quoteOriginal,
      f.quoteEn,
      f.quoteEnSource,
      f.sourceId,
      f.notes ?? "",
    ]),
  );
}

export function materialsCsv(): string {
  return toCsv(
    [
      "id",
      "slug",
      "nameEn",
      "nameZh",
      "grouping",
      "statusSummary",
      "chinaPositionNote",
      "diversificationNote",
      "downstreamIndustries",
      "eventIds",
      "sourceIds",
    ],
    getAllMaterials().map((m) => [
      m.id,
      m.slug,
      m.nameEn,
      m.nameZh ?? "",
      m.grouping ?? "",
      m.statusSummary,
      m.chinaPositionNote,
      m.diversificationNote ?? "",
      m.downstreamIndustries.join(LIST_SEP),
      m.eventIds.join(LIST_SEP),
      m.sourceIds.join(LIST_SEP),
    ]),
  );
}

export function jurisdictionsCsv(): string {
  return toCsv(
    [
      "id",
      "code",
      "name",
      "roles",
      "supplyChainPosition",
      "keyBodies",
      "framingPosture",
      "eventIds",
      "sourceIds",
    ],
    getAllJurisdictions().map((j) => [
      j.id,
      j.code,
      j.name,
      j.roles.join(LIST_SEP),
      j.supplyChainPosition,
      j.keyBodies.join(LIST_SEP),
      j.framingPosture ?? "",
      j.eventIds.join(LIST_SEP),
      j.sourceIds.join(LIST_SEP),
    ]),
  );
}

export function sourcesCsv(): string {
  return toCsv(
    [
      "id",
      "title",
      "publisher",
      "url",
      "language",
      "datePublished",
      "dateAccessed",
      "sourceType",
      "confidence",
      "notes",
    ],
    getAllSources().map((s) => [
      s.id,
      s.title,
      s.publisher,
      s.url,
      s.language,
      s.datePublished ?? "",
      s.dateAccessed,
      s.sourceType,
      s.confidence,
      s.notes ?? "",
    ]),
  );
}
