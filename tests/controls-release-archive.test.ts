/**
 * The archived Controls snapshot of 2026-11-12.
 *
 * These tests hold the archive under data/releases/controls/ to the identity a
 * consumer recorded, to a fresh build while the live record still states that
 * cutoff, to the published ZIP, and to the recovery script. Every identity
 * below is written out in full on purpose: a change to any of them is a change
 * to a published release and must be reviewed, not regenerated.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CONTROLS_DATASET_FILES,
  ControlsIntegrityError,
  PUBLISHED_CONTROLS_RELEASES,
  controlsArchiveDir,
  readControlsArchive,
  sha256Hex,
  snapshotIdentity,
  stableJson,
  type ControlsSnapshotManifest,
} from "../lib/controls-release-archive";
import { buildControlsSnapshotBundle } from "../lib/controls-snapshot";
import { GET as controlsZipRoute } from "../app/api/export/controls-snapshot.zip/route";

const AS_OF = "2026-11-12";
const DATASET_VERSION = "smpt-controls-v1-2026-11-12-be5b774228b6206368a6873fee5ab3945b116e346be85ef54e3aa4ab4a6b8ecb";
const SOURCE_COMMIT = "ecffb92c1b2bdbcfb6c560d0573b6a0666642e8a";
const ZIP_SHA256 = "40e142cc257d04ade1f2b36aa573872d3322bd5b7b1b15bc6dd666a20d403b55";
const PINNED_FILES: Record<string, { rows: number; sha256: string }> = {
  "control-clauses.json": { rows: 53, sha256: "634fdea3933225882a13ae153f305a783fbfdf9899e0399676258a443a0796ff" },
  "policy-events.json": { rows: 24, sha256: "51af46314c2e91ad7609d978403557064a2407c6ad0050a1b2d556c9e7bc41cc" },
  "control-status-history.json": { rows: 119, sha256: "c788717db64ddd9fe18d4e7bdd97fadb2b900b26e02650b77ccc348bb296bee5" },
  "sources.json": { rows: 49, sha256: "cd99dbf413807baa62cf22a5c0588179c3063d0391d37169d774d7c7919b68d3" },
};
const ARCHIVE_FILES = [...CONTROLS_DATASET_FILES, "manifest.json"];
const COMPANION_DIR = "docs/engineering/controls-snapshot";
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

const archiveDir = controlsArchiveDir(AS_OF);
const live = buildControlsSnapshotBundle();
/** The live record moves on when a new cutoff is published; the archive does not. */
const liveAtArchivedCutoff = live.manifest.asOf === AS_OF;
const commitPresent =
  spawnSync("git", ["cat-file", "-e", `${SOURCE_COMMIT}^{commit}`], { cwd: process.cwd(), stdio: "ignore" }).status === 0;

function tempDir(t: { after: (fn: () => void) => void }, label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `controls-archive-${label}-`));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Copy the archive under a fresh root so a test can damage the copy. */
function archiveCopy(t: { after: (fn: () => void) => void }, label: string): { root: string; dir: string } {
  const root = tempDir(t, label);
  const dir = controlsArchiveDir(AS_OF, root);
  mkdirSync(dir, { recursive: true });
  for (const name of ARCHIVE_FILES) copyFileSync(join(archiveDir, name), join(dir, name));
  return { root, dir };
}

/** Change exactly one byte inside a JSON string, so the file still parses. */
function changeOneByte(content: string): string {
  const changed = content.replace(/[a-z](?=")/, (letter) => (letter === "x" ? "y" : "x"));
  assert.equal(changed.length, content.length);
  assert.notEqual(changed, content);
  assert.doesNotThrow(() => JSON.parse(changed));
  return changed;
}

function refusal(run: () => unknown): ControlsIntegrityError {
  try {
    run();
  } catch (error) {
    assert.ok(error instanceof ControlsIntegrityError, `expected a ControlsIntegrityError, got ${String(error)}`);
    return error;
  }
  return assert.fail("expected a refusal");
}

function verifyBaseline(...args: string[]) {
  return spawnSync(NPM, ["run", "-s", "feed:controls:verify-baseline", "--", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 180_000,
  });
}

test("the pinned release table names the 2026-11-12 identity, its ZIP digest and its source commit", () => {
  assert.deepEqual(
    PUBLISHED_CONTROLS_RELEASES.map((release) => ({ ...release })),
    [{ asOf: AS_OF, datasetVersion: DATASET_VERSION, manifestSha256: "02b6444bc90d6102600cb3be795c924b333edd1a61277950c588b0177e8aa6d0", zipSha256: ZIP_SHA256, sourceCommit: SOURCE_COMMIT }],
  );
});

test("the archive on disk holds exactly the five files, each with the pinned sha256 and row count", () => {
  assert.deepEqual(readdirSync(archiveDir).sort(), [...ARCHIVE_FILES].sort());
  const manifest = JSON.parse(readFileSync(join(archiveDir, "manifest.json"), "utf8")) as ControlsSnapshotManifest;
  assert.equal(manifest.datasetVersion, DATASET_VERSION);
  assert.equal(manifest.asOf, AS_OF);
  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.datasets, PINNED_FILES);
  for (const name of CONTROLS_DATASET_FILES) {
    const content = readFileSync(join(archiveDir, name), "utf8");
    assert.equal(sha256Hex(content), PINNED_FILES[name].sha256, name);
    assert.equal((JSON.parse(content) as unknown[]).length, PINNED_FILES[name].rows, name);
    // The archive uses the one serialisation every Controls artefact uses.
    assert.equal(content, stableJson(JSON.parse(content)), `${name} is not in the stable serialisation`);
  }
});

test("readControlsArchive verifies the archive and returns the pinned identity with parsed rows", () => {
  const snapshot = readControlsArchive(AS_OF);
  assert.equal(snapshot.manifest.datasetVersion, DATASET_VERSION);
  assert.deepEqual(
    { clauses: snapshot.rows.clauses.length, events: snapshot.rows.events.length, statusHistory: snapshot.rows.statusHistory.length, sources: snapshot.rows.sources.length },
    { clauses: 53, events: 24, statusHistory: 119, sources: 49 },
  );
  // The identity is recomputed from the file contents, not read from the manifest.
  const identity = snapshotIdentity(snapshot.contents, 1, AS_OF);
  assert.equal(identity.datasetVersion, DATASET_VERSION);
  assert.deepEqual(identity.datasets, PINNED_FILES);
});

test("readControlsArchive refuses a date no release is pinned for, and a root with no archive", (t) => {
  assert.match(refusal(() => readControlsArchive("2099-01-01")).message, /no published Controls release is pinned for 2099-01-01/);
  const empty = tempDir(t, "empty");
  assert.match(refusal(() => readControlsArchive(AS_OF, empty)).message, /archive directory is missing: /);
});

test("while the live record states cutoff 2026-11-12, a fresh build equals the archive byte for byte and has the same datasetVersion (once the cutoff moves, only the forward move is asserted)", (t) => {
  if (!liveAtArchivedCutoff) {
    assert.ok(live.manifest.asOf.localeCompare(AS_OF) > 0, `the live cutoff ${live.manifest.asOf} moved backwards from ${AS_OF}`);
    t.diagnostic(`live cutoff is ${live.manifest.asOf}; the 2026-11-12 archive is no longer compared with a live build`);
    return;
  }
  assert.equal(live.manifest.datasetVersion, DATASET_VERSION);
  const built = new Map(live.files.map((file) => [file.name, file.content]));
  for (const name of ARCHIVE_FILES) {
    assert.equal(built.get(name), readFileSync(join(archiveDir, name), "utf8"), `${name} differs between the live build and the archive`);
  }
});

test("README.md and worked_example.py in the bundle are the files on disk and equal the pinned commit ecffb92 (in a shallow clone without that commit the comparison with git is skipped; the comparison with disk still runs)", (t) => {
  const built = new Map(live.files.map((file) => [file.name, file.content]));
  for (const name of ["README.md", "worked_example.py"]) {
    const onDisk = readFileSync(join(process.cwd(), COMPANION_DIR, name), "utf8");
    assert.equal(built.get(name), onDisk, `${name} in the bundle is not the file on disk`);
    if (!commitPresent || !liveAtArchivedCutoff) continue;
    const atCommit = execFileSync("git", ["show", `${SOURCE_COMMIT}:${COMPANION_DIR}/${name}`], {
      cwd: process.cwd(),
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(onDisk, atCommit, `${COMPANION_DIR}/${name} changed since ${SOURCE_COMMIT}`);
  }
  if (!commitPresent) t.diagnostic(`commit ${SOURCE_COMMIT} is not in this clone; README.md and worked_example.py were not compared with it`);
});

test("the Controls snapshot ZIP route builds the same bytes twice, and while the live cutoff is 2026-11-12 its sha256 is the pinned zipSha256", async (t) => {
  const body = async () => Buffer.from(await (await controlsZipRoute()).arrayBuffer());
  const first = await body();
  const second = await body();
  assert.equal(sha256Hex(first), sha256Hex(second));
  if (!liveAtArchivedCutoff) {
    t.diagnostic(`live cutoff is ${live.manifest.asOf}; the ZIP of the 2026-11-12 release can no longer be rebuilt from the live record`);
    assert.notEqual(sha256Hex(first), ZIP_SHA256);
    return;
  }
  assert.equal(sha256Hex(first), ZIP_SHA256);
});

test("a copy of the archive with one byte changed in a dataset is refused with a message naming the file", async (t) => {
  for (const name of CONTROLS_DATASET_FILES) {
    await t.test(name, (sub) => {
      const { root, dir } = archiveCopy(sub, "byte");
      assert.equal(readControlsArchive(AS_OF, root).manifest.datasetVersion, DATASET_VERSION);
      writeFileSync(join(dir, name), changeOneByte(readFileSync(join(dir, name), "utf8")), "utf8");
      const error = refusal(() => readControlsArchive(AS_OF, root));
      assert.ok(error.message.startsWith(`${name} does not match its manifest: expected sha256 ${PINNED_FILES[name].sha256}, found `), error.message);
    });
  }
});

test("a changed manifest is refused: a stated digest, a stated row count, the datasetVersion, and a manifest rewritten to match a changed dataset", async (t) => {
  const rewrite = (dir: string, change: (manifest: ControlsSnapshotManifest) => void) => {
    const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as ControlsSnapshotManifest;
    change(manifest);
    writeFileSync(join(dir, "manifest.json"), stableJson(manifest), "utf8");
  };

  await t.test("a stated sha256", (sub) => {
    const { root, dir } = archiveCopy(sub, "sha");
    rewrite(dir, (manifest) => {
      manifest.datasets["sources.json"].sha256 = "0".repeat(64);
    });
    assert.match(refusal(() => readControlsArchive(AS_OF, root)).message, /^sources\.json does not match its manifest: expected sha256 0{64}, found cd99dbf4/);
  });

  await t.test("a stated row count", (sub) => {
    const { root, dir } = archiveCopy(sub, "rows");
    rewrite(dir, (manifest) => {
      manifest.datasets["policy-events.json"].rows = 25;
    });
    assert.equal(refusal(() => readControlsArchive(AS_OF, root)).message, "policy-events.json does not match its manifest: expected 25 rows, found 24");
  });

  await t.test("the datasetVersion", (sub) => {
    const { root, dir } = archiveCopy(sub, "version");
    const other = DATASET_VERSION.replace(/.$/, "0");
    rewrite(dir, (manifest) => {
      manifest.datasetVersion = other;
    });
    assert.equal(
      refusal(() => readControlsArchive(AS_OF, root)).message,
      `archived manifest for ${AS_OF} states ${other}; the pinned release is ${DATASET_VERSION}`,
    );
  });

  await t.test("a dataset entry removed", (sub) => {
    const { root, dir } = archiveCopy(sub, "entry");
    rewrite(dir, (manifest) => {
      delete manifest.datasets["sources.json"];
    });
    assert.equal(refusal(() => readControlsArchive(AS_OF, root)).message, "manifest lists no entry for sources.json");
  });

  await t.test("a dataset changed and its manifest entry rewritten to match, under the old datasetVersion", (sub) => {
    const { root, dir } = archiveCopy(sub, "consistent");
    const changed = changeOneByte(readFileSync(join(dir, "sources.json"), "utf8"));
    writeFileSync(join(dir, "sources.json"), changed, "utf8");
    rewrite(dir, (manifest) => {
      manifest.datasets["sources.json"].sha256 = sha256Hex(changed);
    });
    const message = refusal(() => readControlsArchive(AS_OF, root)).message;
    assert.ok(message.startsWith(`manifest datasetVersion ${DATASET_VERSION} does not match its datasets (smpt-controls-v1-${AS_OF}-`), message);
  });

  await t.test("a dataset changed and the whole manifest re-identified", (sub) => {
    const { root, dir } = archiveCopy(sub, "reidentified");
    const changed = changeOneByte(readFileSync(join(dir, "sources.json"), "utf8"));
    writeFileSync(join(dir, "sources.json"), changed, "utf8");
    const contents = Object.fromEntries(
      CONTROLS_DATASET_FILES.map((name) => [name, readFileSync(join(dir, name), "utf8")]),
    ) as Parameters<typeof snapshotIdentity>[0];
    const identity = snapshotIdentity(contents, 1, AS_OF);
    rewrite(dir, (manifest) => {
      manifest.datasets = identity.datasets;
      manifest.datasetVersion = identity.datasetVersion;
    });
    // Internally consistent, and still refused: the pin in the code is what a consumer recorded.
    assert.match(refusal(() => readControlsArchive(AS_OF, root)).message, new RegExp(`the pinned release is ${DATASET_VERSION}$`));
  });
});

test("worked_example.py runs against the archived files with python3 and exits 0", (t) => {
  // The script loads the five snapshot files from its own directory, so it is
  // copied next to a copy of the archive.
  const dir = tempDir(t, "example");
  for (const name of ARCHIVE_FILES) copyFileSync(join(archiveDir, name), join(dir, name));
  copyFileSync(join(process.cwd(), COMPANION_DIR, "worked_example.py"), join(dir, "worked_example.py"));
  const run = spawnSync("python3", [join(dir, "worked_example.py")], { cwd: dir, encoding: "utf8", timeout: 60_000 });
  assert.equal(run.error, undefined, `python3 could not be started: ${String(run.error)}`);
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("npm run feed:controls:verify-baseline reports verified true with the archive check and the live check", () => {
  const run = verifyBaseline();
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout) as { verified: boolean; releases: Record<string, unknown>[] };
  assert.equal(report.verified, true);
  assert.equal(report.releases.length, 1);
  const [release] = report.releases;
  assert.equal(release.asOf, AS_OF);
  assert.equal(release.datasetVersion, DATASET_VERSION);
  assert.equal(release.sourceCommit, SOURCE_COMMIT);
  assert.equal(release.archiveProblem, null);
  assert.deepEqual(release.fileSha256, Object.fromEntries(CONTROLS_DATASET_FILES.map((name) => [name, PINNED_FILES[name].sha256])));
  const checks = release.checks as { check: string; result: string; detail: string }[];
  assert.deepEqual(checks.map((check) => check.check), ["archive against pinned identity", "live record"]);
  assert.deepEqual(checks[0], { check: "archive against pinned identity", result: "match", detail: DATASET_VERSION });
  if (liveAtArchivedCutoff) {
    assert.deepEqual(checks[1], { check: "live record", result: "match", detail: DATASET_VERSION });
  } else {
    assert.equal(checks[1].result, "skipped");
    assert.match(checks[1].detail, new RegExp(`the live record's cutoff is ${live.manifest.asOf}`));
  }
});

test("verify-baseline --from-git --write <new dir>: with commit ecffb92 present it reports the rebuild as a match and writes files equal to the archive, then refuses to write there again; in a shallow clone without the commit it exits 1 saying so and writes nothing", (t) => {
  const out = join(tempDir(t, "recover"), "recovered");
  const run = verifyBaseline("--from-git", "--write", out);
  if (!commitPresent) {
    assert.equal(run.status, 1);
    assert.equal(run.stdout, "");
    assert.equal(run.stderr.trim(), `controls-baseline: commit ${SOURCE_COMMIT} is not in this clone; fetch the default branch and retry`);
    assert.equal(existsSync(out), false);
    return;
  }
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout) as { verified: boolean; releases: { checks: { check: string; result: string; detail: string }[] }[] };
  assert.equal(report.verified, true);
  const checks = report.releases[0].checks;
  assert.deepEqual(
    checks.map((check) => [check.check, check.result]),
    [
      ["archive against pinned identity", "match"],
      ["live record", liveAtArchivedCutoff ? "match" : "skipped"],
      ["rebuild from pinned commit", "match"],
      ["recovered files written", "match"],
    ],
  );
  assert.equal(checks[2].detail, SOURCE_COMMIT);
  assert.equal(checks[3].detail, join(out, AS_OF));
  assert.deepEqual(readdirSync(join(out, AS_OF)).sort(), [...ARCHIVE_FILES, "README.md", "worked_example.py", "controls-snapshot.zip"].sort());
  assert.equal(sha256Hex(readFileSync(join(out, AS_OF, "controls-snapshot.zip"))), ZIP_SHA256);
  for (const name of ARCHIVE_FILES) {
    assert.equal(readFileSync(join(out, AS_OF, name), "utf8"), readFileSync(join(archiveDir, name), "utf8"), `${name} recovered from git differs from the archive`);
  }

  const again = verifyBaseline("--from-git", "--write", out);
  assert.equal(again.status, 1);
  assert.equal(again.stderr.trim(), `controls-baseline: ${join(out, AS_OF)} already exists; choose a new directory`);
});

test("verify-baseline refuses --write without --from-git, and an unknown argument, with its usage line and writes nothing", (t) => {
  const out = join(tempDir(t, "refused"), "recovered");
  const usage = "controls-baseline: Usage: npm run feed:controls:verify-baseline -- [--from-git [--write <new-directory>]]";
  const withoutGit = verifyBaseline("--write", out);
  assert.equal(withoutGit.status, 1);
  assert.equal(withoutGit.stdout, "");
  assert.equal(withoutGit.stderr.trim(), usage);
  assert.equal(existsSync(out), false);

  const stray = verifyBaseline("--frm-git");
  assert.equal(stray.status, 1);
  assert.equal(stray.stderr.trim(), usage);
});
