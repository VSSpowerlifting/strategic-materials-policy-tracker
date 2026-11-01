import test from "node:test";
import assert from "node:assert/strict";
import { getPublicProjectInvestigation } from "../lib/research-experience";
import { buildPublicInvestigationPacket } from "../lib/investigation-packet";
import * as data from "../lib/data";
import { site } from "../lib/site";
import { GET, generateStaticParams } from "../app/api/v1/projects/[id]/investigation/route";
import { buildSearchIndex, searchDocs } from "../lib/search";
const input = () => ({ projects: data.getAllProjects(), events: data.getAllEvents(), finances: data.getAllFinancialCommitments(), controls: data.getAllControlMeasures(), designations: data.getAllProjectDesignations(), milestones: data.getAllProjectMilestones(), sources: data.getAllSources() });
const wagerup = "prj-au-alcoa-sojitz-gallium";

test("page projection and emitted packet bytes agree, remain deterministic and source-resolving", async () => {
  const page = getPublicProjectInvestigation(wagerup)!;
  const response = await GET(new Request("https://example.test/"), { params: Promise.resolve({ id: wagerup }) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /application\/json/);
  assert.equal(response.headers.get("content-disposition"), `attachment; filename="smpt-${wagerup}-investigation.json"`);
  const bytes = await response.text();
  assert.deepEqual(JSON.parse(bytes), page.packet);
  assert.equal(bytes, JSON.stringify(getPublicProjectInvestigation(wagerup)!.packet, null, 2) + "\n");
  assert.equal(page.packet.corpus.revision, site.lastUpdated);
  assert.equal(page.packet.corpus.legalStatusCutoff, site.lastUpdated);
  assert.equal(page.packet.corpus.view, "current_corpus_revision");
  assert.deepEqual(page.packet.nativeMilestones.map(m => m.id), page.pathway.nativeMilestones.map(m => m.id));
  assert.deepEqual(page.packet.financialInstruments.map(f => f.id), page.pathway.financing.filter(f => f.projectRelationship === "directly_attributable").map(f => f.id));
  for (const s of page.packet.sources) assert.equal(s.url, data.getSourceById(s.id)!.url);
  assert.ok(page.packet.nativeMilestones[0].note?.includes("ceremon"));
  assert.ok(generateStaticParams().some(p => p.id === wagerup));
});

test("unknown and unpublished project IDs fail closed in both builder and route", async () => {
  const id = "prj-unpublished-synthetic";
  assert.equal(buildPublicInvestigationPacket(id, input(), data.getAllOrganizations(), site.lastUpdated), null);
  assert.equal(getPublicProjectInvestigation(id), null);
  const response = await GET(new Request("https://example.test/"), { params: Promise.resolve({ id }) });
  assert.equal(response.status, 404);
});

test("explicit allowlist excludes private synthetic fields at every nested boundary", () => {
  const raw = structuredClone(input());
  const poison = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(poison);
    else if (v && typeof v === "object") {
      Object.values(v).forEach(poison);
      Object.assign(v, { internalNotes: "PRIVATE-SENTINEL", adjudicationPath: "/private/evidence/SECRET", reviewerPacket: "PRIVATE-SENTINEL" });
    }
  };
  poison(raw);
  const orgs = structuredClone(data.getAllOrganizations()); poison(orgs);
  const packet = buildPublicInvestigationPacket(wagerup, raw, orgs, site.lastUpdated)!;
  assert.doesNotMatch(JSON.stringify(packet), /PRIVATE-SENTINEL|adjudicationPath|reviewerPacket|\/private\/evidence/);
  assert.ok(packet.sources.length);
});

test("financial conditions, exact decimal strings, undated histories and nonallocative packages keep their meanings", () => {
  for (const p of data.getAllProjects()) {
    const packet = getPublicProjectInvestigation(p.id)!.packet;
    for (const f of [...packet.financialInstruments, ...packet.nonallocativeAssociations]) {
      const original = data.getAllFinancialCommitments().find(c => c.id === f.id)!;
      assert.deepEqual(f.financialStatusHistory.map(s => [s.status, s.date, s.sourceId, s.note]), original.financialStatusHistory.map(s => [s.status, s.date, s.sourceId, s.note ?? null]));
      assert.equal(f.amount?.value, original.amount?.value);
      assert.equal(f.amount?.amountAsStated, original.amount?.amountAsStated);
      assert.deepEqual(f.terms.map(t => t.asStated), original.terms.map(t => t.asStated));
      assert.equal(f.legacyPhysicalObservations.length, original.implementationStatusHistory.length);
      if (f.projectRelationship === "nonallocative_association") assert.notEqual(original.projectId, p.id);
    }
    assert.equal(packet.nativeMilestones.length, data.getProjectMilestonesByProject(p.id).length);
  }
  const stibnite = getPublicProjectInvestigation("prj-us-stibnite")!.packet;
  assert.equal(stibnite.nativeMilestones.length, 0);
  assert.match(JSON.stringify(stibnite), /conditions precedent/);
  assert.ok(stibnite.financialInstruments.some(f => f.legacyPhysicalObservations.some(s => s.date === null)));
});

test("exact search preserves document numbers, Chinese titles, organization aliases and finds published industrial evidence", () => {
  const index = buildSearchIndex();
  const milestone = data.getAllProjectMilestones()[0];
  const industrial = searchDocs(index, "Wagerup groundbreaking");
  assert.ok(industrial.some(d => d.id === milestone.projectId && d.href.endsWith("#project-industrial")));
  const event = data.getEventById("evt-cn-gage-2023")!;
  assert.ok(searchDocs(index, event.documentNumber!).some(d => d.id === event.id));
  assert.ok(searchDocs(index, event.titleOriginal!).some(d => d.id === event.id));
  assert.ok(searchDocs(index, "Alcoa").some(d => d.id === wagerup));
  const org = data.getAllOrganizations().find(o => o.aliases.length)!;
  assert.ok(searchDocs(index, org.aliases[0]).some(d => d.id === org.id));
  assert.equal(searchDocs(index, "PRIVATE-SENTINEL").length, 0);
});
