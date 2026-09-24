/**
 * Read-only data access for the MVP. All data is local seed JSON — no live
 * APIs, no database. Loaders return typed records and never mutate the seed.
 */
import { FRAMING_CATEGORIES, JURISDICTIONS } from "./types";
import type {
  ControlMeasure,
  FinancialCommitment,
  FramingCategory,
  FramingClaim,
  Jurisdiction,
  JurisdictionCode,
  Material,
  Mechanism,
  Organization,
  PolicyEvent,
  Programme,
  Project,
  ProjectDesignation,
  Source,
  SourceConfidence,
  WatchedSource,
} from "./types";
import { getCoverageReport, type Share } from "./coverage";

import eventsSeed from "@/data/seed/events.json";
import framingSeed from "@/data/seed/framing.json";
import materialsSeed from "@/data/seed/materials.json";
import jurisdictionsSeed from "@/data/seed/jurisdictions.json";
import sourcesSeed from "@/data/seed/sources.json";
import watchlistSeed from "@/data/seed/watchlist.json";
import financialCommitmentsSeed from "@/data/seed/financial-commitments.json";
import controlMeasuresSeed from "@/data/seed/control-measures.json";
import organizationsSeed from "@/data/seed/organizations.json";
import projectsSeed from "@/data/seed/projects.json";
import programmesSeed from "@/data/seed/programmes.json";
import projectDesignationsSeed from "@/data/seed/project-designations.json";

const events = eventsSeed as PolicyEvent[];
const framing = framingSeed as FramingClaim[];
const materials = materialsSeed as Material[];
const jurisdictions = jurisdictionsSeed as Jurisdiction[];
const sources = sourcesSeed as Source[];
const watchlist = watchlistSeed as WatchedSource[];
const financialCommitments = financialCommitmentsSeed as FinancialCommitment[];
const controlMeasures = controlMeasuresSeed as ControlMeasure[];
// The v0.6 seeds start as [] and are typed through unknown so an empty file
// (inferred as never[]) and a populated one load the same way.
const organizations = organizationsSeed as unknown as Organization[];
const projects = projectsSeed as unknown as Project[];
const programmes = programmesSeed as unknown as Programme[];
const projectDesignations = projectDesignationsSeed as unknown as ProjectDesignation[];

// Sort helper: most recent first.
const byDateDesc = (a: PolicyEvent, b: PolicyEvent) => b.date.localeCompare(a.date);

// --- Events -----------------------------------------------------------------

export function getAllEvents(): PolicyEvent[] {
  return [...events].sort(byDateDesc);
}

export function getEventById(id: string): PolicyEvent | undefined {
  return events.find((e) => e.id === id);
}

export function getEventsByMaterial(materialId: string): PolicyEvent[] {
  return getAllEvents().filter((e) => e.affectedMaterialIds.includes(materialId));
}

export function getEventsByActor(actor: JurisdictionCode): PolicyEvent[] {
  return getAllEvents().filter((e) => e.jurisdiction === actor);
}

/** Other events touching at least one of the same materials (excludes self). */
export function getRelatedEvents(event: PolicyEvent, limit = 6): PolicyEvent[] {
  const materialSet = new Set(event.affectedMaterialIds);
  return getAllEvents()
    .filter(
      (e) => e.id !== event.id && e.affectedMaterialIds.some((m) => materialSet.has(m)),
    )
    .slice(0, limit);
}

// --- Framing claims ---------------------------------------------------------

export function getAllFramingClaims(): FramingClaim[] {
  return framing;
}

export function getFramingByEvent(eventId: string): FramingClaim[] {
  return framing.filter((f) => f.eventId === eventId);
}

export function getFramingByCategory(category: FramingCategory): FramingClaim[] {
  return framing.filter((f) => f.category.includes(category));
}

/** All framing claims grouped by category, in the canonical category order. */
export function getFramingGroupedByCategory(): { category: FramingCategory; claims: FramingClaim[] }[] {
  const map = new Map<FramingCategory, FramingClaim[]>();
  for (const claim of framing) {
    for (const category of claim.category) {
      const list = map.get(category) ?? [];
      list.push(claim);
      map.set(category, list);
    }
  }
  return [...map.entries()]
    .map(([category, claims]) => ({ category, claims }))
    .sort((a, b) => b.claims.length - a.claims.length);
}

/**
 * Framing categories per event, for browse-level chips and filters. A plain
 * record (serializable across the server → client component boundary), each
 * value the de-duplicated union of the event's claim categories in canonical
 * taxonomy order. Events whose framing has not yet been anchored to a quote
 * are present with an empty array — "not yet coded", never "no framing".
 */
export function getFramingCategoriesByEvent(): Record<string, FramingCategory[]> {
  const out: Record<string, FramingCategory[]> = {};
  for (const e of events) {
    const seen = new Set<FramingCategory>();
    for (const f of framing) if (f.eventId === e.id) f.category.forEach((c) => seen.add(c));
    out[e.id] = FRAMING_CATEGORIES.filter((c) => seen.has(c));
  }
  return out;
}

// --- Materials --------------------------------------------------------------

export function getAllMaterials(): Material[] {
  return [...materials].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}

export function getMaterialBySlug(slug: string): Material | undefined {
  return materials.find((m) => m.slug === slug);
}

export function getMaterialsByIds(ids: string[]): Material[] {
  return ids
    .map((id) => materials.find((m) => m.id === id))
    .filter((m): m is Material => Boolean(m));
}

// --- Jurisdictions ----------------------------------------------------------

export function getAllJurisdictions(): Jurisdiction[] {
  return jurisdictions;
}

export function getJurisdictionByCode(code: string): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.code.toLowerCase() === code.toLowerCase());
}

export function getJurisdictionById(id: string): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.id === id);
}

// --- Sources ----------------------------------------------------------------

export function getAllSources(): Source[] {
  return [...sources].sort((a, b) => a.title.localeCompare(b.title));
}

export function getSourceById(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}

export function getSourcesByIds(ids: string[]): Source[] {
  return ids
    .map((id) => sources.find((s) => s.id === id))
    .filter((s): s is Source => Boolean(s));
}

// --- Watchlist ---------------------------------------------------------------
//
// The input side of the tracker: official sources under standing review.
// Watching a source is a statement about the project's own review routine, not
// a claim about the source's contents — nothing here asserts that a measure
// exists, or that none does. Loaders deliberately expose `lastCheckedAt` as it
// is stored (null included) so a page can say "not yet checked in a published
// review cycle" rather than imply freshness the project cannot evidence.

export function getAllWatchedSources(): WatchedSource[] {
  return [...watchlist].sort((a, b) => a.title.localeCompare(b.title));
}

export function getWatchedSourceById(id: string): WatchedSource | undefined {
  return watchlist.find((w) => w.id === id);
}

/**
 * Active watched sources grouped by jurisdiction, in canonical taxonomy order.
 * Jurisdictions with no active watched source are returned with an empty array
 * rather than omitted — a coverage gap is information, and hiding it would let
 * the page read as fuller coverage than the project actually maintains. Paused
 * and retired sources are excluded here; `getAllWatchedSources` still has them.
 */
export function getWatchedSourcesByJurisdiction(): {
  jurisdiction: JurisdictionCode;
  sources: WatchedSource[];
}[] {
  const present = new Set(jurisdictions.map((j) => j.id));
  const cols = JURISDICTIONS.filter((j) => present.has(j)) as JurisdictionCode[];
  return cols.map((jurisdiction) => ({
    jurisdiction,
    sources: getAllWatchedSources().filter(
      (w) => w.jurisdiction === jurisdiction && w.status === "active",
    ),
  }));
}

// --- Capital & Control (v0.5) -------------------------------------------------
//
// Financial commitments ("fin-...") and control measures ("ctl-...") are child
// rows of an event: the separate instruments and operative clauses one
// announcement contains. Derived figures live in lib/capital-control.ts.
// Lists are ordered by id with a plain code-point comparison, so the order
// depends on neither seed-file order nor the runtime's locale.

const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function getAllFinancialCommitments(): FinancialCommitment[] {
  return [...financialCommitments].sort(byId);
}

export function getFinancialCommitmentById(id: string): FinancialCommitment | undefined {
  return financialCommitments.find((c) => c.id === id);
}

/**
 * Commitments announced in, or cited by, one event. A commitment's parent
 * envelope can sit in a different event, so this is not the whole family tree.
 */
export function getFinancialCommitmentsByEvent(eventId: string): FinancialCommitment[] {
  return getAllFinancialCommitments().filter((c) => c.eventId === eventId);
}

export function getAllControlMeasures(): ControlMeasure[] {
  return [...controlMeasures].sort(byId);
}

export function getControlMeasureById(id: string): ControlMeasure | undefined {
  return controlMeasures.find((m) => m.id === id);
}

/** The operative clauses of one event, one row per clause with its own status history. */
export function getControlMeasuresByEvent(eventId: string): ControlMeasure[] {
  return getAllControlMeasures().filter((m) => m.eventId === eventId);
}

// --- Capital intelligence registries (v0.6) --------------------------------------
//
// Organizations ("org-"), projects ("prj-"), programmes ("prg-") and project
// designations ("dsg-"). Money stays on the financial rows; everything derived
// from these links lives in lib/capital-intelligence.ts.

export function getAllOrganizations(): Organization[] {
  return [...organizations].sort(byId);
}

export function getOrganizationById(id: string): Organization | undefined {
  return organizations.find((o) => o.id === id);
}

export function getAllProjects(): Project[] {
  return [...projects].sort(byId);
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getAllProgrammes(): Programme[] {
  return [...programmes].sort(byId);
}

export function getProgrammeById(id: string): Programme | undefined {
  return programmes.find((g) => g.id === id);
}

export function getAllProjectDesignations(): ProjectDesignation[] {
  return [...projectDesignations].sort(byId);
}

export function getProjectDesignationById(id: string): ProjectDesignation | undefined {
  return projectDesignations.find((d) => d.id === id);
}

/** The designations one event recognizes. */
export function getProjectDesignationsByEvent(eventId: string): ProjectDesignation[] {
  return getAllProjectDesignations().filter((d) => d.eventId === eventId);
}

// --- Aggregate counts (for the homepage / headers) --------------------------

export function getDatasetSummary() {
  return {
    events: events.length,
    framingClaims: framing.length,
    materials: materials.length,
    jurisdictions: jurisdictions.length,
    sources: sources.length,
    financialCommitments: financialCommitments.length,
    controlMeasures: controlMeasures.length,
    organizations: organizations.length,
    projects: projects.length,
    programmes: programmes.length,
    projectDesignations: projectDesignations.length,
  };
}

/**
 * The dataset's evidentiary footprint: what is coded, how well it is anchored
 * to sources and framing, and where coverage is uneven — derived entirely
 * from `getCoverageReport()` (the single computation over the seed) and
 * reshaped into the exact breakdown the coverage page and its tests expect.
 * No field here is a synthetic score; every share carries its denominator.
 */
export type EvidenceSummary = {
  totals: {
    events: number;
    framingClaims: number;
    materials: number;
    jurisdictions: number;
    sources: number;
  };
  primarySources: Share;
  averageSourcesPerEvent: number;
  framingCoverage: Share;
  dateWindow: { earliest: string; latest: string };
  byJurisdiction: {
    jurisdiction: JurisdictionCode;
    /** Lowercase two-letter actor route segment, from `jurisdictionShort`. */
    code: string;
    events: number;
    framingCoverage: Share;
    linkedSources: number;
    primaryLinkedSources: number;
  }[];
  byMechanism: { mechanism: Mechanism; count: number }[];
  bySourceConfidence: { confidence: SourceConfidence; count: number }[];
  /** Event IDs whose `titleOriginal` is still the literal "Not yet coded". */
  notYetCodedTitleEventIds: string[];
};

export function getEvidenceSummary(): EvidenceSummary {
  const r = getCoverageReport();
  return {
    totals: {
      events: r.totals.events,
      framingClaims: r.totals.framingClaims,
      materials: r.totals.materials,
      jurisdictions: r.totals.jurisdictions,
      sources: r.totals.sources,
    },
    primarySources: r.sources.primary,
    averageSourcesPerEvent: r.evidence.averageLinkedSourcesPerEvent,
    framingCoverage: r.evidence.withFraming,
    dateWindow: r.evidence.dateWindow,
    byJurisdiction: r.actors.map((a) => ({
      jurisdiction: a.jurisdiction,
      code: a.code,
      events: a.events,
      framingCoverage: a.framingAnchored,
      linkedSources: a.linkedSources,
      primaryLinkedSources: a.primaryLinkedSources,
    })),
    byMechanism: r.mechanisms,
    bySourceConfidence: r.sources.byConfidence,
    notYetCodedTitleEventIds: r.evidence.notYetCodedTitleEventIds,
  };
}

// --- Comparative control matrix ---------------------------------------------
//
// A purely derived cross-tab of material (rows) × jurisdiction (columns). Each
// cell counts the coded events in which that jurisdiction acted on that
// material and collects the mechanisms and latest date. No new classification
// is introduced — it only aggregates existing coded fields.

export type MatrixCell = {
  count: number;
  mechanisms: Mechanism[];
  latestDate: string | null;
  eventIds: string[];
};

export type MatrixRow = {
  material: Material;
  byJurisdiction: Record<JurisdictionCode, MatrixCell>;
  total: number;
};

const emptyCell = (): MatrixCell => ({ count: 0, mechanisms: [], latestDate: null, eventIds: [] });

export function getControlMatrix(): {
  jurisdictions: JurisdictionCode[];
  rows: MatrixRow[];
  columnTotals: Record<JurisdictionCode, number>;
} {
  const present = new Set(jurisdictions.map((j) => j.id));
  // Meaningful, stable column order (the control actor first), taxonomy-driven.
  const cols = JURISDICTIONS.filter((j) => present.has(j)) as JurisdictionCode[];

  const rows: MatrixRow[] = getAllMaterials().map((material) => {
    const byJurisdiction = Object.fromEntries(cols.map((j) => [j, emptyCell()])) as Record<
      JurisdictionCode,
      MatrixCell
    >;
    for (const e of getEventsByMaterial(material.id)) {
      const cell = byJurisdiction[e.jurisdiction];
      if (!cell) continue;
      cell.count++;
      cell.eventIds.push(e.id);
      for (const m of e.mechanism) if (!cell.mechanisms.includes(m)) cell.mechanisms.push(m);
      if (!cell.latestDate || e.date > cell.latestDate) cell.latestDate = e.date;
    }
    const total = cols.reduce((sum, j) => sum + byJurisdiction[j].count, 0);
    return { material, byJurisdiction, total };
  });

  // Most-contested materials first; ties broken alphabetically.
  rows.sort((a, b) => b.total - a.total || a.material.nameEn.localeCompare(b.material.nameEn));

  const columnTotals = Object.fromEntries(
    cols.map((j) => [j, rows.reduce((sum, r) => sum + r.byJurisdiction[j].count, 0)]),
  ) as Record<JurisdictionCode, number>;

  return { jurisdictions: cols, rows, columnTotals };
}
