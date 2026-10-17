/**
 * Manual, read-only HTTP check of the published deterministic corpus.
 * This is NOT Vercel deployment-SHA attestation and NEVER triggers a deploy.
 *
 * npm run audit:production-parity -- --origin https://strategic-materials-policy-tracker.vercel.app
 * npm run audit:production-parity -- --json
 */
import {
  checkPublicReleaseParity,expectedPublicRelease,publicHttpsFetcher,
} from "../lib/production-release-parity";

const defaultOrigin="https://strategic-materials-policy-tracker.vercel.app";
const help="Usage: npm run audit:production-parity -- [--origin https://your-production-domain] [--json]";
async function main(){
  const args=process.argv.slice(2);
  let origin=defaultOrigin,explicitOrigin=false,json=false;
  for(let i=0;i<args.length;i++){
    const flag=args[i];
    if(flag==="--json"&&!json){json=true;continue}
    if(flag==="--origin"&&!explicitOrigin&&args[i+1]&&!args[i+1].startsWith("--")){
      origin=args[++i];explicitOrigin=true;continue;
    }
    throw new Error(help);
  }
  const expected=expectedPublicRelease();
  const report=await checkPublicReleaseParity(expected,publicHttpsFetcher(origin));
  if(json){
    process.stdout.write(JSON.stringify({site:origin,...report},null,2)+"\n");
  }else{
    const lines=[
      "SMPT READ-ONLY PUBLIC DATA RELEASE PARITY",
      "Checked origin: "+origin,
      "Result: "+report.status.toUpperCase(),
      "Current repo's expected curated cutoff: "+report.expectedCuratedCorpusCutoff,
      "Current repo's expected approved industrial milestones: "+report.expectedPublishedMilestoneCount,
      "Endpoints checked: "+report.checkedEndpoints.join(", "),
      ...report.issues.map(x=>"ISSUE "+x.code+" at "+x.endpoint+": "+x.detail),
      report.caveat,
      "No deployments, Vercel API calls, publication or source-review approvals occurred.",
    ];
    process.stdout.write(lines.join("\n")+"\n");
  }
  process.exitCode=report.status==="in_sync"?0:report.status==="stale_or_mismatched"?1:2;
}
main().catch(error=>{
  console.error("Production parity check could not run:",error instanceof Error?error.message:String(error));
  process.exitCode=2;
});
