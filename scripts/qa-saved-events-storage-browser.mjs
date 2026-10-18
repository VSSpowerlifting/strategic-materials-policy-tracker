/** Real user flows against a local production build; no deployment required. */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";

const port = 3499, origin = `http://127.0.0.1:${port}`;
const key = "smpt:saved-events:v1", eventId = "evt-cn-ecl-2020";
const eventUrl = `${origin}/events/${eventId}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], {
  env: {...process.env, NODE_ENV: "production"}, stdio: ["ignore", "pipe", "pipe"],
});
let logs = "", browser;
for (const stream of [server.stdout, server.stderr]) stream.on("data", b => {logs = (logs + b).slice(-16000);});
const saveButton = page => page.getByRole("button", {name: /^(?:☆|★)?\s*(?:Save to my list|Saved to my list)$/});
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error("Server exited: " + logs);
    try { if ((await fetch(eventUrl)).ok) {ready = true; break;} } catch { /* startup */ }
    await delay(250);
  }
  assert.ok(ready, logs);
  browser = await chromium.launch({headless: true});
  for (const width of [320, 768, 1440]) {
    const context = await browser.newContext({viewport: {width, height: 900}});
    const errors = [];
    context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
    await context.addInitScript(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v) {
        if (k === "smpt:saved-events:v1" && window.__blockSavedWrites) throw new DOMException("Quota exceeded", "QuotaExceededError");
        return set.call(this, k, v);
      };
    });
    const page = await context.newPage();
    await page.goto(eventUrl, {waitUntil: "networkidle"});
    const button = saveButton(page);
    await page.evaluate(() => {window.__blockSavedWrites = true;});
    await button.click();
    await page.getByRole("status").filter({hasText: "could not be read or updated"}).waitFor();
    assert.equal(await button.getAttribute("aria-pressed"), "false", "failed save must remain unsaved");
    await page.evaluate(() => {window.__blockSavedWrites = false;});
    await button.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector('button[aria-pressed="true"]'));
    await page.reload({waitUntil: "networkidle"});
    assert.equal(await saveButton(page).getAttribute("aria-pressed"), "true", "success survives reload");
    await page.evaluate(() => {window.__blockSavedWrites = true;});
    await saveButton(page).click();
    assert.equal(await saveButton(page).getAttribute("aria-pressed"), "true", "failed unsave remains saved");
    const list = await context.newPage();
    await list.goto(`${origin}/saved`, {waitUntil: "networkidle"});
    await list.evaluate(() => {window.__blockSavedWrites = true;});
    await list.getByRole("button", {name: /^Remove /}).click();
    await list.getByRole("status").filter({hasText: "Could not update"}).waitFor();
    assert.equal(await list.locator(`a[href="/events/${eventId}"]`).count(), 1);
    await list.getByRole("button", {name: "Clear all", exact: true}).click();
    assert.equal(await list.locator(`a[href="/events/${eventId}"]`).count(), 1, "failed clear preserves list");
    await list.evaluate(({key, eventId}) => {
      window.__blockSavedWrites = false;
      localStorage.setItem(key, JSON.stringify([eventId, eventId, "", "evt-unpublished"]));
    }, {key, eventId});
    await list.reload({waitUntil: "networkidle"});
    assert.equal(await list.locator(`a[href="/events/${eventId}"]`).count(), 1, "duplicate IDs render once");
    assert.ok((await list.locator("body").innerText()).includes("1 saved id no longer resolves"));
    await list.getByRole("button", {name: "Clear all", exact: true}).click();
    await list.getByText("Nothing saved yet", {exact: true}).waitFor();
    await page.waitForFunction(() => document.querySelector('button[aria-pressed="false"]'));
    assert.ok(await list.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.deepEqual(errors, []);
    await context.close();
  }
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", {
    configurable: true, get() {throw new DOMException("Blocked", "SecurityError");},
  }));
  const page = await blocked.newPage(), errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(eventUrl, {waitUntil: "networkidle"});
  await saveButton(page).click();
  assert.equal(await saveButton(page).getAttribute("aria-pressed"), "false");
  await page.goto(`${origin}/saved`, {waitUntil: "networkidle"});
  await page.getByText("Saved events unavailable", {exact: true}).waitFor();
  await page.getByRole("button", {name: "Retry saved list"}).click();
  assert.deepEqual(errors, []);
  await blocked.close();
  console.log("Saved events QA passed: read denial, quota failure, truthful toggle/remove/clear, recovery, duplicate/stale IDs, reload persistence, cross-tab updates, keyboard and 320/768/1440px.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
