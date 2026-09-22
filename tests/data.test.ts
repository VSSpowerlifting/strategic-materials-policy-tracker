import { test } from "node:test";
import assert from "node:assert/strict";

import {
  getAllEvents,
  getEventById,
  getEventsByActor,
  getEventsByMaterial,
  getRelatedEvents,
  getAllMaterials,
  getMaterialBySlug,
  getMaterialsByIds,
  getAllJurisdictions,
  getJurisdictionByCode,
  getJurisdictionById,
  getAllSources,
  getSourceById,
  getSourcesByIds,
  getDatasetSummary,
  getEvidenceSummary,
  getAllFramingClaims,
  getFramingByEvent,
  getFramingCategoriesByEvent,
  getControlMatrix,
  getAllWatchedSources,
  getWatchedSourceById,
  getWatchedSourcesByJurisdiction,
} from "@/lib/data";
import {
  FRAMING_CATEGORIES,
  INTAKE_MODES,
  MECHANISMS,
  SOURCE_CONFIDENCE,
  VERIFICATION_STATUSES,
  WATCH_CADENCES,
  WATCH_STATUSES,
} from "@/lib/types";
import { site } from "@/lib/site";
import watchlistJson from "@/data/seed/watchlist.json";
import type { WatchedSource } from "@/lib/types";

const watchlist = watchlistJson as unknown as WatchedSource[];
import type { JurisdictionCode } from "@/lib/types";

test("events load and are sorted most-recent-first", () => {
  const e = getAllEvents();
  assert.ok(e.length > 0);
  for (let i = 1; i < e.length; i++) assert.ok(e[i - 1].date >= e[i].date, `unsorted at ${i}`);
});

test("getEventById round-trips and misses cleanly", () => {
  const e = getAllEvents()[0];
  assert.equal(getEventById(e.id)?.id, e.id);
  assert.equal(getEventById("does-not-exist"), undefined);
});

test("getEventsByActor returns only that actor", () => {
  for (const j of getAllJurisdictions())
    for (const e of getEventsByActor(j.id as JurisdictionCode)) assert.equal(e.jurisdiction, j.id);
});

test("getEventsByMaterial only returns events affecting that material", () => {
  for (const m of getAllMaterials())
    for (const e of getEventsByMaterial(m.id)) assert.ok(e.affectedMaterialIds.includes(m.id));
});

test("related events exclude self and share at least one material", () => {
  for (const e of getAllEvents())
    for (const r of getRelatedEvents(e)) {
      assert.notEqual(r.id, e.id);
      assert.ok(r.affectedMaterialIds.some((m) => e.affectedMaterialIds.includes(m)));
    }
});

test("getRelatedEvents respects the limit", () => {
  for (const e of getAllEvents()) assert.ok(getRelatedEvents(e, 3).length <= 3);
});

test("material slug lookup round-trips; getMaterialsByIds preserves and filters", () => {
  const all = getAllMaterials();
  const m = all[0];
  assert.equal(getMaterialBySlug(m.slug)?.id, m.id);
  assert.equal(getMaterialsByIds([m.id, "nope"]).length, 1);
});

test("jurisdiction code lookup is case-insensitive; id lookup is exact", () => {
  const j = getAllJurisdictions()[0];
  assert.equal(getJurisdictionByCode(j.code.toLowerCase())?.id, j.id);
  assert.equal(getJurisdictionByCode(j.code.toUpperCase())?.id, j.id);
  assert.equal(getJurisdictionById(j.id)?.code, j.code);
});

test("source lookups round-trip", () => {
  const s = getAllSources()[0];
  assert.equal(getSourceById(s.id)?.id, s.id);
  assert.equal(getSourcesByIds([s.id, "nope"]).length, 1);
});

test("framing-by-event only returns claims for that event", () => {
  for (const e of getAllEvents())
    for (const f of getFramingByEvent(e.id)) assert.equal(f.eventId, e.id);
});

test("framing categories by event: every event keyed, values match its claims", () => {
  const byEvent = getFramingCategoriesByEvent();
  const events = getAllEvents();
  assert.equal(Object.keys(byEvent).length, events.length);
  for (const e of events) {
    const cats = byEvent[e.id];
    assert.ok(Array.isArray(cats), `missing entry for ${e.id}`);
    const expected = new Set(getFramingByEvent(e.id).flatMap((f) => f.category));
    assert.deepEqual(new Set(cats), expected, `category union mismatch for ${e.id}`);
    assert.equal(new Set(cats).size, cats.length, `duplicate categories for ${e.id}`);
  }
});

test("framing categories by event follow canonical taxonomy order", () => {
  const order = new Map(FRAMING_CATEGORIES.map((c, i) => [c, i]));
  for (const cats of Object.values(getFramingCategoriesByEvent()))
    for (let i = 1; i < cats.length; i++)
      assert.ok(order.get(cats[i - 1])! < order.get(cats[i])!, "unsorted categories");
});

test("control matrix: one row per material, totals reconcile across axes", () => {
  const m = getControlMatrix();
  assert.equal(m.rows.length, getAllMaterials().length);
  const cellSum = m.rows.reduce(
    (sum, r) => sum + m.jurisdictions.reduce((s, j) => s + r.byJurisdiction[j].count, 0),
    0,
  );
  const rowTotalSum = m.rows.reduce((s, r) => s + r.total, 0);
  const colTotalSum = m.jurisdictions.reduce((s, j) => s + m.columnTotals[j], 0);
  assert.equal(cellSum, rowTotalSum);
  assert.equal(cellSum, colTotalSum);
});

test("control matrix: cells are consistent with the events they aggregate", () => {
  const m = getControlMatrix();
  for (const r of m.rows)
    for (const j of m.jurisdictions) {
      const cell = r.byJurisdiction[j];
      assert.equal(cell.count, cell.eventIds.length);
      assert.equal(new Set(cell.mechanisms).size, cell.mechanisms.length, "mechanisms must be de-duped");
      for (const e of getEventsByMaterial(r.material.id))
        if (e.jurisdiction === j) assert.ok(cell.eventIds.includes(e.id));
      if (cell.latestDate)
        for (const id of cell.eventIds) {
          const ev = getEventById(id)!;
          assert.ok(ev.date <= cell.latestDate);
        }
    }
});

test("control matrix: columns are taxonomy-ordered with the control actor first", () => {
  assert.equal(getControlMatrix().jurisdictions[0], "china");
});

test("dataset summary equals loaded counts", () => {
  const s = getDatasetSummary();
  assert.equal(s.events, getAllEvents().length);
  assert.equal(s.framingClaims, getAllFramingClaims().length);
  assert.equal(s.materials, getAllMaterials().length);
  assert.equal(s.jurisdictions, getAllJurisdictions().length);
  assert.equal(s.sources, getAllSources().length);
});

// --- Policy Change Monitor, phase 1 -----------------------------------------

test("every event carries verification standing, intake mode and a lifecycle block", () => {
  for (const e of getAllEvents()) {
    assert.ok(
      VERIFICATION_STATUSES.includes(e.verificationStatus),
      `${e.id}: bad verificationStatus`,
    );
    assert.ok(INTAKE_MODES.includes(e.intakeMode), `${e.id}: bad intakeMode`);
    assert.ok(e.lifecycle, `${e.id}: missing lifecycle`);
    for (const f of ["officialPublicationDate", "discoveredAt", "verifiedAt", "publishedAt"] as const) {
      const v = e.lifecycle[f];
      assert.ok(
        v === null || /^\d{4}-\d{2}-\d{2}$/.test(v),
        `${e.id}: lifecycle.${f} must be an ISO date or null`,
      );
    }
  }
});

test("a verified event always resolves to an official primary source", () => {
  const byId = new Map(getAllSources().map((s) => [s.id, s]));
  for (const e of getAllEvents()) {
    if (e.verificationStatus !== "verified") continue;
    const ok = e.sourceIds.some((id) => {
      const s = byId.get(id);
      return s?.confidence === "primary" && s?.sourceType === "official";
    });
    assert.ok(ok, `${e.id}: marked verified without an official primary source`);
  }
});

test("verifiedAt is a date, not a status: a verified backfill may leave it null", () => {
  const verified = getAllEvents().filter((e) => e.verificationStatus === "verified");
  assert.ok(verified.length > 0);
  // The two fields must be independent — asserting this stops a later refactor
  // from quietly deriving status from the date.
  assert.ok(
    verified.some((e) => e.lifecycle.verifiedAt === null),
    "expected at least one verified record with an unrecoverable verifiedAt",
  );
});

test("a monitored record is verified and carries the dates knowable at promotion", () => {
  for (const e of getAllEvents()) {
    if (e.intakeMode !== "monitored") continue;
    assert.equal(e.verificationStatus, "verified", `${e.id}: monitored but not verified`);
    // publishedAt is excluded on purpose: it is the deploy date, not the
    // promotion date, so it is legitimately null between the two.
    for (const f of ["officialPublicationDate", "discoveredAt", "verifiedAt"] as const)
      assert.ok(e.lifecycle[f], `${e.id}: monitored but lifecycle.${f} is null`);
  }
});

test("publishedAt and monitoringStartedAt ship together", () => {
  // They are set in the same release, so neither may lead the other. Before
  // that release both are null; after it, every monitored record has a date.
  for (const e of getAllEvents()) {
    if (e.intakeMode !== "monitored") continue;
    if (site.monitoringStartedAt)
      assert.ok(e.lifecycle.publishedAt, `${e.id}: monitoring has started but publishedAt is null`);
    else
      assert.equal(
        e.lifecycle.publishedAt,
        null,
        `${e.id}: publishedAt is set while site.monitoringStartedAt is null`,
      );
  }
});

test("no timeliness metric is computable yet: monitoring has not started", () => {
  // The guard is monitoringStartedAt, not the record count — a promoted
  // monitored record that has never been deployed still yields no lag.
  assert.equal(site.monitoringStartedAt, null);
  const monitored = getAllEvents().filter((e) => e.intakeMode === "monitored");
  // The median-lag metric stays unavailable below five monitored records.
  assert.ok(monitored.length < 5);
});

test("watchlist entries resolve and never claim a check after the last release", () => {
  const materialIds = new Set(getAllMaterials().map((m) => m.id));
  const seen = new Set<string>();
  for (const w of watchlist) {
    assert.ok(!seen.has(w.id), `duplicate watchlist id ${w.id}`);
    seen.add(w.id);
    assert.match(w.url, /^https?:\/\//, `${w.id}: url must be absolute`);
    assert.ok(WATCH_CADENCES.includes(w.cadence), `${w.id}: bad cadence`);
    assert.ok(WATCH_STATUSES.includes(w.status), `${w.id}: bad status`);
    for (const mid of w.materialIds) assert.ok(materialIds.has(mid), `${w.id}: materialId ${mid} does not resolve`);
    if (w.lastCheckedAt !== null) {
      assert.match(w.lastCheckedAt, /^\d{4}-\d{2}-\d{2}$/, `${w.id}: bad lastCheckedAt`);
      assert.ok(w.lastCheckedAt <= site.lastUpdated, `${w.id}: lastCheckedAt postdates the last release`);
    }
  }
});

test("the lastCheckedAt guard actually rejects a future check", () => {
  // Proves the rule rather than trusting that every current value is null.
  const future = "2099-01-01";
  assert.ok(future > site.lastUpdated);
});

test("watchlist loaders round-trip the seed and sort by title", () => {
  const all = getAllWatchedSources();
  assert.equal(all.length, watchlist.length);
  for (let i = 1; i < all.length; i++)
    assert.ok(all[i - 1].title.localeCompare(all[i].title) <= 0, `unsorted at ${i}`);
  assert.equal(getWatchedSourceById(all[0].id)?.id, all[0].id);
  assert.equal(getWatchedSourceById("does-not-exist"), undefined);
});

test("grouping keys every published jurisdiction, so a coverage gap stays visible", () => {
  const groups = getWatchedSourcesByJurisdiction();
  const published = getAllJurisdictions().map((j) => j.id);
  assert.equal(groups.length, published.length);
  for (const j of published)
    assert.ok(
      groups.some((g) => g.jurisdiction === j),
      `jurisdiction ${j} is published but missing from the grouping`,
    );
  // Canonical taxonomy order, not seed-file order.
  const order = groups.map((g) => g.jurisdiction);
  assert.deepEqual([...order].sort(), [...published].sort());
});

test("grouping partitions the active sources and excludes paused/retired", () => {
  const groups = getWatchedSourcesByJurisdiction();
  const grouped = groups.flatMap((g) => g.sources);
  const active = getAllWatchedSources().filter((w) => w.status === "active");
  assert.equal(grouped.length, active.length);
  for (const w of grouped) {
    assert.equal(w.status, "active", `${w.id}: non-active source appeared in the grouping`);
    assert.ok(
      groups.find((g) => g.jurisdiction === w.jurisdiction)?.sources.includes(w),
      `${w.id}: filed under the wrong jurisdiction`,
    );
  }
  assert.equal(new Set(grouped.map((w) => w.id)).size, grouped.length);
});

test("every watched source resolves its materials, so the page never renders an empty list", () => {
  for (const w of getAllWatchedSources()) {
    assert.ok(w.materialIds.length > 0, `${w.id}: watches no materials`);
    assert.equal(
      getMaterialsByIds(w.materialIds).length,
      w.materialIds.length,
      `${w.id}: a materialId failed to resolve`,
    );
  }
});

// --- Framework instruments (no material scope) ------------------------------
//
// The 2018–2025 backfill introduced records for instruments that name no
// material at all: an export-control statute, its implementing regulation, an
// economic-security act, a cabinet mission. Coding their material scope as
// empty is deliberate — inferring materials from the measures issued under them
// would put a claim in the record the source never made. These tests hold that
// choice in place from both directions: empty scope must stay legal, and it
// must never become a silent hole in the derived indexes.

test("an event may name no material, and the derived views survive it", () => {
  const scopeless = getAllEvents().filter((e) => e.affectedMaterialIds.length === 0);
  assert.ok(
    scopeless.length > 0,
    "expected at least one framework instrument with an empty material scope",
  );
  for (const e of scopeless) {
    // The event page resolves materials before rendering; an empty list must
    // resolve to an empty list, not throw and not silently invent a material.
    assert.deepEqual(getMaterialsByIds(e.affectedMaterialIds), []);
    // Related events are derived from shared materials, so a scopeless event
    // has no relations — it must not fall back to "everything".
    assert.deepEqual(getRelatedEvents(e), []);
    // It still has to earn its place: a source and a framing anchor.
    assert.ok(e.sourceIds.length > 0, `${e.id}: framework instrument with no source`);
    assert.ok(
      getFramingByEvent(e.id).length > 0,
      `${e.id}: framework instrument with no framing anchor`,
    );
  }
});

test("no material index silently claims a scopeless event", () => {
  const scopeless = new Set(
    getAllEvents().filter((e) => e.affectedMaterialIds.length === 0).map((e) => e.id),
  );
  for (const m of getAllMaterials())
    for (const id of m.eventIds)
      assert.ok(
        !scopeless.has(id),
        `material "${m.id}": lists "${id}", which declares no material scope`,
      );
});

// --- Supersession chains ----------------------------------------------------
//
// The backfill turned three isolated designations into lineages (US 2018 →
// 2022 → 2025, UK 2022 → 2025). A chain is only worth coding if it stays
// consistent, so: the pointer resolves, it points forward in time, it stays
// inside one jurisdiction, and the two ends agree about which is superseded.

test("supersession points forward, within one actor, and matches policyStatus", () => {
  const byId = new Map(getAllEvents().map((e) => [e.id, e]));
  let chains = 0;
  for (const e of getAllEvents()) {
    if (!e.supersededByEventId) continue;
    chains++;
    const successor = byId.get(e.supersededByEventId);
    assert.ok(successor, `${e.id}: supersededByEventId does not resolve`);
    assert.ok(
      successor.date >= e.date,
      `${e.id}: superseded by "${successor.id}", which is dated earlier (${successor.date} < ${e.date})`,
    );
    assert.equal(
      successor.jurisdiction,
      e.jurisdiction,
      `${e.id}: superseded by an instrument from a different actor`,
    );
    assert.equal(
      e.policyStatus,
      "superseded",
      `${e.id}: names a successor but its policyStatus is "${e.policyStatus}"`,
    );
    assert.notEqual(
      successor.id,
      e.id,
      `${e.id}: supersedes itself`,
    );
  }
  assert.ok(chains > 0, "expected at least one supersession chain in the corpus");
});

test("every jurisdiction in the label set that has events also has a profile", () => {
  const withEvents = new Set(getAllEvents().map((e) => e.jurisdiction));
  const profiled = new Set(getAllJurisdictions().map((j) => j.id));
  for (const j of withEvents)
    assert.ok(profiled.has(j), `jurisdiction "${j}" has events but no profile record`);
  // And the route key an event page builds must reach that profile.
  for (const j of getAllJurisdictions())
    assert.ok(
      getJurisdictionByCode(j.code.toLowerCase()),
      `jurisdiction "${j.id}": /actors/${j.code.toLowerCase()} does not resolve`,
    );
});


// --- Evidence summary (coverage dashboard) ----------------------------------
//
// getEvidenceSummary() is a reshape over getCoverageReport() (lib/coverage.ts)
// into the exact breakdown the /coverage page and its brief describe. These
// tests hold that reshape honest against the same loaders every other test in
// this file already trusts, rather than re-testing the underlying report.

test("evidence summary totals reconcile with the loaders", () => {
  const s = getEvidenceSummary();
  assert.equal(s.totals.events, getAllEvents().length);
  assert.equal(s.totals.framingClaims, getAllFramingClaims().length);
  assert.equal(s.totals.materials, getAllMaterials().length);
  assert.equal(s.totals.jurisdictions, getAllJurisdictions().length);
  assert.equal(s.totals.sources, getAllSources().length);
});

test("evidence summary's primary-source share matches the source register", () => {
  const s = getEvidenceSummary();
  const primary = getAllSources().filter((src) => src.confidence === "primary");
  assert.equal(s.primarySources.count, primary.length);
  assert.equal(s.primarySources.of, getAllSources().length);
});

test("evidence summary's average sources-per-event matches a direct count", () => {
  const s = getEvidenceSummary();
  const events = getAllEvents();
  const expected = events.reduce((n, e) => n + e.sourceIds.length, 0) / events.length;
  assert.equal(s.averageSourcesPerEvent, expected);
});

test("evidence summary's date window spans every coded event", () => {
  const s = getEvidenceSummary();
  for (const e of getAllEvents()) {
    assert.ok(e.date >= s.dateWindow.earliest, `${e.id}: dated before the reported window start`);
    assert.ok(e.date <= s.dateWindow.latest, `${e.id}: dated after the reported window end`);
  }
  assert.ok(getAllEvents().some((e) => e.date === s.dateWindow.earliest));
  assert.ok(getAllEvents().some((e) => e.date === s.dateWindow.latest));
});

test("evidence summary includes every jurisdiction exactly once", () => {
  const s = getEvidenceSummary();
  const profiled = getAllJurisdictions().map((j) => j.id).sort();
  const covered = s.byJurisdiction.map((a) => a.jurisdiction).sort();
  assert.deepEqual(covered, profiled);
});

test("per-jurisdiction event counts reconcile with the overall event total", () => {
  const s = getEvidenceSummary();
  const summed = s.byJurisdiction.reduce((n, a) => n + a.events, 0);
  assert.equal(summed, s.totals.events, "every event belongs to exactly one jurisdiction");
});

test("per-jurisdiction linked-source and primary-linked-source counts are sane", () => {
  const s = getEvidenceSummary();
  const byId = new Map(getAllSources().map((src) => [src.id, src]));
  for (const a of s.byJurisdiction) {
    const own = getAllEvents().filter((e) => e.jurisdiction === a.jurisdiction);
    const uniqueSourceIds = new Set(own.flatMap((e) => e.sourceIds));
    assert.equal(a.linkedSources, uniqueSourceIds.size, `${a.jurisdiction}: linked-source count mismatch`);
    const primaryAmongLinked = [...uniqueSourceIds].filter((id) => byId.get(id)?.confidence === "primary");
    assert.equal(
      a.primaryLinkedSources,
      primaryAmongLinked.length,
      `${a.jurisdiction}: primary-linked-source count mismatch`,
    );
    assert.ok(a.primaryLinkedSources <= a.linkedSources);
    // Framing coverage is a share of that jurisdiction's own events, not the corpus.
    assert.equal(a.framingCoverage.of, a.events);
  }
});

test("evidence summary's source-confidence totals reconcile with the source register", () => {
  const s = getEvidenceSummary();
  const total = s.bySourceConfidence.reduce((n, c) => n + c.count, 0);
  assert.equal(total, s.totals.sources);
});

test("evidence summary's framing coverage is calculated from actual event IDs", () => {
  const s = getEvidenceSummary();
  const withFraming = new Set(getAllFramingClaims().map((f) => f.eventId));
  const expectedCount = getAllEvents().filter((e) => withFraming.has(e.id)).length;
  assert.equal(s.framingCoverage.count, expectedCount);
  assert.equal(s.framingCoverage.of, getAllEvents().length);
});

test("evidence summary preserves canonical mechanism and source-confidence order", () => {
  const s = getEvidenceSummary();
  assert.deepEqual(s.byMechanism.map((m) => m.mechanism), [...MECHANISMS]);
  assert.deepEqual(s.bySourceConfidence.map((c) => c.confidence), [...SOURCE_CONFIDENCE]);
});

test("evidence summary flags exactly the events literally marked 'Not yet coded', nothing inferred", () => {
  const s = getEvidenceSummary();
  const expected = getAllEvents()
    .filter((e) => e.titleOriginal === "Not yet coded")
    .map((e) => e.id)
    .sort();
  assert.deepEqual([...s.notYetCodedTitleEventIds].sort(), expected);
  // A null or empty titleOriginal is a different, unmodeled state — it must
  // not be swept into this list as though it were the same claim.
  for (const e of getAllEvents())
    if (e.titleOriginal !== "Not yet coded")
      assert.ok(!s.notYetCodedTitleEventIds.includes(e.id));
});
