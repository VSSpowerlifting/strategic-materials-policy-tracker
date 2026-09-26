/**
 * The review ledger for the editorial notes kept from the earlier material page. It is the only gate on those
 * notes: a field appears on a dossier only when its entry here says `show: true` and passes `renderableNote`.
 * The default is omit, so a missing entry, a stale entry and an entry that fails any check all leave the field out.
 * Verification is claim by claim, against a coded record or against the complete original of a registry source
 * that was actually read; a summary or a compressed copy of a source never counts. Nothing here inspects what a
 * note says: a claim that has not been checked is omitted whatever its wording, and one that has been checked
 * is shown whatever its wording. The seed text is never edited, trimmed or reworded.
 */
import {
  getAllMaterials,
  getControlMeasureById,
  getEventById,
  getFinancialCommitmentById,
  getOrganizationById,
  getProgrammeById,
  getProjectById,
  getProjectDesignationById,
  getSourceById,
} from "./data";
import type { Material } from "./types";

export const NOTE_FIELDS = ["statusSummary", "chinaPositionNote", "diversificationNote"] as const;
export type NoteField = (typeof NOTE_FIELDS)[number];

/** One thing a sentence was checked against: a coded record already in the seed, or a registry source read in full. */
export type Evidence = {
  kind: "record" | "source";
  id: string;
  /** The located passage, section, table or field. Never empty. */
  locator: string;
  /** For a source: the date the complete original was read. */
  readOn?: string;
};

export type Claim = { sentence: string; evidence: Evidence[] };

export type LedgerEntry =
  | { show: true; verifiedText: string; claims: Claim[]; checkedOn: string }
  | { show: false; reason: "unverified" | "mismatch" };

export type Ledger = Record<string, Partial<Record<NoteField, LedgerEntry>>>;

const UNVERIFIED = { show: false, reason: "unverified" } as const;
const allUnverified = { statusSummary: UNVERIFIED, chinaPositionNote: UNVERIFIED, diversificationNote: UNVERIFIED };

/**
 * Nothing in this ledger has been verified yet, so every field is omitted. A field enters as `show: true` only
 * when the sentences were checked against records or complete originals that were read, and the report of that
 * check names each one.
 *
 * What was checked on 2026-09-26, and why nothing entered:
 * - Every `statusSummary` holds at least one sentence that no coded record states, so the whole field fails: a
 *   characterization ("The spine of the contest.", "A hard-metal and defense material.", "A semiconductor chokepoint
 *   material.") or a technical claim (dysprosium's "critical for traction motors and defense actuators"). Where a
 *   first sentence is a coded fact (dysprosium and terbium: named in China's 4 April 2025 controls), a later sentence
 *   still fails.
 * - `src-usgs-news-2025`, the only USGS source in the registry, was read in full (the page's main text). It
 *   announces the 2025 List of Critical Minerals and states no China share for tungsten, gallium, germanium,
 *   graphite or antimony. Its one figure, that the United States imported 80% of the rare earth elements it used in
 *   2024, is a different claim from the tungsten note's "roughly 80% of global tungsten supply". The tungsten and
 *   gallium figures therefore stay unverified: the commodity-statistics document they cite is not in the registry.
 * - `src-iea-critical-minerals` (Global Critical Minerals Outlook 2024) was not read in full, so the rare earth
 *   and NdFeB shares and the IEA concentration wording stay unverified.
 */
export const LEDGER: Ledger = {
  antimony: allUnverified,
  dysprosium: allUnverified,
  gallium: allUnverified,
  germanium: allUnverified,
  graphite: allUnverified,
  "ndfeb-magnets": allUnverified,
  neodymium: allUnverified,
  praseodymium: allUnverified,
  "rare-earth-elements": allUnverified,
  terbium: allUnverified,
  tungsten: allUnverified,
};

const isDate = (s: unknown): s is string => typeof s === "string" && s.length === 10 && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

/** Whether a record id resolves through the seed loaders. A private draft id never does, and is refused outright. */
export function recordResolves(id: string): boolean {
  if (id.startsWith("cand-")) return false;
  return [getEventById, getFinancialCommitmentById, getControlMeasureById, getProjectDesignationById, getProjectById, getProgrammeById, getOrganizationById].some((load) => load(id) !== undefined);
}

function evidenceResolves(e: Evidence): boolean {
  if (e.id.startsWith("cand-")) return false;
  if (typeof e.locator !== "string" || e.locator.trim() === "") return false;
  if (e.kind === "record") return recordResolves(e.id);
  if (e.kind === "source") return getSourceById(e.id) !== undefined && isDate(e.readOn);
  return false;
}

/** Why an entry would not render against a seed text, or null when it passes every check. */
export function ledgerFailure(entry: LedgerEntry | undefined, seedText: string): string | null {
  if (!entry || entry.show !== true) return "no entry that says show";
  if (entry.verifiedText !== seedText) return "verified text differs from the current seed text";
  if (entry.claims.length === 0 || entry.claims.map((c) => c.sentence).join(" ") !== entry.verifiedText) return "claims do not cover the verified text";
  if (!isDate(entry.checkedOn)) return "no checked-on date";
  for (const claim of entry.claims) if (!claim.evidence.some(evidenceResolves)) return `no resolving evidence for: ${claim.sentence}`;
  return null;
}

/**
 * The only path to the notes section. Returns the seed text verbatim when the field's ledger entry passes every
 * check, and null otherwise. `ledger` and `materials` are arguments so a test can supply fixtures.
 */
export function renderableNote(slug: string, field: NoteField, ledger: Ledger = LEDGER, materials: readonly Material[] = getAllMaterials()): string | null {
  const material = materials.find((m) => m.slug === slug);
  const text = material?.[field];
  if (typeof text !== "string" || text === "") return null;
  return ledgerFailure(ledger[slug]?.[field], text) === null ? text : null;
}
