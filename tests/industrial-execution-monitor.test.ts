import assert from "node:assert/strict";
import test from "node:test";
import { getProjectById, getProjectMilestoneById, getSourceById } from "../lib/data";
import { magnetFacilities, monitorSources, monitorUpdate } from "../lib/industrial-execution-monitor";

test("the monitor only compares the three canonical magnet facilities", () => {
  assert.deepEqual(magnetFacilities.map(({ projectId }) => projectId), [
    "prj-us-mp-10x-facility",
    "prj-ee-neo-rare-earth-magnet-project",
    "prj-us-usar-stillwater-magnet",
  ]);
  for (const { projectId } of magnetFacilities) {
    assert.ok(getProjectById(projectId), projectId);
  }
});

test("monitor citations have locators and use disclosures available by the research cutoff", () => {
  const statements = [
    monitorUpdate.finding,
    ...magnetFacilities.flatMap(({ reported, schedule, context, next }) => [
      reported, ...schedule.targets, schedule.outcome, context, next.target,
    ]),
  ];
  for (const statement of statements) {
    if (!statement) continue;
    for (const { source, locator } of statement.citations) {
      const { url, publishedOn } = monitorSources[source];
      assert.equal(new URL(url).protocol, "https:");
      assert.equal(new Date(publishedOn).toISOString().slice(0, 10), publishedOn);
      assert.ok(publishedOn <= monitorUpdate.researchCutoff, source);
      assert.ok(locator.trim(), source);
    }
  }
});

test("issuer target windows and reported outcomes keep their original time precision", () => {
  const [mp, neo, usar] = magnetFacilities;
  assert.deepEqual(mp.schedule.targets.map(({ timing }) => timing), ["2028", "2028", "Late 2028"]);
  assert.equal(mp.schedule.outcome, undefined);
  assert.equal(neo.reported.timing, "September 2026");
  assert.equal(neo.schedule.outcome?.timing, "Q3 2026");
  assert.match(neo.next.target?.text ?? "", /One to two additional/);
  assert.equal(usar.schedule.targets[0].timing, "First half of 2026");
  assert.equal(usar.schedule.outcome?.timing, "Q3 2026");
  assert.equal(usar.next.target?.timing, "Q2 2027");

  for (const [milestoneId, citation] of [
    ["mil-ee-neo-narva-commercial-production-reported-2026", monitorSources.neoShipments],
    ["mil-us-usar-stillwater-phase1a-commissioning-started", monitorSources.usarCommissioning],
  ] as const) {
    const milestone = getProjectMilestoneById(milestoneId);
    assert.ok(milestone);
    const source = getSourceById(milestone.sourceId);
    assert.equal(milestone.occurredOn, null);
    assert.equal(citation.publishedOn, source?.datePublished);
    assert.equal(citation.url, source?.url);
  }
});
