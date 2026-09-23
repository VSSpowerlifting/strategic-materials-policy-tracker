import { test } from "node:test";
import assert from "node:assert/strict";

import { buildSearchIndex, normalize, searchDocs, SEARCH_KINDS } from "@/lib/search";
import { getAllEvents, getAllFinancialCommitments, getAllSources, getAllWatchedSources } from "@/lib/data";
import { JURISDICTIONS } from "@/lib/types";

const docs = buildSearchIndex();

test("index covers every record type and every event", () => {
  const kinds = new Set(docs.map((d) => d.kind));
  for (const k of SEARCH_KINDS) assert.ok(kinds.has(k), `no documents of kind ${k}`);
  const eventDocs = docs.filter((d) => d.kind === "event");
  assert.equal(eventDocs.length, getAllEvents().length);
});

test("document ids are unique within a kind", () => {
  const seen = new Set<string>();
  for (const d of docs) {
    const key = `${d.kind}:${d.id}`;
    assert.ok(!seen.has(key), `duplicate ${key}`);
    seen.add(key);
  }
});

test("an empty query returns nothing rather than everything", () => {
  assert.deepEqual(searchDocs(docs, ""), []);
  assert.deepEqual(searchDocs(docs, "   "), []);
});

test("all terms must match", () => {
  const hits = searchDocs(docs, "rare earth");
  assert.ok(hits.length > 0);
  for (const h of hits) {
    const hay = h.haystack + " " + normalize(h.title);
    assert.ok(hay.includes("rare") && hay.includes("earth"), `${h.id} matched without both terms`);
  }
  // A term that appears nowhere excludes everything, even alongside a common one.
  assert.deepEqual(searchDocs(docs, "rare zzzzznotpresent"), []);
});

test("matching is exact, so adjacent instrument numbers stay distinct", () => {
  // The corpus contains Announcement No. 61 and references No. 62; a fuzzy
  // matcher that conflated them would be actively misleading in a legal corpus.
  const sixtyOne = searchDocs(docs, "No. 61");
  const sixtyTwo = searchDocs(docs, "No. 62");
  assert.notDeepEqual(
    sixtyOne.map((d) => d.id),
    sixtyTwo.map((d) => d.id),
  );
});

test("original-language text is searchable in its own script", () => {
  const hits = searchDocs(docs, "稀土");
  assert.ok(hits.length > 0, "Chinese-script query returned nothing");
});

test("results are ordered deterministically", () => {
  const a = searchDocs(docs, "china").map((d) => `${d.kind}:${d.id}`);
  const b = searchDocs(docs, "china").map((d) => `${d.kind}:${d.id}`);
  assert.deepEqual(a, b);
});

test("title matches outrank body-only matches", () => {
  const hits = searchDocs(docs, "graphite");
  assert.ok(hits.length > 1);
  const firstTitleMatch = normalize(hits[0].title).includes("graphite");
  assert.ok(firstTitleMatch, "a body-only match outranked a title match");
});

test("every result href points at a real route shape", () => {
  for (const d of docs)
    assert.match(
      d.href,
      /^\/(events|capital|controls|materials|actors|sources|watchlist)(\/|#)/,
      `${d.id}: suspicious href ${d.href}`,
    );
});

test("source documents carry their published date where the source has one", () => {
  const withDate = getAllSources().filter((s) => s.datePublished);
  const indexed = docs.filter((d) => d.kind === "source" && d.date);
  assert.equal(indexed.length, withDate.length);
});


test("event, capital, control, framing, actor and watched documents carry a jurisdiction; material and source do not", () => {
  const validCodes = new Set(JURISDICTIONS as readonly string[]);
  for (const d of docs) {
    if (["event", "control", "actor", "framing", "watched"].includes(d.kind) || (d.kind === "capital" && d.jurisdiction !== null)) {
      assert.ok(d.jurisdiction, `${d.kind}:${d.id} should carry a jurisdiction`);
      assert.ok(validCodes.has(d.jurisdiction!), `${d.kind}:${d.id} has an unrecognised jurisdiction ${d.jurisdiction}`);
    }
    if (d.kind === "material" || d.kind === "source") assert.equal(d.jurisdiction, null);
  }
});

test("event and watched documents carry their mechanisms; other kinds carry none", () => {
  for (const d of docs) {
    if (d.kind === "event") {
      const e = getAllEvents().find((ev) => ev.id === d.id)!;
      assert.deepEqual(d.mechanisms, e.mechanism);
    } else if (d.kind === "watched") {
      const w = getAllWatchedSources().find((ws) => ws.id === d.id)!;
      assert.deepEqual(d.mechanisms, w.mechanisms);
    } else {
      assert.equal(d.mechanisms, null, `${d.kind}:${d.id} should not carry mechanisms`);
    }
  }
});

test("actor filtering (by hand, the way the search page applies it) narrows to that actor's records", () => {
  const china = docs.filter((d) => d.jurisdiction === "china");
  assert.ok(china.length > 0);
  assert.ok(china.every((d) => d.jurisdiction === "china"));
  // Every China event is represented.
  const chinaEventIds = new Set(getAllEvents().filter((e) => e.jurisdiction === "china").map((e) => e.id));
  const indexedChinaEventIds = new Set(
    china.filter((d) => d.kind === "event").map((d) => d.id),
  );
  assert.deepEqual(indexedChinaEventIds, chinaEventIds);
});

test("a capital document carries a government only when one provides the money", () => {
  for (const d of docs.filter((x) => x.kind === "capital")) {
    const c = getAllFinancialCommitments().find((x) => x.id === d.id)!;
    assert.equal(d.jurisdiction, c.providerJurisdiction, d.id);
  }
});

test("Capital & Control rows are searchable by party, customs code and document wording", () => {
  const ids = (q: string) => searchDocs(docs, q).map((d) => d.id);
  assert.ok(ids("Tungsten West").includes("fin-uk-nwf-2026-tungsten-west-package"));
  assert.ok(ids("2805301200").includes("ctl-cn-ree-2025-04-export-licensing"), "a Chinese customs reference code finds its clause");
  assert.ok(ids("Sinomine").some((id) => id.startsWith("ctl-ca-ica-2022-divest-")));
  assert.ok(ids("境外军事用户").includes("ctl-cn-ree-2025-10-military-listed-end-users"), "CJK end-user wording is indexed verbatim");
});
