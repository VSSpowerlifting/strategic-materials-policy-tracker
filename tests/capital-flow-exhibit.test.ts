import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CapitalFlowExhibit } from "@/components/exhibits/capital-flow";
import {
  CAPITAL_SOURCE_FLOW,
  DRAWN_FLOW_CLASSES,
  FLOW_CLASSES,
  FLOW_CLASS_DESCRIPTIONS,
  FLOW_CLASS_LABELS,
  INSTRUMENT_FLOW,
  STATUS_FLOW,
  VALUE_ROLE_FLOW,
  buildCapitalFlowModel,
  classifyFlow,
  flowAmountLabel,
  hasEquityInterest,
} from "@/lib/capital-flow";
import type { CapitalFlowModel } from "@/lib/capital-flow";
import { financialStatusOn } from "@/lib/capital-control";
import { getAllEvents, getFinancialCommitmentById, getFinancialCommitmentsByEvent } from "@/lib/data";
import { addDecimals, formatDecimalCompact, formatMoney, groupDecimal } from "@/lib/decimal";
import { site } from "@/lib/site";
import { CAPITAL_SOURCES, FINANCIAL_INSTRUMENTS, FINANCIAL_STATUSES, VALUE_ROLES } from "@/lib/types";
import type { FinancialCommitment } from "@/lib/types";

const MP = "evt-us-dod-mp-2025";
const ASOF = site.lastUpdated;

const render = (eventId: string) => renderToStaticMarkup(createElement(CapitalFlowExhibit, { eventId }));
const unescape = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const textOf = (markup: string) =>
  unescape(markup.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ");
const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const models: CapitalFlowModel[] = getAllEvents()
  .map((e) => buildCapitalFlowModel(e.id))
  .filter((m): m is CapitalFlowModel => m !== null);
const drawn = models.filter((m) => m.hasIdentifiedParties);

// --- Classification ---------------------------------------------------------------------------

test("every label in lib/types has a classification rule, and no rule names an unknown label", () => {
  assert.deepEqual(Object.keys(STATUS_FLOW).sort(), [...FINANCIAL_STATUSES].sort());
  assert.deepEqual(Object.keys(VALUE_ROLE_FLOW).sort(), [...VALUE_ROLES].sort());
  assert.deepEqual(Object.keys(CAPITAL_SOURCE_FLOW).sort(), [...CAPITAL_SOURCES].sort());
  assert.deepEqual(Object.keys(INSTRUMENT_FLOW).sort(), [...FINANCIAL_INSTRUMENTS].sort());
  assert.deepEqual(Object.keys(FLOW_CLASS_LABELS).sort(), [...FLOW_CLASSES].sort());
  assert.deepEqual(Object.keys(FLOW_CLASS_DESCRIPTIONS).sort(), [...FLOW_CLASSES].sort());

  const classes = new Set<string>(FLOW_CLASSES);
  for (const instrument of FINANCIAL_INSTRUMENTS) {
    for (const valueRole of VALUE_ROLES) {
      for (const capitalSource of CAPITAL_SOURCES) {
        for (const status of [...FINANCIAL_STATUSES, null]) {
          const { flowClass } = classifyFlow({ instrument, valueRole, capitalSource }, status);
          assert.ok(classes.has(flowClass), `${instrument}/${valueRole}/${capitalSource}/${status} is unclassified`);
        }
      }
    }
  }
});

test("status decides first: an ended or unstated row is never classed as live, and only a disbursed row is cash", () => {
  for (const instrument of FINANCIAL_INSTRUMENTS) {
    for (const valueRole of VALUE_ROLES) {
      for (const capitalSource of CAPITAL_SOURCES) {
        const row = { instrument, valueRole, capitalSource };
        assert.equal(classifyFlow(row, "lapsed").flowClass, "ended");
        assert.equal(classifyFlow(row, "withdrawn").flowClass, "ended");
        assert.equal(classifyFlow(row, "not_stated").flowClass, "status_not_stated");
        assert.equal(classifyFlow(row, null).flowClass, "status_not_stated");
        for (const status of FINANCIAL_STATUSES) {
          const { flowClass } = classifyFlow(row, status);
          if (flowClass === "cash") assert.equal(status, "disbursed");
          if (flowClass === "part_disbursed") assert.equal(status, "partially_disbursed");
          // Private money, options, ceilings and commercial terms never take a public-money class.
          if (flowClass === "cash" || flowClass === "part_disbursed" || flowClass === "committed") {
            assert.equal(valueRole, "commitment");
            assert.notEqual(capitalSource, "private");
            assert.equal(INSTRUMENT_FLOW[instrument], "next");
          }
        }
      }
    }
  }
  assert.equal(hasEquityInterest({ instrument: "equity" }, "contingent"), false);
  assert.equal(hasEquityInterest({ instrument: "equity" }, "ended"), false);
  assert.equal(hasEquityInterest({ instrument: "equity" }, "cash"), true);
  assert.equal(hasEquityInterest({ instrument: "loan" }, "cash"), false);
});

test("DoD and MP Materials: each recorded row takes the class its fields support", () => {
  const model = buildCapitalFlowModel(MP);
  assert.ok(model);
  const classOf = (id: string) => model.flows.find((f) => f.id === id)?.flowClass;

  // The bank commitment letter lapsed: it is ended, and never cash or a commitment.
  assert.equal(classOf("fin-us-dod-mp-2025-bank-financing"), "ended");
  const bank = model.flows.find((f) => f.id === "fin-us-dod-mp-2025-bank-financing")!;
  assert.equal(bank.status.status, "lapsed");
  assert.equal(bank.status.text, "Lapsed 26 Aug 2025");
  assert.equal(bank.equityInterest, false);

  // The unexercised option is contingent, worded as "no exercise recorded".
  const option = model.flows.find((f) => f.id === "fin-us-dod-mp-2025-additional-preferred-option")!;
  assert.equal(option.flowClass, "contingent");
  assert.equal(option.equityInterest, false);
  assert.match(option.status.text, /^Option executed 9 Jul 2025, no exercise recorded$/);

  assert.equal(classOf("fin-us-dod-mp-2025-price-floor"), "contingent");
  assert.equal(classOf("fin-us-dod-mp-2025-magnet-offtake"), "commercial");
  assert.equal(classOf("fin-us-dod-mp-2025-company-cash"), "not_public");

  // Only rows whose status on the reading date is disbursed are cash.
  const cash = model.flows.filter((f) => f.flowClass === "cash").map((f) => f.id).sort();
  assert.deepEqual(cash, ["fin-us-dod-mp-2025-preferred-equity", "fin-us-dod-mp-2025-samarium-loan"]);
  assert.equal(model.flows.find((f) => f.id === "fin-us-dod-mp-2025-preferred-equity")!.equityInterest, true);

  // Ceilings and budget lines are listed apart, never drawn.
  assert.deepEqual(model.listed.map((r) => r.id), [
    "fin-us-osc-obbba-2025-credit-subsidy",
    "fin-us-osc-obbba-2025-lending-authority",
  ]);
  assert.ok(model.listed.every((r) => r.flowClass === "reference"));

  // The company's own money has no outside provider and allocates nothing to a project.
  const own = model.flows.find((f) => f.id === "fin-us-dod-mp-2025-company-cash")!;
  assert.equal(own.ownFunds, true);
  assert.equal(own.providers.length, 0);
  assert.ok(own.uses.length > 1 && own.uses.every((u) => !u.allocated));

  // The loan's parent ceiling is an annotation on the loan.
  const loan = model.flows.find((f) => f.id === "fin-us-dod-mp-2025-samarium-loan")!;
  assert.deepEqual(loan.annotations.map((a) => [a.label, a.targetId]), [
    ["Drawn from", "fin-us-osc-obbba-2025-lending-authority"],
  ]);

  // Each organization's rows sit together, so each is drawn once.
  assert.deepEqual(model.providerRuns.map((r) => [r.partyIds.join("+"), r.span]), [
    ["org-us-dod", 4],
    ["org-us-osc", 1],
    ["org-goldman-sachs-bank-usa+org-jpmorgan-chase-funding", 1],
  ]);
  assert.deepEqual(model.recipientRuns.map((r) => [r.partyIds.join("+"), r.span]), [
    ["org-mp-10x-development", 1],
    ["org-mp-materials", 6],
  ]);
});

test("across the corpus the model is deterministic and accounts for every row exactly once", () => {
  assert.ok(drawn.length > 10);
  for (const model of models) {
    assert.deepEqual(buildCapitalFlowModel(model.eventId), model);
    assert.deepEqual(JSON.parse(JSON.stringify(model)), model);

    const rows = getFinancialCommitmentsByEvent(model.eventId);
    const seen = [...model.flows.map((f) => f.id), ...model.listed.map((r) => r.id)].sort();
    assert.deepEqual(seen, rows.map((r) => r.id).sort(), model.eventId);

    const drawnIds = new Set(model.flows.map((f) => f.id));
    for (const flow of model.flows) {
      const row = getFinancialCommitmentById(flow.id)!;
      const status = financialStatusOn(row, ASOF);
      assert.ok((DRAWN_FLOW_CLASSES as readonly string[]).includes(flow.flowClass));
      if (flow.flowClass === "cash") assert.equal(status, "disbursed", flow.id);
      if (status === "lapsed" || status === "withdrawn") assert.equal(flow.flowClass, "ended", flow.id);
      if (status === null || status === "not_stated") assert.equal(flow.flowClass, "status_not_stated", flow.id);
      assert.ok(flow.recipients.length > 0, flow.id);
      assert.ok(flow.providers.length > 0 || flow.ownFunds, flow.id);
      assert.ok(flow.sources.length > 0, flow.id);
      // A package and its parts are the same money: both are never drawn.
      for (const r of row.relationships) {
        if (r.relationship === "part_of") assert.ok(!drawnIds.has(r.commitmentId), `${flow.id} drawn beside its package`);
      }
    }
    // Lane boxes cover each lane's parties exactly once.
    for (const side of ["providers", "recipients"] as const) {
      const runs = side === "providers" ? model.providerRuns : model.recipientRuns;
      model.flows.forEach((flow, i) => {
        const covering = runs.filter((r) => i >= r.start && i < r.start + r.span);
        if (flow[side].length === 0) assert.equal(covering.length, 0);
        else assert.deepEqual(covering.map((r) => r.partyIds), [flow[side].map((p) => p.id)]);
      });
    }
  }
});

// --- Rendered output --------------------------------------------------------------------------

/** Every string an individual row states for itself: its figure, its source wording, its terms and notes. */
function ownStrings(rows: readonly FinancialCommitment[]): string {
  const out: string[] = [];
  for (const c of rows) {
    if (c.amount) out.push(flowAmountLabel(c.amount), formatMoney(c.amount.value, c.amount.currency), c.amount.amountAsStated, c.amount.basisNote ?? "");
    for (const s of c.financialStatusHistory) out.push(s.note ?? "");
    for (const t of c.terms) {
      if (t.value !== null) out.push(`${t.currency ? `${t.currency} ` : ""}${groupDecimal(t.value)}${t.unit?.startsWith("%") ? t.unit : ` ${t.unit ?? ""}`}`);
    }
  }
  return out.join(" | ");
}

const MONEY = /(?:\b[A-Z]{3}\s|(?:US|A|C|R)?[$€£¥]\s?)\d[\d,.]*\d?(?:\s?(?:million|billion|trillion|crore|[MB]\b))?|\b\d[\d,.]*\s?%/g;

function relatedRows(eventId: string): FinancialCommitment[] {
  const rows = getFinancialCommitmentsByEvent(eventId);
  const targets = rows.flatMap((c) => c.relationships.map((r) => getFinancialCommitmentById(r.commitmentId)!));
  return [...new Map([...rows, ...targets].map((c) => [c.id, c])).values()];
}

test("the rendered exhibit shows only individual rows' own figures and never a sum", () => {
  for (const model of drawn) {
    const text = textOf(render(model.eventId));
    const rows = relatedRows(model.eventId);
    // Titles of the event and of the cited sources are quoted as published and may name a figure.
    const titles = [model.eventTitle, ...model.sources.map((s) => s.title)].join(" | ");
    const allowed = `${ownStrings(rows)} | ${titles}`;

    const figures = text.match(MONEY) ?? [];
    if (model.eventId === MP) assert.ok(figures.length >= 6, "the MP exhibit states its rows' figures");
    for (const figure of figures) {
      const token = figure.trim().replace(/[.,]$/, "");
      assert.ok(allowed.includes(token), `${model.eventId}: "${token}" is not a figure any single row states`);
    }

    // No subset of two or more rows' amounts appears added together. Published titles and the record's own
    // status notes are quoted text, so a total a source itself states there is not the exhibit's sum.
    const quoted = [model.eventTitle, ...model.sources.map((s) => s.title), ...rows.flatMap((c) => c.financialStatusHistory.map((s) => s.note ?? ""))]
      .map((q) => q.replace(/\s+/g, " ").trim())
      .filter((q) => q.length > 0)
      .sort((a, b) => b.length - a.length);
    let body = text;
    for (const q of quoted) body = body.split(q).join(" ");
    const byCurrency = new Map<string, string[]>();
    for (const c of rows) if (c.amount) byCurrency.set(c.amount.currency, [...(byCurrency.get(c.amount.currency) ?? []), c.amount.value]);
    for (const [currency, values] of byCurrency) {
      const own = new Set(values);
      const n = Math.min(values.length, 14);
      for (let mask = 1; mask < 1 << n; mask += 1) {
        const subset = values.filter((_, i) => i < n && mask & (1 << i));
        if (subset.length < 2) continue;
        const sum = addDecimals(subset);
        if (own.has(sum)) continue;
        for (const rendering of [formatMoney(sum, currency), `${formatDecimalCompact(sum)} `, groupDecimal(sum)]) {
          if (rendering.length < 4) continue;
          assert.ok(!body.includes(rendering), `${model.eventId}: a summed figure "${rendering}" is rendered`);
        }
      }
    }
  }
});

test("every drawn row links to its commitment record, its parties and a primary source", () => {
  for (const model of drawn) {
    const markup = render(model.eventId);
    const items = markup.split('<li id="').slice(1);
    for (const flow of model.flows) {
      const item = items.find((s) => s.slice(0, s.indexOf('"')).endsWith(`-${flow.id}`));
      assert.ok(item, `${flow.id} has no row in the list of all flows`);
      const row = item.slice(0, item.indexOf("</ol>") === -1 ? undefined : item.indexOf("</ol>"));
      assert.ok(row.includes(`href="/capital/${flow.id}"`), `${flow.id} does not link to its record`);
      assert.ok(flow.sources.some((s) => row.includes(`href="${escapeAttr(s.url)}"`)), `${flow.id} links to no source`);
      for (const p of [...flow.providers, ...flow.recipients]) assert.ok(row.includes(`href="${p.href}"`), `${flow.id}: ${p.id}`);
      for (const u of flow.uses) assert.ok(row.includes(`href="${u.href}"`), `${flow.id}: ${u.id}`);
      assert.ok(unescape(row.replace(/<[^>]*>/g, " ")).includes(flow.status.text), `${flow.id} status wording`);
      // The diagram lane is a real link to that row, so it works without JavaScript.
      assert.ok(markup.includes(`href="#${item.slice(0, item.indexOf('"'))}"`), `${flow.id} lane link`);
    }
  }
});

test("the MP exhibit keeps status distinctions exact and follows the page's markup and copy rules", () => {
  const markup = render(MP);
  const text = textOf(markup);

  assert.match(markup, /^<figure[^>]*aria-labelledby="capflow-title-evt-us-dod-mp-2025"/);
  assert.match(markup, /<figcaption/);
  assert.match(markup, /<h2 id="capflow-title-evt-us-dod-mp-2025"/);
  assert.match(renderToStaticMarkup(createElement(CapitalFlowExhibit, { eventId: MP, headingLevel: 3 })), /<h3 id="capflow-title-/);
  assert.ok(text.includes("10 July 2025"));
  assert.ok(text.includes(`Status of each line as of 12 November 2026`));

  assert.ok(text.includes("Lapsed 26 Aug 2025. Not in force."));
  assert.ok(text.includes("no exercise recorded"));
  assert.ok(!/not exercised/i.test(text));
  assert.ok(text.includes("Up to USD 350 million"));
  assert.ok(text.includes("At least USD 1 billion"));
  assert.ok(text.includes("Not additional money"));
  assert.ok(text.includes("Not public support") || text.includes("not public support"));
  assert.ok(text.includes("A lending ceiling, not money lent."));

  // Legend names every class drawn, by text as well as by mark.
  for (const label of ["Cash disbursed", "Contingent or optional", "Commercial arrangement", "Private or own funds", "Ended, not in force", "Equity interest"]) {
    assert.ok(text.includes(label), label);
  }
  // The MP event has no row that is merely committed, so that key is not shown.
  assert.ok(!text.includes("Not yet disbursed"));

  // No definition lists (the homepage asserts none), no joined-with-middot strings, no arrows.
  assert.ok(!/<d[ldt][\s>]/.test(markup));
  assert.ok(!/[·→↗↳]/.test(text));
  // Marks are decorative and labelled in text.
  assert.ok(!/<svg(?![^>]*aria-hidden="true")/.test(markup));
});

test("the exhibit renders nothing when an event has no commitments with identified parties", () => {
  assert.equal(render("evt-does-not-exist"), "");
  const withoutRows = getAllEvents().find((e) => getFinancialCommitmentsByEvent(e.id).length === 0);
  assert.ok(withoutRows, "the corpus has an event with no commitment rows");
  assert.equal(buildCapitalFlowModel(withoutRows.id), null);
  assert.equal(render(withoutRows.id), "");

  // Rows exist, but none names both a provider and a recipient organization.
  const listedOnly = models.filter((m) => !m.hasIdentifiedParties);
  assert.ok(listedOnly.length > 0);
  for (const m of listedOnly) assert.equal(render(m.eventId), "");
});
