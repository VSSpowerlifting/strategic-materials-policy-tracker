import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AmountDetail } from "@/components/capital/primitives";
import { CurrencyTotals } from "@/components/intelligence/totals";
import { InlineAmount } from "@/components/capital/rows";
import { Dossier } from "@/components/dossier/dossier";
import { totalCommitments } from "@/lib/capital-control";
import { getAllFinancialCommitments, getFinancialCommitmentById } from "@/lib/data";
import { layerGlosses } from "@/lib/labels";
import { buildMaterialDossier } from "@/lib/material-dossier";
import { site } from "@/lib/site";

// F1-F3 presentation fixes: the announced-amount basis, and binding wording that covers partially_disbursed.
const text = (markup: string) => markup.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/\s+/g, " ");
const dod = () => getFinancialCommitmentById("fin-us-dod-5n-germanium-2024")!;

test("F1: the 2024 5N amount block states the $14.4M is announced, apart from the federal obligation and the unrecorded amount paid", () => {
  const out = text(renderToStaticMarkup(createElement(AmountDetail, { amount: dod().amount! })));
  assert.match(out, /Amount basis/);
  assert.match(out, /announced/i);
  assert.match(out, /unreconciled with the \$12,458,128 federal obligation/);
  assert.match(out, /\$2,505,981 non-federal funding/);
  assert.doesNotMatch(out, /not confirmed as the (executed, )?obligated/);
  assert.match(out, /No amount paid is recorded/);
  assert.match(out, /\$14\.4 million/); // the as-stated figure is unchanged
});

test("F1: no basis is claimed for any other record", () => {
  const withBasis = getAllFinancialCommitments().filter((c) => c.amount?.basisNote);
  assert.deepEqual(getAllFinancialCommitments().filter((c) => c.amount?.basisLabel).map((c) => c.id), ["fin-us-dod-5n-germanium-2024"]);
  assert.deepEqual(withBasis.map((c) => c.id), ["fin-us-dod-5n-germanium-2024"]);
  const plain = getAllFinancialCommitments().find((c) => c.amount && !c.amount.basisNote)!;
  assert.doesNotMatch(text(renderToStaticMarkup(createElement(AmountDetail, { amount: plain.amount! }))), /Amount basis/);
});

test("F1: compact rows and the material page carry a local 'announced' qualifier for this record only", () => {
  const inline = (c: ReturnType<typeof dod>) => text(renderToStaticMarkup(createElement(InlineAmount, { amount: c.amount })));
  assert.match(inline(dod()), /14\.4 million.*announced/i);
  const other = getAllFinancialCommitments().find((c) => c.amount && c.id !== dod().id)!;
  assert.doesNotMatch(inline(other), /announced/i);
  const p = buildMaterialDossier("germanium", site.lastUpdated)!;
  const out = text(renderToStaticMarkup(createElement(Dossier, { payload: p })));
  assert.match(out, /Amount basis: announced; see the record page/);
  assert.equal(out.split("Amount basis:").length - 1, 1);
});

test("F2: the public-commitment caption covers contracted, partially disbursed and disbursed rows", () => {
  const g = layerGlosses.public_commitment;
  assert.match(g, /contracted, partially disbursed or disbursed row is binding because an agreement is executed; payment is tracked separately/);
  assert.match(g, /contracted row need not mean funds are obligated or paid/);
  assert.match(g, /partially disbursed row is not fully paid/);
});

test("F2/F3: the material page shares the caption and a binding label compatible with partially_disbursed", () => {
  const p = buildMaterialDossier("germanium", site.lastUpdated)!;
  const out = text(renderToStaticMarkup(createElement(Dossier, { payload: p })));
  assert.match(out, /contracted, partially disbursed or disbursed row is binding/);
  assert.match(out, /Binding: an agreement is executed; payment is tracked separately/);
  assert.doesNotMatch(out, /which is not a payment/);
});

test("F1: totals that count the 2024 5N row say the figure is announced and unreconciled; other totals carry no such note", () => {
  const render = (c: ReturnType<typeof dod>) => text(renderToStaticMarkup(createElement(CurrencyTotals, { totals: totalCommitments([c]) })));
  const withRow = render(dod());
  assert.match(withRow, /Includes an announced amount/);
  assert.match(withRow, /unreconciled with the \$12,458,128 federal obligation/);
  const other = getAllFinancialCommitments().find((c) => c.amount && c.id !== dod().id && c.instrument !== "mixed" && c.instrument !== "unspecified")!;
  assert.doesNotMatch(render(other), /Includes an/);
});

// Machine-readable outputs: wherever the 14,400,000 amount appears as a figure, the basis travels with it.
const ID = "fin-us-dod-5n-germanium-2024";

test("F1 outputs: the financial-commitments CSV appends the basis for this row only, without moving columns", async () => {
  const { financialCommitmentsCsv } = await import("@/lib/export");
  const csv = financialCommitmentsCsv();
  const header = csv.slice(0, csv.indexOf("\n")).replace("\r", "").split(",");
  assert.deepEqual(header.slice(-2), ["amountBasisLabel", "amountBasisNote"]);
  assert.equal(header.indexOf("amountValue"), 6); // existing positions unchanged
  assert.equal(csv.split(",Announced,").length - 1, 1);
  assert.equal(csv.split("Announced amount (DoD release").length - 1, 1);
  assert.ok(csv.indexOf(`\n${ID},`) < csv.indexOf(",Announced,"));
});

test("F1 outputs: the record API and dataset export carry basisLabel and basisNote on the amount", async () => {
  const route = await import("@/app/api/v1/financial-commitments/[id]/route");
  const body = JSON.stringify(await (await route.GET(new Request("http://x/x"), { params: Promise.resolve({ id: ID }) })).json());
  assert.match(body, /"basisLabel":"Announced"/);
  assert.match(body, /"basisNote":"Announced amount/);
});

test("F1 outputs: summed totals and API summaries list the basis beside a total that counts the row; other totals do not", async () => {
  const { totalCommitments } = await import("@/lib/capital-control");
  const inst = (rows: ReturnType<typeof dod>[]) => {
    const t = totalCommitments(rows);
    const c = t.currencies[0];
    return c.status === "summed" ? c.instruments.find((i) => i.summed) : undefined;
  };
  const row = inst([dod()]);
  assert.ok(row && row.summed);
  assert.deepEqual(row.summed && row.binding, { exact: "14400000" }); // amount and counting unchanged
  assert.equal(row.summed && row.amountBasis?.[0].commitmentId, ID);
  const other = getAllFinancialCommitments().find((c) => c.amount && c.id !== ID && c.instrument !== "mixed" && c.instrument !== "unspecified")!;
  const o = inst([other]);
  assert.ok(o && o.summed && !("amountBasis" in o));
  const { GET } = await import("@/app/api/v1/capital-intelligence/summary/route");
  const summary = JSON.stringify(await (await GET()).json());
  assert.match(summary, /"amountBasis":\[\{"commitmentId":"fin-us-dod-5n-germanium-2024","label":"Announced"/);
});

test("F1 outputs: the lattice amount view carries basisLabel for this row only", async () => {
  const { amountView } = await import("@/lib/lattice");
  assert.equal(amountView(dod())?.basisLabel, "Announced");
  const other = getAllFinancialCommitments().find((c) => c.amount && c.id !== ID)!;
  assert.ok(!("basisLabel" in amountView(other)!));
});
