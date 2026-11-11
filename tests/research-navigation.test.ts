import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { headerNav, isNavCurrent, journeys, secondaryNav } from "../lib/site";

const homepage = () => readFileSync("app/page.tsx", "utf8");
const header = () => readFileSync("components/site-header.tsx", "utf8");

test("Research and Markets have direct first-level navigation", () => {
  const source = header();
  assert.match(source, /href: "\/research", label: "Research"/);
  assert.match(source, /href: "\/markets", label: "Markets"/);
  assert.ok(source.includes('label: "Policy"'));
  assert.ok(source.includes('label: "Capital"'));
  assert.ok(source.includes('label: "Projects"'));
  assert.ok(source.includes('label: "Compare"'));
  assert.equal(journeys.length, 5);
  assert.equal(headerNav.length, 5, "the data-journey taxonomy remains unchanged");
});

test("Homepage highlights research and links to the complete database", () => {
  const source = homepage();
  assert.ok(source.includes('<Link href="/research" className="research-button">Read research</Link>'));
  assert.ok(source.includes('<Link href="/events" className="research-button-secondary">Explore the database</Link>'));
  assert.ok(source.includes('href: "/research/china-export-control-suspension-extension"'));
  assert.ok(source.includes('<FeaturedCase />'), "flagship case is a separate shared component");
  const caseSource = readFileSync("components/home/featured-case.tsx", "utf8");
  assert.ok(caseSource.includes("fi002.path"), "flagship links to the published article");
  assert.ok(source.includes('href: "/research/hemerdon-financing"'));
  assert.doesNotMatch(source, /<LatticeOverview|<SupplyChainStrip|<ElementStrip/);
});

test("Less-visible routes are reachable without a second navigation bar", () => {
  const source = header();
  assert.match(source, /utilityLinks\.map/);
  assert.match(source, /journey\.views/);
  assert.match(source, /<details/);
  assert.match(source, /aria-controls="smpt-mobile-menu"/);
  assert.ok(secondaryNav.some((link) => link.href === "/research"));
  assert.ok(headerNav.every((item) => !isNavCurrent("/research", item)));
});
