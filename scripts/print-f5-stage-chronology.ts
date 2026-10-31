/** Print only. Does not fetch web pages, read private reviewer files or write output. */
import packet from "../research/f5/industrial-stage-chronology-original-publishers.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { getAllProjects,getAllSources,getAllFinancialCommitments,getAllProjectMilestones } from "../lib/data";
import { site } from "../lib/site";
import { buildF5StageReviewerSupplement } from "./f5-stage-chronology-review";
const report=buildF5StageReviewerSupplement(packet,{
  queue,projects:getAllProjects(),sources:getAllSources(),
  commitments:getAllFinancialCommitments(),
  corpusCutoff:site.lastUpdated,publicMilestoneCount:getAllProjectMilestones().length,
});
if(report.errors.length||report.markdown===null){
  throw new Error("F5 original-stage review supplement FAILED CLOSED: "+report.errors.join(" | "));
}
process.stdout.write(report.markdown+"\n");
