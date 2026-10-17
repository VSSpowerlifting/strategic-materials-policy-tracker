/**
 * Read-only F5 publication-cutoff impact assessment.
 *
 * Counts dated metadata cells in every tracked public seed. A date scan cannot
 * authenticate external source freshness or certify that all records were
 * reviewed; this is an editorial release aid, NEVER a publication gate pass.
 */
import {readFileSync} from "node:fs";
import {join,resolve} from "node:path";
import {isMilestoneIsoDate} from "../lib/project-milestones";
import {site} from "../lib/site";

export const F5_SEED_NAMES = [
  "control-measures","events","financial-commitments","framing",
  "jurisdictions","materials","organizations","programmes",
  "project-designations","project-milestones","projects","sources","watchlist",
] as const;

export type SeedInput = Record<string, readonly unknown[]>;
export type DateObservation = {seed:string;recordId:string;field:string;date:string};
export type F5CorpusCutoffImpact = {
  schemaVersion:"f5-prospective-corpus-cutoff-impact-1";
  purpose:"read_only_prepublication_date_metadata_audit";
  currentPublishedCutoff:string;
  proposedCutoff:string;
  publicationAuthorized:false;
  allExternalSourcesRechecked:false;
  approvalOfAnyNewPolicyOrFinanceEvent:false;
  totalPublicSeedRows:number;
  datasets:{seed:string;rows:number}[];
  newlyIncludedDatedFields:DateObservation[];
  afterProposedCutoffFields:DateObservation[];
  futureIntervalEndFields:DateObservation[];
  countNewlyIncludedDatedFields:number;
  countFutureIntervalEndFields:number;
  countOtherPostCutoffFields:number;
  maintainerReviewRequired:true;
  limitations:string[];
};

const iso=(s:unknown):string|null=>{
  if(typeof s!=="string")return null;
  // Timestamp metadata retains its day for this DATE-LEVEL sensitivity audit.
  const day=/^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.exec(s)?.[1];
  return day&&isMilestoneIsoDate(day)?day:null;
};
const lex=(a:DateObservation,b:DateObservation)=>
  a.seed.localeCompare(b.seed)||a.recordId.localeCompare(b.recordId)||
  a.field.localeCompare(b.field)||a.date.localeCompare(b.date);

/** Does not read private adjudications, source bodies, or anything outside public seed arrays. */
export function auditF5CorpusCutoffImpact(
  datasets:SeedInput,currentPublishedCutoff:string,proposedCutoff:string,
):F5CorpusCutoffImpact{
  if(!isMilestoneIsoDate(currentPublishedCutoff)||!isMilestoneIsoDate(proposedCutoff)||
     proposedCutoff<currentPublishedCutoff)
    throw new Error("F5 cutoff impact: dates must be real and proposed >= published");
  const newlyIncludedDatedFields:DateObservation[]=[];
  const afterProposedCutoffFields:DateObservation[]=[];
  const futureIntervalEndFields:DateObservation[]=[];
  const datasetSummary:{seed:string;rows:number}[]=[];
  let total=0;
  for(const seed of F5_SEED_NAMES){
    const rows=datasets[seed];
    if(!Array.isArray(rows))throw new Error("F5 cutoff impact: missing public seed array "+seed);
    total+=rows.length;
    datasetSummary.push({seed,rows:rows.length});
    rows.forEach((row,index)=>{
      const id=row&&typeof row==="object"&&!Array.isArray(row) &&
        "id" in row&&typeof row.id==="string" ? row.id : "row-"+index;
      const walk=(obj:unknown,path:string):void=>{
        if(Array.isArray(obj)){obj.forEach((value,i)=>walk(value,path+"["+i+"]"));return;}
        if(!obj||typeof obj!=="object")return;
        for(const [field,value] of Object.entries(obj)){
          const key=path?path+"."+field:field;
          if(typeof value==="string"){
            const date=iso(value);
            if(!date||date<=currentPublishedCutoff)continue;
            const entry={seed,recordId:id,field:key,date};
            if(date<=proposedCutoff)newlyIncludedDatedFields.push(entry);
            else if(field==="until")futureIntervalEndFields.push(entry);
            else afterProposedCutoffFields.push(entry);
          }else if(value!==null&&typeof value==="object")walk(value,key);
        }
      };
      walk(row,"");
    });
  }
  for(const array of [newlyIncludedDatedFields,afterProposedCutoffFields,futureIntervalEndFields])
    array.sort(lex);
  return {
    schemaVersion:"f5-prospective-corpus-cutoff-impact-1",
    purpose:"read_only_prepublication_date_metadata_audit",
    currentPublishedCutoff,proposedCutoff,publicationAuthorized:false,
    allExternalSourcesRechecked:false,
    approvalOfAnyNewPolicyOrFinanceEvent:false,
    totalPublicSeedRows:total,datasets:datasetSummary,
    newlyIncludedDatedFields,afterProposedCutoffFields,futureIntervalEndFields,
    countNewlyIncludedDatedFields:newlyIncludedDatedFields.length,
    countFutureIntervalEndFields:futureIntervalEndFields.length,
    countOtherPostCutoffFields:afterProposedCutoffFields.length,
    maintainerReviewRequired:true,
    limitations:[
      "Metadata scan only: sources may have changed without a new seed-date cell.",
      "site.lastUpdated means last curated corpus revision, not that every source was freshly rechecked on the cutoff day.",
      "A statusHistory.until after the proposed date is a future temporal boundary, not evidence of a new achieved policy event.",
      "Unchanged counts do not certify all financing, controls or physical projects are current.",
      "A proposed date requires an explicit whole-corpus editorial decision, separate publication signoff and exact-head checks.",
    ],
  };
}

const cliEntry=resolve(process.cwd(),"scripts","audit-f5-corpus-cutoff-impact.ts");
const isMain=!!process.argv[1]&&resolve(process.argv[1])===cliEntry;
if(isMain){
  try{
    const args=process.argv.slice(2);
    if(args.length!==2||args[0]!=="--proposed-cutoff")
      throw new Error("Usage: node --import tsx scripts/audit-f5-corpus-cutoff-impact.ts --proposed-cutoff YYYY-MM-DD");
    const base=join(process.cwd(),"data","seed");
    const datasets:SeedInput={};
    for(const seed of F5_SEED_NAMES)
      datasets[seed]=JSON.parse(readFileSync(join(base,seed+".json"),"utf8")) as unknown[];
    process.stdout.write(JSON.stringify(auditF5CorpusCutoffImpact(datasets,site.lastUpdated,args[1]),null,2)+"\n");
  }catch(e){
    console.error(e instanceof Error?e.message:String(e));
    process.exitCode=2;
  }
}
