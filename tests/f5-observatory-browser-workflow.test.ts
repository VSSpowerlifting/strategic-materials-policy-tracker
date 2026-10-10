import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { site } from "@/lib/site";

const runner="scripts/qa-f5-observatory-browser.mjs";
const workflow=".github/workflows/f5-observatory-browser-qa.yml";
const text=()=>readFileSync(runner,"utf8");
const yaml=()=>readFileSync(workflow,"utf8");

test("O3c Chromium check has valid Node syntax independent of installed browser",()=>{
  const run=spawnSync(process.execPath,["--check",runner],{encoding:"utf8"});
  assert.equal(run.status,0,run.stderr);
});

test("O3c CI is isolated, read-only and does not distribute internal editorial HTML",()=>{
  const job=yaml(),code=text();
  assert.match(job,/name: F5 Observatory local Chromium QA/);
  assert.match(job,/pull_request:/);
  assert.match(job,/permissions:\s*\n\s*contents: read/);
  assert.match(job,/timeout-minutes: 20/);
  assert.match(job,/validate-repository:/);
  assert.match(job,/node-version: "20"/);
  for(const gate of [
    "npm ci","npm audit --omit=dev --audit-level=moderate",
    "npm run validate","npm run typecheck","npm run lint","npm test","npm run build",
  ])assert.ok(job.includes(gate),"stacked PR must run full repo gate: "+gate);
  assert.match(job,/playwright@1\.55\.0/);
  assert.match(job,/npx playwright install --with-deps chromium/);
  assert.match(job,/npm run preview:f5-observatory/);
  assert.match(job,/node scripts\/qa-f5-observatory-browser\.mjs/);
  assert.match(job,/test -z "\$\(git status --porcelain\)"/);
  assert.ok(!/^\s*-\s+uses:\s+actions\/upload-artifact/m.test(job),
    "never upload internal screenshots or local HTML into publicly accessible artifacts");
  assert.ok(!/^\s*run:\s*[^\n]*(?:vercel|next start|http-server|serve -s)/m.test(job));
  assert.ok(!code.includes(".screenshot("));
  assert.ok(!code.includes("trace.start("));
  assert.ok(!code.includes("writeFile("));
  assert.ok(!code.includes("page.click("));
  assert.ok(!code.includes(".route("));
  assert.ok(!code.includes("page.goto('http"));
  assert.equal(existsSync("app/observatory/page.tsx"),false);
  assert.equal(existsSync("public/observatory-preview.html"),false);
});

test("O3c covers device dimensions, keyboard navigation, contrast and unchanged human review plans",()=>{
  const code=text();
  for(const width of ["width:320,height:720","width:768,height:1024","width:1440,height:900"])
    assert.ok(code.includes(width),width);
  for(const phrase of [
    'ArrowRight','page.keyboard.press("Tab")','document.documentElement.scrollWidth',
    'contrastRatio(', 'ratio>=4.5', 'getByRole("columnheader")',
    'getByRole("rowheader")', 'getByRole("region"',
    'offFileRequests','No reviewed occurred claim registered',
    'artifactSha256','browserQaCompleted,false','originalSourcesIndependentlyReviewed,false',
    'assert.deepEqual(latest,receipt)',
  ])assert.ok(code.includes(phrase),"missing invariant: "+phrase);
  assert.equal(site.lastUpdated,"2026-10-09");
});
