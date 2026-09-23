/**
 * Builders for the /data export. Pure and deterministic (no wall-clock reads)
 * so the route handlers can be prerendered with `dynamic = "force-static"`.
 */
import { site } from "./site";
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getAllFramingClaims,
  getAllJurisdictions,
  getAllMaterials,
  getAllSources,
} from "./data";
import { buildCapitalControlSummary } from "./capital-control-summary";
import { commitmentActor, controlIssuer, currentControlEntry, currentFinancialStatus, evidenceSourceIds } from "./capital-control";
import type { PolicyEvent } from "./types";

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
      financialCommitments: getAllFinancialCommitments().length,
      controlMeasures: getAllControlMeasures().length,
    },
    events: getAllEvents(),
    framing: getAllFramingClaims(),
    materials: getAllMaterials(),
    jurisdictions: getAllJurisdictions(),
    sources: getAllSources(),
    financialCommitments: getAllFinancialCommitments(),
    controlMeasures: getAllControlMeasures(),
    capitalControlSummary: buildCapitalControlSummary(),
  };
}

/** @param events Defaults to the whole corpus; pass a subset (e.g. a
 *  reader's saved list) to reuse the exact same columns and quoting for a
 *  smaller export instead of a second CSV builder. */
export function eventsCsv(events: PolicyEvent[] = getAllEvents()): string {
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
    events.map((e) => [
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

// --- Capital & Control -------------------------------------------------------
//
// One row per record, flattened for spreadsheets. Amounts stay canonical
// decimal strings in the source's currency; nothing is converted or summed.
// Nested structures (terms, outcomes, evidence) are kept in the JSON exports,
// and the two status-history CSVs give one row per status entry.

export function financialCommitmentsCsv(): string {
  return toCsv(
    [
      "id",
      "eventId",
      "actor",
      "instrument",
      "valueRole",
      "capitalSource",
      "amountValue",
      "amountCurrency",
      "amountQualifier",
      "amountAsStated",
      "currencyBasis",
      "provider",
      "providerJurisdiction",
      "legalAuthority",
      "recipient",
      "project",
      "facility",
      "locations",
      "stages",
      "stageAllocation",
      "materialIds",
      "materialAttribution",
      "untrackedMaterialsAsStated",
      "partOf",
      "drawnFrom",
      "currentFinancialStatus",
      "currentImplementationStatus",
      "termCount",
      "outcomeCount",
      "sourceIds",
      "notes",
    ],
    getAllFinancialCommitments().map((c) => [
      c.id,
      c.eventId,
      commitmentActor(c) ?? "",
      c.instrument,
      c.valueRole,
      c.capitalSource,
      c.amount?.value ?? "",
      c.amount?.currency ?? "",
      c.amount?.qualifier ?? "",
      c.amount?.amountAsStated ?? "",
      c.amount?.currencyBasis ?? "",
      c.provider ?? "",
      c.providerJurisdiction ?? "",
      c.legalAuthority ?? "",
      c.recipient ?? "",
      c.project ?? "",
      c.facility ?? "",
      c.locations.map((l) => [l.countryCode, l.subnational, l.asStated].filter(Boolean).join(" / ")).join(LIST_SEP),
      c.stages.join(LIST_SEP),
      c.stageAllocation,
      c.materialIds.join(LIST_SEP),
      c.materialAttribution,
      c.untrackedMaterialsAsStated.join(LIST_SEP),
      c.relationships.filter((r) => r.relationship === "part_of").map((r) => r.commitmentId).join(LIST_SEP),
      c.relationships.filter((r) => r.relationship === "drawn_from").map((r) => r.commitmentId).join(LIST_SEP),
      currentFinancialStatus(c),
      c.implementationStatusHistory.at(-1)?.status ?? "",
      c.terms.length,
      c.outcomes.length,
      evidenceSourceIds(c).join(LIST_SEP),
      c.notes ?? "",
    ]),
  );
}

export function controlMeasuresCsv(): string {
  return toCsv(
    [
      "id",
      "eventId",
      "issuer",
      "measureType",
      "direction",
      "clause",
      "targetScopes",
      "targetJurisdictions",
      "targetEntities",
      "targetEndUsersAsStated",
      "targetEndUsesAsStated",
      "materialIds",
      "materialAttribution",
      "untrackedMaterialsAsStated",
      "productScopeAsStated",
      "productCodes",
      "legalBasisEventIds",
      "legalBasisAsStated",
      "modifiesMeasureIds",
      "modifiesExternalInstruments",
      "currentStatus",
      "currentStatusDate",
      "currentStatusUntil",
      "sourceIds",
      "notes",
    ],
    getAllControlMeasures().map((m) => {
      const cur = currentControlEntry(m);
      return [
        m.id,
        m.eventId,
        controlIssuer(m),
        m.measureType,
        m.direction,
        m.clause ?? "",
        m.targetScopes.join(LIST_SEP),
        m.targetJurisdictions.join(LIST_SEP),
        m.targetEntities.join(LIST_SEP),
        m.targetEndUsersAsStated.join(LIST_SEP),
        m.targetEndUsesAsStated.join(LIST_SEP),
        m.materialIds.join(LIST_SEP),
        m.materialAttribution,
        m.untrackedMaterialsAsStated.join(LIST_SEP),
        m.productScopeAsStated ?? "",
        m.productCodes.map((p) => `${p.system}:${p.code}:${p.role}`).join(LIST_SEP),
        m.legalBasisEventIds.join(LIST_SEP),
        m.legalBasisAsStated ?? "",
        m.modifiesMeasureIds.join(LIST_SEP),
        m.modifiesExternalInstruments.join(LIST_SEP),
        cur.status,
        cur.date ?? "",
        cur.until ?? "",
        evidenceSourceIds(m).join(LIST_SEP),
        m.notes ?? "",
      ];
    }),
  );
}

/** One row per financial or implementation status entry, in history order. */
export function financialStatusHistoryCsv(): string {
  const rows: unknown[][] = [];
  for (const c of getAllFinancialCommitments()) {
    c.financialStatusHistory.forEach((e, i) =>
      rows.push([c.id, "financial", i, e.status, e.date ?? "", e.sourceId, i === c.financialStatusHistory.length - 1, e.note ?? ""]),
    );
    c.implementationStatusHistory.forEach((e, i) =>
      rows.push([c.id, "implementation", i, e.status, e.date ?? "", e.sourceId, i === c.implementationStatusHistory.length - 1, e.note ?? ""]),
    );
  }
  return toCsv(["commitmentId", "history", "sequence", "status", "date", "sourceId", "isCurrent", "note"], rows);
}

/** One row per control status entry, in history order. */
export function controlStatusHistoryCsv(): string {
  const rows: unknown[][] = [];
  for (const m of getAllControlMeasures())
    m.statusHistory.forEach((e, i) =>
      rows.push([m.id, i, e.status, e.date ?? "", e.until ?? "", e.sourceId, i === m.statusHistory.length - 1, e.note ?? ""]),
    );
  return toCsv(["measureId", "sequence", "status", "date", "until", "sourceId", "isCurrent", "note"], rows);
}
