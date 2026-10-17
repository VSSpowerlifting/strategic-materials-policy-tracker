/**
 * Public-release observability: compare deterministic LOCAL published seed data
 * with actual production HTTP JSON. Read-only; no deploy, publish or approvals.
 *
 * Intentionally verifies DATA parity, not the actual Vercel deployment SHA.
 * Commit identity requires a separate trusted Vercel/GitHub deployment receipt.
 */
import { isDeepStrictEqual } from "node:util";
import { buildDataset } from "./export";
import {
  getAllProjectMilestones,getProjectMilestonesByProject,getSourcesByIds,
} from "./data";
import type { ProjectMilestone, Source } from "./types";

export type ExpectedPublicRelease = {
  dataset: ReturnType<typeof buildDataset>;
  milestones: ProjectMilestone[];
  projects: {id:string; milestones:ProjectMilestone[]; milestoneSources:Source[]}[];
};

export type ReleaseParityIssue = {
  endpoint:string;
  code:"http_status" | "invalid_json" | "network_error" | "payload_mismatch" | "source_mismatch";
  detail:string;
};
export type ReleaseParityReport = {
  schemaVersion:"smpt-production-data-parity-1";
  status:"in_sync" | "stale_or_mismatched" | "unreachable";
  publicOnly:true;
  deploymentShaVerified:false;
  publicationAuthorized:false;
  checkedEndpoints:string[];
  expectedCuratedCorpusCutoff:string;
  expectedPublishedMilestoneCount:number;
  issues:ReleaseParityIssue[];
  caveat:string;
};
export type PublicHttpResponse = {status:number;body:unknown;error?:string};
export type PublicHttpFetcher = (path:string)=>Promise<PublicHttpResponse>;

export function expectedPublicRelease():ExpectedPublicRelease {
  const milestones=getAllProjectMilestones();
  const projectIds=[...new Set(milestones.map(m=>m.projectId))].sort();
  return {
    dataset:buildDataset(),milestones,
    projects:projectIds.map(id=>{
      const projectMilestones=getProjectMilestonesByProject(id);
      return {
        id,milestones:projectMilestones,
        milestoneSources:getSourcesByIds([...new Set(projectMilestones.map(m=>m.sourceId))]),
      };
    }),
  };
}

/** Fail closed on missing/incorrect public data, without inferring delivery state from an HTTP response. */
export async function checkPublicReleaseParity(
  expected:ExpectedPublicRelease,
  get:PublicHttpFetcher,
):Promise<ReleaseParityReport>{
  const checkedEndpoints:string[]=[];
  const issues:ReleaseParityIssue[]=[];
  const examine=async(path:string,expectedPayload:unknown,mode:"exact"|"project"="exact")=>{
    checkedEndpoints.push(path);
    let result:PublicHttpResponse;
    try{result=await get(path)}catch(err){
      issues.push({endpoint:path,code:"network_error",detail:err instanceof Error?err.message:"Public HTTP request could not complete"});
      return;
    }
    if(result.error){
      issues.push({endpoint:path,code:"invalid_json",detail:result.error});
      return;
    }
    if(result.status!==200){
      issues.push({endpoint:path,code:"http_status",detail:"Expected HTTP 200, received "+result.status+
        (result.status===404?" (this can mean an older production deployment)": "")});
      return;
    }
    if(mode==="exact"){
      if(!isDeepStrictEqual(result.body,expectedPayload))
        issues.push({endpoint:path,code:"payload_mismatch",
          detail:"Production JSON differs from this checked-out repo's published seed/export schema"});
      return;
    }
    if(!result.body || typeof result.body!=="object" || Array.isArray(result.body)){
      issues.push({endpoint:path,code:"payload_mismatch",detail:"Project endpoint does not return an object"});
      return;
    }
    const view=result.body as Record<string,unknown>;
    const reference=expectedPayload as ExpectedPublicRelease["projects"][number];
    if(!isDeepStrictEqual(view.reviewedProjectMilestones,reference.milestones))
      issues.push({endpoint:path,code:"payload_mismatch",
        detail:"Project native milestones are missing, extra, or differ from canonical public seed"});
    if(!isDeepStrictEqual(view.reviewedMilestoneSources,reference.milestoneSources))
      issues.push({endpoint:path,code:"source_mismatch",
        detail:"Reviewed milestone original-publisher source metadata do not match canonical register"});
    if(!Array.isArray(view.layers) || !Array.isArray(view.associatedRowIds) ||
       !Object.prototype.hasOwnProperty.call(view,"latestImplementation"))
      issues.push({endpoint:path,code:"payload_mismatch",
        detail:"Legacy financial lanes are missing from project response; do not conflate them with physical delivery"});
  };
  await examine("/api/v1/project-milestones",expected.milestones);
  await examine("/api/export/dataset.json",expected.dataset);
  for(const p of expected.projects)
    await examine("/api/v1/projects/"+encodeURIComponent(p.id),p,"project");
  const unreachable=issues.some(x=>x.code==="network_error" || x.code==="invalid_json");
  return {
    schemaVersion:"smpt-production-data-parity-1",
    status:unreachable?"unreachable":issues.length?"stale_or_mismatched":"in_sync",
    publicOnly:true,deploymentShaVerified:false,publicationAuthorized:false,
    checkedEndpoints,expectedCuratedCorpusCutoff:expected.dataset.generatedAt,
    expectedPublishedMilestoneCount:expected.milestones.length,issues,
    caveat:"Public HTTP data parity is not verification of the exact Vercel deployment SHA, all-source freshness, original document authentication, cash disbursement, physical operations or publication authorization.",
  };
}

/** HTTPS-only check of a public domain. No tokens, cookies, writes or Vercel deployment API calls. */
export function publicHttpsFetcher(
  origin:string,
  networkFetch:typeof fetch=fetch,
):PublicHttpFetcher {
  const parsed=new URL(origin);
  if(parsed.protocol!=="https:" || parsed.username || parsed.password ||
    parsed.search || parsed.hash || parsed.pathname!=="/")
    throw new Error("Production parity requires a plain HTTPS site origin with no credentials, path or query");
  const base=parsed.origin;
  return async path=>{
    const url=new URL(path,base);
    if(url.origin!==base || !path.startsWith("/api/"))
      throw new Error("Only same-origin, public SMPT API paths may be checked");
    const response=await networkFetch(url,{method:"GET",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(12000)});
    if(response.status!==200) return {status:response.status,body:null};
    let body:unknown;
    try{body=await response.json()}catch{return {status:response.status,body:null,error:"Non-JSON response or invalid JSON returned by public endpoint"};}
    return {status:response.status,body};
  };
}
