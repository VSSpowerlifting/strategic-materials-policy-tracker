import test from "node:test";
import assert from "node:assert/strict";

import { financialAmountOn, financialStatusOn, totalCommitments } from "@/lib/capital-control";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments, getAllJurisdictions,
  getAllMaterials, getAllOrganizations, getAllProgrammes, getAllProjectDesignations,
  getAllProjects, getAllSources, getFinancialCommitmentById,
} from "@/lib/data";
import { validateCapitalControl } from "@/scripts/validate-capital-control";
import type { FinancialCommitment } from "@/lib/types";

const ID="fin-us-doe-thacker-pass-atvm-2024";
const ORIGINAL="src-doe-thacker-pass-2024";
const AMENDMENT="src-sec-lac-doe-amendment-announcement-2025-10-07";
const ORIGINAL_AGREEMENT="src-sec-lac-thacker-loan-agreement-2024";
const LATER_CONFIRMATION="src-sec-lac-thacker-q2-2026";
const loan=()=>getFinancialCommitmentById(ID)!;

test("F4-A: operative-as-of amount is sourced, qualified and stays on one legal loan",()=>{
  const c=loan();
  assert.ok(c);
  assert.deepEqual(c.financialAmountHistory?.map(x=>[x.reason,x.effectiveNotBefore,x.effectiveNoLaterThan,x.sourceId]),[
    ["original","2024-10-28","2024-10-28",ORIGINAL],
    ["amendment","2025-10-07","2025-10-20",AMENDMENT],
  ]);
  assert.deepEqual(financialAmountOn(c,"2024-10-27"),{kind:"not_yet_evidenced"});
  for(const d of ["2024-10-28","2025-10-06"]){
    const amount=financialAmountOn(c,d);
    assert.equal(amount.kind,"quantified");
    if(amount.kind!=="quantified")continue;
    assert.equal(amount.amount.value,"2260000000");
    assert.equal(amount.amount.qualifier,"approximately");
    assert.equal(amount.sourceId,ORIGINAL);
  }
  for(const d of ["2025-10-07","2025-10-08","2025-10-19"]){
    assert.deepEqual(financialAmountOn(c,d),{
      kind:"indeterminate_transition",
      earliest:"2025-10-07",latest:"2025-10-20",sourceId:AMENDMENT,
      effectiveNotBeforeEvidence: c.financialAmountHistory![1].effectiveNotBeforeEvidence,
      effectiveNoLaterThanEvidence: c.financialAmountHistory![1].effectiveNoLaterThanEvidence,
    },"conditional signing is not an exact operative transition at "+d);
  }
  for(const d of ["2025-10-20","2026-06-30","2026-10-08"]){
    const amount=financialAmountOn(c,d);
    assert.equal(amount.kind,"quantified");
    if(amount.kind!=="quantified")continue;
    assert.equal(amount.amount.value,"2230000000");
    assert.equal(amount.amount.qualifier,"approximately");
    assert.equal(amount.sourceId,AMENDMENT);
  }
  assert.equal(financialStatusOn(c,"2025-10-19"),"contracted");
  assert.equal(financialStatusOn(c,"2025-10-20"),"partially_disbursed");
  assert.equal(c.financialAmountHistory?.length,2,"cash advances are not independent facility amount versions");
});

test("F4-A: the public current amount, rows, statuses and counting remain unchanged",()=>{
  const c=loan();
  const now=financialAmountOn(c,"2026-06-30");
  assert.equal(now.kind,"quantified");
  if(now.kind==="quantified")assert.deepEqual(now.amount,c.amount);
  assert.equal(c.amount?.value,"2230000000");
  assert.deepEqual(c.financialStatusHistory.map(s=>[s.status,s.date]),[
    ["contracted","2024-10-28"],["partially_disbursed","2025-10-20"],
  ]);
  assert.equal(getAllFinancialCommitments().filter(x=>x.id===ID).length,1);
  const totals=totalCommitments([c],getAllFinancialCommitments());
  const usd=totals.currencies.find(x=>x.currency==="USD");
  assert.ok(usd && usd.status==="summed");
  assert.deepEqual(usd.countedIds,[ID]);
  const asLoan=usd.instruments.find(x=>x.instrument==="loan");
  assert.deepEqual(asLoan?.byQualifier,{approximately:"2230000000"});
});

test("F4-A: unreviewed legacy rows never silently inherit present-day amounts historically",()=>{
  const other=getFinancialCommitmentById("fin-eu-eib-2024-keliber-loan")!;
  assert.ok(other && !other.financialAmountHistory);
  assert.deepEqual(financialAmountOn(other,"2024-12-20"),{kind:"history_unreviewed",currentAmount:other.amount});
  assert.deepEqual(financialAmountOn(other,"2020-01-01"),{kind:"history_unreviewed",currentAmount:other.amount});
  const c=structuredClone(loan());
  c.financialAmountHistory![1].amount=null;
  assert.equal(financialAmountOn(c,"2025-10-20").kind,"unquantified","null is not zero");
});

const all=getAllFinancialCommitments();
function problems(mutator:(row:FinancialCommitment)=>void){
  const commitments=structuredClone(all);
  const row=commitments.find(x=>x.id===ID)!;
  mutator(row);
  const result=validateCapitalControl({
    financialCommitments:commitments,controlMeasures:getAllControlMeasures(),
    organizations:getAllOrganizations(),projects:getAllProjects(),
    programmes:getAllProgrammes(),projectDesignations:getAllProjectDesignations(),
    corpus:{events:getAllEvents(),sources:getAllSources(),materials:getAllMaterials(),jurisdictions:getAllJurisdictions()},
    today:"2026-10-08",
  });
  return result.errors.filter(x=>x.recordId===ID).map(x=>x.code+"@"+x.field);
}

test("F4-A: committed version series passes normal source/chronology validation",()=>{
  assert.deepEqual(problems(()=>{}),[]);
});

test("F4-A: schema refuses current amount mismatch and inaccurate operative intervals",()=>{
  assert.ok(problems(r=>{r.financialAmountHistory![1].amount!.value="2250000000";}).includes("incoherent_value@financialAmountHistory"));
  assert.ok(problems(r=>{r.financialAmountHistory![1].effectiveNotBefore="2025-10-21";}).includes("incoherent_value@financialAmountHistory[1].effectiveNoLaterThan"));
  assert.ok(problems(r=>{r.financialAmountHistory![1].effectiveNotBefore="2024-10-28";}).includes("status_chronology@financialAmountHistory[1].effectiveNotBefore"));
  assert.ok(problems(r=>{r.financialAmountHistory=[];}).includes("incoherent_value@financialAmountHistory"));
  assert.ok(problems(r=>{r.financialAmountHistory![0].reason="amendment";}).includes("incoherent_value@financialAmountHistory[0].reason"));
  assert.ok(problems(r=>{r.financialAmountHistory![1].amount!.currency="EUR";}).includes("incoherent_value@financialAmountHistory[1].amount.currency"));
});

test("F4-A: version sources require their own explicit amount evidence",()=>{
  const errors=problems(r=>{r.financialAmountHistory![1].sourceId="src-sec-lac-thacker-amendment-2025";});
  assert.ok(errors.includes("missing_same_source_evidence@financialAmountHistory[1].sourceId"),errors.join(", "));
  const missing=problems(r=>{r.financialAmountHistory![1].sourceId="src-invented-amendment";});
  assert.ok(missing.includes("unresolved_reference@financialAmountHistory[1].sourceId"),missing.join(", "));
});

test("F4-A: independent bound sources are preserved in all amount responses",()=>{
  const c=loan();
  const [original, amendment]=c.financialAmountHistory!;
  assert.equal(original.effectiveNotBeforeEvidence.sourceId,ORIGINAL_AGREEMENT);
  assert.equal(original.effectiveNoLaterThanEvidence.sourceId,ORIGINAL_AGREEMENT);
  assert.equal(amendment.effectiveNotBeforeEvidence.sourceId,AMENDMENT);
  assert.equal(amendment.effectiveNoLaterThanEvidence.sourceId,LATER_CONFIRMATION);
  const before=financialAmountOn(c,"2024-10-28");
  assert.equal(before.kind,"quantified");
  if(before.kind==="quantified") assert.deepEqual(before.effectiveNoLaterThanEvidence,original.effectiveNoLaterThanEvidence);
  const after=financialAmountOn(c,"2025-10-20");
  assert.equal(after.kind,"quantified");
  if(after.kind==="quantified") assert.deepEqual(after.effectiveNoLaterThanEvidence,amendment.effectiveNoLaterThanEvidence);
});

test("F4-A: historical input must be a real full calendar day, including unreviewed rows",()=>{
  for(const invalid of ["2025-2-1","2025-02","2025-02-30","not-a-date","2025-10-20T00:00:00Z","2025-13-01"]) {
    assert.throws(()=>financialAmountOn(loan(),invalid),RangeError);
    assert.throws(()=>financialAmountOn(getFinancialCommitmentById("fin-eu-eib-2024-keliber-loan")!,invalid),RangeError);
  }
  assert.equal(financialAmountOn(loan(),"2024-02-29").kind,"not_yet_evidenced");
});

test("F4-A: each independently evidenced operative bound requires a real linked source",()=>{
  const missing=problems(r=>{r.financialAmountHistory![1].effectiveNoLaterThanEvidence.sourceId="src-invented-bound";});
  assert.ok(missing.includes("unresolved_reference@financialAmountHistory[1].effectiveNoLaterThanEvidence.sourceId"),missing.join(", "));
  const unrelated=getAllSources().find(s=>!loan().evidence.some(e=>e.sourceId===s.id))!;
  assert.ok(unrelated);
  const absent=problems(r=>{r.financialAmountHistory![1].effectiveNoLaterThanEvidence.sourceId=unrelated.id;});
  assert.ok(absent.includes("missing_same_source_evidence@financialAmountHistory[1].effectiveNoLaterThanEvidence.sourceId"),absent.join(", "));
});
