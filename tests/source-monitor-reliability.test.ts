import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  federalRegisterNextPage,
  readMonitorState,
  requirePriorPilotState,
  runSourcePilot,
  type FetchFunction,
} from "@/lib/source-monitor";
import { buildEditorialReviewQueue } from "@/lib/monitor-editorial-queue";
import { getAllWatchedSources } from "@/lib/data";

const frRoot = "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=interior-department&order=newest&per_page=100";
const secondPage = frRoot + "&page=2";
const ca = `<feed xmlns="http://www.w3.org/2005/Atom"><entry>
<id>tag:canada.ca,2026:one</id><title>Critical minerals cooperation</title>
<published>2026-10-07T13:00:00Z</published><link rel="alternate" href="https://www.canada.ca/en/official.html"/>
</entry></feed>`;
const fedRow = (number: number, title = "Document " + number) => ({
  document_number: "2026-" + String(number).padStart(5, "0"),
  title, html_url: "https://www.federalregister.gov/documents/2026/10/07/2026-" + String(number).padStart(5, "0") + "/notice",
  publication_date: "2026-10-07",
});
const fedPage = (numbers: number[], next: string | null, special?: Record<number, string>) =>
  JSON.stringify({
    next_page_url: next,
    results: numbers.map((n) => fedRow(n, special?.[n])),
  });
const sourceList = getAllWatchedSources();
const source = "watch-us-federal-register-interior";

test("lost or partial unattended state fails closed, without inventing a fresh baseline", async () => {
  assert.throws(() => requirePriorPilotState(readMonitorState(null)), /refuse silent re-baseline/);
  const partial = { version: 1 as const, sources: {
    "watch-ca-nrcan-news": { seen: {}, lastLatestId: null, lastSuccessfulAt: "2026-10-07T00:00:00Z" },
  } };
  assert.throws(() => requirePriorPilotState(partial), /refuse silent re-baseline/);
  const baseline = await runSourcePilot(sourceList, readMonitorState(null), "2026-10-07T00:00:00Z",
    (async (url: string) => new Response(url.includes("federalregister.gov") ?
      fedPage([1], null) : ca)) as FetchFunction);
  assert.doesNotThrow(() => requirePriorPilotState(baseline.state));
});

test("bounded cursor pagination crosses 100-document boundary and preserves revised/new review intake", async () => {
  const bootstrap = await runSourcePilot(sourceList, readMonitorState(null), "2026-10-07T00:00:00Z",
    (async (url: string) => new Response(url.includes("federalregister.gov") ?
      fedPage([1], null) : ca)) as FetchFunction);
  let frRequests = 0;
  const recent = Array.from({ length: 100 }, (_, index) => 200 - index);
  const mock = (async (url: string) => {
    if (!url.includes("federalregister.gov")) return new Response(ca);
    frRequests += 1;
    return new Response(url.includes("page=2")
      ? fedPage([1], null, { 1: "Document 1 (amended)" })
      : fedPage(recent, secondPage));
  }) as FetchFunction;
  const first = await runSourcePilot(sourceList, bootstrap.state, "2026-10-08T00:00:00Z", mock);
  assert.equal(frRequests, 2);
  assert.equal(first.report.allSourcesHealthy, true);
  assert.equal(first.report.sources[1].observed, 101);
  assert.equal(first.report.sources[1].possibleWindowGap, false);
  assert.equal(first.report.newPublications, 100);
  assert.equal(first.report.revisions, 1);
  const intake = buildEditorialReviewQueue(first.report, []);
  assert.equal(intake.items.length, 101);
  assert.equal(intake.countNew, 100);
  assert.equal(intake.countRevised, 1);
  assert.equal(intake.items.every((x) => x.reviewStatus === "unreviewed"), true);
  assert.equal(intake.items.some((x) => x.titleAsListed === "Document 1 (amended)" && x.change === "revised"), true);
  frRequests = 0;
  const repeated = await runSourcePilot(sourceList, first.state, "2026-10-09T00:00:00Z", mock);
  assert.equal(frRequests, 1); // Previous latest is now in page 1.
  assert.equal(repeated.report.newPublications, 0);
  assert.equal(repeated.report.revisions, 0);
  assert.deepEqual(buildEditorialReviewQueue(repeated.report, []).items, []);
});

test("four-page cap reports possible missed coverage if previous anchor is lost", async () => {
  const baseline = await runSourcePilot(sourceList, readMonitorState(null), "2026-10-07T00:00:00Z",
    (async (url: string) => new Response(url.includes("federalregister.gov") ?
      fedPage([1], null) : ca)) as FetchFunction);
  let frRequests = 0;
  const mock = (async (url: string) => {
    if (!url.includes("federalregister.gov")) return new Response(ca);
    frRequests += 1;
    const page = Number(new URL(url).searchParams.get("page") ?? "1");
    const numbers = Array.from({ length: 100 }, (_, n) => 500 - ((page - 1) * 100) - n);
    return new Response(fedPage(numbers, frRoot + "&page=" + (page + 1)));
  }) as FetchFunction;
  const scan = await runSourcePilot(sourceList, baseline.state, "2026-10-08T00:00:00Z", mock);
  assert.equal(frRequests, 4);
  assert.equal(scan.report.sources[1].health, "ok");
  assert.equal(scan.report.sources[1].observed, 400);
  assert.equal(scan.report.sources[1].possibleWindowGap, true);
  // A green HTTP 200 and 400 collected documents are not proof of complete
  // continuity; the Actions health gate must fail on this flag.
});

test("second-page denial never overwrites the previously healthy Federal Register identity state", async () => {
  const baseline = await runSourcePilot(sourceList, readMonitorState(null), "2026-10-07T00:00:00Z",
    (async (url: string) => new Response(url.includes("federalregister.gov") ?
      fedPage([1], null) : ca)) as FetchFunction);
  const scan = await runSourcePilot(sourceList, baseline.state, "2026-10-08T00:00:00Z",
    (async (url: string) => !url.includes("federalregister.gov") ? new Response(ca) :
      url.includes("page=2") ? new Response("Too many requests", { status: 429 }) :
      new Response(fedPage(Array.from({ length: 100 }, (_, n) => 200 - n), secondPage))) as FetchFunction);
  assert.equal(scan.report.sources[1].health, "blocked");
  assert.equal(scan.report.sources[1].status, 429);
  assert.equal(scan.report.sources[1].newCount, 0);
  assert.equal(scan.report.allSourcesHealthy, false);
  assert.deepEqual(scan.state.sources[source], baseline.state.sources[source]);
});

test("Federal Register next-page traversal rejects off-domain, filtered-away and looping URLs", async () => {
  assert.equal(federalRegisterNextPage(fedPage([1], null)), null);
  assert.equal(federalRegisterNextPage(fedPage([1], secondPage)), secondPage);
  assert.throws(() => federalRegisterNextPage(fedPage([1], "https://example.org/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=interior-department&per_page=100")), /escaped original/);
  assert.throws(() => federalRegisterNextPage(fedPage([1], "https://www.federalregister.gov/api/v1/documents.json?per_page=100&page=2")), /escaped original/);
  const baseline = await runSourcePilot(sourceList, readMonitorState(null), "2026-10-07T00:00:00Z",
    (async (url: string) => new Response(url.includes("federalregister.gov") ?
      fedPage([1], null) : ca)) as FetchFunction);
  const scan = await runSourcePilot(sourceList, baseline.state, "2026-10-08T00:00:00Z",
    (async (url: string) => new Response(url.includes("federalregister.gov")
      ? fedPage(Array.from({ length: 100 }, (_, n) => 200 - n), frRoot)
      : ca)) as FetchFunction);
  assert.equal(scan.report.sources[1].health, "invalid_response"); // Pagination loop fails closed.
});

test("workflow stays daily, read-only, cache-recoverable and does not publish candidate or seed data", () => {
  const yml = readFileSync(".github/workflows/source-monitor-pilot.yml", "utf8");
  assert.match(yml, /cron: "17 13 \* \* \*"/);
  assert.match(yml, /permissions:\s+contents: read\s+actions: read/);
  assert.match(yml, /actions\/download-artifact@v4/);
  assert.match(yml, /smpt-monitor-state-/);
  assert.match(yml, /SMPT_MONITOR_REQUIRE_PRIOR_STATE: "1"/);
  assert.doesNotMatch(yml, /contents: write|pull-requests: write/);
});
