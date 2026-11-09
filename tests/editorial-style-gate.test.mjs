import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractProseBlocks, pageHash, parseChangedLineRanges,
  scanChangedProse, validateReview, unresolvedFindings, reviewPathForPage,
} from "../scripts/editorial-style-gate.mjs";

const source = [
  '<p className={p}>The notice preserves the pause; it does not repeal the',
  'original measures. The ministry <Src href={mofcom.url}>lists dates</Src>',
  'but offers no explanation for the endpoint.</p>',
  '<p>The April 2025 rare-earth rules remain in force separately.</p>',
].join("\n");

function review(file, hash) {
  return {
    article: file,
    pageSha256: hash,
    reviewer: "Human research editor",
    reviewDate: "2026-11-09",
    checks: Object.fromEntries(
      ["readAllCopy", "desktopPreview", "mobilePreview", "sourceLinksAndFacts"].map(key =>
        [key, { verified: true, notes: "Checked complete text and sources at appropriate viewport." }]
      )
    ),
    exceptions: [],
  };
}

test("extracts JSX visible prose and source-link text, excluding attributes", () => {
  const blocks = extractProseBlocks(source);
  assert.equal(blocks.length, 2);
  assert.match(blocks[0].text, /ministry lists dates but offers no explanation/);
  assert.doesNotMatch(blocks[0].text, /mofcom\.url/);
});

test("regression: flags original artificial contrast and absence framing", () => {
  const scanned = scanChangedProse(source, [{ start: 1, end: 3 }]);
  assert.ok(scanned.findings.some(f => f.rule === "contrast-after-punctuation" &&
    f.match.includes("it does not")));
  assert.ok(scanned.findings.some(f => f.rule === "contrast-absence" &&
    f.match.includes("but offers no")));
});

test("legally necessary negative facts are not categorically prohibited", () => {
  const legal = '<p>Announcement No. 18 does not fall within the six-measure suspension.</p>';
  assert.equal(scanChangedProse(legal, [{ start: 1, end: 1 }]).findings.length, 0);
});

test("flags process narration and artificial alternatives only in edited paragraphs", () => {
  const s = [
    "<p>This article examines the changes rather than forecasting prices.</p>",
    "<p>The April controls cover seven elements.</p>",
  ].join("\n");
  assert.equal(scanChangedProse(s, [{ start: 2, end: 2 }]).findings.length, 0);
  const findings = scanChangedProse(s, [{ start: 1, end: 1 }]).findings;
  assert.ok(findings.some(f => f.rule === "process-narration"));
  assert.ok(findings.some(f => f.rule === "artificial-alternative"));
});

test("handles diff hunks, including deletion-only hunks", () => {
  assert.deepEqual(
    parseChangedLineRanges("@@ -11,0 +12,2 @@\n+new\n@@ -29,1 +31,0 @@\n-old\n"),
    [{ start: 12, end: 13 }, { start: 31, end: 31 }]
  );
});

test("requires a current, named reviewer and specific desktop/mobile/source notes", () => {
  const file = "app/research/china-export-control-suspension-extension/page.tsx";
  const hash = pageHash(source);
  const valid = review(file, hash);
  assert.deepEqual(validateReview(valid, file, hash), []);
  assert.ok(validateReview({ ...valid, pageSha256: "old" }, file, hash)
    .some(e => e.includes("stale")));
  assert.ok(validateReview({ ...valid, reviewer: "ChatGPT" }, file, hash)
    .some(e => e.includes("reviewer")));
  const unverified = { ...valid, checks: {
    ...valid.checks,
    mobilePreview: { verified: false, notes: "Preview was not inspected." },
  } };
  assert.ok(validateReview(unverified, file, hash).some(e => e.includes("mobilePreview")));
});

test("exceptions require an exact local excerpt and a meaningful rationale", () => {
  const findings = scanChangedProse(source, [{ start: 1, end: 3 }]).findings;
  assert.equal(unresolvedFindings(findings, []).length, findings.length);
  const exception = {
    rule: "contrast-after-punctuation",
    excerpt: "The notice preserves the pause; it does not repeal",
    reason: "This legal distinction establishes the continued status of the original instrument.",
  };
  assert.equal(unresolvedFindings(findings, [exception]).length, findings.length - 1);
  assert.equal(unresolvedFindings(findings, [{ ...exception, reason: "fine" }]).length, findings.length);
});

test("review records cover publication pages, but exclude static social assets", () => {
  assert.equal(reviewPathForPage("app/research/page.tsx"),
    "docs/editorial/reviews/research-index.json");
  assert.equal(reviewPathForPage("app/research/china-export-control-suspension-extension/page.tsx"),
    "docs/editorial/reviews/china-export-control-suspension-extension.json");
  assert.equal(reviewPathForPage("app/research/china-export-control-suspension-extension/opengraph-image.tsx"), null);
  assert.equal(reviewPathForPage("app/page.tsx"), null);
});

test("page hash changes when table or metadata source changes even without JSX paragraph edits", () => {
  assert.notEqual(pageHash(source), pageHash(source + '\nconst scope = ["changed"];'));
});
