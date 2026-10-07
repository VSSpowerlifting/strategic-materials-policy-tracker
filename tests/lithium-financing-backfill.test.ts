import test from "node:test";
import assert from "node:assert/strict";

import { financialStatusOn, legalStandingOn } from "@/lib/capital-control";
import {
  getEventById,
  getFinancialCommitmentById,
  getMaterialBySlug,
  getProjectById,
  getProjectDesignationById,
  getSourceById,
} from "@/lib/data";

test("Canadian lithium-processing backfill preserves the different financial maturity of the two awards", () => {
  const event = getEventById("evt-ca-nrcan-lithium-processing-2024")!;
  assert.ok(event.affectedMaterialIds.includes("lithium"));
  assert.match(event.summary, /C\$9,437,500/);

  const saltworks = getFinancialCommitmentById("fin-ca-cmrdd-2024-saltworks-lithium")!;
  assert.equal(saltworks.amount?.value, "4937500");
  assert.equal(saltworks.amount?.currency, "CAD");
  assert.equal(financialStatusOn(saltworks, "2024-07-11"), "announced");
  assert.equal(legalStandingOn(saltworks, "2026-10-07"), "not_yet_binding");
  assert.match(saltworks.notes ?? "", /not a binding agreement/);

  const noram = getFinancialCommitmentById("fin-ca-cmrdd-2024-noram-lithium")!;
  assert.equal(noram.amount?.value, "4500000");
  assert.equal(financialStatusOn(noram, "2024-07-07"), null);
  assert.equal(financialStatusOn(noram, "2024-07-08"), "contracted");
  assert.equal(legalStandingOn(noram, "2024-07-08"), "binding");
  assert.equal(noram.financialStatusHistory[0].sourceId, "src-canada-grant-noram-cmrdd-2024");
});

test("Keliber backfill records the signed €150M EIB loan without folding in the later €17.5M signature", () => {
  const row = getFinancialCommitmentById("fin-eu-eib-2024-keliber-loan")!;
  assert.equal(row.amount?.value, "150000000");
  assert.equal(row.amount?.currency, "EUR");
  assert.equal(row.amount?.qualifier, "exact");
  assert.deepEqual(row.stages, ["mining", "processing"]);
  assert.equal(row.stageAllocation, "multi_stage_unallocated");
  assert.equal(financialStatusOn(row, "2024-08-19"), null);
  assert.equal(financialStatusOn(row, "2024-08-20"), "contracted");
  assert.equal(legalStandingOn(row, "2024-08-20"), "binding");
  assert.match(row.notes ?? "", /€17\.5 million/);
  assert.match(row.notes ?? "", /outside this tranche/);
});

test("Keliber project and CRMA designation share the same tracked lithium undertaking", () => {
  const project = getProjectById("prj-fi-keliber-lithium")!;
  assert.equal(project.name, "KELIBER LITHIUM");
  assert.deepEqual(project.materialIds, ["lithium"]);
  assert.deepEqual(project.stages, ["mining", "processing"]);

  const designation = getProjectDesignationById("dsg-eu-crma-keliber-lithium")!;
  assert.equal(designation.projectId, project.id);
  assert.equal(designation.projectNameAsStated, "KELIBER LITHIUM");
  assert.deepEqual(designation.materialIds, ["lithium"]);
  assert.deepEqual(designation.stages, ["mining", "processing"]);
  assert.equal(designation.statusHistory.at(-1)?.status, "recognized");
  assert.equal(designation.statusHistory.at(-1)?.date, "2025-03-25");
});

test("lithium dossier now links the Canadian process awards and Keliber EIB financing", () => {
  const material = getMaterialBySlug("lithium")!;
  for (const id of ["evt-ca-nrcan-lithium-processing-2024", "evt-eu-eib-keliber-2024"]) {
    assert.ok(material.eventIds.includes(id), `missing lithium event ${id}`);
    assert.ok(getEventById(id)?.affectedMaterialIds.includes("lithium"));
  }
  for (const id of [
    "src-nrcan-lithium-processing-2024",
    "src-canada-grant-noram-cmrdd-2024",
    "src-eib-keliber-2024",
    "src-eib-keliber-project-20170804",
  ]) {
    assert.ok(material.sourceIds.includes(id), `missing lithium source ${id}`);
    assert.ok(getSourceById(id), `unregistered source ${id}`);
  }
  assert.match(material.diversificationNote ?? "", /€150 million/);
});

test("ResourceEU no longer describes the Keliber loan as omitted", () => {
  const event = getEventById("evt-eu-resourceeu-2025")!;
  assert.match(event.summary, /Keliber lithium Strategic Projects/);
  assert.match(event.summary, /€150 million EIB loan is separately coded/);

  const upCatalyst = getFinancialCommitmentById("fin-eu-eib-2025-up-catalyst-loan")!;
  assert.match(upCatalyst.notes ?? "", /fin-eu-eib-2024-keliber-loan/);
  assert.doesNotMatch(upCatalyst.notes ?? "", /not separately coded/);
});
