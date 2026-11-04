import test from "node:test";
import assert from "node:assert/strict";
import { headerNav, isNavCurrent, journeys, secondaryNav } from "../lib/site";

test("published Research is a primary navigation destination", () => {
  const research = headerNav.find((item) => item.href === "/research");
  assert.ok(research, "Research must appear in the desktop header");
  assert.equal(research.label, "Research");
  assert.equal(journeys[0].href, "/research", "Research should lead the navigation journeys");
  assert.ok(journeys.some((j) => j.href === "/research"), "Research must also appear in the mobile menu");
  assert.ok(secondaryNav.some((item) => item.href === "/research"), "Keep the research footer link");
});

test("Research is current on the index and research dossiers, not on other journeys", () => {
  const item = headerNav.find((nav) => nav.href === "/research")!;
  assert.equal(isNavCurrent("/research", item), true);
  assert.equal(isNavCurrent("/research/tungsten-supply-security", item), true);
  assert.equal(isNavCurrent("/research/antimony-supply-resilience", item), true);
  assert.equal(isNavCurrent("/events", item), false);
  assert.equal(isNavCurrent("/projects", item), false);
});
