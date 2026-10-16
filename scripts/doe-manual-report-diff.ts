/**
 * M2.9d: compare TWO human-supplied, completed manual DOE body-probe reports.
 *
 * Pure offline source diagnostics. A difference requires independent original
 * publisher review; equality NEVER certifies publication stability, rights,
 * approved semantic completeness, source use, a state baseline or activation.
 */
import { DOE_CMEI_EXAMPLES } from "./doe-cmei-forensics";

type Reason =
  | "official_header_changed"
  | "experimental_text_candidate_changed"
  | "experimental_structure_counts_changed"
  | "experimental_risk_fingerprints_changed";

export type DoeManualReportDiffRow = {
  role: string;
  officialUrl: string;
  reasons: Reason[];
  observedRiskCountBefore: number;
  observedRiskCountAfter: number;
  beforeSampleTruncated: boolean;
  afterSampleTruncated: boolean;
  riskSampleComparisonExhaustive: boolean;
  /** "No detected change" is NOT a claim of unchanged publisher content. */
  independentlyVerifiedOriginalAmendment: false;
};
export type DoeManualReportDiff = {
  mode: "offline_doe_experimental_report_comparison_only";
  earlierObservedAt: string;
  laterObservedAt: string;
  originalArticleSamples: number;
  status: "manual_source_review_needed" | "no_difference_detected_in_bounded_evidence";
  observedDifferences: number;
  needsHumanReview: boolean;
  rows: DoeManualReportDiffRow[];
  completePublisherBodyCertified: false;
  sourceUseApproved: false;
  semanticRevisionTrackingApproved: false;
  monitoringActivationAuthorized: false;
  noSourceStateWritten: true;
  noPublishedRecordsChanged: true;
};
type Gap = {kind: string;tag: string;insideKnownTextField:boolean;elementFingerprint:string};
type BodySample = {
  role:string;
  officialUrl:string;
  title:string;publicationDate:string;issuingOffice:string;
  candidateFingerprint:string;
  candidateFieldCount:number;accordionHeadingCount:number;segmentCount:number;
  textCharacterCount:number;sourceLinkCount:number;
  risks: Record<string,number>;
  riskTotal:number;sample:Gap[];sampleTruncated:boolean;
};
type Report = {observedAt:string;samples:Map<string,BodySample>};
const RISKS=[
 "structured_table","embedded_media","image_or_caption",
 "outside_text_field","outside_cited_link",
] as const;
const ROLES = DOE_CMEI_EXAMPLES.map(x=>({role:x.role,url:x.url}));
const HASH=/^[0-9a-f]{64}$/;
function obj(value:unknown,where:string):Record<string,unknown>{
 if(value===null||typeof value!=="object"||Array.isArray(value))
   throw Error("DOE compare malformed "+where);
 return value as Record<string,unknown>;
}
function str(value:unknown,where:string):string{
 if(typeof value!=="string"||!value.trim()||value.length>700)
   throw Error("DOE compare invalid "+where);
 return value;
}
function flag(value:unknown,where:string):boolean{
 if(typeof value!=="boolean")throw Error("DOE compare invalid "+where);
 return value;
}
function count(value:unknown,where:string,max=250_000):number{
 if(!Number.isInteger(value)||typeof value!=="number"||value<0||value>max)
   throw Error("DOE compare invalid "+where);
 return value;
}
function time(value:unknown):string{
 const s=str(value,"observedAt");
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(s)||
   !Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s.slice(0,10))
   throw Error("DOE compare invalid original observation instant");
 return s;
}
function record(value:unknown,label:string):BodySample {
 const x=obj(value,"sample");
 const role=str(x.role,"role");
 const expected=ROLES.find(y=>y.role===role);
 if(!expected)throw Error("DOE compare unapproved sample role");
 const proof=obj(x.proof,"publisher proof");
 const coverage=obj(x.coverage,"coverage");
 const url=str(proof.officialUrl,"official URL");
 if(url!==expected.url||coverage.officialUrl!==url)
   throw Error("DOE compare original publication identity mismatch");
 if(!HASH.test(str(proof.candidateFingerprint,"candidate hash"))||
   coverage.candidateBodyFingerprint!==proof.candidateFingerprint)
   throw Error("DOE compare unlinked candidate proof");
 if(proof.fullBodyBoundaryConfirmed!==false||
   proof.eligibleForRevisionTracking!==false||
   coverage.fullBodyBoundaryConfirmed!==false||
   coverage.eligibleForRevisionTracking!==false||
   coverage.collectorActivationAuthorized!==false||
   coverage.sourceUseApproved!==false)
   throw Error("DOE compare must not receive an approved source signal");
 if(coverage.mode!=="doe_manual_semantic_gap_inventory_only")
   throw Error("DOE compare unsupported risk inventory schema");
 const date=str(proof.publicationDate,"official date");
 if(!/^\d{4}-\d\d-\d\d$/.test(date)||new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)
   throw Error("DOE compare invalid official date");
 const risks=obj(coverage.risks,"risk classes");
 if(Object.keys(risks).sort().join(",")!==[...RISKS].sort().join(","))
   throw Error("DOE compare missing/unknown risk class");
 const counts:Object=risks;
 void counts;
 const parsed=Object.fromEntries(RISKS.map(k=>[k,count(risks[k],"risk count",300)]));
 const total=count(coverage.riskTotal,"risk total",300);
 if(Object.values(parsed).reduce((n,x)=>n+(x as number),0)!==total)
   throw Error("DOE compare risk counts do not add up");
 if(!Array.isArray(coverage.sample))throw Error("DOE compare missing original gap sample");
 const truncated=flag(coverage.sampleTruncated,"risk sample truncation");
 if(truncated!==(total>24)||coverage.sample.length!==Math.min(24,total))
   throw Error("DOE compare inconsistent source risk sampling");
 const gaps:Gap[]=coverage.sample.map((g:unknown)=>{
   const el=obj(g,"risk sample element");
   const kind=str(el.kind,"risk category");
   if(!RISKS.some(x=>x===kind)||!HASH.test(str(el.elementFingerprint,"element hash")))
     throw Error("DOE compare invalid risk hash/category");
   if(!/^[a-z][a-z0-9:-]{0,29}$/.test(str(el.tag,"risk tag")))
     throw Error("DOE compare invalid structural tag");
   const inside=flag(el.insideKnownTextField,"inside field flag");
   if(el.ancestorTrail!==undefined){
     if(!Array.isArray(el.ancestorTrail)||el.ancestorTrail.length>6||
       !el.ancestorTrail.every(t=>typeof t==="string"&&/^[a-z][a-z0-9:-]{0,29}(?:\.[a-z0-9_.-]{1,105})?$/.test(t)))
       throw Error("DOE compare unsafe DOM ancestry");
   }
   return {kind,tag:el.tag as string,insideKnownTextField:inside,
       elementFingerprint:el.elementFingerprint as string};
 });
 const occurrences=Object.fromEntries(RISKS.map(k=>[k,gaps.filter(g=>g.kind===k).length]));
 for(const k of RISKS)if((occurrences[k] as number)>(parsed[k] as number))
   throw Error("DOE compare risk sample exceeds observed category");
 return {
   role,officialUrl:url,title:str(proof.title,"article title"),
   publicationDate:date,issuingOffice:str(proof.issuingOffice,"office"),
   candidateFingerprint:proof.candidateFingerprint as string,
   candidateFieldCount:count(proof.candidateFieldCount,"text fields",80),
   accordionHeadingCount:count(proof.accordionHeadingCount,"accordion count",120),
   segmentCount:count(proof.segmentCount,"segments",200),
   textCharacterCount:count(proof.textCharacterCount,"candidate chars",180000),
   sourceLinkCount:count(proof.sourceLinkCount,"source links",800),
   risks:parsed as Record<string,number>,riskTotal:total,sample:gaps,sampleTruncated:truncated,
 };
}
export function parseDoeManualReport(input:unknown):Report {
 const x=obj(input,"original report");
 if(x.version!==1||x.mode!=="doe_cmei_body_candidate_forensics_only"||
   x.status!=="forensic_only"||x.fullBodyBoundaryConfirmed!==false||
   x.enabledForMonitoring!==false||x.revisionTrackingActivated!==false||
   x.sourceStateCreated!==false)throw Error("DOE compare requires clean nonactivated manual report");
 if(!Array.isArray(x.errors)||x.errors.length!==0)
   throw Error("DOE compare cannot compare degraded source proof");
 if(x.sourceListingPages!==2||x.sourceListingRows!==20||x.pageOverlap!==0)
   throw Error("DOE compare requires full publisher source listing evidence");
 if(!Array.isArray(x.sampleProofs)||x.sampleProofs.length!==ROLES.length)
   throw Error("DOE compare missing or extra article proofs");
 const samples=new Map<string,BodySample>();
 for(const v of x.sampleProofs){
  const p=record(v,"original");
  if(samples.has(p.role))throw Error("DOE compare duplicate article role");
  samples.set(p.role,p);
 }
 if(ROLES.some(x=>!samples.has(x.role)))
   throw Error("DOE compare missing expected article role");
 return {observedAt:time(x.observedAt),samples};
}
function fingerprints(gaps:readonly Gap[]):string[]{
 return gaps.map(g=>[g.kind,g.tag,g.insideKnownTextField?"inside":"outside",g.elementFingerprint].join(":")).sort();
}
export function compareDoeManualReports(earlier:unknown,later:unknown):DoeManualReportDiff {
 const a=parseDoeManualReport(earlier),b=parseDoeManualReport(later);
 if(Date.parse(b.observedAt)<=Date.parse(a.observedAt))
   throw Error("DOE compare requires strictly later original probe time");
 const rows:DoeManualReportDiffRow[]=ROLES.map(({role,url})=>{
   const x=a.samples.get(role),y=b.samples.get(role);
   if(!x||!y||x.officialUrl!==url||y.officialUrl!==url)
      throw Error("DOE compare missing original role");
   const reasons:Reason[]=[];
   if(x.title!==y.title||x.publicationDate!==y.publicationDate||
     x.issuingOffice!==y.issuingOffice)reasons.push("official_header_changed");
   if(x.candidateFingerprint!==y.candidateFingerprint||
     x.candidateFieldCount!==y.candidateFieldCount||
     x.accordionHeadingCount!==y.accordionHeadingCount||
     x.segmentCount!==y.segmentCount||
     x.textCharacterCount!==y.textCharacterCount||
     x.sourceLinkCount!==y.sourceLinkCount)
     reasons.push("experimental_text_candidate_changed");
   if(x.riskTotal!==y.riskTotal||
     RISKS.some(k=>x.risks[k]!==y.risks[k]))
     reasons.push("experimental_structure_counts_changed");
   if(JSON.stringify(fingerprints(x.sample))!==JSON.stringify(fingerprints(y.sample)))
     reasons.push("experimental_risk_fingerprints_changed");
   // Sampled risk sets are exhaustive only when the bounded risk count <= 24
   // in both original runs. No such result certifies all publisher content.
   return {role,officialUrl:url,reasons,observedRiskCountBefore:x.riskTotal,
     observedRiskCountAfter:y.riskTotal,beforeSampleTruncated:x.sampleTruncated,
     afterSampleTruncated:y.sampleTruncated,
     riskSampleComparisonExhaustive:!x.sampleTruncated&&!y.sampleTruncated,
     independentlyVerifiedOriginalAmendment:false};
 });
 const changed=rows.filter(x=>x.reasons.length).length;
 return {
   mode:"offline_doe_experimental_report_comparison_only",
   earlierObservedAt:a.observedAt,laterObservedAt:b.observedAt,
   originalArticleSamples:rows.length,
   status:changed?"manual_source_review_needed":"no_difference_detected_in_bounded_evidence",
   observedDifferences:changed,
   needsHumanReview:changed>0||rows.some(x=>!x.riskSampleComparisonExhaustive),
   rows,
   completePublisherBodyCertified:false,sourceUseApproved:false,
   semanticRevisionTrackingApproved:false,monitoringActivationAuthorized:false,
   noSourceStateWritten:true,noPublishedRecordsChanged:true,
 };
}
