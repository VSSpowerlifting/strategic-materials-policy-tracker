import test from "node:test";
import assert from "node:assert/strict";

import { stageResponseMap } from "@/lib/capital-intelligence";
import {
  getControlMeasureById,
  getEventById,
  getFinancialCommitmentById,
  getMaterialBySlug,
  getProjectById,
  getProjectDesignationById,
  getSourceById,
} from "@/lib/data";

const expectedEvents = [
  "us-critical-minerals-list-2025",
  "eu-critical-raw-materials-act",
  "evt-us-eo-14241-2025",
  "evt-us-eo-14272-2025",
  "evt-us-cm-list-2022",
  "evt-us-proc-11001-2026",
  "evt-au-cmpti-2025",
  "evt-ca-cms-2022",
  "evt-ca-nrcan-cmrdd-2024",
  "evt-cn-mofcom-58-2025",
  "china-rare-earth-suspension-2025-11",
  "evt-eu-crma-strategic-projects-2025-03",
  "evt-ca-g7-cmpa-2025",
] as const;

test("nickel dossier is source-linked and reverse-linked only to explicit nickel policy scope", () => {
  const material = getMaterialBySlug("nickel")!;
  assert.equal(material.nameEn, "Nickel");
  assert.equal(material.nameZh, "镍");
  assert.match(material.statusSummary, /Indonesia/);
  assert.match(material.statusSummary, /does not create a new Indonesian policy event/);
  assert.match(material.chinaPositionNote, /Indonesia, not China/);
  assert.match(material.diversificationNote ?? "", /NTwist/);

  for (const id of expectedEvents) {
    assert.ok(material.eventIds.includes(id), `nickel dossier missing event ${id}`);
    assert.ok(getEventById(id)?.affectedMaterialIds.includes("nickel"), `${id} does not declare nickel scope`);
  }

  assert.ok(!material.eventIds.includes("evt-us-cm-list-2018"));
  assert.ok(!material.eventIds.includes("evt-us-eo-13953-2020"));
  assert.ok(!material.eventIds.includes("evt-uk-cms-2022"));

  for (const id of [
    "src-iea-critical-minerals-2026",
    "src-usgs-nickel-mcs-2026",
    "src-nrcan-cms-2022",
    "src-nrcan-cmrdd-2024",
    "src-nrcan-g7-cmpa-2025",
    "src-ec-crma",
    "src-mofcom-58",
  ]) {
    assert.ok(material.sourceIds.includes(id), `nickel dossier missing source ${id}`);
    assert.ok(getSourceById(id), `missing registered source ${id}`);
  }
});

test("Canadian Kingston recycling records promote nickel and become fully tracked", () => {
  const project = getProjectById("prj-ca-cyclic-kingston-demonstration-plant")!;
  assert.ok(project.materialIds.includes("nickel"));
  assert.ok(!project.untrackedMaterialsAsStated.some((item) => /nickel/i.test(item)));
  assert.equal(project.materialAttribution, "tracked_only");

  for (const id of [
    "fin-ca-cmrdd-2024-cyclic-materials",
    "fin-ca-cmrdd-2024-kingston-awards",
  ]) {
    const row = getFinancialCommitmentById(id)!;
    assert.ok(row.materialIds.includes("nickel"));
    assert.ok(!row.untrackedMaterialsAsStated.some((item) => /nickel/i.test(item)));
    assert.equal(row.materialAttribution, "tracked_only");
  }

  assert.ok(getEventById("evt-ca-nrcan-cmrdd-2024")?.affectedMaterialIds.includes("nickel"));
});

test("four EU Strategic Projects promote battery-grade nickel in both project and designation records", () => {
  const pairs = [
    ["prj-fi-fortum-hydromet", "dsg-eu-crma-fortum-hydromet"],
    ["prj-fr-gallicam", "dsg-eu-crma-gallicam"],
    ["prj-fr-orano-hydrometallurgy", "dsg-eu-crma-orano-hydrometallurgy"],
    ["prj-se-northcycle", "dsg-eu-crma-northcycle"],
  ] as const;

  for (const [projectId, designationId] of pairs) {
    const project = getProjectById(projectId)!;
    const designation = getProjectDesignationById(designationId)!;
    assert.ok(project.materialIds.includes("nickel"), projectId);
    assert.ok(designation.materialIds.includes("nickel"), designationId);
    assert.ok(!project.untrackedMaterialsAsStated.some((item) => /nickel/i.test(item)), projectId);
    assert.ok(!designation.untrackedMaterialsAsStated.some((item) => /nickel/i.test(item)), designationId);
  }

  const event = getEventById("evt-eu-crma-strategic-projects-2025-03")!;
  assert.ok(event.affectedMaterialIds.includes("nickel"));
  assert.match(event.summary, /cobalt and battery-grade nickel/);
});

test("Australian CMPTI promotes nickel from the existing statutory material list", () => {
  const row = getFinancialCommitmentById("fin-au-cmpti-2025-production-tax-offset")!;
  assert.ok(row.materialIds.includes("nickel"));
  assert.ok(!row.untrackedMaterialsAsStated.includes("nickel"));
  assert.equal(row.materialAttribution, "includes_untracked");
  assert.ok(getEventById("evt-au-cmpti-2025")?.affectedMaterialIds.includes("nickel"));
});

test("Canada G7 CMPA carries event-level nickel scope without inventing a new financial row", () => {
  const event = getEventById("evt-ca-g7-cmpa-2025")!;
  assert.ok(event.affectedMaterialIds.includes("nickel"));
  assert.match(event.summary, /C\$500,000/);
  assert.match(event.summary, /NTwist Inc\./);
  assert.match(event.summary, /not separately recorded as rows/);
});

test("China No. 58 attributes nickel only through ternary cathode precursors", () => {
  const row = getControlMeasureById("ctl-cn-58-2025-battery-cathode-licensing")!;
  assert.ok(row.materialIds.includes("nickel"));
  assert.deepEqual(row.controlledStages, ["component_manufacturing"]);
  assert.equal(row.materialAttribution, "includes_untracked");
  assert.ok(row.untrackedMaterialsAsStated.some((item) => item.includes("三元正极材料")));
  assert.match(
    row.evidence.find((entry) => entry.supports.includes("item_scope"))?.note ?? "",
    /do not mean the measure controls raw lithium, raw cobalt or raw nickel/,
  );

  const event = getEventById("evt-cn-mofcom-58-2025")!;
  assert.match(event.analyticalSignificance, /cobalt- and nickel-bearing ternary precursors/);
  assert.match(event.analyticalSignificance, /not from controls on raw cobalt or raw nickel/);
});

test("nickel stage-response map carries suspended No. 58 at component manufacturing", () => {
  const map = stageResponseMap("2026-10-07");
  const cell = map.get("nickel")?.get("component_manufacturing");
  assert.ok(cell);
  assert.ok(cell.controlIds.includes("ctl-cn-58-2025-battery-cathode-licensing"));
  assert.equal(cell.controlStatuses.suspended, 1);
});
