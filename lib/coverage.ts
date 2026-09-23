/**
 * Coverage and data-quality metrics.
 *
 * These are counts of what the database actually contains, not scores. The
 * project's first hard rule is "no synthetic risk scores", and that applies to
 * the tracker's self-description too: nothing here is weighted, normalised or
 * rolled up into a single number, because a single number would invite exactly
 * the comparison the data cannot support.
 *
 * Every metric carries its own denominator. A share whose denominator is zero
 * returns `null` rather than 0 or NaN — "no records to measure" is a different
 * statement from "none of the records qualify", and the UI renders them
 * differently.
 *
 * Pure and deterministic (no wall-clock reads) so the API route that serves
 * these can be prerendered with `dynamic = "force-static"`.
 */
import { FRAMING_CATEGORIES, JURISDICTIONS, MECHANISMS, SOURCE_CONFIDENCE } from "./types";
import type { FramingCategory, JurisdictionCode, Mechanism, SourceConfidence } from "./types";
import {
  getAllEvents,
  getAllFramingClaims,
  getAllJurisdictions,
  getAllMaterials,
  getAllSources,
  getAllWatchedSources,
  getSourcesByIds,
} from "./data";
import { jurisdictionShort } from "./labels";
import { site } from "./site";

export type Share = {
  /** How many records satisfy the property. */
  count: number;
  /** How many records the question was asked of. */
  of: number;
  /** count/of, or null when `of` is 0 — never silently 0. */
  ratio: number | null;
};

export const share = (count: number, of: number): Share => ({
  count,
  of,
  ratio: of === 0 ? null : count / of,
});

/**
 * An event is "primary-anchored" when at least one of its sources is BOTH
 * `confidence: "primary"` and `sourceType: "official"` — the same rule the
 * validator applies to `verificationStatus: "verified"`. A company filing coded
 * `sourceType: "other"` is deliberately not enough on its own here, so this
 * number is stricter than the verified count and can legitimately be lower.
 */
export function isPrimaryAnchored(sourceIds: string[]): boolean {
  return getSourcesByIds(sourceIds).some(
    (s) => s.confidence === "primary" && s.sourceType === "official",
  );
}

export type CoverageReport = {
  totals: {
    events: number;
    framingClaims: number;
    materials: number;
    jurisdictions: number;
    sources: number;
    watchedSources: number;
  };
  evidence: {
    /** Events resolving to an official primary source. */
    primaryAnchored: Share;
    /** Events carrying at least one framing claim. */
    withFraming: Share;
    /** Events whose original-language title has been transcribed. */
    originalTitleCoded: Share;
    /** Events carrying a document number. */
    documentNumbered: Share;
    /** Events coded `verificationStatus: "verified"`. */
    verified: Share;
    /** Events caught prospectively rather than backfilled. */
    monitored: Share;
    /** Mean number of linked sources per event. */
    averageLinkedSourcesPerEvent: number;
    /** Earliest and latest `date` among coded events (ISO, ascending compare). */
    dateWindow: { earliest: string; latest: string };
    /** Event IDs whose `titleOriginal` is still the literal "Not yet coded". */
    notYetCodedTitleEventIds: string[];
  };
  framing: {
    /** Claims anchored to a quote in a language other than English. */
    nonEnglishAnchored: Share;
    /** Claims whose English comes from the issuing government itself. */
    officialTranslation: Share;
    /** Claim count per category, canonical taxonomy order. */
    byCategory: { category: FramingCategory; count: number }[];
  };
  sources: {
    /** Sources classified `confidence: "primary"`, of the whole register. */
    primary: Share;
    /** Source count per confidence tier, hierarchy order. */
    byConfidence: { confidence: SourceConfidence; count: number }[];
    /** Sources not cited by any event, framing claim or jurisdiction. */
    orphaned: string[];
  };
  actors: {
    jurisdiction: JurisdictionCode;
    /** Lowercase two-letter code — the actor route segment (/actors/cn). */
    code: string;
    events: number;
    framingClaims: number;
    primaryAnchored: Share;
    watchedSources: number;
    /** This actor's events carrying at least one framing claim. */
    framingAnchored: Share;
    /** Unique sources linked from this actor's events. */
    linkedSources: number;
    /** Of those linked sources, how many are `confidence: "primary"`. */
    primaryLinkedSources: number;
  }[];
  materials: { id: string; nameEn: string; events: number }[];
  mechanisms: { mechanism: Mechanism; count: number }[];
  /**
   * Timeliness is reported as unavailable rather than as a number. It becomes
   * computable only once monitoring has actually started AND enough monitored
   * records exist for a median to mean anything.
   */
  timeliness: {
    monitoringStartedAt: string | null;
    monitoredRecords: number;
    minimumForMedian: number;
    available: boolean;
    reason: string;
  };
};

/** Below this many monitored records a median lag is noise, so none is shown. */
const MIN_MONITORED_FOR_MEDIAN = 5;

export function getCoverageReport(): CoverageReport {
  const events = getAllEvents();
  const framing = getAllFramingClaims();
  const materials = getAllMaterials();
  const jurisdictions = getAllJurisdictions();
  const sources = getAllSources();
  const watched = getAllWatchedSources();

  const framingByEvent = new Map<string, number>();
  for (const f of framing) framingByEvent.set(f.eventId, (framingByEvent.get(f.eventId) ?? 0) + 1);

  const cited = new Set<string>();
  for (const e of events) for (const id of e.sourceIds) cited.add(id);
  for (const f of framing) cited.add(f.sourceId);
  for (const j of jurisdictions) for (const id of j.sourceIds) cited.add(id);

  const present = new Set(jurisdictions.map((j) => j.id));
  const actorOrder = JURISDICTIONS.filter((j) => present.has(j)) as JurisdictionCode[];

  const monitored = events.filter((e) => e.intakeMode === "monitored").length;
  const monitoringLive = Boolean(site.monitoringStartedAt);

  return {
    totals: {
      events: events.length,
      framingClaims: framing.length,
      materials: materials.length,
      jurisdictions: jurisdictions.length,
      sources: sources.length,
      watchedSources: watched.length,
    },
    evidence: {
      primaryAnchored: share(
        events.filter((e) => isPrimaryAnchored(e.sourceIds)).length,
        events.length,
      ),
      withFraming: share(events.filter((e) => framingByEvent.has(e.id)).length, events.length),
      originalTitleCoded: share(
        events.filter((e) => e.titleOriginal && e.titleOriginal !== "Not yet coded").length,
        events.length,
      ),
      documentNumbered: share(events.filter((e) => Boolean(e.documentNumber)).length, events.length),
      verified: share(
        events.filter((e) => e.verificationStatus === "verified").length,
        events.length,
      ),
      monitored: share(monitored, events.length),
      averageLinkedSourcesPerEvent:
        events.length === 0
          ? 0
          : events.reduce((n, e) => n + e.sourceIds.length, 0) / events.length,
      dateWindow: {
        earliest: events.reduce((min, e) => (e.date < min ? e.date : min), events[0]?.date ?? ""),
        latest: events.reduce((max, e) => (e.date > max ? e.date : max), events[0]?.date ?? ""),
      },
      notYetCodedTitleEventIds: events
        .filter((e) => e.titleOriginal === "Not yet coded")
        .map((e) => e.id),
    },
    framing: {
      nonEnglishAnchored: share(
        framing.filter((f) => f.quoteEnSource !== "na").length,
        framing.length,
      ),
      officialTranslation: share(
        framing.filter((f) => f.quoteEnSource === "official").length,
        framing.length,
      ),
      byCategory: FRAMING_CATEGORIES.map((category) => ({
        category,
        count: framing.filter((f) => f.category.includes(category)).length,
      })),
    },
    sources: {
      primary: share(
        sources.filter((s) => s.confidence === "primary").length,
        sources.length,
      ),
      byConfidence: SOURCE_CONFIDENCE.map((confidence) => ({
        confidence,
        count: sources.filter((s) => s.confidence === confidence).length,
      })),
      orphaned: sources.filter((s) => !cited.has(s.id)).map((s) => s.id),
    },
    actors: actorOrder.map((jurisdiction) => {
      const own = events.filter((e) => e.jurisdiction === jurisdiction);
      const ownSourceIds = new Set<string>();
      for (const e of own) for (const id of e.sourceIds) ownSourceIds.add(id);
      const ownSources = getSourcesByIds([...ownSourceIds]);
      return {
        jurisdiction,
        code: jurisdictionShort[jurisdiction].toLowerCase(),
        events: own.length,
        framingClaims: framing.filter((f) => f.actor === jurisdiction).length,
        primaryAnchored: share(own.filter((e) => isPrimaryAnchored(e.sourceIds)).length, own.length),
        watchedSources: watched.filter(
          (w) => w.jurisdiction === jurisdiction && w.status === "active",
        ).length,
        framingAnchored: share(own.filter((e) => framingByEvent.has(e.id)).length, own.length),
        linkedSources: ownSourceIds.size,
        primaryLinkedSources: ownSources.filter((s) => s.confidence === "primary").length,
      };
    }),
    materials: materials.map((m) => ({
      id: m.id,
      nameEn: m.nameEn,
      events: events.filter((e) => e.affectedMaterialIds.includes(m.id)).length,
    })),
    mechanisms: MECHANISMS.map((mechanism) => ({
      mechanism,
      count: events.filter((e) => e.mechanism.includes(mechanism)).length,
    })),
    timeliness: {
      monitoringStartedAt: site.monitoringStartedAt,
      monitoredRecords: monitored,
      minimumForMedian: MIN_MONITORED_FOR_MEDIAN,
      available: monitoringLive && monitored >= MIN_MONITORED_FOR_MEDIAN,
      reason: !monitoringLive
        ? "Prospective monitoring has not started, so there is no start date to measure lag against."
        : monitored < MIN_MONITORED_FOR_MEDIAN
          ? `Only ${monitored} monitored record${monitored === 1 ? "" : "s"}; a median needs at least ${MIN_MONITORED_FOR_MEDIAN}.`
          : "Computable.",
    },
  };
}
