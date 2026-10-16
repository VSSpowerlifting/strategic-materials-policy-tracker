import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

type Run = {
 id:number;status:string;conclusion:string|null;head_branch:string;
 event:string;run_attempt:number;
};
type Artifact = {
 name:string;expired:boolean;size_in_bytes:number;workflow_run:{id:number};
};
const good=(id:number,attempt=1):Run=>({
 id,status:"completed",conclusion:"success",head_branch:"main",
 event:"schedule",run_attempt:attempt,
});
const pair=(id:number,attempt=1):Artifact[]=>[
 {name:`smpt-exim-state-${id}-${attempt}`,expired:false,size_in_bytes:1856,workflow_run:{id}},
 {name:`smpt-exim-report-${id}-${attempt}`,expired:false,size_in_bytes:1962,workflow_run:{id}},
];
function recoveryScript():string{
 const workflow=readFileSync(".github/workflows/exim-shadow-monitor.yml","utf8");
 const start=workflow.indexOf("          script: |\n");
 assert.ok(start>0,"expected the existing github-script state recovery block");
 const after=workflow.slice(start+"          script: |\n".length);
 const end=after.indexOf("\n      - name: Restore EXIM identities");
 assert.ok(end>0,"expected following existing restore step");
 const lines=after.slice(0,end).split("\n");
 assert.ok(lines.every(x=>!x.trim()||x.startsWith("            ")));
 return lines.map(x=>x.startsWith("            ")?x.slice(12):x).join("\n");
}
async function recover(runs:Run[],artifacts:Map<number,Artifact[]>,currentRunId=900){
 const outputs:{key:string;value:string}[]=[];
 const warnings:string[]=[];
 const scanned:number[]=[];
 const github={rest:{actions:{
  async listWorkflowRuns(args:Record<string,unknown>){
   assert.deepEqual(args,{
    owner:"VSSpowerlifting",repo:"strategic-materials-policy-tracker",
    workflow_id:"exim-shadow-monitor.yml",branch:"main",per_page:70,
   });
   return {data:{workflow_runs:runs}};
  },
  async listWorkflowRunArtifacts(args:Record<string,unknown>){
   assert.equal(args.owner,"VSSpowerlifting");
   assert.equal(args.repo,"strategic-materials-policy-tracker");
   assert.equal(args.per_page,100);
   const id=args.run_id as number;scanned.push(id);
   return {data:{artifacts:artifacts.get(id)??[]}};
  },
 }}};
 const core={
  setOutput:(key:string,value:string)=>outputs.push({key,value}),
  warning:(msg:string)=>warnings.push(msg),
  info:(_msg:string)=>undefined,
 };
 const context={runId:currentRunId,repo:{owner:"VSSpowerlifting",repo:"strategic-materials-policy-tracker"}};
 const script="(async()=>{\n"+recoveryScript()+"\n})()";
 const result=runInNewContext(script,{github,core,context},{timeout:1000});
 await result;
 return {outputs,warnings,scanned};
}
test("EXIM restore selects newest successful run with exact same-attempt state AND report",async()=>{
 const actual=await recover([good(12,2),good(11) ],
  new Map([[12,pair(12,2)],[11,pair(11)]]));
 assert.deepEqual(actual.outputs,[
  {key:"run_id",value:"12"},
  {key:"name",value:"smpt-exim-state-12-2"},
 ]);
 assert.deepEqual(actual.scanned,[12]);
 assert.deepEqual(actual.warnings,[]);
});
test("failed completed run can re-upload previously restored artifacts, but NEVER grants continuity authority",async()=>{
 const failed={...good(20),conclusion:"failure"};
 const done=await recover([failed,good(19)],new Map([[20,pair(20)],[19,pair(19)]]));
 assert.deepEqual(done.scanned,[19]);
 assert.deepEqual(done.outputs[0],{key:"run_id",value:"19"});
});
test("cancelled/in-progress, PR, nonmain and invalid-attempt runs cannot become an accepted source state",async()=>{
 const invalid=[
  {...good(20),conclusion:"cancelled"},
  {...good(21),status:"in_progress",conclusion:null},
  {...good(22),head_branch:"research/work"},
  {...good(23),event:"pull_request"},
  {...good(24),event:"workflow_run"},
  {...good(25),run_attempt:0},
  {...good(26),run_attempt:1.5},
  good(900),
 ];
 const map=new Map(invalid.map(x=>[x.id,pair(x.id,x.run_attempt)]));
 map.set(27,pair(27));
 const done=await recover([...invalid,good(27)],map);
 assert.deepEqual(done.scanned,[27]);
 assert.equal(done.outputs[0]?.value,"27");
});
test("success without report or state, wrong attempt, expiry, duplicate or cross-run artifact is refused",async()=>{
 const bad=[
  pair(50).slice(0,1),
  pair(51).slice(1),
  [pair(52)[0],pair(52,2)[1]],
  pair(53).map((x,i)=>i===1?{...x,expired:true}:x),
  pair(54).map((x,i)=>i===0?{...x,size_in_bytes:0}:x),
  [...pair(55),pair(55)[0]],
  pair(56).map((x,i)=>i===1?{...x,workflow_run:{id:999}}:x),
 ];
 const map=new Map(bad.map((a,i)=>[i+50,a]));
 map.set(30,pair(30));
 const runs=[...bad.map((_,i)=>good(i+50)),good(30)];
 const done=await recover(runs,map);
 assert.deepEqual(done.scanned,runs.map(x=>x.id));
 assert.equal(done.warnings.length,bad.length);
 assert.deepEqual(done.outputs[0],{key:"run_id",value:"30"});
 assert.deepEqual(done.outputs[1],{key:"name",value:"smpt-exim-state-30-1"});
});
test("no independently successful artifact pair means NO restore, not a fabricated bootstrap",async()=>{
 const done=await recover([good(40),{...good(41),conclusion:"failure"}],
  new Map([[40,pair(40).slice(0,1)],[41,pair(41)]]));
 assert.deepEqual(done.outputs,[]);
 assert.deepEqual(done.scanned,[40]);
 const wf=readFileSync(".github/workflows/exim-shadow-monitor.yml","utf8");
 assert.match(wf,/if: steps\.state\.outputs\.run_id != ''/);
 assert.match(wf,/No EXIM state artifact found; only explicitly authorized first baseline may run/);
 assert.match(wf,/Enforce healthy and gap-free collection/);
 assert.match(wf,/name: smpt-exim-state-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
 assert.match(wf,/name: smpt-exim-report-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
 assert.match(wf,/retention-days: 30/);
 assert.match(wf,/concurrency:\n  group: smpt-exim-shadow-monitor\n  cancel-in-progress: false/);
});
test("recovery remains EXIM-only, source-read-only and does not schedule a new timer or change financing",()=>{
 const wf=readFileSync(".github/workflows/exim-shadow-monitor.yml","utf8");
 const js=recoveryScript();
 assert.match(js,/run\.conclusion !== 'success'/);
 assert.match(js,/run\.head_branch !== 'main'/);
 assert.match(js,/run\.event/);
 assert.match(js,/reportName/);
 assert.doesNotMatch(js,/data\/seed|uploadArtifact|writeFile|rebaseline|finance/);
 assert.match(wf,/    - cron: "7 14 \* \* \*"/);
 assert.match(wf,/contents: read/);
 assert.match(wf,/actions: read/);
 assert.doesNotMatch(wf,/contents: write/);
});
