/**
 * Read-only, nonpublishing F5 Industrial Outcome Observatory research scaffold.
 *
 * npm run audit:f5-observatory
 * npm run audit:f5-observatory -- --json
 * npm run audit:f5-observatory -- --project prj-ee-neo-rare-earth-magnet-project
 * npm run audit:f5-observatory -- --strict
 *
 * No public routes, writes, network calls, human approvals or export side effects.
 */
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { site } from "../lib/site";
import {
  buildF5ObservatoryScaffold, formatF5ObservatoryScaffold,
} from "../lib/f5-observatory-scaffold";

const usage="Usage: npm run audit:f5-observatory -- [--json] [--strict] [--project prj-id]";
const args=process.argv.slice(2);
let json=false, strict=false, project:string|null=null;
for(let i=0;i<args.length;i++){
  const arg=args[i];
  if(arg==="--json"&&!json){json=true;continue;}
  if(arg==="--strict"&&!strict){strict=true;continue;}
  if(arg==="--project"&&project===null&&args[i+1]&&/^prj-[a-z0-9-]+$/.test(args[i+1])){
    project=args[++i];continue;
  }
  console.error(usage);
  process.exit(2);
}

try {
  const all=buildF5ObservatoryScaffold({
    events:getAllEvents(),
    finances:getAllFinancialCommitments(),
    controls:getAllControlMeasures(),
    designations:getAllProjectDesignations(),
    projects:getAllProjects(),
    milestones:getAllProjectMilestones(),
    sources:getAllSources(),
  },site.lastUpdated);
  if(project!==null&&!all.cases.some(c=>c.comparison.projectId===project))
    throw new Error("Project is outside the approved internal Observatory cohort: "+project);
  const shown=project===null?all:{...all,cases:all.cases.filter(c=>c.comparison.projectId===project)};
  process.stdout.write(json?JSON.stringify(shown,null,2)+"\n":formatF5ObservatoryScaffold(shown));
  if(strict&&!all.allCasefilesEligibleForManualQa)process.exitCode=1;
} catch(error){
  console.error("F5 Observatory scaffold refused: "+
    (error instanceof Error?error.message:String(error)));
  process.exitCode=1;
}
