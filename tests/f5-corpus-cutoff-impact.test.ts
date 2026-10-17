import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {execFileSync} from "node:child_process";
import candidate from "../research/project-execution/release-candidates/wagerup-groundbreaking-2026-10-17.json";
import {site} from "../lib/site";
import {auditF5CorpusCutoffImpact,F5_SEED_NAMES,type SeedInput}
  from "../scripts/audit-f5-corpus-cutoff-impact";

const seeds=():SeedInput=>Object.fromEntries(F5_SEED_NAMES.map(seed=>[
  seed,JSON.parse(readFileSync(join(process.cwd(),"data","seed",seed+".json"),"utf8")),
]));
const minimal=():Record<string,unknown[]>=>Object.fromEntries(F5_SEED_NAMES.map(seed=>[seed,[]]));

test("Wagerup proposed date does not claim to authenticate fresh source updates across corpus",()=>{
  const original=JSON.stringify(seeds());
  const current=seeds();
  const report=auditF5CorpusCutoffImpact(current,site.lastUpdated,candidate.proposedCorpusCutoff);
  assert.equal(report.schemaVersion,"f5-prospective-corpus-cutoff-impact-1");
  assert.equal(report.currentPublishedCutoff,"2026-10-09");
  assert.equal(report.proposedCutoff,"2026-10-17");
  assert.equal(report.publicationAuthorized,false);
  assert.equal(report.maintainerReviewRequired,true);
  assert.equal(report.allExternalSourcesRechecked,false);
  assert.equal(report.approvalOfAnyNewPolicyOrFinanceEvent,false);
  assert.equal(report.totalPublicSeedRows,698);
  assert.equal(report.datasets.length,F5_SEED_NAMES.length);
  assert.equal(report.datasets.find(d=>d.seed==="project-milestones")?.rows,0);
  assert.equal(report.datasets.find(d=>d.seed==="sources")?.rows,183);
  assert.equal(report.countNewlyIncludedDatedFields,0,
    "new dated evidence requires separate full-corpus editorial assessment");
  assert.deepEqual(report.newlyIncludedDatedFields,[]);
  assert.equal(report.countFutureIntervalEndFields,21,
    "current control suspension expiry dates remain future context, not new events");
  assert.equal(report.countOtherPostCutoffFields,0);
  assert.ok(report.futureIntervalEndFields.every(f=>
    f.seed==="control-measures"&&f.field.endsWith(".until")&&f.date==="2026-11-10"));
  assert.equal(JSON.stringify(seeds()),original,"audit may not modify any seed arrays");
  assert.equal(site.lastUpdated,"2026-10-09",
    "candidate PR cannot quietly advance public corpus revision");
});

test("cutoff impact sorts and distinguishes in-window source evidence from future status horizons",()=>{
  const input=minimal();
  input["sources"]=[
    {id:"src-a",datePublished:"2026-10-10",dateAccessed:"2026-10-16"},
    {id:"src-b",datePublished:"2026-10-18",dateAccessed:"2026-10-18"},
  ];
  input["control-measures"]=[
    {id:"ctl-a",statusHistory:[{status:"suspended",date:"2026-10-11",until:"2026-11-10"}]},
  ];
  const r=auditF5CorpusCutoffImpact(input,"2026-10-09","2026-10-17");
  assert.equal(r.countNewlyIncludedDatedFields,3);
  assert.equal(r.countFutureIntervalEndFields,1);
  assert.equal(r.countOtherPostCutoffFields,2);
  assert.deepEqual(r.newlyIncludedDatedFields.map(x=>x.seed+":"+x.recordId+":"+x.field),[
    "control-measures:ctl-a:statusHistory[0].date",
    "sources:src-a:dateAccessed",
    "sources:src-a:datePublished",
  ]);
  assert.ok(r.afterProposedCutoffFields.every(x=>x.seed==="sources"));
  assert.equal(r.publicationAuthorized,false);
});

test("cutoff impact rejects missing public seed arrays and invalid/backdated dates",()=>{
  const all=minimal();
  assert.throws(()=>auditF5CorpusCutoffImpact(all,"2026-10-09","2026-10-08"),/cutoff impact: dates/);
  assert.throws(()=>auditF5CorpusCutoffImpact(all,"2026-10-09","2026-10-32"),/cutoff impact: dates/);
  delete all["sources"];
  assert.throws(()=>auditF5CorpusCutoffImpact(all,"2026-10-09","2026-10-17"),/missing public seed array sources/);
});

test("actual cutoff audit CLI remains read-only and reports identical candidate date",()=>{
  const output=execFileSync(process.execPath,[
    "--import","tsx","scripts/audit-f5-corpus-cutoff-impact.ts",
    "--proposed-cutoff",candidate.proposedCorpusCutoff,
  ],{encoding:"utf8"});
  const parsed=JSON.parse(output);
  assert.equal(parsed.proposedCutoff,candidate.proposedCorpusCutoff);
  assert.equal(parsed.totalPublicSeedRows,698);
  assert.equal(parsed.countNewlyIncludedDatedFields,0);
  assert.equal(parsed.publicationAuthorized,false);
  assert.equal(parsed.maintainerReviewRequired,true);
});
