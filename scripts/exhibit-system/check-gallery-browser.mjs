import assert from 'node:assert/strict';
// Optional browser acceptance check. Install Playwright separately, or set
// EXHIBITS_PLAYWRIGHT_MODULE to its absolute module path. No site dependency.
const { chromium }=await import(process.env.EXHIBITS_PLAYWRIGHT_MODULE || 'playwright');
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
(async()=>{
 const server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.resolve(__dirname,'../../docs/design/presentations/exhibit-system')]);
 const [ready]=await once(server.stdout,'data');
 const port=/port (\d+)/.exec(String(ready))?.[1];
 if(!port) {server.kill();throw new Error('gallery server did not report its port: '+ready);}
 const base='http://127.0.0.1:'+port;
 let browser;
 try {
 browser=await chromium.launch({headless:true,...(process.env.EXHIBITS_BROWSER_CHANNEL ? {channel:process.env.EXHIBITS_BROWSER_CHANNEL} : {})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/gallery/index.html');
 await page.waitForSelector('#controls:visible');
 const total=await page.locator('.pattern').count();
 assert.ok(total>0);
 assert.equal(await page.locator('.pattern:visible').count(),total);

 await page.locator('#search').fill('dumbbell');
 assert.equal(await page.locator('#dumbbell').isVisible(),true);
 assert.ok(await page.locator('.pattern:visible').count() < total);
 await page.locator('#reset').click();await page.locator('#family').selectOption('J');
 assert.ok(await page.locator('.pattern:visible').count()>0);
 await page.locator('#tier').selectOption('native-chart');
 assert.equal(await page.locator('.pattern:visible').count(),0);
 assert.equal(await page.locator('#empty').isVisible(),true);
 await page.locator('#reset').click();
 await page.locator('[data-compare="dumbbell"]').check();await page.locator('[data-compare="slope"]').check();
 assert.equal(await page.locator('[data-compare="ranked-bar"]').isDisabled(),true);
 await page.locator('#compare').click();
 assert.equal(await page.locator('dialog[open] #preview-contents > section').count(),2);

 await page.keyboard.press('Escape');
 assert.equal(await page.locator('dialog').isVisible(),false);
 assert.equal(await page.locator('#compare').evaluate(e=>e===document.activeElement),true);
 await page.locator('#clear-comparison').click();
 assert.equal(await page.locator('[data-compare="ranked-bar"]').isDisabled(),false);
 await page.locator('#dumbbell .preview').click();
 assert.equal(await page.locator('dialog[open] img').count(),1);
 await page.locator('#close-preview').click();
 await page.locator('#search').fill('nonexistentzzz');assert.equal(await page.locator('.pattern:visible').count(),0);
 await page.reload();assert.equal(await page.locator('#search').inputValue(),'nonexistentzzz');
 await page.locator('#reset').click();
 for(const img of await page.locator('.preview img').all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate(i=>i.decode()); }
 for(const width of [375,768,1440]) {
  await page.setViewportSize({width,height:950});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'page overflow '+width);
 }
 await page.setViewportSize({width:375,height:900});await page.goto(base+'/gallery/index.html');

 await page.locator('[data-compare="ranked-bar"]').check();await page.locator('[data-compare="ranked-dot"]').check();await page.locator('#compare').click();
 assert.equal(await page.locator('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true,'dialog overflow');
 assert.equal(errors.length,0,errors.join('\n'));
 for(const file of ['exhibit-gallery.pptx','demo-deck.pptx']) {
  const response=await page.request.get(base+'/'+file);assert.equal(response.status(),200);assert.equal((await response.body()).subarray(0,2).toString(),'PK');
 }
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base+'/gallery/index.html');assert.equal(await nojs.locator('.pattern:visible').count(),total);
 console.log('PASS: search, filters, empty state, URL persistence, selection limit/reset, previews, comparison, Escape/focus return, PNG/deck links, 375/768/1440 overflow, no-JS fallback; zero browser errors');
 } finally { await browser?.close();server.kill(); }
})().catch(e=>{console.error(e);process.exit(1)});
