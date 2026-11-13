import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecordLayout } from "@/components/record/primitives";
import { readingLine, sectionNavSelector, spyAxis } from "@/lib/section-spy";

// Children go in as a createElement argument (react/no-children-prop), so the prop is optional here.
type LayoutProps = Omit<ComponentProps<typeof RecordLayout>, "children"> & { children?: ReactNode };
const Layout = RecordLayout as (props: LayoutProps) => ReturnType<typeof RecordLayout>;

test("the reading line sits 30% of the way down the area below the sticky header", () => {
  assert.equal(readingLine(900, 106), 344);
  assert.equal(readingLine(900, 65), 316);
  assert.equal(readingLine(812, 0), 244);
  // A header taller than the viewport leaves the line at the header's edge, never above it.
  assert.equal(readingLine(100, 120), 120);
});

test("a list runs across only when every link sits on one row", () => {
  assert.equal(spyAxis([40, 40, 41, 40]), "x");
  assert.equal(spyAxis([40, 40, 72, 72]), "y", "a bar that wraps has no single rule to run along");
  assert.equal(spyAxis([10, 30, 50]), "y");
  assert.equal(spyAxis([10]), "y");
});

test("record rails and research section lists are tracked; other lists opt in explicitly", () => {
  for (const label of ["On this page", "Publication sections", "Report sections"]) {
    assert.ok(sectionNavSelector.includes(`nav[aria-label="${label}"]`), label);
  }
  assert.ok(sectionNavSelector.includes("nav[data-section-nav]"));
  // The research pages carry those labels already; the enhancer needs no edit to their content.
  assert.match(readFileSync("app/research/escondida-copper/page.tsx", "utf8"), /aria-label="Publication sections"/);
  assert.match(readFileSync("app/research/tungsten-supply-security/page.tsx", "utf8"), /aria-label="Report sections"/);
});

test("the record rail is a ruled list of in-page links the marker can run along", () => {
  const html = renderToStaticMarkup(
    createElement(
      Layout,
      {
        contents: [
          { href: "#summary", label: "Summary" },
          { href: "#sources", label: "Sources" },
        ],
      },
      createElement("section", { id: "summary" }, "Summary text"),
    ),
  );
  assert.match(html, /<nav aria-label="On this page"[^>]*>[\s\S]*?<ul class="[^"]*border-l border-border[^"]*">/);
  assert.match(html, /href="#summary"/);
  // Server HTML marks nothing current; only the client enhancer does.
  assert.doesNotMatch(html, /aria-current/);
});

test("the enhancer only reads positions: no scroll listener, no scrolling, no focus change", () => {
  const spy = readFileSync("components/ui/section-spy.tsx", "utf8");
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /<SectionSpy \/>/);
  assert.match(spy, /IntersectionObserver/);
  assert.match(spy, /setAttribute\("aria-current", "location"\)/);
  assert.match(spy, /observer\?\.disconnect\(\)/);
  assert.doesNotMatch(spy, /addEventListener\("scroll"/);
  assert.doesNotMatch(spy, /scrollTo|scrollIntoView|scrollBy|\.focus\(/);
  assert.match(spy, /--site-header-h/);
});

test("the marker moves without a transition under reduced motion, and the Escondida bar is sticky only when wide", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const block = css.slice(css.indexOf("Where the reader is"));
  assert.match(block, /nav\[data-spy-ready\] a\[aria-current="location"\] \{ color: var\(--fg\); \}/);
  const withoutSafe = block.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/g, "");
  assert.doesNotMatch(withoutSafe, /transition:/);
  assert.match(block, /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?transition: transform 280ms/);

  const publication = readFileSync("app/research/escondida-copper/publication.module.css", "utf8");
  assert.match(publication, /@media \(min-width: 1024px\) \{\s*\.publication :global\(\.fi-section-nav\) \{\s*position: sticky;\s*top: var\(--site-header-h, 4rem\);/);
});
