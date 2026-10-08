import test from "node:test";
import assert from "node:assert/strict";
import { buildEditorialReviewQueue, editorialReviewCsv } from "@/lib/monitor-editorial-queue";
import { getAllSources } from "@/lib/data";
import {
  reconcilePublications,
  parseFederalRegisterJson,
  type PilotReport,
  type ReviewObservation,
} from "@/lib/source-monitor";

const firstPublication = parseFederalRegisterJson(JSON.stringify({
  results: [
    {
      document_number: "2026-19001", title: "Critical minerals list revision",
      html_url: "https://www.federalregister.gov/documents/2026/10/07/2026-19001/list",
      publication_date: "2026-10-07",
    },
    {
      document_number: "2026-19002", title: "Parking update",
      html_url: "https://www.federalregister.gov/documents/2026/10/07/2026-19002/parking",
      publication_date: "2026-10-07",
    },
  ],
}));

function reportWithChanges(): PilotReport {
  const sourceId = "watch-us-federal-register-interior";
  const at = "2026-10-08T10:00:00.000Z";
  const boot = reconcilePublications(sourceId, undefined, firstPublication, at);
  const after = reconcilePublications(sourceId, boot.memory, [
    { ...firstPublication[0], title: "Critical minerals list revision, corrected", fingerprint: "b".repeat(64) },
    ...firstPublication,
    { ...firstPublication[1], id: "d".repeat(64), title: "Rare earth item", fingerprint: "c".repeat(64),
      url: "https://www.federalregister.gov/documents/2026/10/08/2026-19003/rare-earth" },
  ], "2026-10-09T10:00:00.000Z");
  // Unique native identity in real parsing: here the duplicate first ID is
  // suppressed by passing only one copy of the revised publication.
  return {
    version: 1, mode: "shadow_review_only", observedAt: "2026-10-09T10:00:00.000Z",
    sources: [{ ...after.report,
      reviewOnly: [
        { ...firstPublication[0], change: "revised", title: "Critical minerals list revision, corrected",
          fingerprint: "b".repeat(64) },
        { ...firstPublication[1], id: "d".repeat(64), title: "Rare earth item",
          url: "https://www.federalregister.gov/documents/2026/10/08/2026-19003/rare-earth",
          fingerprint: "c".repeat(64), change: "new" },
      ],
      observed: 3, newCount: 1, revisedCount: 1,
    }],
    newPublications: 1, revisions: 1, degradedSources: 0, allSourcesHealthy: true,
  };
}

test("baseline observation creates an empty editorial queue without retrospective 150-item intake", () => {
  const s = reconcilePublications("watch-us-federal-register-interior", undefined,
    firstPublication, "2026-10-08T00:00:00Z");
  const report: PilotReport = {
    version: 1, mode: "shadow_review_only", observedAt: "2026-10-08T00:00:00Z",
    sources: [s.report], newPublications: 0, revisions: 0, degradedSources: 0, allSourcesHealthy: true,
  };
  const queue = buildEditorialReviewQueue(report, getAllSources());
  assert.equal(queue.items.length, 0);
  assert.equal(queue.countNew, 0);
  assert.equal(queue.countRevised, 0);
  assert.match(editorialReviewCsv(queue), /Observation ID/);
  assert.equal(editorialReviewCsv(queue).trim().split("\r\n").length, 1);
});

test("human review queue preserves stable IDs, differentiates revisions, and only hints exact citation matches", () => {
  const report = reportWithChanges();
  const source = { ...getAllSources()[0], id: "src-existing-matching-url", url: firstPublication[0].url };
  const nearMiss = { ...source, id: "src-nearby-not-same-document",
    url: firstPublication[0].url + "?edition=secondary" };
  const queue = buildEditorialReviewQueue(report, [source, nearMiss]);
  assert.equal(queue.countNew, 1);
  assert.equal(queue.countRevised, 1);
  assert.equal(queue.countMatchingCitations, 1);
  assert.equal(queue.items.length, 2);
  assert.equal(queue.items[0].reviewStatus, "unreviewed");
  const revision = queue.items.find((x) => x.change === "revised")!;
  assert.equal(revision.observationId, firstPublication[0].id);
  assert.deepEqual(revision.exactCitationSourceIds, ["src-existing-matching-url"]);
  assert.equal(revision.publicationDate, "2026-10-07");
  assert.equal(revision.keywordHintOnly, true);
  const novel = queue.items.find((x) => x.change === "new")!;
  assert.deepEqual(novel.exactCitationSourceIds, []);
  assert.equal(novel.observedAt, report.observedAt);
  const csv = editorialReviewCsv(queue);
  assert.match(csv, /src-existing-matching-url/);
  assert.doesNotMatch(csv, /src-nearby-not-same-document/);
  assert.match(csv, /Human disposition \(local only\)/);
  assert.doesNotMatch(JSON.stringify(queue), /reviewerNotes|approval|classification|candidateId|materialIds|policyStatus/);
  assert.deepEqual(buildEditorialReviewQueue(report, [source, nearMiss]), queue);
});

test("CSV escapes untrusted official title fields rather than allowing spreadsheet formulas", () => {
  const report = reportWithChanges();
  const observation = report.sources[0].reviewOnly[0];
  report.sources[0].reviewOnly = [{
    ...observation, title: ' =HYPERLINK("https://example.org","click")',
  } as ReviewObservation];
  report.sources[0].newCount = 0;
  report.sources[0].revisedCount = 1;
  report.newPublications = 0;
  report.revisions = 1;
  const csv = editorialReviewCsv(buildEditorialReviewQueue(report, []));
  assert.match(csv, /"' =HYPERLINK\(""https:\/\/example.org"",""click""\)"/);
});

test("malformed counts or repeated identities fail closed, rather than dropping unreviewed observations", () => {
  const report = reportWithChanges();
  report.revisions = 0;
  assert.throws(() => buildEditorialReviewQueue(report, []), /did not reconcile/);
  report.revisions = 1;
  report.sources[0].reviewOnly.push(report.sources[0].reviewOnly[0]);
  assert.throws(() => buildEditorialReviewQueue(report, []), /Repeated editorial observation identity/);
});

test("a degraded source cannot leak cached or fabricated observations into a healthy review queue", () => {
  const report = reportWithChanges();
  report.sources[0].health = "blocked";
  report.sources[0].status = 403;
  report.sources[0].reviewOnly = [];
  report.sources[0].newCount = 0;
  report.sources[0].revisedCount = 0;
  report.newPublications = 0;
  report.revisions = 0;
  report.degradedSources = 1;
  report.allSourcesHealthy = false;
  const queue = buildEditorialReviewQueue(report, []);
  assert.deepEqual(queue.items, []);
  assert.deepEqual(queue.sourcesDegraded, ["watch-us-federal-register-interior"]);
});
