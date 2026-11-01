/** Exact-head public conceptual legibility QA, no private M3/F5 data. */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";
const port=3499,origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,[
 "node_modules/next/dist/bin/next","start","-p",String(port),"-H","127.0.0.1",
],{env:{...process.env,NODE_ENV:"production"},stdio:["ignore","pipe","pipe"]});
let logs="";
for(const stream of [server.stdout,server.stderr])
 stream.on("data",b=>{logs=(logs+b.toString()).slice(-14000)});
let browser;
try{
 let ready=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw new Error("Next server exited: "+logs);
  try{if((await fetch(origin+"/capital/fin-us-dod-mp-2025-additional-preferred-option")).ok){ready=true;break}}catch{/* starting */}
  await delay(250);
 }
 assert.ok(ready,"Reading guide server not ready: "+logs);
 const html=await (await fetch(origin+"/capital/fin-us-dod-mp-2025-additional-preferred-option")).text();
 assert.ok(html.includes("What the evidence says"),"record explanation must be in server-rendered HTML");
 browser=await chromium.launch({headless:true});
 const cases=[
  {id:"fin-us-dod-mp-2025-additional-preferred-option",needle:"For an option"},
  {id:"fin-jp-jare-lynas-2023-equity",needle:"shared and unallocated"},
  {id:"fin-ca-g7-2025-nmg-edc-letter-of-interest",needle:"Non-binding indication"},
 ];
 for(const viewport of [{width:375,height:812},{width:768,height:1024},{width:1440,height:900}]){
  const page=await browser.newPage({viewport});
  for(const c of cases){
   await page.goto(origin+"/capital/"+c.id,{waitUntil:"networkidle"});
   const guide=page.getByTestId("financial-reading-guide");
   assert.ok(await guide.isVisible(),"reading guide visible for "+c.id);
   assert.ok((await guide.innerText()).includes(c.needle),"expected evidence vocabulary for "+c.id);
   assert.ok((await guide.innerText()).includes("not independently verifies")===false,
    "no doubled-negative text");
   assert.ok((await guide.innerText()).includes("What has happened legally?"));
   assert.ok((await guide.innerText()).includes("Has money been paid?"));
   assert.ok((await guide.innerText()).includes("What does it link to?"));
   assert.ok(await guide.getByRole("link",{name:/counting and evidence rules/i}).count()>0);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);
   assert.equal(overflow,false,"horizontal overflow at "+viewport.width+" in "+c.id);
  }
  await page.goto(origin+"/capital",{waitUntil:"networkidle"});
  const gloss=page.getByTestId("reading-key-capital");
  assert.ok(await gloss.count()>0);
  await gloss.locator("summary").focus();
  await page.keyboard.press("Enter");
  assert.ok(await gloss.locator("dd").first().isVisible(),"keyboard glossary disclosure works");
  assert.ok(await gloss.getByText("Obligation is not an SMPT financial-status label.",{exact:false}).isVisible());
  await page.goto(origin+"/projects",{waitUntil:"networkidle"});
  await page.getByTestId("reading-key-projects").locator("summary").click();
  assert.ok(await page.getByText("Shared, unallocated association",{exact:true}).isVisible());
  await page.goto(origin+"/programmes",{waitUntil:"networkidle"});
  await page.getByTestId("reading-key-programmes").locator("summary").click();
  assert.ok(await page.getByText("Parent and child schemes",{exact:true}).isVisible());
  await page.close();
 }
 const page=await browser.newPage();
 await page.goto(origin+"/capital/fin-jp-jare-lynas-2023-equity",{waitUntil:"networkidle"});
 await page.getByTestId("financial-reading-guide").getByRole("link",{name:/counting and evidence rules/i}).focus();
 await page.keyboard.press("Enter");
 await page.waitForURL(/\/methodology#capital-counting$/);
 assert.ok(await page.locator("#capital-counting").count()>0);
 await page.close();
 console.log("Conceptual reading QA: 3 distinct finance states, shared allocation caveats, original methodology, three viewports, keyboard glossary and deep links passed.");
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
