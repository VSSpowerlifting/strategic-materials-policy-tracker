import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Fi002Screen } from "@/components/research/fi002-screen";
import { changedScreenFields, fi002ScreenFields, fi002Screens, screenChangeNote } from "@/lib/fi002";

const index = (name: string) => fi002Screens.findIndex((s) => s.name === name);

test("changed fields compare the shown values of two screens, in display order", () => {
  assert.deepEqual(changedScreenFields(index("Base"), index("Shorter benefits")), ["years", "benefit"]);
  assert.deepEqual(changedScreenFields(index("Shorter benefits"), index("Shorter, later")), ["years", "benefit"]);
  assert.deepEqual(changedScreenFields(index("Shorter, later"), index("Combined stress")), [
    "capital",
    "price",
    "years",
    "benefit",
  ]);
  assert.deepEqual(changedScreenFields(index("Base"), index("Base")), []);
  // Symmetric, and every field is a real screen field.
  for (let a = 0; a < fi002Screens.length; a++) {
    for (let b = 0; b < fi002Screens.length; b++) {
      assert.deepEqual(changedScreenFields(a, b), changedScreenFields(b, a));
      for (const key of changedScreenFields(a, b)) assert.notEqual(fi002Screens[a][key], fi002Screens[b][key]);
    }
  }
});

test("the screen-reader note names the previous scenario and the changed figures", () => {
  assert.equal(
    screenChangeNote(index("Base"), index("Shorter benefits")),
    "Changed from Base: benefit period and annual after-tax benefit.",
  );
  assert.equal(
    screenChangeNote(index("Shorter, later"), index("Combined stress")),
    "Changed from Shorter, later: gross capital, long-term copper, benefit period and annual after-tax benefit.",
  );
  assert.equal(screenChangeNote(0, 0), "");
});

test("the default render shows the base screen with no change marks", () => {
  const html = renderToStaticMarkup(createElement(Fi002Screen));
  assert.doesNotMatch(html, /data-changed/);
  assert.doesNotMatch(html, /data-settle/);
  assert.doesNotMatch(html, /Changed from/);
  assert.match(html, />199<span> ktpa<\/span>/);
  for (const f of fi002ScreenFields) assert.match(html, new RegExp(`<dt>${f.label}</dt>`));
  // The live region stays a single, unkeyed container.
  assert.equal((html.match(/role="status"/g) ?? []).length, 1);
});

test("movement is confined to the no-preference query; the mark itself is not", () => {
  const css = readFileSync("app/research/escondida-copper/publication.module.css", "utf8");
  const start = css.indexOf("@media (prefers-reduced-motion: no-preference)");
  assert.ok(start > -1, "no-preference block exists");
  const before = css.slice(0, start);
  const block = css.slice(start, css.indexOf("@media print", start));
  // The static mark and its label colour sit outside the media query, so reduced motion keeps the state.
  assert.match(before, /\[data-changed\]\)::after \{[^}]*background: var\(--paper-accent\)/);
  assert.match(before, /\[data-changed\] dt\) \{[^}]*color: var\(--paper-accent\)/);
  assert.doesNotMatch(before, /animation:|transition:/);
  assert.match(block, /fi-rule-draw 420ms/);
  assert.match(block, /fi-value-settle 240ms/);
  // Transform and opacity only: nothing in the exhibit is resized.
  assert.doesNotMatch(block, /\b(width|height|max-height)\s*:/);
});

test("the required benefit is replaced, not counted between values", () => {
  const source = readFileSync("components/research/fi002-screen.tsx", "utf8");
  assert.doesNotMatch(source, /requestAnimationFrame|setInterval|useSpring|\btween/i);
  // Marks come from the reader's choice, never from an effect that also runs on hydration.
  assert.doesNotMatch(source, /useEffect/);
});
