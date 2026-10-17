/** Print only. Does not fetch web pages, read private reviewer files or write output. */
import packet from "../research/f5/industrial-evidence-pilot-chronology.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { getAllProjects,getAllSources,getAllFinancialCommitments,getAllProjectMilestones } from "../lib/data";
import { site } from "../lib/site";
import { buildF5IndustrialEvidence } from "./f5-industrial-evidence";
const report=buildF5IndustrialEvidence(packet,{
  queue,projects:getAllProjects(),sources:getAllSources(),
  commitments:getAllFinancialCommitments(),
  corpusCutoff:site.lastUpdated,publicMilestoneCount:getAllProjectMilestones().length,
});
if(report.errors.length||report.markdown===null){
  throw new Error("F5-1 industrial evidence FAILED CLOSED: "+report.errors.join(" | "));
}
if(process.argv.includes("--json")){
  process.stdout.write(JSON.stringify({
    cases:report.cases,taxonomyBlocked:report.taxonomyBlocked,
    publicationAuthorized:report.publicationAuthorized,errors:report.errors,
  },null,2)+"\n");
}else process.stdout.write(report.markdown+"\n");
