import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import { renderResearchDeck } from "../scripts/exhibit-system/research-deck";
import { RENDERERS } from "../scripts/exhibit-system/renderers";

// Test-only invented data, never a research product. A decreases-only bridge, so the
// opt-in key rule has an undrawn movement (Increase) to leave out.
const DATA = {
  unit: "Test units",
  dp: 0,
  start: { label: "Opening", value: 500 },
  steps: [{ label: "Decrease A", delta: -90 }, { label: "Decrease B", delta: -30 }],
  end: { label: "Closing", value: 380 },
};

function deck(options: Record<string, boolean>) {
  return {
    classification: "research",
    title: "Waterfall options contract test",
    evidence: [{ id: "E1", url: "https://example.org/test-only", title: "Test-only evidence stub", locator: "Table A" }],
    slides: [{
      pattern: "waterfall",
      label: "TEST",
      exhibit: {
        title: "Two test decreases lower a test balance from 500 to 380",
        subtitle: "Test units",
        annotation: "Test-only annotation.",
        data: { ...DATA, ...options },
        source: "Test-only evidence stub, Table A",
        evidence_refs: ["E1"],
      },
    }],
  };
}

async function render(options: Record<string, boolean>): Promise<{ chart: string; slide: string }> {
  const dir = mkdtempSync(join(tmpdir(), "smpt-waterfall-options-"));
  try {
    const input = join(dir, "spec.json");
    writeFileSync(input, JSON.stringify(deck(options)));
    const out = join(dir, "waterfall.pptx");
    await renderResearchDeck(input, out);
    const zip = await JSZip.loadAsync(readFileSync(out));
    const charts = await Promise.all(Object.keys(zip.files).filter((n) => /^ppt\/charts\/chart\d+\.xml$/.test(n)).map((n) => zip.file(n)!.async("string")));
    const bridge = charts.filter((x) => x.includes("<c:barChart>"));
    assert.equal(bridge.length, 1, "one bridge chart");
    const slides = await Promise.all(Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).map((n) => zip.file(n)!.async("string")));
    const slide = slides.find((x) => x.includes("legend:legend-total-key"));
    assert.ok(slide, "the waterfall slide is present");
    return { chart: bridge[0], slide };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("waterfall options parse only as booleans and are absent by default", () => {
  const r = RENDERERS.get("waterfall")!;
  const plain = r.parse(DATA) as Record<string, unknown>;
  assert.equal("alignValues" in plain, false);
  assert.equal("drawnKeysOnly" in plain, false);
  const on = r.parse({ ...DATA, alignValues: true, drawnKeysOnly: true }) as Record<string, unknown>;
  assert.equal(on.alignValues, true);
  assert.equal(on.drawnKeysOnly, true);
  assert.throws(() => r.parse({ ...DATA, alignValues: "yes" }), /data\.alignValues: expected boolean/);
  assert.throws(() => r.parse({ ...DATA, drawnKeysOnly: 1 }), /data\.drawnKeysOnly: expected boolean/);
});

test("waterfall keeps the automatic plot area and keys both movements by default", async () => {
  const { chart, slide } = await render({});
  assert.doesNotMatch(chart, /<c:plotArea><c:layout>\s*<c:manualLayout>/, "no fixed plot layout by default");
  assert.match(slide, /legend:legend-up-key/, "Increase is keyed by default even when no increase is drawn");
  assert.match(slide, /legend:legend-down-key/);
});

test("waterfall opt-ins fix the plot layout and key only the movements drawn", async () => {
  const { chart, slide } = await render({ alignValues: true, drawnKeysOnly: true });
  assert.match(chart, /<c:plotArea><c:layout>\s*<c:manualLayout>/, "alignValues fixes the plot layout");
  assert.doesNotMatch(slide, /legend:legend-up-key/, "drawnKeysOnly leaves out the undrawn increase");
  assert.match(slide, /legend:legend-down-key/, "the drawn decreases stay keyed");
});
