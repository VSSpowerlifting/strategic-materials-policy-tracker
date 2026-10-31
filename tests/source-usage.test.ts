import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSourceUseIndex, getSourceUses, publishedSourceRecords,
  SOURCE_USE_KINDS,
} from "@/lib/source-usage";
import { buildSearchIndex } from "@/lib/search";
import { getAllProjectMilestones } from "@/lib/data";

test("reverse provenance covers only direct citations and does not inherit parent event sources", () => {
  const live = publishedSourceRecords();
  const primary = live.sources[0].id;
  const second = live.sources[1].id;
  assert.notEqual(primary, second);
  const event = { ...live.events[0], sourceIds: [primary] };
  const finance = {
    ...live.finances[0], eventId: event.id, evidence: [],
    financialStatusHistory: [{
      status: "announced" as const, date: null, sourceId: second, note: null,
    }],
    implementationStatusHistory: [], terms: [], outcomes: [], relationships: [],
    financialAmountHistory: undefined,
  };
  const input = {
    ...live,
    events: [event], finances: [finance], controls: [], projects: [],
    milestones: [], designations: [], framing: [], organizations: [],
    programmes: [], materials: [], actors: [],
  };
  const index = buildSourceUseIndex(input);
  assert.deepEqual(index.get(primary)?.map(use => use.kind + ":" + use.id), [
    "event:" + event.id,
  ]);
  const references = index.get(second)!;
  assert.equal(references.length, 1);
  assert.equal(references[0].kind, "capital");
  assert.equal(references[0].id, finance.id);
  assert.deepEqual(references[0].roles, ["Financial status report"]);
  assert.equal(references[0].href, "/capital/" + finance.id);
  assert.equal(index.get(primary)?.some(use => use.kind === "capital"), false,
    "sharing an event does not transfer its source citation to the finance row");
  assert.equal(index.get(second)?.some(use => use.kind === "event"), false,
    "a financial status source does not automatically cite the parent event");
});

test("multiple field and status citations show one record with distinct citation roles", () => {
  const live = publishedSourceRecords();
  const sid = live.sources[0].id;
  const parent = live.finances[0];
  const finance = {
    ...parent,
    evidence: [
      {sourceId: sid, supports: ["amount"] as typeof parent.evidence[number]["supports"], evidence: parent.evidence[0].evidence},
      {sourceId: sid, supports: ["amount"] as typeof parent.evidence[number]["supports"], evidence: parent.evidence[0].evidence},
    ],
    financialStatusHistory: [{status:"announced" as const, date:null, sourceId:sid, note:null}],
    implementationStatusHistory: [], terms: [], outcomes: [], relationships: [],
    financialAmountHistory: undefined,
  };
  const index = buildSourceUseIndex({
    ...live, events:[], finances:[finance], controls:[], projects:[],
    milestones:[], designations:[], framing:[], organizations:[],
    programmes:[], materials:[], actors:[],
  });
  const uses = index.get(sid)!;
  assert.equal(uses.length, 1, "one finance record cannot be listed twice");
  assert.deepEqual(uses[0].roles, ["Field evidence: amount", "Financial status report"]);
});

test("a missing public source reference fails closed; uncited registered sources remain visible", () => {
  const live = publishedSourceRecords();
  const invalid = {
    ...live, events:[{...live.events[0], sourceIds:["src-not-published"]}],
    finances:[], controls:[], projects:[], milestones:[], designations:[],
    framing:[], organizations:[], programmes:[], materials:[], actors:[],
  };
  assert.throws(() => buildSourceUseIndex(invalid), /Reverse source citation does not resolve/);
  assert.deepEqual(getSourceUses("src-not-published"), []);
});

test("published Wagerup evidence has financier references but no magically approved construction milestone", () => {
  const items = getSourceUses("src-alcoa-wagerup-groundbreaking-2026");
  const ids = items.filter(use => use.kind === "capital").map(use => use.id);
  assert.ok(ids.includes("fin-au-alcoa-sojitz-gallium-2025-equity"));
  assert.ok(ids.includes("fin-au-alcoa-sojitz-gallium-2025-offtake-right"));
  assert.ok(ids.includes("fin-us-alcoa-sojitz-gallium-2025-equity"));
  assert.deepEqual(items.filter(use=>use.kind==="milestone").map(use=>use.id),["mil-au-alcoa-wagerup-groundbreaking-2026-08-24"]);
  assert.deepEqual(getAllProjectMilestones().map(x => x.id),["mil-au-alcoa-wagerup-groundbreaking-2026-08-24","mil-ee-neo-narva-commercial-production-reported-2026"], "no other unsigned F5 case was promoted");
});

test("reverse references are deterministic, grouped by canonical type, and source search links point to dossiers", () => {
  const corpus = publishedSourceRecords();
  const a = buildSourceUseIndex(corpus);
  const b = buildSourceUseIndex(corpus);
  assert.deepEqual([...a], [...b]);
  const order = (k: string) => SOURCE_USE_KINDS.indexOf(k as typeof SOURCE_USE_KINDS[number]);
  for (const uses of a.values()) {
    const unique = new Set(uses.map(use => use.kind + ":" + use.id));
    assert.equal(unique.size, uses.length);
    for (let i=1;i<uses.length;i++)
      assert.ok(order(uses[i-1].kind) <= order(uses[i].kind));
    assert.ok(uses.every(use => use.href.startsWith("/") &&
      !use.href.includes(".project-execution-review") &&
      !use.href.includes("data/candidates")));
  }
  const docs = buildSearchIndex().filter(d => d.kind === "source");
  assert.equal(docs.length, corpus.sources.length);
  assert.ok(docs.every(d => d.href === "/sources/" + d.id));
});
