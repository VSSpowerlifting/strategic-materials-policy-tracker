import test from "node:test";
import assert from "node:assert/strict";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import { getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources, getFinancialCommitmentById } from "@/lib/data";
import { site } from "@/lib/site";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";

const aifId = "src-neo-aif-2026";
const originalUrl = "https://www.neomaterials.com/wp-content/uploads/2026/03/NPM-AIF-2026.pdf";
const narvaReviewId = "review-m3-2-neo-narva-magnets";
const grantId = "fin-eu-jtf-2025-neo-magnet-project";

test("Neo 2025 Annual Information Form has its original March 19 document date, not the assumed month start", () => {
  const sources = getAllSources(), source = sources.find(s => s.id === aifId);
  assert.ok(source);
  assert.equal(sources.filter(s => s.id === aifId).length, 1);
  assert.equal(source.url, originalUrl);
  assert.equal(source.datePublished, "2026-03-19");
  assert.equal(source.dateAccessed, "2026-10-02", "historic source-access receipt remains untouched");
  assert.equal(source.confidence, "primary");
  assert.equal(source.language, "en");
  const preceding = sources.find(s => s.id === "src-neo-aif-2025-jtf-nov2024-amendment");
  assert.equal(preceding?.datePublished, "2025-03-18", "the prior-year AIF is a distinct filing");
});

test("Narva 2026 AIF supports finance context, not a newly invented physical milestone or 2024 legal date", () => {
  const row = getFinancialCommitmentById(grantId);
  assert.ok(row);
  assert.ok(row.evidence.some(x => x.sourceId === aifId && x.supports.includes("amount")));
  assert.equal(row.amount?.value, "14800000");
  assert.equal(row.amount?.currency, "EUR");
  assert.equal(row.amount?.qualifier, "approximately");
  assert.equal(row.financialAmountHistory, undefined, "unreviewed F4 history remains blocked");
  assert.ok(row.financialStatusHistory.some(x => x.status === "partially_disbursed" && x.date === "2025-12-31"));
  assert.equal(getAllProjectMilestones().length, 1, "Neo remains unsigned; sole public native milestone is Wagerup");
});

test("changing only the contextual AIF publication clock does not silently invalidate the canonical Narva M3 review fingerprint", () => {
  const sources = getAllSources();
  const refs = (allSources: typeof sources) => ({
    projects: getAllProjects(),
    sources: allSources,
    commitments: getAllFinancialCommitments(),
    corpusCutoff: site.lastUpdated as string,
    publicMilestoneCount: getAllProjectMilestones().length,
  });
  const revised = buildM3ReviewerPackets(queue, refs(sources), narvaReviewId).worksheets[0];
  const before = sources.map(s => s.id === aifId ? { ...s, datePublished: "2026-03-01" } : s);
  const prior = buildM3ReviewerPackets(queue, refs(before), narvaReviewId).worksheets[0];
  assert.equal(revised.reviewInputDigestSha256, prior.reviewInputDigestSha256,
    "M3 Narva fingerprint pins its production publisher and matching finance observations, not a supplementary AIF date");
  assert.equal(revised.originalSource.id, "src-neo-commercial-production-2026");
  assert.equal(revised.originalSource.publishedOn, "2026-09-14");
  assert.equal(revised.proposedObservation.occurredOn, null,
    "March AIF or September issuer reporting day is not the precise first production day");
  assert.equal(revised.humanAttestationPresent, false);
});
