import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
 FINANCIAL_STATUS_DEFS,VALUE_ROLE_DEFS,CAPITAL_SOURCE_DEFS,CONTROL_STATUS_DEFS,
} from "@/lib/capital-vocabulary";
import {
 FINANCIAL_STATUSES,VALUE_ROLES,CAPITAL_SOURCES,CONTROL_STATUSES,
} from "@/lib/types";
import {financialStatusLabels,valueRoleLabels} from "@/lib/labels";
import {getAllFinancialCommitments} from "@/lib/data";
import {explainFinancialRecord} from "@/lib/financial-reading";

const corpus=()=>getAllFinancialCommitments();
const find=(id:string)=>{const c=corpus().find(x=>x.id===id);assert.ok(c,id);return c};

test("the entire methodology vocabulary has exactly one definition for every official category",()=>{
 for(const [values,defs] of [
  [VALUE_ROLES,VALUE_ROLE_DEFS],[FINANCIAL_STATUSES,FINANCIAL_STATUS_DEFS],
  [CAPITAL_SOURCES,CAPITAL_SOURCE_DEFS],[CONTROL_STATUSES,CONTROL_STATUS_DEFS],
 ] as const){
  assert.deepEqual(Object.keys(defs).sort(),[...values].sort());
  assert.ok(Object.values(defs).every(s=>s.trim().length>12));
 }
 assert.match(FINANCIAL_STATUS_DEFS.contracted,/not necessarily an obligation of funds/);
 assert.match(VALUE_ROLE_DEFS.indication,/not money committed/);
 assert.match(VALUE_ROLE_DEFS.funding_option,/never summed/);
});

test("all 96 published finance records receive exact role/status explanations with no semantic reassignment",()=>{
 const rows=corpus();
 assert.equal(rows.length,96);
 for(const c of rows){
  const before=structuredClone(c),reading=explainFinancialRecord(c);
  const current=c.financialStatusHistory.at(-1)!.status;
  assert.equal(reading.role.label,valueRoleLabels[c.valueRole]);
  assert.equal(reading.role.definition,VALUE_ROLE_DEFS[c.valueRole]);
  assert.equal(reading.status.label,financialStatusLabels[current]);
  assert.equal(reading.status.definition,FINANCIAL_STATUS_DEFS[current]);
  assert.equal(reading.boundary.length>20,true);
  assert.ok(reading.linkage&&reading.payment);
  assert.deepEqual(c,before);
 }
});

test("contracted is never declared paid or a proven obligation of funds",()=>{
 const c=find("fin-au-arafura-nolans-2025-equity");
 assert.equal(c.financialStatusHistory.at(-1)?.status,"contracted");
 const x=explainFinancialRecord(c);
 assert.match(x.payment,/does not itself establish a cash payment/);
 assert.match(x.status.definition,/not necessarily an obligation/);
 assert.doesNotMatch(x.payment,/money has been paid out/);
});

test("partial and complete payment words only follow exact recorded disbursement statuses",()=>{
 const rows=corpus();
 const partial=rows.find(c=>c.financialStatusHistory.at(-1)?.status==="partially_disbursed")!;
 const paid=rows.find(c=>c.financialStatusHistory.at(-1)?.status==="disbursed")!;
 assert.match(explainFinancialRecord(partial).payment,/partial payment/);
 assert.match(explainFinancialRecord(partial).payment,/not establish that the full/);
 assert.match(explainFinancialRecord(paid).payment,/records disbursement/);
 assert.match(explainFinancialRecord(paid).payment,/does not establish physical construction/);
});

test("option is not counted as a drawn commitment even when its agreement is contracted",()=>{
 const c=find("fin-us-dod-mp-2025-additional-preferred-option");
 assert.equal(c.valueRole,"funding_option");
 assert.equal(c.financialStatusHistory.at(-1)?.status,"contracted");
 const x=explainFinancialRecord(c);
 assert.match(x.payment,/not exercise or payment/);
 assert.match(x.payment,/separate drawn commitment/);
 assert.match(x.boundary,/not included.*commitment totals/);
});

test("indications and ceilings are never described as committed money or evidence of spending",()=>{
 for(const role of ["indication","program_envelope","lending_authority","budget_appropriation"] as const){
  const c=corpus().find(row=>row.valueRole===role)!;
  assert.ok(c);
  const x=explainFinancialRecord(c);
  assert.match(x.boundary,/not included/);
  assert.match(x.role.definition,/ceiling|money set aside|non-binding/i);
 }
 const indication=find("fin-ca-g7-2025-nmg-edc-letter-of-interest");
 assert.match(explainFinancialRecord(indication).role.definition,/not money committed/);
});

test("private finance is not attributed to a government solely because the record is a commitment",()=>{
 const source=corpus().find(x=>x.valueRole==="commitment"&&x.capitalSource==="private");
 assert.ok(source);
 assert.match(explainFinancialRecord(source).boundary,/not automatically a government commitment/);
});

test("shared unallocated versus direct project references preserve the same project boundaries",()=>{
 const shared=find("fin-jp-jare-lynas-2023-equity");
 const s=explainFinancialRecord(shared);
 assert.match(s.linkage,/shared and unallocated/);
 assert.match(s.linkage,/No portion can be assigned/);
 const direct=find("fin-au-alcoa-sojitz-gallium-2025-equity");
 assert.match(explainFinancialRecord(direct).linkage,/One registered project is linked directly/);
 const noProject=find("fin-au-cmf-2026-expanded-facility");
 assert.match(explainFinancialRecord(noProject).linkage,/No direct registered project association/);
});

test("ended statuses do not retroactively erase previous payment observations",()=>{
 const lapsed=find("fin-us-dod-mp-2025-bank-financing");
 const x=explainFinancialRecord(lapsed);
 assert.match(x.payment,/does not erase previous history/);
 const fake={...lapsed,financialStatusHistory:[...lapsed.financialStatusHistory,
  {...lapsed.financialStatusHistory[0],status:"withdrawn" as const}]};
 assert.match(explainFinancialRecord(fake).payment,/does not erase previous history/);
});

test("conflicting, duplicate or absent record identity data fails closed",()=>{
 const shared=find("fin-jp-jare-lynas-2023-equity");
 const direct=find("fin-au-alcoa-sojitz-gallium-2025-equity");
 assert.throws(()=>explainFinancialRecord({...direct,associatedProjectIds:["a","b"]}),
  /directly allocated and shared/);
 assert.throws(()=>explainFinancialRecord({...shared,associatedProjectIds:["a","a"]}),
  /Duplicate unallocated project association/);
 assert.throws(()=>explainFinancialRecord({...direct,financialStatusHistory:[]}),
  /without a recorded status/);
});

test("same authoritative definitions power methodology and every relevant public reading surface",async()=>{
 const method=await readFile("app/methodology/page.tsx","utf8");
 const page=await readFile("app/capital/[id]/page.tsx","utf8");
 const ui=await readFile("components/capital/reading-guide.tsx","utf8");
 assert.match(method,/from "@\/lib\/capital-vocabulary"/);
 assert.ok(!method.includes("const FINANCIAL_STATUS_DEFS:"));
 assert.ok(!method.includes("const VALUE_ROLE_DEFS:"));
 assert.match(page,/<RecordReadingGuide record=\{c\} \/>/);
 assert.match(ui,/What the evidence says — and does not say/);
 assert.match(ui,/role:\{label/); // dynamic role read model is bound in the glossary
 assert.match(ui,/FINANCIAL_STATUS_DEFS\.contracted/);
 for(const [path,topic] of [
  ["app/capital/page.tsx","capital"],
  ["app/projects/page.tsx","projects"],
  ["app/programmes/page.tsx","programmes"],
 ]){
  assert.match(await readFile(path,"utf8"),new RegExp('ResearchReadingKey topic="'+topic+'"'));
 }
 assert.match(ui,/Obligation is not an SMPT financial-status label/);
 assert.match(ui,/\/methodology#capital-counting/);
});
