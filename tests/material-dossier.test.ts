import { test } from "node:test";
import assert from "node:assert/strict";

import { formatDecimalCompact } from "@/lib/capital-control";
import { layerOf } from "@/lib/capital-intelligence";
import { getAllControlMeasures, getAllFinancialCommitments, getAllMaterials, getAllProjectDesignations, getEventById, getSourceById } from "@/lib/data";
import { buildLatticeModel, cellKey } from "@/lib/lattice";
import { buildMaterialDossier, financialStatusLine, scopeLabel, seedData, sourcesCitedByMaterial } from "@/lib/material-dossier";
import type { CapitalRowView, DossierData, DossierPayload } from "@/lib/material-dossier";
import { site } from "@/lib/site";
import type { FinancialCommitment } from "@/lib/types";

// The dossier payload. Expected values come from the specification (SMPT-M2-dossier-spec-v3, sections 3 and 5),
// the seed JSON and hand reading of source amounts, never from the function under test.

const ASOF = site.lastUpdated;
const model = buildLatticeModel(ASOF);
const slugs = getAllMaterials().map((m) => m.slug);
const dossier = (slug: string, data?: DossierData): DossierPayload => buildMaterialDossier(slug, ASOF, undefined, data)!;
const stat = (p: DossierPayload, key: string) => p.stats.find((s) => s.key === key)!;

/** Every row shown in a payload's money block, top level and nested, once each. */
function moneyRows(p: DossierPayload): CapitalRowView[] {
  const out: CapitalRowView[] = [];
  const walk = (r: CapitalRowView) => {
    out.push(r);
    r.parts.forEach(walk);
  };
  for (const l of p.money.layers) [...l.live, ...l.statusNotStated, ...l.ended].forEach(walk);
  return out;
}
const topLevelIds = (p: DossierPayload) => p.money.layers.flatMap((l) => [...l.live, ...l.statusNotStated, ...l.ended]).map((r) => r.id);
const findRow = (p: DossierPayload, id: string) => moneyRows(p).find((r) => r.id === id);

/** A copy of the seed with one commitment changed, for cases the seed does not contain. */
const withCommitment = (id: string, change: (c: FinancialCommitment) => FinancialCommitment): DossierData => {
  const data = seedData();
  return { ...data, commitments: data.commitments.map((c) => (c.id === id ? change(structuredClone(c)) : c)) };
};

// --- AC-1: Compare parity -------------------------------------------------------------------------

test("tungsten cells equal the hand-checked table in the specification", () => {
  const p = dossier("tungsten");
  const at = (id: string) => p.stages.find((s) => s.id === id)!.counts;
  assert.deepEqual(at("exploration"), { commitments: 1, controls: 0, designations: 0 });
  assert.deepEqual(at("mining"), { commitments: 2, controls: 0, designations: 3 });
  assert.deepEqual(at("processing"), { commitments: 3, controls: 1, designations: 2 });
  assert.deepEqual(at("refining"), { commitments: 2, controls: 1, designations: 1 });
  for (const s of p.stages) if (!["exploration", "mining", "processing", "refining"].includes(s.id)) assert.deepEqual(s.counts, { commitments: 0, controls: 0, designations: 0 }, s.id);
  // One clause, the China anti-smuggling campaign, records no stage, by rule.
  assert.equal(p.unstaged.controls.length, 1);
  assert.match(p.unstaged.controls[0].noStageReason ?? "", /^By rule/);
  assert.equal(p.unstaged.capital.length + p.unstaged.designations.length, 0);
});

test("every material and stage: cards, counts and the lattice model agree", () => {
  for (const slug of slugs) {
    const p = dossier(slug);
    const id = p.id;
    assert.deepEqual(p.stages.map((s) => s.id), model.stages.map((s) => s.id), slug);
    for (const s of p.stages) {
      const cell = model.cells[cellKey(id, s.id)];
      assert.equal(s.capital.length, cell?.commitments.length ?? 0, `${slug} ${s.id} commitments`);
      assert.equal(s.options.length, cell?.options.length ?? 0, `${slug} ${s.id} options`);
      assert.equal(s.ended.length, cell?.ended.length ?? 0, `${slug} ${s.id} ended`);
      assert.equal(s.controls.length, cell?.controls.length ?? 0, `${slug} ${s.id} controls`);
      assert.equal(s.designations.length, cell?.designations.length ?? 0, `${slug} ${s.id} designations`);
      assert.deepEqual(s.counts, { commitments: s.capital.length, controls: s.controls.length, designations: s.designations.length }, `${slug} ${s.id} counts`);
    }
    const un = model.unstaged[id];
    assert.equal(p.unstaged.capital.length, un?.commitments.length ?? 0, `${slug} unstaged commitments`);
    assert.equal(p.unstaged.controls.length, un?.controls.length ?? 0, `${slug} unstaged controls`);
    assert.equal(p.unstaged.designations.length, un?.designations.length ?? 0, `${slug} unstaged designations`);
  }
});

// --- AC-2 and AC-22: stats ------------------------------------------------------------------------

test("tungsten stats", () => {
  const p = dossier("tungsten");
  const v = (k: string) => stat(p, k).value;
  assert.equal(v("events"), 18);
  assert.equal(v("clauses"), 2);
  assert.equal(v("capital"), 8);
  assert.equal(stat(p, "capital").sublabel, "2 of them are parts of a package");
  assert.equal(v("designations"), 5);
  assert.equal(v("projects"), 6);
  assert.equal(stat(p, "projects").sublabel, "1 with no designation");
  assert.equal(v("programmes"), 4);
  assert.equal(v("organizations"), 11);
  assert.equal(v("sources"), 29);
});

test("designations, projects and projects with no designation, per material; the counts are not assumed equal", () => {
  const expected: Record<string, [number, number, number]> = {
    tungsten: [5, 6, 1],
    "rare-earth-elements": [9, 22, 13],
    graphite: [15, 22, 7],
    "ndfeb-magnets": [0, 5, 5],
    gallium: [1, 4, 3],
    germanium: [2, 5, 3],
    dysprosium: [0, 3, 3],
    terbium: [0, 3, 3],
    antimony: [0, 6, 6],
    neodymium: [0, 0, 0],
    praseodymium: [0, 0, 0],
    lithium: [1, 9, 8], // Thacker Pass and Rhyolite Ridge processing are separate non-designated projects
    cobalt: [4, 5, 1],
    nickel: [4, 6, 2],
  };
  for (const slug of slugs) {
    const p = dossier(slug);
    assert.deepEqual([stat(p, "designations").value, stat(p, "projects").value, p.registryProjects.length], expected[slug], slug);
  }
  assert.notEqual(stat(dossier("graphite"), "designations").value, stat(dossier("graphite"), "projects").value);
});

// --- AC-3: the sources definition -----------------------------------------------------------------

test("sources: 29 for tungsten, 33 if registry evidence were counted, and an unrelated registry citation is excluded", () => {
  const cited = sourcesCitedByMaterial("tungsten");
  assert.equal(cited.length, 29);
  assert.ok(cited.some((c) => c.source.id === "src-iea-critical-minerals"), "the material record's own source");
  assert.deepEqual(cited.find((c) => c.source.id === "src-iea-critical-minerals")!.citedBy.map((c) => c.kind), ["material_record"]);
  for (const c of cited) assert.ok(c.citedBy.length >= 1, c.source.id);
  const wider = sourcesCitedByMaterial("tungsten", undefined, { includeRegistry: true });
  assert.equal(wider.length, 33);
  assert.notEqual(cited.length, wider.length);

  // A fixture: a registry organization of the material cites a source no record of the material cites.
  const data = seedData();
  const unrelated = data.sources.find((s) => !cited.some((c) => c.source.id === s.id) && !wider.some((c) => c.source.id === s.id))!;
  const org = data.organizations.find((o) => o.id === "org-jp-jogmec")!;
  const fixture: DossierData = { ...data, organizations: data.organizations.map((o) => (o.id === org.id ? { ...o, evidence: [...o.evidence, { sourceId: unrelated.id, supports: ["name"], evidence: "explicit" as const }] } : o)) };
  assert.equal(sourcesCitedByMaterial("tungsten", fixture).length, 29);
  assert.ok(sourcesCitedByMaterial("tungsten", fixture, { includeRegistry: true }).some((c) => c.source.id === unrelated.id));
});

test("Lofdal's transaction disclosures are cited once per capital row and project", () => {
  for (const materialId of ["rare-earth-elements", "dysprosium", "terbium"]) {
    for (const sourceId of ["src-ncmi-lofdal-jv-20260730", "src-ncmi-lofdal-jv-update-20260831"]) {
      const cited = sourcesCitedByMaterial(materialId).find(({ source }) => source.id === sourceId);
      assert.ok(cited, `${sourceId} is present in the ${materialId} dossier`);
      assert.deepEqual(
        cited.citedBy.map(({ kind, id }) => ({ kind, id })),
        [
          { kind: "capital_row", id: "fin-jp-jogmec-lofdal-2026-equity" },
          { kind: "project", id: "prj-na-lofdal" },
        ],
      );
    }
  }
});

test("Regolith's current company sources are cited once for the capital row and project", () => {
  for (const sourceId of [
    "src-nrcan-regolith-eip-2025",
    "src-ggt-mississauga-demo-commissioning-20260811",
  ]) {
    const cited = sourcesCitedByMaterial("graphite").find(
      ({ source }) => source.id === sourceId,
    );
    assert.ok(cited, `${sourceId} is present in the graphite dossier`);
    assert.deepEqual(
      cited.citedBy.map(({ kind, id }) => ({ kind, id })),
      [
        { kind: "capital_row", id: "fin-ca-pdac-2026-ggt-eip" },
        { kind: "project", id: "prj-ca-ggt-regolith-graphite" },
      ],
    );
  }
});

// --- AC-4: dates ----------------------------------------------------------------------------------

test("the recipient's nested lifecycle and project evidence is cited once per record", () => {
  const cited = sourcesCitedByMaterial("tungsten").find(
    ({ source }) => source.id === "src-allied-tungsten-expansion-20260409",
  );
  assert.ok(cited, "the original recipient disclosure is in the dossier's sources");
  assert.deepEqual(
    cited.citedBy.map(({ kind, id }) => ({ kind, id })),
    [
      { kind: "capital_row", id: "fin-jp-jogmec-almt-tungsten-grant" },
      { kind: "project", id: "prj-jp-almt-tungsten" },
    ],
  );
});

test("V1: the Allied Material grant is decided with no date, and the event date is never substituted", () => {
  const row = findRow(dossier("tungsten"), "fin-jp-jogmec-almt-tungsten-grant")!;
  const check = (text: string) => {
    assert.equal(text, "Decided, date not stated");
  };
  check(row.status.text);
  assert.equal(row.status.date, null);
  assert.equal(row.status.dated, false);
  // The comp shows the event date, 18 Mar 2026, as the decision date. The check rejects that variant.
  const almt = getAllFinancialCommitments().find((c) => c.id === "fin-jp-jogmec-almt-tungsten-grant")!;
  assert.equal(getEventById(almt.eventId)!.date, "2026-03-18");
  assert.throws(() => check("Decided, 18 Mar 2026 (status date)"));
  // A dated status carries its own date, labelled as a status date.
  const dated = findRow(dossier("tungsten"), "fin-uk-nwf-2026-tungsten-west-package")!;
  assert.equal(dated.status.text, "Announced, status date 25 Aug 2026");
  assert.equal(financialStatusLine(seedData().commitments.find((c) => c.id === "fin-jp-jogmec-almt-tungsten-grant")!).dated, false);
});

test("a control clause's dates are its own status dates, labelled as such", () => {
  const clause = dossier("tungsten").controls.find((c) => c.title.startsWith("Export licensing"))!;
  const cutoffLabel = new Date(ASOF+"T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
  assert.equal(clause.asOfState, "In force on "+cutoffLabel);
  assert.equal(clause.entry, "In force, status date 4 Feb 2025");
  assert.equal(clause.documentNumber, "MOFCOM/GACC Announcement No. 10 (2025)");
});

// --- AC-5, AC-6: money is listed, never computed ---------------------------------------------------

const QUALIFIER = { exact: "", up_to: "up to ", approximately: "about ", at_least: "at least " } as const;
/** One row's own figure, written from the seed row alone. */
const expectedFigure = (c: FinancialCommitment) => `${QUALIFIER[c.amount!.qualifier]}${c.amount!.currency} ${formatDecimalCompact(c.amount!.value)}`;

test("the money block shows each row's own figure exactly once, for every material", () => {
  const all = getAllFinancialCommitments();
  for (const slug of slugs) {
    const p = dossier(slug);
    const named = all.filter((c) => c.materialIds.includes(p.id));
    const expected = named.filter((c) => c.amount).map(expectedFigure).sort();
    const shown = moneyRows(p).filter((r) => r.amount).map((r) => r.amount!.text).sort();
    assert.deepEqual(shown, expected, slug);
  }
});

test("no computed figure among the payload's figures: nothing equals a sum of rows", () => {
  const figures = (slug: string) => moneyRows(dossier(slug)).flatMap((r) => (r.amount ? [r.amount.text] : []));
  const tungsten = figures("tungsten");
  assert.ok(!tungsten.some((t) => t.includes("9,500,000,000") || t.includes("9.5 billion")), "no JPY 9.5 billion");
  const rare = figures("rare-earth-elements");
  for (const banned of ["JPY 18.3 billion", "JPY 18,300,000,000", "USD 175 million", "USD 175,000,000"]) assert.ok(!rare.some((t) => t.includes(banned)), banned);
});

// --- AC-7: nesting --------------------------------------------------------------------------------

test("a part nests inside its package and appears nowhere at top level", () => {
  const nested: [string, string, string[]][] = [
    ["tungsten", "fin-uk-nwf-2026-tungsten-west-package", ["fin-uk-nwf-2026-tungsten-west-equity", "fin-uk-nwf-2026-tungsten-west-lending"]],
    ["rare-earth-elements", "fin-ca-g7-2025-ucore-package", ["fin-ca-g7-2025-ucore-feddev", "fin-ca-g7-2025-ucore-nrcan"]],
    ["rare-earth-elements", "fin-us-osc-vulcan-reelement-2025-joint-commitment", ["fin-us-osc-vulcan-reelement-2025-reelement-loan", "fin-us-osc-vulcan-reelement-2025-vulcan-elements-loan"]],
  ];
  for (const [slug, parent, kids] of nested) {
    const p = dossier(slug);
    const row = findRow(p, parent)!;
    assert.deepEqual(row.parts.map((k) => k.id).sort(), kids, parent);
    for (const k of kids) assert.ok(!topLevelIds(p).includes(k), `${k} is not top level`);
  }
});

test("the USAR children nest under the two five-material parents; every amount is its own", () => {
  const parents = ["fin-us-chips-usar-2026-direct-funding", "fin-us-chips-usar-2026-loan-guarantee"];
  const counts: Record<string, number> = { "rare-earth-elements": 6, "ndfeb-magnets": 4, dysprosium: 2, terbium: 2, gallium: 2 };
  for (const [slug, n] of Object.entries(counts)) {
    const p = dossier(slug);
    const under = parents.flatMap((id) => findRow(p, id)!.parts.map((k) => k.id)).filter((id) => id.startsWith("fin-us-chips-usar-2026-"));
    assert.equal(under.length, n, slug);
    for (const id of under) assert.ok(!topLevelIds(p).includes(id));
    assert.equal(findRow(p, parents[0])!.scope, "names 5 materials; the amount is not divided");
    assert.equal(findRow(p, parents[0])!.amount!.text, "up to USD 277 million"); // the source says "a maximum award amount of $277.0 million"
    assert.equal(findRow(p, parents[1])!.amount!.text, "up to USD 1.3 billion");
  }
});

test("top level plus nested equals the rows naming the material, per layer, for all tracked materials", () => {
  const all = getAllFinancialCommitments();
  for (const slug of slugs) {
    const p = dossier(slug);
    const named = all.filter((c) => c.materialIds.includes(p.id));
    assert.equal(p.money.total, named.length, slug);
    assert.equal(p.money.topLevel + p.money.nested, named.length, slug);
    assert.equal(moneyRows(p).length, named.length, slug);
    assert.equal(new Set(moneyRows(p).map((r) => r.id)).size, named.length, `${slug}: each row once`);
    // Per layer: the capital-rows stat covers the commitment layers only, and the other layers carry their own.
    for (const l of p.money.layers) assert.equal(l.count, named.filter((c) => layerOf(c) === l.key).length, `${slug} ${l.key}`);
    const other = p.stats.filter((s) => s.key.startsWith("layer:")).reduce((n, s) => n + s.value, 0);
    assert.equal(stat(p, "capital").value + other, named.length, slug);
  }
});

test("drawn_from never nests; it names the ancestor, and says so when the ancestor does not name the material", () => {
  const rare = dossier("rare-earth-elements");
  const samarium = findRow(rare, "fin-us-dod-mp-2025-samarium-loan")!;
  assert.ok(topLevelIds(rare).includes(samarium.id));
  assert.deepEqual(samarium.notes.map((n) => [n.relation, n.targetId, n.inSet]), [["drawn_from", "fin-us-osc-obbba-2025-lending-authority", false]]);
  const graphite = dossier("graphite");
  const kingston = findRow(graphite, "fin-ca-cmrdd-2024-kingston-awards")!;
  assert.deepEqual(kingston.notes.map((n) => [n.relation, n.inSet]), [["drawn_from", false]]);
  assert.deepEqual(kingston.parts.map((k) => k.id), ["fin-ca-cmrdd-2024-green-graphite"]);
});

test("a part whose package does not name the material stands alone, with a note (Nolans equity, gallium equity)", () => {
  for (const [slug, id] of [["rare-earth-elements", "fin-au-arafura-nolans-2025-equity"], ["gallium", "fin-au-alcoa-sojitz-gallium-2025-equity"]] as const) {
    const p = dossier(slug);
    assert.ok(topLevelIds(p).includes(id), id);
    const notes = findRow(p, id)!.notes;
    assert.deepEqual(notes.map((n) => [n.relation, n.targetId, n.inSet]), [["part_of", "fin-us-au-framework-2025-au-financing", false]]);
  }
  // Hand-built: the same package now names the material, so the part nests and carries no note.
  const data = seedData();
  const fixture: DossierData = {
    ...data,
    commitments: data.commitments.map((c) => (c.id === "fin-us-au-framework-2025-au-financing" ? { ...structuredClone(c), materialIds: [...c.materialIds, "gallium"] } : c)),
  };
  const p = dossier("gallium", fixture);
  assert.ok(!topLevelIds(p).includes("fin-au-alcoa-sojitz-gallium-2025-equity"));
  assert.deepEqual(findRow(p, "fin-us-au-framework-2025-au-financing")!.parts.map((k) => k.id), ["fin-au-alcoa-sojitz-gallium-2025-equity"]);
});

// --- AC-8: scope labels ---------------------------------------------------------------------------

test("each row carries the one scope label its precedence gives", () => {
  const p = dossier("tungsten");
  assert.equal(findRow(p, "fin-au-cmpti-2025-production-tax-offset")!.scope, "names 13 materials; the amount is not divided");
  assert.equal(findRow(p, "fin-ca-pdac-2026-nb-granitoids-cmgd")!.scope, "names 2 materials; the amount is not divided");
  assert.equal(findRow(p, "fin-uk-nwf-2026-tungsten-west-package")!.scope, "also covers materials outside the tracked set");
  assert.equal(findRow(p, "fin-jp-jogmec-almt-tungsten-grant")!.scope, "names Tungsten only");
  assert.equal(findRow(p, "fin-jp-jogmec-japan-new-metals-tungsten-grant")!.scope, "names Tungsten only");
  const base = getAllFinancialCommitments().find((c) => c.id === "fin-jp-jogmec-almt-tungsten-grant")!;
  assert.equal(scopeLabel({ ...base, materialAttribution: "not_stated" }, "Tungsten"), "material attribution not stated");
  // Precedence: several materials beat an untracked co-product.
  assert.equal(scopeLabel({ ...base, materialIds: ["tungsten", "graphite"], materialAttribution: "includes_untracked" }, "Tungsten"), "names 2 materials; the amount is not divided");
});

// --- AC-9, AC-10: layers and non-live rows --------------------------------------------------------

test("graphite keeps the reviewed CGF equity apart from non-binding indications", () => {
  const p = dossier("graphite");
  assert.deepEqual(p.money.layers.map((l) => l.key), ["public_commitment", "indication"]);
  const pub = p.money.layers[0];
  assert.deepEqual(pub.statusNotStated.map((r) => r.id), []);
  assert.equal(pub.live.find((r) => r.id === "fin-ca-g7-2025-nmg-canada-growth-fund")?.standing, "binding");
  assert.equal(p.money.layers[1].live.length, 3);
  assert.ok(p.money.layers[1].live.some((r) => r.id === "fin-ca-g7-2025-nmg-edc-letter-of-interest"));
});

test("a fixture with an unknown financial status stays in the dossier's separate sub-list", () => {
  const id = "fin-ca-g7-2025-nmg-canada-growth-fund";
  const data = withCommitment(id, (c) => ({
    ...c,
    financialStatusHistory: [{ status: "not_stated", date: null, sourceId: "src-nrcan-g7-cmpa-2025" }],
  }));
  const pub = dossier("graphite", data).money.layers[0];
  assert.deepEqual(pub.statusNotStated.map((r) => r.id), [id]);
  assert.ok(!pub.live.some((r) => r.id === id));
});

test("an ended package does not hide a part that still stands", () => {
  const data = withCommitment("fin-uk-nwf-2026-tungsten-west-package", (c) => ({ ...c, financialStatusHistory: [...c.financialStatusHistory, { status: "withdrawn", date: "2026-09-01", sourceId: c.financialStatusHistory[0].sourceId }] }));
  const p = dossier("tungsten", data);
  const pub = p.money.layers[0];
  const pkg = pub.ended.find((r) => r.id === "fin-uk-nwf-2026-tungsten-west-package")!;
  assert.ok(pkg, "the package is listed as ended");
  assert.deepEqual(pkg.parts.map((k) => k.id).sort(), ["fin-uk-nwf-2026-tungsten-west-equity", "fin-uk-nwf-2026-tungsten-west-lending"]);
  for (const k of pkg.parts) assert.equal(k.standing, "not_yet_binding", "the part is judged on its own status");
  assert.equal(moneyRows(p).length, 8);
});

test("edge fixtures: a funding option, a row with no amount, a group material, and a material with no capital row", () => {
  const rare = dossier("rare-earth-elements");
  assert.ok(rare.money.layers.some((l) => l.key === "funding_option" && l.live.length === 1), "the MP funding option is in its own layer");
  const noAmount = findRow(dossier("tungsten"), "fin-uk-nwf-2026-tungsten-procurement-right")!;
  assert.equal(noAmount.amount, null);
  assert.equal(noAmount.asStated, null);
  assert.ok(dossier("dysprosium").groupNote?.href === "/materials/rare-earth-elements");
  assert.ok(rare.groupNote && rare.groupNote.href === null);
  assert.equal(dossier("tungsten").groupNote, null);
  // Every material in the seed has at least one row, so the empty case is built by hand.
  const empty = dossier("antimony", { ...seedData(), commitments: [] });
  assert.equal(empty.money.layers.length, 0);
  assert.equal(empty.money.total, 0);
  assert.equal(stat(empty, "capital").value, 0);
});

// --- AC-11: timeline ------------------------------------------------------------------------------

test("every event is plotted at its event date, never its publication date", () => {
  const p = dossier("tungsten");
  assert.equal(p.timeline.points.length, 18);
  const differs = seedData().events.filter((e) => e.affectedMaterialIds.includes("tungsten") && e.lifecycle.officialPublicationDate !== e.date);
  assert.ok(differs.length >= 4, "the seed has events whose two dates differ");
  for (const e of differs) assert.equal(p.timeline.points.find((x) => x.id === e.id)!.date, e.date);
  for (let i = 1; i < p.timeline.points.length; i++) assert.ok(p.timeline.points[i].pct >= p.timeline.points[i - 1].pct, "left to right by date");
  for (const pt of p.timeline.points) assert.ok(pt.pct >= 0 && pt.pct <= 100);
  assert.equal(p.timeline.asOfPct, 100);
});

test("the no-later-date claim holds only when true", () => {
  assert.deepEqual(dossier("tungsten").timeline.futureDates, []);
  const data = withCommitment("fin-jp-jogmec-almt-tungsten-grant", (c) => ({ ...c, financialStatusHistory: [...c.financialStatusHistory, { status: "contracted", date: "2027-02-01", sourceId: c.financialStatusHistory[0].sourceId }] }));
  assert.deepEqual(dossier("tungsten", data).timeline.futureDates, [{ date: "2027-02-01", source: "capital row fin-jp-jogmec-almt-tungsten-grant" }]);
  const clause = getAllControlMeasures().find((m) => m.materialIds.includes("tungsten"))!;
  const data2: DossierData = { ...seedData(), controls: seedData().controls.map((m) => (m.id === clause.id ? { ...structuredClone(m), statusHistory: m.statusHistory.map((s) => ({ ...s, until: "2030-01-01" })) } : m)) };
  assert.ok(dossier("tungsten", data2).timeline.futureDates.some((f) => f.date === "2030-01-01"));
});

test("dots that share a lane keep their 24 px tap areas apart at a 282 px track", () => {
  for (const slug of slugs) {
    const p = dossier(slug);
    const byLane = new Map<number, number[]>();
    for (const pt of p.timeline.points) byLane.set(pt.lane, [...(byLane.get(pt.lane) ?? []), pt.pct]);
    for (const xs of byLane.values()) for (let i = 1; i < xs.length; i++) assert.ok((xs[i] - xs[i - 1]) * 2.82 >= 24 - 1e-9, `${slug}: dots at least 24 px apart on a 282 px track`);
  }
});

// --- AC-23, AC-24: designations are not projects --------------------------------------------------

test("designation cards: one per designation, headed by the project, at the designation's own stages", () => {
  const p = dossier("tungsten");
  const cards = p.stages.flatMap((s) => s.designations.map((d) => ({ stage: s.id, d })));
  for (const { d } of cards) {
    assert.ok(d.href.startsWith("/projects/prj-"));
    assert.ok(d.programme.length > 0);
    assert.match(d.status.text, /status date \d/);
  }
  const hemerdon = cards.filter(({ d }) => d.projectId === "prj-gb-hemerdon");
  assert.deepEqual(hemerdon.map((c) => c.stage), ["mining"], "at mining only, not at processing");
  assert.equal(hemerdon[0].d.heading, "Hemerdon tungsten and tin mine");
  assert.equal(hemerdon[0].d.registry.stageNote, "Project record codes: mining, processing. Not placed here; this designation names mining only.");
  // Tin is on the project record; the designation itself names no untracked material.
  assert.deepEqual(hemerdon[0].d.untracked, []);
  assert.deepEqual(hemerdon[0].d.registry.untracked, ["tin"]);
  // A project whose stages match its designation's carries no such note.
  assert.ok(cards.filter(({ d }) => d.projectId !== "prj-gb-hemerdon").every(({ d }) => d.registry.stageNote === null));
  // Designations with no stage sit in "No stage recorded", and the project's own stages do not place them.
  assert.deepEqual(dossier("graphite").unstaged.designations.map((d) => d.id), ["dsg-eu-crma-prohipersi"]);
  assert.deepEqual(dossier("germanium").unstaged.designations.map((d) => d.id), ["dsg-eu-crma-regain"]);
  for (const s of dossier("graphite").stages) assert.ok(!s.designations.some((d) => d.id === "dsg-eu-crma-prohipersi"));
});

test("a material with projects and no designations lists them apart and places none", () => {
  const nd = dossier("ndfeb-magnets");
  assert.deepEqual(nd.registryProjects.map((r) => r.id), ["prj-ee-neo-rare-earth-magnet-project", "prj-us-mp-10x-facility", "prj-us-mp-independence-expansion", "prj-us-usar-magnet-project-2", "prj-us-usar-stillwater-magnet"]);
  for (const s of nd.stages) assert.equal(s.designations.length, 0, s.id);
  assert.equal(nd.unstaged.designations.length, 0);
  for (const slug of ["dysprosium", "terbium"]) {
    const names = dossier(slug).registryProjects.map((r) => r.name);
    assert.ok(names.some((n) => n.startsWith("Lofdal")) && names.some((n) => n.startsWith("Round Top")), slug);
  }
  // No project is placed by its own stage list: every card is a designation.
  const placed = new Set(getAllProjectDesignations().map((d) => d.projectId));
  for (const r of nd.registryProjects) assert.ok(!placed.has(r.id) || getAllProjectDesignations().every((d) => d.projectId !== r.id || !d.materialIds.includes("ndfeb-magnets")));
});

test("fixture: a project with two designations is two cards, one project", () => {
  const data = seedData();
  const base = data.designations.find((d) => d.id === "dsg-eu-crma-tungsten-west")!;
  const second = { ...structuredClone(base), id: "dsg-eu-crma-tungsten-west-second", stages: ["processing" as const] };
  const fixture: DossierData = { ...data, designations: [...data.designations, second].sort((a, b) => (a.id < b.id ? -1 : 1)) };
  const p = dossier("tungsten", fixture);
  assert.equal(stat(p, "projects").value, 6);
  assert.equal(stat(p, "designations").value, 6);
  const cards = p.stages.flatMap((s) => s.designations.map((d) => ({ stage: s.id, id: d.id }))).filter((c) => c.id.startsWith("dsg-eu-crma-tungsten-west"));
  assert.deepEqual(cards.sort((a, b) => (a.id < b.id ? -1 : 1)), [
    { stage: "mining", id: "dsg-eu-crma-tungsten-west" },
    { stage: "processing", id: "dsg-eu-crma-tungsten-west-second" },
  ]);
});

test("fixture: a project whose only designation names other materials is listed with that note", () => {
  const data = seedData();
  const fixture: DossierData = { ...data, designations: data.designations.map((d) => (d.id === "dsg-eu-crma-tungsten-west" ? { ...structuredClone(d), materialIds: ["antimony"] } : d)) };
  const p = dossier("tungsten", fixture);
  const listed = p.registryProjects.find((r) => r.id === "prj-gb-hemerdon")!;
  assert.ok(listed, "Hemerdon is in the registry list");
  assert.equal(listed.designatedElsewhere.length, 1);
  assert.equal(stat(p, "designations").value, 4);
  assert.equal(stat(p, "projects").value, 6);
  assert.equal(stat(p, "projects").sublabel, "2 with no designation");
  assert.ok(!p.stages.some((s) => s.designations.some((d) => d.projectId === "prj-gb-hemerdon")));
});

// --- Events and related ---------------------------------------------------------------------------

test("tungsten: 18 events, 9 with no child row, and the legal-basis events are separate", () => {
  const p = dossier("tungsten");
  assert.equal(p.events.length, 18);
  assert.equal(p.events.filter((e) => e.children.commitments + e.children.controls + e.children.designations === 0).length, 9);
  assert.equal(p.events.filter((e) => e.event.policyStatus === "superseded").length, 3);
  assert.deepEqual(p.related.legalBasis.map((b) => b.id), ["evt-cn-decree-792-2024", "evt-cn-ecl-2020"]);
  assert.ok(p.related.legalBasis.every((b) => !b.inMaterialEvents));
  assert.deepEqual(p.events.map((e) => e.event.date), [...p.events.map((e) => e.event.date)].sort().reverse());
  assert.ok(p.related.sources.every((s) => getSourceById(s.source.id)));
});

test("the lede names the oldest and latest event and claims coding, not attribution", () => {
  const p = dossier("tungsten");
  assert.equal(p.lede, "Records coded to Tungsten, from Final List of Critical Minerals 2018 (18 May 2018) to the latest event on 7 Sep 2026. Shared stage codes are not findings.");
  assert.ok(!p.lede.includes("every record whose source names"));
});

test("all 11 dossiers build", () => {
  for (const slug of slugs) assert.ok(dossier(slug), slug);
  assert.equal(buildMaterialDossier("no-such-material", ASOF), null);
});
