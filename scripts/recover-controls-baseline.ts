/**
 * Verify, and if needed recover, the archived Controls snapshot.
 *
 *   npm run feed:controls:verify-baseline
 *       Check data/releases/controls/<asOf>/ against the pinned identity and,
 *       while the live record still has that cutoff, against a fresh build.
 *
 *   npm run feed:controls:verify-baseline -- --from-git
 *       Also rebuild the snapshot from the pinned commit in a temporary
 *       source directory and compare every file byte for byte.
 *
 *   npm run feed:controls:verify-baseline -- --from-git --write <new-directory>
 *       Write the rebuilt files to a new directory, for restoring a lost archive.
 *
 * Nothing here touches the working tree's record, a remote or the network.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CONTROLS_DATASET_FILES,
  ControlsIntegrityError,
  PUBLISHED_CONTROLS_RELEASES,
  readControlsArchive,
  sha256Hex,
  type ControlsSnapshot,
} from "../lib/controls-release-archive";
import { buildControlsSnapshotBundle } from "../lib/controls-snapshot";

const ARCHIVE_FILES = [...CONTROLS_DATASET_FILES, "manifest.json"] as const;
/** Everything `scripts/build-controls-snapshot.ts` reads at the pinned commit. */
const ZIP_ROUTE = "app/api/export/controls-snapshot.zip/route.ts";
const REBUILD_PATHS = [ZIP_ROUTE, "lib", "data/seed", "scripts/build-controls-snapshot.ts", "docs/engineering/controls-snapshot", "package.json", "tsconfig.json"];

type Check = { check: string; result: "match" | "skipped"; detail: string };

function compareLive(snapshot: ControlsSnapshot): Check {
  const live = buildControlsSnapshotBundle();
  if (live.manifest.asOf !== snapshot.manifest.asOf) {
    return {
      check: "live record",
      result: "skipped",
      detail: `the live record's cutoff is ${live.manifest.asOf}; the archive of ${snapshot.manifest.asOf} is checked against its pin and, with --from-git, its commit`,
    };
  }
  const byName = new Map(live.files.map((file) => [file.name, file.content]));
  for (const name of CONTROLS_DATASET_FILES) {
    if (byName.get(name) !== snapshot.contents[name]) {
      throw new ControlsIntegrityError(
        `${name}: the live record no longer rebuilds the archived ${snapshot.manifest.asOf} release while still stating that cutoff. A change to the record needs a new cutoff and a new archive, not an edit under the old identity.`,
      );
    }
  }
  if (live.manifest.datasetVersion !== snapshot.manifest.datasetVersion) {
    throw new ControlsIntegrityError(`live datasetVersion ${live.manifest.datasetVersion} differs from the archive`);
  }
  return { check: "live record", result: "match", detail: live.manifest.datasetVersion };
}

function rebuildFromGit(commit: string, asOf: string) {
  const root = process.cwd();
  const work = mkdtempSync(join(tmpdir(), "controls-baseline-"));
  const tree = join(work, "tree");
  const out = join(work, "out");
  const git = (...args: string[]) => execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  try {
    git("cat-file", "-e", `${commit}^{commit}`);
  } catch {
    rmSync(work, { recursive: true, force: true });
    throw new ControlsIntegrityError(`commit ${commit} is not in this clone; fetch the default branch and retry`);
  }
  try {
    // Export only what the snapshot builder reads, straight from the object
    // store. No branch, index or worktree entry of this clone is touched.
    const tar = join(work, "source.tar");
    git("archive", "--format=tar", "-o", tar, commit, ...REBUILD_PATHS);
    mkdirSync(tree);
    execFileSync("tar", ["-xf", tar, "-C", tree], { stdio: ["ignore", "pipe", "pipe"] });
    // The dependencies installed here stand in for the pinned commit's own;
    // linking them avoids a network install. The digest check below is what
    // proves the rebuild, whatever produced it.
    symlinkSync(join(root, "node_modules"), join(tree, "node_modules"), "dir");
    execFileSync(process.execPath, ["--import", "tsx", "scripts/build-controls-snapshot.ts", out], {
      cwd: tree,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const files: Record<string, string> = {};
    for (const name of [...ARCHIVE_FILES, "README.md", "worked_example.py"]) files[name] = readFileSync(join(out, name), "utf8");
    const manifest = JSON.parse(files["manifest.json"]) as { asOf: string };
    if (manifest.asOf !== asOf) throw new ControlsIntegrityError(`commit ${commit} builds cutoff ${manifest.asOf}, not ${asOf}`);
    const zip = execFileSync(process.execPath, ["--import", "tsx", "-e",
      `require("./${ZIP_ROUTE}").GET().then(async response => process.stdout.write(Buffer.from(await response.arrayBuffer())))`,
    ], { cwd: tree });
    return { files, zip };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function main(argv: string[]): void {
  const fromGit = argv[0] === "--from-git";
  const writeDir = argv[1] === "--write" ? argv[2] : undefined;
  if (argv.length && !(fromGit && (argv.length === 1 || (argv.length === 3 && writeDir && !writeDir.startsWith("--"))))) {
    throw new Error("Usage: npm run feed:controls:verify-baseline -- [--from-git [--write <new-directory>]]");
  }

  const report: Record<string, unknown>[] = [];
  for (const pinned of PUBLISHED_CONTROLS_RELEASES) {
    const checks: Check[] = [];
    let archive: ControlsSnapshot | null = null;
    let archiveError: string | null = null;
    try {
      archive = readControlsArchive(pinned.asOf);
      checks.push({ check: "archive against pinned identity", result: "match", detail: pinned.datasetVersion });

    } catch (error) {
      if (!writeDir) throw error;
      archiveError = error instanceof Error ? error.message : String(error);
    }

    if (archive) checks.push(compareLive(archive));

    if (fromGit) {
      const { files: rebuilt, zip } = rebuildFromGit(pinned.sourceCommit, pinned.asOf);
      if (sha256Hex(zip) !== pinned.zipSha256 || sha256Hex(rebuilt["manifest.json"]) !== pinned.manifestSha256) {
        throw new ControlsIntegrityError("pinned commit failed the published ZIP or manifest digest");
      }
      const manifest = JSON.parse(rebuilt["manifest.json"]) as { datasetVersion: string };
      if (manifest.datasetVersion !== pinned.datasetVersion) {
        throw new ControlsIntegrityError(`commit ${pinned.sourceCommit} rebuilds ${manifest.datasetVersion}, not the pinned ${pinned.datasetVersion}`);
      }
      if (archive) {
        for (const name of CONTROLS_DATASET_FILES) {
          if (rebuilt[name] !== archive.contents[name]) {
            throw new ControlsIntegrityError(`${name}: the archive differs from the rebuild at ${pinned.sourceCommit}`);
          }
        }
      }
      checks.push({ check: "rebuild from pinned commit", result: "match", detail: pinned.sourceCommit });
      if (writeDir) {
        const target = join(writeDir, pinned.asOf);
        if (existsSync(target)) throw new ControlsIntegrityError(`${target} already exists; choose a new directory`);
        mkdirSync(writeDir, { recursive: true });
        const staging = mkdtempSync(join(writeDir, ".recover-"));
        try {
          for (const [name, content] of Object.entries(rebuilt)) writeFileSync(join(staging, name), content);
          writeFileSync(join(staging, "controls-snapshot.zip"), zip);
          renameSync(staging, target);
        } finally {
          rmSync(staging, { recursive: true, force: true });
        }
        checks.push({ check: "recovered files written", result: "match", detail: target });
      }
    }

    const kept = archive;
    report.push({
      asOf: pinned.asOf,
      datasetVersion: pinned.datasetVersion,
      sourceCommit: pinned.sourceCommit,
      archiveProblem: archiveError,
      fileSha256: kept
        ? Object.fromEntries(CONTROLS_DATASET_FILES.map((name) => [name, sha256Hex(kept.contents[name])]))
        : null,
      checks,
    });
  }
  process.stdout.write(JSON.stringify({ verified: true, releases: report }, null, 2) + "\n");
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`controls-baseline: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
