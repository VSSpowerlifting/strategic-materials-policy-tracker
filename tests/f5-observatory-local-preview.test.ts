import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  buildF5LocalBrowserPreview, F5_PREVIEW_DIRECTORY, F5_PREVIEW_HTML,
  F5_PREVIEW_QA, F5_PREVIEW_WIDTHS,
} from "../scripts/f5-observatory-local-preview";

const preview=buildF5LocalBrowserPreview();
const sha=(text:string)=>createHash("sha256").update(text,"utf8").digest("hex");

test("O3b: produces standalone local HTML with real Lattice Register CSS and four projects",async()=>{
  const {html,qaPlan,stylesheetBytes}=await preview;
  assert.match(html,/^<!doctype html>\n<html lang="en">/);
  assert.match(html,/<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html,/Content-Security-Policy/);
  assert.match(html,/default-src &#39;none&#39;/);
  assert.match(html,/script-src &#39;none&#39;/);
  assert.match(html,/name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(html,/Lattice Register|--accent: #e3b04b/);
  assert.match(html,/--bg: #12110f/);
  assert.match(html,/grid-template-columns/);
  assert.ok(stylesheetBytes>10000,"the entire real Tailwind/brand stylesheet should compile");
  assert.equal((html.match(/<article id="f5-case-/g)??[]).length,4);
  assert.match(html,/Alcoa-Sojitz Gallium Recovery Project/);
  assert.match(html,/Stibnite Gold Project/);
  assert.match(html,/Thompson Falls antimony processing and refining expansion/);
  assert.match(html,/Industrial Outcome Observatory/);
  assert.match(html,/Publication gate: CLOSED/);
  assert.ok(!html.includes("<script"),"no scripts in generated local file");
  assert.ok(!html.includes('<link rel="stylesheet"'),"all stylesheet bytes are inline");
  assert.ok(!html.includes("<iframe"),"no remote embeds");
  assert.ok(!html.includes("https://fonts.googleapis.com"),"no external font fetches");
  assert.ok(!html.includes("PUBLIC RELEASE AUTHORIZED"));
  assert.equal(qaPlan.artifactSha256,sha(html));
});

test("O3b: does not expose a public Next route, release flag or automatic QA approval",async()=>{
  const {qaPlan}=await preview;
  assert.equal(qaPlan.audience,"local_maintainer_only");
  assert.equal(qaPlan.platform,"local_file_without_public_route");
  assert.equal(qaPlan.publicReleaseAuthorized,false);
  assert.equal(qaPlan.originalSourcesIndependentlyReviewed,false);
  assert.equal(qaPlan.browserQaCompleted,false);
  assert.equal(qaPlan.releaseReceiptPresent,false);
  assert.equal(qaPlan.schemaVersion,"f5-local-browser-qa-plan-1");
  assert.deepEqual(qaPlan.viewports.map(x=>x.width),[...F5_PREVIEW_WIDTHS]);
  assert.ok(qaPlan.viewports.every(x=>x.outcome==="not_run"));
  assert.ok(qaPlan.manualChecks.length>=8);
  assert.ok(qaPlan.manualChecks.every(x=>x.outcome==="not_run"));
  assert.ok(qaPlan.manualChecks.some(x=>x.id==="contrast_and_screen_reader"));
  assert.ok(qaPlan.manualChecks.some(x=>x.id==="comparison_keyboard_scroll"));
  assert.ok(qaPlan.limitations.some(x=>x.includes("not a Next.js page")));
  assert.ok(!existsSync("app/observatory/page.tsx"));
  assert.ok(!existsSync("app/pathways/page.tsx"));
  assert.equal(F5_PREVIEW_DIRECTORY,".project-execution-review");
  assert.equal(F5_PREVIEW_HTML,"observatory-preview.html");
  assert.equal(F5_PREVIEW_QA,"observatory-qa-plan.json");
  assert.ok(!existsSync(join("public",F5_PREVIEW_HTML)));
});

test("O3b: core local HTML retains native source links and disclosure barriers",async()=>{
  const {html}=await preview;
  assert.match(html,/role="region" aria-label="Horizontally scrollable project-evidence coverage comparison" tabindex="0"/);
  assert.match(html,/focus-visible:outline-2/);
  assert.match(html,/min-w-\[52rem\]/);
  assert.match(html,/lg:grid-cols-2/);
  assert.match(html,/target="_blank" rel="noopener noreferrer"/);
  assert.match(html,/No reviewed occurred claim registered/);
  assert.match(html,/No source-reviewed occurred physical milestone has entered the project-native register/);
  assert.match(html,/not a policy-effect assessment/);
  assert.match(html,/not evidence of a government-caused physical result/);
  assert.match(html,/Recognition only|Official project designations/);
  assert.ok(!html.includes("Project stalled"));
  assert.ok(!html.includes("total committed capital"));
});

test("O3b: CLI refuses publish/upload options without touching preview outputs",()=>{
  const cmd=[process.execPath,"--import","tsx","scripts/preview-f5-observatory.ts"];
  for(const flags of [["--publish"],["--serve"],["--output","public/observatory.html"],["--check","--check"]]){
    const result=spawnSync(cmd[0],[...cmd.slice(1),...flags],{encoding:"utf8"});
    assert.equal(result.status,2,flags.join(" "));
    assert.match(result.stderr,/Usage: npm run preview:f5-observatory/);
    assert.equal(result.stdout,"");
  }
});

test("O3b: --check runs complete preview generation but never writes files",()=>{
  const run=spawnSync(process.execPath,["--import","tsx","scripts/preview-f5-observatory.ts","--check"],{
    encoding:"utf8",timeout:120000,
  });
  assert.equal(run.status,0,run.stderr.slice(0,5000));
  assert.match(run.stdout,/F5 local preview: PASS \(no files written\)/);
  assert.match(run.stdout,/Browser, keyboard and source QA: NOT RUN/);
  assert.match(run.stdout,/Public route\/release: NOT AUTHORIZED/);
});
