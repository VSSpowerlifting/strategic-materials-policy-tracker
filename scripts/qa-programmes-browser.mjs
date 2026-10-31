/** Responsive public /programmes reader QA; no private reviewer or F5 material. */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";
const port=3489,origin="http://127.0.0.1:"+port;
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
  try{if((await fetch(origin+"/programmes")).ok){ready=true;break}}catch{/* starting */}
  await delay(250);
 }
 assert.ok(ready,"Programme explorer server failed to start: "+logs);
 const html=await (await fetch(origin+"/programmes")).text();
 assert.ok(html.includes("prg-ca-cmrdd"),"all programmes must be prerendered");
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:375,height:812},{width:768,height:1024},{width:1440,height:900}]){
  const page=await browser.newPage({viewport});
  await page.goto(origin+"/programmes",{waitUntil:"networkidle"});
  assert.equal(await page.locator("h1").innerText(),"Programmes");
  const total=await page.getByTestId("programme-record").count();
  assert.equal(total,12);
  assert.equal(await page.getByTestId("programme-result-count").innerText(),"12");
  await page.locator("#programmes-kind").selectOption("tax_incentive");
  await page.waitForFunction(()=>new URLSearchParams(location.search).get("kind")==="tax_incentive");
  assert.equal(await page.getByTestId("programme-record").count(),1);
  assert.ok(await page.locator('a[href="/programmes/prg-au-cmpti"]').count()>0);
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.locator("#programmes-kind").inputValue(),"tax_incentive");
  assert.equal(await page.getByTestId("programme-record").count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,
   "horizontal overflow at "+viewport.width);
  await page.getByRole("button",{name:"Clear filters"}).click();
  assert.equal(await page.getByTestId("programme-record").count(),total);
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1360,height:900}});
 await page.goto(origin+"/programmes?evidence=designation",{waitUntil:"networkidle"});
 assert.equal(await page.locator("#programmes-evidence").inputValue(),"designation");
 const count=await page.getByTestId("programme-record").count();
 assert.ok(count>0&&count<12);
 assert.ok((await page.getByTestId("programme-record").allTextContents())
  .every(text=>/\d+ designation/.test(text)));
 await page.locator("#programmes-query").fill("no-such-programme-in-world-1999");
 assert.equal(await page.getByTestId("programme-result-count").innerText(),"0");
 await page.getByRole("button",{name:"Show all programmes"}).click();
 await page.locator("#programmes-query").fill("CMRDD");
 assert.ok(await page.locator('a[href="/programmes/prg-ca-cmrdd"]').count()>0);
 await page.locator('a[href="/programmes/prg-ca-cmrdd"]').first().focus();
 await page.keyboard.press("Enter");
 await page.waitForURL(/\/programmes\/prg-ca-cmrdd$/);
 assert.ok((await page.locator("h1").innerText()).includes("Critical Minerals Research"));
 console.log("Programme explorer: 12 static entries, honest scheme roles, shareable filters, keyboard detail navigation, mobile/tablet/desktop succeeded.");
 await page.close();
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
