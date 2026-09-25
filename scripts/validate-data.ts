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
 *  - the Capital & Control seeds (financial commitments, control measures)
 *    pass scripts/validate-capital-control.ts
 *
 * Exits non-zero on any error so it can gate CI / pre-deploy.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  CANDIDATE_STATUSES,
  CONFIDENCE_LEVELS,
  EN_SOURCES,
  FRAMING_CATEGORIES,
  INTAKE_MODES,
  JURISDICTIONS,
  JURISDICTION_ROLES,
  MECHANISMS,
  POLICY_STATUSES,
  REVIEW_VERDICTS,
  SECTORS,
  SOURCE_CONFIDENCE,
  SOURCE_LANGS,
  SOURCE_TYPES,
  TITLE_LANGS,
  VERIFICATION_STATUSES,
  WATCH_CADENCES,
  WATCH_STATUSES,
  type CandidateRecord,
  type FramingClaim,
  type Jurisdiction,
  type Material,
  type PolicyEvent,
  type Source,
  type WatchedSource,
} from "../lib/types";
import { site } from "../lib/site";
import { isExampleCandidateFile } from "./candidate-files";
import { formatCapitalControlIssue, parseCapitalControlSeed, validateCapitalControl } from "./validate-capital-control";
import type { CapitalControlCollection } from "./validate-capital-control";

const seedDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "seed");
const read = <T>(name: string): T => JSON.parse(readFileSync(join(seedDir, `${name}.json`), "utf8")) as T;

const events = read<PolicyEvent[]>("events");
const framing = read<FramingClaim[]>("framing");
const materials = read<Material[]>("materials");
const jurisdictions = read<Jurisdiction[]>("jurisdictions");
const sources = read<Source[]>("sources");
const watchlist = read<WatchedSource[]>("watchlist");

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
const sourceById = new Map(sources.map((s) => [s.id, s]));
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

  // An empty material scope is legitimate and deliberate for framework
  // instruments — an export-control statute or an enabling act names no
  // material, and inferring one from the announcements issued under it would
  // put a claim in the record that the source does not make. It warns rather
  // than errors so the distinction stays visible: the reviewer should be able
  // to tell "this instrument names no material" from "nobody has coded it yet".
  if (!e.affectedMaterialIds || e.affectedMaterialIds.length === 0)
    warn(`${at}: has no affectedMaterialIds — confirm the instrument genuinely names no material`);

  // Superseded resolution
  if (e.supersededByEventId != null && !eventIds.has(e.supersededByEventId))
    err(`${at}: supersededByEventId "${e.supersededByEventId}" does not resolve`);

  if (!e.titleOriginal?.trim()) err(`${at}: titleOriginal is empty`);
  if (!e.titleEn?.trim()) err(`${at}: titleEn is empty`);

  // --- Verification standing, lifecycle and intake --------------------------

  if (!inSet(VERIFICATION_STATUSES, e.verificationStatus))
    err(`${at}: verificationStatus "${e.verificationStatus}" not set / not in allowed set`);
  if (!inSet(INTAKE_MODES, e.intakeMode))
    err(`${at}: intakeMode "${e.intakeMode}" not set / not in allowed set`);

  // The official-primary rule. "Verified" means the record rests on a
  // government document in its own right — both primary confidence AND an
  // official source type. A company press release marked primary does not
  // qualify, and neither does a third-party translation of an official text.
  // Applies to every event, backfills included.
  const hasOfficialPrimary = (e.sourceIds ?? []).some((sid) => {
    const s = sourceById.get(sid);
    return s?.confidence === "primary" && s?.sourceType === "official";
  });
  if (e.verificationStatus === "verified" && !hasOfficialPrimary)
    err(
      `${at}: verificationStatus is "verified" but no source is both confidence:"primary" and sourceType:"official"`,
    );
  if (e.verificationStatus === "provisional" && hasOfficialPrimary)
    warn(`${at}: marked "provisional" but an official primary source resolves — should it be verified?`);

  const lc = e.lifecycle;
  if (!lc || typeof lc !== "object") {
    err(`${at}: lifecycle block is missing`);
  } else {
    const isoOrNull = (v: unknown, field: string) => {
      if (v === null) return null;
      if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        err(`${at}: lifecycle.${field} must be an ISO yyyy-mm-dd date or null (got ${JSON.stringify(v)})`);
        return null;
      }
      return v;
    };
    const official = isoOrNull(lc.officialPublicationDate, "officialPublicationDate");
    const discovered = isoOrNull(lc.discoveredAt, "discoveredAt");
    const verified = isoOrNull(lc.verifiedAt, "verifiedAt");
    const published = isoOrNull(lc.publishedAt, "publishedAt");

    // Ordering within the tracker's own workflow is an error; a discovery that
    // precedes official publication is legitimate (a proposal can be tracked
    // before it is promulgated), so that one only warns.
    const order: [string, string | null, string, string | null][] = [
      ["discoveredAt", discovered, "verifiedAt", verified],
      ["verifiedAt", verified, "publishedAt", published],
      ["discoveredAt", discovered, "publishedAt", published],
    ];
    for (const [aName, aVal, bName, bVal] of order)
      if (aVal && bVal && aVal > bVal) err(`${at}: lifecycle.${aName} (${aVal}) is after lifecycle.${bName} (${bVal})`);
    if (official && discovered && official > discovered)
      warn(`${at}: lifecycle.officialPublicationDate (${official}) is after discoveredAt (${discovered})`);

    // A monitored record is the unit the timeliness metric is computed from, so
    // it must be complete and verified. Backfills may leave dates null.
    //
    // publishedAt is the exception, and deliberately so. Promotion merges a
    // record into the seed; publication is the deploy that makes it readable
    // (see data/candidates/README.md, "Carrying the lifecycle through
    // promotion"). Between those two moments a monitored record legitimately
    // has publishedAt null, and requiring it here would force the date to be
    // invented at promotion — the precise failure the candidate-side rule
    // below guards against.
    //
    // The invariant that actually matters is that the metric's inputs are
    // complete whenever the metric is live, and `site.monitoringStartedAt` is
    // what makes it live. So publishedAt is required only once that is set.
    if (e.intakeMode === "monitored") {
      if (e.verificationStatus !== "verified")
        err(`${at}: intakeMode "monitored" requires verificationStatus "verified"`);
      for (const [field, value] of [
        ["officialPublicationDate", official],
        ["discoveredAt", discovered],
        ["verifiedAt", verified],
      ] as const)
        if (!value) err(`${at}: intakeMode "monitored" requires lifecycle.${field}`);
      if (!published && site.monitoringStartedAt)
        err(
          `${at}: intakeMode "monitored" requires lifecycle.publishedAt once site.monitoringStartedAt is set (${site.monitoringStartedAt})`,
        );
      if (published && !site.monitoringStartedAt)
        warn(
          `${at}: lifecycle.publishedAt is set but site.monitoringStartedAt is null — they belong to the same release`,
        );
    }
  }
}

// --- Watchlist --------------------------------------------------------------
//
// The input side of the tracker: official sources under standing review.
// Watching a source implies no claim about it, so these entries are validated
// for structure and resolution only — never for evidentiary weight.

assertUnique("watchlist", watchlist.map((w) => w.id));

const watchedJurisdictions = new Set<string>();

for (const w of watchlist) {
  const at = `watchlist "${w.id}"`;

  if (!inSet(JURISDICTIONS, w.jurisdiction)) err(`${at}: jurisdiction "${w.jurisdiction}" not in allowed set`);
  if (!inSet(SOURCE_TYPES, w.sourceType)) err(`${at}: sourceType "${w.sourceType}" not in allowed set`);
  if (!inSet(SOURCE_LANGS, w.language)) err(`${at}: language "${w.language}" not in allowed set`);
  if (!inSet(WATCH_CADENCES, w.cadence)) err(`${at}: cadence "${w.cadence}" not in allowed set`);
  if (!inSet(WATCH_STATUSES, w.status)) err(`${at}: status "${w.status}" not in allowed set`);

  if (!w.issuingBody?.trim()) err(`${at}: issuingBody is empty`);
  if (!w.title?.trim()) err(`${at}: title is empty`);
  if (!/^https?:\/\//.test(w.url ?? "")) err(`${at}: url must be an absolute http(s) URL`);

  for (const mid of w.materialIds ?? []) if (!materialIds.has(mid)) err(`${at}: materialId "${mid}" does not resolve`);
  for (const m of w.mechanisms ?? []) if (!inSet(MECHANISMS, m)) err(`${at}: mechanism "${m}" not in allowed set`);

  // A check cannot have happened after the last published release: the
  // watchlist ships with the site, so a later date would assert a review the
  // public build cannot contain.
  if (w.lastCheckedAt !== null) {
    if (typeof w.lastCheckedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(w.lastCheckedAt))
      err(`${at}: lastCheckedAt must be an ISO yyyy-mm-dd date or null`);
    else if (w.lastCheckedAt > site.lastUpdated)
      err(`${at}: lastCheckedAt (${w.lastCheckedAt}) postdates site.lastUpdated (${site.lastUpdated})`);
  }

  if (w.status === "active") watchedJurisdictions.add(w.jurisdiction);
}

// Coverage gap: a jurisdiction we publish events for, with nothing under watch.
for (const j of new Set(events.map((e) => e.jurisdiction)))
  if (!watchedJurisdictions.has(j))
    warn(`watchlist: jurisdiction "${j}" has published events but no active watched source`);

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

// Normalize a URL for duplicate detection: trim and drop a single trailing slash
// (protocol/case are left intact so genuinely distinct URLs are not merged).
const normalizeUrl = (u: string): string => u.trim().replace(/\/+$/, "");

const urlSeen = new Map<string, string>(); // normalized url -> first source id

for (const s of sources) {
  const at = `source "${s.id}"`;
  if (!inSet(SOURCE_TYPES, s.sourceType)) err(`${at}: sourceType "${s.sourceType}" not in allowed set`);
  if (!inSet(SOURCE_CONFIDENCE, s.confidence)) err(`${at}: confidence "${s.confidence}" not in allowed set`);
  if (!inSet(SOURCE_LANGS, s.language)) err(`${at}: language "${s.language}" not in allowed set`);
  if (!s.url?.startsWith("http")) err(`${at}: url "${s.url}" is not an absolute URL`);
  if (!s.dateAccessed?.trim()) err(`${at}: dateAccessed is empty`);
  if (s.datePublished != null && s.datePublished !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(s.datePublished))
    err(`${at}: datePublished "${s.datePublished}" is not an ISO yyyy-mm-dd`);

  // Reject duplicate source URLs.
  if (s.url) {
    const key = normalizeUrl(s.url);
    const prev = urlSeen.get(key);
    if (prev) err(`${at}: duplicate source url "${s.url}" (already used by source "${prev}")`);
    else urlSeen.set(key, s.id);
  }
}

// --- Coverage warnings (non-fatal) ------------------------------------------

for (const e of events) {
  if (getFraming(e.id).length === 0) warn(`event "${e.id}" has no framing claims yet (framing: Not yet coded)`);
}
function getFraming(eventId: string) {
  return framing.filter((f) => f.eventId === eventId);
}

// --- Back-reference consistency ---------------------------------------------
//
// material.eventIds and jurisdiction.eventIds are hand-maintained indexes. They
// must stay in exact sync with the events' affectedMaterialIds / jurisdiction,
// or pages and the /compare matrix will show a stale or missing cross-reference.
// (getEventsByMaterial / getEventsByActor derive from the event side, so drift
// here is silent without this check.)

for (const m of materials) {
  const derived = new Set(events.filter((e) => e.affectedMaterialIds.includes(m.id)).map((e) => e.id));
  const listed = new Set(m.eventIds);
  for (const id of derived)
    if (!listed.has(id)) err(`material "${m.id}": eventIds is missing "${id}" (that event lists this material in affectedMaterialIds)`);
  for (const id of listed)
    if (!derived.has(id)) err(`material "${m.id}": eventIds has stale "${id}" (that event does not list this material)`);
}

for (const j of jurisdictions) {
  const derived = new Set(events.filter((e) => e.jurisdiction === j.id).map((e) => e.id));
  const listed = new Set(j.eventIds);
  for (const id of derived)
    if (!listed.has(id)) err(`jurisdiction "${j.id}": eventIds is missing "${id}" (that event's jurisdiction is "${j.id}")`);
  for (const id of listed)
    if (!derived.has(id)) err(`jurisdiction "${j.id}": eventIds has stale "${id}" (that event is not in "${j.id}")`);
}

// --- Candidate records (private / pre-publication) --------------------------
//
// Candidates are drafts and must never reach public output. Here we (1) validate
// their shape/statuses, (2) reject id collisions with published records and
// duplicate candidate ids/urls, and (3) prove the build graph cannot import them.

const candidatesDir = join(seedDir, "..", "candidates");

function loadCandidateFiles(): { file: string; records: CandidateRecord[] }[] {
  if (!existsSync(candidatesDir)) return [];
  const out: { file: string; records: CandidateRecord[] }[] = [];
  for (const name of readdirSync(candidatesDir)) {
    if (!name.endsWith(".json")) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(join(candidatesDir, name), "utf8"));
    } catch (e) {
      err(`candidates: "${name}" is not valid JSON (${(e as Error).message})`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      err(`candidates: "${name}" must be a JSON array of candidate records`);
      continue;
    }
    out.push({ file: name, records: parsed as CandidateRecord[] });
  }
  return out;
}

// Every published id — no candidate may reuse any of these.
const publishedIds = new Set<string>([
  ...events.map((e) => e.id),
  ...framing.map((f) => f.id),
  ...materials.map((m) => m.id),
  ...materials.map((m) => m.slug),
  ...jurisdictions.map((j) => j.id),
  ...sources.map((s) => s.id),
]);

const candidateIdSeen = new Map<string, string>();
let candidateCount = 0;
let exampleCandidateCount = 0;
const candidateFiles = loadCandidateFiles();

for (const { file, records } of candidateFiles) {
  const isExample = isExampleCandidateFile(file);
  for (const c of records) {
    if (isExample) exampleCandidateCount++;
    else candidateCount++;
    const cid = c?.candidateId;
    const at = `candidate "${cid ?? "(missing id)"}" (${file})`;

    if (!cid || !cid.trim()) {
      err(`${at}: candidateId is empty`);
      continue;
    }
    if (candidateIdSeen.has(cid)) err(`${at}: duplicate candidateId (also in "${candidateIdSeen.get(cid)}")`);
    else candidateIdSeen.set(cid, file);
    if (publishedIds.has(cid))
      err(`${at}: candidateId collides with a published id — candidates must use a separate namespace`);

    if (!inSet(CANDIDATE_STATUSES, String(c.status))) err(`${at}: status "${c.status}" not in allowed set`);
    if (!c.createdAt || !/^\d{4}-\d{2}-\d{2}/.test(String(c.createdAt))) err(`${at}: createdAt must be an ISO date`);
    if (!inSet(REVIEW_VERDICTS, String(c.verification?.verdict))) err(`${at}: verification.verdict missing or not in allowed set`);
    if (!inSet(CONFIDENCE_LEVELS, String(c.classification?.confidence))) err(`${at}: classification.confidence must be high/medium/low`);
    if (typeof c.promotion?.promoted !== "boolean") err(`${at}: promotion.promoted (boolean) is required`);

    const pe = (c.proposedEvent ?? {}) as Partial<PolicyEvent>;
    if (!inSet(JURISDICTIONS, String(pe.jurisdiction))) err(`${at}: proposedEvent.jurisdiction missing or not in allowed set`);
    if (!pe.titleOriginal?.trim() && !pe.titleEn?.trim()) err(`${at}: proposedEvent needs a title (titleOriginal or titleEn)`);
    if (pe.date != null && pe.date !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(pe.date)) err(`${at}: proposedEvent.date "${pe.date}" is not an ISO yyyy-mm-dd`);
    if (pe.policyStatus != null && !inSet(POLICY_STATUSES, pe.policyStatus)) err(`${at}: proposedEvent.policyStatus "${pe.policyStatus}" not in allowed set`);
    for (const m of pe.mechanism ?? []) if (!inSet(MECHANISMS, m)) err(`${at}: proposedEvent.mechanism "${m}" not in allowed set`);
    for (const s of pe.affectedSectors ?? []) if (!inSet(SECTORS, s)) err(`${at}: proposedEvent.sector "${s}" not in allowed set`);

    // Proposed sources: absolute urls, unique ids + urls within the candidate.
    const candSourceIds = new Set<string>();
    const candUrlSeen = new Map<string, string>();
    for (const s of c.proposedSources ?? []) {
      const sat = `${at} proposedSource "${s?.id ?? "(missing id)"}"`;
      if (!s.id?.trim()) err(`${sat}: id is empty`);
      else if (candSourceIds.has(s.id)) err(`${sat}: duplicate proposedSource id`);
      else candSourceIds.add(s.id);
      if (publishedIds.has(String(s.id))) err(`${sat}: proposedSource id collides with a published id`);
      if (!s.url?.startsWith("http")) err(`${sat}: url "${s.url}" is not an absolute URL`);
      else {
        const k = normalizeUrl(s.url);
        if (candUrlSeen.has(k)) err(`${sat}: duplicate proposedSource url "${s.url}"`);
        else candUrlSeen.set(k, s.id ?? "");
      }
    }

    for (const f of c.proposedFraming ?? [])
      for (const cat of f.category ?? [])
        if (!inSet(FRAMING_CATEGORIES, cat)) err(`${at}: proposedFraming category "${cat}" not in allowed set`);
    for (const cat of c.classification?.proposedFramingCategories ?? [])
      if (!inSet(FRAMING_CATEGORIES, cat)) err(`${at}: classification.proposedFramingCategories "${cat}" not in allowed set`);

    // Strict requirements once a candidate is verified or promoted.
    if (c.status === "verified" || c.status === "promoted") {
      const need = (cond: boolean, msg: string) => {
        if (!cond) err(`${at}: ${msg} (required for status "${c.status}")`);
      };
      need(!!pe.issuingBody?.trim(), "proposedEvent.issuingBody is empty");
      need(!!pe.titleOriginal?.trim(), "proposedEvent.titleOriginal is empty");
      need(inSet(TITLE_LANGS, String(pe.titleOriginalLang)), "proposedEvent.titleOriginalLang not in allowed set");
      need(!!pe.titleEn?.trim(), "proposedEvent.titleEn is empty");
      need(inSet(EN_SOURCES, String(pe.titleEnSource)), "proposedEvent.titleEnSource not in allowed set");
      need(inSet(POLICY_STATUSES, String(pe.policyStatus)), "proposedEvent.policyStatus not in allowed set");
      need(Array.isArray(pe.mechanism) && pe.mechanism.length > 0, "proposedEvent.mechanism is empty");
      need(
        c.verification?.verdict === "verified" || c.verification?.verdict === "verified_with_corrections",
        `verification.verdict is "${c.verification?.verdict}", expected verified/verified_with_corrections`,
      );
      const resolvable = new Set<string>([...sourceIds, ...candSourceIds]);
      const eventSourceIds = pe.sourceIds ?? [];
      need(eventSourceIds.length > 0, "proposedEvent.sourceIds is empty");
      for (const sid of eventSourceIds)
        if (!resolvable.has(sid)) err(`${at}: proposedEvent.sourceId "${sid}" does not resolve to a published or proposed source`);
    }

    // A candidate destined to be a monitored record must carry the lifecycle
    // through promotion. Without this the dates that make the timeliness metric
    // meaningful are lost at exactly the moment the record becomes public.
    if (pe.intakeMode === "monitored") {
      const lc = pe.lifecycle;
      const require = (cond: boolean, msg: string) => {
        if (!cond) err(`${at}: ${msg}`);
      };
      require(pe.verificationStatus === "verified", 'proposedEvent.intakeMode "monitored" requires verificationStatus "verified"');
      require(!!lc?.officialPublicationDate, "proposedEvent.lifecycle.officialPublicationDate is required for a monitored candidate");
      require(!!lc?.discoveredAt, "proposedEvent.lifecycle.discoveredAt is required for a monitored candidate");
      if (c.status === "verified" || c.status === "promoted")
        require(!!lc?.verifiedAt, "proposedEvent.lifecycle.verifiedAt is required once a monitored candidate is verified");

      // publishedAt is the deploy date, not the promotion date. It cannot be
      // known before the record ships, so it must stay null until then.
      if (c.status !== "promoted" && lc?.publishedAt)
        err(`${at}: proposedEvent.lifecycle.publishedAt must stay null until the record is actually published`);

      // The candidate's own bookkeeping and the lifecycle must agree, so the
      // published dates are traceable to the review trail.
      if (lc?.discoveredAt && c.createdAt && lc.discoveredAt !== c.createdAt.slice(0, 10))
        warn(`${at}: lifecycle.discoveredAt (${lc.discoveredAt}) does not match createdAt (${c.createdAt})`);
      if (lc?.verifiedAt && c.verification?.reviewedAt && lc.verifiedAt !== c.verification.reviewedAt.slice(0, 10))
        warn(`${at}: lifecycle.verifiedAt (${lc.verifiedAt}) does not match verification.reviewedAt (${c.verification.reviewedAt})`);
    }

    if (c.status === "promoted") {
      if (!c.promotion?.promoted) err(`${at}: status "promoted" but promotion.promoted is false`);
      if (!c.promotion?.promotedEventId || !eventIds.has(c.promotion.promotedEventId))
        err(`${at}: promotion.promotedEventId must resolve to a published event`);
    }
  }
}

// --- Capital & Control (v0.5) ------------------------------------------------
//
// Financial commitments ("fin-") and control measures ("ctl-") are checked by
// scripts/validate-capital-control.ts, which returns structured issues and never
// exits; this entry point only formats them and owns the exit code. Candidate
// ids and their proposed-source ids are passed in so that no published row can
// reference a private draft.

const capitalControlSeed = (name: CapitalControlCollection) =>
  parseCapitalControlSeed(readFileSync(join(seedDir, `${name}.json`), "utf8"), name);
const commitmentsSeed = capitalControlSeed("financial-commitments");
const controlsSeed = capitalControlSeed("control-measures");
// v0.6 capital-intelligence registries and designations.
const organizationsSeed = capitalControlSeed("organizations");
const projectsSeed = capitalControlSeed("projects");
const programmesSeed = capitalControlSeed("programmes");
const designationsSeed = capitalControlSeed("project-designations");

const candidateReferenceIds = candidateFiles.flatMap(({ records }) =>
  records.flatMap((c) => [
    c?.candidateId,
    ...(Array.isArray(c?.proposedSources) ? c.proposedSources.map((s) => s?.id) : []),
  ]),
);

const capitalControl = validateCapitalControl({
  financialCommitments: commitmentsSeed.records,
  controlMeasures: controlsSeed.records,
  organizations: organizationsSeed.records,
  projects: projectsSeed.records,
  programmes: programmesSeed.records,
  projectDesignations: designationsSeed.records,
  corpus: {
    events,
    sources,
    materials,
    jurisdictions,
    framing,
    watchlist,
    candidateIds: candidateReferenceIds.filter((id): id is string => typeof id === "string" && id.trim() !== ""),
  },
  // The UTC calendar date. Only the review warning for a lapsed "until" depends on it.
  today: new Date().toISOString().slice(0, 10),
});

for (const issue of [
  ...commitmentsSeed.errors,
  ...controlsSeed.errors,
  ...organizationsSeed.errors,
  ...projectsSeed.errors,
  ...programmesSeed.errors,
  ...designationsSeed.errors,
  ...capitalControl.errors,
])
  err(formatCapitalControlIssue(issue));
for (const issue of capitalControl.warnings) warn(formatCapitalControlIssue(issue));

// --- Leak proof: the build graph must not import candidate data -------------
//
// app/, components/ and lib/ are the only inputs to the production build. If any
// of them imported candidate data, private drafts could ship. Strip comments
// (so doc comments that merely mention the path are ignored) and assert that no
// source file references a candidate module/path.

const stripComments = (s: string): string =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const candidateRef = /['"`][^'"`\n]*candidates[^'"`\n]*['"`]/;
const projectRoot = join(seedDir, "..", "..");

function walkSource(dir: string): string[] {
  const full = join(projectRoot, dir);
  if (!existsSync(full)) return [];
  const files: string[] = [];
  const stack = [full];
  while (stack.length) {
    const d = stack.pop()!;
    for (const name of readdirSync(d)) {
      if (name === "node_modules") continue;
      const p = join(d, name);
      if (statSync(p).isDirectory()) stack.push(p);
      else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) files.push(p);
    }
  }
  return files;
}

for (const dir of ["app", "components", "lib"]) {
  for (const file of walkSource(dir)) {
    if (candidateRef.test(stripComments(readFileSync(file, "utf8")))) {
      err(`LEAK: build-graph file "${file.slice(projectRoot.length + 1)}" references candidate data — candidates must stay out of app/components/lib`);
    }
  }
}

// --- Report -----------------------------------------------------------------

const verifiedCount = events.filter((e) => e.verificationStatus === "verified").length;
const monitoredCount = events.filter((e) => e.intakeMode === "monitored").length;
const activeWatched = watchlist.filter((w) => w.status === "active").length;

const exampleNote = exampleCandidateCount
  ? ` (+ ${exampleCandidateCount} example fixture${exampleCandidateCount === 1 ? "" : "s"}, schema-checked, not counted)`
  : "";
const {
  financialCommitments: commitmentCount,
  controlMeasures: controlCount,
  organizations: organizationCount,
  projects: projectCount,
  programmes: programmeCount,
  projectDesignations: designationCount,
} = capitalControl.counts;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const counts =
  `${events.length} events (${verifiedCount} verified · ${events.length - verifiedCount} provisional · ${monitoredCount} monitored) · ` +
  `${framing.length} framing claims · ${materials.length} materials · ${jurisdictions.length} jurisdictions · ` +
  `${sources.length} sources · ` +
  `${commitmentCount} financial commitment${commitmentCount === 1 ? "" : "s"} · ` +
  `${controlCount} control measure${controlCount === 1 ? "" : "s"} · ` +
  `${plural(organizationCount, "organization")} · ${plural(projectCount, "project")} · ` +
  `${plural(programmeCount, "programme")} · ${plural(designationCount, "project designation")} · ` +
  `${activeWatched}/${watchlist.length} watched sources active · ` +
  `${candidateCount} candidate${candidateCount === 1 ? "" : "s"} (private)${exampleNote}`;

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
