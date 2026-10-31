/**
 * Public source-dossier browser smoke test. No screenshots/traces uploaded.
 * This reads ONLY the built public website; never private M3 reviewer files.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const port = 3479;
const origin = `http://127.0.0.1:${port}`;
const sourceId = "src-alcoa-wagerup-groundbreaking-2026";
const server = spawn(process.execPath, [
  "node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1",
], {
  env: { ...process.env, NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
for (const stream of [server.stdout, server.stderr])
  stream.on("data", chunk => { logs = (logs + chunk.toString()).slice(-16000); });

let browser;
try {
  let live = false;
  for (let n = 0; n < 100; n++) {
    if (server.exitCode !== null) throw new Error("Next server exited: " + logs);
    try {
      const response = await fetch(origin + "/sources/" + sourceId);
      if (response.ok) { live = true; break; }
    } catch { /* next startup not complete */ }
    await delay(250);
  }
  assert.ok(live, "public source dossier server did not start: " + logs);
  browser = await chromium.launch({headless: true});

  for (const viewport of [
    {width: 375, height: 812},
    {width: 768, height: 1024},
    {width: 1440, height: 900},
  ]) {
    const page = await browser.newPage({viewport});
    await page.goto(origin + "/sources/" + sourceId, {waitUntil: "networkidle"});
    assert.equal(await page.locator("h1").innerText(), "Source dossier");
    assert.ok((await page.locator("h3").first().innerText()).length > 10);
    assert.ok(await page.getByText("Financial instruments", {exact:true}).count() > 0);
    assert.ok(await page.locator('a[href="/capital/fin-au-alcoa-sojitz-gallium-2025-equity"]').count() > 0);
    assert.equal(await page.locator('a[href*=".project-execution-review"]').count(), 0);
    assert.equal(await page.locator('a[href*="data/candidates"]').count(), 0);
    const horizontalOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 2);
    assert.equal(horizontalOverflow, false,
      "unexpected horizontal scroll on source dossier at " + viewport.width);
    await page.close();
  }

  const page = await browser.newPage({viewport:{width:1360,height:900}});
  await page.goto(origin + "/sources", {waitUntil:"networkidle"});
  const dossierLink = page.locator('a[href="/sources/' + sourceId + '"]').first();
  assert.ok(await dossierLink.count(), "source register must link to its dossier");
  await dossierLink.click();
  await page.waitForURL(origin + "/sources/" + sourceId);
  const row = page.locator('a[href="/capital/fin-au-alcoa-sojitz-gallium-2025-equity"]');
  await row.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/capital\/fin-au-alcoa-sojitz-gallium-2025-equity$/);
  assert.ok((await page.locator("h1").first().innerText()).length > 0,
    "source-to-financing navigation must remain keyboard reachable");
  await page.close();

  const unknown = await fetch(origin + "/sources/src-not-a-source");
  assert.equal(unknown.status, 404, "unknown source dossiers must not be fabricated");
  console.log("Public source dossier: desktop/tablet/mobile, direct citations, source register, keyboard navigation and 404 passed.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
