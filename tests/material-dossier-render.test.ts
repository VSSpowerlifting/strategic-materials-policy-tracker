import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CapitalControls } from "@/components/dossier/capital-controls";
import { Dossier } from "@/components/dossier/dossier";
import { getAllFramingClaims, getAllMaterials } from "@/lib/data";
import { framingCategoryLabels } from "@/lib/labels";
import { buildMaterialDossier, seedData } from "@/lib/material-dossier";
import type { DossierData, DossierPayload } from "@/lib/material-dossier";
import { LEDGER, NOTE_FIELDS, ledgerFailure, renderableNote } from "@/lib/material-notes-review";
import type { Ledger, LedgerEntry } from "@/lib/material-notes-review";
import { site } from "@/lib/site";
import { SUPPLY_CHAIN_STAGES } from "@/lib/types";

// The rendered dossier, the static rules on its source, and the editorial-notes ledger (AC-5, 6, 12, 16, 17, 18).

const ROOT = join(import.meta.dirname, "..");
const ASOF = site.lastUpdated;
const materials = getAllMaterials();
const slugs = materials.map((m) => m.slug);
const payload = (slug: string, data?: DossierData, ledger?: Ledger): DossierPayload => buildMaterialDossier(slug, ASOF, undefined, data, ledger)!;
const html = (p: DossierPayload) => renderToStaticMarkup(createElement(Dossier, { payload: p }));
const text = (markup: string) => markup.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1");
const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;
const moneyAttributes = (markup: string) => [...markup.matchAll(/data-money="([^"]*)"/g)].map((m) => m[1]);

const sourceOf = (file: string) => readFileSync(join(ROOT, file), "utf8");
const dossierFiles = ["lib/material-dossier.ts", "lib/material-notes-review.ts", ...readdirSync(join(ROOT, "components/dossier")).map((f) => `components/dossier/${f}`)];

// --- AC-5: the money block ------------------------------------------------------------------------

test("the dossier neither imports nor mentions the summing helpers", () => {
  for (const file of dossierFiles) {
    const src = sourceOf(file);
    for (const banned of ["totalCommitments", "lib/decimal", "./decimal", "formatDecimalCompact", "addDecimals", "projectStack"]) assert.ok(!src.includes(banned), `${file} mentions ${banned}`);
  }
});

test("the capital and controls section uses none of the words that would announce a sum", () => {
  const words = /\b(total|totals|totalled|sum|sums|summed|subtotal|combined|overall|altogether)\b/i;
  for (const slug of slugs) {
    const section = text(renderToStaticMarkup(createElement(CapitalControls, { payload: payload(slug) })));
    assert.ok(!words.test(section), `${slug}: ${words.exec(section)?.[0]}`);
  }
});

test("the rendered figures are exactly the payload's single-row figures, once each", () => {
  for (const slug of slugs) {
    const p = payload(slug);
    const section = renderToStaticMarkup(createElement(CapitalControls, { payload: p }));
    const rows: string[] = [];
    const walk = (r: { amount: { text: string } | null; parts: never[] }) => {
      if (r.amount) rows.push(r.amount.text);
      (r.parts as unknown as (typeof r)[]).forEach(walk);
    };
    for (const l of p.money.layers) [...l.live, ...l.statusNotStated, ...l.ended].forEach((r) => walk(r as never));
    assert.deepEqual(moneyAttributes(section).sort(), rows.sort(), slug);
  }
});

test("tungsten and rare earths render no figure the rows do not state, in attributes or in plain text", () => {
  const tungstenSection = renderToStaticMarkup(createElement(CapitalControls, { payload: payload("tungsten") }));
  assert.deepEqual([...moneyAttributes(tungstenSection)].sort(), ["about JPY 2 billion", "about JPY 7.5 billion", "CAD 172,000", "GBP 36 million", "up to GBP 35 million", "up to GBP 71 million"].sort());
  // The whole tungsten page, as text: no sum of the two JPY grants, however it is written.
  const tungsten = text(html(payload("tungsten")));
  for (const banned of ["9.5 billion", "9,500,000,000", "9.5 bn", "9,500 million", "9500 million"]) assert.ok(!tungsten.includes(banned), banned);
  const rare = text(html(payload("rare-earth-elements")));
  for (const banned of ["JPY 18.3 billion", "18,300,000,000", "18.3 billion", "USD 175 million", "175,000,000"]) assert.ok(!rare.includes(banned), banned);
});

test("apart from a row's own figure and its source wording, the money block prints no currency figure", () => {
  // A sum written as plain text (no data-money, no banned word) would survive every other check, so strip what a row
  // is allowed to print (its figure, its source wording, and a part's own figure in its "Part:" line) and look at the rest.
  const currency = /\b(USD|GBP|CAD|JPY|EUR|AUD|INR)\b[^A-Za-z]{0,3}\d/;
  for (const slug of slugs) {
    const section = renderToStaticMarkup(createElement(CapitalControls, { payload: payload(slug) }));
    const rest = section
      .replace(/<span data-money=[^>]*>[\s\S]*?<\/strong><\/span>/g, " ")
      .replace(/<span data-as-stated[^>]*>[\s\S]*?<\/span>/g, " ")
      .replace(/<p class="[^"]*">Part: [^<]*<\/p>/g, " ");
    assert.ok(!currency.test(text(rest)), `${slug}: ${currency.exec(text(rest))?.[0]}`);
  }
});

// --- AC-12: URL behavior, no script ---------------------------------------------------------------

test("each stage id appears on exactly one element, and every section renders without a script", () => {
  for (const slug of slugs) {
    const p = payload(slug);
    const markup = html(p);
    for (const stage of p.stages) assert.equal(count(markup, `id="stage-${stage.id}"`), 1, `${slug} stage-${stage.id}`);
    for (const id of ["supply-chain", "records", "capital-controls", "timeline", "events", "related"]) assert.equal(count(markup, `id="${id}"`), 1, `${slug} #${id}`);
    assert.ok(!markup.includes("<script"), "no client script");
    // The band carries data-stage and no id; the id lives once, in the records.
    for (const stage of p.stages) assert.equal(count(markup, `data-stage="${stage.id}"`), 1, `${slug} band ${stage.id}`);
    assert.equal(count(markup, 'data-no-stage="true"'), 1, `${slug} band: one no-stage column`);
  }
  // Every vocabulary stage id that has a column is spelled as the vocabulary spells it.
  for (const stage of payload("tungsten").stages) assert.ok((SUPPLY_CHAIN_STAGES as readonly string[]).includes(stage.id));
});

test("Compare's dossier link points at the selected stage, and the old copy is gone", () => {
  const src = sourceOf("components/lattice/lattice.tsx");
  assert.ok(src.includes("/materials/${material.slug}#stage-${selection.stage}"));
  assert.ok(!src.includes("material page"));
  assert.ok(src.includes("dossier"));
});

test("tungsten renders its stage focus target in the records, with the hemerdon note and the money list", () => {
  const markup = html(payload("tungsten"));
  const body = text(markup);
  assert.ok(markup.includes('id="stage-processing"'));
  assert.ok(body.includes("Decided, date not stated"));
  assert.ok(body.includes("Project record codes: mining, processing. Not placed here; this designation names mining only."));
  assert.ok(body.includes("Part: Equity, GBP 36 million; not added again"));
  assert.ok(body.includes("names 10 materials; the amount is not divided"));
  assert.ok(body.includes("No tungsten record states a date after the as-of."));
  assert.ok(body.includes("None recorded at: Separation, Component manufacturing"));
  assert.ok(!body.includes("every record whose source names"));
});

test("the future-date note is replaced by the dates when there are some", () => {
  const data = seedData();
  const fixture: DossierData = { ...data, commitments: data.commitments.map((c) => (c.id === "fin-jp-jogmec-almt-tungsten-grant" ? { ...structuredClone(c), financialStatusHistory: [...c.financialStatusHistory, { status: "contracted" as const, date: "2027-02-01", sourceId: c.financialStatusHistory[0].sourceId }] } : c)) };
  const body = text(html(payload("tungsten", fixture)));
  assert.ok(!body.includes("No tungsten record states a date after the as-of."));
  assert.ok(body.includes("Dates stated after the as-of: 1 Feb 2027"));
});

// --- AC-17, AC-18: no framing, no private drafts --------------------------------------------------

test("no framing quote, framing category label or framing count is rendered", () => {
  for (const slug of ["tungsten", "rare-earth-elements"]) {
    const p = payload(slug);
    const body = text(html(p));
    const eventIds = new Set(p.events.map((e) => e.event.id));
    for (const f of getAllFramingClaims().filter((c) => eventIds.has(c.eventId))) assert.ok(!body.includes(f.quoteEn) && !body.includes(f.quoteOriginal), f.id);
    for (const label of Object.values(framingCategoryLabels)) assert.ok(!body.includes(label), label);
    assert.ok(!body.includes("Official framing not yet coded"));
  }
  const tungsten = html(payload("tungsten"));
  for (const e of payload("tungsten").events) assert.ok(tungsten.includes(`href="/events/${e.event.id}"`), e.event.id);
});

test("no private draft id reaches any dossier", () => {
  const dir = join(ROOT, "data/candidates");
  const ids: string[] = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) for (const c of JSON.parse(readFileSync(join(dir, f), "utf8")) as { candidateId: string }[]) ids.push(c.candidateId);
  const files = existsSync(join(dir, "candidates.json")) ? "with" : "without";
  assert.ok(ids.length > 0, `candidate ids loaded (${files} the private file)`);
  for (const slug of slugs) {
    const markup = html(payload(slug));
    assert.ok(!markup.toLowerCase().includes("cand-"), slug);
    for (const id of ids) assert.ok(!markup.includes(id), `${slug}: ${id}`);
  }
  for (const file of dossierFiles) assert.ok(!/from "[^"]*candidates/.test(sourceOf(file)), file);
});

// --- AC-16: the notes ledger ----------------------------------------------------------------------

const claim = (sentence: string, id: string) => ({ sentence, evidence: [{ kind: "record" as const, id, locator: "status history, first entry" }] });
const seedText = (slug: string, field: (typeof NOTE_FIELDS)[number]) => materials.find((m) => m.slug === slug)![field] as string;
/** A hand-built entry that passes every check, for one field; sentences are split at a full stop and a space. */
function passing(slug: string, field: (typeof NOTE_FIELDS)[number]): LedgerEntry {
  const verifiedText = seedText(slug, field);
  const sentences = verifiedText.split(". ").map((s, i, all) => (i < all.length - 1 ? `${s}.` : s));
  return {
    show: true,
    verifiedText,
    claims: sentences.map((s) => claim(s, "ctl-cn-tungsten-2025-export-licensing")),
    checkedOn: "2026-09-26",
  };
}

test("the shipped ledger omits every field it has not verified, and downstream lists are the only note text shown", () => {
  for (const slug of slugs) {
    const p = payload(slug);
    assert.deepEqual(p.notes.fields, [], slug);
    assert.equal(p.metaDescription, p.lede, `${slug}: without a shown summary the derived lede is the description`);
    const markup = html(p);
    assert.equal(count(markup, "data-note-field="), 1, slug);
    assert.ok(markup.includes('data-note-field="downstreamIndustries"'));
  }
  for (const slug of slugs) for (const f of NOTE_FIELDS) assert.equal(renderableNote(slug, f), null, `${slug} ${f}`);
});

test("default is omit: no entry, an unverified entry and a mismatch entry all leave the field out", () => {
  assert.equal(renderableNote("tungsten", "statusSummary", {}), null);
  assert.equal(renderableNote("tungsten", "statusSummary", { tungsten: {} }), null);
  assert.equal(renderableNote("tungsten", "statusSummary", { tungsten: { statusSummary: { show: false, reason: "unverified" } } }), null);
  assert.equal(renderableNote("tungsten", "statusSummary", { tungsten: { statusSummary: { show: false, reason: "mismatch" } } }), null);
  assert.equal(renderableNote("no-such-material", "statusSummary", {}), null);
  // A synthetic field with no seed text never renders either.
  assert.equal(renderableNote("tungsten", "diversificationNote", { tungsten: { diversificationNote: passing("tungsten", "diversificationNote") } }, [{ ...materials[0], slug: "tungsten", diversificationNote: null }]), null);
});

test("a fully evidenced entry renders the seed text verbatim; each broken rule takes it away", () => {
  const good = passing("tungsten", "statusSummary");
  const ledger = (entry: LedgerEntry): Ledger => ({ tungsten: { statusSummary: entry } });
  assert.equal(renderableNote("tungsten", "statusSummary", ledger(good)), seedText("tungsten", "statusSummary"));
  assert.equal(ledgerFailure(good, seedText("tungsten", "statusSummary")), null);
  assert.ok(good.show);
  if (!good.show) return;
  // Rule 2: a stale entry, for text that has since changed.
  assert.equal(renderableNote("tungsten", "statusSummary", ledger({ ...good, verifiedText: `${good.verifiedText} ` })), null);
  // Rule 3: the claims must cover every sentence, with none left out.
  assert.equal(renderableNote("tungsten", "statusSummary", ledger({ ...good, claims: good.claims.slice(0, -1) })), null);
  assert.equal(renderableNote("tungsten", "statusSummary", ledger({ ...good, claims: [] })), null);
  // Rule 4: every claim needs evidence that resolves, with a locator, and a source needs a read date.
  const bad = (evidence: (typeof good.claims)[number]["evidence"]): LedgerEntry => ({ ...good, claims: [{ ...good.claims[0], evidence }, ...good.claims.slice(1)] });
  assert.equal(renderableNote("tungsten", "statusSummary", ledger(bad([]))), null);
  assert.equal(renderableNote("tungsten", "statusSummary", ledger(bad([{ kind: "record", id: "ctl-does-not-exist", locator: "x" }]))), null);
  assert.equal(renderableNote("tungsten", "statusSummary", ledger(bad([{ kind: "record", id: "ctl-cn-tungsten-2025-export-licensing", locator: "  " }]))), null);
  assert.equal(renderableNote("tungsten", "statusSummary", ledger(bad([{ kind: "record", id: "cand-cn-re-admin-regulations-2024", locator: "x" }]))), null);
  assert.equal(renderableNote("tungsten", "statusSummary", ledger(bad([{ kind: "source", id: "src-iea-critical-minerals", locator: "Section 2" }]))), null, "a source with no read date");
  assert.equal(renderableNote("tungsten", "statusSummary", ledger(bad([{ kind: "source", id: "src-not-in-registry", locator: "Section 2", readOn: "2026-09-26" }]))), null);
  assert.equal(renderableNote("tungsten", "statusSummary", ledger(bad([{ kind: "source", id: "src-iea-critical-minerals", locator: "Section 2", readOn: "2026-09-26" }]))), seedText("tungsten", "statusSummary"), "a read source with a locator passes");
  assert.equal(renderableNote("tungsten", "statusSummary", ledger({ ...good, checkedOn: "" })), null);
});

test("every string rendered under the notes is a verified seed string, and each figure-bearing note follows the same rule", () => {
  // The four China-position notes that state a share, checked one by one: only a passing entry lets one through.
  const figure = ["tungsten", "rare-earth-elements", "gallium", "ndfeb-magnets"] as const;
  const ledger: Ledger = { tungsten: { chinaPositionNote: passing("tungsten", "chinaPositionNote") }, gallium: { chinaPositionNote: { show: false, reason: "mismatch" } } };
  const shown = new Map(figure.map((slug) => [slug, text(html(payload(slug, undefined, ledger)))]));
  assert.ok(shown.get("tungsten")!.includes(seedText("tungsten", "chinaPositionNote")), "verified: shown");
  for (const slug of ["rare-earth-elements", "gallium", "ndfeb-magnets"] as const) assert.ok(!shown.get(slug)!.includes(seedText(slug, "chinaPositionNote")), `${slug}: no passing entry, omitted`);

  // The gate checked against a renderer that ignores the ledger: it lets an unverified figure through, and the check sees it.
  const rendered = (slug: string, gate: (slug: string, f: (typeof NOTE_FIELDS)[number]) => string | null) => NOTE_FIELDS.map((f) => gate(slug, f)).filter((t): t is string => t !== null);
  const verified = (slug: string, l: Ledger) => new Set(NOTE_FIELDS.flatMap((f) => (l[slug]?.[f]?.show === true ? [seedText(slug, f)] : [])));
  const assertGated = (slug: string, l: Ledger, gate: (slug: string, f: (typeof NOTE_FIELDS)[number]) => string | null) => {
    const ok = verified(slug, l);
    for (const t of rendered(slug, gate)) assert.ok(ok.has(t), `${slug}: rendered a note with no passing entry: ${t}`);
  };
  const real = (slug: string, f: (typeof NOTE_FIELDS)[number]) => renderableNote(slug, f, ledger);
  for (const slug of slugs) assertGated(slug, ledger, real);
  const ignoresLedger = (slug: string, f: (typeof NOTE_FIELDS)[number]) => seedText(slug, f);
  assert.throws(() => assertGated("rare-earth-elements", ledger, ignoresLedger), /no passing entry/);
  assert.throws(() => assertGated("gallium", ledger, ignoresLedger), /no passing entry/);

  // Each entry the shipped ledger marks show must pass the render rule (none does yet).
  for (const [slug, fields] of Object.entries(LEDGER)) for (const [f, entry] of Object.entries(fields)) if (entry?.show) assert.equal(ledgerFailure(entry, seedText(slug, f as (typeof NOTE_FIELDS)[number])), null, `${slug} ${f}`);
});

test("the gate has no per-material rule and inspects no note text", () => {
  const review = sourceOf("lib/material-notes-review.ts");
  const beforeLedger = review.slice(0, review.indexOf("export const LEDGER"));
  const afterLedger = review.slice(review.indexOf("const isDate"));
  for (const slug of slugs) assert.ok(!beforeLedger.includes(`"${slug}"`) && !afterLedger.includes(`"${slug}"`), `${slug} appears in the gate`);
  for (const file of dossierFiles) {
    const src = sourceOf(file);
    for (const banned of ["new RegExp", ".test(", ".match(", ".matchAll(", ".search(", ".replace(/", ".split(/"]) assert.ok(!src.includes(banned), `${file} uses ${banned}`);
    assert.ok(!/=\s*\/[^/*\s][^\n]*\/[a-z]*[;,)]/.test(src), `${file} holds a regular expression literal`);
  }
  for (const file of dossierFiles.filter((f) => f.startsWith("components/dossier/") || f === "lib/material-dossier.ts")) {
    for (const f of ["chinaPositionNote", "diversificationNote", "statusSummary"]) if (sourceOf(file).includes(`material.${f}`)) assert.fail(`${file} reads ${f} directly, around the ledger`);
  }
});

// --- Scale: all 11 dossiers render ---------------------------------------------------------------

test("all 11 dossiers render every section that has content, with no overflow-prone table", () => {
  for (const slug of slugs) {
    const p = payload(slug);
    const markup = html(p);
    assert.ok(markup.includes(p.nameEn), slug);
    assert.ok(!markup.includes("<table"), `${slug}: no table to overflow a phone`);
    assert.equal(markup.includes('id="notes"'), p.notes.downstream.length > 0 || p.notes.fields.length > 0);
    for (const s of p.money.layers) assert.ok(markup.includes(`data-layer="${s.key}"`));
  }
});
