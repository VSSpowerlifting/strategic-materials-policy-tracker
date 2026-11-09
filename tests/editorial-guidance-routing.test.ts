import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const guidePath = "docs/research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md";

test("research publication house style is reachable from both agent entry points", () => {
  const agents = read("AGENTS.md");
  const claude = read("CLAUDE.md");
  for (const [name, text] of [["AGENTS.md", agents], ["CLAUDE.md", claude]] as const) {
    assert.ok(text.includes(guidePath), `${name} should link to the canonical publication guide`);
    assert.match(text, /before drafting/i, `${name} should require reading the guide before drafting`);
  }
});

test("publication house style includes a human-readable voice review and source safeguards", () => {
  const style = read(guidePath);
  assert.match(style, /Natural-language review/i);
  assert.match(style, /Before handing off a publication/i);
  assert.match(style, /Preserve.*negative facts/i);
  assert.match(style, /automated checker cannot certify natural voice/i);
});
