import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../app/page";
import {
  designationStatusOn,
  financialReadingOn,
  getFinancingCase,
  getLegalControlCase,
  getTungstenCase,
} from "../lib/homepage-cases";
import { financialStatusOn } from "../lib/capital-control";
import { site } from "../lib/site";
import { getProjectDesignationById } from "../lib/data";
import {
  getControlMeasureById,
  getEventById,
  getFinancialCommitmentById,
  getProjectById,
  getSourceById,
} from "../lib/data";

const view = renderToStaticMarkup(createElement(Home));
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");

/** A detail link resolves when its `[id]`/`[slug]` route exists and the id names a published record. */
const resolves = (href: string) => {
  const [, section, id] = href.split("/");
  const lookups: Record<string, (id: string) => unknown> = {
    events: getEventById,
    controls: getControlMeasureById,
    capital: getFinancialCommitmentById,
    projects: getProjectById,
    sources: getSourceById,
  };
  const dir = section === "materials" ? "[slug]" : "[id]";
  return existsSync(`app/${section}/${dir}/page.tsx`) && (section === "materials" || Boolean(lookups[section]?.(id)));
};

test("the three evidence examples use complete source-backed case records", () => {
  const legal = getLegalControlCase();
  const financing = getFinancingCase();
  const tungsten = getTungstenCase();
  assert.ok(legal, "legal-control case records exist");
  assert.equal(financing.length, 3, "all three finance statuses remain available in the underlying research case");
  assert.equal(tungsten.length, 4, "the four cross-jurisdiction tungsten records remain available");
  assert.match(view, /id="examples"/);
  for (const title of ["Legal controls", "Public financing", "Tungsten comparison"])
    assert.ok(view.includes(title), title);
  assert.ok(view.includes(`href="/controls/${legal.control.id}"`));
  assert.ok(view.includes(`href="/capital/${financing[0].commitment.id}"`));
  assert.ok(view.includes(`href="${tungsten[0].href}"`));
});

test("every source-linked homepage example opens a published record", () => {
  const start = view.indexOf('id="examples"');
  const end = view.indexOf('id="method-heading"');
  assert.ok(start !== -1 && end > start, "the examples section precedes the method band");
  const examples = view.slice(start, end);
  const hrefs = [...examples.matchAll(new RegExp('href="(/(?:events|controls|capital|projects|sources|materials)/[^"?#]+)"', "g"))].map((m) => m[1]);
  assert.ok(hrefs.length >= 5, `found ${hrefs.length} published record links`);
  for (const href of hrefs) assert.ok(resolves(href), `${href} does not resolve`);
});

test("the compact homepage examples display as-of-revision status and amount labels", () => {
  const legal = getLegalControlCase()!;
  const financing = getFinancingCase();
  const tungsten = getTungstenCase();
  assert.ok(view.includes(escape(legal.status.label)));
  assert.ok(legal.later.status.until, "the paused clause retains its documented expiry");
  assert.ok(view.includes(escape(financing[0].status.label)));
  assert.ok(view.includes(escape(financing[0].amount.currency)));
  assert.ok(view.includes(escape(String(financing[0].amount.value))));
  assert.ok(view.includes(escape(tungsten[0].status)));
  assert.equal(new Set(financing.map((r) => r.status.key)).size, 3);
  for (const row of financing)
    assert.equal(row.status.key, financialStatusOn(row.commitment, site.lastUpdated), row.commitment.id);
});

test("the legal example links to the clause that retains and labels original-language scope", () => {
  const legal = getLegalControlCase()!;
  assert.ok(legal.control.productScopeAsStated, "original legal product scope exists");
  assert.ok(view.includes(`href="/controls/${legal.control.id}"`));
  const detail = readFileSync("app/controls/[id]/page.tsx", "utf8");
  assert.ok(detail.includes('lang={hasCjk(m.productScopeAsStated) ? "zh" : "en"}'));
  assert.ok(detail.includes("{m.productScopeAsStated}"));
});

test("the homepage market chart replaces corpus counts without introducing money totals", () => {
  assert.doesNotMatch(view, /Current corpus/);
  assert.match(view, /id="home-market-heading"/);
  assert.match(view, /href="\/markets"/);
  assert.equal((view.match(/<dd/g) ?? []).length, 0);
  assert.doesNotMatch(view, /\b(total|combined|in all|altogether)\b[^<]{0,40}(USD|GBP|JPY|EUR|\$|£|¥)/i);
  assert.doesNotMatch(view, /unlock insights/i);
});

test("headings form one outline: a single h1 and no skipped levels", () => {
  const levels = [...view.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  assert.equal(levels.filter((l) => l === 1).length, 1);
  assert.equal(levels[0], 1);
  for (let i = 1; i < levels.length; i++)
    assert.ok(levels[i] <= levels[i - 1] + 1, `h${levels[i - 1]} is followed by h${levels[i]}`);
});

test("in-page calls to action point at sections that exist", () => {
  for (const anchor of [...view.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))
    assert.ok(view.includes(`id="${anchor}"`), `#${anchor} has no target`);
});

test("case statuses are read as of the revision date, so a later entry cannot appear under it", () => {
  const dod = getFinancialCommitmentById("fin-us-dod-perpetua-stibnite-dpa")!;
  const later = {
    ...dod,
    financialStatusHistory: [
      ...dod.financialStatusHistory,
      { ...dod.financialStatusHistory.at(-1)!, status: "withdrawn" as const, date: "2099-01-01" },
    ],
  };
  const reading = financialReadingOn(later, site.lastUpdated)!;
  assert.equal(reading.key, financialStatusOn(dod, site.lastUpdated));
  assert.notEqual(reading.key, "withdrawn");
  assert.doesNotMatch(reading.payment, /ended instrument/);
  assert.equal(financialReadingOn(dod, "2000-01-01"), null);

  for (const row of getFinancingCase())
    assert.equal(row.status.key, financialStatusOn(row.commitment, site.lastUpdated), row.commitment.id);

  const dsg = getProjectDesignationById("dsg-eu-crma-tungsten-west")!;
  const laterDsg = { ...dsg, statusHistory: [...dsg.statusHistory, { ...dsg.statusHistory[0], status: "withdrawn" as never, date: "2099-01-01" }] };
  assert.equal(designationStatusOn(laterDsg, site.lastUpdated), dsg.statusHistory[0].status);
});

test("the page leads from research to the featured analysis, the tools, record examples and method", () => {
  const latest = view.indexOf('id="latest-heading"');
  const featured = view.indexOf('id="featured-analysis"');
  const tools = view.indexOf('id="tools"');
  const materials = view.indexOf('aria-label="Materials in scope"');
  const market = view.indexOf('id="home-market-heading"');
  const examples = view.indexOf('id="examples"');
  const method = view.indexOf('id="method-heading"');
  assert.ok(view.indexOf("<h1") < latest && latest !== -1);
  assert.ok(latest < featured && featured < tools);
  assert.ok(tools < materials && materials < market && market < examples && examples < method);
  assert.doesNotMatch(view, /id="chain-heading"|id="browse"/, "the supply chain and lattice live on /materials");
});
