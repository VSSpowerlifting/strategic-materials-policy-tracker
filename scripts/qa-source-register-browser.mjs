import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";
const port=3484,origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p",String(port),"-H","127.0.0.1"],{env:{...process.env,NODE_ENV:"production"},stdio:["ignore","pipe","pipe"]});
let logs="";
for(const stream of [server.stdout,server.stderr])stream.on("data",b=>{logs=(logs+b.toString()).slice(-15000)});
let browser;
try{
 let ready=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw new Error("Next exited: "+logs);
  try{if((await fetch(origin+"/sources")).ok){ready=true;break}}catch{/* starting */}
  await delay(250);
 }
 assert.ok(ready,"source server not ready: "+logs);
 const html=await (await fetch(origin+"/sources")).text();
 assert.ok(html.includes("src-alcoa-wagerup-groundbreaking-2026"),"full register must be static HTML");
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:375,height:812},{width:768,height:1024},{width:1440,height:900}]){
  const page=await browser.newPage({viewport});
  await page.goto(origin+"/sources",{waitUntil:"networkidle"});
  assert.equal(await page.locator("h1").innerText(),"Source register");
  const total=await page.getByTestId("source-record").count();
  assert.ok(total>=180);
  assert.equal(Number(await page.getByTestId("sources-count").innerText()),total);
  await page.locator("#source-publication").selectOption("undated");
  await page.waitForFunction(()=>new URLSearchParams(location.search).get("publication")==="undated");
  const subset=await page.getByTestId("source-record").count();
  assert.ok(subset>0&&subset<total);
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.locator("#source-publication").inputValue(),"undated");
  assert.equal(await page.getByTestId("source-record").count(),subset);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  await page.getByRole("button",{name:"Clear filters"}).click();
  assert.equal(await page.getByTestId("source-record").count(),total);
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1360,height:900}});
 await page.goto(origin+"/sources?citingKind=capital",{waitUntil:"networkidle"});
 assert.equal(await page.locator("#source-cited").inputValue(),"capital");
 assert.ok((await page.getByTestId("source-record").allTextContents()).every(t=>t.includes("Financial instruments")));
 await page.locator("#source-query").fill("source-search-never-matches-xyz");
 assert.equal(await page.getByTestId("sources-count").innerText(),"0");
 await page.getByRole("button",{name:"Show all sources"}).click();
 await page.locator("#source-query").fill("5N+ Awarded");
 assert.ok(await page.locator('a[href="/sources/src-5n-germanium-2024"]').count()>0);
 await page.locator('a[href="/sources/src-5n-germanium-2024"]').first().focus();
 await page.keyboard.press("Enter");
 await page.waitForURL(/\/sources\/src-5n-germanium-2024$/);
 assert.equal(await page.locator("h1").innerText(),"Source dossier");
 const report=await (await fetch(origin+"/api/v1/coverage")).json();
 const orphanIds=report.sources.orphaned;
 assert.equal(report.sources.cited.of,report.totals.sources);
 assert.equal(report.sources.cited.count + orphanIds.length,report.totals.sources);
 const coverageLink=orphanIds.length?"/sources?citingKind=not_cited":"/sources";
 await page.goto(origin+"/coverage",{waitUntil:"networkidle"});
 assert.ok((await page.locator("main").innerText()).includes(
   report.sources.cited.count+" of "+report.sources.cited.of+" registered sources"));
 const link=page.locator('a[href="'+coverageLink+'"]').filter({hasText:
   orphanIds.length?"Inspect uncited registered sources":"Explore source citations"});
 assert.equal(await link.count(),1,"coverage links to the exact source filter");
 await link.focus();await page.keyboard.press("Enter");
 await page.waitForURL(url=>url.pathname==="/sources");
 if(orphanIds.length) await page.waitForFunction(expected =>
   document.querySelector("#source-cited")?.value === "not_cited" &&
   Number(document.querySelector("[data-testid=sources-count]")?.textContent?.trim()) === expected,
   orphanIds.length);
 const visible=Number(await page.getByTestId("sources-count").innerText());
 assert.equal(visible,orphanIds.length||report.totals.sources,
   "browser source directory must agree with the coverage API");
 if(orphanIds.length){
   assert.equal(await page.locator("#source-cited").inputValue(),"not_cited");
   assert.ok((await page.getByTestId("source-record").allTextContents())
     .every(t=>t.includes("0 directly citing published records")));
 }
 console.log("Source register: static HTML, citations, URL, keyboard and mobile/tablet/desktop passed.");
 await page.close();
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
