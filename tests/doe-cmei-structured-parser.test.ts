import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {
  compareDoeOfficialHeader, parseDoeStructuredArticleHeader,
  parseDoeStructuredListing, validateDoePagination, type DoeCmeiRow,
} from "@/scripts/doe-cmei-structured-parser";

const base="https://www.energy.gov/collection/view?page=0&paragraph=822121";
const older="https://www.energy.gov/collection/view?page=1&paragraph=822121";
const sampleTitle="DOE’s Office of Critical Minerals and Energy Innovation Announces $29.5 Million for National Laboratory Mining Projects";
const sampleUrl="https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national";
function row(id:number,day:string="September 30, 2026",office="Office of Critical Minerals and Energy Innovation"):string {
 const href=id===0?"/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national":
   id===1?"/articles/some-broader-doe-official-link":
   "/cmei/articles/verified-publication-"+id;
 const label=id===0?sampleTitle:"DOE CMEI announces another official program number "+id;
 return '<li class="collection-item">' +
   '<div class="collection-item--type-press-release collection-item-wrapper">' +
   '<div class="collection-item__title-and-type title-sm">' +
   '<div class="collection-item__title title-sm">' +
   '<a class="collection-item__link" href="'+href+'">'+label+'</a></div>'+
   '<div class="collection-item__icon_type"><div class="field field-icon">' +
   '<div class="nested"><i class="fa-solid fa-newspaper"></i></div></div>Press Release</div>' +
   '</div><div class="collection-item__date p2">'+day+'</div>'+
   '<div class="collection-item__office"><span>'+office+'</span></div>' +
   '</div></li>';
}
function listing(ids:number[], date="September 30, 2026", noise=""):string {
 return '<html><body><header><a href="/articles/global-unrelated-political-story">'+
  'DOE sitewide headline unrelated to news feed</a></header><main>'+
  '<h1>Latest News</h1><ul class="collection collection--page js-view-dom-id-123">'+
  ids.map(i=>row(i,date)).join("")+'</ul></main><footer>'+noise+'</footer></body></html>';
}
const page0=Array.from({length:10},(_,i)=>i);
const page1=Array.from({length:10},(_,i)=>i+10);
function article(displayDate="September 30, 2026",office="Office of Critical Minerals and Energy Innovation",
 headline=sampleTitle, about="/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national"):string {
  return '<html><head><meta property="article:published_time" content="2026-09-28T12:54:36-0400" />' +
    '</head><body><header><time>October 5, 2026</time></header><main><h1>'+headline+'</h1>'+
    '<article about="'+about+'" typeof="schema:Article">'+
    '<div class="beneath-title"><p class="summary">Selected for award negotiations</p>'+
    '<p class="primary-office"><a href="/cmei">'+office+'</a></p>'+
    '<span class="display-date">'+displayDate+'</span>'+
    '<div class="read-time"><div class="small"><span>Estimated Read Time</span></div></div>'+
    '</div><div class="unknown-publisher-body">Article body not yet selected</div></article>'+
    '<div class="press-release-buttons__previous"><time>September 29, 2026</time></div>'+
    '</main></body></html>';
}
test("read publisher-bound DOE rows; exclude global nav and preserve official /articles source",()=>{
 const r=parseDoeStructuredListing(listing(page0),base);
 assert.equal(r.length,10);
 assert.deepEqual(r[0],{officialUrl:sampleUrl,title:sampleTitle,publicationDate:"2026-09-30",
  issuingOffice:"Office of Critical Minerals and Energy Innovation",documentType:"Press Release"});
 assert.equal(r[1].officialUrl,"https://www.energy.gov/articles/some-broader-doe-official-link");
 assert.equal(r.some(x=>x.officialUrl.includes("global-unrelated")),false);
 assert.equal(r.every(x=>x.publicationDate==="2026-09-30"),true);
});
test("listing rejects missing items, duplicate paths, off-office and invalid date",()=>{
 assert.throws(()=>parseDoeStructuredListing(listing(page0.slice(0,9)),base),/ten explicit/);
 assert.throws(()=>parseDoeStructuredListing(listing([...page0.slice(0,9),0]),base),/duplicate official/);
 assert.throws(()=>parseDoeStructuredListing(listing(page0).replace('<div class="collection-item__office"><span>Office of Critical Minerals and Energy Innovation</span>', '<div class="collection-item__office"><span>Other DOE Office</span>'),base),/issuing office/);
 assert.throws(()=>parseDoeStructuredListing(listing(page0,"February 30, 2026"),base),/impossible/);
 assert.throws(()=>parseDoeStructuredListing(listing(page0).replace("collection-item__date","changed-date"),base),/date field/);
 assert.throws(()=>parseDoeStructuredListing(listing(page0).replace("collection--page","changed-list"),base),/collection--page/);
});
test("filter isn't an arbitrary DOE news page; reject pagination overlap and wrong order",()=>{
 assert.throws(()=>parseDoeStructuredListing(listing(page0),"https://www.energy.gov/news"),/two known/);
 const first=parseDoeStructuredListing(listing(page0),base);
 const second=parseDoeStructuredListing(listing(page1,"September 14, 2026"),older);
 validateDoePagination(first,second);
 assert.throws(()=>validateDoePagination(first,first),/overlap/);
 assert.throws(()=>validateDoePagination(second,first),/chronologically/);
});
test("publisher-visible article header wins over CMS published_time and global navigation",()=>{
 const h=parseDoeStructuredArticleHeader(article(),sampleUrl);
 assert.equal(h.officialUrl,sampleUrl);
 assert.equal(h.publicationDate,"2026-09-30");
 assert.equal(h.issuingOffice,"Office of Critical Minerals and Energy Innovation");
 assert.equal(h.articleBoundaryConfirmed,true);
 assert.equal(h.bodyBoundaryConfirmed,false);
 const listed=parseDoeStructuredListing(listing(page0),base)[0];
 compareDoeOfficialHeader(listed,h);
});
test("reject article mismatching listed title/date/issuer and altered article about URL",()=>{
 const listed=parseDoeStructuredListing(listing(page0),base)[0];
 assert.throws(()=>compareDoeOfficialHeader(listed,
   parseDoeStructuredArticleHeader(article("September 29, 2026"),sampleUrl)),/mismatches/);
 assert.throws(()=>compareDoeOfficialHeader(listed,
   parseDoeStructuredArticleHeader(article(undefined,undefined,
     "DOE different actual article title"),sampleUrl)),/mismatches/);
 assert.throws(()=>parseDoeStructuredArticleHeader(article(undefined,"Other Issuing Office"),sampleUrl),/attribution/);
 assert.throws(()=>parseDoeStructuredArticleHeader(article(undefined,undefined,undefined,
  "/cmei/articles/another-doe-release"),sampleUrl),/differs/);
});
test("reject missing source primary-office, schema article, double title and date conflicts",()=>{
 assert.throws(()=>parseDoeStructuredArticleHeader(article().replace('class="display-date"','class="hidden-date"'),sampleUrl),/display-date/);
 assert.throws(()=>parseDoeStructuredArticleHeader(article().replace('typeof="schema:Article"','typeof="another-type"'),sampleUrl),/schema:Article/);
 assert.throws(()=>parseDoeStructuredArticleHeader(article().replace("</h1>","</h1><h1>Other</h1>"),sampleUrl),/publisher H1/);
 assert.throws(()=>parseDoeStructuredArticleHeader(article("February 31, 2026"),sampleUrl),/impossible/);
 assert.throws(()=>parseDoeStructuredArticleHeader(article().replace('class="primary-office"','class="different"'),sampleUrl),/primary-office/);
});
test("manual-only DOE boundary audit exists; no data mutation or verified body fingerprint",()=>{
 const workflow=readFileSync(".github/workflows/doe-structured-provenance.yml","utf8");
 const script=readFileSync("scripts/probe-doe-structured.ts","utf8");
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/contents: read/);
 assert.doesNotMatch(workflow,/\bcron:|\bschedule:|contents: write|git push/);
 assert.doesNotMatch(script,/data\/seed|PILOT_SOURCE_IDS|monitor:exim|editorial:inbox/);
 const out=execFileSync(process.platform==="win32"?"npm.cmd":"npm",
 ["run","monitor:probe-doe-structured","--","--check-runtime"],{encoding:"utf8",timeout:30_000});
 assert.match(out,/offline.*no network.*no state/i);
});
