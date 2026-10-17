/**
 * Browser QA for public /projects filtering, deep links, keyboard access and
 * mobile layout. No private F5/M3 data and no uploaded screenshot/traces.
 */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";
const port=3481, base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p",String(port),"-H","127.0.0.1"],{
  env:{...process.env,NODE_ENV:"production"},stdio:["ignore","pipe","pipe"],
});
let logs="";
for(const stream of [server.stdout,server.stderr]) stream.on("data",b=>{logs=(logs+b.toString()).slice(-12000)});
let browser;
try{
  let ready=false;
  for(let i=0;i<100;i++){
    if(server.exitCode!==null)throw new Error("Next exited: "+logs);
    try{if((await fetch(base+"/projects")).ok){ready=true;break}}catch{/* starting */}
    await delay(250);
  }
  assert.ok(ready,"project explorer server failed to start: "+logs);
  browser=await chromium.launch({headless:true});
  for(const viewport of [{width:375,height:812},{width:768,height:1024},{width:1440,height:900}]){
    const page=await browser.newPage({viewport});
    await page.goto(base+"/projects",{waitUntil:"networkidle"});
    assert.equal(await page.locator("h1").innerText(),"Projects");
    assert.equal(await page.getByTestId("project-record").count(),76);
    assert.equal(await page.getByTestId("project-result-count").innerText(),"76");
    await page.locator("#projects-material").selectOption("gallium");
    await page.waitForFunction(()=>new URLSearchParams(location.search).get("material")==="gallium");
    assert.ok(await page.getByTestId("project-record").count()>0);
    assert.ok(await page.getByTestId("project-record").count()<76);
    assert.ok(await page.locator('a[href="/projects/prj-au-alcoa-sojitz-gallium"]').count()>0);
    await page.reload({waitUntil:"networkidle"});
    assert.equal(await page.locator("#projects-material").inputValue(),"gallium");
    assert.ok(await page.locator('a[href="/projects/prj-au-alcoa-sojitz-gallium"]').count()>0);
    const overflowing=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
    assert.equal(overflowing,false,"horizontal overflow at "+viewport.width);
    await page.getByRole("button",{name:"Clear filters"}).click();
    assert.equal(await page.getByTestId("project-record").count(),76);
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:1360,height:900}});
  await page.goto(base+"/projects?relationship=shared",{waitUntil:"networkidle"});
  assert.equal(await page.locator("#projects-relationship").inputValue(),"shared");
  const items=page.getByTestId("project-record");
  assert.ok(await items.count()>0);
  assert.ok((await items.allTextContents()).every(s=>s.includes("shared/unallocated")));
  await page.locator("#projects-search").fill("token-never-in-corpus-2026");
  assert.equal(await page.getByTestId("project-result-count").innerText(),"0");
  await page.getByRole("button",{name:"Show all projects"}).click();
  assert.equal(await page.getByTestId("project-record").count(),76);
  await page.locator("#projects-search").fill("Alcoa-Sojitz");
  assert.ok(await page.locator('a[href="/projects/prj-au-alcoa-sojitz-gallium"]').count()>0);
  await page.locator('a[href="/projects/prj-au-alcoa-sojitz-gallium"]').first().focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/projects\/prj-au-alcoa-sojitz-gallium$/);
  assert.ok((await page.locator("h1").innerText()).includes("Alcoa-Sojitz"));
  // Test actual Next.js prerendered HTTP, not merely imported route handlers.
  // Public source-reviewed milestones must reconcile with the full JSON export.
  const registerResponse=await page.request.get(base+"/api/v1/project-milestones");
  assert.equal(registerResponse.status(),200);
  const register=await registerResponse.json();
  assert.deepEqual(register.map(x=>x.id),["mil-au-alcoa-wagerup-groundbreaking-2026-08-24"]);
  assert.equal(register[0].kind,"groundbreaking_reported");
  assert.equal(register[0].reviewedAt,"2026-10-17");
  const detailResponse=await page.request.get(base+"/api/v1/projects/prj-au-alcoa-sojitz-gallium");
  assert.equal(detailResponse.status(),200);
  const detail=await detailResponse.json();
  assert.deepEqual(detail.reviewedProjectMilestones,register);
  assert.deepEqual(detail.reviewedMilestoneSources.map(x=>x.id),["src-alcoa-wagerup-groundbreaking-2026"]);
  assert.ok("latestImplementation" in detail);
  assert.ok(Array.isArray(detail.layers));
  const datasetResponse=await page.request.get(base+"/api/export/dataset.json");
  assert.equal(datasetResponse.status(),200);
  const dataset=await datasetResponse.json();
  assert.equal(dataset.counts.projectMilestones,1);
  assert.deepEqual(dataset.projectMilestones,register);
  const unsignedResponse=await page.request.get(base+"/api/v1/projects/prj-ca-cyclic-kingston-demonstration-plant");
  assert.equal(unsignedResponse.status(),200);
  assert.deepEqual((await unsignedResponse.json()).reviewedProjectMilestones,[]);
  console.log("Reviewed industrial milestone: prerendered register, project API and full dataset export agree; unsigned peers omitted.");
  console.log("Project directory: static cohort, URL filters, shared finance, keyboard navigation, mobile/tablet/desktop passed.");
  await page.close();
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
