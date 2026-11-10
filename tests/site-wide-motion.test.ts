import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ResearchIndex from "@/app/research/page";
import MaterialsPage from "@/app/materials/page";
import { siteMotionScope, siteMotionSelector } from "@/lib/site-motion";

test("route policy covers research, materials, detailed evidence and other routes", () => {
  assert.equal(siteMotionScope("/"), "home");
  assert.equal(siteMotionSelector(siteMotionScope("/")), "", "homepage keeps its own composed motion");
  assert.equal(siteMotionScope("/research"), "research-index");
  assert.equal(siteMotionScope("/research/hemerdon-financing"), "research-article");
  assert.equal(siteMotionScope("/materials"), "materials-index");
  assert.equal(siteMotionScope("/materials/tungsten"), "dossier");
  for (const path of [
    "/events", "/events/sample", "/capital", "/capital/sample", "/controls",
    "/projects", "/projects/sample", "/programmes", "/programmes/sample",
    "/organizations", "/sources", "/markets", "/timeline", "/search",
    "/methodology", "/about", "/coverage", "/compare", "/actors",
    "/saved", "/watchlist", "/data", "/response", "/portfolios",
  ]) {
    assert.equal(siteMotionScope(path), "standard", path);
    assert.match(siteMotionSelector(siteMotionScope(path)), /section/);
  }
  assert.match(siteMotionSelector(siteMotionScope("/research/hemerdon-financing")), /figure/);
  assert.match(siteMotionSelector(siteMotionScope("/materials/tungsten")), /\.dossier/);
  assert.match(siteMotionSelector(siteMotionScope("/materials")), /a\.oxide-rule/);
});

test("published research and material index cards are annotated in rendered HTML", () => {
  const research = renderToStaticMarkup(createElement(ResearchIndex));
  const materials = renderToStaticMarkup(createElement(MaterialsPage));
  assert.equal((research.match(/<article class="grid /g) ?? []).length, 5);
  assert.match(siteMotionSelector(siteMotionScope("/research")), /article/, "research cards are targeted without editing publication markup");
  assert.ok((materials.match(/data-site-motion="card"/g) ?? []).length >= 10);
  assert.match(research, /href="\/research\/escondida-copper"/);
  assert.match(materials, /href="\/materials\/tungsten"/);
});

test("major searchable directories mark result wrappers, rather than tables and filters", () => {
  const paths = [
    "components/event-card.tsx",
    "components/capital/rows.tsx",
    "components/projects-explorer.tsx",
    "components/programmes-explorer.tsx",
    "components/organizations-explorer.tsx",
    "components/source-register-explorer.tsx",
    "components/search-explorer.tsx",
    "components/saved-events-explorer.tsx",
    "components/timeline-view.tsx",
    "app/data/page.tsx",
    "app/actors/page.tsx",
  ];
  for (const file of paths) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /data-site-motion="card"/, file);
  }
  const capital = readFileSync("components/capital/rows.tsx", "utf8");
  assert.equal((capital.match(/data-site-motion="card"/g) ?? []).length, 2);
});

test("global section observer is progressive, route-scoped, keyboard-safe and once-only", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  const controller = readFileSync("components/ui/site-motion.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(layout, /<SiteMotion \/>/);
  assert.match(layout, /id="main-content"/);
  assert.match(controller, /usePathname/);
  assert.match(controller, /IntersectionObserver/);
  assert.match(controller, /MutationObserver/);
  assert.match(controller, /observer\.unobserve\(element\)/);
  assert.match(controller, /observer\.disconnect\(\)/);
  assert.match(controller, /prefers-reduced-motion: reduce/);
  assert.match(controller, /closest\("\[data-motion-kind\]"\)/);
  assert.match(controller, /\[hidden\]/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\[data-site-motion-ready="true"\]/);
  assert.match(css, /data-site-motion-entered/);
  assert.match(css, /@media print[\s\S]*?opacity: 1 !important/);
  assert.doesNotMatch(controller, /addEventListener\("scroll"/, "scroll position is never overridden");
});
