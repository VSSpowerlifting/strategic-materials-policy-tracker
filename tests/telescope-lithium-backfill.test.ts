import test from "node:test";
import assert from "node:assert/strict";

import { financialStatusOn, legalStandingOn } from "@/lib/capital-control";
import {
  getEventById,
  getFinancialCommitmentById,
  getMaterialBySlug,
  getProjectById,
  getSourceById,
} from "@/lib/data";

test("Li-PICK uses the binding 2024 contribution agreement rather than the later G7 announcement date", () => {
  const row = getFinancialCommitmentById("fin-ca-g7-2025-telescope-lipick")!;
  assert.equal(row.amount?.value, "319200");
  assert.equal(row.amount?.currency, "CAD");
  assert.equal(row.amount?.qualifier, "exact");
  assert.equal(financialStatusOn(row, "2024-08-31"), null);
  assert.equal(financialStatusOn(row, "2024-09-01"), "contracted");
  assert.equal(legalStandingOn(row, "2024-09-01"), "binding");
  assert.equal(row.financialStatusHistory[0].sourceId, "src-canada-grant-telescope-lipick-2024");
  assert.deepEqual(row.stages, ["recycling"]);
  assert.deepEqual(row.locations, []);
});

test("the Telescope lithium-sulphide row uses NRCan's exact funded amount without inventing a contract", () => {
  const row = getFinancialCommitmentById("fin-ca-g7-2025-telescope-lithium-sulphide")!;
  assert.equal(row.amount?.value, "3039344");
  assert.equal(row.amount?.currency, "CAD");
  assert.equal(row.amount?.qualifier, "exact");
  assert.equal(financialStatusOn(row, "2025-10-30"), null);
  assert.equal(financialStatusOn(row, "2025-10-31"), "decided");
  assert.equal(legalStandingOn(row, "2026-10-07"), "not_yet_binding");
  assert.deepEqual(row.stages, ["processing"]);
  assert.deepEqual(row.locations, [{ countryCode: "CA", subnational: "British Columbia", asStated: "Vancouver, British Columbia" }]);
  assert.match(row.notes ?? "", /No matching binding contribution agreement/);
  assert.match(row.notes ?? "", /launched in 2025/);
});

test("Telescope's two lithium projects remain distinct undertakings", () => {
  const lipick = getProjectById("prj-ca-telescope-lipick")!;
  assert.deepEqual(lipick.materialIds, ["lithium"]);
  assert.deepEqual(lipick.stages, ["recycling"]);
  assert.deepEqual(lipick.locations, []);

  const sulphide = getProjectById("prj-ca-telescope-lithium-sulphide")!;
  assert.deepEqual(sulphide.materialIds, ["lithium"]);
  assert.deepEqual(sulphide.stages, ["processing"]);
  assert.equal(sulphide.locations[0]?.asStated, "Vancouver, British Columbia");
  assert.notEqual(lipick.id, sulphide.id);
});

test("the G7 event no longer describes Telescope's lithium projects as uncoded", () => {
  const event = getEventById("evt-ca-g7-cmpa-2025")!;
  assert.match(event.summary, /Telescope Innovations' two lithium projects are separately coded/);
  assert.match(event.summary, /C\$319,200/);
  assert.match(event.summary, /C\$3,039,344/);
  assert.match(event.summary, /remaining lithium items are not separately recorded/);
});

test("the lithium dossier carries Telescope provenance and diversification context", () => {
  const material = getMaterialBySlug("lithium")!;
  for (const id of [
    "src-nrcan-g7-cmpa-2025",
    "src-canada-grant-telescope-lipick-2024",
    "src-nrcan-cmrdd-programme",
  ]) {
    assert.ok(material.sourceIds.includes(id), `missing lithium source ${id}`);
    assert.ok(getSourceById(id), `unregistered source ${id}`);
  }
  assert.match(material.diversificationNote ?? "", /Telescope Innovations/);
  assert.match(material.diversificationNote ?? "", /Li-PICK/);
});
