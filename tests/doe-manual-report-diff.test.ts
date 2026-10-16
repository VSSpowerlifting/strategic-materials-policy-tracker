import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync,readFileSync,rmSync,writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { DOE_CMEI_EXAMPLES } from "../scripts/doe-cmei-forensics";
import {
  compareDoeManualReports,parseDoeManualReport,
} from "../scripts/doe-manual-report-diff";

const hash=(char:string)=>char.repeat(64);
const baseRisks=[
 {outside_text_field:1,outside_cited_link:2},
 {outside_text_field:1,outside_cited_link:3},
 {outside_text_field:0,outside_cited_link:2},
];
function report(observedAt="2026-10-16T19:31:20.798Z",withAncestry=false){
 return {
  version:1 as const,mode:"doe_cmei_body_candidate_forensics_only" as const,
  observedAt,status:"forensic_only" as const,sourceListingPages:2,sourceListingRows:20,
  pageOverlap:0,errors:[] as string[],
  fullBodyBoundaryConfirmed:false,enabledForMonitoring:false,
  revisionTrackingActivated:false,sourceStateCreated:false,
  sampleProofs:DOE_CMEI_EXAMPLES.map((x,i)=>{
   const risks={structured_table:0,embedded_media:0,image_or_caption:0,
    ...baseRisks[i]};
   const riskTotal=risks.outside_text_field+risks.outside_cited_link;
   const sample=[
    ...Array.from({length:risks.outside_text_field},(_,j)=>({
      kind:"outside_text_field",tag:"ul",insideKnownTextField:false,
      elementFingerprint:hash(String(i+j+1)),
    })),
    ...Array.from({length:risks.outside_cited_link},(_,j)=>({
      kind:"outside_cited_link",tag:"a",insideKnownTextField:false,
      elementFingerprint:hash(String(i+j+4)),
    })),
   ].map(g=>({...g,...withAncestry?{
     ancestorTrail:["div.block-content","ul.publisher-links","li"],
   }:{}}));
   return {role:x.role,proof:{
     officialUrl:x.url,title:"Original Department of Energy announcement "+i,
     publicationDate:["2026-09-30","2026-09-14","2026-09-11"][i],
     issuingOffice:"Office of Critical Minerals and Energy Innovation",
     candidateFieldCount:[14,1,1][i],accordionHeadingCount:[12,0,0][i],
     segmentCount:[26,1,1][i],textCharacterCount:[7460,2093,2146][i],
     sourceLinkCount:[3,2,3][i],candidateFingerprint:hash(String(i+4)),
     representativePreview:"Publisher sample is a preview only",
     fullBodyBoundaryConfirmed:false,eligibleForRevisionTracking:false,
   },coverage:{
     mode:"doe_manual_semantic_gap_inventory_only",
     officialUrl:x.url,candidateBodyFingerprint:hash(String(i+4)),
     risks,riskTotal,sample,sampleTruncated:false,
     fullBodyBoundaryConfirmed:false,eligibleForRevisionTracking:false,
     collectorActivationAuthorized:false,sourceUseApproved:false,
   }};
  }),
 };
}
test("compare exact original run identities and counts; no changed fingerprint is NOT proof of unchanged article",()=>{
 const older=report();
 const later=report("2026-10-16T20:10:00Z",true);
 const x=compareDoeManualReports(older,later);
 assert.equal(x.mode,"offline_doe_experimental_report_comparison_only");
 assert.equal(x.status,"no_difference_detected_in_bounded_evidence");
 assert.equal(x.originalArticleSamples,3);
 assert.equal(x.observedDifferences,0);
 assert.equal(x.needsHumanReview,false);
 assert.ok(x.rows.every(y=>y.reasons.length===0));
 assert.ok(x.rows.every(y=>y.riskSampleComparisonExhaustive));
 assert.equal(x.completePublisherBodyCertified,false);
 assert.equal(x.semanticRevisionTrackingApproved,false);
 assert.equal(x.sourceUseApproved,false);
 assert.equal(x.monitoringActivationAuthorized,false);
 assert.equal(x.noSourceStateWritten,true);
 assert.equal(x.noPublishedRecordsChanged,true);
 assert.doesNotMatch(JSON.stringify(x),/representativePreview|original sample is a preview|Publisher sample/);
});
test("a known experimental text hash change requires original human inspection, not automated evidence promotion",()=>{
 const before=report(),after=report("2026-10-16T20:10:00Z");
 after.sampleProofs[0].proof.candidateFingerprint=hash("f");
 after.sampleProofs[0].coverage.candidateBodyFingerprint=hash("f");
 const x=compareDoeManualReports(before,after);
 assert.equal(x.status,"manual_source_review_needed");
 assert.equal(x.observedDifferences,1);
 assert.deepEqual(x.rows[0].reasons,["experimental_text_candidate_changed"]);
 assert.equal(x.needsHumanReview,true);
 assert.equal(x.rows[0].independentlyVerifiedOriginalAmendment,false);
 assert.equal(x.noPublishedRecordsChanged,true);
});
test("changed risk fingerprint detects a possible content edit missed by long-text candidate",()=>{
 const before=report(),after=report("2026-10-16T20:10:00Z",true);
 after.sampleProofs[1].coverage.sample[0].elementFingerprint=hash("a");
 const x=compareDoeManualReports(before,after);
 assert.deepEqual(x.rows[1].reasons,["experimental_risk_fingerprints_changed"]);
 assert.equal(x.rows[1].observedRiskCountBefore,4);
 assert.equal(x.rows[1].observedRiskCountAfter,4);
 assert.equal(x.rows[1].riskSampleComparisonExhaustive,true);
 assert.equal(x.rows[1].independentlyVerifiedOriginalAmendment,false);
});
test("changed risk counts, publisher original date, and source link count are separate bounded signals",()=>{
 const before=report(),after=report("2026-10-16T20:10:00Z");
 after.sampleProofs[0].proof.publicationDate="2026-10-01";
 after.sampleProofs[1].proof.sourceLinkCount=3;
 after.sampleProofs[2].coverage.risks.outside_cited_link=3;
 after.sampleProofs[2].coverage.riskTotal=3;
 after.sampleProofs[2].coverage.sample.push({
  kind:"outside_cited_link",tag:"a",insideKnownTextField:false,elementFingerprint:hash("b"),
 });
 const x=compareDoeManualReports(before,after);
 assert.deepEqual(x.rows[0].reasons,["official_header_changed"]);
 assert.deepEqual(x.rows[1].reasons,["experimental_text_candidate_changed"]);
 assert.deepEqual(x.rows[2].reasons,[
  "experimental_structure_counts_changed","experimental_risk_fingerprints_changed",
 ]);
 assert.equal(x.observedDifferences,3);
});
test("sample truncation forces human review even with identical first 24 item hashes",()=>{
 const a=report(),b=report("2026-10-16T20:10:00Z");
 for(const r of [a,b]){
  const p=r.sampleProofs[0].coverage;
  p.risks.outside_cited_link=24;
  p.riskTotal=25;
  p.sample=[
   ...Array.from({length:1},(_,j)=>({kind:"outside_text_field",tag:"ul",insideKnownTextField:false,elementFingerprint:hash(String(j+1))})),
   ...Array.from({length:23},(_,j)=>({kind:"outside_cited_link",tag:"a",insideKnownTextField:false,elementFingerprint:hash("b")})),
  ];
  p.sampleTruncated=true;
 }
 const x=compareDoeManualReports(a,b);
 assert.equal(x.status,"no_difference_detected_in_bounded_evidence");
 assert.equal(x.needsHumanReview,true);
 assert.equal(x.rows[0].riskSampleComparisonExhaustive,false);
 assert.equal(x.rows[0].beforeSampleTruncated,true);
});
test("reject incomplete/failed observations, mismatched URLs, misleading approval or tampered hash",()=>{
 const original=report(),later=report("2026-10-16T20:10:00Z");
 const edit=(cb:(x:ReturnType<typeof report>)=>void)=>{
  const invalid=structuredClone(later);cb(invalid);
  assert.throws(()=>compareDoeManualReports(original,invalid));
 };
 edit(x=>{x.status="forensic_only";x.errors.push("publisher outage");});
 edit(x=>{x.sourceListingRows=19;});
 edit(x=>{x.pageOverlap=1;});
 edit(x=>{x.sampleProofs.pop();});
 edit(x=>{x.sampleProofs[1].role=x.sampleProofs[0].role;});
 edit(x=>{const p=x.sampleProofs[0].proof as {officialUrl:string};p.officialUrl="https://example.org/cmei/articles/not-real";});
 edit(x=>{x.sampleProofs[0].proof.candidateFingerprint="x";});
 edit(x=>{x.sampleProofs[0].coverage.fullBodyBoundaryConfirmed=true;});
 edit(x=>{x.sampleProofs[0].coverage.sourceUseApproved=true;});
 edit(x=>{x.sampleProofs[0].coverage.riskTotal=300;});
 edit(x=>{x.sampleProofs[0].coverage.sampleTruncated=true;});
 edit(x=>{x.sampleProofs[0].coverage.sample[0].elementFingerprint="leak";});
 assert.throws(()=>compareDoeManualReports(original,original),/strictly later/);
 assert.throws(()=>compareDoeManualReports(later,original),/strictly later/);
});
test("risk parent breadcrumbs from new report are validated, sanitized, but never counted as body evidence",()=>{
 const earlier=report(),later=report("2026-10-16T20:10:00Z",true);
 const count=compareDoeManualReports(earlier,later);
 assert.equal(count.observedDifferences,0);
 (later.sampleProofs[0].coverage.sample[0] as {ancestorTrail?:string[]}).ancestorTrail=[
  "div.article","span[data-private=secret]"
 ];
 assert.throws(()=>parseDoeManualReport(later),/unsafe DOM ancestry/);
});
test("pure parser never requires network/state baseline and local CLI compares JSON file pairs only",()=>{
 const cli=readFileSync("scripts/compare-doe-manual-reports.ts","utf8");
 const fn=readFileSync("scripts/doe-manual-report-diff.ts","utf8");
 assert.doesNotMatch(fn,/fetch\(|writeFileSync|renameSync|data\/seed|process\.env|github\.token/);
 assert.doesNotMatch(cli,/fetch\(|https\.get|writeFileSync|renameSync|data\/seed|process\.env/);
 const dir=mkdtempSync(join(tmpdir(),"doe-manual-diff-test-"));
 try{
  const a=join(dir,"a.json"),b=join(dir,"b.json");
  writeFileSync(a,JSON.stringify(report()));
  writeFileSync(b,JSON.stringify(report("2026-10-16T20:10:00Z",true)));
  const stdout=execFileSync("npx",["tsx","scripts/compare-doe-manual-reports.ts",a,b],{
   cwd:process.cwd(),encoding:"utf8",timeout:30000,stdio:["ignore","pipe","pipe"],
  });
  const parsed=JSON.parse(stdout);
  assert.equal(parsed.status,"no_difference_detected_in_bounded_evidence");
  assert.equal(parsed.noSourceStateWritten,true);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
