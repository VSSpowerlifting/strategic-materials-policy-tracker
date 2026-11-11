import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fi002, fi002Downloads, fi002Screens } from "../lib/fi002";
import { buildSearchIndex, searchDocs } from "../lib/search";
const root = "public/research/fi002/";
const sha = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex");

test("FI002 public manifest verifies every distributed file, including reader downloads", () => {
  const manifest = JSON.parse(
    readFileSync(root + "publication-manifest.json", "utf8"),
  );
  assert.equal(
    manifest.approvedResearchCommit,
    "1c4288916abe8fa1df9f906c87a4278647e6adcb",
  );
  assert.equal(manifest.researchCutoff, fi002.cutoff);
  for (const [file, data] of Object.entries(manifest.files) as [
    string,
    { sha256: string; bytes: number },
  ][]) {
    assert.equal(sha(root + file), data.sha256, file);
    assert.equal(statSync(root + file).size, data.bytes, file);
  }
  for (const d of fi002Downloads)
    assert.ok(
      d.file === "research-package.zip" || manifest.files[d.file],
      d.file,
    );
  const files = readdirSync(root, { recursive: true }).filter((p) =>
    statSync(root + p).isFile(),
  );
  assert.deepEqual(
    files.sort(),
    [
      ...Object.keys(manifest.files),
      "publication-manifest.json",
      "research-package.zip",
    ].sort(),
  );
  assert.ok(
    files.every(
      (p) =>
        !p.includes("audit") &&
        !p.includes("build/") &&
        !p.includes("delivery"),
    ),
  );
});

test("approved model, brief, evidence and four calculation datasets are byte-identical", () => {
  const original = "docs/research/fi002-bhp-copper/output/";
  const copies = {
    "model.xlsx": "BHP_Copper_Model.xlsx",
    "executive-brief.pdf": "BHP_Copper_Memo.pdf",
    "evidence-register.csv": "Evidence_Register.csv",
    "claim-source-matrix.csv": "Claim_Source_Matrix.csv",
    "price-sensitivity.csv": "Price_Sensitivity.csv",
    "threshold-sensitivities.csv": "Threshold_Sensitivities.csv",
    "price-cost-frontier.csv": "Price_Cost_Frontier.csv",
    "replacement-margin-frontier.csv": "Replacement_Margin_Frontier.csv",
  };
  for (const [target, source] of Object.entries(copies))
    assert.equal(
      sha(root + target),
      sha(original + "SMPT_FI002_" + source),
      target,
    );
});

test("published executive slides are byte-identical to author-approved RC5", () => {
  const accepted = "docs/research/fi002-bhp-copper/output/review/release-candidate-5/";
  assert.equal(
    sha(root + "executive-slides.pdf"),
    sha(accepted + "SMPT_FI002_BHP_Copper_Strategy_Deck_RC5.pdf"),
  );
  assert.equal(
    sha(root + "executive-slides.pptx"),
    sha(accepted + "SMPT_FI002_BHP_Copper_Strategy_Deck_RC5.pptx"),
  );
});

test("all four interactive screens match the independently reproduced approved CSV", () => {
  const lines = readFileSync(root + "threshold-sensitivities.csv", "utf8")
    .trim()
    .split(/\r?\n/);
  const values = lines.slice(1).map((l) => Number(l.split(",").at(-1)));
  for (const [i, s] of fi002Screens.entries()) {
    assert.ok(values.includes(s.exact), `${s.name}: original result`);
    assert.equal(Math.round(s.exact), s.ktpa);
    assert.ok(i !== 1 || s.years.startsWith("10 years · 2032"));
  }
});

test("publication is discoverable without adding hypothetical research to tracker records", () => {
  const docs = buildSearchIndex();
  const matches = searchDocs(docs, "Escondida Goldman");
  assert.ok(
    matches.some((d) => d.kind === "publication" && d.href === fi002.path),
  );
  const sitemap = readFileSync("app/sitemap.ts", "utf8");
  assert.ok(sitemap.includes(fi002.path));
  assert.ok(readFileSync("app/research/page.tsx", "utf8").includes(fi002.path));
  assert.match(readFileSync("app/page.tsx", "utf8"), /<FeaturedCase \/>/);
  assert.ok(readFileSync("components/home/featured-case.tsx", "utf8").includes("href={fi002.path}"));
  const deployment = JSON.parse(readFileSync("vercel.json", "utf8"));
  assert.equal(deployment.git.deploymentEnabled["*"], false);
  assert.equal(
    deployment.git.deploymentEnabled["codex/fi002-website-release-candidate"],
    false,
  );
  assert.equal(deployment.git.deploymentEnabled.main, true);
  for (const [ref, exit] of [
    ["codex/fi002-website-release-candidate", 0],
    ["main", 1],
    ["other/task", 1],
  ])
    assert.equal(
      spawnSync(process.execPath, ["scripts/fi002-ignore-preview.mjs"], {
        env: { ...process.env, VERCEL_GIT_COMMIT_REF: String(ref) },
      }).status,
      exit,
    );
});
