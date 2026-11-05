/** Local production-server verification only; no hosted preview or publishing. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const origin = "http://127.0.0.1:3496",
  path = "/research/escondida-copper";
const directory = "docs/research/fi002-website/review";
await mkdir(directory, { recursive: true });
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", "3496", "-H", "127.0.0.1"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
for (const s of [server.stdout, server.stderr])
  s.on("data", (b) => (logs += b));
let browser;
const checks = [];
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(origin + path)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(250);
  }
  assert.ok(ready, logs);
  browser = await chromium.launch();
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origin + path);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
      "https://strategic-materials-policy-tracker.vercel.app" + path,
    );
    assert.match(
      await page.locator('meta[property="og:image"]').getAttribute("content"),
      /fi002\/social.png$/,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow ${width}`,
    );
    for (const [name, n] of [
      ["Shorter benefits", "275"],
      ["Shorter, later", "333"],
      ["Combined stress", "416"],
      ["Base", "199"],
    ]) {
      await page.getByRole("radio", { name, exact: true }).check();
      assert.match(await page.getByRole("status").innerText(), new RegExp(n));
    }
    await page
      .getByText("All four tests and common assumptions", { exact: true })
      .click();
    assert.ok(await page.getByRole("table").isVisible());
    // Standard radio arrow-key behavior and visible focus.
    await page.getByRole("radio", { name: "Base", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    assert.ok(
      await page
        .getByRole("radio", { name: "Shorter benefits", exact: true })
        .isChecked(),
    );
    await page.getByRole("radio", { name: "Base", exact: true }).check();
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      a11y.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      `Axe ${width}`,
    );
    const links = await page
      .locator('main a[href^="/"]')
      .evaluateAll((els) => [
        ...new Set(els.map((x) => x.getAttribute("href"))),
      ]);
    for (const href of links) {
      const res = await fetch(origin + href);
      assert.ok(res.ok, `${href}: ${res.status}`);
    }
    assert.deepEqual(errors, []);
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(150);
    if (width === 1440 || width === 390)
      await page.screenshot({ path: `${directory}/hero-${width}.png` });
    await page.screenshot({
      path: `${directory}/publication-${width}.png`,
      fullPage: true,
    });
    if (width === 1440 || width === 390) {
      await page.locator("#replacement").scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${directory}/exhibit-${width}.png` });
    }
    checks.push({
      viewport: width,
      overflow: false,
      radioTests: 5,
      axeViolations: 0,
      internalLinks: links.length,
      consoleErrors: errors,
    });
    await context.close();
  }
  const page = await browser.newPage();
  await page.goto(origin + "/research");
  assert.ok(
    await page.getByRole("link", { name: /Goldman Sachs/ }).isVisible(),
  );
  await page.goto(origin + "/");
  assert.ok(
    await page.getByRole("link", { name: /Goldman Sachs/ }).isVisible(),
  );
  await page.goto(origin + "/search?q=Escondida&kind=publication");
  await page.getByRole("link", { name: /Goldman Sachs/ }).waitFor();
  assert.match(
    await (await fetch(origin + "/sitemap.xml")).text(),
    /research\/escondida-copper/,
  );
  await page.goto(origin + "/research/fi002/report.html");
  assert.equal(await page.locator("main").count(), 1);
  assert.equal(await page.locator('a[href*="docs.google.com"]').count(), 0);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Full report overflow ${width}`,
    );
  }
  // All essential content survives with JavaScript disabled.
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const plain = await nojs.newPage();
  await plain.goto(origin + path);
  assert.ok(
    await plain.getByRole("link", { name: /Read the full report/ }).isVisible(),
  );
  await plain
    .getByText("All four tests and common assumptions", { exact: true })
    .click();
  assert.ok(await plain.getByRole("table").isVisible());
  assert.ok(
    await plain.getByRole("radio", { name: "Base", exact: true }).isDisabled(),
  );
  await nojs.close();
  await writeFile(
    directory + "/browser-results.json",
    JSON.stringify(
      {
        localOnly: true,
        checks,
        catalog: true,
        homepage: true,
        search: true,
        sitemap: true,
        fullText: true,
        noJavaScriptFallback: true,
      },
      null,
      2,
    ) + "\n",
  );
  console.log("FI002 local browser QA passed:", checks);
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
