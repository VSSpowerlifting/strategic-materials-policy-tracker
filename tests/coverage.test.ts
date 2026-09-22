import { test } from "node:test";
import assert from "node:assert/strict";

import { getCoverageReport, isPrimaryAnchored } from "@/lib/coverage";
import { getAllEvents, getAllFramingClaims, getAllSources } from "@/lib/data";
import { site } from "@/lib/site";
import { FRAMING_CATEGORIES, SOURCE_CONFIDENCE } from "@/lib/types";

test("totals match the loaders", () => {
  const r = getCoverageReport();
  assert.equal(r.totals.events, getAllEvents().length);
  assert.equal(r.totals.framingClaims, getAllFramingClaims().length);
  assert.equal(r.totals.sources, getAllSources().length);
});

test("every share has a denominator and a count that cannot exceed it", () => {
  const r = getCoverageReport();
  const shares = [
    r.evidence.primaryAnchored,
    r.evidence.withFraming,
    r.evidence.originalTitleCoded,
    r.evidence.documentNumbered,
    r.evidence.verified,
    r.evidence.monitored,
    r.sources.primary,
    r.framing.nonEnglishAnchored,
    r.framing.officialTranslation,
    ...r.actors.map((a) => a.primaryAnchored),
    ...r.actors.map((a) => a.framingAnchored),
  ];
  for (const s of shares) {
    assert.ok(s.of >= 0, "denominator must be non-negative");
    assert.ok(s.count >= 0 && s.count <= s.of, `count ${s.count} out of range for ${s.of}`);
    // A zero denominator yields null, never 0 or NaN — "nothing to measure" is
    // a different statement from "none qualified".
    if (s.of === 0) assert.equal(s.ratio, null);
    else assert.equal(s.ratio, s.count / s.of);
  }
});

test("no metric is rolled up into a single score", () => {
  // The project forbids synthetic scores; this guards against one creeping in.
  const r = getCoverageReport() as unknown as Record<string, unknown>;
  for (const key of ["score", "grade", "rating", "index", "quality"])
    assert.ok(!(key in r), `coverage report must not expose a "${key}" field`);
});

test("per-actor event counts partition the corpus", () => {
  const r = getCoverageReport();
  const summed = r.actors.reduce((n, a) => n + a.events, 0);
  assert.equal(summed, r.totals.events, "every event belongs to exactly one actor");
});

test("actor codes resolve to the actor route segment", () => {
  for (const a of getCoverageReport().actors)
    assert.match(a.code, /^[a-z]{2}$/, `${a.jurisdiction}: code "${a.code}" is not a route segment`);
});

test("category and confidence breakdowns cover the whole taxonomy", () => {
  const r = getCoverageReport();
  assert.deepEqual(
    r.framing.byCategory.map((c) => c.category),
    [...FRAMING_CATEGORIES],
  );
  assert.deepEqual(
    r.sources.byConfidence.map((c) => c.confidence),
    [...SOURCE_CONFIDENCE],
  );
  // Confidence tiers partition the register.
  assert.equal(
    r.sources.byConfidence.reduce((n, c) => n + c.count, 0),
    r.totals.sources,
  );
});

test("primary-anchoring is stricter than the verified flag", () => {
  // Both are real measures; the point is that they are not the same measure,
  // so the dashboard must not present one as the other.
  const r = getCoverageReport();
  assert.ok(r.evidence.primaryAnchored.count <= r.evidence.verified.count + r.totals.events);
  for (const e of getAllEvents())
    if (isPrimaryAnchored(e.sourceIds))
      assert.equal(e.verificationStatus, "verified", `${e.id}: primary-anchored but not verified`);
});

test("timeliness stays unavailable while monitoring has not started", () => {
  const r = getCoverageReport();
  if (!site.monitoringStartedAt) {
    assert.equal(r.timeliness.available, false);
    assert.match(r.timeliness.reason, /has not started/);
  }
  assert.equal(r.timeliness.monitoringStartedAt, site.monitoringStartedAt);
});

test("orphaned sources are reported, not hidden", () => {
  const r = getCoverageReport();
  const ids = new Set(getAllSources().map((s) => s.id));
  for (const id of r.sources.orphaned) assert.ok(ids.has(id), `unknown source id ${id}`);
});
