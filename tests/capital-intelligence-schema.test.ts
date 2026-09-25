import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONTROLLED_ITEM_TYPES,
  DESIGNATION_EVIDENCE_FIELDS,
  DESIGNATION_STATUSES,
  ORGANIZATION_EVIDENCE_FIELDS,
  ORGANIZATION_ID_PREFIX,
  ORGANIZATION_KINDS,
  ORGANIZATION_LINK_TYPES,
  PROGRAMME_EVIDENCE_FIELDS,
  PROGRAMME_ID_PREFIX,
  PROGRAMME_KINDS,
  PROJECT_DESIGNATION_ID_PREFIX,
  PROJECT_EVIDENCE_FIELDS,
  PROJECT_ID_PREFIX,
  FINANCIAL_COMMITMENT_ID_PREFIX,
  CONTROL_MEASURE_ID_PREFIX,
} from "@/lib/types";
import type { Organization, Programme, Project, ProjectDesignation } from "@/lib/types";
import {
  controlledItemTypeLabels,
  designationEvidenceFieldLabels,
  designationStatusLabels,
  organizationEvidenceFieldLabels,
  organizationKindLabels,
  organizationLinkTypeLabels,
  programmeEvidenceFieldLabels,
  programmeKindLabels,
  projectEvidenceFieldLabels,
} from "@/lib/labels";
import {
  getAllEvents,
  getAllFramingClaims,
  getAllJurisdictions,
  getAllMaterials,
  getAllOrganizations,
  getAllProgrammes,
  getAllProjectDesignations,
  getAllProjects,
  getAllSources,
  getAllWatchedSources,
  getOrganizationById,
  getProgrammeById,
  getProjectById,
  getProjectDesignationById,
  getProjectDesignationsByEvent,
} from "@/lib/data";
import {
  DESIGNATION_FIELD_EVIDENCE,
  ORGANIZATION_FIELD_EVIDENCE,
  PROGRAMME_FIELD_EVIDENCE,
  PROJECT_FIELD_EVIDENCE,
} from "@/scripts/validate-capital-control";

// Capital intelligence (v0.6): the registry and designation schema. Counts are
// derived from the seed files, never pinned.

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const VOCABULARIES: [name: string, values: readonly string[], labels: Record<string, string>][] = [
  ["ORGANIZATION_KINDS", ORGANIZATION_KINDS, organizationKindLabels],
  ["ORGANIZATION_LINK_TYPES", ORGANIZATION_LINK_TYPES, organizationLinkTypeLabels],
  ["ORGANIZATION_EVIDENCE_FIELDS", ORGANIZATION_EVIDENCE_FIELDS, organizationEvidenceFieldLabels],
  ["PROJECT_EVIDENCE_FIELDS", PROJECT_EVIDENCE_FIELDS, projectEvidenceFieldLabels],
  ["PROGRAMME_KINDS", PROGRAMME_KINDS, programmeKindLabels],
  ["PROGRAMME_EVIDENCE_FIELDS", PROGRAMME_EVIDENCE_FIELDS, programmeEvidenceFieldLabels],
  ["DESIGNATION_STATUSES", DESIGNATION_STATUSES, designationStatusLabels],
  ["DESIGNATION_EVIDENCE_FIELDS", DESIGNATION_EVIDENCE_FIELDS, designationEvidenceFieldLabels],
  ["CONTROLLED_ITEM_TYPES", CONTROLLED_ITEM_TYPES, controlledItemTypeLabels],
];

for (const [name, values, labels] of VOCABULARIES) {
  test(`${name}: unique snake_case values, each with exactly one distinct label`, () => {
    assert.ok(values.length > 0, `${name} is empty`);
    assert.equal(new Set(values).size, values.length, `${name} repeats a value`);
    for (const v of values) assert.match(v, /^[a-z][a-z0-9_]*$/, `${name}: "${v}" is not snake_case`);
    assert.deepEqual(Object.keys(labels).sort(), [...values].sort(), `${name}: the label map must cover exactly its values`);
    const texts = values.map((v) => labels[v]);
    assert.equal(new Set(texts).size, texts.length, `${name}: two values share one label`);
  });
}

test("every registry and designation field has an evidence category, and every category covers a field", () => {
  const maps: [string, Readonly<Record<string, string>>, readonly string[]][] = [
    ["organization", ORGANIZATION_FIELD_EVIDENCE, ORGANIZATION_EVIDENCE_FIELDS],
    ["project", PROJECT_FIELD_EVIDENCE, PROJECT_EVIDENCE_FIELDS],
    ["programme", PROGRAMME_FIELD_EVIDENCE, PROGRAMME_EVIDENCE_FIELDS],
    ["designation", DESIGNATION_FIELD_EVIDENCE, DESIGNATION_EVIDENCE_FIELDS],
  ];
  for (const [name, map, categories] of maps)
    assert.deepEqual([...new Set(Object.values(map))].sort(), [...categories].sort(), `${name}: categories and fields drift`);
});

test("org-, prj-, prg- and dsg- are reserved, distinct from every other prefix, and documented", () => {
  const prefixes = [ORGANIZATION_ID_PREFIX, PROJECT_ID_PREFIX, PROGRAMME_ID_PREFIX, PROJECT_DESIGNATION_ID_PREFIX];
  assert.deepEqual(prefixes, ["org-", "prj-", "prg-", "dsg-"]);
  const others = [FINANCIAL_COMMITMENT_ID_PREFIX, CONTROL_MEASURE_ID_PREFIX, "evt-", "src-", "fc-", "cand-"];
  for (const p of prefixes)
    for (const q of [...others, ...prefixes.filter((x) => x !== p)])
      assert.ok(!p.startsWith(q) && !q.startsWith(p), `${p} overlaps ${q}`);
  const existing = [
    ...getAllEvents(),
    ...getAllSources(),
    ...getAllFramingClaims(),
    ...getAllMaterials(),
    ...getAllJurisdictions(),
    ...getAllWatchedSources(),
  ].map((r) => r.id);
  for (const id of existing) for (const p of prefixes) assert.ok(!id.startsWith(p), `existing id "${id}" uses reserved prefix ${p}`);
  for (const doc of ["README.md", "CLAUDE.md", "app/methodology/page.tsx"])
    for (const p of prefixes) assert.ok(read(doc).includes(p), `${doc} must document the ${p} prefix`);
});

test("registry loaders are ordered by id, hand out fresh arrays and resolve their own ids", () => {
  const lists: [string, () => { id: string }[], (id: string) => unknown][] = [
    ["organizations", getAllOrganizations, getOrganizationById],
    ["projects", getAllProjects, getProjectById],
    ["programmes", getAllProgrammes, getProgrammeById],
    ["designations", getAllProjectDesignations, getProjectDesignationById],
  ];
  for (const [name, all, byId] of lists) {
    const ids = all().map((r) => r.id);
    assert.deepEqual(ids, [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), `${name} are not ordered by id`);
    assert.notEqual(all(), all(), `${name}: each call returns a fresh array`);
    for (const id of ids) assert.ok(byId(id), `${name}: ${id} does not resolve`);
    assert.equal(byId("no-such-id"), undefined);
  }
  for (const d of getAllProjectDesignations()) assert.ok(getProjectDesignationsByEvent(d.eventId).some((x) => x.id === d.id));
});

// --- Compile-time guarantees ----------------------------------------------------------

type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;

test("registries hold no money, and designations hold no amount", () => {
  // A registry record says who or what, never how much: stacks and portfolios
  // are derived from the financial rows that point at it.
  const moneyOnOrg: HasKey<Organization, "amount" | "totals" | "portfolioValue"> = false;
  const moneyOnProject: HasKey<Project, "amount" | "totalCost" | "capitalStack"> = false;
  const moneyOnProgramme: HasKey<Programme, "amount" | "envelope" | "utilisation"> = false;
  const moneyOnDesignation: HasKey<ProjectDesignation, "amount" | "expectedInvestment"> = false;
  const currentStatusStored: HasKey<ProjectDesignation, "status" | "currentStatus"> = false;
  assert.deepEqual([moneyOnOrg, moneyOnProject, moneyOnProgramme, moneyOnDesignation, currentStatusStored], [false, false, false, false, false]);
});
