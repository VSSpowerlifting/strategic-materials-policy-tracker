import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {parseDoeBodyProof} from "@/scripts/doe-cmei-body-proof";

const url="https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national";
const title="DOE’s Office of Critical Minerals and Energy Innovation Announces National Laboratory Mining Projects";
function textField(s:string):string {
  return '<div class="paragraph paragraph--type--text-field"><div class="paragraph__column">'+
   '<div class="field field--text_default field--field_text field--name-field-text '+
   'field--type-text-long field--label-hidden field__item"><p>'+s+'</p></div></div></div>';
}
const first="WASHINGTON—DOE selected 17 national laboratory mining projects for award negotiations, "+
  "supporting critical minerals processing research. This is an announcement of selections and "+
  "is not proof of a signed grant agreement or of a disbursement. "+
  '<a href="https://www.energy.gov/cmei">Read DOE program</a> for additional details.';
const project="Project A develops technologies for processing rare earth ores and improves "+
 "mineral recovery. The project is an early-stage research proposal, not evidence of a "+
 "completed manufacturing facility or an obligated federal financing agreement.";
function article(body:string,nav="Global menu"):string {
  return '<html><head><meta property="article:published_time" content="2026-09-28T12:54:00Z"/>'+
   '</head><body><header>'+nav+'</header><main><h1>'+title+'</h1>'+
   '<article about="/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national" typeof="schema:Article">'+
   '<div class="beneath-title"><p class="primary-office"><a href="/cmei">Office of Critical Minerals and Energy Innovation</a></p>'+
   '<span class="display-date">September 30, 2026</span></div>'+
   body+'</article><div>Previous article September 29, 2026</div></main>'+
   '<footer>'+nav+'</footer></body></html>';
}
const body=textField(first)+
 '<div class="usa-accordion__heading"><button class="usa-accordion__button" type="button">'+
 'Mining research projects</button></div><div class="usa-accordion__content usa-prose" hidden>'+
 textField(project)+'</div>';
test("collects official text fields plus hidden accordion text and headings but never certifies revisions",()=>{
 const proof=parseDoeBodyProof(article(body),url);
 assert.equal(proof.candidateFieldCount,2);
 assert.equal(proof.accordionHeadingCount,1);
 assert.equal(proof.segmentCount,3);
 assert.equal(proof.sourceLinkCount,1);
 assert.ok(proof.textCharacterCount>350);
 assert.equal(proof.fullBodyBoundaryConfirmed,false);
 assert.equal(proof.eligibleForRevisionTracking,false);
 assert.match(proof.candidateFingerprint,/^[a-f0-9]{64}$/);
 assert.match(proof.representativePreview,/WASHINGTON/);
});
test("a change to header, CMS metadata, footer or unrelated nav does NOT alter the candidate hash",()=>{
 const original=article(body);
 const modified=original.replace('content="2026-09-28T12:54:00Z"','content="2026-10-08T12:54:00Z"')
  .replaceAll("Global menu","New global site announcement")
  .replace("Previous article September 29, 2026","Previous article October 4, 2026");
 const a=parseDoeBodyProof(original,url),b=parseDoeBodyProof(modified,url);
 assert.equal(a.candidateFingerprint,b.candidateFingerprint);
});
test("substantive project edits, accordion heading edits and source link changes DO alter candidate hash",()=>{
 const a=parseDoeBodyProof(article(body),url).candidateFingerprint;
 const variants=[
  body.replace("early-stage research proposal","recently completed manufacturing project"),
  body.replace("Mining research projects","Awarded DOE demonstration projects"),
  body.replace('href="https://www.energy.gov/cmei"','href="https://www.energy.gov/articles"'),
 ];
 variants.forEach(x=>assert.notEqual(parseDoeBodyProof(article(x),url).candidateFingerprint,a));
});
test("missing structured publisher fields or malformed article boundary fails closed",()=>{
 assert.throws(()=>parseDoeBodyProof(article("Unstructured press release body without source fields"),url),
 /lacks bounded official long-text/);
 assert.throws(()=>parseDoeBodyProof(article(body.replaceAll("field--name-field-text","unknown-field")),url),
 /lacks bounded official long-text/);
 assert.throws(()=>parseDoeBodyProof(article(body).replace("</article>",""),url),
 /schema:Article|closed article/);
 assert.throws(()=>parseDoeBodyProof(article(body.replace('href="https://www.energy.gov/cmei"','href="javascript:alert(1)"')),url),
 /unsupported source link scheme/);
});
test("short or implausibly large fields are rejected rather than being called complete",()=>{
 assert.throws(()=>parseDoeBodyProof(article(textField("Two words")),url),/implausibly large|empty/);
 assert.throws(()=>parseDoeBodyProof(article(textField("x".repeat(80_010))),url),/implausibly large/);
});
test("manual-only DOE body probe remains separate from source identities and finance models",()=>{
 const yaml=readFileSync(".github/workflows/doe-body-proof.yml","utf8");
 const script=readFileSync("scripts/probe-doe-body.ts","utf8");
 assert.match(yaml,/workflow_dispatch:/);
 assert.match(yaml,/contents: read/);
 assert.doesNotMatch(yaml,/\bcron:|\bschedule:|contents: write|actions: write|git push/);
 assert.doesNotMatch(script,/data\/seed|PILOT_SOURCE_IDS|monitor:exim|editorial:inbox/);
 const out=execFileSync(process.platform==="win32"?"npm.cmd":"npm",
  ["run","monitor:probe-doe-body","--","--check-runtime"],
  {encoding:"utf8",timeout:30_000});
 assert.match(out,/offline.*no network.*no state/i);
});
