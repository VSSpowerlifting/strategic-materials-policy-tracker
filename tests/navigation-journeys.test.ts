import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { headerNav, isNavCurrent, journeys, nav, secondaryNav } from "../lib/site";
import { getInvestigationEntries } from "../lib/research-experience";
import { getAllEvents, getAllMaterials } from "../lib/data";
import Home from "../app/page";
import EventPage from "../app/events/[id]/page";
import { Breadcrumbs } from "../components/ui/breadcrumbs";

/** A static route resolves when `app/<segments>/page.tsx` exists. */
const routeExists = (href: string) => {
  const path = href.split(/[?#]/)[0];
  return existsSync(`app${path === "/" ? "" : path}/page.tsx`);
};

test("every header destination except search belongs to exactly one journey", () => {
  for (const { href } of nav) {
    if (href === "/search") continue;
    const owners = headerNav.filter((item) => isNavCurrent(href, item));
    assert.equal(owners.length, 1, `${href} is current in ${owners.map((o) => o.label).join(", ") || "no journey"}`);
  }
  // Each view is listed by one journey only, and each journey lists its own landing page.
  const views = journeys.flatMap((j) => j.views.map((v) => v.href));
  assert.equal(new Set(views).size, views.length);
  for (const j of journeys) assert.ok(j.views.some((v) => v.href === j.href), `${j.label} lists its landing page`);
});

test("detail routes keep their journey current", () => {
  const event = getAllEvents()[0];
  const cases: [string, string][] = [
    [`/events/${event.id}`, "Government action"],
    ["/actors/cn", "Government action"],
    ["/materials/gallium", "Government action"],
    ["/capital/fin-anything", "Public capital"],
    ["/organizations/org-anything", "Public capital"],
    ["/programmes/prg-anything", "Public capital"],
    ["/projects/prj-us-stibnite", "Projects"],
    ["/projects/compare", "Projects"],
    ["/sources/src-anything", "Evidence"],
  ];
  for (const [path, label] of cases)
    assert.deepEqual(
      headerNav.filter((item) => isNavCurrent(path, item)).map((i) => i.label),
      [label],
      path,
    );
  // A prefix that is not a path segment does not match.
  assert.deepEqual(headerNav.filter((item) => isNavCurrent("/eventsfoo", item)), []);
  assert.deepEqual(headerNav.filter((item) => isNavCurrent("/", item)), []);
});

test("every navigation and journey link points at a route that exists", () => {
  const hrefs = [
    ...nav.map((i) => i.href),
    ...secondaryNav.map((i) => i.href),
    ...journeys.flatMap((j) => [j.href, ...j.views.map((v) => v.href)]),
  ];
  for (const href of hrefs) assert.ok(routeExists(href), `${href} has no app route`);
});

test("homepage research, evidence examples, material entries and navigation lead to published routes", () => {
  const view = renderToStaticMarkup(createElement(Home));
  for (const j of journeys) {
    assert.ok(view.includes(`href="${j.href}"`), `journey ${j.label} is linked`);
    assert.ok(j.question.length > 20, `journey ${j.label} retains its editorial question in navigation data`);
  }
  for (const entry of getInvestigationEntries()) {
    const directory = entry.href.split("/").slice(0, -1).join("/");
    assert.ok(routeExists(`${directory}/[id]`), entry.href);
  }
  assert.match(view, /id="examples"/);
  for (const m of getAllMaterials())
    assert.ok(view.includes(`href="/materials/${m.slug}"`), m.id);
  assert.equal((view.match(/<dd/g) ?? []).length, 4);
});

test("breadcrumbs mark the current page once and never link it", () => {
  const view = renderToStaticMarkup(
    createElement(Breadcrumbs, {
      items: [{ href: "/capital", label: "Public capital" }, { href: "/programmes", label: "Programmes" }, { label: "Here" }],
    }),
  );
  assert.match(view, /<nav aria-label="Breadcrumb"/);
  assert.equal((view.match(/aria-current="page"/g) ?? []).length, 1);
  assert.match(view, /<span aria-current="page"[^>]*>Here<\/span>/);
  assert.doesNotMatch(view, /href="[^"]*"[^>]*>Here</);
  assert.equal((view.match(/aria-hidden="true"/g) ?? []).length, 2);
  assert.equal(renderToStaticMarkup(createElement(Breadcrumbs, { items: [] })), "");
});

test("an event detail page leads back to its journey through the breadcrumb", async () => {
  const event = getAllEvents()[0];
  const view = renderToStaticMarkup(await EventPage({ params: Promise.resolve({ id: event.id }) }));
  const trail = /<nav aria-label="Breadcrumb"[\s\S]*?<\/nav>/.exec(view)?.[0] ?? "";
  assert.match(trail, /href="\/events"[^>]*>Government action</);
  assert.match(trail, /aria-current="page"/);
});

test("views-row links stay visible to keyboard users inside their scroller", () => {
  // The row clips its overflow, so an outset focus ring or a half-scrolled link would be hidden. SiteHeader needs
  // the router to render, so this checks the source of the views-row link.
  const source = readFileSync("components/site-header.tsx", "utf8");
  const row = source.slice(source.indexOf("journey.views.map"), source.indexOf("{view.label}"));
  assert.match(row, /onFocus=\{\(e\) => e\.currentTarget\.scrollIntoView\(\{ block: "nearest", inline: "nearest" \}\)\}/);
  assert.match(row, /focus-visible:outline-offset-\[-2px\]/);
});
