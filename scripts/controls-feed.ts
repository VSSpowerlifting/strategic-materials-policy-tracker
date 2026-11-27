/**
 * Controls integration feed: build, verify and replay.
 *
 *   npm run feed:controls -- build --out <dir> --curated-on <date> [--overlay <file>] [--previous <dir>] [--as-of <date>]
 *   npm run feed:controls -- verify <dir>
 *   npm run feed:controls -- diff <from-dir> <to-dir>
 *   npm run feed:controls -- query <dir> --material <id> --destination <CC> --on <date> [--issuer <id>] [--vintage <date>] [--include-pending]
 *   npm run feed:controls -- standing <dir> --measure <id> --on <date> [--vintage <date>] [--include-pending]
 *   npm run feed:controls -- vintage <dir> --vintage <date> [--include-pending] [--all]
 *   npm run feed:controls -- counts <dir> --start <date> --end <date> [--vintage <date>] [--include-pending]
 *
 * Every command is offline and reads no clock: the curation date is an
 * argument, and a replay names the day it asks about and the vintage it may
 * know. Output is JSON on stdout; a refusal exits 1 with one line on stderr.
 */
import { buildFeedRelease, loadFeedRelease, writeFeedDir } from "../lib/controls-feed-io";
import { diffFeedDatasets, FEED_FILES, FEED_NAME, FEED_PROFILE_VERSION } from "../lib/controls-feed";
import { periodCounts, qualifyingMeasures, standing, vintageReport } from "../lib/controls-standing";

const USAGE = "Usage: npm run feed:controls -- <build|verify|diff|query|standing|vintage|counts> … (see scripts/controls-feed.ts)";

const VALUE_FLAGS = new Set([
  "out", "curated-on", "overlay", "previous", "as-of", "material", "destination", "on", "issuer",
  "vintage", "measure", "start", "end",
]);
const BOOLEAN_FLAGS = new Set(["include-pending", "all"]);

type Parsed = { positional: string[]; values: Record<string, string>; flags: Set<string> };

function parse(args: string[]): Parsed {
  const parsed: Parsed = { positional: [], values: {}, flags: new Set() };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      parsed.positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (BOOLEAN_FLAGS.has(name)) {
      parsed.flags.add(name);
    } else if (VALUE_FLAGS.has(name)) {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) throw new Error(`--${name} needs a value`);
      if (name in parsed.values) throw new Error(`--${name} was given twice`);
      parsed.values[name] = value;
      index += 1;
    } else {
      throw new Error(`unknown option --${name}`);
    }
  }
  return parsed;
}

function need(parsed: Parsed, name: string): string {
  const value = parsed.values[name];
  if (!value) throw new Error(`--${name} is required`);
  return value;
}

function onlyDir(parsed: Parsed, count = 1): string[] {
  if (parsed.positional.length !== count) throw new Error(USAGE);
  return parsed.positional;
}

const print = (value: unknown) => process.stdout.write(JSON.stringify(value, null, 2) + "\n");

function summary(manifest: ReturnType<typeof loadFeedRelease>["manifest"]) {
  return {
    releaseId: manifest.releaseId,
    profileVersion: manifest.profileVersion,
    reviewState: manifest.reviewState,
    curatedOn: manifest.curatedOn,
    legalStatusCutoff: manifest.legalStatusCutoff,
    source: manifest.source,
    pendingReview: manifest.pendingReview,
    datasets: Object.fromEntries(FEED_FILES.map((file) => [file, manifest.datasets[file].rows])),
    changesFrom: manifest.changesFrom ? { releaseId: manifest.changesFrom.releaseId, summary: manifest.changesFrom.summary } : null,
    unreviewedUpstreamPathCount: manifest.excluded.unreviewedUpstreamPathCount,
  };
}

function main(argv: string[]): void {
  const [command, ...rest] = argv;
  if (command === "--check-runtime") {
    print({ ok: true, feed: FEED_NAME, profileVersion: FEED_PROFILE_VERSION });
    return;
  }
  const parsed = parse(rest);
  const replay = () => ({
    vintage: parsed.values.vintage ?? "release",
    includePending: parsed.flags.has("include-pending"),
  });
  switch (command) {
    case "build": {
      onlyDir(parsed, 0);
      const out = need(parsed, "out");
      const bundle = buildFeedRelease({
        asOf: parsed.values["as-of"],
        curatedOn: need(parsed, "curated-on"),
        overlayPath: parsed.values.overlay,
        previousDir: parsed.values.previous,
      });
      const outcome = writeFeedDir(out, bundle.files);
      print({ outcome, directory: out, ...summary(bundle.manifest) });
      return;
    }
    case "verify": {
      const [dir] = onlyDir(parsed);
      print({ verified: true, ...summary(loadFeedRelease(dir).manifest) });
      return;
    }
    case "diff": {
      const [fromDir, toDir] = onlyDir(parsed, 2);
      const from = loadFeedRelease(fromDir);
      const to = loadFeedRelease(toDir);
      print(
        diffFeedDatasets(
          { releaseId: from.manifest.releaseId, datasets: from.datasets },
          { releaseId: to.manifest.releaseId, datasets: to.datasets },
        ),
      );
      return;
    }
    case "query": {
      const [dir] = onlyDir(parsed);
      const feed = loadFeedRelease(dir);
      print({
        releaseId: feed.manifest.releaseId,
        ...qualifyingMeasures(feed.view, {
          material: need(parsed, "material"),
          destination: need(parsed, "destination"),
          onDate: need(parsed, "on"),
          issuer: parsed.values.issuer,
          ...replay(),
        }),
      });
      return;
    }
    case "standing": {
      const [dir] = onlyDir(parsed);
      const feed = loadFeedRelease(dir);
      print({ releaseId: feed.manifest.releaseId, ...standing(feed.view, need(parsed, "measure"), need(parsed, "on"), replay()) });
      return;
    }
    case "vintage": {
      const [dir] = onlyDir(parsed);
      const feed = loadFeedRelease(dir);
      const options = { ...replay(), vintage: need(parsed, "vintage"), pilotOnly: !parsed.flags.has("all") };
      print({ releaseId: feed.manifest.releaseId, vintage: options.vintage, includePending: options.includePending, rows: vintageReport(feed.view, options) });
      return;
    }
    case "counts": {
      const [dir] = onlyDir(parsed);
      const feed = loadFeedRelease(dir);
      print({ releaseId: feed.manifest.releaseId, includePending: replay().includePending, ...periodCounts(feed.view, need(parsed, "start"), need(parsed, "end"), replay()) });
      return;
    }
    default:
      throw new Error(USAGE);
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`controls-feed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
