// Manual operator command. Each commit to the private journal records the
// observation and the corresponding state/ledger together.
import { randomUUID } from "node:crypto";
import { existsSync, linkSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  DEFAULT_REGISTER_PATH, DEFAULT_STATE_DIR, canonicalUrl, emptyWatchLedger, ledgerItemId, loadReplay, mergeRunIntoLedger,
  parseWatchLedger, parseWatchState, readSourceWatchRegister, recordCorrection, recordTriage,
  resolveStateDir, reviewOverlayPath, runSourceWatch, watchStatus,
  type WatchLedger, type WatchState,
} from "../lib/controls-source-watch";

type Journal = {
  version: 1;
  mode: "live" | "replay";
  state: WatchState;
  ledger: WatchLedger;
  receipt: unknown;
};

const commands = {
  check: ["register", "state-dir", "replay", "at", "live"],
  status: ["register", "state-dir", "at"],
  intake: ["register", "state-dir", "url", "by", "reason", "at"],
  triage: ["state-dir", "item", "to", "by", "reason", "at", "overlay"],
  correct: ["state-dir", "item", "to", "by", "reason", "at"],
} as const;

function latest(dir: string): { sequence: number; snapshot: Journal | null } {
  const files = existsSync(dir) ? readdirSync(dir).filter(name => /^\d{9}\.json$/.test(name)).sort() : [];
  if (!files.length) return { sequence: 0, snapshot: null };
  for (let i = 0; i < files.length; i++) {
    if (Number(files[i].slice(0, 9)) !== i + 1) throw new Error("Private journal has a gap. Restore the missing receipts.");
  }
  const snapshot: Journal = JSON.parse(readFileSync(join(dir, files.at(-1)!), "utf8"));
  if (snapshot.version !== 1 || !["live", "replay"].includes(snapshot.mode)) throw new Error("Unsupported private journal.");
  parseWatchState(snapshot.state);
  parseWatchLedger(snapshot.ledger);
  return { sequence: files.length, snapshot };
}

function append(dir: string, sequence: number, snapshot: Journal): void {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, String(sequence + 1).padStart(9, "0") + ".json");
  const temp = join(dir, randomUUID() + ".tmp");
  writeFileSync(temp, JSON.stringify(snapshot, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  try {
    // Same-directory hard link atomically creates a complete receipt only
    // if this generation is still available. A concurrent writer must retry.
    linkSync(temp, file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error("Journal advanced during this command. Retry against the new state.");
    throw error;
  } finally {
    unlinkSync(temp);
  }
}

async function main(argv: string[]) {
  const [command, ...args] = argv;
  if (!Object.hasOwn(commands, command)) throw new Error("Use check, status, intake, triage or correct. See docs/engineering/controls-feed/SOURCE_WATCH.md.");
  const options = Object.fromEntries(commands[command as keyof typeof commands].map(
    key => [key, { type: key === "live" ? "boolean" as const : "string" as const }],
  ));
  const { values } = parseArgs({ args, options, strict: true });
  const value = (key: string) => typeof values[key] === "string" ? values[key] as string : undefined;
  const required = (key: string) => {
    const field = value(key);
    if (!field?.trim()) throw new Error("Missing --" + key);
    return field;
  };
  const replay = value("replay");
  if (command === "check" && Boolean(values.live) === Boolean(replay)) throw new Error("Choose --live or --replay DIRECTORY.");
  if (values.live && values.at) throw new Error("Live checks record the actual observation time. Use --at only with replay.");
  if (replay && !value("state-dir")) throw new Error("Use a separate --state-dir for offline replay.");
  const dir = resolveStateDir(value("state-dir") ?? DEFAULT_STATE_DIR);
  const { sequence, snapshot } = latest(dir);
  const at = replay ? required("at") : value("at") ?? new Date().toISOString();
  if (command === "check" || command === "status") {
    const { register, sha256 } = readSourceWatchRegister(value("register") ?? DEFAULT_REGISTER_PATH);
    const ledger = snapshot?.ledger ?? emptyWatchLedger();
    if (command === "status") return watchStatus(register, snapshot?.state ?? null, ledger, at);
    const mode = replay ? "replay" : "live";
    if (snapshot && mode !== snapshot.mode) throw new Error("Live checks and replays need separate journals.");
    const run = await runSourceWatch(register, snapshot?.state ?? null, at, replay ? loadReplay(replay) : fetch);
    const merged = mergeRunIntoLedger(ledger, run.ledgerEntries, at);
    const receipt = { command, mode, at, registerSha256: sha256, summary: run.summary, observations: run.observations, opened: merged.added };
    append(dir, sequence, { version: 1, mode, state: run.state, ledger: merged.ledger, receipt });
    if (run.summary.outcomes.source_failure) process.exitCode = 2;
    return receipt;
  }
  if (!snapshot) throw new Error("No observations in this journal.");
  if (snapshot.mode === "live" && values.at) throw new Error("Live decisions record the current time.");
  if (command === "intake") {
    const { register, sha256 } = readSourceWatchRegister(value("register") ?? DEFAULT_REGISTER_PATH);
    const source = new URL(required("url"));
    const allowedOrigins = new Set([...register.listings, ...register.knownNotices].map(target => new URL(target.url).origin));
    if (!allowedOrigins.has(source.origin) || source.username || source.password) throw new Error("Use an official URL on a registered origin.");
    const url = canonicalUrl(source.href);
    const by = required("by").trim();
    const reason = required("reason").trim();
    if (reason.length < 8 || reason.length > 2000 || by.length > 160) throw new Error("Supply a short operator name and a reason (8 to 2000 characters).");
    watchStatus(register, snapshot.state, snapshot.ledger, at); // Validate the observation time against the last check.
    const itemId = ledgerItemId("detected_candidate", url);
    const { ledger } = mergeRunIntoLedger(snapshot.ledger, [{
      itemId, kind: "detected_candidate", priority: "direct", url, title: "Manual intake", targetId: "operator",
      matchedRules: [], observedFingerprint: null,
    }], at);
    const receipt = { command, at, by, reason, url, itemId, registerSha256: sha256 };
    append(dir, sequence, { ...snapshot, ledger, receipt });
    return receipt;
  }
  const input = { item: required("item"), to: required("to"), by: required("by"), reason: required("reason"), at, overlayId: value("overlay") };
  const ledger = command === "correct" ? recordCorrection(snapshot.ledger, input) : recordTriage(snapshot.ledger, input);
  if (input.overlayId && !existsSync(reviewOverlayPath(input.overlayId))) throw new Error("Named overlay does not exist.");
  const receipt = { command, ...input };
  append(dir, sequence, { ...snapshot, ledger, receipt });
  return receipt;
}

main(process.argv.slice(2)).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
