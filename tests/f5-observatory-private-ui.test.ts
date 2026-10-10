import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync } from "node:fs";
import type { PathwayInputs } from "@/lib/evidence-pathway-contract";
import type { ProjectMilestone } from "@/lib/types";
import {
  buildF5ObservatoryScaffold, type F5ObservatoryScaffold,
} from "@/lib/f5-observatory-scaffold";
import { PrivateObservatoryReview, PrivateObservatoryCasefile } from "@/components/observatory/private-observatory-review";
import { site, nav, headerNav } from "@/lib/site";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "@/lib/data";

const corpus=():PathwayInputs=>structuredClone({
  events:getAllEvents(),finances:getAllFinancialCommitments(),
  controls:getAllControlMeasures(),designations:getAllProjectDesignations(),
  milestones:getAllProjectMilestones(),projects:getAllProjects(),sources:getAllSources(),
});
const model=()=>buildF5ObservatoryScaffold(corpus(),site.lastUpdated);
const html=(m:F5ObservatoryScaffold=model())=>
  renderToStaticMarkup(createElement(PrivateObservatoryReview,{model:m}));
const count=(str:string,part:string)=>str.split(part).length-1;

test("O3: the private Observatory renders actual project cohort without a public URL or script",()=>{
  const m=model(), h=html(m);
  assert.equal(m.cases.length,4);
  assert.match(h,/data-f5-private-review="true"/);
  assert.match(h,/INTERNAL EDITORIAL REVIEW ONLY/);
  assert.match(h,/Publication gate: CLOSED/);
  assert.match(h,/Industrial Outcome Observatory/);
  assert.ok(!h.includes("<script"));
  assert.ok(!h.includes('href="/observatory'));
  assert.ok(!h.includes('href="/pathways'));
  assert.ok(!existsSync("app/observatory/page.tsx"));
  assert.ok(!existsSync("app/pathways/page.tsx"));
  assert.ok(!nav.some(x=>/observatory|casefile/i.test(x.href+" "+x.label)));
  assert.ok(!headerNav.some(x=>/observatory|casefile/i.test(x.href+" "+x.label)));
  assert.deepEqual(getAllProjectMilestones(),[]);
  assert.equal(count(h,'<article id="f5-case-'),4);
  for(const c of m.cases) {
    assert.ok(h.includes('id="f5-case-'+c.comparison.projectId+'"'),c.comparison.projectId);
    assert.ok(h.includes(c.comparison.projectName.replaceAll("&","&amp;")));
  }
});

test("O3: accessible semantic table, native links, responsive classes and unique headings",()=>{
  const h=html();
  assert.match(h,/<table class="[^"]*min-w-\[52rem\]/);
  assert.match(h,/<caption class="sr-only">Industrial project evidence coverage/);
  assert.match(h,/role="region" aria-label="Horizontally scrollable project-evidence coverage comparison" tabindex="0"/);
  assert.ok(count(h,'scope="col"')>=7);
  assert.equal(count(h,'scope="row"'),4);
  assert.match(h,/grid gap-4 lg:grid-cols-2/);
  assert.match(h,/sm:grid-cols-2/);
  assert.match(h,/focus-visible:outline-2/);
  const ids=[...h.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length,"every landmark and casefile heading must have a unique id");
  assert.equal(count(h,'<h1'),1);
  assert.equal(count(h,'<h2'),6,"overview, four casefiles, and release gate");
  assert.ok(count(h,'<h3')>=20,"each case has evidence lanes and source heading");
  assert.ok(count(h,'<section')>=22,"overview, grouping, 16 evidence lanes and 4 source indexes");
  assert.equal(count(h,'<a href="javascript:'),0);
  assert.match(h,/target="_blank" rel="noopener noreferrer"/);
  assert.ok(!h.includes('aria-label="Publish"'));
});

test("O3: distinguish missing reviewed evidence from no industrial activity or project failure",()=>{
  const h=html(),m=model();
  assert.equal(m.sourceReviewedCasefilesReadyForManualQa,0);
  assert.equal(count(h,"No reviewed occurred physical milestone is registered."),4);
  assert.equal(count(h,"No source-reviewed occurred physical milestone has entered the project-native register."),4);
  assert.ok(count(h,"Missing a recorded reference is not proof of real-world inactivity.")>0);
  assert.match(h,/No reviewed occurred claim registered/);
  assert.match(h,/no reviewed occurred physical milestone/i);
  assert.ok(!h.includes("Project stalled"));
  assert.ok(!h.includes("Production achieved"));
  assert.ok(!h.includes("policy impact score"));
  assert.ok(!h.includes("total committed capital"));
});

test("O3: financial and government evidence uses noncausal words, no amounts/sums",()=>{
  const h=html();
  assert.match(h,/nonallocative associations/);
  assert.match(h,/Project-linked instrument reference/);
  assert.match(h,/not evidence of a government-caused physical result/);
  assert.match(h,/not funding/);
  assert.match(h,/references only, not additional or attributable capital/);
  assert.match(h,/payout/);
  assert.ok(!h.includes("USD 100 million"));
  assert.ok(!h.includes("Total award"));
  assert.equal(count(h,"01 · Policy record"),4);
  assert.equal(count(h,"02 · Financial instruments"),4);
  assert.equal(count(h,"03 · Official project designations"),4);
  assert.equal(count(h,"04 · Industrial progress evidence"),4);
  assert.equal(count(h,"Source and provenance index"),4);
});

test("O3: reviewed occurred test fixture shows issuer evidence with unknown day, not report-day promotion",()=>{
  const data=corpus();
  const fake:ProjectMilestone={
    id:"mil-o3-synthetic-narva",
    projectId:"prj-ee-neo-rare-earth-magnet-project",
    kind:"production_reported",claimMode:"occurred",
    scope:"named_facility",scopeAsStated:"synthetic limited Narva magnet production",
    occurredOn:null,targetOn:null,
    sourceId:"src-neo-commercial-production-2026",
    locator:"TEST synthetic source pinpoint; not human approval",
    statementOriginal:"Synthetic issuer quotation only",
    statementEn:"Synthetic issuer quotation only",
    statementEnSource:"na",
    reviewedBy:"synthetic test reviewer; not actual human review",reviewedAt:"2026-10-07",
  };
  const preview=buildF5ObservatoryScaffold({...data,milestones:[fake]},site.lastUpdated);
  const h=html(preview);
  assert.match(h,/Exact physical occurrence day not established/);
  assert.match(h,/Synthetic issuer quotation only/);
  assert.match(h,/Original source published 2026-09-14/);
  assert.match(h,/review metadata dated <time dateTime="2026-10-07">2026-10-07<\/time>/);
  assert.match(h,/Source pinpoint: TEST synthetic source pinpoint/);
  assert.match(h,/not independent on-site verification/);
  assert.equal(preview.publicReleaseAuthorized,false);
  assert.deepEqual(getAllProjectMilestones(),[]);
});

test("O3: private renderer refuses public-ready models or unsafe primary-source URLs",()=>{
  const m=model();
  m.publicReleaseAuthorized=true as false;
  assert.throws(()=>html(m),/cannot render public/);
  const another=model();
  another.inferredCausalityAuthorized=true as false;
  assert.throws(()=>html(another),/cannot render public/);
  const third=model();
  third.cases[0].draft.publicReleaseAuthorized=true as false;
  assert.throws(()=>html(third),/cannot render public/);
  const fourth=model();
  fourth.cases[0].sourceIndex[0].url="javascript:alert(1)";
  assert.throws(()=>html(fourth),/HTTP\(S\) URL/);
  const fifth=model();
  fifth.cases[0].draft.lanes.finance[0].evidence[0].url="https://user:password@source.example";
  assert.throws(()=>html(fifth),/HTTP\(S\) URL/);
});

test("O3: cohort order and rendered source coverage are deterministic",()=>{
  const a=model(),b=model();
  assert.deepEqual(a,b);
  assert.equal(html(a),html(b));
  const original=JSON.stringify(a);
  renderToStaticMarkup(createElement(PrivateObservatoryCasefile,{item:a.cases[0]}));
  assert.equal(JSON.stringify(a),original,"rendering does not mutate source-linked input");
});
