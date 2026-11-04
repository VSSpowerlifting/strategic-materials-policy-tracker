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
// The 3 November 2026 revision added the October 2026 EU Strategic Projects
// event, its five sources and the projects, designations and organisations
// evidenced only by them. Removing them restores the 17 October row set.
const EU_CRMA_2026_EVENT="evt-eu-crma-strategic-projects-2026-10";
const EU_CRMA_2026_SOURCES=new Set(["src-abr-abn-96621530185","src-borme-c-2025-4584",
  "src-ec-crma-sp-annex-2026-10","src-ec-crma-sp-decision-2026-10","src-ec-rep-lu-2026-10-09",
  "src-eurlex-dec-2026-2349"]);
type Row={id:string;eventId?:string;evidence?:{sourceId:string}[]};
// Preserve historical cutoff snapshots when later, separately reviewed corpus
// expansions add rows. This explicitly enumerated cohort may not retroactively
// change the 17 October or 3 November 2026 release evidence.
const DOE_2026_SELECTION_IDS=new Set([
  "evt-us-doe-battery-round3-selections-2026",
  "evt-us-doe-byproduct-pilots-selections-2026",
  "src-us-doe-battery-round3-2026-08",
  "src-us-doe-battery-processing-round3",
  "src-us-doe-battery-manufacturing-round3",
  "src-us-doe-industrial-byproducts-2026-08",
]);
const KOREA_BRAZIL_EXPANSION_IDS=new Set([
  "evt-br-bndes-finep-minerals-2025",
  "evt-br-bndes-piaui-2026",
  "evt-kr-motir-rare-earths-2026",
  "src-br-bndes-finep-select-2025-06",
  "src-br-bndes-piaui-2026-07",
  "src-br-bndes-machines-services",
  "src-kr-motir-rare-earths-2026-02",
  "org-br-bndes",
  "org-br-piaui-niquel-metais",
  "prj-br-piaui-niquel",
  "prg-br-bndes-maquinas-servicos",
  "fin-br-bndes-piaui-niquel-2026",
  "brazil",
  "korea",
]);
const withoutKoreaBrazilExpansion=(s:SeedInput):SeedInput=>
  Object.fromEntries(Object.entries(s).map(([name,rows])=>[
    name,(rows as Row[]).filter(r=>!KOREA_BRAZIL_EXPANSION_IDS.has(r.id) && !DOE_2026_SELECTION_IDS.has(r.id)),
  ]));
const evidencedOnlyByEuCrma2026=(r:Row)=>!!r.evidence?.length&&r.evidence.every(e=>EU_CRMA_2026_SOURCES.has(e.sourceId));
const withoutEuCrma2026=(s:SeedInput):SeedInput=>({...s,
  events:(s.events as Row[]).filter(r=>r.id!==EU_CRMA_2026_EVENT),
  sources:(s.sources as Row[]).filter(r=>!EU_CRMA_2026_SOURCES.has(r.id)),
  "project-designations":(s["project-designations"] as Row[]).filter(r=>r.eventId!==EU_CRMA_2026_EVENT),
  projects:(s.projects as Row[]).filter(r=>!evidencedOnlyByEuCrma2026(r)),
  organizations:(s.organizations as Row[]).filter(r=>!evidencedOnlyByEuCrma2026(r)),
});

test("Wagerup curated revision changed only the reviewed milestone: historical corpus dates remain untouched",()=>{
  const frozen=JSON.stringify(seeds());
  const current=withoutEuCrma2026(withoutKoreaBrazilExpansion(seeds()));
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
});

test("3 November revision adds only the October 2026 EU Strategic Projects rows and their review dates",()=>{
  const full=seeds();
  const current=withoutKoreaBrazilExpansion(full);
  const frozen=JSON.stringify(full);
  assert.equal(auditF5CorpusCutoffImpact(withoutEuCrma2026(current),"2026-10-09","2026-10-17").totalPublicSeedRows,700);
  const r=auditF5CorpusCutoffImpact(current,"2026-10-17","2026-11-03");
  assert.equal(r.totalPublicSeedRows,782);
  assert.equal(r.datasets.find(d=>d.seed==="project-designations")?.rows,59);
  assert.equal(r.datasets.find(d=>d.seed==="sources")?.rows,189);
  assert.deepEqual([...new Set(r.newlyIncludedDatedFields.map(x=>x.recordId))].sort(),
    [EU_CRMA_2026_EVENT,...EU_CRMA_2026_SOURCES].sort(),
    "no existing record is silently re-dated by the revision");
  assert.equal(r.countNewlyIncludedDatedFields,10);
  assert.equal(r.countOtherPostCutoffFields,0);
  assert.equal(r.countFutureIntervalEndFields,21);
  assert.equal(r.publicationAuthorized,false);
  assert.equal(JSON.stringify(seeds()),frozen);
  assert.equal(site.lastUpdated,"2026-11-04");
});

test("4 November revision contains only dated admissions from source-reviewed expansion batches",()=>{
  const snapshot=seeds();
  const candidate=auditF5CorpusCutoffImpact(snapshot,"2026-11-03","2026-11-04");
  assert.equal(candidate.totalPublicSeedRows,802);
  assert.equal(candidate.countNewlyIncludedDatedFields,11,
    "eight new source access dates and three reviewed Korean/Brazilian event dates");
  assert.equal(candidate.countOtherPostCutoffFields,0);
  assert.deepEqual(candidate.afterProposedCutoffFields,[]);
  assert.deepEqual([...new Set(candidate.newlyIncludedDatedFields.map(r=>r.recordId))].sort(),[
    "evt-br-bndes-finep-minerals-2025",
    "evt-br-bndes-piaui-2026",
    "evt-kr-motir-rare-earths-2026",
    "src-br-bndes-finep-select-2025-06",
    "src-br-bndes-machines-services",
    "src-br-bndes-piaui-2026-07",
    "src-kr-motir-rare-earths-2026-02",
    "src-us-doe-battery-manufacturing-round3",
    "src-us-doe-battery-processing-round3",
    "src-us-doe-battery-round3-2026-08",
    "src-us-doe-industrial-byproducts-2026-08",
  ].sort());
  assert.equal(candidate.publicationAuthorized,false,
    "source metadata audit alone never authorizes publication");
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
  assert.equal(parsed.proposedCutoff,"2026-11-04");
  assert.equal(parsed.currentPublishedCutoff,"2026-11-04");
  assert.equal(parsed.totalPublicSeedRows,802);
  assert.equal(parsed.countOtherPostCutoffFields,0,
    "Newly reviewed November 4 record dates must be within the authorized revision cutoff");
  assert.deepEqual(parsed.afterProposedCutoffFields,[]);
  assert.equal(parsed.countNewlyIncludedDatedFields,0);
  assert.equal(parsed.countFutureIntervalEndFields,21);
  assert.equal(parsed.publicationAuthorized,false,
    "audit's non-publication flags do not retroactively undo separately authorized source publication");
  assert.equal(parsed.maintainerReviewRequired,true);
});
