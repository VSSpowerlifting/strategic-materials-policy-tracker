import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractProseBlocks, pageHash, parseChangedLineRanges,
  scanChangedProse, validateReview, unresolvedFindings, reviewPathForPage, pageForReviewPath,
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


import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

test("integration: missing signoff and flagged contrast fail, corrected copy passes", () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-editorial-ci-"));
  const article = "app/research/example/page.tsx";
  const record = "docs/editorial/reviews/example.json";
  const gate = fileURLToPath(new URL("../scripts/editorial-style-gate.mjs", import.meta.url));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  const put = (path, content) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  };
  const run = (sha) => spawnSync(process.execPath, [gate], {
    cwd: dir,
    env: { ...process.env, EDITORIAL_BASE_SHA: sha },
    encoding: "utf8",
  });
  try {
    git("init", "-q");
    git("config", "user.name", "Editorial CI Test");
    git("config", "user.email", "ci@example.invalid");
    put(article, "<p>Original statement.</p>");
    git("add", "."); git("commit", "-qm", "Baseline research page");
    const base = git("rev-parse", "HEAD");

    const flagged = "<p>That preserves the pause; it does not repeal the restrictions.</p>";
    put(article, flagged);
    git("add", "."); git("commit", "-qm", "Introduce missed contrast");
    const missing = run(base);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /without a fresh/);

    put(record, JSON.stringify(review(article, pageHash(flagged))));
    git("add", "."); git("commit", "-qm", "Add review record");
    const flaggedResult = run(base);
    assert.notEqual(flaggedResult.status, 0);
    assert.match(flaggedResult.stderr, /contrast-after-punctuation/);

    const corrected = "<p>The original regulations remain in place, with implementation suspended.</p>";
    put(article, corrected);
    put(record, JSON.stringify(review(article, pageHash(corrected))));
    git("add", "."); git("commit", "-qm", "Correct prose and update signoff");
    const approved = run(base);
    assert.equal(approved.status, 0, approved.stderr);
    assert.match(approved.stdout, /gate passed/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("review records map back to their pages", () => {
  assert.equal(pageForReviewPath("docs/editorial/reviews/china-export-control-suspension-extension.json"),
    "app/research/china-export-control-suspension-extension/page.tsx");
  assert.equal(pageForReviewPath("docs/editorial/reviews/research-index.json"), "app/research/page.tsx");
  assert.equal(pageForReviewPath("docs/editorial/REVIEW_TEMPLATE.json"), null);
});

test("integration: a record added on its own is validated against the unchanged page", () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-editorial-record-"));
  const article = "app/research/example/page.tsx";
  const record = "docs/editorial/reviews/example.json";
  const gate = fileURLToPath(new URL("../scripts/editorial-style-gate.mjs", import.meta.url));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  const put = (path, content) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  };
  const run = (sha) => spawnSync(process.execPath, [gate], {
    cwd: dir, env: { ...process.env, EDITORIAL_BASE_SHA: sha }, encoding: "utf8",
  });
  try {
    git("init", "-q");
    git("config", "user.name", "Editorial CI Test");
    git("config", "user.email", "ci@example.invalid");
    const page = "<p>Original statement.</p>";
    put(article, page);
    git("add", "."); git("commit", "-qm", "Published page");
    const base = git("rev-parse", "HEAD");

    const draft = review(article, pageHash(page));
    draft.checks.desktopPreview = { verified: false, notes: "" };
    put(record, JSON.stringify(draft));
    git("add", "."); git("commit", "-qm", "Draft record with an unchecked field");
    const unchecked = run(base);
    assert.notEqual(unchecked.status, 0);
    assert.match(unchecked.stderr, /checks\.desktopPreview requires verified:true/);

    put(record, JSON.stringify(review(article, pageHash(page))));
    git("add", "."); git("commit", "-qm", "Completed record");
    const complete = run(base);
    assert.equal(complete.status, 0, complete.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/* ---- Presentation changes keep an attestation; research content changes do not. ---- */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { contentFingerprint, contentTokens, isPresentationAttribute } from "../scripts/editorial-style-gate.mjs";

const articlePage = `
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { figures } from "@/lib/figures";
import styles from "./publication.module.css";

export const metadata: Metadata = {
  title: "Tungsten Supply Security",
  description: "A comparison of tungsten export controls.",
};

const cell = "border-b border-border px-3 py-2";
const rows = [
  { label: "Core loan", value: "£25 million", source: "https://example.gov/loan" },
  { label: "Accordion", value: "£10 million", source: "https://example.gov/accordion" },
];

function Caveat() {
  return <p className="text-sm">Figures are as stated by the issuer.</p>;
}

export default function Page() {
  return (
    <Container className="py-10">
      <h1 className="text-4xl font-semibold">Tungsten Supply Security</h1>
      <p className={styles.lede}>China accounted for about 79% of mined tungsten in 2025.</p>
      <table>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="bg-[#ebe8e0]">
              <td className={cell}>{row.label}</td>
              <td className={cell}>{row.value}</td>
              <td className={cell}><a href={row.source}>Source</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        The base case needs {figures.base} ktpa. See the{" "}
        <Link href="/methodology" className="underline">method</Link>.
      </p>
      <img src="/research/fi002/figures/exhibit-02.svg" alt="Benefit requirement by scenario" width={900} />
      <Caveat />
    </Container>
  );
}
`;

/* The same research content, redesigned: new template, wrappers, classes, tags, imports and layout props. */
const redesignedPage = `
import type { Metadata } from "next";
import Link from "next/link";
import { Sheet, TitleBlock } from "@/components/ui/sheet";
import { Reveal } from "@/components/ui/reveal";
import { figures } from "@/lib/figures";

export const metadata: Metadata = {
  title: "Tungsten Supply Security",
  description: "A comparison of tungsten export controls.",
};

const cell = "px-4 py-3 align-top";
const tone = { row: "odd:bg-card", head: "font-editorial" } as const;
const rows = [
  { label: "Core loan", value: "£25 million", source: "https://example.gov/loan" },
  { label: "Accordion", value: "£10 million", source: "https://example.gov/accordion" },
];

function Caveat() {
  return <aside className="mx-auto max-w-prose"><small className="text-muted">Figures are as stated by the issuer.</small></aside>;
}

export default function Page() {
  return <Sheet width="wide" id="top">
    <TitleBlock align="center">
      <h2 className={tone.head} data-motion="title">Tungsten Supply Security</h2>
    </TitleBlock>
    <Reveal>
      <div className="mx-auto max-w-[62ch] font-editorial text-xl leading-8" style={{ textWrap: "pretty" }}>
        China accounted for about 79% of mined tungsten in 2025.
      </div>
    </Reveal>
    <section aria-labelledby="financing" className="grid grid-cols-12">
      <dl role="table">
        {rows.map((row) => <div key={row.value} className={tone.row}>
          <dt className={cell}>{row.label}</dt>
          <dd className={cell}>{row.value}</dd>
          <dd className={cell}><Link href={row.source} target="_blank" rel="noreferrer">Source</Link></dd>
        </div>)}
      </dl>
    </section>
    <p className="mt-8">The base case needs {figures.base} ktpa. See the <a href="/methodology">method</a>.</p>
    <figure className="plate"><img src="/research/fi002/figures/exhibit-02.svg" alt="Benefit requirement by scenario" width={1280} height={720} loading="lazy" /></figure>
    <Caveat />
  </Sheet>;
}
`;

test("a redesign of layout, typography, styling, template and wrappers keeps the content fingerprint", () => {
  assert.equal(contentFingerprint(redesignedPage), contentFingerprint(articlePage));
  assert.notEqual(pageHash(redesignedPage), pageHash(articlePage));
});

test("reformatting, comments and JSX spacing keep the content fingerprint", () => {
  const reformatted = articlePage
    .replace('<p className={styles.lede}>China accounted', '{/* lede */}\n      <p\n        className={styles.lede}\n      >\n        China accounted')
    .replace("2025.</p>", "2025.\n      </p>")
    .replace('{ label: "Accordion", value: "£10 million", source: "https://example.gov/accordion" },',
      "{\n    label: 'Accordion',\n    value: '£10 million',\n    source: 'https://example.gov/accordion'\n  }");
  assert.notEqual(reformatted, articlePage);
  assert.equal(contentFingerprint(reformatted), contentFingerprint(articlePage));
});

test("every kind of substantive change moves the content fingerprint", () => {
  const base = contentFingerprint(articlePage);
  const edits = {
    "visible prose": [/about 79% of mined/, "about 81% of mined"],
    "heading text": [/<h1 className="text-4xl font-semibold">Tungsten Supply Security/, '<h1 className="text-4xl font-semibold">Tungsten Supply Risk'],
    "metadata title": [/title: "Tungsten Supply Security"/, 'title: "Tungsten Security"'],
    "metadata description": [/A comparison of tungsten export controls\./, "A review of tungsten export controls."],
    "table figure": [/£25 million/, "£26 million"],
    "table label": [/label: "Accordion"/, 'label: "Accordion facility"'],
    "citation link in data": [/https:\/\/example\.gov\/loan/, "https://example.gov/other-loan"],
    "citation link in markup": [/href="\/methodology"/, 'href="/about"'],
    "figure source": [/exhibit-02\.svg/, "exhibit-03.svg"],
    "figure alt text": [/Benefit requirement by scenario/, "Benefit requirement by case"],
    "data reference": [/figures\.base/, "figures.stress"],
    "unit beside a figure": [/\} ktpa\./, "} Mtpa."],
    "text inside a local component": [/as stated by the issuer/, "as stated by the lender"],
    "row order": [
      /(\{ label: "Core loan".*\},)\n  (\{ label: "Accordion".*\},)/,
      "$2\n  $1",
    ],
    "removed paragraph": [/<p className=\{styles\.lede\}>.*<\/p>\n/, ""],
    "added sentence": [/2025\.<\/p>/, "2025. Output fell in 2026.</p>"],
    "new link around existing words": [/See the\{" "\}/, 'See <a href="https://example.org">the</a>{" "}'],
  };
  for (const [name, [pattern, replacement]] of Object.entries(edits)) {
    const edited = articlePage.replace(pattern, replacement);
    assert.notEqual(edited, articlePage, name + ": the edit must apply");
    assert.notEqual(contentFingerprint(edited), base, name + " must change the fingerprint");
  }
});

test("only attributes that cannot carry research content are treated as presentation", () => {
  for (const name of ["className", "style", "id", "key", "width", "height", "data-motion", "aria-hidden", "aria-labelledby", "target"]) {
    assert.equal(isPresentationAttribute(name), true, name);
  }
  for (const name of ["href", "src", "alt", "title", "aria-label", "dateTime", "cite", "content", "value", "d", "points", "label", "caption"]) {
    assert.equal(isPresentationAttribute(name), false, name);
  }
});

test("a class constant is dropped only while it is used for presentation alone", () => {
  const usedAsText = articlePage.replace("<Caveat />", "<p>{cell}</p>");
  const tokens = contentTokens(usedAsText);
  assert.ok(tokens.includes("S:border-b border-border px-3 py-2"));
  assert.ok(!contentTokens(articlePage).includes("S:border-b border-border px-3 py-2"));
  // An exported or non-class constant is content whatever references it.
  assert.ok(contentTokens(articlePage).includes("S:£25 million"));
});

test("every published research page yields a stable, non-trivial fingerprint", () => {
  const root = new URL("../app/research/", import.meta.url);
  const pages = ["page.tsx", ...readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(entry => entry.name + "/page.tsx")]
    .filter(path => existsSync(new URL(path, root)));
  assert.ok(pages.length >= 2);
  for (const path of pages) {
    const page = readFileSync(new URL(path, root), "utf8");
    assert.ok(contentTokens(page).length > 40, path);
    assert.equal(contentFingerprint(page), contentFingerprint(page));
    // Restyling every class name on the page leaves the fingerprint where it was.
    const restyled = page.replace(/className="[^"]*"/g, 'className="restyled"');
    assert.equal(contentFingerprint(restyled), contentFingerprint(page), path);
    // Changing a digit in the visible text moves it.
    const renumbered = page.replace(/(>[^<>{}=]*?)(\d)(?=[^<>{}=]*<\/)/, (all, lead, digit) =>
      lead + String((Number(digit) + 1) % 10));
    if (renumbered !== page) assert.notEqual(contentFingerprint(renumbered), contentFingerprint(page), path);
  }
});

test("a review record may bind to the content fingerprint or, as before, to the exact source", () => {
  const file = "app/research/example/page.tsx";
  const hashes = { content: contentFingerprint(articlePage), page: pageHash(articlePage) };
  const rest = review(file, "unused");
  delete rest.pageSha256;
  assert.deepEqual(validateReview({ ...rest, contentSha256: hashes.content }, file, hashes), []);
  assert.deepEqual(validateReview({ ...rest, pageSha256: hashes.page }, file, hashes), []);
  // A record signed against the page before a redesign stays valid after it.
  const after = { content: contentFingerprint(redesignedPage), page: pageHash(redesignedPage) };
  assert.deepEqual(validateReview({ ...rest, contentSha256: hashes.content }, file, after), []);
  // An exact-source record does not survive any edit, and no record survives a content edit.
  assert.ok(validateReview({ ...rest, pageSha256: hashes.page }, file, after).some(e => e.includes("stale")));
  const edited = articlePage.replace("£25 million", "£26 million");
  const editedHashes = { content: contentFingerprint(edited), page: pageHash(edited) };
  assert.ok(validateReview({ ...rest, contentSha256: hashes.content }, file, editedHashes).some(e => e.includes("stale")));
  assert.ok(validateReview(rest, file, hashes).some(e => e.includes("stale")));
  // The reviewer and check requirements are untouched.
  assert.ok(validateReview({ ...rest, contentSha256: hashes.content, reviewer: "Claude" }, file, hashes)
    .some(e => e.includes("reviewer")));
});

test("restyled paragraphs are not rescreened; rewritten ones are", () => {
  const before = '<p className="a">That preserves the pause; it does not repeal the restrictions.</p>';
  const restyled = '<p className="b text-lg">That preserves the pause; it does not repeal the restrictions.</p>';
  assert.equal(scanChangedProse(restyled, [{ start: 1, end: 1 }], before).findings.length, 0);
  const rewritten = '<p className="b">That keeps the pause; it does not repeal the restrictions.</p>';
  assert.ok(scanChangedProse(rewritten, [{ start: 1, end: 1 }], before).findings.length > 0);
});

test("integration: a redesign passes without a record, a content edit still needs one", () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-editorial-presentation-"));
  const article = "app/research/example/page.tsx";
  const record = "docs/editorial/reviews/example.json";
  const gate = fileURLToPath(new URL("../scripts/editorial-style-gate.mjs", import.meta.url));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  const put = (path, content) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  };
  const run = (sha, ...args) => spawnSync(process.execPath, [gate, ...args], {
    cwd: dir, env: { ...process.env, EDITORIAL_BASE_SHA: sha }, encoding: "utf8",
  });
  try {
    git("init", "-q");
    git("config", "user.name", "Editorial CI Test");
    git("config", "user.email", "ci@example.invalid");
    put(article, articlePage);
    git("add", "."); git("commit", "-qm", "Published page");
    const base = git("rev-parse", "HEAD");

    put(article, redesignedPage);
    git("add", "."); git("commit", "-qm", "Redesign the page");
    const redesign = run(base);
    assert.equal(redesign.status, 0, redesign.stderr);
    assert.match(redesign.stdout, /presentation-only change/);
    assert.match(redesign.stdout, /gate passed/i);

    // A figure changes inside the redesigned page: the gate asks for a review again.
    const edited = redesignedPage.replace("£25 million", "£26 million");
    put(article, edited);
    git("add", "."); git("commit", "-qm", "Change a figure");
    const unsigned = run(base);
    assert.notEqual(unsigned.status, 0);
    assert.match(unsigned.stderr, /content changed without a fresh/);
    assert.match(unsigned.stderr, new RegExp("Expected contentSha256: " + contentFingerprint(edited)));

    // --hash prints the fingerprint a reviewer records.
    const printed = run(base, "--hash", article);
    assert.equal(printed.stdout.trim(), contentFingerprint(edited));

    // A record bound to the earlier content is stale; one bound to the edited content passes.
    const rest = review(article, "unused");
    delete rest.pageSha256;
    put(record, JSON.stringify({ ...rest, contentSha256: contentFingerprint(redesignedPage) }));
    git("add", "."); git("commit", "-qm", "Record for the wrong content");
    const stale = run(base);
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr, /contentSha256 is stale/);

    put(record, JSON.stringify({ ...rest, contentSha256: contentFingerprint(edited) }));
    git("add", "."); git("commit", "-qm", "Record for the edited content");
    const signed = run(base);
    assert.equal(signed.status, 0, signed.stderr);
    const signedAt = git("rev-parse", "HEAD");

    // A later restyle keeps that record valid without touching it.
    put(article, edited.replace('className="mt-8"', 'className="mt-12 text-lg"'));
    git("add", "."); git("commit", "-qm", "Restyle after signoff");
    const later = run(signedAt);
    assert.equal(later.status, 0, later.stderr);
    assert.match(later.stdout, /presentation-only change/);

    // A new page has no base to match, so it always needs a record.
    put("app/research/second/page.tsx", articlePage);
    git("add", "."); git("commit", "-qm", "New publication");
    const added = run(signedAt);
    assert.notEqual(added.status, 0);
    assert.match(added.stderr, /second\/page\.tsx::Publication content changed without a fresh/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("automatic cover changes are presentation-only; research changes still require a human review", () => {
  const base = [
    'import { ResearchCover } from "@/components/editorial/research-cover";',
    'export default function Article() {',
    '  return <main><h1>Antimony strategy</h1><p>Inventory assumptions total 18 tonnes.</p></main>;',
    '}',
  ].join("\n");
  const withCover = base.replace(
    "</main>",
    '<ResearchCover data-cover="new-antimony-article" data-frame="banner" data-caption="full" /></main>',
  );
  assert.equal(contentFingerprint(withCover), contentFingerprint(base),
    "a registered auto cover must not change the research-content fingerprint");
  const withMaterialChange = withCover.replace("18 tonnes", "28 tonnes");
  assert.notEqual(contentFingerprint(withMaterialChange), contentFingerprint(base),
    "financial/quantitative claims must remain under the editorial gate");
  const withChangedCitation = withCover.replace("</main>", '<a href="https://example.org/new-source">Evidence</a></main>');
  assert.notEqual(contentFingerprint(withChangedCitation), contentFingerprint(base),
    "new source links must remain under the editorial gate");
});
