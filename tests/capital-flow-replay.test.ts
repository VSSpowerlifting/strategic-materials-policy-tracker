import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CapitalFlowExhibit } from "@/components/exhibits/capital-flow";
import { buildCapitalFlowModel, type CapitalFlowModel } from "@/lib/capital-flow";
import {
  NOT_YET_RECORDED_LABEL,
  buildCapitalFlowTimeline,
  statusBoundaries,
  type CapitalFlowTimeline,
} from "@/lib/capital-flow-timeline";
import { financialStatusEntryOn, financialStatusEvidence, financialStatusEvidenceBoundary } from "@/lib/capital-control";
import { changeNotes, stepAnnouncement, stepReading } from "@/components/exhibits/capital-flow-replay";
import { getAllEvents, getFinancialCommitmentById, getSourceById } from "@/lib/data";
import { site } from "@/lib/site";

const MP = "evt-us-dod-mp-2025";
const G7 = "evt-ca-g7-cmpa-2025";
const BANK = "fin-us-dod-mp-2025-bank-financing";
const EQUITY = "fin-us-dod-mp-2025-preferred-equity";
const SAMARIUM = "fin-us-dod-mp-2025-samarium-loan";

const timelineOf = (eventId: string): { model: CapitalFlowModel; timeline: CapitalFlowTimeline } => {
  const model = buildCapitalFlowModel(eventId);
  assert.ok(model, eventId);
  return { model, timeline: buildCapitalFlowTimeline(model) };
};

const exhibits = getAllEvents()
  .map((e) => buildCapitalFlowModel(e.id))
  .filter((m): m is CapitalFlowModel => m !== null && m.hasIdentifiedParties);

// --- Steps and their dates ---------------------------------------------------------------------

test("MP: a step at each date the record's evidence changes a drawn line, and no other", () => {
  const { timeline } = timelineOf(MP);
  // From the seed status histories: the 9 Jul 2025 agreements; the Samarium loan contract, undated and evidenced
  // by a source of 10 Aug 2025; the bank financing lapse on 26 Aug 2025; the Samarium loan disbursement, undated,
  // evidenced by 26 Feb 2026; the equity disbursement, undated, evidenced by 7 Aug 2026. The OBBBA lending rows
  // (4 Jul 2025) are listed apart, not drawn, so they start no step.
  assert.deepEqual(
    timeline.steps.map((s) => s.date),
    ["2025-07-09", "2025-08-10", "2025-08-26", "2026-02-26", "2026-08-07"],
  );
  assert.deepEqual(
    timeline.steps.map((s) => s.changedFlowIds),
    [[], [SAMARIUM], [BANK], [SAMARIUM], [EQUITY]],
  );
});

test("an undated status starts its step at the source that evidences it, and keeps saying the date is not stated", () => {
  const { timeline } = timelineOf(MP);
  const equity = getFinancialCommitmentById(EQUITY)!;
  const disbursed = equity.financialStatusHistory.find((e) => e.status === "disbursed")!;
  assert.equal(disbursed.date, null, "the seed records no disbursement date");
  assert.equal(getSourceById(disbursed.sourceId)?.datePublished, "2026-08-07");

  const last = timeline.steps.at(-1)!;
  assert.equal(last.date, "2026-08-07");
  assert.equal(last.flows[EQUITY].flowClass, "cash");
  assert.equal(last.flows[EQUITY].status.text, "Disbursed, date not stated");
  for (const s of timeline.steps.slice(0, -1)) {
    assert.equal(s.flows[EQUITY].flowClass, "committed", `${s.date}: no disbursement recorded yet`);
  }
});

// --- What kind of date each step is ---------------------------------------------------------------

test("MP: a source's publication date reads 'Reported on', never as the date the status took effect", () => {
  const { timeline } = timelineOf(MP);
  // 9 Jul 2025 and 26 Aug 2025 are the statuses' own dates; the other three are the publication dates of the
  // sources that report the Samarium contract, the Samarium disbursement and the equity disbursement undated.
  assert.deepEqual(
    timeline.steps.map((s) => s.dateBasis),
    ["recorded", "reported", "recorded", "reported", "reported"],
  );
  for (const s of timeline.steps) {
    for (const id of s.changedFlowIds) {
      const c = getFinancialCommitmentById(id)!;
      const entry = financialStatusEntryOn(c, s.date)!;
      assert.equal(s.changeBasis[id], entry.date === null ? "reported" : "recorded", `${s.date} ${id}`);
      if (entry.date === null) assert.equal(getSourceById(entry.sourceId)?.datePublished, s.date);
    }
  }
  assert.deepEqual(timeline.taggedBases, ["reported"]);
});

test("every tagged step rests on no stated date, and SMPT check dates read 'Checked by'", () => {
  const seen = new Set<string>();
  for (const model of exhibits) {
    const { steps } = buildCapitalFlowTimeline(model);
    if (steps.length < 2) continue;
    for (const s of steps) {
      seen.add(s.dateBasis);
      for (const [id, basis] of Object.entries(s.changeBasis)) {
        const c = getFinancialCommitmentById(id)!;
        const entry = financialStatusEntryOn(c, s.date);
        const evidence = entry ? financialStatusEvidence(c, entry) : null;
        if (!evidence || evidence.date !== s.date) {
          assert.equal(basis, "recorded", `${model.eventId} ${s.date} ${id}`);
          continue;
        }
        const expected = { stated: "recorded", source_published: "reported", review_checked: "checked", source_accessed: "checked" };
        assert.equal(basis, expected[evidence.basis], `${model.eventId} ${s.date} ${id}`);
      }
      // A step is tagged only when no change at that date has its own date.
      if (s.dateBasis !== "recorded") {
        assert.ok(
          s.changedFlowIds.every((id) => s.changeBasis[id] !== "recorded") || s.changedFlowIds.length === 0,
          `${model.eventId} ${s.date}`,
        );
      }
    }
  }
  assert.deepEqual([...seen].sort(), ["checked", "recorded", "reported"]);
  // G7, 31 Oct 2025: stated decisions and an undated, reported status change together; the stated date wins.
  const g7 = timelineOf(G7).timeline.steps.find((s) => s.date === "2025-10-31")!;
  assert.equal(g7.dateBasis, "recorded");
  assert.ok(Object.values(g7.changeBasis).includes("reported"));
  // Santoku: the second step rests on the date SMPT accessed a source that gives no status date.
  const santoku = timelineOf("evt-jp-espa-santoku-rare-earth-2026").timeline.steps;
  assert.deepEqual(santoku.map((s) => s.dateBasis), ["recorded", "checked"]);
});

test("the bank financing is private financing until it lapses, and ended from 26 Aug 2025", () => {
  const { timeline } = timelineOf(MP);
  for (const s of timeline.steps) {
    const state = s.flows[BANK];
    if (s.date < "2025-08-26") {
      assert.equal(state.flowClass, "not_public", s.date);
      assert.equal(state.status.text, "Decided 9 Jul 2025");
    } else {
      assert.equal(state.flowClass, "ended", s.date);
      assert.equal(state.status.text, "Lapsed 26 Aug 2025");
    }
  }
});

test("the last step is the latest model, so the default view and the end of a replay are one reading", () => {
  for (const model of exhibits) {
    const timeline = buildCapitalFlowTimeline(model);
    const last = timeline.steps.at(-1)!;
    assert.equal(last.latest, true);
    assert.equal(last.asOf, model.asOf);
    assert.equal(model.asOf, site.lastUpdated);
    for (const f of model.flows) {
      const s = last.flows[f.id];
      assert.equal(s.flowClass, f.flowClass, `${model.eventId} ${f.id}`);
      assert.equal(s.status.text, f.status.text, `${model.eventId} ${f.id}`);
      assert.equal(s.notYetRecorded, false);
    }
    for (const r of model.listed) assert.equal(last.listed[r.id].status.text, r.status.text);
  }
});

test("steps run oldest first, never past the as-of date, and each one changes something", () => {
  let replayable = 0;
  for (const model of exhibits) {
    const { steps } = buildCapitalFlowTimeline(model);
    if (steps.length > 1) replayable += 1;
    steps.forEach((s, i) => {
      assert.ok(s.date <= site.lastUpdated, `${model.eventId} ${s.date}`);
      if (i > 0) assert.ok(s.date > steps[i - 1].date, `${model.eventId} order`);
      if (!s.latest) assert.equal(s.asOf, s.date);
      // Every step keeps every drawn lane; only class and status change.
      assert.deepEqual(Object.keys(s.flows).sort(), model.flows.map((f) => f.id).sort());
      if (i === 0) assert.equal(s.changedFlowIds.length + s.changedListedIds.length, 0);
      else if (steps.length > 1) assert.ok(s.changedFlowIds.length > 0, `${model.eventId} ${s.date} changes nothing drawn`);
    });
    // Each step date is the evidence boundary of a drawn row's status entry.
    const boundaries = new Set(statusBoundaries(model));
    for (const s of steps.length > 1 ? steps : []) assert.ok(boundaries.has(s.date), `${model.eventId} ${s.date}`);
  }
  assert.ok(replayable >= 15, `expected a replay on most exhibits with dated changes, got ${replayable}`);
});

test("a row with no status entry yet is 'not yet recorded', never given the 'Status not stated' class label", () => {
  const { timeline } = timelineOf(G7);
  const first = timeline.steps[0];
  assert.equal(first.date, "2024-09-01");
  const pending = Object.entries(first.flows).filter(([, s]) => s.notYetRecorded);
  assert.ok(pending.length > 0);
  for (const [id, s] of pending) {
    const c = getFinancialCommitmentById(id)!;
    // The seed holds no entry evidenced by this date, and at least one later.
    const boundaries = c.financialStatusHistory.map((e) => financialStatusEvidenceBoundary(c, e)).filter((b): b is string => b !== null);
    assert.ok(boundaries.every((b) => b > first.date), id);
    assert.ok(boundaries.length > 0, id);
    assert.equal(s.classLabel, NOT_YET_RECORDED_LABEL);
    assert.notEqual(s.classLabel, "Status not stated");
    assert.equal(s.status.status, null);
    assert.equal(s.equityInterest, false);
  }
  assert.equal(timeline.hasNotYetRecorded, true);
});

test("the replay key adds only classes drawn at earlier steps, after the latest model's own entries", () => {
  const { model, timeline } = timelineOf(MP);
  assert.deepEqual(
    timeline.legend.slice(0, model.legend.length).map((e) => e.key),
    model.legend.map((e) => e.key),
  );
  // Before any disbursement the equity and the Samarium loan were committed, not paid.
  assert.deepEqual(timeline.legend.slice(model.legend.length).map((e) => e.key), ["committed"]);
});

// --- Rendering ---------------------------------------------------------------------------------

const render = (eventId: string) => renderToStaticMarkup(createElement(CapitalFlowExhibit, { eventId }));
const textOf = (markup: string) => markup.replace(/<[^>]*>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ");

test("the exhibit renders the latest reading with dated steps, the latest pressed and nothing annotated", () => {
  const markup = render(MP);
  const text = textOf(markup);
  assert.match(text, /Status by date/);
  assert.match(text, /Replay changes/);
  const steps = markup.slice(markup.indexOf('class="capflow-steps'), markup.indexOf("</ol>", markup.indexOf('class="capflow-steps')));
  const pressed = [...steps.matchAll(/aria-pressed="(true|false)"/g)].map((m) => m[1]);
  assert.deepEqual(pressed, ["false", "false", "false", "false", "true"]);
  for (const label of ["9 Jul", "10 Aug", "26 Aug", "26 Feb", "7 Aug"]) assert.ok(text.includes(label), label);
  // The default view matches the no-JavaScript view: no change marks, no earlier-date key, no announcement.
  assert.doesNotMatch(text, /\bChanged\b/);
  assert.doesNotMatch(text, /Also drawn at earlier dates/);
  assert.match(markup, /<p class="sr-only" aria-live="polite"><\/p>/);
  assert.ok(text.includes("Status of each line as of 12 November 2026"));
  // The dates come before the drawing they change.
  assert.ok(markup.indexOf("Status by date") < markup.indexOf("capflow-diagram"));
  // The site-wide entrance stays off the exhibit; its lines have their own draw.
  assert.match(markup, /^<figure[^>]*data-motion-kind="flow"/);
});

test("the date bar tags reported dates and explains the tag; notes and the spoken reading name the date's kind", () => {
  const markup = render(MP);
  const text = textOf(markup);
  const steps = markup.slice(markup.indexOf('class="capflow-steps'), markup.indexOf("</ol>", markup.indexOf('class="capflow-steps')));
  const buttons = steps.split("<button").slice(1).map(textOf);
  assert.deepEqual(
    buttons.map((b) => /\bReported\b/.test(b)),
    [false, true, false, true, true],
  );
  assert.match(buttons[1], /Status reported on/);
  assert.match(buttons[0], /Status recorded by/);
  assert.match(buttons[4], /Latest status, reported on/);
  assert.ok(text.includes("Reported: the publication date of a source that reports a status without giving its date."));
  assert.doesNotMatch(text, /Checked: the date/);

  const { timeline } = timelineOf(MP);
  const samarium = timeline.steps[1];
  assert.equal(stepReading(samarium), "Status as recorded by 10 August 2025, the publication date of the source reporting the change.");
  assert.equal(stepReading(timeline.steps[2]), "Status as recorded by 26 August 2025.");
  assert.deepEqual(
    changeNotes(samarium, { [SAMARIUM]: "Samarium loan" }).map((n) => [n.basis, n.text]),
    [["reported", "Samarium loan: Contracted, date not stated"]],
  );
  // At the latest step the reading gives the as-of date, so a reported change carries its own date.
  const last = timeline.steps.at(-1)!;
  assert.equal(
    stepAnnouncement(last, timeline.steps.length - 1, changeNotes(last, { [EQUITY]: "Equity" })),
    "Status as of 12 November 2026. Changed: Equity: Disbursed, date not stated (reported on 7 Aug 2026).",
  );
  assert.equal(
    stepAnnouncement(samarium, 1, changeNotes(samarium, { [SAMARIUM]: "Samarium loan" })),
    "Status as recorded by 10 August 2025, the publication date of the source reporting the change. Changed: Samarium loan: Contracted, date not stated.",
  );
});

test("on a narrow figure the bar keeps every date on one line and writes the selected one out in full", () => {
  const markup = render(MP);
  const steps = markup.slice(markup.indexOf('class="capflow-steps'), markup.indexOf("</ol>", markup.indexOf('class="capflow-steps')));
  // Years and tags leave the rail on a phone but stay in each button's accessible name.
  assert.equal((steps.match(/@max-md:sr-only/g) ?? []).length, 5 + 3 + 1, "five years, three Reported tags, one Latest");
  assert.doesNotMatch(steps, /@max-md:hidden/);
  // Every date and the Replay control are at least 44px tall on a phone.
  assert.equal((steps.match(/<button[^>]*@max-md:min-h-11/g) ?? []).length, 5);
  assert.match(markup, /<button[^>]*@max-md:min-h-11[^>]*>[\s\S]*?Replay changes/);
  // The full-date line: shown only on a narrow figure, hidden from assistive technology, latest date by default.
  const line = markup.match(/<p aria-hidden="true" class="[^"]*hidden[^"]*@max-md:flex[^"]*">([\s\S]*?)<\/p>/);
  assert.ok(line, "the selected-date line");
  // Words, not a middot-joined string (the exhibit's copy rule).
  assert.equal(textOf(line[1]).trim(), "7 Aug 2026 Reported Latest 5 of 5");
  // Desktop keeps its layout: no container rule applies above 28rem.
  assert.match(steps, /class="block whitespace-nowrap">9 Jul<\/span>/);
});

test("an exhibit whose record shows no change has no replay controls", () => {
  const single = exhibits.find((m) => buildCapitalFlowTimeline(m).steps.length === 1);
  assert.ok(single, "the corpus has an exhibit with a single reading");
  const markup = render(single.eventId);
  assert.doesNotMatch(markup, /Status by date|Replay changes|capflow-steps/);
  assert.ok(textOf(markup).includes(`Status of each line as of ${single.asOfLabel}`));
});

test("motion is limited to drawing and redrawing lines, and is off under reduced motion and in print", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const block = css.slice(css.indexOf("Capital-flow exhibit. Lines draw once"), css.indexOf("Where the reader is"));
  const motionSafe = block.slice(block.indexOf("@media (prefers-reduced-motion: no-preference)"));
  for (const rule of ["capflow-draw", "capflow-arrive", "[data-changed]"]) assert.ok(motionSafe.includes(rule), rule);
  // Every animation in the block sits inside a no-preference query.
  const outside = block.split(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/).join("");
  assert.doesNotMatch(outside.replace(/@media print[\s\S]*?\n\}/, ""), /animation:|transition:/);
  assert.match(block, /@media print[\s\S]*animation: none !important/);
  // No interpolation between classes: a change remounts the line, and the timeline lib only reads model states.
  const client = readFileSync("components/exhibits/capital-flow-interactive.tsx", "utf8");
  assert.match(client, /key=\{drawKey\(flow\.id\)\}/);
  const replay = readFileSync("components/exhibits/capital-flow-replay-state.tsx", "utf8");
  assert.match(replay, /REPLAY_STEP_MS/);
  assert.match(replay, /if \(next >= last\) setPlaying\(false\)/, "a replay stops at the latest reading");
});

test("a control in the drawing that takes focus scrolls clear of the stuck date bar", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const sticky = css.slice(css.indexOf("@container (min-width: 48rem)"), css.indexOf(".capflow-step-dot {"));
  assert.match(sticky, /position: sticky;/);
  // The bar and the scroll margin share one container query: where the bar is not sticky, nothing is offset.
  assert.match(sticky, /\.capflow-diagram :is\(a\[href\], button, \[tabindex\]:not\(\[tabindex="-1"\]\)\) \{\s*scroll-margin-top: calc\(var\(--capflow-bar-h, 0px\) \+ 0\.5rem\);/);
  const controls = readFileSync("components/exhibits/capital-flow-replay.tsx", "utf8");
  assert.match(controls, /ResizeObserver/);
  assert.match(controls, /setProperty\("--capflow-bar-h"/);
  assert.match(controls, /<section ref=\{bar\}/);
});

test("an event page lists the exhibit in its contents, anchored, only where the exhibit is drawn", async () => {
  const { default: EventPage } = await import("@/app/events/[id]/page");
  const html = renderToStaticMarkup(await EventPage({ params: Promise.resolve({ id: MP }) }));
  assert.match(html, /href="#financing-status"[^>]*>Financing status<\/a>/);
  assert.match(html, /<figure id="financing-status"/);
  // The rail follows document order: framing, then the exhibit, then the instruments.
  const rail = html.slice(html.lastIndexOf('aria-label="On this page"'));
  assert.ok(rail.indexOf("#framing") < rail.indexOf("#financing-status"));
  assert.ok(rail.indexOf("#financing-status") < rail.indexOf("#instruments"));

  const without = getAllEvents().find((e) => !buildCapitalFlowModel(e.id)?.hasIdentifiedParties);
  assert.ok(without);
  const plain = renderToStaticMarkup(await EventPage({ params: Promise.resolve({ id: without.id }) }));
  assert.doesNotMatch(plain, /financing-status/);
});
