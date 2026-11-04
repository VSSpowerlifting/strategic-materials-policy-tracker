import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getAllFinancialCommitments, getAllOrganizations, getAllProjects, getAllSources,
  getEventById, getMaterialBySlug,
} from "../lib/data";

const batchId = "evt-us-doe-battery-round3-selections-2026";
const pilotId = "evt-us-doe-byproduct-pilots-selections-2026";
const sourceIds = [
  "src-us-doe-battery-round3-2026-08",
  "src-us-doe-battery-processing-round3",
  "src-us-doe-battery-manufacturing-round3",
  "src-us-doe-industrial-byproducts-2026-08",
];

const manifest = () => JSON.parse(readFileSync("research/doe-august-2026-cohorts.json", "utf8")) as {
  candidates: { candidateId: string; cohort: string; proposedFederalShareUSD: number | null }[];
  cohorts: { cohortId: string; announcedSelectedCount: number; announcedTotalSelectedFederalShareUSD: number }[];
};
const proposals = () => JSON.parse(readFileSync("research/doe-august-2026-project-proposals.json", "utf8")) as {
  reviewState: string;
  proposedProjects: { id: string; sponsorOrgIds: string[] }[];
  proposedOrganizations: { id: string }[];
};

test("DOE issuer source entries support two selection-stage policy events", () => {
  const sourceRegistry = getAllSources();
  for (const id of sourceIds) {
    const source = sourceRegistry.find((s) => s.id === id);
    assert.ok(source, id);
    assert.equal(source.sourceType, "official");
    assert.equal(source.confidence, "primary");
  }
  const round3 = getEventById(batchId)!;
  assert.equal(round3.date, "2026-08-20");
  assert.equal(round3.sourceIds.length, 3);
  assert.equal(round3.lifecycle.publishedAt, null);
  assert.equal(round3.lifecycle.verifiedAt, null);
  const pilot = getEventById(pilotId)!;
  assert.equal(pilot.date, "2026-08-18");
  assert.equal(pilot.sourceIds.length, 1);
  assert.deepEqual(pilot.affectedMaterialIds, ["antimony", "rare-earth-elements"]);
  assert.ok(getMaterialBySlug("lithium")!.eventIds.includes(batchId));
  assert.ok(!getMaterialBySlug("lithium")!.eventIds.includes(pilotId));
});

test("all 16 DOE selectees and seven project proposals remain reproducible research records", () => {
  const ledger = manifest();
  assert.equal(ledger.candidates.length, 16);
  assert.equal(new Set(ledger.candidates.map((r) => r.candidateId)).size, 16);
  assert.deepEqual(ledger.cohorts.map((c) => c.announcedSelectedCount), [7, 9]);
  assert.deepEqual(ledger.cohorts.map((c) => c.announcedTotalSelectedFederalShareUSD), [500000000, 162000000]);
  const round3 = ledger.candidates.filter((c) => c.cohort === "2026-08-20-doe-battery-round3");
  assert.equal(round3.length, 7);
  assert.equal(round3.reduce((n, c) => n + (c.proposedFederalShareUSD ?? 0), 0), 500000000);
  assert.ok(ledger.candidates.filter((c) => c.cohort === "2026-08-18-doe-byproduct-pilots").every((c) => c.proposedFederalShareUSD === null));
  const staged = proposals();
  assert.equal(staged.reviewState, "research_only_do_not_promote");
  assert.equal(staged.proposedProjects.length, 7);
  assert.equal(staged.proposedOrganizations.length, 7);
  const orgIds = new Set(staged.proposedOrganizations.map((o) => o.id));
  for (const p of staged.proposedProjects) assert.ok(p.sponsorOrgIds.every((id) => orgIds.has(id)));
});

test("unexecuted DOE selection proposals are excluded from public finance and linked project registries", () => {
  const staged = proposals();
  const projectIds = new Set(getAllProjects().map((p) => p.id));
  const organizationIds = new Set(getAllOrganizations().map((o) => o.id));
  for (const p of staged.proposedProjects) assert.ok(!projectIds.has(p.id));
  for (const o of staged.proposedOrganizations) assert.ok(!organizationIds.has(o.id));
  assert.ok(!getAllFinancialCommitments().some((c) => c.eventId === batchId || c.eventId === pilotId));
});
