/**
 * F5-5 research sidecar: render case-specific original-publisher leads *alongside*
 * the existing M3 worksheet digest, without adding another approval authority.
 * Offline and read-only. The digest fingerprints metadata, not source bodies.
 */
import type { Project, Source, FinancialCommitment } from "../lib/types";
import { buildM3ReviewerPackets } from "./project-execution-review-packets";
type Refs={
  queue:unknown; projects:readonly Project[]; sources:readonly Source[];
  commitments:readonly FinancialCommitment[]; corpusCutoff:string; publicMilestoneCount:number;
};
type ExpectedLead={
  key:string; role:string; url:string; publishedOn:string|null;
  timeAsStated:string; dateMeaning:string; registeredSourceId:string|null;
};
const target:{
  [key:string]:{
    projectId:string; sourceId:string; kind:string; scope:string;
    leads:readonly ExpectedLead[];
  }
}={
  "review-m3-2-thompson-falls-q2-expansion":{
    projectId:"prj-us-usac-thompson-falls-expansion",
    sourceId:"src-usac-2026-q2-10q",kind:"construction_progress_reported",scope:"named_facility",
    leads:[
      {key:"earlier_local_construction",role:"independent_local_reporting",
        url:"https://www.scledger.net/story/2025/10/02/news/usac-celebrates-expansion/12856.html",
        publishedOn:"2025-10-02",timeAsStated:"2025-05",dateMeaning:"reported_construction_began_month",registeredSourceId:null},
      {key:"first_furnace_commissioning",role:"original_issuer_statement",
        url:"https://usantimony.com/press-release/united-states-antimony-corporation-provides-status-update-on-new-antimony-smelter/",
        publishedOn:"2026-06-09",timeAsStated:"2026-05",dateMeaning:"issuer_reports_commissioning_began_month",registeredSourceId:null},
      {key:"quarterly_substantial_construction",role:"original_issuer_sec_filing",
        url:"https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/uamy-20260630x10q.htm",
        publishedOn:"2026-08-11",timeAsStated:"2026-Q2",dateMeaning:"issuer_quarterly_substantially_completed_report",
        registeredSourceId:"src-usac-2026-q2-10q"},
      {key:"later_original_field_observation",role:"independent_local_reporting",
        url:"https://www.scledger.net/story/2026/08/27/news/usac-capacity-expands-with-new-t-falls-facility/14209.html",
        publishedOn:"2026-08-27",timeAsStated:"by_2026-08-27",
        dateMeaning:"later_partial_new_furnace_operation_report",registeredSourceId:null},
    ],
  },
  "review-m3-2-cyclic-extended-operations":{
    projectId:"prj-ca-cyclic-kingston-demonstration-plant",
    sourceId:"src-nrcan-cmrdd-programme",kind:"funded_activity_completed",scope:"funded_activity",
    leads:[
      {key:"original_hub100_opening",role:"original_recipient_announcement",
        url:"https://cyclicmaterials.earth/resources/cyclic-materials-opens-hub100-facility-for-production-of-recycled-mixed-rare-earth-oxide",
        publishedOn:"2024-06-06",timeAsStated:"by_2024-06-06",
        dateMeaning:"recipient_hub100_demo_opening_report",registeredSourceId:null},
      {key:"cmrdd_agreement",role:"original_government_registry",
        url:"https://search.open.canada.ca/grants/record/nrcan-rncan%2C115-2024-2025-Q2-15713%2Ccurrent",
        publishedOn:null,timeAsStated:"2024-07-17_to_2026-03-31",
        dateMeaning:"agreement_term_not_physical_completion_day",
        registeredSourceId:"src-canada-grant-cyclic-cmrdd-2024"},
      {key:"separate_future_centre_of_excellence",role:"original_recipient_announcement",
        url:"https://cyclicmaterials.earth/resources/cyclic-materials-announces-usd-25m-investment-to-establish-centre-of-excellence-for-rare-earth-recycling-in-kingston-ontario",
        publishedOn:"2025-06-11",timeAsStated:"target_2026-Q1",
        dateMeaning:"forward_looking_different_project",registeredSourceId:"src-cyclic-centre-excellence-2025"},
      {key:"cmrdd_funded_activity_status",role:"original_government_programme",
        url:"https://www.canada.ca/en/campaign/critical-minerals-in-canada/federal-support-for-critical-mineral-projects-and-value-chains/critical-minerals-research-development-and-demonstration-program.html",
        publishedOn:null,timeAsStated:"2026-03",
        dateMeaning:"funded_extended_operations_reported_completed_month",
        registeredSourceId:"src-nrcan-cmrdd-programme"},
    ],
  },
};
const obj=(x:unknown):x is Record<string,unknown> =>x!==null && typeof x==="object" && !Array.isArray(x);
const keys=(x:Record<string,unknown>,expected:string[]) =>
  Object.keys(x).length===expected.length && expected.every(k=>Object.hasOwn(x,k));
const packetKeys=["schemaVersion","researchedOn","authority","originalBodiesCaptured",
  "originalBodiesAuthenticatedByHuman","m3AdjudicationsPresent","publicationAuthorized","cases"];
const caseKeys=["reviewId","projectId","canonicalSourceId","proposalKind","proposalScope",
  "occurredOn","exactOperationDayKnown","reviewQuestion","leads","checksBeforeDecision"];
const leadKeys=["key","role","registeredSourceId","publisher","url","publishedOn",
  "timeAsStated","dateMeaning","finding","limitation"];
const md=(s:string)=>s.replace(/\s+/g," ").replace(/[\\`*_{}\[\]<>|]/g,"\\$&");

export function buildF5StageReviewerSupplement(packet:unknown, refs:Refs){
  const errors:string[]=[];
  const check=(v:boolean,s:string)=>{if(!v)errors.push(s);};
  const worksheet=buildM3ReviewerPackets(refs.queue,{
    projects:refs.projects,sources:refs.sources,commitments:refs.commitments,
    corpusCutoff:refs.corpusCutoff,publicMilestoneCount:refs.publicMilestoneCount,
  });
  if(!obj(packet))return {errors:["invalid chronology packet"],markdown:null,publicationAuthorized:false as const};
  check(keys(packet,packetKeys),"unexpected metadata/approval field");
  check(packet.schemaVersion==="f5-5-industrial-stage-chronology-v1" &&
    packet.researchedOn==="2026-10-16" &&
    packet.authority==="public_evidence_navigation_only","research schema/authority");
  check(packet.originalBodiesCaptured===false &&
    packet.originalBodiesAuthenticatedByHuman===false &&
    packet.m3AdjudicationsPresent===false &&
    packet.publicationAuthorized===false,"no source-authentication, human signoff or publication");
  const cases=Array.isArray(packet.cases)?packet.cases:[];
  check(cases.length===2,"exactly two bounded case sidecars");
  const found=new Set<string>();
  const lines=[
    "# F5-5 — Supplemental original-stage evidence for existing M3 reviewers","",
    "**UNSIGNED RESEARCH / NOT ORIGINAL-BODY AUTHENTICATION / NO PUBLICATION AUTHORITY**","",
    "The input SHA-256 below is the EXISTING M3 metadata worksheet digest, not a downloaded publisher-file hash.",
    "Read each complete linked original yourself. Only the existing gitignored M3 adjudication controls decisions.","",
  ];
  for(const item of cases){
    if(!obj(item) || typeof item.reviewId!=="string" || !target[item.reviewId]){
      errors.push("unknown or malformed M3 case");continue;
    }
    const id=item.reviewId,spec=target[id];
    check(!found.has(id),"duplicate existing review identity");
    found.add(id);
    const w=worksheet.worksheets.find(x=>x.id===id);
    check(keys(item,caseKeys),"unexpected case authority fields "+id);
    check(item.projectId===spec.projectId && item.canonicalSourceId===spec.sourceId &&
      item.proposalKind===spec.kind && item.proposalScope===spec.scope &&
      item.occurredOn===null && item.exactOperationDayKnown===false,
      "M3 claim, project or undated physical event scope changed "+id);
    check(!!w && w.status==="unsigned_source_review" && w.humanAttestationPresent===false &&
      w.originalSource.id===spec.sourceId && w.project.id===spec.projectId &&
      w.proposedObservation.kind===spec.kind && w.proposedObservation.scope===spec.scope &&
      w.proposedObservation.occurredOn===null,
      "case not bound to exact unsigned canonical M3 worksheet "+id);
    const leads=Array.isArray(item.leads)?item.leads:[];
    check(leads.length===spec.leads.length,"missing/orphan source lead "+id);
    check(typeof item.reviewQuestion==="string" && item.reviewQuestion.length>=75,
      "missing specific review question "+id);
    const questions=Array.isArray(item.checksBeforeDecision)?item.checksBeforeDecision:[];
    check(questions.length===5 && questions.every(x=>typeof x==="string" && x.length>=55),
      "five concrete original-source verification prompts required "+id);
    lines.push("## "+md(w?.project.name??id),"",
      "**Canonical M3 ID:** `"+id+"`",
      "**Current gate:** PENDING / unsigned original-source review",
      "**Original M3 registry source:** `"+spec.sourceId+"`",
      "**Current M3 input metadata digest:** `"+(w?.reviewInputDigestSha256??"missing")+"`",
      "**Physical event day:** UNKNOWN (null)",
      "**Primary reviewer question:** "+md(String(item.reviewQuestion??"")), "",
      "| Source publication | Reported period / type | Original source and key caution |",
      "| --- | --- | --- |");
    for(let i=0;i<leads.length;i++){
      const lead=leads[i],expected=spec.leads[i];
      if(!obj(lead)){errors.push("invalid lead "+id+"/"+i);continue;}
      check(keys(lead,leadKeys),"unexpected source evidence fields "+id+"/"+i);
      for(const key of ["key","role","url","publishedOn","timeAsStated","dateMeaning","registeredSourceId"] as const)
        check(lead[key]===expected[key],"source role/URL/clock/scope drift "+id+"/"+expected.key+"/"+key);
      check(typeof lead.publisher==="string" && lead.publisher.length>=15 &&
        typeof lead.finding==="string" && lead.finding.length>=85 &&
        typeof lead.limitation==="string" && lead.limitation.length>=80,
        "source finding/issuer/limitation too vague "+id+"/"+expected.key);
      const source=refs.sources.filter(s=>s.id===lead.registeredSourceId);
      if(lead.registeredSourceId!==null)
        check(source.length===1 && source[0].url===lead.url &&
          (source[0].datePublished??null)===lead.publishedOn,
          "registered original publisher URL/publication clock mismatch "+id+"/"+expected.key);
      else
        check(refs.sources.every(s=>s.url!==lead.url),
          "unregistered navigation lead silently became canonical "+id+"/"+expected.key);
      lines.push("| "+md(String(lead.publishedOn??"UNKNOWN (in-place page/registry)"))+
        " | "+md(String(lead.timeAsStated))+" — "+md(String(lead.dateMeaning))+
        " | ["+md(String(lead.publisher))+"]("+String(lead.url)+
        ") — "+md(String(lead.finding))+" **LIMIT:** "+md(String(lead.limitation))+" |");
    }
    lines.push("", "**Human source checks (ALL UNCHECKED):**","");
    for(const question of questions) lines.push("- [ ] "+md(String(question)));
    lines.push("", "**M3 decision:** PENDING; not supplied by this report", "", "---", "");
  }
  for(const id of Object.keys(target))check(found.has(id),"missing original M3 review "+id);
  check(refs.projects.some(p=>p.id==="prj-ca-cyclic-kingston-centre-of-excellence") &&
    refs.projects.some(p=>p.id==="prj-ca-cyclic-kingston-demonstration-plant") &&
    refs.projects.some(p=>p.id==="prj-us-usac-thompson-falls-expansion"),
    "distinct Kingston project identities and Thompson facility must be retained");
  check(refs.publicMilestoneCount===0 && worksheet.publicationAuthorized===false &&
    worksheet.automaticSourceApprovalAuthorized===false,
    "unexpected public milestone/publication approval");
  lines.push("Existing M3 authority: `.project-execution-review/adjudications.json` only. "+
    "If any new source is needed, first use a separate editor-authorized source registration and reviewer check. "+
    "No monitored candidate or research lead writes production seeds.");
  return {errors,markdown:errors.length===0?lines.join("\n"):null,publicationAuthorized:false as const};
}
