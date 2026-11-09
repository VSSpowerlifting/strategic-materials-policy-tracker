import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const index = read("app/research/page.tsx");

const publications = [
  { slug: "china-export-control-suspension-extension", category: "Policy Research" },
  { slug: "tungsten-supply-security", category: "Policy Research" },
  { slug: "escondida-copper", category: "Strategy & Finance" },
  { slug: "hemerdon-financing", category: "Strategy & Finance" },
  { slug: "antimony-supply-resilience", category: "Strategy & Finance" },
] as const;

test("research index and all five article headers use the same two public categories", () => {
  for (const { slug, category } of publications) {
    const article = read(`app/research/${slug}/page.tsx`);
    const label = category.replace("&", "&amp;");
    const marker = `href="/research/${slug}"`;
    const indexPosition = index.indexOf(marker);
    assert.ok(indexPosition >= 0, `Missing index link: ${slug}`);
    const start = index.lastIndexOf("<article ", indexPosition);
    const end = index.indexOf("</article>", indexPosition);
    assert.ok(start >= 0 && end > indexPosition, `Cannot locate index card: ${slug}`);
    const card = index.slice(start, end);
    assert.ok(card.includes(`>${label}</p>`), `Wrong index category: ${slug}`);
    assert.ok(article.includes(`>${label}</p>`) || article.includes(`${label}\n`),
      `Missing public header category: ${slug}`);
    assert.ok(article.includes(`— ${category}`), `Missing metadata category: ${slug}`);
  }
});

test("research index uses revised China publication title", () => {
  const headline = "China Extends Suspension of Six Export-Control Announcements to 10 January 2027";
  assert.ok(index.includes(headline));
  assert.ok(read("app/research/china-export-control-suspension-extension/page.tsx").includes(headline));
});

test("house style keeps public grouping separate from archival research identifiers", () => {
  const style = read("docs/research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md");
  assert.match(style, /Public research categories/);
  assert.match(style, /Policy Research/);
  assert.match(style, /Strategy & Finance/);
  assert.match(style, /filenames, evidence registers, archival records and suggested citations/);
});

test("homepage featured research cards use the same public categories", () => {
  const home = read("app/page.tsx");
  assert.equal(home.split('category: "Strategy & Finance"').length - 1, 3);
  assert.equal(home.split('category: "Policy Research"').length - 1, 1);
  assert.doesNotMatch(home, /category: "(Financial Intelligence|Applied Strategy|Research Dossier|Policy Analysis)/);
});
