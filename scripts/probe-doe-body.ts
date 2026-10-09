/**
 * M2.8 source-only DOE body-candidate probe.
 * Five bounded official requests; NO state, editorial classification, seed,
 * funding, policy, source identities or daily collector.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {
  DOE_CMEI_LISTING_0,DOE_CMEI_LISTING_1,DOE_CMEI_EXAMPLES,
  getPublisherHtml,
} from "./doe-cmei-forensics";
import {
  parseDoeStructuredListing,parseDoeStructuredArticleHeader,
  compareDoeOfficialHeader,validateDoePagination,
  type DoeCmeiRow,
} from "./doe-cmei-structured-parser";
import {parseDoeBodyProof,type DoeBodyProof} from "./doe-cmei-body-proof";

const OUT=join(process.cwd(),".monitor-doe-body-proof");
type Result={
 version:1;mode:"doe_cmei_body_candidate_forensics_only";observedAt:string;
 status:"forensic_only"|"degraded";
 sourceListingPages:number;sourceListingRows:number;pageOverlap:number;
 sampleProofs:{role:string;proof:DoeBodyProof}[];
 errors:string[];
 fullBodyBoundaryConfirmed:false;enabledForMonitoring:false;
 revisionTrackingActivated:false;sourceStateCreated:false;
};
function format(r:Result):string {
 return [
 "## DOE CMEI M2.8 — experimental body-boundary evidence",
 "",
 "Run UTC: "+r.observedAt+". Status: **"+r.status+"**. DOE collector active: **NO**.",
 "Listing pages: "+r.sourceListingPages+"/2. Index rows: "+r.sourceListingRows+
 "; overlap: "+r.pageOverlap+".",
 "",
 "| Publisher example | Official date | Text fields | Accordion headings | Body candidate chars | Link targets |",
 "| --- | --- | ---: | ---: | ---: | ---: |",
 ...r.sampleProofs.map(x=>"| "+x.role+" | "+x.proof.publicationDate+" | "+
 x.proof.candidateFieldCount+" | "+x.proof.accordionHeadingCount+" | "+
 x.proof.textCharacterCount+" | "+x.proof.sourceLinkCount+" |"),
 "",
 "**Important:** candidate fingerprints are for engineering comparison only; full article-body coverage is NOT certified.",
 "The attached JSON includes only limited preview excerpts, diagnostics and candidate hashes, not full article text.",
 "",
 "### Errors",
 ...(r.errors.length?r.errors.map(x=>"- "+x):["- none"]),
 "",
 "Monitoring, finance, policy, private review and publication revision systems remain untouched.",
 "",
 ].join("\n");
}
async function main():Promise<void>{
 if(process.argv.slice(2).join(" ")==="--check-runtime"){
  process.stdout.write("DOE body source proof ready (offline, no network, no state)\n");
  return;
 }
 if(process.argv.length!==2)throw Error("Unrecognized DOE body source-proof arguments");
 const errors:string[]=[];const pages:DoeCmeiRow[][]=[];
 for(const u of [DOE_CMEI_LISTING_0,DOE_CMEI_LISTING_1]){
  try{
   const result=await getPublisherHtml(u,fetch);
   pages.push(parseDoeStructuredListing(result.html,u));
  }catch(e){errors.push("DOE index "+u+": "+String(e).slice(0,220));}
 }
 const overlap=pages.length===2?
  pages[1].filter(x=>pages[0].some(y=>y.officialUrl===x.officialUrl)).length:0;
 if(pages.length===2){
  try{validateDoePagination(pages[0],pages[1]);}
  catch(e){errors.push("DOE indexed rollover: "+String(e).slice(0,220));}
 }else errors.push("Missing one or more publisher-validated listing pages");
 const allRows=pages.flat();
 const proofs:{role:string;proof:DoeBodyProof}[]=[];
 for(const target of DOE_CMEI_EXAMPLES){
  try{
   const official=await getPublisherHtml(target.url,fetch);
   const header=parseDoeStructuredArticleHeader(official.html,target.url);
   const row=allRows.find(x=>x.officialUrl===header.officialUrl);
   if(!row)throw Error("No matching original DOE publication in publisher listing");
   compareDoeOfficialHeader(row,header);
   const proof=parseDoeBodyProof(official.html,target.url);
   if(proof.publicationDate!==row.publicationDate||
      proof.title!==row.title||proof.officialUrl!==row.officialUrl)
    throw Error("DOE article body candidate metadata mismatches official card");
   proofs.push({role:target.role,proof});
  }catch(e){errors.push("DOE original "+target.role+": "+String(e).slice(0,260));}
 }
 if(proofs.length!==3)errors.push("Incomplete DOE body proof sample");
 const result:Result={
  version:1,mode:"doe_cmei_body_candidate_forensics_only",
  observedAt:new Date().toISOString(),status:errors.length?"degraded":"forensic_only",
  sourceListingPages:pages.length,sourceListingRows:allRows.length,
  pageOverlap:overlap,sampleProofs:proofs,errors,
  fullBodyBoundaryConfirmed:false,enabledForMonitoring:false,
  revisionTrackingActivated:false,sourceStateCreated:false,
 };
 mkdirSync(OUT,{recursive:true,mode:0o700});
 writeFileSync(join(OUT,"report.json"),JSON.stringify(result,null,2)+"\n",{mode:0o600});
 const summary=format(result);
 writeFileSync(join(OUT,"summary.md"),summary,{mode:0o600});
 process.stdout.write(summary);
 if(result.status!=="forensic_only")process.exitCode=1;
}
main().catch(e=>{process.stderr.write("DOE body forensic failed: "+String(e)+"\n");process.exitCode=1;});
