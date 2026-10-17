import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewedProjectMilestones } from "../components/projects/reviewed-project-milestones";
import { getAllProjectMilestones, getSourceById } from "../lib/data";
import { getSourceUses } from "../lib/source-usage";
import ProjectPage from "../app/projects/[id]/page";
import { getPublicProjectInvestigation } from "../lib/research-experience";
import type { ProjectMilestone } from "../lib/types";

const wagerupId = "mil-au-alcoa-wagerup-groundbreaking-2026-08-24";
const projectId = "prj-au-alcoa-sojitz-gallium";
const sourceId = "src-alcoa-wagerup-groundbreaking-2026";
const html = (rows:readonly ProjectMilestone[]) =>
  renderToStaticMarkup(createElement(ReviewedProjectMilestones,{milestones:rows}));

test("project detail uses the public projection for a conditional physical lane without creating /pathways", async()=>{
  const source=readFileSync("app/projects/[id]/page.tsx","utf8");
  const packet = getPublicProjectInvestigation(projectId)!.packet;
  assert.deepEqual(packet.nativeMilestones.map(m=>m.id), [wagerupId]);
  const view = renderToStaticMarkup(await ProjectPage({params:Promise.resolve({id:projectId})}));
  assert.ok(view.includes(packet.nativeMilestones[0].statementOriginal.replaceAll("&", "&amp;")));
  const missing = renderToStaticMarkup(await ProjectPage({params:Promise.resolve({id:"prj-us-stibnite"})}));
  assert.match(missing, /No source-reviewed project milestone is published/);
  assert.doesNotMatch(missing, /Groundbreaking \(reported\)/);
  assert.match(source,/reviewedMilestones\.length \? \(/,
    "other unreviewed project pages must not invent an empty physical timeline");
  assert.match(source,/Source-reviewed industrial observations/);
  assert.match(source,/<ReviewedProjectMilestones milestones=\{reviewedMilestones\} \/>/);
  assert.doesNotMatch(source,/href="\/pathways"|href=\{"\/pathways"\}/);
  assert.match(source,/title="Capital stack"/,
    "existing financing summary must remain accessible as a distinct lane");
});

test("first public Wagerup observation displays exact approved scope, source, reviewer and three distinct clocks",()=>{
  const rows=getAllProjectMilestones();
  assert.deepEqual(rows.map(x=>x.id),[wagerupId,"mil-ee-neo-narva-commercial-production-reported-2026"],"only genuinely signed Wagerup and Narva are published");
  const row=rows[0];
  assert.equal(row.projectId,projectId);
  assert.equal(row.kind,"groundbreaking_reported");
  assert.equal(row.sourceId,sourceId);
  const original=getSourceById(row.sourceId);
  assert.ok(original);
  assert.equal(original.datePublished,"2026-08-24");
  assert.equal(original.dateAccessed,"2026-10-02");
  const view=html(rows.filter(m=>m.id===wagerupId));
  assert.equal((view.match(/<article /g)??[]).length,1);
  assert.match(view,/Source review does not establish/);
  assert.match(view,/independent on-site verification/);
  assert.match(view,/cash disbursement/);
  assert.match(view,/Groundbreaking \(reported\)/);
  assert.match(view,/Issuer-reported event/);
  assert.match(view,/Named facility/);
  assert.match(view,/Scope as stated: gallium production plant co-located/);
  assert.match(view,/Reported event date/);
  assert.match(view,/Original source published/);
  assert.match(view,/<time dateTime="2026-08-24">24 Aug 2026<\/time>/);
  assert.match(view,/<time dateTime="2026-10-17">17 Oct 2026<\/time>/);
  assert.match(view,/The ceremony marked the start of construction/);
  assert.match(view,/Interpretive limit/);
  assert.match(view,/not independently observed sustained works/);
  assert.match(view,/Reviewed by Benjamin Yang on/);
  assert.match(view,/Opening news paragraph after 08\/24\/2026 date/);
  assert.match(view,/href="\/sources\/src-alcoa-wagerup-groundbreaking-2026"/);
  assert.match(view,/href="https:\/\/news\.alcoa\.com\//);
  assert.match(view,/target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(view,/Production achieved|Government-funded facility completed|grant disbursed/i);
  assert.doesNotMatch(view,/href="\/pathways"/);
  assert.ok(!view.includes("2026-10-02"),
    "source-access receipt must never masquerade as the reported event day");
});

test("null event/target day does not borrow original publisher date or reviewer day",()=>{
  const prior=getAllProjectMilestones()[0];
  const synthetic:ProjectMilestone={
    ...prior,id:"mil-synthetic-missing-day-not-published",
    kind:"production_reported",claimMode:"planned",
    occurredOn:null,targetOn:null,
    reviewedBy:"SYNTHETIC TEST — NOT REAL HUMAN SIGNOFF",
  };
  const view=html([synthetic]);
  assert.match(view,/Proposed \/ planned/);
  assert.match(view,/Source-stated target date/);
  assert.match(view,/Exact date not established/);
  assert.match(view,/Original source published/);
  assert.match(view,/<time dateTime="2026-08-24">24 Aug 2026<\/time>/);
  assert.doesNotMatch(view,/Reported event date/);
  assert.deepEqual(getAllProjectMilestones().map(x=>x.id),[wagerupId,"mil-ee-neo-narva-commercial-production-reported-2026"]);
});

test("unregistered source rejects rendering instead of fabricating a publisher citation",()=>{
  const prior=getAllProjectMilestones()[0];
  const invalid={...prior,sourceId:"src-not-real"};
  assert.throws(()=>html([invalid]),/unregistered original source/);
});

test("Wagerup source dossier's milestone citation leads to the project detail now showing it",()=>{
  const refs=getSourceUses(sourceId).filter(x=>x.kind==="milestone");
  assert.equal(refs.length,1);
  assert.equal(refs[0].id,wagerupId);
  assert.equal(refs[0].href,"/projects/"+projectId+"#milestone-"+wagerupId);
});
