/**
 * Public /organizations browser QA. Tests full pre-rendered data, deep links,
 * text/role filters, keyboard, and responsive widths without private artifacts.
 */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";
const port=3487,origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,[
 "node_modules/next/dist/bin/next","start","-p",String(port),"-H","127.0.0.1",
],{env:{...process.env,NODE_ENV:"production"},stdio:["ignore","pipe","pipe"]});
let logs="";
for(const stream of [server.stdout,server.stderr])
 stream.on("data",b=>{logs=(logs+b.toString()).slice(-14000)});
let browser;
try{
 let ready=false;
 for(let n=0;n<100;n++){
  if(server.exitCode!==null)throw new Error("Next server stopped: "+logs);
  try{if((await fetch(origin+"/organizations")).ok){ready=true;break}}catch{/* server startup */}
  await delay(250);
 }
 assert.ok(ready,"organization explorer server failed to start: "+logs);
 const html=await (await fetch(origin+"/organizations")).text();
 assert.ok(html.includes("org-jare"),"first render must contain entire searchable organization register");
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:375,height:812},{width:768,height:1024},{width:1440,height:900}]){
  const page=await browser.newPage({viewport});
  await page.goto(origin+"/organizations",{waitUntil:"networkidle"});
  assert.equal(await page.locator("h1").innerText(),"Organizations");
  const total=await page.getByTestId("organization-record").count();
  assert.equal(total,99);
  assert.equal(await page.getByTestId("organization-result-count").innerText(),"99");
  await page.locator("#organizations-kind").selectOption("joint_vehicle");
  await page.waitForFunction(()=>new URLSearchParams(location.search).get("kind")==="joint_vehicle");
  assert.equal(await page.getByTestId("organization-record").count(),1);
  assert.ok(await page.locator('a[href="/organizations/org-jare"]').count()>0);
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.locator("#organizations-kind").inputValue(),"joint_vehicle");
  assert.equal(await page.getByTestId("organization-record").count(),1);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  assert.equal(overflow,false,"horizontal overflow at "+viewport.width);
  await page.getByRole("button",{name:"Clear filters"}).click();
  assert.equal(await page.getByTestId("organization-record").count(),total);
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1360,height:900}});
 await page.goto(origin+"/organizations?role=sponsor",{waitUntil:"networkidle"});
 assert.equal(await page.locator("#organizations-role").inputValue(),"sponsor");
 const results=await page.getByTestId("organization-record").count();
 assert.ok(results>0&&results<99);
 assert.ok((await page.getByTestId("organization-record").allTextContents())
   .every(s=>s.includes("sponsored project")));
 await page.locator("#organizations-query").fill("no-such-company-ever-9911");
 assert.equal(await page.getByTestId("organization-result-count").innerText(),"0");
 await page.getByRole("button",{name:"Show all organizations"}).click();
 await page.locator("#organizations-query").fill("5N+");
 assert.ok(await page.locator('a[href="/organizations/org-5n-plus"]').count()>0);
 await page.locator('a[href="/organizations/org-5n-plus"]').first().focus();
 await page.keyboard.press("Enter");
 await page.waitForURL(/\/organizations\/org-5n-plus$/);
 assert.ok((await page.locator("h1").innerText()).includes("5N Plus"));
 console.log("Organization explorer: 99 prerendered records, source-defined roles, shareable filters, keyboard detail links and mobile/tablet/desktop passed.");
 await page.close();
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
