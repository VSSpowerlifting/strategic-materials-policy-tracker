import test from "node:test";
import assert from "node:assert/strict";

import {buildProgrammeTrail} from "@/lib/programme-research-trail";
import {programmeLedger} from "@/lib/capital-intelligence";
import {getAllOrganizations,getAllProjects,getAllProgrammes,getAllSources} from "@/lib/data";
import {getSourceUses} from "@/lib/source-usage";

const input=()=>({
 organisations:getAllOrganizations(),projects:getAllProjects(),programmes:getAllProgrammes(),
 sourceEntries:getAllSources().map(source=>({source,uses:getSourceUses(source.id)})),
});
const trace=(id:string)=>buildProgrammeTrail(programmeLedger(id)!,input());

test("all twelve schemes have exact ledger row identities, not inferred programme funding",()=>{
 const programmes=getAllProgrammes();
 assert.equal(programmes.length,12);
 for(const p of programmes){
  const ledger=programmeLedger(p.id)!,trail=trace(p.id);
  assert.equal(trail.id,p.id);
  assert.deepEqual(trail.finance.map(r=>r.id).sort(),ledger.rows.map(r=>r.id).sort());
  assert.deepEqual(trail.designations.map(r=>r.id).sort(),ledger.designations.map(r=>r.id).sort());
  assert.equal(new Set(trail.finance.map(r=>r.id)).size,trail.finance.length);
  assert.equal(new Set(trail.designations.map(r=>r.id)).size,trail.designations.length);
  assert.equal(new Set(trail.distinctProjectIds).size,trail.distinctProjectIds.length);
  assert.equal(new Set(trail.distinctSourceIds).size,trail.distinctSourceIds.length);
 }
});

test("each source link belongs to the exact displayed finance/designation/programme record",()=>{
 for(const p of getAllProgrammes()){
  const t=trace(p.id);
  const links=[
   ...t.programmeSources.map(s=>({s,kind:"programme",id:p.id})),
   ...t.finance.flatMap(f=>f.sources.map(s=>({s,kind:"capital",id:f.id}))),
   ...t.designations.flatMap(d=>d.sources.map(s=>({s,kind:"designation",id:d.id}))),
  ];
  for(const {s,kind,id} of links){
   const use=getSourceUses(s.id).find(u=>u.kind===kind&&u.id===id);
   assert.ok(use,"Source must explicitly cite "+kind+":"+id+" using "+s.id);
   assert.deepEqual(s.roles,use.roles);
   assert.ok(s.publisher&&s.title);
  }
  assert.ok(t.programmeSources.length>0,"Each registered scheme includes source evidence: "+p.id);
  assert.ok(t.finance.every(f=>f.sources.length>0),"Every financed row must have direct sources");
  assert.ok(t.designations.every(d=>d.sources.length>0),"Every recognition row must have direct sources");
 }
});

test("Canadian parent and child share the SAME IDs, not additive payments",()=>{
 const parent=trace("prg-ca-cms"),child=trace("prg-ca-cmrdd");
 assert.ok(parent.finance.length>child.finance.length);
 for(const row of child.finance){
  const inherited=parent.finance.find(r=>r.id===row.id)!;
  assert.ok(inherited);
  assert.equal(inherited.inheritedFromChild,true);
  assert.equal(inherited.programme.id,child.id);
  assert.deepEqual(inherited.sources,row.sources);
 }
 const own=parent.finance.filter(r=>!r.inheritedFromChild);
 assert.ok(own.length>0);
 assert.ok(own.every(r=>r.programme.id===parent.id));
});

test("EU critical minerals recognition has project and original-source links but no invented payment",()=>{
 const t=trace("prg-eu-crma-strategic-projects");
 assert.ok(t.designations.length>20);
 assert.equal(t.finance.length,0);
 for(const d of t.designations){
  assert.ok(d.project.href.startsWith("/projects/prj-"));
  assert.ok(d.sources.some(s=>s.roles.some(role=>role.includes("Field evidence"))));
  assert.ok(d.holders.every(h=>h.href.startsWith("/organizations/org-")));
 }
 const unique=new Set(t.designations.map(d=>d.project.id));
 assert.equal(t.distinctProjectIds.length,unique.size);
});

test("programme finance rows retain exact legal value roles and statuses, not a paid/approved flag",()=>{
 const tax=trace("prg-au-cmpti");
 assert.equal(tax.finance.length,1);
 const f=tax.finance[0];
 assert.equal(f.valueRole,"commitment");
 assert.equal(f.financialStatus,"authorized");
 assert.equal(f.amountAsStated,null);
 assert.equal(f.project,null,"Tax programme shall not imply a physical project");
 assert.equal(f.sharedProjects.length,0);
 assert.ok(f.providerAsStated?.includes("Australia"));
});

test("original provider/recipient links are taken only from named organization IDs",()=>{
 const t=trace("prg-us-chips-incentives");
 assert.ok(t.finance.length>0);
 for(const f of t.finance){
  assert.ok(f.providers.every(o=>o.href==="/organizations/"+o.id));
  assert.ok(f.recipients.every(o=>o.href==="/organizations/"+o.id));
 }
 const real=programmeLedger(t.id)!.rows;
 for(const f of t.finance){
  const row=real.find(r=>r.id===f.id)!;
  assert.deepEqual(f.providers.map(o=>o.id),row.providerOrgIds);
  assert.deepEqual(f.recipients.map(o=>o.id),row.recipientOrgIds);
  assert.equal(f.project?.id??null,row.projectId);
  assert.deepEqual(f.sharedProjects.map(o=>o.id),row.associatedProjectIds??[]);
 }
});

test("synthetic multi-project row cannot allocate capital to one project and rejects mixed linkage",()=>{
 const id="prg-us-chips-incentives",real=programmeLedger(id)!,row=real.rows[0];
 const projects=getAllProjects().slice(0,2).map(p=>p.id);
 const synthetic={
  ...real,rows:real.rows.map(r=>r.id===row.id
   ?{...r,projectId:null,associatedProjectIds:projects}
   :r),
 };
 const t=buildProgrammeTrail(synthetic,input());
 const f=t.finance.find(r=>r.id===row.id)!;
 assert.equal(f.project,null);
 assert.deepEqual(f.sharedProjects.map(p=>p.id),projects);
 assert.throws(()=>buildProgrammeTrail({
  ...real,rows:real.rows.map(r=>r.id===row.id?{...r,projectId:projects[0],associatedProjectIds:projects}:r),
 },input()),/Attributable and shared project references mixed/);
});

test("unresolved entity, publication source, duplicate rows and foreign programme scope fail closed",()=>{
 const id="prg-us-chips-incentives",l=programmeLedger(id)!,data=input();
 const row=l.rows[0],changed=(c:typeof row)=>({...l,rows:l.rows.map(r=>r.id===row.id?c:r)});
 assert.throws(()=>buildProgrammeTrail(changed({...row,providerOrgIds:["org-not-registered"]}),data),
   /Unresolved organization link/);
 assert.throws(()=>buildProgrammeTrail({...l,rows:[...l.rows,l.rows[0]]},data),
   /Duplicate programme financial row/);
 assert.throws(()=>buildProgrammeTrail(changed({...row,programmeId:"prg-au-cmf"}),data),
   /Financial row outside programme scope/);
 assert.throws(()=>buildProgrammeTrail(l,{...data,sourceEntries:[]}),
   /Missing direct citation/);
 assert.throws(()=>buildProgrammeTrail(l,{...data,projects:[]}),
   /Unresolved project link/);
});

test("trail is immutable, deterministic, and never uses private F5 milestone reviews",()=>{
 const data=input(),l=programmeLedger("prg-ca-cms")!,before=structuredClone(l);
 const a=buildProgrammeTrail(l,data);
 const b=buildProgrammeTrail(l,{
  organisations:[...data.organisations].reverse(),
  projects:[...data.projects].reverse(),
  programmes:[...data.programmes].reverse(),
  sourceEntries:[...data.sourceEntries].reverse(),
 });
 assert.deepEqual(a,b);
 assert.deepEqual(l,before);
 const encoded=JSON.stringify(a);
 assert.ok(!encoded.includes("private_review"));
 assert.ok(!encoded.includes("adjudication"));
 assert.ok(!encoded.includes(".project-execution-review"));
});

test("programme directory offers trace link and detail page presents server-rendered source trail",async()=>{
 const {readFile}=await import("node:fs/promises");
 const page=await readFile("app/programmes/[id]/page.tsx","utf8");
 const index=await readFile("components/programmes-explorer.tsx","utf8");
 const component=await readFile("components/programme-research-trail.tsx","utf8");
 assert.match(page,/buildProgrammeTrail/);
 assert.match(page,/ProgrammeResearchTrail/);
 assert.ok(!page.includes("useSearchParams"));
 assert.match(index,/#research-pathway/);
 assert.match(component,/data-testid="programme-finance-path"/);
 assert.match(component,/data-testid="programme-designation-path"/);
 assert.match(component,/\/sources\//);
});
