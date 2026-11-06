import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllFinancialCommitments,
  getFinancialCommitmentById,
  getOrganizationById,
  getProjectById,
} from "@/lib/data";
import { organizationRoles, projectStack } from "@/lib/capital-intelligence";

const id = "fin-au-arafura-nolans-2025-equity";
const orgId = "org-arafura-rare-earths";
const projectId = "prj-au-nolans";

test("EFA's signed equity subscription names the Arafura share issuer, not a project entity", () => {
  const c = getFinancialCommitmentById(id)!;
  assert.equal(c.recipient, "Arafura Rare Earths Limited");
  assert.deepEqual(c.recipientOrgIds, [orgId]);
  assert.equal(c.projectId, projectId);
  assert.ok(c.evidence.some((e) => e.sourceId === "src-arafura-nolans-efa-subscription-2026" && e.supports.includes("recipient")));
  assert.ok(organizationRoles(orgId).received.some((row) => row.id === id));
});

test("Nolans keeps a distinct project identity with a source-supported corporate sponsor", () => {
  const org = getOrganizationById(orgId)!;
  const project = getProjectById(projectId)!;
  assert.equal(org.name, "Arafura Rare Earths Limited");
  assert.equal(org.countryCode, "AU");
  assert.ok(project.sponsorOrgIds.includes(orgId));
  assert.ok(project.evidence.some((e) => e.sourceId === "src-arafura-nolans-efa-subscription-2026" && e.supports.includes("sponsors")));
  assert.ok(organizationRoles(orgId).sponsoredProjects.some((p) => p.id === projectId));
  assert.ok(projectStack(projectId)!.rows.some((row) => row.id === id));
});

test("recipient correction never promotes EFA subscription to cash paid or creates more money", () => {
  const c = getFinancialCommitmentById(id)!;
  assert.equal(c.instrument, "equity");
  assert.equal(c.amount?.value, "100000000");
  assert.equal(c.amount?.currency, "USD");
  assert.deepEqual(c.financialStatusHistory.map((s) => [s.status, s.date]), [
    ["announced", "2025-10-20"],
    ["contracted", "2026-04-01"],
  ]);
  assert.equal(c.implementationStatusHistory.length, 1);
  assert.deepEqual(c.implementationStatusHistory.map((s) => [s.status, s.date, s.sourceId]), [
    ["construction", null, "src-au-nolans-construction-2026"],
  ]);
  assert.ok(c.evidence.some((e) => e.sourceId === "src-au-nolans-construction-2026" && e.supports.includes("status")));
  assert.equal(c.financialStatusHistory.at(-1)?.status, "contracted", "physical construction cannot prove cash disbursement");
  assert.equal(getAllFinancialCommitments().filter((r) => r.id === id).length, 1);
  assert.match(c.notes ?? "", /not a share-issuing entity/);
});
