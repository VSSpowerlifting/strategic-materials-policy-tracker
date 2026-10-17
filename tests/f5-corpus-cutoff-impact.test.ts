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

test("Wagerup curated revision changed only the reviewed milestone: historical corpus dates remain untouched",()=>{
  const current=seeds();
  const frozen=JSON.stringify(current);
  const previous={...current,"project-milestones":[]};
  const historical=auditF5CorpusCutoffImpact(previous,
    candidate.publishedCorpusCutoffAtPreparation,candidate.proposedCorpusCutoff);
  assert.equal(historical.currentPublishedCutoff,"2026-10-09");
  assert.equal(historical.proposedCutoff,"2026-10-17");
  assert.equal(historical.publicationAuthorized,false);
  assert.equal(historical.allExternalSourcesRechecked,false);
  assert.equal(historical.approvalOfAnyNewPolicyOrFinanceEvent,false);
  assert.equal(historical.maintainerReviewRequired,true);
  assert.equal(historical.totalPublicSeedRows,698);
  assert.equal(historical.datasets.length,F5_SEED_NAMES.length);
  assert.equal(historical.datasets.find(d=>d.seed==="project-milestones")?.rows,0);
  assert.equal(historical.datasets.find(d=>d.seed==="sources")?.rows,183);
  assert.equal(historical.countNewlyIncludedDatedFields,0);
  assert.deepEqual(historical.newlyIncludedDatedFields,[]);
  assert.equal(historical.countFutureIntervalEndFields,21);
  assert.deepEqual(
    Object.fromEntries([...new Set(historical.futureIntervalEndFields.map(x=>x.date))].sort()
      .map(date=>[date,historical.futureIntervalEndFields.filter(x=>x.date===date).length])),
    {"2026-11-10":19,"2026-11-27":2},
  );
  assert.equal(historical.countOtherPostCutoffFields,0);
  const currentFull=auditF5CorpusCutoffImpact(current,"2026-10-09","2026-10-17");
  assert.equal(currentFull.totalPublicSeedRows,700);
  assert.equal(currentFull.countNewlyIncludedDatedFields,2,
    "two newly published human review dates appear; other registry rows remain unchanged");
  assert.deepEqual(currentFull.newlyIncludedDatedFields,[{
    seed:"project-milestones",recordId:"mil-au-alcoa-wagerup-groundbreaking-2026-08-24",
    field:"reviewedAt",date:"2026-10-17",
  },{
    seed:"project-milestones",recordId:"mil-ee-neo-narva-commercial-production-reported-2026",
    field:"reviewedAt",date:"2026-10-17",
  }]);
  assert.equal(JSON.stringify(seeds()),frozen);
  assert.equal(site.lastUpdated,"2026-10-17");
});

test("cutoff impact sorts in-window source dates separately from future interval end boundaries",()=>{
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

test("live cutoff audit CLI is read-only at the current authorized corpus date",()=>{
  const output=execFileSync(process.execPath,[
    "--import","tsx","scripts/audit-f5-corpus-cutoff-impact.ts",
    "--proposed-cutoff",site.lastUpdated,
  ],{encoding:"utf8"});
  const parsed=JSON.parse(output);
  assert.equal(parsed.proposedCutoff,"2026-10-17");
  assert.equal(parsed.currentPublishedCutoff,"2026-10-17");
  assert.equal(parsed.totalPublicSeedRows,700);
  assert.equal(parsed.countNewlyIncludedDatedFields,0);
  assert.equal(parsed.countFutureIntervalEndFields,21);
  assert.equal(parsed.publicationAuthorized,false,
    "audit's non-publication flags do not retroactively undo separately authorized source publication");
  assert.equal(parsed.maintainerReviewRequired,true);
});
