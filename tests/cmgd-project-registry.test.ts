import test from "node:test";
import assert from "node:assert/strict";

import {
  getFinancialCommitmentById,
  getProjectById,
} from "@/lib/data";

test("CMGD Maritimes Basin financing links to the source-defined geoscience project", () => {
  const row = getFinancialCommitmentById("fin-ca-pdac-2026-nb-maritimes-basin-cmgd")!;
  assert.equal(row.projectId, "prj-ca-cmgd-nb-maritimes-basin");
  assert.deepEqual(row.stages, ["exploration"]);
  assert.equal(row.financialStatusHistory.at(-1)?.status, "announced");

  const project = getProjectById(row.projectId)!;
  assert.equal(project.name, "Critical Mineral Potential of the Maritimes Basin in Eastern New Brunswick");
  assert.deepEqual(project.sponsorOrgIds, ["org-ca-nb-geological-survey"]);
  assert.deepEqual(project.locations, [{ countryCode: "CA", subnational: "New Brunswick", asStated: "Grand Lake Region, New Brunswick" }]);
  assert.deepEqual(project.materialIds, ["rare-earth-elements", "lithium"]);
  assert.deepEqual(project.untrackedMaterialsAsStated, ["copper", "zinc"]);
});

test("CMGD granitoids financing links to the source-defined geoscience project", () => {
  const row = getFinancialCommitmentById("fin-ca-pdac-2026-nb-granitoids-cmgd")!;
  assert.equal(row.projectId, "prj-ca-cmgd-nb-granitoids");
  assert.deepEqual(row.stages, ["exploration"]);
  assert.equal(row.financialStatusHistory.at(-1)?.status, "announced");

  const project = getProjectById(row.projectId)!;
  assert.equal(project.name, "Geochronology and Petrogenesis of Granitoids and Related Critical Mineral Systems in New Brunswick");
  assert.deepEqual(project.sponsorOrgIds, ["org-ca-nb-geological-survey"]);
  assert.deepEqual(project.locations, [{ countryCode: "CA", subnational: "New Brunswick", asStated: "Fredericton, New Brunswick" }]);
  assert.deepEqual(project.materialIds, ["tungsten", "lithium"]);
  assert.deepEqual(project.untrackedMaterialsAsStated, ["copper", "zinc"]);
});

test("CMGD Nova Scotia graphite financing links to the source-defined geoscience project", () => {
  const row = getFinancialCommitmentById("fin-ca-pdac-2026-ns-graphite-cmgd")!;
  assert.equal(row.projectId, "prj-ca-cmgd-ns-graphite-battery-value-chains");
  assert.deepEqual(row.stages, ["exploration"]);
  assert.equal(row.financialStatusHistory.at(-1)?.status, "announced");

  const project = getProjectById(row.projectId)!;
  assert.equal(project.name, "Graphite in Support of Battery Value Chains");
  assert.deepEqual(project.sponsorOrgIds, ["org-ca-ns-dnr"]);
  assert.deepEqual(project.locations, [{ countryCode: "CA", subnational: "Nova Scotia", asStated: "Halifax, Nova Scotia" }]);
  assert.deepEqual(project.materialIds, ["graphite"]);
  assert.deepEqual(project.untrackedMaterialsAsStated, []);
});
