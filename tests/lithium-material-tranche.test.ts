import test from "node:test";
import assert from "node:assert/strict";

import { stageResponseMap } from "@/lib/capital-intelligence";
import {
  getControlMeasureById,
  getEventById,
  getFinancialCommitmentById,
  getMaterialBySlug,
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
  "evt-uk-cms-2025",
  "evt-ca-ica-divest-2022",
  "evt-cn-mofcom-58-2025",
  "china-rare-earth-suspension-2025-11",
  "evt-ca-g7-cmpa-2025",
  "evt-ca-nrcan-pdac-2026",
  "evt-eu-resourceeu-2025",
] as const;

test("lithium dossier is source-linked and every listed event declares lithium scope", () => {
  const material = getMaterialBySlug("lithium")!;
  assert.equal(material.nameEn, "Lithium");
  assert.equal(material.nameZh, "锂");
  assert.match(material.statusSummary, /No\. 58/);
  assert.match(material.statusSummary, /raw lithium itself/);
  assert.match(material.chinaPositionNote, /dominant lithium refiner/);
  assert.match(material.diversificationNote ?? "", /50,000 tonnes/);

  for (const id of expectedEvents) {
    assert.ok(material.eventIds.includes(id), `lithium dossier missing event ${id}`);
    assert.ok(getEventById(id)?.affectedMaterialIds.includes("lithium"), `${id} does not declare lithium scope`);
  }

  for (const id of [
    "src-iea-critical-minerals-2026",
    "src-usgs-lithium-mcs-2026",
    "src-au-req-2026-09",
    "src-nrcan-lithium-processing-2024",
    "src-gov-uk-cms-2025",
    "src-mofcom-58",
  ]) {
    assert.ok(material.sourceIds.includes(id), `lithium dossier missing source ${id}`);
    assert.ok(getSourceById(id), `missing registered source ${id}`);
  }
});

test("Canadian ICA divestiture controls are promoted from untracked lithium to tracked lithium", () => {
  for (const id of [
    "ctl-ca-ica-2022-divest-chengze-lithium-chile",
    "ctl-ca-ica-2022-divest-sinomine-power-metals",
    "ctl-ca-ica-2022-divest-zangge-ultra-lithium",
  ]) {
    const row = getControlMeasureById(id)!;
    assert.deepEqual(row.materialIds, ["lithium"]);
    assert.equal(row.materialAttribution, "tracked_only");
    assert.deepEqual(row.untrackedMaterialsAsStated, []);
  }

  const event = getEventById("evt-ca-ica-divest-2022")!;
  assert.match(event.summary, /Lithium is now tracked/);
  assert.doesNotMatch(event.summary, /None of these minerals is in the v1 material set/);
});

test("existing Australian and Canadian financial rows promote lithium without inventing new instruments", () => {
  const cmpti = getFinancialCommitmentById("fin-au-cmpti-2025-production-tax-offset")!;
  assert.ok(cmpti.materialIds.includes("lithium"));
  assert.ok(!cmpti.untrackedMaterialsAsStated.includes("lithium"));
  assert.equal(cmpti.materialAttribution, "includes_untracked");

  for (const id of [
    "fin-ca-pdac-2026-nb-granitoids-cmgd",
    "fin-ca-pdac-2026-nb-maritimes-basin-cmgd",
  ]) {
    const row = getFinancialCommitmentById(id)!;
    assert.ok(row.materialIds.includes("lithium"));
    assert.ok(!row.untrackedMaterialsAsStated.includes("lithium"));
    assert.ok(row.untrackedMaterialsAsStated.length > 0);
    assert.equal(row.materialAttribution, "includes_untracked");
  }
});

test("China No. 58 is a lithium supply-chain control, not a raw-lithium export restriction", () => {
  const row = getControlMeasureById("ctl-cn-58-2025-battery-cathode-licensing")!;
  assert.deepEqual(row.materialIds, ["lithium"]);
  assert.deepEqual(row.controlledStages, ["component_manufacturing"]);
  assert.equal(row.materialAttribution, "includes_untracked");
  assert.ok(row.untrackedMaterialsAsStated.some((item) => item.includes("三元正极材料")));
  assert.match(
    row.evidence.find((entry) => entry.supports.includes("item_scope"))?.note ?? "",
    /does not mean the measure controls raw lithium/,
  );

  const event = getEventById("evt-cn-mofcom-58-2025")!;
  assert.match(event.analyticalSignificance, /Lithium and graphite now touch tracked materials/);
  assert.match(event.analyticalSignificance, /suspended before its start date/);
});

test("lithium appears in the stage-response map at component manufacturing with No. 58 suspended", () => {
  const map = stageResponseMap("2026-10-07");
  const cell = map.get("lithium")?.get("component_manufacturing");
  assert.ok(cell);
  assert.ok(cell.controlIds.includes("ctl-cn-58-2025-battery-cathode-licensing"));
  assert.equal(cell.controlStatuses.suspended, 1);
});
