import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { auditDoeSemanticCoverage } from "../scripts/doe-cmei-semantic-coverage";
import { parseDoeBodyProof } from "../scripts/doe-cmei-body-proof";

const URL="https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national";
const TITLE="DOE Office of Critical Minerals and Energy Innovation Announces National Laboratory Mining Projects";
const original="WASHINGTON DOE has selected research projects for award negotiations, not signed financial commitments or verified distributions of funds. The project names are provided for original-source research and are not proof of completed factory construction, commissioning or metal output.";
const field=(v:string)=>'<div class="field field--name-field-text field--type-text-long"><p>'+v+'</p></div>';
function page(body:string,chrome="Header navigation unrelated"){
 return '<!doctype html><html><head></head><body><header>'+chrome+'</header><main><h1>'+TITLE+'</h1>'+
 '<article typeof="schema:Article" about="/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national">'+
 '<div class="beneath-title"><p class="primary-office"><a href="/cmei">Office of Critical Minerals and Energy Innovation</a></p>'+
 '<span class="display-date">September 30, 2026</span></div>'+body+'</article>'+
 '</main><footer>Other news links</footer></body></html>';
}
const body=field(original)+
 '<div class="usa-accordion"><button class="usa-accordion__button">Research project list</button>'+
 '<div class="usa-accordion__content">'+field(original+" Second source description.")+'</div></div>';
test("inventory audits only one validated DOE schema:Article, not navigation or publisher header",()=>{
 const a=auditDoeSemanticCoverage(page(body),URL);
 const b=auditDoeSemanticCoverage(page(body,"Changed global search menu"),URL);
 assert.equal(a.mode,"doe_manual_semantic_gap_inventory_only");
 assert.deepEqual(a.risks,{structured_table:0,embedded_media:0,image_or_caption:0,
  outside_text_field:0,outside_cited_link:0});
 assert.equal(a.riskTotal,0);
 assert.deepEqual(a.sample,[]);
 assert.equal(a.sampleTruncated,false);
 assert.equal(a.candidateBodyFingerprint,parseDoeBodyProof(page(body),URL).candidateFingerprint);
 assert.deepEqual(a,b);
 assert.equal(a.fullBodyBoundaryConfirmed,false);
 assert.equal(a.eligibleForRevisionTracking,false);
 assert.equal(a.collectorActivationAuthorized,false);
 assert.equal(a.sourceUseApproved,false);
});
test("unmodeled table edits are detected even when M2.8 candidate digest does not change",()=>{
 const a=page(body+'<table><tbody><tr><th>Applicant</th><td>Project A</td></tr></tbody></table>');
 const b=page(body+'<table><tbody><tr><th>Applicant</th><td>Project B</td></tr></tbody></table>');
 const x=auditDoeSemanticCoverage(a,URL),y=auditDoeSemanticCoverage(b,URL);
 assert.equal(parseDoeBodyProof(a,URL).candidateFingerprint,parseDoeBodyProof(b,URL).candidateFingerprint,
   "candidate parser skips tables outside recognized text fields");
 assert.equal(x.risks.structured_table,2);
 assert.equal(x.riskTotal,2);
 assert.notEqual(x.sample.find(s=>s.tag==="table")?.elementFingerprint,
  y.sample.find(s=>s.tag==="table")?.elementFingerprint);
 assert.equal(x.sample.find(s=>s.tag==="table")?.insideKnownTextField,false);
});
test("tables inside a known publisher text field are still a structural semantic risk",()=>{
 const html=page(field(original+"<table><tr><td>rare earth materials</td></tr></table>"));
 const x=auditDoeSemanticCoverage(html,URL);
 assert.equal(x.risks.structured_table,1);
 assert.equal(x.sample[0].insideKnownTextField,true);
 assert.equal(x.fullBodyBoundaryConfirmed,false);
});
test("images, captions and embeds generate risk counts without copying image content or URLs",()=>{
 const media='<figure><img src="https://www.energy.gov/sites/default/files/map.png" alt="Facility map"/>'+
 '<figcaption>Map of the proposed plant site</figcaption></figure>'+
 '<iframe src="https://www.youtube.com/embed/test-video"></iframe>';
 const x=auditDoeSemanticCoverage(page(body+media),URL);
 assert.equal(x.risks.image_or_caption,3);
 assert.equal(x.risks.embedded_media,1);
 assert.equal(x.riskTotal,4);
 assert.ok(x.sample.every(v=>/^[0-9a-f]{64}$/.test(v.elementFingerprint)));
 assert.doesNotMatch(JSON.stringify(x),/Facility map|youtube\.com|Proposed plant site/);
});
test("publisher paragraphs, article headings and citations outside text fields remain visible as gaps",()=>{
 const other='<h2>Critical Minerals Award Summary</h2><p>Uncaptured editorial background paragraph.</p>'+
 '<a href="/sites/default/files/project-appendix.pdf">Original supporting PDF</a>'+
 '<ul><li>A source-listed applicant</li></ul>';
 const x=auditDoeSemanticCoverage(page(body+other),URL);
 assert.equal(x.risks.outside_text_field,3);
 assert.equal(x.risks.outside_cited_link,1);
 assert.equal(x.eligibleForRevisionTracking,false);
});
test("no publisher site footer/chrome can masquerade as source-body semantic risk",()=>{
 const outside='<table><tr><td>Site navigation</td></tr></table><figure><img src="/logo.png"/></figure>';
 const a=page(body);
 const b=page(body).replace('</main>', '</main>'+outside);
 assert.deepEqual(auditDoeSemanticCoverage(a,URL),auditDoeSemanticCoverage(b,URL));
});
test("ill-formed nested markup, missing source header and off-host identity fail closed",()=>{
 assert.throws(()=>auditDoeSemanticCoverage(page(body+'<table><tr><td>Broken</td></table>'),URL),
  /malformed closing markup/);
 assert.throws(()=>auditDoeSemanticCoverage(page(field("short")),URL),/empty|implausibly|outside/);
 assert.throws(()=>auditDoeSemanticCoverage(page(body),URL+"?unexpected=1"));
 assert.throws(()=>auditDoeSemanticCoverage("foo",URL),/bounded|publisher HTML/);
});
test("risk samples are capped but total risks remain visible and cannot imply completeness",()=>{
 const extras='<p>Unmodeled publisher paragraph with evidence.</p>'.repeat(30);
 const x=auditDoeSemanticCoverage(page(body+extras),URL);
 assert.equal(x.risks.outside_text_field,30);
 assert.equal(x.riskTotal,30);
 assert.equal(x.sample.length,24);
 assert.equal(x.sampleTruncated,true);
 assert.throws(()=>auditDoeSemanticCoverage(page(body+'<p>Unmodeled</p>'.repeat(301)),URL),
  /risk inventory bound/);
});
test("manual DOE probe integrates risk inventory but preserves no monitoring, state, or publication",()=>{
 const probe=readFileSync("scripts/probe-doe-body.ts","utf8");
 const workflow=readFileSync(".github/workflows/doe-body-proof.yml","utf8");
 const audit=readFileSync("scripts/doe-cmei-semantic-coverage.ts","utf8");
 assert.match(probe,/auditDoeSemanticCoverage\(official\.html,target\.url\)/);
 assert.match(probe,/coverage\.riskTotal/);
 assert.match(probe,/fullBodyBoundaryConfirmed:false/);
 assert.match(probe,/enabledForMonitoring:false/);
 assert.match(probe,/revisionTrackingActivated:false/);
 assert.match(probe,/sourceStateCreated:false/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/\bcron:|\bschedule:|contents: write/);
 assert.doesNotMatch(audit,/fetch\(|writeFileSync|renameSync|github\.token|data\/seed|PILOT_SOURCE_IDS/);
 assert.match(audit,/sourceUseApproved:false/);
});
