import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllSources,
} from "../lib/data";
import { milestoneEvidenceBoundary } from "../lib/project-milestones";

test("F5: Perpetua Q2 2026 SEC 10-Q has its actual EDGAR filing date, not fiscal period end", () => {
  // SEC original accession index: https://www.sec.gov/Archives/edgar/data/1526243/0001104659-26-097134-index.html
  // EDGAR says filed 2026-08-14; the covered quarter ended 2026-06-30.
  const all = getAllSources();
  const matches = all.filter(s => s.id === "src-perpetua-sec-2026-q2");
  assert.equal(matches.length, 1, "do not create a duplicate registered evidence source");
  const s = matches[0];
  assert.equal(s.datePublished, "2026-08-14");
  assert.notEqual(s.datePublished, "2026-06-30", "report period is not publication");
  assert.equal(s.dateAccessed, "2026-10-02", "preserve the original access receipt");
  assert.equal(s.confidence, "primary");
  assert.equal(s.language, "en");
  assert.equal(s.url,
    "https://www.sec.gov/Archives/edgar/data/1526243/000110465926097134/ppta-20260630x10q.htm");
  assert.deepEqual(milestoneEvidenceBoundary(s),
    {date: "2026-08-14", basis: "publication"});
});

test("F5: verifying a source publication clock cannot promote finance approval or physical milestones", () => {
  const all = getAllFinancialCommitments();
  const exim = all.find(f => f.id === "fin-us-exim-perpetua-stibnite-2026");
  assert.ok(exim);
  assert.equal(exim.financialStatusHistory.at(-1)?.status, "decided",
    "EXIM board authorization is not executed or disbursed money");
  assert.equal(exim.financialStatusHistory.at(-1)?.date, "2026-05-21");

  const dpa = all.find(f => f.id === "fin-us-dod-perpetua-stibnite-dpa");
  assert.ok(dpa);
  assert.equal(dpa.financialStatusHistory.at(-1)?.status, "disbursed",
    "the separate DPA agreement has its own already sourced history");
  assert.ok(getAllProjectMilestones().length === 0,
    "factual source-metadata repair does not approve physical assertions");
});
