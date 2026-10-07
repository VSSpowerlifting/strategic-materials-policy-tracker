import test from "node:test";
import assert from "node:assert/strict";

import {
  getFinancialCommitmentById,
  getMaterialBySlug,
  getProjectById,
  getSourceById,
} from "@/lib/data";

test("Focus Graphite financing links to a source-bounded purification project", () => {
  const row = getFinancialCommitmentById("fin-ca-g7-2025-focus-graphite-gpi")!;
  assert.equal(row.projectId, "prj-ca-focus-graphite-electrothermal-purification");
  assert.deepEqual(row.stages, ["processing"]);
  assert.deepEqual(row.locations, []);

  const project = getProjectById(row.projectId)!;
  assert.equal(project.name, "Chemical-Free Electrothermal Purification Project");
  assert.deepEqual(project.sponsorOrgIds, ["org-focus-graphite"]);
  assert.deepEqual(project.materialIds, ["graphite"]);
  assert.deepEqual(project.stages, ["processing"]);
  assert.deepEqual(project.locations, []);
  assert.match(project.notes ?? "", /No project site is stated/);
});

test("Northern Graphite and Rain Carbon financing links to a distinct R&D project", () => {
  const row = getFinancialCommitmentById("fin-ca-g7-2025-northern-graphite-nrc")!;
  assert.equal(row.projectId, "prj-ca-northern-rain-upcycled-graphite");
  assert.deepEqual(row.stages, ["research_development"]);
  assert.deepEqual(row.locations, []);

  const project = getProjectById(row.projectId)!;
  assert.deepEqual(project.sponsorOrgIds, ["org-northern-graphite", "org-rain-carbon-canada"]);
  assert.deepEqual(project.materialIds, ["graphite"]);
  assert.deepEqual(project.stages, ["research_development"]);
  assert.deepEqual(project.locations, []);
  assert.match(project.notes ?? "", /No project site is stated/);
});

test("graphite dossier carries the G7 project provenance without changing financing maturity", () => {
  const material = getMaterialBySlug("graphite")!;
  assert.ok(material.sourceIds.includes("src-nrcan-g7-cmpa-2025"));
  assert.ok(getSourceById("src-nrcan-g7-cmpa-2025"));
  assert.match(material.diversificationNote ?? "", /Focus Graphite/);
  assert.match(material.diversificationNote ?? "", /Northern Graphite/);

  const focus = getFinancialCommitmentById("fin-ca-g7-2025-focus-graphite-gpi")!;
  const northern = getFinancialCommitmentById("fin-ca-g7-2025-northern-graphite-nrc")!;
  assert.equal(focus.financialStatusHistory.at(-1)?.status, "decided");
  assert.equal(northern.financialStatusHistory.at(-1)?.status, "announced");
});
