/**
 * Broken-source detector. Run with: npm run check:links
 *
 * Fetches every source URL in data/seed/sources.json and reports dead or
 * broken links. This is a NETWORK check kept separate from `npm run validate`
 * (which stays offline and deterministic so it can gate CI/builds).
 *
 * Exit code is non-zero if any source is dead (4xx/5xx/DNS/timeout), so it can
 * be run on demand or on a schedule without blocking the offline build.
 *
 *   npm run check:links               # check every source
 *   npm run check:links -- --json     # machine-readable report
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import type { Source } from "../lib/types";

const seedDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "seed");
const sources = JSON.parse(readFileSync(join(seedDir, "sources.json"), "utf8")) as Source[];

const asJson = process.argv.includes("--json");
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 6;
const UA = "SMPT-link-check/1.0 (+strategic-materials-policy-tracker)";

type Verdict = "ok" | "redirect" | "blocked" | "dead" | "error";
type Result = { id: string; url: string; status: number | null; verdict: Verdict; note: string };

// Statuses that usually mean "anti-bot / access restricted", not "gone". Many
// government and CDN hosts (USGS, Federal Register, Akamai fronts) return these
// to scripted clients while the page is perfectly live in a browser. We surface
// them for manual review but do NOT treat them as failures.
const BLOCKED = new Set([401, 403, 405, 406, 429, 451]);

async function probe(method: "HEAD" | "GET", url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "*/*" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkOne(s: Source): Promise<Result> {
  const url = s.url;
  try {
    // Prefer HEAD; many gov/CDN servers reject or mishandle it, so fall back to GET.
    let res: Response;
    try {
      res = await probe("HEAD", url);
      // HEAD is often rejected even when GET works — retry before judging.
      if (res.status === 501 || BLOCKED.has(res.status)) res = await probe("GET", url);
    } catch {
      res = await probe("GET", url);
    }
    const status = res.status;
    const redirected = res.redirected;
    if (status >= 200 && status < 300)
      return { id: s.id, url, status, verdict: redirected ? "redirect" : "ok", note: redirected ? `→ ${res.url}` : "" };
    if (status >= 300 && status < 400)
      return { id: s.id, url, status, verdict: "redirect", note: `→ ${res.headers.get("location") ?? "?"}` };
    if (BLOCKED.has(status))
      return { id: s.id, url, status, verdict: "blocked", note: `${res.statusText} — likely anti-bot; verify manually` };
    return { id: s.id, url, status, verdict: "dead", note: res.statusText };
  } catch (e) {
    const msg = (e as Error).name === "AbortError" ? `timeout after ${TIMEOUT_MS}ms` : (e as Error).message;
    return { id: s.id, url, status: null, verdict: "error", note: msg };
  }
}

async function run() {
  const queue = [...sources];
  const results: Result[] = [];
  async function worker() {
    for (;;) {
      const s = queue.shift();
      if (!s) return;
      results.push(await checkOne(s));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  results.sort((a, b) => a.id.localeCompare(b.id));

  const dead = results.filter((r) => r.verdict === "dead" || r.verdict === "error");
  const blocked = results.filter((r) => r.verdict === "blocked");
  const redirects = results.filter((r) => r.verdict === "redirect");
  const ok = results.length - dead.length - blocked.length - redirects.length;

  if (asJson) {
    console.log(JSON.stringify({ checked: results.length, ok, dead: dead.length, blocked: blocked.length, redirects: redirects.length, results }, null, 2));
  } else {
    const icon: Record<Verdict, string> = { ok: "✓", redirect: "↪", blocked: "⚠", dead: "✗", error: "✗" };
    for (const r of results)
      if (r.verdict !== "ok")
        console.log(`${icon[r.verdict]} ${r.verdict.toUpperCase().padEnd(8)} ${String(r.status ?? "—").padStart(3)}  ${r.id}\n     ${r.url}${r.note ? `\n     ${r.note}` : ""}`);
    console.log(`\nChecked ${results.length} sources · ${ok} ok · ${redirects.length} redirect · ${blocked.length} blocked/uncertain · ${dead.length} dead`);
    if (redirects.length) console.log(`Note: redirects are not failures, but a stable canonical URL is preferable for citations.`);
    if (blocked.length) console.log(`Note: "blocked" usually means anti-bot protection, not a dead link — verify in a browser.`);
  }

  if (dead.length) {
    console.error(`\n✗ ${dead.length} source(s) are dead or unreachable — see above.`);
    process.exit(1);
  }
}

run();
