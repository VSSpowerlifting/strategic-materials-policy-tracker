import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { headerNav, isNavCurrent, journeys, secondaryNav } from "../lib/site";

const homepage = () => readFileSync("app/page.tsx", "utf8");
const header = () => readFileSync("components/site-header.tsx", "utf8");

test("Research is promoted on the homepage without crowding desktop navigation", () => {
  assert.equal(journeys.length, 5);
  assert.equal(headerNav.length, 5);
  assert.ok(headerNav.every((item) => item.href !== "/research"));
  assert.ok(journeys.every((item) => !item.href.startsWith("/research")));
  assert.match(homepage(), /<Link href="\/research" className="research-button">\s*Explore published research/);
  assert.match(homepage(), /<Link href="#start" className="research-button-secondary">/);
  assert.match(homepage(), /<Link href="#cases" className="px-2 font-display text-sm/);
});

test("Research remains accessible on mobile and in the footer", () => {
  assert.match(header(), /<Link href="\/research" onClick=\{closeMenu\}/);
  assert.ok(secondaryNav.some((item) => item.href === "/research"));
  assert.ok(headerNav.every((item) => !isNavCurrent("/research", item)));
  assert.ok(headerNav.every((item) => !isNavCurrent("/research/tungsten-supply-security", item)));
  assert.ok(isNavCurrent("/events", headerNav.find((item) => item.href === "/events")!));
});
