/**
 * LOCAL, explicitly interactive human reviewer flow; never a CI workflow.
 * Stores a NEW per-candidate session entirely in the ignored private directory.
 * This deliberately does not alter the prior Wagerup approved review receipt.
 */
import { existsSync, lstatSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import example from "../research/project-execution/m3-2-adjudications.example.json";
import { site } from "../lib/site";
import { getAllFinancialCommitments,getAllProjectMilestones,getAllProjects,getAllSources } from "../lib/data";
import {
  buildGuidedPrivateDecisions, parseGuidedReviewArgs,
  prepareGuidedReview, privateReviewPathFor,
  type HumanReviewInput,
} from "./f5-guided-private-review";
import type { PendingProjectExecutionRow, SourceReviewDecision } from "./adjudicate-project-execution";

const refs={
  projects:getAllProjects(),sources:getAllSources(),commitments:getAllFinancialCommitments(),
  currentPublicMilestones:getAllProjectMilestones(),currentPublicCutoff:site.lastUpdated,
};
function localToday(){
  const d=new Date();
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}

async function main(){
  const {id,proposedCutoff}=parseGuidedReviewArgs(process.argv.slice(2));
  const path=privateReviewPathFor(id);
  const {worksheet:w}=prepareGuidedReview(queue as PendingProjectExecutionRow[],refs,id,proposedCutoff);
  // Never place private evidence outside an explicitly ignored directory or
  // follow a symlink to an untracked/unknown target. Refuse existing files.
  if(existsSync(path))throw new Error("Existing private review session found at "+path+"; not overwriting it. Preserve genuine reviewer records");
  if(existsSync(".project-execution-review") && lstatSync(".project-execution-review").isSymbolicLink())
    throw new Error("Private reviewer directory must not be a symlink");
  const ignored=spawnSync("git",["check-ignore","-q",path],{stdio:"ignore"});
  if(ignored.error || ignored.status!==0)
    throw new Error("Review path is not gitignored. Refusing to create local reviewer data");
  if(!stdin.isTTY || !stdout.isTTY)
    throw new Error("Source-review decisions require an interactive human TTY, not a pipeline or CI run");

  console.log("\nF5 ORIGINAL-SOURCE HUMAN REVIEW — LOCAL / PRIVATE / NO PUBLICATION");
  console.log("Public corpus revision:",site.lastUpdated);
  console.log("HYPOTHETICAL proposed cutoff:",proposedCutoff,"(NOT an authorized revision)");
  console.log("Source:",w.originalSource.title);
  console.log("Original URL:",w.originalSource.url);
  console.log("Publisher:",w.originalSource.publisher);
  console.log("Source publication:",w.originalSource.publishedOn??"UNKNOWN");
  console.log("Exact claim:",w.proposedObservation.originalStatement);
  console.log("Pinpoint:",w.proposedObservation.locator);
  console.log("Event occurredOn:",w.proposedObservation.occurredOn??"UNKNOWN — do not invent");
  console.log("Proposed kind:",w.proposedObservation.kind);
  console.log("Scope:",w.proposedObservation.scope,w.proposedObservation.scopeAsStated??"");
  console.log("Caution:",w.editorialCaution);
  console.log("\nYOU must open and personally read the original publisher document.");
  console.log("Worksheet SHA (registry metadata, NOT original-file authentication):");
  console.log(w.reviewInputDigestSha256);
  console.log("\nOld Wagerup receipts and other review sessions are left untouched.");

  const rl=createInterface({input:stdin,output:stdout});
  const ask=async (prompt:string)=> (await rl.question(prompt)).trim();
  try{
    const verdict=await ask("Your actual verdict (approved / rejected / needs_more_evidence): ");
    if(!["approved","rejected","needs_more_evidence"].includes(verdict))
      throw new Error("Invalid or missing verdict; no decision saved");
    const reviewedBy=await ask("Your actual reviewer name: ");
    const reviewedAt=await ask("Actual review date (YYYY-MM-DD): ");
    console.log("Confirm each check from your own full-source reading. Answer y or n; none is prechecked.");
    const prompts=[
      ["fullSourceRead","I read the complete original publisher source"],
      ["quotedPassageMatches","I checked that the quoted passage matches the source"],
      ["scopeIsExplicit","I checked the exact facility/workstream scope"],
      ["eventAndEvidenceDatesSeparated","I separated the physical event date from publication/access dates"],
      ["noFinancingOrOperationsInference","I excluded unsupported finance/disbursement/operating inferences"],
    ] as const;
    const checks={} as HumanReviewInput["checks"];
    for(const [key,label] of prompts){
      const answer=(await ask(label+" (y/n): ")).toLowerCase();
      if(answer!=="y" && answer!=="n")throw new Error("Every check needs an explicit y or n; nothing saved");
      checks[key]=answer==="y";
    }
    const rationale=await ask("Your own rationale explaining what the original source does / does not support: ");
    const proposedMilestoneId=verdict==="approved"?
      await ask("Nominate a NEW mil-... ID (proposal only, never public automatically): "):null;
    console.log("Manually copy the SHA from the worksheet above; no automatic fingerprint attestation.");
    const manuallyCopiedDigest=await ask("Exact worksheet SHA-256: ");
    const entered:HumanReviewInput={
      verdict:verdict as HumanReviewInput["verdict"],reviewedBy,reviewedAt,rationale,
      checks,proposedMilestoneId,manuallyCopiedDigest,
    };
    const decisions=buildGuidedPrivateDecisions(
      queue as PendingProjectExecutionRow[],example as unknown as SourceReviewDecision[],refs,
      id,proposedCutoff,localToday(),entered,
    );
    const confirmation=await ask("Save this exact PRIVATE decision only (type SAVE; no publication): ");
    if(confirmation!=="SAVE")throw new Error("No explicit save confirmation; no file written");
    mkdirSync(".project-execution-review",{recursive:true,mode:0o700});
    const temporary=path+".tmp";
    if(existsSync(temporary))throw new Error("Temporary review file already exists; stop before overwrite");
    try{
      writeFileSync(temporary,JSON.stringify(decisions,null,2)+"\n",{encoding:"utf8",flag:"wx",mode:0o600});
      if(existsSync(path))throw new Error("Private review target appeared while saving; refusing overwrite");
      renameSync(temporary,path);
    }catch(err){
      // Never delete or alter someone else's private review; an orphan .tmp is
      // ignored and can be safely handled by the human reviewer later.
      throw err;
    }
    console.log("\nPrivate human decision saved:",path);
    console.log("Verdict:",entered.verdict,"— the public milestone seed is UNCHANGED.");
    console.log("Other six candidate decisions remain PENDING in this session.");
    console.log("Read-only next check (DOES NOT PUBLISH):");
    console.log("npm run review:f5-release -- --proposed-cutoff "+proposedCutoff+" --file "+path);
    console.log("A separate human release decision, source review and exact-head publication PR are still required.");
  }finally{rl.close()}
}
main().catch(e=>{console.error("Guided review stopped:",e instanceof Error?e.message:String(e));process.exitCode=2});
