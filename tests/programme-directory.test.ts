import test from "node:test";
import assert from "node:assert/strict";
import {buildProgrammeDirectory,filterProgrammeDirectory,normalizeProgrammeQuery} from "@/lib/programme-directory";
import {programmeLedger} from "@/lib/capital-intelligence";
import {getAllProgrammes,getAllOrganizations} from "@/lib/data";

const snapshot=()=>{
 const programmes=getAllProgrammes();
 const ledgers=programmes.map(p=>({id:p.id,ledger:programmeLedger(p.id)!}));
 const orgs=new Map(getAllOrganizations().map(o=>[o.id,o.name]));
 return {programmes,ledgers,orgs};
};
const current=()=>{const s=snapshot();return buildProgrammeDirectory(s.programmes,s.ledgers,s.orgs)};
test("programme directory exactly covers public programmes with distinct IDs and deterministic order",()=>{
 const {programmes}=snapshot(),rows=current();
 assert.equal(rows.length,programmes.length);
 assert.equal(new Set(rows.map(p=>p.id)).size,programmes.length);
 assert.deepEqual(new Set(rows.map(p=>p.id)),new Set(programmes.map(p=>p.id)));
 assert.deepEqual(rows.map(p=>p.id),[...rows].sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:a.id<b.id?-1:1).map(p=>p.id));
});
test("every row preserves programmeLedger evidence classification without inventing programme spend",()=>{
 for(const p of current()){
  const ledger=programmeLedger(p.id)!;
  assert.equal(p.envelopeCount,ledger.envelopes.length);
  assert.equal(p.publicCommitmentCount,ledger.recordedAwards?.rows.length??0);
  assert.equal(p.otherFinanceCount,ledger.otherLayers.reduce((n,l)=>n+l.rows.length,0));
  assert.equal(p.designationCount,ledger.designations.length);
  assert.equal(p.envelopeLabels.length,p.envelopeCount);
  assert.equal(p.includesDescendants,ledger.children.length>0);
  assert.equal(p.hasNamedAdministrator,ledger.programme.administeringOrgIds.length>0);
  assert.equal(p.parentId,ledger.parent?.id??null);
 }
});
test("parent and child programmes share inherited evidence rather than count it twice as awards",()=>{
 const rows=current(),parent=rows.find(p=>p.id==="prg-ca-cms")!;
 const child=rows.find(p=>p.id==="prg-ca-cmrdd")!;
 assert.ok(parent.childIds.includes(child.id));
 assert.equal(child.parentId,parent.id);
 assert.equal(parent.includesDescendants,true);
 assert.ok(parent.publicCommitmentCount>=child.publicCommitmentCount);
 const parentLedger=programmeLedger(parent.id)!,childLedger=programmeLedger(child.id)!;
 const parentIds=new Set(parentLedger.rows.map(c=>c.id));
 for(const row of childLedger.rows)assert.ok(parentIds.has(row.id));
 assert.ok(childLedger.rows.length>0);
});
test("designation scheme is a recognition mechanism, with no public award inferred",()=>{
 const rows=current(),eu=rows.find(p=>p.id==="prg-eu-crma-strategic-projects")!;
 assert.ok(eu.designationCount>0);
 assert.equal(eu.publicCommitmentCount,0);
 assert.ok(filterProgrammeDirectory(rows,{evidence:"designation"}).some(p=>p.id===eu.id));
 assert.ok(!filterProgrammeDirectory(rows,{evidence:"public_commitment"}).some(p=>p.id===eu.id));
});
test("filters cover government, kind, administrator evidence and distinct relationship categories",()=>{
 const rows=current();
 const au=filterProgrammeDirectory(rows,{actor:"australia"});
 assert.ok(au.length>0&&au.every(p=>p.actor==="australia"));
 const grants=filterProgrammeDirectory(rows,{kind:"grant_programme"});
 assert.ok(grants.length>0&&grants.every(p=>p.kind==="grant_programme"));
 const named=filterProgrammeDirectory(rows,{administrator:"named"});
 const unstated=filterProgrammeDirectory(rows,{administrator:"unstated"});
 assert.equal(named.length+unstated.length,rows.length);
 assert.ok(named.every(p=>p.hasNamedAdministrator));
 assert.ok(unstated.every(p=>!p.hasNamedAdministrator));
 for(const [key,field] of [["ceiling","envelopeCount"],["public_commitment","publicCommitmentCount"],
   ["designation","designationCount"],["other","otherFinanceCount"]] as const){
   const matches=filterProgrammeDirectory(rows,{evidence:key});
   assert.ok(matches.length>0,key);
   assert.ok(matches.every(p=>p[field]>0));
 }
 const none=filterProgrammeDirectory(rows,{evidence:"none"});
 assert.deepEqual(none,rows.filter(p=>!p.envelopeCount&&!p.publicCommitmentCount&&!p.designationCount&&!p.otherFinanceCount));
});
test("text search resolves registered original names, administering bodies and legal authorities only",()=>{
 const rows=current();
 assert.ok(filterProgrammeDirectory(rows,{q:"Critical Minerals Facility",actor:"australia"}).some(p=>p.id==="prg-au-cmf"));
 assert.ok(filterProgrammeDirectory(rows,{q:"Department of Industry",actor:"australia"}).some(p=>p.id==="prg-au-cmsr"));
 assert.ok(filterProgrammeDirectory(rows,{q:"Future Made in Australia"}).some(p=>p.id==="prg-au-cmpti"));
 assert.equal(filterProgrammeDirectory(rows,{q:"definitely-no-such-programme-000"}).length,0);
 assert.equal(normalizeProgrammeQuery("   Énergie   "), "energie");
});
test("input identity, scope and orphan reference errors fail closed",()=>{
 const s=snapshot(),rows=current(),before=structuredClone(rows);
 filterProgrammeDirectory(rows,{evidence:"public_commitment",q:"critical"});
 assert.deepEqual(rows,before);
 assert.deepEqual(
  buildProgrammeDirectory([...s.programmes].reverse(),[...s.ledgers].reverse(),s.orgs),
  rows);
 assert.throws(()=>buildProgrammeDirectory([...s.programmes,s.programmes[0]],s.ledgers,s.orgs),/Duplicate programme registry ID/);
 assert.throws(()=>buildProgrammeDirectory(s.programmes,s.ledgers.slice(1),s.orgs),/Missing programme ledger/);
 assert.throws(()=>buildProgrammeDirectory(s.programmes,[...s.ledgers,s.ledgers[0]],s.orgs),/Duplicate programme ledger ID/);
 assert.throws(()=>buildProgrammeDirectory(s.programmes,[...s.ledgers,{id:"prg-unknown",ledger:s.ledgers[0].ledger}],s.orgs),/Unknown programme ledger ID/);
 const altered=s.programmes.map((p,i)=>i===0?{...p,parentProgrammeId:"prg-unknown"}:p);
 assert.throws(()=>buildProgrammeDirectory(altered,s.ledgers,s.orgs),/Unresolved programme parent/);
 const noAdmins=new Map(s.orgs);
 const withAdmin=s.programmes.find(p=>p.administeringOrgIds.length>0)!;
 noAdmins.delete(withAdmin.administeringOrgIds[0]);
 assert.throws(()=>buildProgrammeDirectory(s.programmes,s.ledgers,noAdmins),/Unknown programme administrator/);
});
test("programme page remains server-rendered and exports and accessible filters remain",async()=>{
 const {readFile}=await import("node:fs/promises");
 const page=await readFile("app/programmes/page.tsx","utf8");
 const explorer=await readFile("components/programmes-explorer.tsx","utf8");
 assert.match(page,/ProgrammesExplorer/);
 assert.ok(!page.includes("useSearchParams"));
 assert.match(explorer,/aria-live="polite"/);
 assert.match(explorer,/data-testid="programme-record"/);
 assert.match(explorer,/Clear filters/);
 assert.match(page,/\/api\/export\/programmes.csv/);
 assert.match(explorer,/includesDescendants/);
});
