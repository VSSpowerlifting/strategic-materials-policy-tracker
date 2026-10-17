/** Real-browser QA for public programme→finance→organization/project/source trails. */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";
const port=3492,origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p",String(port),"-H","127.0.0.1"],{
 env:{...process.env,NODE_ENV:"production"},stdio:["ignore","pipe","pipe"],
});
let logs="";
for(const stream of [server.stdout,server.stderr])
 stream.on("data",b=>{logs=(logs+b.toString()).slice(-14000)});
let browser;
try{
 let ready=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw new Error("Next exited: "+logs);
  try{if((await fetch(origin+"/programmes/prg-ca-cms")).ok){ready=true;break}}catch{/* starting */}
  await delay(250);
 }
 assert.ok(ready,"Programme evidence browser server not ready: "+logs);
 const staticHtml=await (await fetch(origin+"/programmes/prg-ca-cms")).text();
 assert.ok(staticHtml.includes("research-pathway"),"Source trails must be in static HTML");
 assert.ok(staticHtml.includes("fin-ca-cmrdd-2024-cyclic-materials"),"Parent programme must show child financial rows");
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:375,height:812},{width:768,height:1024},{width:1440,height:900}]){
  const page=await browser.newPage({viewport});
  await page.goto(origin+"/programmes",{waitUntil:"networkidle"});
  const start=page.locator('a[href="/programmes/prg-ca-cms#research-pathway"]').first();
  assert.ok(await start.count()>0);
  await start.click();
  await page.waitForURL(/\/programmes\/prg-ca-cms#research-pathway$/);
  assert.equal(await page.getByTestId("programme-finance-path").count(),7);
  assert.ok((await page.getByTestId("programme-research-pathway").innerText()).includes("identical record, not additional funding"));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  assert.equal(overflow,false,"horizontal overflow at "+viewport.width);
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1360,height:900}});
 await page.goto(origin+"/programmes/prg-eu-crma-strategic-projects",{waitUntil:"networkidle"});
 assert.equal(await page.getByTestId("programme-finance-path").count(),0);
 assert.ok(await page.getByTestId("programme-designation-path").count()>20);
 const d=page.getByTestId("programme-designation-path").first();
 assert.ok(await d.locator('a[href^="/projects/"]').count()>0);
 await d.locator("summary").click();
 const sourceLink=d.locator('a[href^="/sources/"]').first();
 assert.ok(await sourceLink.count()>0);
 await sourceLink.focus();
 await page.keyboard.press("Enter");
 await page.waitForURL(/\/sources\/src-/);
 assert.equal(await page.locator("h1").innerText(),"Source dossier");
 await page.goto(origin+"/programmes/prg-ca-cmrdd",{waitUntil:"networkidle"});
 const finance=page.getByTestId("programme-finance-path").first();
 assert.ok(await finance.locator('a[href^="/organizations/"]').count()>0);
 assert.ok(await finance.locator('a[href^="/capital/"]').count()>0);
 const instrument=finance.locator('a[href^="/capital/"]').first();
 await instrument.focus();
 await page.keyboard.press("Enter");
 await page.waitForURL(/\/capital\/fin-/);
 assert.ok(await page.locator("h1").count()>0);
 console.log("Programme evidence trail: static HTML, parent-child rows, designation-only paths, sources, recipients, instruments, keyboard and three viewports passed.");
 await page.close();
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
