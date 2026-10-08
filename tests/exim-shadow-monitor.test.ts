import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  EXIM_LISTING, EXIM_SOURCE_ID, eximEditorialQueue, parseEximArticle,
  parseEximNewsListing, readEximState, runEximShadow, type EximState,
} from "@/lib/exim-shadow-monitor";

const stamp = "2026-10-08T00:45:00.000Z";
const path = (n: number) => "exim-critical-minerals-project-" + n;
const date = (n: number) => n === 1 ? "Oct 6, 2026" : "Sep 23, 2026";
const title = (n: number) => n === 1 ? "EXIM Announces $547 Million Loan Guarantee to Support Manufacturing" :
  "EXIM Signs Framework to Support Critical Minerals Development Number " + n;
const articleUrl = (n: number) => EXIM_LISTING + "/" + path(n);
const listing = (ids: number[]) => "<html><body><main>" + ids.map((n) =>
  '<div class="views-row"><div class="date">' + date(n) +
  '</div><div class="title"><a href="' + articleUrl(n) + '">' + title(n) +
  "</a></div></div>").join("") + "</main></body></html>";
const article = (n: number, altered = false) => "<html><body><header>Other EXIM links</header><main>" +
  "<h1>" + title(n) + "</h1><div><strong>FOR IMMEDIATE RELEASE " +
  (n === 1 ? "October 6, 2026" : "September 23, 2026") + "</strong></div>" +
  "<p>WASHINGTON, DC. The bank describes a " + (altered ? "substantively amended" : "new") +
  " announcement. The referenced transaction remains subject to review, and the listing does " +
  "not establish whether an amount has been obligated, contracted, disbursed, or attributed to " +
  "any particular critical-minerals project. This paragraph supplies a stable publication body.</p>" +
  "<p>The terms are for purposes of further research and require human verification.</p>" +
  "<h2>ABOUT EXIM:</h2><footer>Dynamic footer</footer></main></body></html>";
const mock = (ids: number[], changes: Set<number> = new Set(), second: number[] | null = null,
  third: number[] | null = null) => {
  const seenUrls: string[] = [];
  const fn = (async (input: string) => {
    seenUrls.push(input);
    const url = new URL(input);
    if (url.pathname === "/news") {
      const page = Number(url.searchParams.get("page") ?? "0");
      return new Response(listing(page === 0 ? ids : page === 1 ? second ?? ids : third ?? ids), { status: 200 });
    }
    const number = Number(url.pathname.match(/(\d+)$/)?.[1]);
    return new Response(article(number, changes.has(number)), { status: 200 });
  }) as typeof fetch;
  return { fn, seenUrls };
};
const five = [1, 2, 3, 4, 5];

test("EXIM listings yield stable canonical identities and verified nearby dates, not fabricated dates", () => {
  const first = parseEximNewsListing(listing(five));
  assert.equal(first.length, five.length);
  assert.equal(first[0].publicationDate, "2026-10-06");
  assert.equal(first[1].publicationDate, "2026-09-23");
  assert.equal(first[0].url, articleUrl(1));
  assert.match(first[0].id, /^[a-f0-9]{64}$/);
  const apex = listing(five).replaceAll("https://www.exim.gov", "https://exim.gov");
  assert.deepEqual(parseEximNewsListing(apex), first);
  assert.throws(() => parseEximNewsListing(listing(five).replace("Oct 6, 2026", "")), /no nearby official publication date/);
  assert.throws(() => parseEximNewsListing("<html><body>No dated news listings</body></html>"), /anchors/);
  assert.throws(() => parseEximNewsListing(listing([1, 2, 3])), /fewer than five/);
  assert.throws(() => parseEximNewsListing(listing(five).replace("https://www.exim.gov/news/", "https://bad.example/news/")), /fewer than five|no nearby/);
});

test("actual EXIM Media Advisories navigation link never becomes a dated release", async () => {
  // Run 37730218209 failed on the category URL below. In the official index
  // this link is part of navigation, not an individually dated publication.
  const nav = '<nav><a href="/news/media-advisories">Media Advisories</a></nav>';
  const before = "<html><body>" + nav + listing(five).replace(/^<html><body>/, "").replace(/<\/body><\/html>$/, "") +
    "</body></html>";
  const expected = parseEximNewsListing(listing(five));
  assert.deepEqual(parseEximNewsListing(before), expected);
  // A category link between two dated entries must not reuse the first date.
  const middle = listing(five).replace('</a></div></div>', '</a></div></div>' + nav);
  assert.deepEqual(parseEximNewsListing(middle), expected);
  // An undated, article-shaped unknown URL STILL fails closed rather than
  // silently disappearing just because category navigation is permitted.
  const unknown = listing(five).replace("<main>", '<main><a href="/news/exim-new-unknown-story">Undated unknown EXIM release</a>');
  assert.throws(() => parseEximNewsListing(unknown), /no nearby official publication date/);
  const baseline = await runEximShadow(null, stamp, true, (async (url: string) => new Response(
    url.includes("?page=") ? before :
      article(Number(new URL(url).pathname.match(/(\d+)$/)?.[1])),
    { status: 200 },
  )) as typeof fetch);
  assert.equal(baseline.report.health, "ok");
  assert.equal(baseline.report.observed, 5);
  assert.equal(baseline.queue.items.length, 0);
  assert.ok(baseline.state);
});

test("EXIM official Meeting Minutes section is not a dated news release", async () => {
  const expected = parseEximNewsListing(listing(five));
  const meetingNav = '<nav><a href="/news/meeting-minutes">Meeting Minutes</a></nav>';
  const withCategory = listing(five).replace("<main>", "<main>" + meetingNav);
  assert.deepEqual(parseEximNewsListing(withCategory), expected);
  // EXIM category links remain out of release scope even when a dated card
  // precedes them, so no neighboring date can be attributed to the section.
  const afterDatedCard = listing(five).replace("</a></div></div>",
    "</a></div></div>" + meetingNav);
  assert.deepEqual(parseEximNewsListing(afterDatedCard), expected);
  const apexAlias = listing(five).replace("<main>",
    '<main><nav><a href="https://exim.gov/news/meeting-minutes/">Board Agendas and Meeting Minutes</a></nav>');
  assert.deepEqual(parseEximNewsListing(apexAlias), expected);
  // Preserve the fail-closed behavior for an unknown undated article-shaped link.
  const unknown = listing(five).replace("<main>",
    '<main><a href="/news/unverified-board-statement">Unverified board statement</a>');
  assert.throws(() => parseEximNewsListing(unknown),
    /no nearby official publication date: https:\/\/www\.exim\.gov\/news\/unverified-board-statement/);
  const result = await runEximShadow(null, stamp, true,
    (async (url: string) => new Response(
      url.includes("?page=") ? withCategory :
        article(Number(new URL(url).pathname.match(/(\d+)$/)?.[1])),
      { status: 200 },
    )) as typeof fetch);
  assert.equal(result.report.health, "ok");
  assert.equal(result.report.observed, 5);
  assert.ok(result.state);
  assert.equal(result.report.newCount, 0);
});

test("EXIM untitled duplicate anchors need an independently dated headline for the same URL", () => {
  const expected = parseEximNewsListing(listing(five));
  const thumbnail = '<a href="' + articleUrl(1) + '"><img src="/media/preview.jpg" alt="EXIM"></a>';
  // A real dated card can link its image and its headline separately.
  const withThumbnail = listing(five).replace(
    '<div class="title"><a href="' + articleUrl(1) + '">',
    '<div class="title">' + thumbnail + '<a href="' + articleUrl(1) + '">',
  );
  assert.deepEqual(parseEximNewsListing(withThumbnail), expected);
  // This also holds when the presentation-only link appears after the title.
  const afterTitle = listing(five).replace(
    '</a></div></div>',
    '</a>' + thumbnail + '</div></div>',
  );
  assert.deepEqual(parseEximNewsListing(afterTitle), expected);
  // Unknown article-shaped image-only links are never silently ignored.
  const unknown = listing(five).replace(
    '<main>',
    '<main><a href="/news/unverified-untitled"><img src="/media/unknown.jpg"></a>',
  );
  assert.throws(() => parseEximNewsListing(unknown),
    /EXIM article-shaped link lacks verified dated headline anchor: https:\/\/www\.exim\.gov\/news\/unverified-untitled/);
  // Very long anchor text without a separately verified title also fails.
  const tooLong = listing(five).replace(
    '<main>',
    '<main><a href="/news/unverified-long-headline">' + "L".repeat(601) + '</a>',
  );
  assert.throws(() => parseEximNewsListing(tooLong),
    /EXIM article-shaped link lacks verified dated headline anchor: https:\/\/www\.exim\.gov\/news\/unverified-long-headline/);
});

test("EXIM release-body verification preserves date/title and detects material text edits", () => {
  const listed = parseEximNewsListing(listing(five))[0];
  const row = parseEximArticle(article(1), listed);
  assert.equal(row.publicationDate, "2026-10-06");
  assert.equal(row.keywordHintOnly, false); // A generic manufacturing loan is not automatically a minerals signal.
  assert.equal(parseEximArticle(article(2), parseEximNewsListing(listing(five))[1]).keywordHintOnly, true);
  assert.notEqual(row.fingerprint, parseEximArticle(article(1, true), listed).fingerprint);
  const withFooter = article(1).replace("Dynamic footer", "Unrelated dynamic content");
  assert.equal(row.fingerprint, parseEximArticle(withFooter, listed).fingerprint);
  assert.throws(() => parseEximArticle(article(1).replace("October 6, 2026", "October 7, 2026"), listed), /date disagrees/);
  assert.throws(() => parseEximArticle(article(1).replace("ABOUT EXIM:", "FREQUENTLY ASKED QUESTIONS:"), listed), /release-body boundary/);
});

test("explicit baseline, unchanged replay and real body revision preserve versioned state separately", async () => {
  await assert.rejects(runEximShadow(null, stamp, false, mock(five).fn), /baseline missing/);
  const b = await runEximShadow(null, stamp, true, mock(five).fn);
  assert.equal(b.report.health, "ok");
  assert.equal(b.report.baseline, true);
  assert.equal(b.report.observed, 5);
  assert.equal(b.report.newCount, 0);
  assert.equal(b.queue.items.length, 0);
  assert.ok(b.state);
  assert.doesNotThrow(() => readEximState(b.state));
  await assert.rejects(runEximShadow(b.state, stamp, true, mock(five).fn), /re-baseline/);
  const replay = await runEximShadow(b.state, "2026-10-09T00:45:00.000Z", false, mock(five).fn);
  assert.equal(replay.report.baseline, false);
  assert.equal(replay.report.newCount, 0);
  assert.equal(replay.report.revisedCount, 0);
  assert.equal(replay.queue.items.length, 0);
  const change = await runEximShadow(b.state, "2026-10-10T00:45:00.000Z", false, mock(five, new Set([2])).fn);
  assert.equal(change.report.revisedCount, 1);
  assert.equal(change.report.newCount, 0);
  assert.equal(change.queue.items[0].change, "revised");
  assert.equal(change.queue.items[0].reviewStatus, "unreviewed");
  assert.equal(change.queue.items[0].watchSourceId, EXIM_SOURCE_ID);
  assert.deepEqual(eximEditorialQueue(change.report), change.queue);
  assert.doesNotMatch(JSON.stringify(change.queue), /proposedEvent|financialCommitment|approvedAt|promotion/);
});

test("one new release generates review-only metadata without an assumed financing status", async () => {
  const b = await runEximShadow(null, stamp, true, mock(five).fn);
  const next = await runEximShadow(b.state, "2026-10-09T00:45:00.000Z", false,
    mock([6, ...five]).fn);
  assert.equal(next.report.health, "ok");
  assert.equal(next.report.newCount, 1);
  assert.equal(next.queue.items.length, 1);
  assert.equal(next.queue.items[0].officialUrl, articleUrl(6));
  assert.ok(next.state && next.state.lastLatestId !== b.state?.lastLatestId);
});

test("bounded pagination locates an old anchor on page 1 without claiming coverage gaps", async () => {
  const b = await runEximShadow(null, stamp, true, mock(five).fn);
  const second = mock([11, 12, 13, 14, 15], new Set(), five);
  const next = await runEximShadow(b.state, "2026-10-09T00:45:00.000Z", false, second.fn);
  assert.equal(next.report.health, "ok");
  assert.equal(next.report.pagesRead, 2);
  assert.equal(next.report.observed, 10);
  assert.equal(next.report.newCount, 5);
  assert.equal(next.report.possibleWindowGap, false);
  assert.ok(second.seenUrls.some((url) => url.includes("page=1")));
});

test("missing anchor at 3-page cap leaves prior memory unchanged and emits no candidate queue", async () => {
  const b = await runEximShadow(null, stamp, true, mock(five).fn);
  const missed = await runEximShadow(b.state, "2026-10-09T00:45:00.000Z", false,
    mock([11, 12, 13, 14, 15], new Set(), [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]).fn);
  assert.equal(missed.report.possibleWindowGap, true);
  assert.equal(missed.report.newCount, 0);
  assert.equal(missed.queue.items.length, 0);
  assert.deepEqual(missed.state, b.state);
});

test("HTTP 429 and failed article never overwrite prior healthy EXIM observation history", async () => {
  const b = await runEximShadow(null, stamp, true, mock(five).fn);
  const blocked = await runEximShadow(b.state, "2026-10-09T00:45:00.000Z", false,
    (async (url: string) => new Response(url.includes("?page=") ? "Too many requests" : article(1), { status: 429 })) as typeof fetch);
  assert.equal(blocked.report.health, "blocked");
  assert.equal(blocked.queue.items.length, 0);
  assert.deepEqual(blocked.state, b.state);
  const broken = await runEximShadow(b.state, "2026-10-09T00:45:00.000Z", false,
    (async (url: string) => new Response(url.includes("?page=") ? listing(five) : "<html>broken content</html>")) as typeof fetch);
  assert.notEqual(broken.report.health, "ok");
  assert.deepEqual(broken.state, b.state);
  assert.equal(broken.queue.items.length, 0);
});

test("corrupt restored state must not re-bootstrap and report source ID is independent of the M1 pilot", () => {
  assert.throws(() => readEximState({ version: 1, sourceId: EXIM_SOURCE_ID, seen: {} }), /invalid/);
  assert.throws(() => readEximState({ version: 1, sourceId: "watch-ca-nrcan-news" }), /invalid/);
  const m1 = readFileSync("lib/source-monitor.ts", "utf8");
  assert.doesNotMatch(m1, /watch-us-exim-news-shadow/);
  const mainFlow = readFileSync(".github/workflows/source-monitor-pilot.yml", "utf8");
  assert.doesNotMatch(mainFlow, /monitor:exim|smpt-exim-state/);
  const eximFlow = readFileSync(".github/workflows/exim-shadow-monitor.yml", "utf8");
  assert.match(eximFlow, /contents: read\s+actions: read/);
  assert.match(eximFlow, /workflow_dispatch/);
  assert.match(eximFlow, /smpt-exim-state-/);
  assert.doesNotMatch(eximFlow, /contents: write|pull-requests: write|data\/seed/);
});

test("EXIM CLI starts via exact npm entry point with no network access or disk writes", () => {
  const output = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "monitor:exim", "--", "--check-runtime"],
    { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 });
  assert.match(output, /M2\.1 EXIM CLI runtime check passed/);
});
