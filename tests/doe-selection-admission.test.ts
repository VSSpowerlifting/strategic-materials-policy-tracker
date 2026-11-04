import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getAllFinancialCommitments, getAllOrganizations, getAllProjectMilestones,
  getAllProjects, getAllProgrammes, getAllSources, getEventById, getMaterialBySlug,
} from "../lib/data";
import { isBackingRow, layerOf, projectStack } from "../lib/capital-intelligence";
import { publicCommitmentRows, totalCommitments } from "../lib/capital-control";
import { explainFinancialRecord } from "../lib/financial-reading";

const eventId = "evt-us-doe-battery-round3-selections-2026";
const pilotId = "evt-us-doe-byproduct-pilots-selections-2026";
const finance = () => getAllFinancialCommitments().filter(r => r.valueRole === "selected_proposal");
const manifest = () => JSON.parse(readFileSync("research/doe-august-2026-cohorts.json", "utf8")) as {
  candidates: {candidateId:string;cohort:string;proposedFederalShareUSD:number|null}[];
  cohorts: {announcedSelectedCount:number;announcedTotalSelectedFederalShareUSD:number}[];
};
const proposals = () => JSON.parse(readFileSync("research/doe-august-2026-project-proposals.json", "utf8")) as {
  reviewState:string;
  proposedProjects:{id:string;sponsorOrgIds:string[]}[];
  proposedOrganizations:{id:string}[];
};

test("two DOE selection events cite official sources and carry no publication dates", () => {
  const sources = getAllSources();
  const a = getEventById(eventId)!;
  const b = getEventById(pilotId)!;
  assert.equal(a.date, "2026-08-20");
  assert.equal(b.date, "2026-08-18");
  assert.equal(a.lifecycle.publishedAt, null);
  assert.equal(b.lifecycle.publishedAt, null);
  for (const event of [a,b]) for (const id of event.sourceIds) {
    const source = sources.find(s => s.id === id);
    assert.ok(source, id);
    assert.equal(source.sourceType, "official");
    assert.equal(source.confidence, "primary");
  }
  assert.ok(getMaterialBySlug("lithium")!.eventIds.includes(eventId));
  assert.ok(!getMaterialBySlug("lithium")!.eventIds.includes(pilotId));
});

test("the seven Round 3 DOE shares are individually documented and remain noncommitted", () => {
  const rows=finance();
  assert.equal(rows.length,7);
  assert.equal(new Set(rows.map(r=>r.id)).size,7);
  assert.deepEqual([...new Set(rows.map(r=>r.eventId))],[eventId]);
  assert.equal(rows.reduce((n,r)=>n+Number(r.amount!.value),0),500000000);
  assert.deepEqual(rows.map(r=>Number(r.amount!.value)).sort((a,b)=>a-b),
    [50000000,50000000,50000000,50000000,100000000,100000000,100000000]);
  assert.ok(rows.every(r=>r.instrument==="grant"&&r.capitalSource==="public"&&r.providerJurisdiction==="us"));
  assert.ok(rows.every(r=>r.financialStatusHistory.at(-1)?.status==="selected_for_negotiations"));
  assert.ok(rows.every(r=>r.implementationStatusHistory.at(-1)?.status==="announced"));
  assert.ok(rows.every(r=>r.programmeId?.startsWith("prg-us-doe-battery-")));
  assert.ok(rows.every(r=>r.evidence.some(e=>e.supports.includes("amount")&&e.supports.includes("status"))));
  assert.equal(getAllProgrammes().filter(p=>p.id.startsWith("prg-us-doe-battery-")).length,2);
  assert.ok(!getAllFinancialCommitments().some(r=>r.id==="fin-us-doe-round3-aggregate-500m"));
  const ledger=manifest();
  assert.equal(ledger.candidates.length,16);
  assert.deepEqual(ledger.cohorts.map(x=>x.announcedSelectedCount),[7,9]);
  assert.deepEqual(ledger.cohorts.map(x=>x.announcedTotalSelectedFederalShareUSD),[500000000,162000000]);
  assert.equal(ledger.candidates.filter(x=>x.cohort==="2026-08-18-doe-byproduct-pilots"&&x.proposedFederalShareUSD!==null).length,0);
});

test("selection values are excluded from government commitments and project backing", () => {
  const rows=finance();
  const commitments=publicCommitmentRows();
  assert.ok(rows.every(r=>!commitments.some(c=>c.id===r.id)));
  assert.throws(()=>totalCommitments(rows),/refusing to sum selected grant proposals/);
  for(const row of rows){
    assert.equal(layerOf(row),"selected_proposal");
    assert.equal(isBackingRow(row),false);
    const stack=projectStack(row.projectId!)!;
    assert.ok(stack.rows.some(r=>r.id===row.id));
    assert.ok(stack.layers.some(l=>l.key==="selected_proposal"&&l.totals===null));
    assert.ok(!stack.governments.includes("us"),"selection must not make DOE a financial backer");
    assert.match(explainFinancialRecord(row).boundary,/excluded from all government commitment/);
    assert.match(explainFinancialRecord(row).payment,/No executed grant/);
  }
  assert.ok(!getAllProjectMilestones().some(m=>rows.some(r=>r.projectId===m.projectId)));
  assert.ok(!getAllFinancialCommitments().some(r=>r.eventId===pilotId));
});

test("each registered project and applicant is backed by specific DOE selection evidence", () => {
  const staged=proposals();
  assert.equal(staged.reviewState,"staged_draft_pending_release");
  assert.equal(staged.proposedProjects.length,7);
  assert.equal(staged.proposedOrganizations.length,7);
  const projects=getAllProjects(),orgs=getAllOrganizations();
  for(const p of staged.proposedProjects){
    const item=projects.find(x=>x.id===p.id);
    assert.ok(item,p.id);
    assert.ok(p.sponsorOrgIds.every(id=>orgs.some(o=>o.id===id)));
    assert.ok(finance().some(c=>c.projectId===p.id));
    assert.ok(item.evidence.every(e=>getAllSources().some(s=>s.id===e.sourceId&&s.sourceType==="official")));
  }
  const byId=(id:string)=>projects.find(p=>p.id===id)!;
  assert.deepEqual(byId("prj-us-formation-jervois-cobalt").locations,[]);
  assert.deepEqual(byId("prj-us-nth-cycle-black-mass").materialIds,[]);
  assert.equal(byId("prj-us-nth-cycle-black-mass").locations[0].asStated,"Southeastern U.S.");
  assert.deepEqual(byId("prj-us-arcanum-ethylene-carbonate").materialIds,[]);
  assert.ok(byId("prj-us-coreshell-silicon-anode").untrackedMaterialsAsStated.includes("metallurgical silicon"));
  assert.ok(!byId("prj-us-coreshell-silicon-anode").materialIds.includes("graphite"));
});
