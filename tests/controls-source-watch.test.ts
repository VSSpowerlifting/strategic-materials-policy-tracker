import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  DEFAULT_REGISTER_PATH, parseListingPage, parseSourceWatchRegister, parseWatchLedger, readSourceWatchRegister, resolveStateDir, runSourceWatch,
} from "../lib/controls-source-watch";

const list = "https://example.org/notices";
const old = "https://example.org/art/2026/art_ab.html";
const amendment = "https://example.org/art/2026/art_cd.html";
const synthetic = {
  version: 1, kind: "controls_source_watch_register",
  listings: [{ id: "listing-test", url: list, label: "Example", note: "Synthetic notices", expectedIntervalDays: 1 }],
  knownNotices: [{ noticeId: "example-one", url: old, documentNumber: "Example 1", sourceId: "src-example",
    recordState: "published_record", overlayId: null, fingerprint: null }],
  rules: [{ id: "example-change", priority: "direct", allOf: ["amendment"] }],
};
const listing = (newItem: boolean) => '<a href="' + old + '">Example 1</a>' +
  (newItem ? '<a href="' + amendment + '">Example amendment</a>' : "");
const notice = (version: number) => '<div ergodic="article"><p>Example ' + version + '</p></div>';

test("manual CLI records missed and failed checks, catches up, and audits decisions and corrections", t => {
  const dir = mkdtempSync(join(tmpdir(), "controls-watch-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const replay = join(dir, "replay"); mkdirSync(replay);
  const journal = join(dir, "journal");
  const register = join(dir, "register.json");
  writeFileSync(register, JSON.stringify(synthetic));
  const run = (expectedStatus: number, command: string, ...args: string[]) => {
    const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/controls-source-watch.ts",
      command, "--state-dir", journal, ...args], { encoding: "utf8" });
    assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
    return expectedStatus === 1 ? result.stderr : JSON.parse(result.stdout);
  };
  const check = (day: string, status = 0) => run(status, "check", "--register", register, "--replay", replay,
    "--at", "2026-11-" + day + "T12:00:00Z");
  const setup = (changed: boolean, failed = false) => {
    writeFileSync(join(replay, "list.html"), listing(changed));
    writeFileSync(join(replay, "notice.html"), notice(changed ? 2 : 1));
    writeFileSync(join(replay, "replay.json"), JSON.stringify({ version: 1, responses: {
      [list]: failed ? { status: 503 } : { file: "list.html" }, [old]: { file: "notice.html" },
    } }));
  };
  setup(false);
  assert.equal(check("20").summary.outcomes.baseline_recorded, 2);
  assert.equal(check("21").summary.outcomes.unchanged, 2);
  setup(false, true);
  const failed = check("23", 2);
  assert.equal(failed.summary.outcomes.missed_check, 1);
  assert.equal(failed.summary.outcomes.source_failure, 1);
  assert.equal(failed.observations.find((row: { outcome: string }) => row.outcome === "source_failure").lastSuccessfulAt, "2026-11-21T12:00:00Z");
  setup(true);
  const recovered = check("24");
  assert.equal(recovered.summary.outcomes.source_restored, 1);
  assert.equal(recovered.summary.outcomes.content_revised, 1);
  assert.equal(recovered.summary.outcomes.detected_candidate, 1);
  const item = recovered.opened[0];
  assert.match(run(1, "triage", "--item", item, "--to", "candidate_started", "--overlay", "rc-example-missing",
    "--reason", "Synthetic exercise", "--by", "Fixture operator", "--at", "2026-11-24T13:00:00Z"), /does not exist/);
  run(0, "triage", "--item", item, "--to", "out_of_scope", "--reason", "Synthetic exercise",
    "--by", "Fixture operator", "--at", "2026-11-24T13:00:00Z");
  run(0, "correct", "--item", item, "--to", "needs_verification", "--reason", "Original needs a second reading",
    "--by", "Fixture operator", "--at", "2026-11-24T14:00:00Z");
  assert.equal(check("25").opened.length, 0);
  assert.equal(readdirSync(journal).length, 7);
  const last = JSON.parse(readFileSync(join(journal, "000000007.json"), "utf8"));
  const row = parseWatchLedger(last.ledger).items.find(i => i.itemId === item)!;
  assert.deepEqual(row.audit.map(a => [a.to, a.corrects]), [["out_of_scope", null], ["needs_verification", 0]]);
  const status = run(0, "status", "--register", register, "--at", "2026-11-27T12:00:00Z");
  assert.equal(status.openItems.length, 2);
  assert.equal(status.targets[0].checkOverdue, true);
  assert.match(run(1, "check", "--register", register, "--live"), /separate journals/);
  assert.equal(readdirSync(journal).length, 7);
  const entered = run(0, "intake", "--url", list + "/manual-notice", "--register", register, "--by", "Fixture operator",
    "--reason", "Discovered in annual index", "--at", "2026-11-26T12:00:00Z");
  assert.match(entered.itemId, /^[a-f0-9]{64}$/);
  assert.equal(run(0, "status", "--register", register, "--at", "2026-11-27T12:00:00Z").openItems.length, 3);
});

test("register and source visibility limits", () => {
  const { register } = readSourceWatchRegister(DEFAULT_REGISTER_PATH);
  assert.equal(register.knownNotices.length, 13);
  assert.equal(register.knownNotices.find(n => n.noticeId === "mofcom-2024-51")?.recordState, "review_overlay");
  assert.ok(register.knownNotices.every(notice => new URL(notice.url).hostname.endsWith(".mofcom.gov.cn")));
  assert.throws(() => resolveStateDir("public/feed-test"), /private/);
  assert.throws(() => parseListingPage("<p>unavailable</p>", list), /no article links/);
  const parsed = parseListingPage(listing(false) + '<script queryData="some-index"></script>', list);
  assert.equal(parsed.clientRenderedSections, 1);
  assert.deepEqual(parsed.items.map(row => row.url), [old]);
});

test("first successful fetch after an initial failure preserves the observation gap", async () => {
  const register = parseSourceWatchRegister(synthetic);
  const failed = await runSourceWatch(register, null, "2026-11-20T12:00:00Z",
    async () => new Response("", { status: 503 }));
  const restored = await runSourceWatch(register, failed.state, "2026-11-21T12:00:00Z",
    async url => new Response(String(url) === list ? listing(true) : notice(1)));
  assert.equal(restored.summary.outcomes.source_restored, 2);
  assert.equal(restored.summary.outcomes.baseline_recorded, 2);
  assert.equal(restored.summary.needsAttention, true);
  assert.equal(restored.ledgerEntries[0].url, amendment);
  for (const row of restored.observations) {
    if (row.outcome === "source_restored") assert.equal(row.daysSinceLastSuccessfulCheck, null);
  }
});
