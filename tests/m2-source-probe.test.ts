import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  M2_CANDIDATES, extractOfficialArticleLinks, probeM2SourceCandidates,
} from "@/lib/m2-source-probe";

const candidates = M2_CANDIDATES;
const wrap = (...links: string[]) => "<html><body>" + links.join("\n") + "</body></html>";
const a = (href: string, title = "EXIM announces critical minerals financing package") =>
  '<a href="' + href + '">' + title + "</a>";

test("EXIM discoverability captures official article paths without swallowing cross-domain or navigation links", () => {
  const html = wrap(
    a("/news/exim-announces-critical-minerals-financing"),
    a("https://exim.gov/news/exim-announces-critical-minerals-financing#top", "EXIM announces critical minerals financing package"),
    a("https://www.exim.gov/news/exim-signs-minerals-framework", "EXIM signs new minerals framework with partner"),
    a("https://exim.gov/news?year=2026"), a("https://malicious.test/news/official-minerals"),
    a("javascript:alert(1)"), a("https://exim.gov@malicious.test/news/finance"),
    a("http://www.exim.gov/news/unsecure"),
  );
  const rows = extractOfficialArticleLinks(html, candidates[0]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].url, "https://www.exim.gov/news/exim-announces-critical-minerals-financing");
  assert.equal(rows[1].url, "https://www.exim.gov/news/exim-signs-minerals-framework");
});

test("DOE and DoW discovery are bounded to their respective publication paths", () => {
  const doe = wrap(
    a("/cmei/articles/mining-modernization", "DOE selects 18 domestic critical mineral projects"),
    a("/articles/critical-materials-funding", "DOE announces critical materials funding initiative"),
    a("/sites/default/files/critical-minerals.pdf"), a("/collection/view?page=1"),
  );
  const defense = wrap(
    a("/news/2026/military-alloy-production.html", "Department invests in specialty alloy manufacturing"),
    a("/news/2026/rare-earths-grants.html", "Department invests in rare earths separation"),
    a("/news/index.html"), a("https://outside.example/news/supplier"),
  );
  assert.equal(extractOfficialArticleLinks(doe, candidates[1]).length, 2);
  assert.equal(extractOfficialArticleLinks(defense, candidates[2]).length, 2);
});

test("a non-HTML, oversized or empty listing is not silently accepted", () => {
  assert.throws(() => extractOfficialArticleLinks("{}", candidates[0]), /Not a parseable HTML/);
  assert.throws(() => extractOfficialArticleLinks("<html>" + "x".repeat(2_000_001), candidates[0]), /bounded probe/);
  assert.throws(() => extractOfficialArticleLinks("<html><body>no links</body></html>", candidates[0]), /Not a parseable/);
});

test("manual probe treats HTML shape as an unverified candidate, never an activated feed", async () => {
  const html = wrap(
    a("/news/critical-materials-1"), a("/news/critical-materials-2"),
    a("/news/critical-materials-3"),
  );
  const result = await probeM2SourceCandidates("2026-10-08T00:00:00Z",
    (async (url: string) => new Response(url.includes("exim.gov") ? html : "<html></html>", {
      status: 200, headers: { "content-type": "text/html" },
    })) as typeof fetch);
  assert.equal(result.mode, "m2_source_discovery_only");
  assert.equal(result.results.length, 3);
  assert.equal(result.results[0].health, "reachable_html");
  assert.equal(result.results[0].candidateLinks, 3);
  assert.equal(result.results[1].health, "unusable_html");
  assert.equal(result.results[2].health, "unusable_html");
  assert.doesNotMatch(JSON.stringify(result), /approvedAt|candidateId.*cand-|financialCommitment|baseline/);
});

test("HTTP blocks and redirect escapes never appear as healthy source evidence", async () => {
  const result = await probeM2SourceCandidates("2026-10-08T00:00:00Z",
    (async (url: string) => new Response("Access denied", { status: url.includes("exim.gov") ? 403 : 502 })) as typeof fetch);
  assert.equal(result.results[0].health, "blocked");
  assert.equal(result.results[1].health, "http_error");
  assert.equal(result.results[2].health, "http_error");
});

test("probe is manual-only, read-only, and has an offline CLI smoke test", () => {
  const flow = readFileSync(".github/workflows/m2-source-discovery.yml", "utf8");
  assert.match(flow, /workflow_dispatch/);
  assert.doesNotMatch(flow, /schedule:|contents: write|pull-requests: write|gh pr create/);
  assert.doesNotMatch(readFileSync(".github/workflows/source-monitor-pilot.yml", "utf8"),
    /monitor:probe-m2|m2-source-discovery/);
  const out = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "monitor:probe-m2", "--", "--check-runtime"],
    { cwd: process.cwd(), encoding: "utf8", timeout: 20000 });
  assert.match(out, /M2\.0 source-probe CLI runtime check passed/);
});
