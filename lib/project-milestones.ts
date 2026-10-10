/**
 * M3.1 — source-gated project-native execution assertions.
 *
 * This is independent of financial status and financing-row implementation notes.
 * Validation checks the structural evidence contract. Human review of the full
 * original source remains necessary before a published milestone is created.
 */
import {
  EN_SOURCES, PROJECT_MILESTONE_KINDS, PROJECT_MILESTONE_MODES, PROJECT_MILESTONE_SCOPES,
} from "./types";
import type { Project, Source } from "./types";

type ReferenceSource = Pick<Source, "id" | "language" | "confidence" | "datePublished" | "dateAccessed">;
type References = {
  projects: readonly Pick<Project, "id">[];
  sources: readonly ReferenceSource[];
  /** Curated corpus cutoff; not a claim that the source was first known on this date. */
  corpusDate: string;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const nonblank = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const oneOf = (v: unknown, choices: readonly string[]) => typeof v === "string" && choices.includes(v);

/** Reject impossible calendar dates, invalid formatting and out-of-domain years. */
export function isMilestoneIsoDate(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const match = /^(19\d\d|20\d\d|2100)-(\d\d)-(\d\d)$/.exec(v);
  if (!match) return false;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * An epistemic boundary, NOT an event date. Source publication is preferred;
 * when unavailable, source access is merely the earliest documented observation
 * in this registry. A later report must never be backdated to the event date.
 */
export function milestoneEvidenceBoundary(source: ReferenceSource):
  { date: string; basis: "publication" | "access" } | null {
  if (isMilestoneIsoDate(source.datePublished))
    return { date: source.datePublished, basis: "publication" };
  if (isMilestoneIsoDate(source.dateAccessed))
    return { date: source.dateAccessed, basis: "access" };
  return null;
}

export function validateProjectMilestones(input: unknown, refs: References): string[] {
  if (!Array.isArray(input)) return ["project milestones: seed must be an array"];
  const issues: string[] = [];
  const projects = new Set(refs.projects.map((p) => p.id));
  const sources = new Map(refs.sources.map((s) => [s.id, s]));
  const ids = new Set<string>();
  const claims = new Set<string>();
  let previous = "";

  if (!isMilestoneIsoDate(refs.corpusDate)) return ["project milestones: invalid corpus cutoff"];
  for (let i = 0; i < input.length; i++) {
    const m: Record<string, unknown> = isRecord(input[i]) ? input[i] : {};
    const id = nonblank(m.id) ? m.id : "(missing id at index " + i + ")";
    const at = 'milestone "' + id + '": ';
    const fail = (message: string) => issues.push(at + message);

    if (!/^mil-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail("id must use a nonempty canonical mil- prefix");
    if (ids.has(id)) fail("duplicate id");
    ids.add(id);
    if (previous && id <= previous) fail("ids must be strictly ascending");
    previous = id;

    if (!nonblank(m.projectId) || !projects.has(m.projectId)) fail("projectId does not resolve");
    if (!oneOf(m.kind, PROJECT_MILESTONE_KINDS)) fail("kind not in allowed set");
    if (!oneOf(m.claimMode, PROJECT_MILESTONE_MODES)) fail("claimMode must be occurred or planned");
    if (!oneOf(m.scope, PROJECT_MILESTONE_SCOPES)) fail("scope not in allowed set");
    if (m.scope === "whole_project") {
      if (m.scopeAsStated !== null) fail("whole_project requires scopeAsStated: null");
    } else if (!nonblank(m.scopeAsStated)) {
      fail("named facility and funded activity require explicit scopeAsStated");
    }
    if (typeof m.scopeAsStated === "string" && m.scopeAsStated.length > 250)
      fail("scopeAsStated is too long");
    // Completing a grant-funded workstream cannot, on its own, establish
    // completion of an entire industrial undertaking or an operating plant.
    if (m.kind === "funded_activity_completed" && m.scope !== "funded_activity")
      fail("funded_activity_completed requires funded_activity scope");
    if (m.scope === "funded_activity" && m.kind !== "funded_activity_completed")
      fail("funded_activity scope cannot assert facility construction or operation");

    // Issuer-reported construction status is NOT a dated start or completion.
    if (m.kind === "construction_progress_reported") {
      if (m.claimMode !== "occurred")
        fail("construction_progress_reported requires an occurred observation, not a planned target");
      if (m.scope !== "named_facility")
        fail("construction_progress_reported requires named_facility scope");
      if (m.occurredOn !== null)
        fail("construction_progress_reported requires occurredOn: null (the status-report date is not an event date)");
      if (!nonblank(m.note))
        fail("construction_progress_reported requires a scoped status caveat in note");
    }

    if (m.claimMode === "occurred") {
      if (m.targetOn !== null) fail("occurred claim must have targetOn: null");
      if (m.occurredOn !== null && !isMilestoneIsoDate(m.occurredOn))
        fail("occurredOn must be a real ISO date or null");
      if (isMilestoneIsoDate(m.occurredOn) && m.occurredOn > refs.corpusDate)
        fail("occurredOn is after corpus cutoff; planned targets must not be marked occurred");
    } else if (m.claimMode === "planned") {
      if (m.occurredOn !== null) fail("planned claim cannot have occurredOn");
      if (m.targetOn !== null && !isMilestoneIsoDate(m.targetOn))
        fail("targetOn must be a real ISO date or null");
      if (m.kind === "operations_suspended" || m.kind === "project_cancelled")
        fail("planned cessation cannot be represented as an execution milestone");
    }

    const source = nonblank(m.sourceId) ? sources.get(m.sourceId) : undefined;
    if (!source) fail("sourceId does not resolve");
    else if (source.confidence !== "primary")
      fail("published milestone needs a primary-source record, not an unreviewed secondary report");

    if (!nonblank(m.statementOriginal) || m.statementOriginal.length > 600)
      fail("statementOriginal must contain a short genuine anchor (1-600 characters)");
    if (!nonblank(m.statementEn) || m.statementEn.length > 600)
      fail("statementEn must contain a short anchor/translation (1-600 characters)");
    if (!oneOf(m.statementEnSource, EN_SOURCES))
      fail("statementEnSource is invalid");
    if (source?.language === "en" &&
      (m.statementEnSource !== "na" || m.statementOriginal !== m.statementEn))
      fail("English primary passage requires na translation and identical text");
    if (source && source.language !== "en" && source.language !== "bilingual" &&
      m.statementEnSource === "na") fail("non-English source requires translation provenance");

    if (m.locator !== null && (typeof m.locator !== "string" || m.locator.length > 200))
      fail("locator must be a pinpoint string or null");
    if (m.note !== undefined && m.note !== null &&
      (typeof m.note !== "string" || m.note.length > 700)) fail("note is too long or invalid");

    // Review metadata is a required declaration, not automated source verification.
    if (!nonblank(m.reviewedBy) || m.reviewedBy.length > 120)
      fail("reviewedBy is required for published data");
    if (!isMilestoneIsoDate(m.reviewedAt)) fail("reviewedAt must be a real ISO date");
    if (isMilestoneIsoDate(m.reviewedAt) && m.reviewedAt > refs.corpusDate)
      fail("reviewedAt is after corpus cutoff");
    if (isMilestoneIsoDate(m.occurredOn) && isMilestoneIsoDate(m.reviewedAt) &&
      m.occurredOn > m.reviewedAt)
      fail("occurred date is after reviewer date");
    if (source) {
      // Invalid published dates must not fall through to the access-date
      // fallback, which could silently approve a malformed publication claim.
      if (source.datePublished !== null && source.datePublished !== undefined &&
          !isMilestoneIsoDate(source.datePublished))
        fail("source publication date is invalid");
      const boundary = milestoneEvidenceBoundary(source);
      if (!boundary) fail("source has no valid publication/access observation date");
      else {
        if (boundary.date > refs.corpusDate)
          fail("source evidence boundary is after corpus cutoff");
        if (isMilestoneIsoDate(m.reviewedAt) && boundary.date > m.reviewedAt)
          fail("review occurred before source publication/access evidence boundary");
        if (isMilestoneIsoDate(m.occurredOn) && boundary.date < m.occurredOn)
          fail("occurredOn is later than the cited source evidence boundary");
      }
    }
    const signature = JSON.stringify([
      m.projectId, m.kind, m.claimMode, m.scope, m.scopeAsStated, m.sourceId, m.occurredOn, m.targetOn,
    ]);
    if (claims.has(signature)) fail("duplicate assertion identity (multiple financers do not create new milestones)");
    claims.add(signature);
  }
  return issues;
}

