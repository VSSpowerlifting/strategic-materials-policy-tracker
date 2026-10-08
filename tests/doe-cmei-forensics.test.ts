import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  DOE_CMEI_LISTING_0, DOE_CMEI_LISTING_1, DOE_CMEI_EXAMPLES,
  parseDoeListingForensics, parseDoeArticleForensics, runDoeCmeiPreflight,
} from "@/scripts/doe-cmei-forensics";

const link0 = "https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national";
const link1 = "https://www.energy.gov/cmei/articles/energy-department-launches-16-million-prize-grow-mining-and-critical-minerals";
const link2 = "https://www.energy.gov/cmei/articles/doe-launches-new-program-help-builders-cut-construction-costs-and-save-americans";
const link3 = "https://www.energy.gov/articles/does-office-critical-minerals-and-energy-innovation-announces-73-million-advance-domestic";
const link4 = "https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-117-million-strengthen";
const link5 = "https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-162-million-industrial";
function listing(links: string[]) {
  return "<html><main><h1>Latest News</h1><div>Office of Critical Minerals and Energy Innovation</div>" +
    links.map((url, n) => '<article><a href="' + url +
      '">DOE official article ' + (n + 1) + ' on mining innovations and research</a>' +
      "<time>September " + (30 - n) + ", 2026</time></article>").join("") +
    "</main></html>";
}
function article(heading: string, body: string) {
  return "<html><head><meta property=\"article:published_time\" content=\"2026-09-30T12:00:00Z\">" +
    "</head><main><h1>" + heading + "</h1>" +
    "<div>Office of Critical Minerals and Energy Innovation</div>" +
    "<time>September 30, 2026</time><div>" + body + "</div>" +
    "<nav>View NextPress Release: September 29, 2026</nav></main></html>";
}
const samples = [
  article("DOE Announces $29.5 Million for National Laboratory Mining Projects",
    "Selected for award negotiations, not final disbursements."),
  article("Energy Department Launches $16 Million Prize for Mining Workforce",
    "Prize pool announced; competition applications opened."),
  article("DOE New Program for Home Builders",
    "New construction support, unrelated to critical minerals."),
];
function mockGet(responseFor: (url: string) => Response): typeof fetch {
  return (async (input: string | URL | Request) => responseFor(String(input))) as typeof fetch;
}
const fixtureFetch = mockGet((url) => {
  const body = url === DOE_CMEI_LISTING_0 ? listing([link0, link1, link2, link3]) :
    url === DOE_CMEI_LISTING_1 ? listing([link4, link5, link3]) :
    samples[DOE_CMEI_EXAMPLES.findIndex((x) => x.url === url)];
  if (!body) return new Response("not found", { status: 404 });
  return new Response(body, { status: 200,
    headers: { "content-type": "text/html; charset=utf-8" } });
});

test("shared featured-news chrome is separately reported and never masquerades as paginated DOE rows", () => {
  const common = [
    "https://www.energy.gov/articles/energy-department-announces-new-genesis-mission-awards-advance-super-intelligence-science",
    "https://www.energy.gov/articles/fact-sheet-delivering-president-trumps-promise-unleash-prosperity-and-security-united",
    "https://www.energy.gov/articles/fact-sheet-golden-era-american-nuclear-energy-has-arrived",
  ];
  const featureHeader = "<header><section>" + common.map((url, n) =>
    '<a href="' + url + '">DOE global featured newsroom headline number ' + n + "</a>").join("") +
    "</section></header>";
  const page0 = parseDoeListingForensics(
    listing([link0, link1, link2, link3]).replace("<html>", "<html>" + featureHeader),
    DOE_CMEI_LISTING_0,
  );
  const page1 = parseDoeListingForensics(
    listing([link4, link5]).replace("<html>", "<html>" + featureHeader),
    DOE_CMEI_LISTING_1,
  );
  assert.deepEqual(page0.anchorCandidates.map((a) => a.url),
    [link0, link1, link2, link3]);
  assert.equal(page0.outsideMainArticleHints.length, 3);
  assert.equal(page1.outsideMainArticleHints.length, 3);
  assert.deepEqual(
    page0.outsideMainArticleHints.map((a) => a.url),
    page1.outsideMainArticleHints.map((a) => a.url),
  );
  assert.equal(page0.anchorCandidates.some((a) => common.includes(a.url)), false);
  assert.equal(page1.anchorCandidates.some((a) => common.includes(a.url)), false);
  // /articles/ links inside the results still survive; blanket filtering
  // to /cmei/articles/ would have silently dropped genuine DOE stories.
  assert.equal(page0.anchorCandidates.some((a) => a.url === link3), true);
  const commonCount = page0.anchorCandidates.filter((a) =>
    page1.anchorCandidates.some((b) => b.url === a.url)).length;
  assert.equal(commonCount, 0);
});

test("DOE listing must have exactly one main region; missing main or ambiguous nested pages fail closed", () => {
  assert.throws(() => parseDoeListingForensics(
    '<html><header><a href="' + link0 +
    '">DOE official critical minerals announcement latest news</a></header></html>',
    DOE_CMEI_LISTING_0,
  ), /single bounded <main>/);
  assert.throws(() => parseDoeListingForensics(
    listing([link0, link1, link2]).replace("</html>",
      '<main><h1>Second DOE page content</h1></main></html>'),
    DOE_CMEI_LISTING_0,
  ), /single bounded <main>/);
});

test("DOE listing evidence is source-shaped and not a verified publisher card/date binding", () => {
  const page = parseDoeListingForensics(listing([link0, link1, link2]),
    DOE_CMEI_LISTING_0);
  assert.equal(page.status, 200);
  assert.equal(page.headingHint, "Latest News");
  assert.equal(page.anchorCandidates.length, 3);
  assert.equal(page.unpairedVisibleDateHints.length, 3);
  assert.ok(page.notes.some((x) => x.includes("not bound")));
  assert.match(page.htmlDigestSha256, /^[a-f0-9]{64}$/);
  assert.equal(page.anchorCandidates[0].url, link0);
});

test("DOE article excerpts carry nonbinding metadata diagnostics and negative-control role", () => {
  const result = parseDoeArticleForensics(samples[0],
    "mining_selections_not_contracts", link0);
  assert.match(result.headingHint ?? "", /National Laboratory Mining/);
  assert.ok(result.metaDateHints.length > 0);
  assert.ok(result.notes.some((x) => /not contracted/.test(x)));
  const negative = parseDoeArticleForensics(samples[2],
    "non_minerals_control", link2);
  assert.ok(negative.notes.some((x) => /Negative-control/.test(x)));
  assert.equal(negative.officeAttributionHint, true);
});

test("five bound official requests return forensics only and flag listing overlap", async () => {
  const requests: string[] = [];
  const r = await runDoeCmeiPreflight("2026-10-08T17:07:00Z",
    mockGet((url) => { requests.push(url); return fixtureFetch(url) as unknown as Response; }));
  assert.deepEqual(requests, [
    DOE_CMEI_LISTING_0, DOE_CMEI_LISTING_1, ...DOE_CMEI_EXAMPLES.map((x) => x.url),
  ]);
  assert.equal(r.eligibleForMonitoringActivation, false);
  assert.equal(r.pages.length, 2);
  assert.equal(r.articles.length, 3);
  assert.equal(r.listedAcrossPages, 6);
  assert.equal(r.overlapBetweenPages, 1);
  assert.equal(r.status, "degraded_do_not_activate");
  assert.ok(r.warnings.some((w) => /overlap/.test(w)));
});

test("unambiguous example with disjoint listing candidates remains forensic, not monitoring eligible", async () => {
  const fetcher = mockGet((url) =>
    new Response(url === DOE_CMEI_LISTING_0 ? listing([link0, link1, link2]) :
      url === DOE_CMEI_LISTING_1 ? listing([link3, link4, link5]) :
      samples[DOE_CMEI_EXAMPLES.findIndex((x) => x.url === url)], {
        headers: { "content-type": "text/html" },
      }));
  const r = await runDoeCmeiPreflight("2026-10-08T17:07:00Z", fetcher);
  assert.equal(r.status, "observed_forensic_only");
  assert.equal(r.eligibleForMonitoringActivation, false);
  assert.equal(r.overlapBetweenPages, 0);
  assert.equal(r.listedAcrossPages, 6);
});

test("missing article, source block, changed HTML and redirected host fail source admission", async () => {
  const blocked = await runDoeCmeiPreflight("2026-10-08T17:07:00Z",
    mockGet((url) => url === DOE_CMEI_EXAMPLES[0].url ?
      new Response("Forbidden", { status: 403 }) :
      new Response(url.includes("page=1") ? "<div>not html</div>" :
        url.includes("/collection/") ? listing([link0, link1, link2]) : samples[1], {
          headers: { "content-type": "text/html" },
        })));
  assert.equal(blocked.status, "degraded_do_not_activate");
  assert.ok(blocked.warnings.length > 1);
  assert.equal(blocked.eligibleForMonitoringActivation, false);

  const redirected = mockGet(() => {
    const response = new Response(listing([link0]), {
      headers: { "content-type": "text/html" },
    });
    Object.defineProperty(response, "url", { value: "https://malicious.example/anything" });
    return response;
  });
  const result = await runDoeCmeiPreflight("2026-10-08T17:07:00Z", redirected);
  assert.equal(result.pages.length, 0);
  assert.equal(result.articles.length, 0);
  assert.equal(result.status, "degraded_do_not_activate");
});

test("data discipline: reject off-site article links, duplicates, overlong titles and unbounded HTML", () => {
  const html = "<html><h1>Latest News</h1>" +
    '<a href="https://malicious.example/articles/foreign">Foreign fake official release</a>' +
    '<a href="' + link0 + '">A solid critical materials official news title</a>' +
    '<a href="' + link0 + '">Duplicate title for same official source</a>' +
    '<a href="/cmei/articles/x">short</a>' +
    '<a href="/cmei/articles/' + "x".repeat(20) + '">' + "T".repeat(550) + "</a></html>";
  const p = parseDoeListingForensics(html, DOE_CMEI_LISTING_0);
  assert.equal(p.anchorCandidates.length, 1);
  assert.equal(p.anchorCandidates[0].url, link0);
  assert.throws(() => parseDoeListingForensics("<html>" + "z".repeat(2_000_001),
    DOE_CMEI_LISTING_0), /bounded HTML/);
  assert.throws(() => parseDoeListingForensics("<html></html>",
    DOE_CMEI_LISTING_0, "https://evil.example/news"), /publisher host/);
});

test("workflow is manual-only, read-only and never edits source collector or seeded finance records", () => {
  const y = readFileSync(".github/workflows/doe-cmei-provenance-preflight.yml", "utf8");
  const code = readFileSync("scripts/doe-cmei-forensics.ts", "utf8");
  assert.match(y, /workflow_dispatch:/);
  assert.doesNotMatch(y, /\bcron:|\bschedule:|contents: write|actions: write|git push/);
  assert.match(y, /contents: read/);
  assert.match(y, /persist-credentials: false/);
  assert.doesNotMatch(code, /source-monitor-state|data\/seed\/|site\.monitoringStartedAt/);
  const out = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "monitor:probe-doe-cmei", "--", "--check-runtime"], {
      encoding: "utf8", timeout: 20_000,
    });
  assert.match(out, /offline, no network or state writes/);
});
