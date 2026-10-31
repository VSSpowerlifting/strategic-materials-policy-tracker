/** Verify real reference downloads from a local production search page. */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";

const port = 3500, origin = `http://127.0.0.1:${port}`;
const canonical = "https://strategic-materials-policy-tracker.vercel.app";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], {
  env: {...process.env, NODE_ENV: "production"}, stdio: ["ignore", "pipe", "pipe"],
});
let logs = "", browser;
for (const stream of [server.stdout, server.stderr]) stream.on("data", b => {logs = (logs + b).slice(-16000);});
async function download(page, format, keyboard = false) {
  const pending = page.waitForEvent("download");
  const button = page.getByRole("button", {name: `Download results ${format.toUpperCase()}`});
  if (keyboard) {await button.focus(); await page.keyboard.press("Enter");}
  else await button.click();
  const item = await pending;
  assert.equal(await item.failure(), null);
  assert.match(item.suggestedFilename(), new RegExp(`^smpt-search-references-\\d{4}-\\d{2}-\\d{2}\\.${format}$`));
  const stream = await item.createReadStream(), chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
function csvRows(text) {
  const rows = [], row = [];
  let field = "", quoted = false;
  for (let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {field += '"'; i++;} else quoted = !quoted;
    } else if (!quoted && [",", "\r", "\n"].includes(c)) {
      row.push(field); field = "";
      if (c !== ",") {rows.push([...row]); row.length = 0; if (c === "\r" && text[i + 1] === "\n") i++;}
    } else field += c;
  }
  return rows;
}
async function visibleRecordUrls(page) {
  return page.getByTestId("search-results").locator("a").evaluateAll(links => links.map(a => a.getAttribute("href")));
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error("Server exited: " + logs);
    try {if ((await fetch(origin + "/search")).ok) {ready = true; break;}} catch { /* startup */ }
    await delay(250);
  }
  assert.ok(ready, logs);
  browser = await chromium.launch({headless: true});
  for (const width of [320, 768, 1440]) {
    const page = await browser.newPage({viewport: {width, height: 900}, acceptDownloads: true});
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(origin + "/search", {waitUntil: "networkidle"});
    assert.equal(await page.getByTestId("search-reference-downloads").count(), 0, "no export of an inactive search");
    await page.goto(origin + "/search?kind=project&q=Umicore", {waitUntil: "networkidle"});
    const paths = await visibleRecordUrls(page);
    assert.ok(paths.length > 0);
    const json = JSON.parse(await download(page, "json", true));
    assert.equal(json.recordCount, paths.length);
    assert.equal(json.search.kind, "project");
    assert.equal(json.search.query, "Umicore");
    assert.deepEqual(json.records.map(r => r.recordUrl), paths.map(p => new URL(p, canonical).href));
    const csv = await download(page, "csv");
    assert.equal(csv.charCodeAt(0), 0xfeff, "UTF-8 BOM for spreadsheet native-script compatibility");
    const rows = csvRows(csv);
    assert.equal(rows.length, paths.length + 1);
    assert.deepEqual(rows.slice(1).map(r => r[3]), json.records.map(r => r.id));
    assert.deepEqual(rows.slice(1).map(r => r[6]), json.records.map(r => r.recordUrl));
    assert.ok(rows.slice(1).every(r => r[0] === json.corpusRevision && r[1] === json.search.path));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), "overflow at " + width);
    await page.goto(origin + "/search?q=not-a-real-record-998877", {waitUntil: "networkidle"});
    assert.equal(await page.getByTestId("search-reference-downloads").count(), 0, "no empty-result download controls");
    assert.deepEqual(errors, []);
    await page.close();
  }
  const page = await browser.newPage({acceptDownloads: true});
  await page.goto(origin + "/search?kind=source&q=" + encodeURIComponent("稀土"), {waitUntil: "networkidle"});
  const native = JSON.parse(await download(page, "json"));
  assert.ok(native.recordCount > 0);
  assert.equal(native.search.query, "稀土");
  assert.ok(native.records.every(r => r.kind === "source"));
  await page.goto(origin + "/search?q=gallium", {waitUntil: "networkidle"});
  const mixed = JSON.parse(await download(page, "json"));
  assert.ok(new Set(mixed.records.map(r => r.kind)).size > 1, "mixed-kind references");
  await page.goto(origin + "/search?kind=event&actor=china&mechanism=export_control", {waitUntil: "networkidle"});
  const filtered = JSON.parse(await download(page, "json"));
  assert.ok(filtered.recordCount > 0);
  assert.equal(filtered.search.actor, "china");
  assert.equal(filtered.search.mechanism, "export_control");
  assert.deepEqual(filtered.records.map(r => r.recordUrl), (await visibleRecordUrls(page)).map(p => new URL(p, canonical).href));
  const before = await visibleRecordUrls(page);
  await page.evaluate(() => {window.__originalCreateObjectURL = URL.createObjectURL; URL.createObjectURL = () => {throw Error("Download blocked");};});
  await page.getByRole("button", {name: "Download results JSON"}).click();
  await page.getByRole("alert").filter({hasText: "download could not start"}).waitFor();
  assert.deepEqual(await visibleRecordUrls(page), before, "failure preserves visible research results");
  assert.equal(await page.locator('a[download]').count(), 0, "temporary anchors cleaned up");
  await page.evaluate(() => {URL.createObjectURL = window.__originalCreateObjectURL;});
  assert.equal(JSON.parse(await download(page, "json")).recordCount, before.length);
  assert.equal(await page.getByRole("alert").filter({hasText: "download could not start"}).count(), 0);
  await page.close();
  console.log("Search reference QA passed: actual CSV/JSON downloads match visible ranked rows; canonical anchors, Unicode, actor/mechanism, mixed types, keyboard, zero/inactive states, error recovery and 320/768/1440px.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
