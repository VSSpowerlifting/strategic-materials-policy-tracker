import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import {
  PILOT_SOURCE_IDS,
  parseNrcanAtom,
  parseFederalRegisterJson,
  readMonitorState,
  reconcilePublications,
  runSourcePilot,
  pilotEndpoint,
} from "@/lib/source-monitor";
import type { FetchFunction } from "@/lib/source-monitor";
import { getAllWatchedSources } from "@/lib/data";

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry><id>tag:canada.ca,2026:news-001</id><title>Critical minerals &amp; rare earths funding</title>
    <published>2026-10-05T10:15:00-04:00</published>
    <link rel="alternate" type="text/html" href="https://www.canada.ca/en/natural-resources-canada/news/2026/10/critical-minerals.html" /></entry>
  <entry><id>tag:canada.ca,2026:news-002</id><title>Forest health update</title>
    <updated>2026-10-06T16:00:00Z</updated><link rel="alternate" href="https://www.canada.ca/en/natural-resources-canada/news/2026/10/forest.html"/></entry>
</feed>`;
const fed = JSON.stringify({
  count: 2,
  results: [
    { document_number: "2026-19700", title: "Final critical minerals list", html_url: "https://www.federalregister.gov/documents/2026/10/06/2026-19700/test", publication_date: "2026-10-06" },
    { document_number: "2026-19699", title: "Park boundary notice", html_url: "https://www.federalregister.gov/documents/2026/10/06/2026-19699/park", publication_date: "2026-10-06" },
  ],
});
const watched = getAllWatchedSources();

test("M1 pilot uses exactly the two pre-registered official-source IDs and no new feed addresses", () => {
  assert.deepEqual([...PILOT_SOURCE_IDS], ["watch-ca-nrcan-news", "watch-us-federal-register-interior"]);
  const ca = watched.find((x) => x.id === PILOT_SOURCE_IDS[0])!;
  const us = watched.find((x) => x.id === PILOT_SOURCE_IDS[1])!;
  assert.equal(pilotEndpoint(ca), ca.url);
  assert.match(pilotEndpoint(us), /^https:\/\/www\.federalregister\.gov\/api\/v1\/documents\.json\?/);
  assert.match(pilotEndpoint(us), /interior-department/);
});

test("Atom parser decodes entities, prioritizes alternate link, preserves publication dates and does not classify policy events", () => {
  const rows = parseNrcanAtom(feed);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, "Critical minerals & rare earths funding");
  assert.equal(rows[0].publishedDate, "2026-10-05");
  assert.equal(rows[0].keywordHint, true);
  assert.equal(rows[1].keywordHint, false);
  assert.deepEqual(rows.map((r) => Object.keys(r).sort()), [
    ["fingerprint", "id", "keywordHint", "publishedDate", "title", "url"],
    ["fingerprint", "id", "keywordHint", "publishedDate", "title", "url"],
  ]);
  assert.throws(() => parseNrcanAtom("<html><entry></entry></html>"), /not a complete Atom feed/);
  assert.throws(() => parseNrcanAtom("<feed><entry><title>Not enough</title></entry></feed>"), /missing a stable ID/);
});

test("Federal Register parser requires stable document numbers, HTTPS canonical URLs and valid results", () => {
  const rows = parseFederalRegisterJson(fed);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].publishedDate, "2026-10-06");
  assert.equal(rows[0].keywordHint, true);
  assert.equal(rows[1].keywordHint, false);
  assert.throws(() => parseFederalRegisterJson(JSON.stringify({ nope: [] })), /results array/);
  assert.throws(() => parseFederalRegisterJson(JSON.stringify({
    results: [{ title: "Wrong site", document_number: "123", html_url: "https://example.org/not-government" }],
  })), /canonical URL/);
});

test("bootstrapping with no retained prior state does not manufacture new discoveries", () => {
  const initial = readMonitorState(null);
  const rows = parseNrcanAtom(feed);
  const first = reconcilePublications("watch-ca-nrcan-news", initial.sources["watch-ca-nrcan-news"], rows, "2026-10-07T12:00:00.000Z");
  assert.equal(first.report.baseline, true);
  assert.equal(first.report.newCount, 0);
  assert.equal(first.report.revisedCount, 0);
  assert.deepEqual(first.report.reviewOnly, []);
  assert.equal(Object.keys(first.memory.seen).length, 2);
});

test("unchanged items are suppressed on second run, new items surface exactly once, changed titles count as revisions", () => {
  const rows = parseNrcanAtom(feed);
  const first = reconcilePublications("watch-ca-nrcan-news", undefined, rows, "2026-10-07T12:00:00.000Z");
  const second = reconcilePublications("watch-ca-nrcan-news", first.memory, rows, "2026-10-08T12:00:00.000Z");
  assert.equal(second.report.newCount, 0);
  assert.equal(second.report.revisedCount, 0);
  const changed = [
    { ...rows[0], title: rows[0].title + " — revised", fingerprint: "a".repeat(64) },
    ...rows.slice(1),
    { ...rows[1], id: "b".repeat(64), title: "New source publication", fingerprint: "c".repeat(64) },
  ];
  const third = reconcilePublications("watch-ca-nrcan-news", second.memory, changed, "2026-10-09T12:00:00.000Z");
  assert.equal(third.report.newCount, 1);
  assert.equal(third.report.revisedCount, 1);
  assert.equal(third.report.reviewOnly.length, 2);
  const fourth = reconcilePublications("watch-ca-nrcan-news", third.memory, changed, "2026-10-10T12:00:00.000Z");
  assert.equal(fourth.report.newCount + fourth.report.revisedCount, 0);
});

test("two sources bootstrap independently; blocked or malformed responses never erase healthy baseline or report zero-change success", async () => {
  const fetchOk = async (url: string) => new Response(url.includes("federalregister.gov") ? fed : feed, { status: 200 });
  const first = await runSourcePilot(watched, readMonitorState(null), "2026-10-07T12:00:00Z", fetchOk as FetchFunction);
  assert.equal(first.report.degradedSources, 0);
  assert.equal(first.report.allSourcesHealthy, true);
  assert.deepEqual(first.report.sources.map((r) => r.baseline), [true, true]);
  assert.equal(first.report.newPublications, 0);

  const partial = await runSourcePilot(watched, first.state, "2026-10-08T12:00:00Z", (async (url: string) =>
    new Response(url.includes("federalregister.gov") ? "Blocked" : feed,
      { status: url.includes("federalregister.gov") ? 403 : 200 })) as FetchFunction);
  assert.equal(partial.report.degradedSources, 1);
  assert.equal(partial.report.allSourcesHealthy, false);
  assert.equal(partial.report.sources[1].health, "blocked");
  assert.equal(partial.report.sources[1].status, 403);
  assert.equal(partial.report.sources[1].lastSuccessfulAt, "2026-10-07T12:00:00Z");
  assert.deepEqual(partial.state.sources[PILOT_SOURCE_IDS[1]], first.state.sources[PILOT_SOURCE_IDS[1]]);
  assert.equal(partial.report.sources[0].health, "ok");

  const malformed = await runSourcePilot(watched, first.state, "2026-10-09T12:00:00Z", (async (url: string) =>
    new Response(url.includes("federalregister.gov") ? "{broken json" : feed, { status: 200 })) as FetchFunction);
  assert.equal(malformed.report.sources[1].health, "invalid_response");
  assert.deepEqual(malformed.state.sources[PILOT_SOURCE_IDS[1]], first.state.sources[PILOT_SOURCE_IDS[1]]);
});

test("corrupt or unsupported persisted state fails closed rather than reporting a reset baseline", () => {
  assert.throws(() => readMonitorState({ version: 2, sources: {} }), /unsupported or corrupt/);
  assert.throws(() => readMonitorState({ version: 1, sources: { [PILOT_SOURCE_IDS[0]]: { seen: { hello: "x" }, lastLatestId: null, lastSuccessfulAt: "now" } } }), /cache IDs invalid/);
});

test("all observed entries are review-only publication metadata; no private candidates or event records are emitted", async () => {
  const fetchOk = async (url: string) => new Response(url.includes("federalregister.gov") ? fed : feed, { status: 200 });
  const boot = await runSourcePilot(watched, readMonitorState(null), "2026-10-07T12:00:00Z", fetchOk as FetchFunction);
  const nextFed = JSON.parse(fed) as { results: Record<string, unknown>[] };
  nextFed.results.unshift({
    document_number: "2026-19800",
    title: "Rare earth materials notice",
    html_url: "https://www.federalregister.gov/documents/2026/10/08/2026-19800/test",
    publication_date: "2026-10-08",
  });
  const updated = await runSourcePilot(watched, boot.state, "2026-10-08T12:00:00Z", (async (url: string) =>
    new Response(url.includes("federalregister.gov") ? JSON.stringify(nextFed) : feed, { status: 200 })) as FetchFunction);
  assert.equal(updated.report.newPublications, 1);
  assert.equal(updated.report.sources[1].reviewOnly[0].title, "Rare earth materials notice");
  const payload = JSON.stringify(updated);
  assert.doesNotMatch(payload, /proposedEvent|framingClaim|financialCommitment|candidateId|approval|classification/);
  assert.match(payload, /shadow_review_only/);
});

test("published Atom links decode XML ampersands and the report preserves an actual successful HTTP status", async () => {
  const encoded = feed.replace("critical-minerals.html", "critical-minerals.html?lang=en&amp;topic=minerals");
  const parsed = parseNrcanAtom(encoded);
  assert.match(parsed[0].url, /lang=en&topic=minerals$/);

  const fetched = await runSourcePilot(
    watched, readMonitorState(null), "2026-10-07T14:00:00Z",
    (async (url: string) => new Response(url.includes("federalregister.gov") ? fed : encoded,
      { status: url.includes("federalregister.gov") ? 200 : 206 })) as FetchFunction,
  );
  assert.equal(fetched.report.sources[0].status, 206);
  assert.equal(fetched.report.sources[0].health, "ok");
});

test("monitor CLI starts via its actual npm command without network or report writes", () => {
  // Regression for Day-0 failure #37720568026: tsx transpiles this package's
  // script to CommonJS, which rejects top-level await even if TS itself passes.
  // --check-runtime exercises startup and official source configuration only.
  const out = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "monitor:pilot", "--", "--check-runtime"],
    { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 });
  assert.match(out, /SMPT pilot CLI runtime check passed \(offline, no observations written\)/);
});
