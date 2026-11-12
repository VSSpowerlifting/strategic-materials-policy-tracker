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
  assert.ok(homepage().includes('<Link href="/research" className="research-button">Read research</Link>'));
  assert.ok(homepage().includes('<Link href="/explore" className="research-button-secondary">Explore the data</Link>'));
  assert.ok(homepage().includes('href="/research" className="font-display text-sm text-accent underline underline-offset-4"'));
  assert.ok(homepage().includes("<FeaturedCase />"));
  assert.ok(readFileSync("lib/fi002.ts", "utf8").includes('"/research/escondida-copper"'));
});

test("Research remains accessible on mobile and in the footer", () => {
  assert.match(header(), /<Link href="\/research" onClick=\{closeMenu\}/);
  assert.ok(secondaryNav.some((item) => item.href === "/research"));
  assert.ok(headerNav.every((item) => !isNavCurrent("/research", item)));
  assert.ok(headerNav.every((item) => !isNavCurrent("/research/tungsten-supply-security", item)));
  assert.ok(isNavCurrent("/events", headerNav.find((item) => item.href === "/events")!));
});
