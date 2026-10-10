/**
 * F5-O3c: actual headless Chromium checks for the LOCAL, UNPUBLISHED HTML.
 *
 * This script is intentionally JS so production TypeScript need not import a
 * browser dependency. The isolated GitHub workflow installs a pinned Playwright
 * runtime without changing SMPT's normal lockfile or public build.
 *
 * No screenshots, HTML dumps, browser traces, artifacts, public routes,
 * remote navigation or human-review attestations are produced.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const outputDir=path.resolve(".project-execution-review");
const htmlPath=path.join(outputDir,"observatory-preview.html");
const planPath=path.join(outputDir,"observatory-qa-plan.json");
const viewportSizes=[
  {width:320,height:720},
  {width:768,height:1024},
  {width:1440,height:900},
];
const projectFragment="#f5-case-";
const sha256=(value)=>createHash("sha256").update(value).digest("hex");

/** WCAG 2.x contrast against nearest opaque CSS background. */
function contrastRatio(a,b){
  const linear=x=>{
    const y=x/255;
    return y<=0.04045?y/12.92:((y+0.055)/1.055)**2.4;
  };
  const lum=c=>0.2126*linear(c[0])+0.7152*linear(c[1])+0.0722*linear(c[2]);
  const [light,dark]=[lum(a),lum(b)].sort((x,y)=>y-x);
  return (light+0.05)/(dark+0.05);
}

async function main(){
  const [html,receiptRaw]=await Promise.all([readFile(htmlPath),readFile(planPath,"utf8")]);
  const receipt=JSON.parse(receiptRaw);
  assert.equal(receipt.schemaVersion,"f5-local-browser-qa-plan-1");
  assert.equal(receipt.artifactSha256,sha256(html),"exact generated local HTML is the only test target");
  assert.equal(receipt.publicReleaseAuthorized,false);
  assert.equal(receipt.browserQaCompleted,false);
  assert.equal(receipt.originalSourcesIndependentlyReviewed,false);
  assert.equal(receipt.releaseReceiptPresent,false);
  assert.deepEqual(receipt.viewports.map(x=>x.width),viewportSizes.map(x=>x.width));
  assert(receipt.viewports.every(x=>x.outcome==="not_run"));
  assert(receipt.manualChecks.every(x=>x.outcome==="not_run"));
  assert(!html.includes(Buffer.from("<script")),"standalone preview cannot run page scripts");

  let browser;
  try {
    browser=await chromium.launch({headless:true});
    for(const viewport of viewportSizes){
      const context=await browser.newContext({
        viewport,deviceScaleFactor:1,
        reducedMotion:"reduce",
        javaScriptEnabled:false,
      });
      const page=await context.newPage();
      const offFileRequests=[];
      page.on("request",request=>{
        if(!request.url().startsWith("file://")&&!request.url().startsWith("data:"))
          offFileRequests.push(request.url());
      });
      try {
        const response=await page.goto(pathToFileURL(htmlPath).href,{waitUntil:"load"});
        assert.equal(response?.status()??200,200,"local file preview must load");
        assert.equal(await page.locator('[data-f5-private-review="true"]').count(),1);
        assert.equal(await page.getByRole("heading",{name:"Industrial Outcome Observatory",exact:true}).count(),1);
        assert.equal(await page.locator("article[id^='f5-case-']").count(),4);
        assert.equal(await page.getByRole("heading",{name:"Publication gate: CLOSED"}).count(),1);
        assert.equal(await page.getByRole("rowheader").count(),4);
        assert.equal(await page.getByRole("columnheader").count(),7);
        assert.equal(await page.locator("script").count(),0);
        assert.deepEqual(offFileRequests,[],"preview may not request fonts, scripts, images or other remote assets");

        const dimensions=await page.evaluate(()=>({
          documentWidth:document.documentElement.scrollWidth,
          bodyWidth:document.body.scrollWidth,
          viewportWidth:window.innerWidth,
        }));
        assert(dimensions.documentWidth<=dimensions.viewportWidth+1,
          viewport.width+"px: unexpected DOCUMENT overflow");
        assert(dimensions.bodyWidth<=dimensions.viewportWidth+1,
          viewport.width+"px: unexpected BODY overflow");

        const matrix=page.getByRole("region",{
          name:"Horizontally scrollable project-evidence coverage comparison",
        });
        assert.equal(await matrix.count(),1);
        assert.equal(await matrix.getAttribute("tabindex"),"0");
        const table=matrix.getByRole("table");
        assert.equal(await table.count(),1);
        const scroll=await matrix.evaluate(el=>({
          clientWidth:el.clientWidth, scrollWidth:el.scrollWidth,
        }));
        if(viewport.width<=768){
          assert(scroll.scrollWidth>scroll.clientWidth+5,
            viewport.width+"px: comparison must be scrollable within its region");
          await matrix.focus();
          assert.equal(await matrix.evaluate(el=>document.activeElement===el),true);
          await page.keyboard.press("ArrowRight");
          await page.waitForTimeout(180);
          const left=await matrix.evaluate(el=>el.scrollLeft);
          assert(left>0,viewport.width+"px: keyboard Right must scroll the comparison region");
          await page.keyboard.press("Tab");
          const next=await page.evaluate(()=>document.activeElement?.getAttribute("href"));
          assert(next?.startsWith(projectFragment),
            viewport.width+"px: keyboard Tab from table region must reach a project anchor");
        }

        const report=await page.evaluate(()=>{
          const matches=["h1","header p.text-muted","article .rail","article h2",
            "article section h3","a.text-accent"];
          const asRgb=value=>{
            const found=value.match(/^rgba?\\(\\s*([\\d.]+)[,\\s]+([\\d.]+)[,\\s]+([\\d.]+)/i);
            return found?[Number(found[1]),Number(found[2]),Number(found[3])]:null;
          };
          const background=element=>{
            let current=element;
            while(current){
              const css=getComputedStyle(current).backgroundColor;
              const rgb=asRgb(css);
              if(rgb&&!css.includes("0)"))return rgb;
              current=current.parentElement;
            }
            return null;
          };
          return matches.map(selector=>{
            const el=document.querySelector(selector);
            if(!el)return {selector,absent:true};
            const computed=getComputedStyle(el);
            return {selector,color:asRgb(computed.color),background:background(el),
              fontSize:computed.fontSize,display:computed.display,
              boxWidth:el.getBoundingClientRect().width};
          });
        });
        for(const sample of report){
          assert(!sample.absent,viewport.width+"px: missing contrast sample "+sample.selector);
          assert(sample.color&&sample.background,viewport.width+"px: unparseable colors "+sample.selector);
          const ratio=contrastRatio(sample.color,sample.background);
          assert(ratio>=4.5,
            viewport.width+"px: foreground/background under 4.5:1 for "+sample.selector);
          assert(sample.boxWidth>0,"contrast target must be displayed");
        }

        const headings=await page.locator("h1,h2,h3").evaluateAll(elements=>
          elements.map(el=>({level:Number(el.tagName.slice(1)),text:el.textContent?.trim()??""})));
        assert.equal(headings.filter(h=>h.level===1).length,1);
        for(let i=1;i<headings.length;i++){
          assert(headings[i].level<=headings[i-1].level+1,
            viewport.width+"px: heading hierarchy skips a level");
        }
        assert(headings.every(h=>h.text.length>0),"all headings need visible text");

        const sources=await page.locator("a[target='_blank']").evaluateAll(anchors=>
          anchors.map(el=>({url:el.getAttribute("href"),rel:el.getAttribute("rel")})));
        assert(sources.length>0,"source URLs must be discoverable");
        assert(sources.every(s=>/^https?:\\/\\//.test(s.url??"")));
        assert(sources.every(s=>s.rel?.split(/\\s+/).includes("noopener") &&
          s.rel?.split(/\\s+/).includes("noreferrer")));

        // The real seed does NOT have approved physical claims. This is a
        // typed absence of source-review evidence, never a claim of stalled work.
        assert.equal(await page.locator("article").filter({
          hasText:"No reviewed occurred physical milestone is registered.",
        }).count(),4);
        assert.equal(await page.getByText("No reviewed occurred claim registered").count(),4);
        assert.equal(await page.getByText(/No source-reviewed occurred physical milestone has entered/).count(),4);

        process.stdout.write(
          "O3c Chromium "+viewport.width+"x"+viewport.height+
          ": PASS layout, comparison, keyboard, source links, contrast, review gate\\n"
        );
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
  }
  // The HTML fingerprint and unsigned plan remain unchanged. Human checks
  // stay NOT_RUN until a genuine manual browser/source review is recorded.
  const latest=JSON.parse(await readFile(planPath,"utf8"));
  assert.deepEqual(latest,receipt);
  assert.equal(sha256(await readFile(htmlPath)),receipt.artifactSha256);
  process.stdout.write("O3c automated Chromium smoke: PASS; manual browser/source review NOT PERFORMED\\n");
}
main().catch(error=>{
  // Avoid printing HTML, original source content, sensitive local paths or
  // Playwright traces in public CI logs.
  process.stderr.write("O3c Chromium smoke failed: "+
    (error instanceof Error?error.message:String(error))+"\\n");
  process.exitCode=1;
});
