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
  "evt-us-cm-list-2018",
  "evt-us-eo-13953-2020",
  "evt-us-cm-list-2022",
  "evt-us-proc-11001-2026",
  "evt-au-cmpti-2025",
  "evt-ca-cms-2022",
  "evt-uk-cms-2022",
  "evt-ca-nrcan-cmrdd-2024",
  "evt-cn-mofcom-58-2025",
  "china-rare-earth-suspension-2025-11",
  "evt-eu-crma-strategic-projects-2025-03",
] as const;

test("cobalt dossier is current, source-linked and reverse-linked to every promoted event", () => {
  const material = getMaterialBySlug("cobalt")!;
  assert.equal(material.nameEn, "Cobalt");
  assert.equal(material.nameZh, "钴");
  assert.match(material.statusSummary, /Democratic Republic of the Congo/);
  assert.match(material.statusSummary, /does not yet code the DRC quota/);
  assert.match(material.chinaPositionNote, /leading producer of refined cobalt/);
  assert.match(material.diversificationNote ?? "", /Cyclic Materials/);

  for (const id of expectedEvents) {
    assert.ok(material.eventIds.includes(id), `cobalt dossier missing event ${id}`);
    assert.ok(getEventById(id)?.affectedMaterialIds.includes("cobalt"), `${id} does not declare cobalt scope`);
  }

  for (const id of [
    "src-iea-critical-minerals-2026",
    "src-usgs-cobalt-mcs-2026",
    "src-nrcan-cmrdd-2024",
    "src-gov-uk-cms-2022",
    "src-ec-crma",
    "src-mofcom-58",
  ]) {
    assert.ok(material.sourceIds.includes(id), `cobalt dossier missing source ${id}`);
    assert.ok(getSourceById(id), `missing registered source ${id}`);
  }
});

test("Canadian Kingston recycling records promote cobalt without promoting nickel", () => {
  const project = getProjectById("prj-ca-cyclic-kingston-demonstration-plant")!;
  assert.ok(project.materialIds.includes("cobalt"));
  assert.ok(project.untrackedMaterialsAsStated.includes("nickel"));
  assert.ok(!project.untrackedMaterialsAsStated.includes("cobalt"));

  for (const id of [
    "fin-ca-cmrdd-2024-cyclic-materials",
    "fin-ca-cmrdd-2024-kingston-awards",
  ]) {
    const row = getFinancialCommitmentById(id)!;
    assert.ok(row.materialIds.includes("cobalt"));
    assert.ok(row.untrackedMaterialsAsStated.includes("nickel"));
    assert.ok(!row.untrackedMaterialsAsStated.includes("cobalt"));
    assert.equal(row.materialAttribution, "includes_untracked");
  }

  assert.ok(getEventById("evt-ca-nrcan-cmrdd-2024")?.affectedMaterialIds.includes("cobalt"));
});

test("four existing EU Strategic Projects promote cobalt in both project and designation records", () => {
  const pairs = [
    ["prj-fi-fortum-hydromet", "dsg-eu-crma-fortum-hydromet"],
    ["prj-fr-gallicam", "dsg-eu-crma-gallicam"],
    ["prj-fr-orano-hydrometallurgy", "dsg-eu-crma-orano-hydrometallurgy"],
    ["prj-se-northcycle", "dsg-eu-crma-northcycle"],
  ] as const;

  for (const [projectId, designationId] of pairs) {
    const project = getProjectById(projectId)!;
    const designation = getProjectDesignationById(designationId)!;
    assert.ok(project.materialIds.includes("cobalt"), projectId);
    assert.ok(designation.materialIds.includes("cobalt"), designationId);
    assert.ok(!project.untrackedMaterialsAsStated.includes("cobalt"), projectId);
    assert.ok(!designation.untrackedMaterialsAsStated.includes("cobalt"), designationId);
  }

  const event = getEventById("evt-eu-crma-strategic-projects-2025-03")!;
  assert.ok(event.affectedMaterialIds.includes("cobalt"));
  assert.match(event.summary, /four of those also naming cobalt/);
});

test("Australian CMPTI promotes cobalt from the existing statutory material list", () => {
  const row = getFinancialCommitmentById("fin-au-cmpti-2025-production-tax-offset")!;
  assert.ok(row.materialIds.includes("cobalt"));
  assert.ok(!row.untrackedMaterialsAsStated.includes("cobalt"));
  assert.equal(row.materialAttribution, "includes_untracked");
  assert.ok(getEventById("evt-au-cmpti-2025")?.affectedMaterialIds.includes("cobalt"));
});

test("China No. 58 attributes cobalt only through ternary cathode precursors", () => {
  const row = getControlMeasureById("ctl-cn-58-2025-battery-cathode-licensing")!;
  assert.ok(row.materialIds.includes("cobalt"));
  assert.deepEqual(row.controlledStages, ["component_manufacturing"]);
  assert.equal(row.materialAttribution, "includes_untracked");
  assert.ok(row.untrackedMaterialsAsStated.some((item) => item.includes("三元正极材料")));
  assert.match(
    row.evidence.find((entry) => entry.supports.includes("item_scope"))?.note ?? "",
    /Neither attribution means the measure controls raw lithium or raw cobalt/,
  );

  const event = getEventById("evt-cn-mofcom-58-2025")!;
  assert.match(event.analyticalSignificance, /cobalt-bearing ternary precursors/);
  assert.match(event.analyticalSignificance, /not from a control on raw cobalt/);
});

test("cobalt stage-response map carries the suspended No. 58 control at component manufacturing", () => {
  const map = stageResponseMap("2026-10-07");
  const cell = map.get("cobalt")?.get("component_manufacturing");
  assert.ok(cell);
  assert.ok(cell.controlIds.includes("ctl-cn-58-2025-battery-cathode-licensing"));
  assert.equal(cell.controlStatuses.suspended, 1);
});
