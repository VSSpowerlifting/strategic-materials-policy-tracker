/**
 * Real-browser readability regression at mobile, 200%-equivalent narrow CSS
 * viewport, tablet and desktop. Uses published pages and no private data.
 */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";

const port=3498,origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,[
 "node_modules/next/dist/bin/next","start","-p",String(port),"-H","127.0.0.1",
],{env:{...process.env,NODE_ENV:"production"},stdio:["ignore","pipe","pipe"]});
let logs="";
for(const stream of [server.stdout,server.stderr])stream.on("data",b=>{
 logs=(logs+b.toString()).slice(-16000);
});
let browser;
const size=async(locator)=>parseFloat(await locator.evaluate(el=>getComputedStyle(el).fontSize));
try{
 let ready=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw Error("Next server exited: "+logs);
  try{if((await fetch(origin+"/sources/src-5n-germanium-2024")).ok){ready=true;break}}catch{/*starting*/}
  await delay(250);
 }
 assert.ok(ready,"Legibility QA server failed: "+logs);
 browser=await chromium.launch({headless:true});
 for(const viewport of [
  {width:320,height:720},{width:375,height:812},
  {width:768,height:1024},{width:1440,height:900},
 ]){
  const page=await browser.newPage({viewport});
  await page.goto(origin+"/capital/fin-au-cmpti-2025-production-tax-offset",{waitUntil:"networkidle"});
  const firstSection=page.locator("main section h2").first();
  assert.ok(await firstSection.count()>0,"record section must have heading");
  assert.ok(await size(firstSection)>=20,"section heading must be >=20px at "+viewport.width);
  const evidence=page.getByTestId("evidence-mobile-card");
  const evidenceTable=page.locator('table:has(caption:has-text("Original sources"))');
  assert.ok(await evidence.count()>0,"physical evidence entries must be present");
  if(viewport.width<640){
   assert.ok(await evidence.first().isVisible(),"narrow view shows readable citation cards");
   assert.ok(!(await evidenceTable.first().isVisible()),"table hidden on phone");
   assert.ok(await evidence.first().getByText("Fields supported").isVisible());
   assert.ok(await evidence.first().getByText("Location in document").isVisible());
   assert.ok(await evidence.first().getByRole("link",{name:"View source dossier"}).isVisible());
  }else{
   assert.ok(!(await evidence.first().isVisible()),"duplicate mobile cards visually hidden on desktop");
   assert.ok(await evidenceTable.first().isVisible(),"semantic evidence table visible on desktop");
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,"record overflows at "+viewport.width+" by "+overflow+"px");
  await page.goto(origin+"/sources/src-5n-germanium-2024",{waitUntil:"networkidle"});
  assert.ok(await page.getByRole("link",{name:/Open original document/}).count()>0);
  assert.ok(await page.getByText("b2024-04-18_dod_award", {exact:false}).count()>0,
   "full source URL must remain inspectable");
  const sourceOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(sourceOverflow<=3,"source dossier overflows at "+viewport.width+" by "+sourceOverflow+"px");
  await page.goto(origin+"/projects",{waitUntil:"networkidle"});
  const select=page.locator("#projects-material");
  assert.ok(await select.count()>0);
  const height=await select.evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(height>=44,"filter select hit target should be 44px minimum");
  const font=await size(select);
  assert.ok(font>= (viewport.width<640?16:14),"filter text size readable at "+viewport.width);
  await select.focus();
  const outline=await select.evaluate(el=>getComputedStyle(el).outlineStyle);
  assert.notEqual(outline,"none","keyboard focus must be visible");
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:375,height:812}});
 await page.goto(origin+"/capital/fin-au-cmpti-2025-production-tax-offset",{waitUntil:"networkidle"});
 const a=page.getByTestId("evidence-mobile-card").first().getByRole("link",{name:"View source dossier"});
 await a.focus();
 await page.keyboard.press("Enter");
 await page.waitForURL(/\/sources\/src-/);
 assert.equal(await page.locator("h1").innerText(),"Source dossier");
 console.log("Legibility: 320, 375, 768 and 1440px, section headings, source links, mobile citation cards, semantic tables, filters, keyboard, no overflow passed.");
 await page.close();
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
