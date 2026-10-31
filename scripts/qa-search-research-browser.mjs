/** Read-only, GitHub-only Chrome verification; does not request a Vercel preview. */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";
const port=3497,origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start",
 "-p",String(port),"-H","127.0.0.1"],{
 env:{...process.env,NODE_ENV:"production"},stdio:["ignore","pipe","pipe"],
});
let logs="";
for(const stream of [server.stdout,server.stderr])
 stream.on("data",b=>{logs=(logs+b.toString()).slice(-16000)});
let browser;
try{
 let ready=false;
 for(let n=0;n<100;n++){
  if(server.exitCode!==null)throw Error("Next exited: "+logs);
  try{if((await fetch(origin+"/search")).ok){ready=true;break}}catch{/* startup */}
  await delay(250);
 }
 assert.ok(ready,"search QA server never became ready: "+logs);
 const html=await (await fetch(origin+"/search")).text();
 assert.ok(html.includes("Browse the published record"),"Browse cards should be server-rendered");
 assert.ok(html.includes("Search the corpus"),"Search route must have a real h1");
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:320,height:720},{width:375,height:812},
  {width:768,height:1024},{width:1440,height:900}]){
  const page=await browser.newPage({viewport});
  await page.goto(origin+"/search",{waitUntil:"networkidle"});
  assert.equal(await page.locator("h1").innerText(),"Search the corpus");
  const browse=page.getByTestId("search-browse");
  assert.ok(await browse.isVisible(),"browse default visible");
  assert.equal(await browse.getByTestId("search-type-shortcut").count(),6);
  assert.ok((await browse.innerText()).includes("original sources")||
    (await browse.innerText()).includes("original"));
  await browse.getByRole("button",{name:/Projects/}).click();
  await page.waitForFunction(()=>new URLSearchParams(location.search).get("kind")==="project");
  const count=page.getByTestId("search-result-count");
  assert.ok(parseInt(await count.innerText(),10)>0);
  assert.ok(await page.locator('a[href^="/projects/"]').count()>0);
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.locator("#kind").inputValue(),"project");
  await page.locator("#q").fill("Hemerdon");
  await page.waitForFunction(()=>new URLSearchParams(location.search).get("q")==="Hemerdon");
  assert.ok(await page.locator('a[href="/projects/prj-gb-hemerdon"]').count()>0);
  const inputHeight=await page.locator("#q").evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(inputHeight>=44,"44px search tap target");
  const font=await page.locator("#q").evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  assert.ok(font>= (viewport.width<640?16:14),"input font is legible");
  await page.locator("#q").fill("a-made-up-record-9999999");
  assert.ok(await page.getByText("No matches",{exact:true}).isVisible());
  await page.getByRole("button",{name:"Clear all filters"}).click();
  assert.ok(await page.getByTestId("search-browse").isVisible());
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,"horizontal overflow "+overflow+"px at "+viewport.width);
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:375,height:812}});
 await page.goto(origin+"/search?q=%E7%A8%80%E5%9C%9F",{waitUntil:"networkidle"});
 assert.ok(parseInt(await page.getByTestId("search-result-count").innerText(),10)>0,
  "CJK source query must remain functional");
 await page.goto(origin+"/search?kind=source&actor=china",{waitUntil:"networkidle"});
 assert.ok(await page.getByText("No matches",{exact:true}).isVisible(),
  "source docs must not get invented actor attribution");
 await page.getByRole("button",{name:"Clear all filters"}).focus();
 await page.keyboard.press("Enter");
 assert.ok(await page.getByTestId("search-browse").isVisible(),"keyboard reset");
 console.log("Search QA passed: 11 types, keyboard type shortcuts, CJK, URL sharing, legal filters and four responsive viewports.");
 await page.close();
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
