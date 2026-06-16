/**
 * Seed-data validator. Run with: npm run validate
 *
 * Enforces the project's hard rules on the local seed:
 *  - every event resolves to at least one source
 *  - every framing claim carries a non-empty quoted anchor (original + EN) and a resolving source
 *  - no dangling material / jurisdiction / superseded-event references
 *  - unique identifiers
 *  - all categorical labels fall within the allowed sets
 *  - translation provenance is set on every translated field
 *
 * Exits non-zero on any error so it can gate CI / pre-deploy.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  EN_SOURCES,
  FRAMING_CATEGORIES,
  JURISDICTIONS,
  JURISDICTION_ROLES,
  MECHANISMS,
  POLICY_STATUSES,
  SECTORS,
  SOURCE_CONFIDENCE,
  SOURCE_LANGS,
  SOURCE_TYPES,
  TITLE_LANGS,
  type FramingClaim,
  type Jurisdiction,
  type Material,
  type PolicyEvent,
  type Source,
} from "../lib/types";

const seedDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "seed");
const read = <T>(name: string): T => JSON.parse(readFileSync(join(seedDir, `${name}.json`), "utf8")) as T;

const events = read<PolicyEvent[]>("events");
const framing = read<FramingClaim[]>("framing");
const materials = read<Material[]>("materials");
const jurisdictions = read<Jurisdiction[]>("jurisdictions");
const sources = read<Source[]>("sources");

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const inSet = <T extends readonly string[]>(set: T, v: string): boolean =>
  (set as readonly string[]).includes(v);

// --- Unique identifiers -----------------------------------------------------

function assertUnique(label: string, ids: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (!id) err(`${label}: found an empty/missing id`);
    else if (seen.has(id)) err(`${label}: duplicate id "${id}"`);
    seen.add(id);
  }
}

assertUnique("events", events.map((e) => e.id));
assertUnique("framing", framing.map((f) => f.id));
assertUnique("materials (id)", materials.map((m) => m.id));
assertUnique("materials (slug)", materials.map((m) => m.slug));
assertUnique("jurisdictions (id)", jurisdictions.map((j) => j.id));
assertUnique("jurisdictions (code)", jurisdictions.map((j) => j.code));
assertUnique("sources", sources.map((s) => s.id));

// Lookup sets
const sourceIds = new Set(sources.map((s) => s.id));
const materialIds = new Set(materials.map((m) => m.id));
const eventIds = new Set(events.map((e) => e.id));
const jurisdictionIds = new Set(jurisdictions.map((j) => j.id));

// --- Events -----------------------------------------------------------------

for (const e of events) {
  const at = `event "${e.id}"`;

  if (!inSet(JURISDICTIONS, e.jurisdiction)) err(`${at}: jurisdiction "${e.jurisdiction}" not in allowed set`);
  if (!jurisdictionIds.has(e.jurisdiction)) err(`${at}: jurisdiction "${e.jurisdiction}" has no matching record`);
  if (!inSet(POLICY_STATUSES, e.policyStatus)) err(`${at}: policyStatus "${e.policyStatus}" not in allowed set`);
  if (!inSet(TITLE_LANGS, e.titleOriginalLang)) err(`${at}: titleOriginalLang "${e.titleOriginalLang}" not in allowed set`);
  if (!inSet(EN_SOURCES, e.titleEnSource)) err(`${at}: titleEnSource "${e.titleEnSource}" not set / not in allowed set`);

  if (!Array.isArray(e.mechanism) || e.mechanism.length === 0) err(`${at}: at least one mechanism is required`);
  for (const m of e.mechanism) if (!inSet(MECHANISMS, m)) err(`${at}: mechanism "${m}" not in allowed set`);
  for (const s of e.affectedSectors) if (!inSet(SECTORS, s)) err(`${at}: sector "${s}" not in allowed set`);

  // Date sanity
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) err(`${at}: date "${e.date}" is not an ISO yyyy-mm-dd`);

  // Source resolution
  if (!e.sourceIds || e.sourceIds.length === 0) err(`${at}: has no sourceIds`);
  for (const sid of e.sourceIds) if (!sourceIds.has(sid)) err(`${at}: sourceId "${sid}" does not resolve`);

  // Material resolution
  for (const mid of e.affectedMaterialIds) if (!materialIds.has(mid)) err(`${at}: affectedMaterialId "${mid}" does not resolve`);

  // Superseded resolution
  if (e.supersededByEventId != null && !eventIds.has(e.supersededByEventId))
    err(`${at}: supersededByEventId "${e.supersededByEventId}" does not resolve`);

  if (!e.titleOriginal?.trim()) err(`${at}: titleOriginal is empty`);
  if (!e.titleEn?.trim()) err(`${at}: titleEn is empty`);
}

// --- Framing claims ---------------------------------------------------------

for (const f of framing) {
  const at = `framing "${f.id}"`;

  if (!eventIds.has(f.eventId)) err(`${at}: eventId "${f.eventId}" does not resolve`);
  if (!inSet(JURISDICTIONS, f.actor)) err(`${at}: actor "${f.actor}" not in allowed set`);

  if (!Array.isArray(f.category) || f.category.length === 0) err(`${at}: at least one framing category is required`);
  for (const c of f.category) if (!inSet(FRAMING_CATEGORIES, c)) err(`${at}: category "${c}" not in allowed set`);

  // The defining rule: a framing label requires a quoted anchor in both languages.
  if (!f.quoteOriginal?.trim()) err(`${at}: quoteOriginal (the required anchor) is empty`);
  if (!f.quoteEn?.trim()) err(`${at}: quoteEn (the required translation) is empty`);
  if (!inSet(EN_SOURCES, f.quoteEnSource)) err(`${at}: quoteEnSource "${f.quoteEnSource}" not set / not in allowed set`);

  if (!sourceIds.has(f.sourceId)) err(`${at}: sourceId "${f.sourceId}" does not resolve`);
}

// --- Materials --------------------------------------------------------------

for (const m of materials) {
  const at = `material "${m.id}"`;
  if (!m.slug?.trim()) err(`${at}: slug is empty`);
  if (!m.nameEn?.trim()) err(`${at}: nameEn is empty`);
  for (const eid of m.eventIds) if (!eventIds.has(eid)) err(`${at}: eventId "${eid}" does not resolve`);
  for (const sid of m.sourceIds) if (!sourceIds.has(sid)) err(`${at}: sourceId "${sid}" does not resolve`);
}

// --- Jurisdictions ----------------------------------------------------------

for (const j of jurisdictions) {
  const at = `jurisdiction "${j.id}"`;
  if (!inSet(JURISDICTIONS, j.id)) err(`${at}: id "${j.id}" not in allowed jurisdiction set`);
  for (const r of j.roles) if (!inSet(JURISDICTION_ROLES, r)) err(`${at}: role "${r}" not in allowed set`);
  for (const eid of j.eventIds) if (!eventIds.has(eid)) err(`${at}: eventId "${eid}" does not resolve`);
  for (const sid of j.sourceIds) if (!sourceIds.has(sid)) err(`${at}: sourceId "${sid}" does not resolve`);
}

// --- Sources ----------------------------------------------------------------

for (const s of sources) {
  const at = `source "${s.id}"`;
  if (!inSet(SOURCE_TYPES, s.sourceType)) err(`${at}: sourceType "${s.sourceType}" not in allowed set`);
  if (!inSet(SOURCE_CONFIDENCE, s.confidence)) err(`${at}: confidence "${s.confidence}" not in allowed set`);
  if (!inSet(SOURCE_LANGS, s.language)) err(`${at}: language "${s.language}" not in allowed set`);
  if (!s.url?.startsWith("http")) err(`${at}: url "${s.url}" is not an absolute URL`);
  if (!s.dateAccessed?.trim()) err(`${at}: dateAccessed is empty`);
}

// --- Coverage warnings (non-fatal) ------------------------------------------

for (const e of events) {
  if (getFraming(e.id).length === 0) warn(`event "${e.id}" has no framing claims yet (framing: Not yet coded)`);
}
function getFraming(eventId: string) {
  return framing.filter((f) => f.eventId === eventId);
}

// --- Report -----------------------------------------------------------------

const counts = `${events.length} events · ${framing.length} framing claims · ${materials.length} materials · ${jurisdictions.length} jurisdictions · ${sources.length} sources`;

if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`   - ${w}`);
}

if (errors.length) {
  console.error(`\n✗ Validation FAILED with ${errors.length} error(s):`);
  for (const e of errors) console.error(`   - ${e}`);
  console.error(`\n(${counts})\n`);
  process.exit(1);
}

console.log(`\n✓ Validation passed. ${counts}\n`);
