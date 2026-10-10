import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import {
  buildM3ReviewerPackets, renderM3ReviewerPacketsMarkdown,
} from "../scripts/project-execution-review-packets";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { site } from "../lib/site";

const input = () => structuredClone(queue);
const refs = () => ({
  projects: getAllProjects(), sources: getAllSources(),
  commitments: getAllFinancialCommitments(), corpusCutoff: site.lastUpdated as string,
  publicMilestoneCount: getAllProjectMilestones().length,
});
const packet = (id: string | null = null) => buildM3ReviewerPackets(input(), refs(), id);

test("M3 workbench: seven source-linked packets, no reviewer identities, no publication", () => {
  const p = packet();
  assert.equal(p.schemaVersion, "m3-reviewer-packet-1");
  assert.equal(p.publicationAuthorized, false);
  assert.equal(p.automaticSourceApprovalAuthorized, false);
  assert.equal(p.publicMilestoneCount, 0);
  assert.equal(p.totalQueueCandidates, 7);
  assert.equal(p.awaitingSourceReview, 5);
  assert.equal(p.blockedOnTaxonomy, 2);
  assert.equal(p.worksheets.length, 7);
  assert.equal(new Set(p.worksheets.map(w=>w.id)).size, 7);
  assert.equal(p.worksheets.filter(w=>w.status==="taxonomy_blocked").length, 2);
  assert.ok(p.worksheets.every(w => w.humanAttestationPresent === false));
  assert.ok(p.worksheets.every(w => w.reviewerChecks.length===5));
  assert.ok(p.worksheets.every(w => /^[a-f0-9]{64}$/.test(w.reviewInputDigestSha256)));
  assert.ok(p.worksheets.every(w => /^https?:\/\//.test(w.originalSource.url)));
  assert.equal(getAllProjectMilestones().length, 0);
});

test("M3 workbench: Narva retains unknown production date and distinguishes source report", () => {
  const p=packet("review-m3-2-neo-narva-magnets");
  assert.equal(p.worksheets.length, 1);
  const w=p.worksheets[0];
  assert.equal(w.originalSource.publisher, "Neo Performance Materials");
  assert.equal(w.originalSource.publishedOn, "2026-09-14");
  assert.equal(w.originalSource.evidenceBoundary.date, "2026-09-14");
  assert.equal(w.proposedObservation.kind, "production_reported");
  assert.equal(w.proposedObservation.occurredOn, null);
  assert.equal(w.proposedObservation.scope, "named_facility");
  assert.equal(w.status, "unsigned_source_review");
  const markdown=renderM3ReviewerPacketsMarkdown(p);
  assert.match(markdown, /UNKNOWN — do not substitute filing date/);
  assert.match(markdown, /Source URL/);
  assert.match(markdown, /all unchecked/);
  assert.ok(!markdown.includes("APPROVED"));
});

test("M3 workbench: Stibnite Burntlog taxonomy remains blocked", () => {
  const p=packet("review-m3-2-stibnite-burntlog");
  const w=p.worksheets[0];
  assert.equal(w.status, "taxonomy_blocked");
  assert.equal(w.proposedObservation.scope, "named_infrastructure");
  assert.match(w.taxonomyQuestion ?? "", /site-access infrastructure/);
  assert.equal(w.proposedObservation.occurredOn, "2026-05-30");
  assert.match(renderM3ReviewerPacketsMarkdown(p), /STOP — unresolved taxonomy question/);
});

test("M3 workbench: Thompson Falls is issuer-reported construction progress only", () => {
  const p=packet("review-m3-2-thompson-falls-q2-expansion");
  const w=p.worksheets[0];
  assert.equal(w.proposedObservation.kind, "construction_progress_reported");
  assert.equal(w.proposedObservation.occurredOn, null);
  assert.equal(w.status, "unsigned_source_review");
  assert.deepEqual(w.financingObservationReferences, []);
  assert.match(w.editorialCaution, /not a completed\/operating project/);
  assert.equal(w.originalSource.publishedOn, "2026-08-11");
  assert.equal(w.originalSource.accessedOn, "2026-10-02");
});

test("M3 workbench: output is deterministic, read-only, and source registry order independent", () => {
  const seed=input(), first=JSON.stringify(seed), references=refs();
  const a=buildM3ReviewerPackets(seed,references);
  const b=buildM3ReviewerPackets(seed,{
    ...references, sources:[...references.sources].reverse(),
    projects:[...references.projects].reverse(),
    commitments:[...references.commitments].reverse(),
  });
  assert.deepEqual(a,b);
  assert.equal(JSON.stringify(seed), first);
  assert.equal(renderM3ReviewerPacketsMarkdown(a),renderM3ReviewerPacketsMarkdown(b));
  assert.throws(()=>buildM3ReviewerPackets([...seed].reverse(),references),
    /review queue invalid/, "human review queue order must remain canonical");
});

test("M3 workbench: fingerprints reflect real changes to reviewed source or quote metadata", () => {
  const original=input(), references=refs();
  const before=buildM3ReviewerPackets(original,references).worksheets[0].reviewInputDigestSha256;
  const edited=input();
  edited[0].statementOriginal="The ceremony marked the start of construction in Western Australia.";
  edited[0].statementEn=edited[0].statementOriginal;
  const changed=buildM3ReviewerPackets(edited,references).worksheets[0].reviewInputDigestSha256;
  assert.notEqual(before,changed);
  const newRefs=refs();
  newRefs.sources=newRefs.sources.map(s=>s.id===original[0].sourceId
    ? {...s,dateAccessed:"2026-10-08"} : s);
  const altered=buildM3ReviewerPackets(input(),newRefs).worksheets[0].reviewInputDigestSha256;
  assert.notEqual(before,altered);
  assert.equal(getAllProjectMilestones().length,0);
});

test("M3 workbench: invalid reviews, source URL, corpus date and unknown IDs fail closed", () => {
  const row=input();
  row[0].reviewVerdict="approved" as (typeof row)[number]["reviewVerdict"];
  assert.throws(()=>buildM3ReviewerPackets(row,refs()), /review queue invalid/);
  const edited=refs();
  edited.sources=edited.sources.map(s=>s.id===row[0].sourceId?{...s,url:"javascript:bad"}:s);
  assert.throws(()=>buildM3ReviewerPackets(input(),edited),/Unusable primary source URL/);
  const invalid=refs();
  invalid.corpusCutoff="2026-02-30";
  assert.throws(()=>buildM3ReviewerPackets(input(),invalid), /review queue invalid/);
  assert.throws(()=>packet("review-m3-2-does-not-exist"),/Unknown M3 review ID/);
  assert.throws(()=>packet("not-a-review"),/Invalid review ID/);
});

test("M3 workbench CLI: no file output or unsigned approval, JSON and single-ID selector", () => {
  const cmd=["--import","tsx","scripts/print-project-execution-review-packets.ts"];
  const all=execFileSync(process.execPath,[...cmd,"--json"],{encoding:"utf8"});
  assert.deepEqual(JSON.parse(all),packet());
  const one=execFileSync(process.execPath,[...cmd,"--id",
    "review-m3-2-neo-narva-magnets","--json"],{encoding:"utf8"});
  assert.deepEqual(JSON.parse(one),packet("review-m3-2-neo-narva-magnets"));
  const md=execFileSync(process.execPath,cmd,{encoding:"utf8"});
  assert.equal(md,renderM3ReviewerPacketsMarkdown(packet()));
  assert.match(md,/INTERNAL \/ UNSIGNED \/ NO PUBLICATION AUTHORIZATION/);
  for (const bad of [["--publish"],["--approve"],["--id"],["--json","--json"],
    ["--id","review-m3-2-neo-narva-magnets","--id","review-m3-2-neo-narva-magnets"]]) {
    const run=spawnSync(process.execPath,[...cmd,...bad],{encoding:"utf8"});
    assert.equal(run.status,2,bad.join(" "));
    assert.match(run.stderr,/Usage: npm run review:m3-packets/);
    assert.equal(run.stdout,"");
  }
});
