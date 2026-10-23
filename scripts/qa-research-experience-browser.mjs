/** Public journey QA. Uses an installed Playwright runtime; no research/private inputs. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
const { chromium } = createRequire(import.meta.url)(
  process.env.PLAYWRIGHT_MODULE ?? "playwright",
);
const port = Number(process.env.SMPT_QA_PORT ?? 3487);
const base = `http://127.0.0.1:${port}`;
const output = process.env.SMPT_QA_OUTPUT ?? "/tmp/smpt-research-qa";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "-p",
    String(port),
    "-H",
    "127.0.0.1",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "",
  browser;
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (data) => {
    logs = (logs + data).slice(-6000);
  });
try {
  await mkdir(output, { recursive: true });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      if ((await fetch(base)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* starting */
    }
    await delay(250);
  }
  assert.ok(ready, logs);
  browser = await chromium.launch({ headless: true });
  const errors = [];
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    page.on("pageerror", (e) => errors.push(e.message));
    const checkLayout = async (label) => {
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 2,
        ),
        false,
        `${label} overflows at ${width}`,
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `${output}/${label}-${width}.png`,
        fullPage: true,
      });
      if (["home", "wagerup", "compare"].includes(label)) {
        await page.screenshot({ path: `${output}/${label}-${width}-top.png` });
      }
    };
    await page.goto(base, { waitUntil: "networkidle" });
    assert.match(
      await page.locator("h1").innerText(),
      /From government policy/,
    );
    assert.equal(await page.locator("dialog[open]").count(), 0);
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent),
      "Skip to content",
    );
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "main-content",
    );
    await checkLayout("home");
    if (width < 1024) {
      const toggle = page.getByRole("button", { name: "Menu", exact: true });
      await toggle.click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.equal(
        await toggle.evaluate((el) => el === document.activeElement),
        true,
      );
    }
    await page
      .getByRole("link", {
        name: "Open the project investigation",
        exact: true,
      })
      .click();
    await page.waitForURL("**/projects/prj-au-alcoa-sojitz-gallium");
    await page
      .getByRole("heading", { name: "What does the record establish?" })
      .waitFor();
    assert.ok(
      await page
        .getByRole("heading", {
          name: "Source-reviewed industrial observations",
          exact: true,
        })
        .count(),
    );
    assert.match(
      await page.locator("#project-industrial").innerText(),
      /Groundbreaking \(reported\)/,
    );
    assert.match(
      await page.locator("#project-industrial").innerText(),
      /not independently observed sustained works/,
    );
    assert.ok(
      await page.getByRole("link", { name: /Original document/ }).count(),
    );
    await page.locator("#project-finance summary").first().click();
    assert.match(
      await page.locator("#project-finance").innerText(),
      /not promoted beyond the existing announced state/,
    );
    await checkLayout("wagerup");
    const source = page.locator(
      '#project-industrial a[href^="https://news.alcoa.com/"]',
    );
    assert.equal(await source.count(), 1);
    assert.equal(await source.getAttribute("rel"), "noopener noreferrer");
    // Source URL fidelity is verified below against the stored dataset, without
    // treating successful rendering as evidence of publisher network availability.
    await page
      .getByRole("link", { name: "About Benjamin Yang", exact: true })
      .click();
    await page.waitForURL("**/about");
    assert.match(await page.locator("h1").innerText(), /Benjamin Yang/);
    await checkLayout("about");

    await page.goto(
      base +
        "/events?material=gallium&actor=china&context=research#main-content",
      { waitUntil: "networkidle" },
    );
    assert.equal(
      await page.locator("#events-material").inputValue(),
      "gallium",
    );
    assert.equal(
      await page.locator("#events-government").inputValue(),
      "china",
    );
    assert.match(
      await page.locator("#events-count").innerText(),
      /of 65 events/,
    );
    await page.locator("#events-government").selectOption("us");
    await page.waitForFunction(
      () => new URLSearchParams(location.search).get("actor") === "us",
    );
    await page.goBack({ waitUntil: "networkidle" });
    await page.waitForFunction(
      () => document.querySelector("#events-government")?.value === "china",
    );
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page.locator("#events-government").inputValue(),
      "china",
    );
    assert.equal(new URL(page.url()).searchParams.get("context"), "research");
    await checkLayout("explore");
    const event = page.locator('a[href="/events/evt-cn-gage-2023"]').first();
    await event.click();
    await page.waitForURL("**/events/evt-cn-gage-2023");
    await page
      .getByRole("heading", { name: "Cite this record", exact: true })
      .waitFor();
    assert.ok(
      await page
        .locator('a[href="/controls/ctl-cn-gage-2023-export-licensing"]')
        .count(),
    );
    const citation = await page.request.get(
      base + "/api/cite/bibtex/evt-cn-gage-2023",
    );
    assert.equal(citation.status(), 200);
    assert.match(await citation.text(), /@/);
    await page.goBack({ waitUntil: "networkidle" });
    await page.waitForFunction(
      () => document.querySelector("#events-material")?.value === "gallium",
    );
    await page
      .locator("#events-search")
      .fill("synthetic-no-result-query-748392");
    await page
      .getByText("No policy events match this combination.", { exact: false })
      .waitFor();
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector("#events-count")?.textContent ===
        "65 of 65 events",
    );
    assert.equal(new URL(page.url()).searchParams.get("context"), "research");

    await page.goto(base + "/projects/prj-us-stibnite", {
      waitUntil: "networkidle",
    });
    assert.match(
      await page.locator("#project-industrial").innerText(),
      /No source-reviewed project milestone is published/,
    );
    await page.locator("#project-finance summary").last().click();
    assert.match(
      await page.locator("#project-finance").innerText(),
      /conditions precedent/,
    );
    await checkLayout("stibnite");

    await page.goto(base + "/compare", { waitUntil: "networkidle" });
    assert.match(
      await page.locator("#guided-comparison").innerText(),
      /Gallium/,
    );
    const cell = page
      .getByRole("button", { name: /Gallium.*China|China.*Gallium/i })
      .first();
    await cell.focus();
    await page.keyboard.press("Enter");
    await page.locator("#matrix-cell-detail").waitFor();
    assert.ok(
      await page
        .locator('#matrix-cell-detail a[href*="material=gallium"]')
        .count(),
    );
    await checkLayout("compare");
    await page.keyboard.press("Escape");
    assert.equal(
      await cell.evaluate((el) => el === document.activeElement),
      true,
    );
    await page.getByText("Research tools", { exact: true }).click();
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator(".resource-disclosure").getAttribute("open"),
      null,
    );
    await page.close();
  }
  assert.deepEqual(errors, [], "browser page errors");
  const page = await browser.newPage();
  for (const route of [
    "/materials/gallium",
    "/actors/cn",
    "/framing",
    "/interplay",
    "/capital",
    "/controls",
    "/programmes",
    "/projects?material=gallium",
    "/sources",
    "/methodology#translation",
    "/data",
  ]) {
    const response = await page.goto(base + route, {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200, route);
    assert.equal(await page.locator("h1").count(), 1, route);
  }
  const dataset = await (
    await page.request.get(base + "/api/export/dataset.json")
  ).json();
  assert.equal(dataset.counts.projectMilestones, 1);
  const milestone = dataset.projectMilestones[0];
  assert.equal(milestone.id, "mil-au-alcoa-wagerup-groundbreaking-2026-08-24");
  await page.goto(base + "/projects/prj-au-alcoa-sojitz-gallium", {
    waitUntil: "networkidle",
  });
  const original = dataset.sources.find((s) => s.id === milestone.sourceId);
  assert.equal(
    await page
      .locator('#project-industrial a[href^="https://news.alcoa.com/"]')
      .getAttribute("href"),
    original.url,
  );
  const project = await (
    await page.request.get(
      base + "/api/v1/projects/prj-au-alcoa-sojitz-gallium",
    )
  ).json();
  assert.deepEqual(
    project.reviewedProjectMilestones,
    dataset.projectMilestones,
  );
  assert.equal(
    (await page.request.get(base + "/api/export/projects.csv")).status(),
    200,
  );
  console.log(
    "PASS: 390/768/1440px; homepage, Wagerup/Stibnite, primary link fidelity, filter/reload/Back/empty state, comparison keyboard disclosure, menu/Escape/focus, citation/download/API and 11 legacy destinations.",
  );
  console.log(`Screenshots: ${output}`);
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
