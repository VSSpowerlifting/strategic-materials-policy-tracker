import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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

test("all three worked cases are present and complete", () => {
  assert.ok(getLegalControlCase(), "legal-control case records exist");
  assert.equal(getFinancingCase().length, 3, "all three financing rows resolve");
  assert.equal(getTungstenCase().length, 4, "all four tungsten records resolve");
  for (const id of ["case-legal-heading", "case-finance-heading", "case-tungsten-heading"])
    assert.ok(view.includes(`id="${id}"`), id);
});

test("every record link in the worked cases opens a published record", () => {
  const cases = view.slice(view.indexOf('id="cases"'), view.indexOf('id="start"'));
  const hrefs = [...cases.matchAll(/href="(\/(?:events|controls|capital|projects|sources|materials)\/[^"?#]+)"/g)].map((m) => m[1]);
  assert.ok(hrefs.length >= 15, `found ${hrefs.length} record links`);
  for (const href of hrefs) assert.ok(resolves(href), `${href} does not resolve`);
});

test("statuses on the page are the derived labels, read as of the revision", () => {
  const legal = getLegalControlCase()!;
  assert.ok(view.includes(escape(legal.status.label)));
  assert.ok(view.includes(escape(legal.later.status.label.toLowerCase())));
  assert.ok(legal.later.status.until, "the paused clause carries an end date");
  assert.ok(view.includes(`dateTime="${legal.later.status.until}"`));
  for (const row of getFinancingCase()) {
    assert.ok(view.includes(escape(row.status.definition)), row.commitment.id);
    assert.ok(view.includes(escape(row.payment)), row.commitment.id);
    assert.ok(view.includes(escape(row.amount.asStated)), row.commitment.id);
  }
  // Three different points between announcement and payment, not three of the same.
  assert.equal(new Set(getFinancingCase().map((r) => r.status.key)).size, 3);
  for (const entry of getTungstenCase()) assert.ok(view.includes(escape(entry.status)), entry.id);
});

test("original-language text is marked with its language and not translated", () => {
  const legal = getLegalControlCase()!;
  assert.ok(view.includes(`lang="zh"`));
  assert.ok(view.includes(escape(legal.control.productScopeAsStated!)));
});

test("the page shows no money totals and keeps the four qualified coverage counts", () => {
  assert.equal((view.match(/<dd/g) ?? []).length, 4);
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

test("the opening runs hero, material tiles, supply-chain strip, then the worked cases", () => {
  const tiles = view.indexOf('aria-label="Materials in scope"');
  const strip = view.indexOf('id="chain-heading"');
  const cases = view.indexOf('id="cases"');
  assert.ok(view.indexOf('id="scope-heading"') < tiles);
  assert.ok(tiles < strip);
  assert.ok(strip < cases);
  assert.ok(cases < view.indexOf('id="start"'));
  // One strip only: responsive layout comes from CSS, not a second copy.
  assert.equal(view.split('id="chain-heading"').length, 2);
});
