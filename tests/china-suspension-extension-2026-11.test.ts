import { test } from "node:test";
import assert from "node:assert/strict";

import {
  controlClocks,
  controlEndPassed,
  controlEntryOn,
  controlStatusOn,
  currentControlEntry,
  scheduledControlEntry,
  summarizeControl,
} from "@/lib/capital-control";
import { site } from "@/lib/site";
import { PHASE_III_RELEASE_CUTOFF } from "./phase-iii-release-ids";
import {
  getAllControlMeasures,
  getEventById,
  getMaterialBySlug,
  getSourceById,
} from "@/lib/data";
import { getAllJurisdictions } from "@/lib/data";

/**
 * MOFCOM/GACC Joint Announcement No. 58 of 2026 (9 November 2026) continues the suspension of
 * Announcements Nos. 55, 56, 57, 58, 61 and 62 of 2025 from 11 November 2026 to 10 January 2027.
 * These tests pin the date boundaries, the link to Announcement No. 70 of 2025, the original
 * text the record rests on, and the measures the continuation must leave alone.
 */

const EVENT_ID = "china-rare-earth-suspension-extension-2026-11";
const SOURCE_ID = "src-mofcom-2026-58";
const ROW_ID = "ctl-cn-ree-2026-11-suspension-continuation";
const UMBRELLA_ID = "ctl-cn-ree-2025-11-suspension";
const FIRST_END = "2026-11-10";
const ISSUED = "2026-11-09";
const EXTENSION_START = "2026-11-11";
const EXTENSION_END = "2027-01-10";

const measures = () => getAllControlMeasures();
const byId = (id: string) => {
  const m = measures().find((x) => x.id === id);
  assert.ok(m, `missing control measure ${id}`);
  return m;
};
/** The 18 clause rows plus the umbrella row that Announcement No. 70 put on hold. */
const suspendedRowIds = () => byId(ROW_ID).modifiesMeasureIds;

test("the continuation row covers the 18 clause rows and the No. 70 umbrella row, with no duplicates", () => {
  const ids = suspendedRowIds();
  assert.equal(ids.length, 19);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes(UMBRELLA_ID));
  for (const id of ids) byId(id);
});

test("every suspended row is suspended on both sides of the 10/11 November 2026 boundary", () => {
  for (const id of suspendedRowIds().filter((x) => x !== UMBRELLA_ID)) {
    const m = byId(id);
    assert.equal(controlStatusOn(m, "2026-11-09"), "suspended", id);
    assert.equal(controlStatusOn(m, FIRST_END), "suspended", id);
    assert.equal(controlStatusOn(m, EXTENSION_START), "suspended", id);
    assert.equal(controlStatusOn(m, EXTENSION_END), "suspended", id);
  }
});

test("the clause rows record two contiguous suspension windows: No. 70 to 10 Nov 2026, No. 58 from 11 Nov 2026 to 10 Jan 2027", () => {
  for (const id of suspendedRowIds().filter((x) => x !== UMBRELLA_ID)) {
    const suspensions = byId(id).statusHistory.filter((h) => h.status === "suspended");
    assert.equal(suspensions.length, 2, id);
    const [first, second] = suspensions;
    assert.equal(first.sourceId, "src-mofcom-70", id);
    assert.equal(first.date, "2025-11-07", id);
    assert.equal(first.until, FIRST_END, id);
    assert.equal(second.sourceId, SOURCE_ID, id);
    assert.equal(second.date, EXTENSION_START, id);
    assert.equal(second.until, EXTENSION_END, id);
    // No day is left outside a window: the second starts the day after the first ends.
    const nextDay = new Date(`${first.until}T00:00:00Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    assert.equal(nextDay.toISOString().slice(0, 10), second.date, id);
    assert.equal(currentControlEntry(byId(id)).until, EXTENSION_END, id);
  }
});

test("a suspended clause is not repealed and no later extension is assumed", () => {
  for (const id of suspendedRowIds().filter((x) => x !== UMBRELLA_ID)) {
    const history = byId(id).statusHistory;
    assert.ok(history.every((h) => h.status !== "revoked" && h.status !== "expired"), id);
    // The last entry is the extension and nothing is scheduled beyond its stated end.
    assert.equal(history.at(-1)?.until, EXTENSION_END, id);
    assert.equal(history.at(-1)?.sourceId, SOURCE_ID, id);
  }
  // On the day after the stated end, the recorded status is still "suspended" only because no
  // later entry exists; the record carries no date beyond 10 January 2027.
  const all = suspendedRowIds().flatMap((id) => byId(id).statusHistory);
  assert.ok(all.every((h) => !h.until || h.until <= EXTENSION_END));
});

test("the continuation row and the umbrella row carry the No. 58 source and the 11 Nov to 10 Jan window", () => {
  const row = byId(ROW_ID);
  assert.equal(row.measureType, "suspension");
  assert.equal(row.eventId, EVENT_ID);
  // Issued on 9 November (scheduled), effective from 11 November: two distinct dated entries.
  assert.deepEqual(row.statusHistory, [
    { status: "scheduled", date: ISSUED, sourceId: SOURCE_ID, note: row.statusHistory[0].note },
    {
      status: "in_force",
      date: EXTENSION_START,
      sourceId: SOURCE_ID,
      until: EXTENSION_END,
      note: row.statusHistory[1].note,
    },
  ]);
  const umbrella = byId(UMBRELLA_ID);
  assert.equal(umbrella.statusHistory.at(-1)?.date, EXTENSION_START);
  assert.equal(umbrella.statusHistory.at(-1)?.until, EXTENSION_END);
  assert.equal(umbrella.statusHistory.at(-1)?.sourceId, SOURCE_ID);
  for (const id of [ROW_ID, ...suspendedRowIds()]) {
    assert.ok(
      byId(id).evidence.some((e) => e.sourceId === SOURCE_ID),
      `${id} cites src-mofcom-2026-58 in evidence`,
    );
  }
});

test("Announcement No. 70 of 2025 keeps its original instrument and period", () => {
  const e70 = getEventById("china-rare-earth-suspension-2025-11");
  assert.ok(e70);
  assert.equal(e70.date, "2025-11-07");
  assert.ok(e70.sourceIds.includes("src-mofcom-70"));
  assert.ok(!e70.sourceIds.includes(SOURCE_ID));
  assert.match(e70.titleEn, /10 November 2026/);
  const s70 = getSourceById("src-mofcom-70");
  assert.ok(s70);
  assert.match(s70.notes ?? "", /自即日起至2026年11月10日/);
});

test("the extension event is a distinct dated event that cites both announcements", () => {
  const e = getEventById(EVENT_ID);
  assert.ok(e);
  assert.equal(e.date, "2026-11-09");
  assert.equal(e.jurisdiction, "china");
  assert.equal(e.documentNumber, "MOFCOM & GACC Announcement [2026] No. 58");
  assert.deepEqual([...e.sourceIds].sort(), ["src-mofcom-2026-58", "src-mofcom-70"]);
  assert.match(e.titleOriginal, /2026年第58号/);
  assert.match(e.titleEn, /11 November 2026 to 10 January 2027/);
  // The legal reading is explicit about what the text does not do.
  assert.match(e.summary, /suspended, not repealed/);
  assert.match(e.summary, /never suspended/);
  assert.match(e.summary, /27 November 2026/);
  assert.match(e.analyticalSignificance, /no further extension/);
  // Linked from the jurisdiction and material pages that list the suspended measures.
  const china = getAllJurisdictions().find((j) => j.code === "CN");
  assert.ok(china?.eventIds.includes(EVENT_ID));
  for (const slug of ["rare-earth-elements", "graphite", "lithium", "cobalt", "nickel", "ndfeb-magnets"]) {
    assert.ok(getMaterialBySlug(slug)?.eventIds.includes(EVENT_ID), slug);
  }
});

test("the new source is the official MOFCOM page and quotes the operative sentence verbatim", () => {
  const s = getSourceById(SOURCE_ID);
  assert.ok(s);
  assert.equal(
    s.url,
    "https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_91466027f465467985942a639a9485f4.html",
  );
  assert.equal(s.sourceType, "official");
  assert.equal(s.confidence, "primary");
  assert.equal(s.language, "zh");
  assert.equal(s.datePublished, "2026-11-09");
  assert.ok(s.dateAccessed && s.dateAccessed >= s.datePublished);
  assert.ok(s.notes?.includes("商务部 海关总署2026年第58号"));
  assert.ok(
    s.notes?.includes(
      "经批准，自2026年11月11日起至2027年1月10日，商务部、海关总署公告2025年第55号、56号、57号、58号，及商务部公告2025年第61号、62号继续暂停实施。",
    ),
  );
  // The announcement states no rationale and does not mention the earlier announcement or a later date.
  assert.match(s.notes ?? "", /no rationale beyond 经批准/);
});

test("the April 2025 controls were never suspended and are untouched", () => {
  const april = measures().filter((m) => m.eventId === "china-rare-earth-controls-2025-04");
  assert.ok(april.length >= 2);
  for (const m of april) {
    assert.deepEqual(
      m.statusHistory.map((h) => [h.status, h.date, h.until]),
      [["in_force", "2025-04-04", null]],
      m.id,
    );
    assert.ok(m.evidence.every((e) => e.sourceId !== SOURCE_ID), m.id);
    assert.ok(!byId(ROW_ID).modifiesMeasureIds.includes(m.id), m.id);
    assert.equal(controlStatusOn(m, EXTENSION_START), "in_force", m.id);
  }
});

test("the US-specific gallium, germanium and antimony suspension keeps its own schedule to 27 November 2026", () => {
  const rows = measures().filter((m) => m.eventId === "evt-cn-us-ban-2024");
  assert.ok(rows.length >= 2);
  // None of the 2024 clauses is touched by the extension.
  for (const m of rows) {
    assert.ok(m.evidence.every((e) => e.sourceId !== SOURCE_ID), m.id);
    assert.ok(m.statusHistory.every((h) => h.sourceId !== SOURCE_ID), m.id);
    assert.ok(!byId(ROW_ID).modifiesMeasureIds.includes(m.id), m.id);
  }
  // The clauses Announcement No. 72 of 2025 suspended still end on 27 November 2026.
  const suspended = rows.filter((m) => m.statusHistory.some((h) => h.sourceId === "src-mofcom-72"));
  assert.ok(suspended.length >= 2);
  for (const m of suspended) {
    const last = m.statusHistory.at(-1);
    assert.equal(last?.sourceId, "src-mofcom-72", m.id);
    assert.equal(last?.until, "2026-11-27", m.id);
  }
});

test("the 9 November legal continuation is the only post-Phase III status change in its original cohort", () => {
  // No. 55 was separately admitted on 12 November, and is checked in its own
  // clause-level regression test. It must not rewrite the 9 November cohort.
  const afterCutoff = measures().filter((m) => m.eventId !== "evt-cn-mofcom-55-2025").flatMap((m) =>
    m.statusHistory.filter((h) => h.date !== null && h.date > PHASE_III_RELEASE_CUTOFF)
      .map((h) => ({ id: m.id, h })),
  );
  assert.ok(afterCutoff.length > 0);
  for (const { id, h } of afterCutoff) {
    assert.equal(h.sourceId, SOURCE_ID, id);
    // Either the 9 November issuance (continuation row only) or the 11 November effective date.
    assert.ok(h.date === EXTENSION_START || (h.date === ISSUED && id === ROW_ID), `${id} ${h.date}`);
  }
});

// --- As-of boundaries: issuance (9 Nov), first end (10 Nov), effective start (11 Nov), stated end (10 Jan) ---

const clockFor = (asOf: string, id: string) => controlClocks(asOf).find((c) => c.measure.id === id);
const CLAUSE = "ctl-cn-56-2025-customs-declaration";

test("date model: Phase III remains frozen at 8 Nov while the curated corpus and legal as-of advance to 12 Nov", () => {
  assert.equal(PHASE_III_RELEASE_CUTOFF, "2026-11-08");
  assert.equal(site.lastUpdated, "2026-11-12");
  assert.equal(site.legalStatusAsOf, "2026-11-12");
  assert.equal(site.revisedOn, "2026-11-12");
  assert.ok(site.legalStatusAsOf >= EXTENSION_START,
    "as-of date includes the Nov 11 effective continuation");
});

test("9 November: the No. 70 window is effective and the No. 58 window is scheduled, never effective", () => {
  const m = byId(CLAUSE);
  const eff = controlEntryOn(m, ISSUED);
  assert.equal(eff?.sourceId, "src-mofcom-70");
  assert.equal(eff?.until, FIRST_END);
  const sched = scheduledControlEntry(m, ISSUED);
  assert.equal(sched?.sourceId, SOURCE_ID);
  assert.equal(sched?.date, EXTENSION_START);
  assert.equal(sched?.until, EXTENSION_END);
  assert.equal(controlEndPassed(m, ISSUED), false);
  const c = clockFor(ISSUED, CLAUSE);
  assert.equal(c?.daysLeft, 1);
  assert.equal(c?.entry.until, FIRST_END);
  assert.equal(c?.scheduled?.until, EXTENSION_END);
  const s = summarizeControl(m, ISSUED);
  assert.equal(s.status, "suspended");
  assert.equal(s.until, FIRST_END);
  assert.equal(s.scheduled?.from, EXTENSION_START);
  assert.equal(s.scheduled?.until, EXTENSION_END);
  assert.equal(s.scheduled?.sourceId, SOURCE_ID);
});

test("the continuation row is scheduled on 9 and 10 November and in force only from 11 November", () => {
  const row = byId(ROW_ID);
  for (const d of [ISSUED, FIRST_END]) {
    assert.equal(controlStatusOn(row, d), "scheduled", d);
    assert.equal(summarizeControl(row, d).status, "scheduled", d);
    assert.equal(summarizeControl(row, d).scheduled?.status, "in_force", d);
    assert.equal(summarizeControl(row, d).scheduled?.from, EXTENSION_START, d);
    assert.equal(scheduledControlEntry(row, d)?.date, EXTENSION_START, d);
    // No clock: a scheduled entry carries no stated end, so it is not counted down as one.
    assert.equal(clockFor(d, ROW_ID), undefined, d);
  }
  assert.equal(controlStatusOn(row, EXTENSION_START), "in_force");
  assert.equal(summarizeControl(row, EXTENSION_START).status, "in_force");
  assert.equal(summarizeControl(row, EXTENSION_START).scheduled, null);
  // Even before the issuance date the row is never reported as in force.
  assert.equal(summarizeControl(row, "2026-11-08").status, "scheduled");
  assert.equal(scheduledControlEntry(row, EXTENSION_START), null);
  // Before the issuance date there is no effective entry at all.
  assert.equal(controlEntryOn(row, "2026-11-08"), null);
});

test("10 November: the first window's stated end is inclusive and the extension is still only scheduled", () => {
  const m = byId(CLAUSE);
  assert.equal(controlEntryOn(m, FIRST_END)?.sourceId, "src-mofcom-70");
  assert.equal(scheduledControlEntry(m, FIRST_END)?.date, EXTENSION_START);
  assert.equal(controlEndPassed(m, FIRST_END), false);
  const c = clockFor(FIRST_END, CLAUSE);
  assert.equal(c?.daysLeft, 0);
  assert.equal(c?.entry.until, FIRST_END);
});

test("11 November: the extension is effective, ends 10 January 2027 and nothing is scheduled beyond it", () => {
  const m = byId(CLAUSE);
  const eff = controlEntryOn(m, EXTENSION_START);
  assert.equal(eff?.sourceId, SOURCE_ID);
  assert.equal(eff?.until, EXTENSION_END);
  assert.equal(scheduledControlEntry(m, EXTENSION_START), null);
  assert.equal(controlEndPassed(m, EXTENSION_START), false);
  const c = clockFor(EXTENSION_START, CLAUSE);
  assert.equal(c?.daysLeft, 60);
  assert.equal(c?.entry.until, EXTENSION_END);
});

test("10 January 2027: still inside the window; 11 January 2027: ended, with no renewal or resumption inferred", () => {
  for (const id of suspendedRowIds()) {
    const m = byId(id);
    assert.equal(controlEntryOn(m, EXTENSION_END)?.until, EXTENSION_END, id);
    assert.equal(controlEndPassed(m, EXTENSION_END), false, id);
    assert.equal(clockFor(EXTENSION_END, id)?.daysLeft, 0, id);
    // 11 January: the stated end has passed and no later instrument is recorded.
    assert.equal(controlEndPassed(m, "2027-01-11"), true, id);
    assert.equal(clockFor("2027-01-11", id)?.daysLeft, -1, id);
    // Nothing is inferred: no entry after the stated end, so no renewal, expiry, repeal or resumption.
    assert.equal(scheduledControlEntry(m, "2027-01-11"), null, id);
    const last = m.statusHistory.at(-1);
    assert.equal(last?.until, EXTENSION_END, id);
    assert.ok(m.statusHistory.every((h) => h.date === null || h.date <= EXTENSION_START), id);
    const flagged = summarizeControl(m, "2027-01-11");
    assert.equal(flagged.endPassed, true, id);
    assert.equal(flagged.until, EXTENSION_END, id);
    assert.equal(flagged.status, last?.status, id);
    assert.equal(flagged.scheduled, null, id);
  }
});
