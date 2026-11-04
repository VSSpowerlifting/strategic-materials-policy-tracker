import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllFinancialCommitments, getAllOrganizations, getAllProjectMilestones,
  getAllProjects, getAllSources, getEventById, getMaterialBySlug,
} from "../lib/data";

const batchId = "evt-us-doe-battery-round3-selections-2026";
const pilotId = "evt-us-doe-byproduct-pilots-selections-2026";
const projects = [
  "prj-us-waterleaf-lilac-lithium",
  "prj-us-formation-jervois-cobalt",
  "prj-us-nth-cycle-black-mass",
  "prj-us-princeton-nuenergy-cathode",
  "prj-us-arcanum-ethylene-carbonate",
  "prj-us-elevated-lithium-films",
  "prj-us-coreshell-silicon-anode",
] as const;

test("DOE Round 3 registers seven distinct selected projects with original-source evidence", () => {
  const all = getAllProjects();
  const orgs = getAllOrganizations();
  const sources = getAllSources();
  const ids = new Set(all.map((p) => p.id));
  assert.equal(new Set(projects).size, 7);
  for (const id of projects) {
    assert.ok(ids.has(id), id);
    const project = all.find((p) => p.id === id)!;
    assert.equal(project.sponsorOrgIds.length, 1);
    assert.ok(orgs.some((o) => o.id === project.sponsorOrgIds[0]));
    assert.ok(project.evidence.length >= 1);
    assert.ok(project.evidence.every((e) => sources.some((s) => s.id === e.sourceId && s.sourceType === "official")));
    assert.ok(project.notes?.includes("DOE") || project.notes?.includes("Selected"), id);
  }
  const event = getEventById(batchId)!;
  assert.equal(event.date, "2026-08-20");
  assert.equal(event.sourceIds.length, 3);
  assert.equal(event.verificationStatus, "verified");
  assert.equal(event.lifecycle.publishedAt, null);
  assert.equal(getEventById(pilotId)?.date, "2026-08-18");
});

test("selection-stage proposals do not appear as signed financing or physical milestones", () => {
  const registered = new Set<string>(projects);
  assert.ok(!getAllFinancialCommitments().some((c) =>
    c.eventId === batchId || c.eventId === pilotId ||
    (c.projectId !== null && registered.has(c.projectId))
  ));
  assert.ok(!getAllProjectMilestones().some((m) => registered.has(m.projectId)));
});

test("source boundaries preserve unknown sites and untracked products", () => {
  const all = getAllProjects();
  const byId = (id: string) => all.find((p) => p.id === id)!;
  assert.deepEqual(byId("prj-us-formation-jervois-cobalt").locations, []);
  assert.equal(byId("prj-us-nth-cycle-black-mass").locations[0].asStated, "Southeastern U.S.");
  assert.deepEqual(byId("prj-us-nth-cycle-black-mass").materialIds, []);
  assert.ok(byId("prj-us-coreshell-silicon-anode").untrackedMaterialsAsStated.includes("metallurgical silicon"));
  assert.ok(!byId("prj-us-coreshell-silicon-anode").materialIds.includes("graphite"));
  assert.deepEqual(byId("prj-us-arcanum-ethylene-carbonate").materialIds, []);
  const lithium = getMaterialBySlug("lithium")!;
  assert.ok(lithium.eventIds.includes(batchId));
  assert.ok(!lithium.eventIds.includes(pilotId), "cohort does not map lithium to its selectees");
});
