/**
 * Chromium release QA for source-honest /projects/compare.
 * Starts the local production build; never calls Vercel, external publishers,
 * or private M3/F5 packets. Screenshots and traces remain local-only.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const port = 3512, origin = `http://127.0.0.1:${port}`;
const left = "prj-au-alcoa-sojitz-gallium";
const right = "prj-lynas-hre-separation";
const server = spawn(process.execPath, [
  "node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1",
], {env: {...process.env, NODE_ENV: "production"}, stdio: ["ignore", "pipe", "pipe"]});
let logs = "", browser;
for (const stream of [server.stdout, server.stderr])
  stream.on("data", chunk => {logs=(logs+chunk.toString()).slice(-16000);});
try {
  let ready = false;
  for (let n=0; n<100; n++) {
    if (server.exitCode !== null) throw new Error("Next exited: "+logs);
    try {if ((await fetch(origin+"/projects/compare")).ok) {ready=true;break;}} catch { /* warmup */ }
    await delay(250);
  }
  assert.ok(ready, "Comparison route failed to start: "+logs);
  browser=await chromium.launch({headless:true});
  for (const width of [320, 768, 1440]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    const errors=[];
    page.on("pageerror", error=>errors.push(error.message));
    await page.goto(origin+"/projects/compare", {waitUntil:"networkidle"});
    assert.equal(await page.locator("h1").innerText(),"Compare project evidence");
    assert.equal(await page.getByTestId("project-comparison-results").count(),0);
    await page.getByTestId("compare-left").selectOption(left);
    await page.getByTestId("compare-right").selectOption(right);
    await page.getByTestId("project-comparison-results").waitFor();
    await page.waitForFunction(() => new URLSearchParams(location.search).get("right") === "prj-lynas-hre-separation");
    const results=page.getByTestId("project-comparison-results");
    assert.equal(await results.locator("h2").count(),3, "summary plus two project cards");
    assert.equal(await results.locator('a[href="/capital/fin-jp-jare-lynas-2023-equity"]').count(),1,
      "Lynas association points to the finance record once, not a direct funded amount");
    assert.ok((await results.innerText()).includes("none allocates a project-specific share"));
    assert.ok((await results.innerText()).includes("No project-native physical milestone has been published"));
    assert.ok(await results.locator('a[href^="/sources/"]').count()>0,"original source links present");
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,
      "horizontal overflow at "+width);
    await page.reload({waitUntil:"networkidle"});
    assert.equal(await page.getByTestId("compare-left").inputValue(),left);
    assert.equal(await page.getByTestId("compare-right").inputValue(),right);
    await page.getByRole("button",{name:"Swap projects"}).click();
    assert.equal(await page.getByTestId("compare-left").inputValue(),right);
    assert.equal(await page.getByTestId("compare-right").inputValue(),left);
    await page.getByRole("button",{name:"Clear comparison"}).click();
    assert.equal(await page.getByTestId("project-comparison-results").count(),0);
    assert.equal(await page.getByTestId("compare-left").inputValue(),"all");
    assert.deepEqual(errors,[],"no browser exceptions");
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(origin+`/projects/compare?left=invalid-project&right=${right}`,{waitUntil:"networkidle"});
  assert.equal(await page.getByTestId("compare-left").inputValue(),"all","unregistered deep link fails closed");
  assert.equal(await page.getByTestId("compare-right").inputValue(),right);
  assert.equal(await page.getByTestId("project-comparison-results").count(),0);
  await page.getByTestId("compare-left").selectOption(right);
  assert.equal(await page.getByTestId("project-comparison-results").count(),0,"self-comparison rejected");
  await page.getByTestId("compare-left").selectOption(left);
  await page.locator(`a[href="/projects/${left}"]`).first().focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(new RegExp(`/projects/${left}$`));
  assert.ok((await page.locator("h1").innerText()).includes("Alcoa"));
  await page.close();
  console.log("Project comparison QA passed: deep links, invalid IDs, nonallocative finance, citations, keyboard, no misleading milestones and responsive 320/768/1440.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
