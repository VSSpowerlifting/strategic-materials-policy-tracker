import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildBibtexAll,
  buildBibtexForEvent,
  buildCslForEvent,
  buildRisForEvent,
  plainCitation,
} from "@/lib/citation";
import { getAllEvents, getSourcesByIds } from "@/lib/data";
import { site } from "@/lib/site";

const events = getAllEvents();

test("every event produces a well-formed BibTeX entry", () => {
  for (const e of events) {
    const bib = buildBibtexForEvent(e);
    assert.match(bib, /^@misc\{smpt:/, `${e.id}: missing entry header`);
    assert.ok(bib.trimEnd().endsWith("}"), `${e.id}: unterminated entry`);
    assert.ok(bib.includes(`${site.url}/events/${e.id}`), `${e.id}: missing record URL`);
    // Braces must balance or the entry will not parse.
    const opens = (bib.match(/(?<!\\)\{/g) ?? []).length;
    const closes = (bib.match(/(?<!\\)\}/g) ?? []).length;
    assert.equal(opens, closes, `${e.id}: unbalanced braces`);
  }
});

test("BibTeX corporate author keeps its protective braces unescaped", () => {
  // `author = {{Name}}` is what stops a style from splitting an organisation
  // into first/last and printing "Tracker, Strategic Materials Policy".
  for (const e of events) {
    const bib = buildBibtexForEvent(e);
    assert.ok(
      bib.includes(`author = {{${site.name}}}`),
      `${e.id}: corporate author braces were escaped or dropped`,
    );
    assert.ok(!bib.includes("\\{"), `${e.id}: escaped brace leaked into the entry`);
  }
});

test("BibTeX keys are unique across the corpus", () => {
  const keys = buildBibtexAll().match(/@misc\{([^,]+),/g) ?? [];
  assert.equal(new Set(keys).size, keys.length, "duplicate BibTeX keys");
  assert.equal(keys.length, events.length);
});

test("RIS entries open with TY and close with ER", () => {
  for (const e of events) {
    const ris = buildRisForEvent(e);
    assert.ok(ris.startsWith("TY  - GEN"), `${e.id}: missing TY tag`);
    const lines = ris.split("\r\n").filter((l) => l !== "");
    // The ER terminator carries no value, so it is "ER  - " with nothing after
    // the separator — matched here rather than trimmed away.
    assert.equal(lines.at(-1), "ER  - ", `${e.id}: missing ER terminator`);
    for (const line of lines)
      assert.match(line, /^[A-Z][A-Z0-9]  - /, `${e.id}: malformed RIS line "${line}"`);
  }
});

test("CSL-JSON carries the record plus each of its sources", () => {
  for (const e of events) {
    const csl = buildCslForEvent(e);
    const sources = getSourcesByIds(e.sourceIds);
    assert.equal(csl.length, 1 + sources.length, `${e.id}: wrong entry count`);
    assert.equal(csl[0].id, `smpt:${e.id}`);
    const [y, m, d] = e.date.split("-").map(Number);
    assert.deepEqual((csl[0].issued as { "date-parts": number[][] })["date-parts"], [[y, m, d]]);
  }
});

test("the record citation never claims authorship of the instrument", () => {
  // The government issues the instrument; this project publishes the record.
  // Conflating them in an exported citation would be a provenance error that
  // outlives the page it came from.
  for (const e of events) {
    const csl = buildCslForEvent(e)[0] as Record<string, unknown>;
    assert.deepEqual(csl.author, [{ literal: site.name }]);
    assert.equal(csl.authority, e.issuingBody);
    assert.notEqual(csl.author, csl.authority);
  }
});

test("citations are deterministic — no wall-clock read", () => {
  // Route handlers are force-static, so a citation that embedded "today" would
  // silently freeze at build time and then be wrong.
  const first = buildBibtexAll();
  const second = buildBibtexAll();
  assert.equal(first, second);
  const thisYear = String(new Date().getFullYear());
  for (const e of events)
    if (!e.date.startsWith(thisYear))
      assert.ok(
        !buildBibtexForEvent(e).includes(`year = {${thisYear}}`),
        `${e.id}: citation year came from the clock, not the record`,
      );
});

test("plain citation names the record and resolves to it", () => {
  for (const e of events) {
    const c = plainCitation(e);
    assert.ok(c.includes(e.titleEn));
    assert.ok(c.includes(`${site.url}/events/${e.id}`));
  }
});
