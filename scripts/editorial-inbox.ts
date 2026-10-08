/**
 * Maintainer-only, offline editorial CLI. Never run from GitHub Actions,
 * server components, public APIs, or CI against real private content.
 *
 * npm run editorial:inbox -- import ./editorial-review-queue.json --run-id 123
 * npm run editorial:inbox -- list [--status unreviewed]
 * npm run editorial:inbox -- decide WATCH:SHA investigating --by Alice --reason "Checking the original PDF"
 * npm run editorial:inbox -- start-candidate WATCH:SHA cand-example-1 --by Alice --ack-source-read
 */
import {
  existsSync, mkdirSync, readFileSync, readdirSync, copyFileSync, renameSync, writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import {
  beginCandidate, editorialDecision, emptyPrivateEditorialLedger,
  importReviewQueue, parsePrivateEditorialLedger, REVIEW_STATUSES,
  type PrivateEditorialLedger,
} from "./editorial-ledger";

const root = process.cwd();
const privateDir = join(root, ".monitor-editorial");
const ledgerFile = join(privateDir, "inbox.json");
const candidatesDir = join(root, "data", "candidates");
const candidatesFile = join(candidatesDir, "candidates.json");
const now = () => new Date().toISOString();

function option(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1] ?? null;
}
function load(): PrivateEditorialLedger {
  return existsSync(ledgerFile)
    ? parsePrivateEditorialLedger(JSON.parse(readFileSync(ledgerFile, "utf8")) as unknown)
    : emptyPrivateEditorialLedger();
}
function atomicJson(path: string, data: unknown): void {
  const folder = resolve(path, "..");
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  const temp = path + "." + process.pid + ".tmp";
  writeFileSync(temp, JSON.stringify(data, null, 2) + "\n", { encoding: "utf8", mode: 0o600, flag: "wx" });
  renameSync(temp, path);
}
function save(ledger: PrivateEditorialLedger): void {
  // A private local dated backup preserves reviewer decisions across accidental
  // edits. Both ledger and backup directories are Git-ignored.
  if (existsSync(ledgerFile)) {
    const backupDir = join(privateDir, "backups");
    mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    const backup = join(backupDir, "inbox-" + now().replace(/[^0-9TZ]/g, "") + "-" + process.pid + ".json");
    copyFileSync(ledgerFile, backup);
  }
  atomicJson(ledgerFile, ledger);
}
function candidateInventory(): unknown[] {
  if (!existsSync(candidatesDir)) throw Error("Existing private candidate directory missing");
  const rows: unknown[] = [];
  for (const name of readdirSync(candidatesDir)) {
    if (!name.endsWith(".json")) continue;
    const parsed: unknown = JSON.parse(readFileSync(join(candidatesDir, name), "utf8"));
    if (!Array.isArray(parsed)) throw Error("Candidate file is not an array: " + name);
    rows.push(...parsed);
  }
  return rows;
}
function usage(): never {
  throw Error("Commands: import <queue.json> --run-id <GitHub-run-id> | list [--status STATUS] | " +
    "decide <source-id:observation-hash> <status> --by NAME --reason TEXT | " +
    "start-candidate <source-id:observation-hash> <cand-id> --by NAME --ack-source-read");
}

function main(): void {
  const [command, ...args] = process.argv.slice(2);
  if (!command) usage();
  if (command === "list") {
    const statuses = option(args, "--status");
    if (statuses && !(REVIEW_STATUSES as readonly string[]).includes(statuses)) throw Error("Invalid review status");
    const ledger = load();
    const rows = ledger.items.filter((item) => !statuses || item.status === statuses);
    process.stdout.write("Private ledger: " + ledger.items.length + " unique publications, " + ledger.imports.length +
      " artifact runs ingested; " + rows.length + " shown.\n");
    for (const row of rows) process.stdout.write(
      [row.key, row.status, row.lastObservedAt, row.titleAsListed, row.officialUrl].join("\t").replace(/[\r\n]/g, " ") + "\n");
    return;
  }
  if (command === "import") {
    const input = args[0], runId = option(args, "--run-id");
    if (!input || !runId) usage();
    const raw = readFileSync(resolve(input), "utf8");
    const queue: unknown = JSON.parse(raw);
    const result = importReviewQueue(load(), queue, runId, raw);
    if (!result.duplicateRun) save(result.ledger);
    process.stdout.write(
      "Import " + runId + ": " + (result.duplicateRun ? "already applied" : "saved") +
      "; new inbox entries " + result.imported + ", reopened " + result.reopened +
      ", existing " + result.alreadyKnown + ", older observations skipped " + result.skippedOld + "\n");
    return;
  }
  if (command === "decide") {
    const key = args[0], status = args[1], actor = option(args, "--by"), reason = option(args, "--reason");
    if (!key || !status || !actor || !reason) usage();
    const ledger = editorialDecision(load(), key, status as Parameters<typeof editorialDecision>[2],
      actor, reason, now());
    save(ledger);
    process.stdout.write("Private editorial decision saved: " + key + " -> " + status + "\n");
    return;
  }
  if (command === "start-candidate") {
    const key = args[0], id = args[1], actor = option(args, "--by");
    if (!key || !id || !actor || !args.includes("--ack-source-read")) usage();
    const inventory = candidateInventory();
    if (inventory.some((x) => typeof x === "object" && x !== null &&
        "candidateId" in x && x.candidateId === id))
      throw Error("Private candidate ID already exists; will not overwrite or duplicate a draft");
    // Review and validate before writing either private file. If a crash lands
    // between two writes, the user must reconcile using the unique candidate ID.
    const pair = beginCandidate(load(), key, id, actor, now(), true);
    const existing = existsSync(candidatesFile)
      ? JSON.parse(readFileSync(candidatesFile, "utf8")) as unknown : [];
    if (!Array.isArray(existing)) throw Error("Private candidate file is not a JSON array");
    if (existsSync(candidatesFile)) {
      const backupDir = join(privateDir, "backups");
      mkdirSync(backupDir, { recursive: true, mode: 0o700 });
      copyFileSync(candidatesFile, join(backupDir,
        "candidates-" + now().replace(/[^0-9TZ]/g, "") + "-" + process.pid + ".json"));
    }
    atomicJson(candidatesFile, [...existing, pair.candidate]);
    save(pair.ledger);
    process.stdout.write("Private pending-verification draft created: " + id +
      " (no verified facts, classifications or publication). Run npm run validate before any promotion.\n");
    return;
  }
  usage();
}

try { main(); }
catch (error) {
  process.stderr.write("Private editorial inbox: " + String(error) + "\n");
  process.exitCode = 1;
}
