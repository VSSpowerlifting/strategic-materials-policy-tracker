import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  RESULT_ANNOUNCE_DELAY_MS,
  RESULT_CLEAR_GAP_MS,
  ResultLiveRegion,
  createResultAnnouncer,
  resultCountMessage,
} from "@/components/ui/result-announcer";

/** A manual clock: `schedule` queues timers, `advance` runs the ones that are due. */
function harness() {
  let now = 0;
  let timers: Array<{ at: number; fn: () => void; live: boolean }> = [];
  const emitted: string[] = [];
  const gate = createResultAnnouncer(
    (text) => emitted.push(text),
    (fn, ms) => {
      const t = { at: now + ms, fn, live: true };
      timers.push(t);
      return { cancel: () => (t.live = false) };
    },
  );
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const due = timers.filter((t) => t.live && t.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      now = due.at;
      due.live = false;
      due.fn();
    }
    now = end;
    timers = timers.filter((t) => t.live);
  };
  /** Only the messages, without the clearing writes between them. */
  const said = () => emitted.filter((t) => t !== "");
  return { gate, advance, emitted, said };
}

test("count wording: none, one, some and all", () => {
  const noun = { one: "event", other: "events" };
  assert.equal(resultCountMessage(0, 79, noun), "No results");
  assert.equal(resultCountMessage(1, 79, noun), "1 event");
  assert.equal(resultCountMessage(12, 79, noun), "12 events");
  assert.equal(resultCountMessage(79, 79, noun), "All 79 events");
});

test("nothing is announced on load, including filters applied from the URL after hydration", () => {
  const { gate, advance, emitted } = harness();
  gate.update("[]", "All 79 events");
  // The mount effect reads ?actor=cn and narrows the list before the reader has done anything.
  gate.update('["cn"]', "12 events");
  advance(5000);
  assert.deepEqual(emitted, []);
});

test("one announcement for the state a run of rapid changes settles on", () => {
  const { gate, advance, said } = harness();
  gate.update('[""]', "All 79 events");
  gate.arm();
  for (const [i, q] of ["g", "ga", "gal", "gall"].entries()) {
    gate.update(JSON.stringify([q]), `${10 - i} events`);
    advance(RESULT_ANNOUNCE_DELAY_MS - 100);
  }
  assert.deepEqual(said(), []);
  advance(RESULT_ANNOUNCE_DELAY_MS + 100);
  assert.deepEqual(said(), ["7 events"]);
});

test("zero results, then clearing, are each announced once; the region is cleared before each message", () => {
  const { gate, advance, emitted } = harness();
  gate.update("[]", "All 79 events");
  gate.arm();
  gate.update('["zzz"]', "No results");
  advance(1000);
  gate.update("[]", "All 79 events");
  advance(1000);
  assert.deepEqual(emitted, ["", "No results", "", "All 79 events"]);
});

test("the same wording after a different filter is announced again; returning to the announced state is not", () => {
  const { gate, advance, said } = harness();
  gate.update('["a"]', "12 events");
  gate.arm();
  gate.update('["b"]', "12 events");
  advance(1000);
  assert.deepEqual(said(), ["12 events"]);
  // Typed a letter and deleted it before the pause ended: no net change, nothing said.
  gate.update('["bx"]', "3 events");
  advance(200);
  gate.update('["b"]', "12 events");
  advance(1000);
  assert.deepEqual(said(), ["12 events"]);
});

test("a state is announced only once its count is written: a change in the clear-to-write gap does not swallow it", () => {
  const { gate, advance, emitted, said } = harness();
  gate.update('["A"]', "All 79 events");
  gate.arm();
  // Select B and let it settle: the region is cleared, and B's count is due one gap later.
  gate.update('["B"]', "12 events");
  advance(RESULT_ANNOUNCE_DELAY_MS);
  assert.deepEqual(emitted, [""], "cleared, count not yet written");
  // Switch to C inside the gap, which cancels B's write, then settle back on B.
  advance(RESULT_CLEAR_GAP_MS / 2);
  gate.update('["C"]', "3 events");
  advance(RESULT_CLEAR_GAP_MS / 4);
  gate.update('["B"]', "12 events");
  assert.deepEqual(said(), [], "nothing written while the reader is still changing filters");
  advance(RESULT_ANNOUNCE_DELAY_MS + RESULT_CLEAR_GAP_MS);
  // B was never written before, so it is announced now, once; C was never settled on.
  assert.deepEqual(said(), ["12 events"]);
  advance(5000);
  assert.deepEqual(said(), ["12 events"]);
});

test("a change the reader did not make before arming is the baseline, not news", () => {
  const { gate, advance, said } = harness();
  gate.update('["cn"]', "12 events");
  gate.arm();
  // A click that changes nothing (opening a disclosure) arms the gate but says nothing.
  advance(5000);
  assert.deepEqual(said(), []);
});

const EXPLORERS = [
  "components/events-explorer.tsx",
  "components/timeline-view.tsx",
  "components/search-explorer.tsx",
  "components/capital/capital-explorer.tsx",
  "components/capital/controls-explorer.tsx",
  "components/organizations-explorer.tsx",
  "components/programmes-explorer.tsx",
  "components/projects-explorer.tsx",
  "components/source-register-explorer.tsx",
];

test("every filtered list announces through the shared region, and its visible count is no longer a live region", () => {
  for (const file of EXPLORERS) {
    const src = readFileSync(file, "utf8");
    assert.match(src, /useResultAnnouncer\(/, file);
    assert.match(src, /<ResultLiveRegion text=\{announcement\}\s*\/>/, file);
    assert.match(src, /\{\.\.\.rootProps\}/, file);
    // The visible count would otherwise be read on load and on every keystroke, as well as by the shared region.
    assert.doesNotMatch(src, /aria-live/, file);
  }
});

test("a Clear control that disappears once used hands focus back to the filters", () => {
  for (const file of EXPLORERS.filter((f) => !f.includes("timeline"))) {
    const src = readFileSync(file, "utf8");
    assert.doesNotMatch(src, /onClick=\{(reset|clear)\}/, `${file}: a clear control that drops focus`);
  }
});

test("the shared region is a polite, atomic status region that is present, empty, from the first render", () => {
  assert.equal(
    renderToStaticMarkup(createElement(ResultLiveRegion, { text: "" })),
    '<p class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>',
  );
});
