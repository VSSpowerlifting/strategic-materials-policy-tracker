import {test} from "node:test";
import assert from "node:assert/strict";
import {buildSearchIndex} from "@/lib/search";
import {SEARCH_KINDS, searchDocs} from "@/lib/search-core";
import type {SearchDoc} from "@/lib/search-core";
import {buildSearchReferences, searchReferencesCsv} from "@/lib/search-references";
import {site} from "@/lib/site";

const docs = buildSearchIndex();
const context = {siteUrl: site.url, corpusRevision: site.lastUpdated, scopeStart: site.scopeStart};
const all = {query: "", kind: "all", actor: "all", mechanism: "all"};

// Independent CSV reader handles embedded newlines and doubled quotes.
function readCsv(text: string): string[][] {
  const rows: string[][] = [], row: string[] = [];
  let field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {field += '"'; i++;}
      else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\r" || c === "\n")) {
      row.push(field); field = "";
      if (c !== ",") {
        rows.push([...row]); row.length = 0;
        if (c === "\r" && text[i + 1] === "\n") i++;
      }
    } else field += c;
  }
  return rows;
}

test("all eleven public record kinds preserve identities, displayed context and canonical anchors", () => {
  const examples = SEARCH_KINDS.map(kind => docs.find(d => d.kind === kind)!);
  const before = structuredClone(examples);
  const list = buildSearchReferences(examples, all, context);
  assert.equal(list.recordCount, 11);
  assert.deepEqual(list.records.map(r => r.kind), [...SEARCH_KINDS]);
  for (const [i, row] of list.records.entries()) {
    assert.deepEqual(row, {kind: examples[i].kind, id: examples[i].id,
      title: examples[i].title, context: examples[i].subtitle,
      recordUrl: new URL(examples[i].href, site.url).href});
    assert.equal(new URL(row.recordUrl).origin, site.url);
  }
  assert.ok(list.records.find(r => r.kind === "framing")!.recordUrl.includes("#"));
  assert.ok(list.records.find(r => r.kind === "watched")!.recordUrl.includes("/watchlist#"));
  assert.deepEqual(examples, before);
  assert.deepEqual(buildSearchReferences(examples, all, context), list);
});

test("a filtered research list preserves exact ranked rows and a replayable search URL", () => {
  const filters = {query: "  稀土  ", kind: "source", actor: "all", mechanism: "all"};
  const rows = searchDocs(docs, filters.query).filter(d => d.kind === "source");
  assert.ok(rows.length > 0);
  const list = buildSearchReferences(rows, filters, context);
  assert.deepEqual(list.records.map(r => r.id), rows.map(r => r.id));
  const replay = new URL(list.search.url);
  assert.equal(replay.searchParams.get("q"), "稀土");
  assert.equal(replay.searchParams.get("kind"), "source");
  assert.equal(replay.searchParams.has("actor"), false);
  assert.equal(list.search.query, "稀土");
  const parsed = readCsv(searchReferencesCsv(list));
  assert.equal(parsed.length, rows.length + 1);
  assert.deepEqual(parsed.slice(1).map(r => r[3]), rows.map(r => r.id));
  assert.ok(parsed.slice(1).every(r => r[1] === list.search.path));
});

test("actor and mechanism filters survive reference export without inventing attribution", () => {
  const filters = {query: "", kind: "event", actor: "china", mechanism: "export_control"};
  const rows = docs.filter(d => d.kind === "event" && d.jurisdiction === "china" && d.mechanisms?.includes("export_control"));
  assert.ok(rows.length > 0);
  const list = buildSearchReferences(rows, filters, context);
  const url = new URL(list.search.url);
  assert.equal(url.searchParams.get("actor"), "china");
  assert.equal(url.searchParams.get("mechanism"), "export_control");
  assert.deepEqual(list.records.map(r => r.id), rows.map(r => r.id));
});

test("metadata labels the curated revision and reference boundary without exporting search internals", () => {
  const list = buildSearchReferences(docs, all, context);
  assert.equal(list.corpusRevision, site.lastUpdated);
  assert.equal(list.scopeStart, site.scopeStart);
  assert.equal(list.format, "smpt-search-references");
  assert.equal(list.version, 1);
  assert.match(list.notice, /not original-source citations/);
  assert.match(list.notice, /not financial totals/);
  assert.ok(list.records.every(r => !("haystack" in r) && !("date" in r)));
  assert.ok(!("generatedAt" in list));
  const empty = buildSearchReferences([], all, context);
  assert.equal(empty.recordCount, 0);
  assert.equal(readCsv(searchReferencesCsv(empty)).length, 1);
});

test("CSV round trips commas, quotation, line breaks and native scripts; JSON stays lossless", () => {
  const row = {...docs[0], title: '稀土, "policy"\nsecond line', subtitle: "Énergie\r\n原文"};
  const list = buildSearchReferences([row], all, context);
  const cells = readCsv(searchReferencesCsv(list));
  assert.equal(cells[1][4], row.title);
  assert.equal(cells[1][5], row.subtitle);
  assert.equal(JSON.parse(JSON.stringify(list)).records[0].title, row.title);
});

test("spreadsheet-active title/context prefixes are neutralized only in CSV", () => {
  for (const value of ["=1+1", "+SUM(A1)", "-1+2", "@SUM(A1)", "  =1+1", "\t=1+1", "\rformula", "\nformula"]) {
    const row = {...docs[0], title: value, subtitle: value};
    const list = buildSearchReferences([row], all, context);
    const cells = readCsv(searchReferencesCsv(list));
    assert.equal(cells[1][4], "'" + value);
    assert.equal(cells[1][5], "'" + value);
    assert.equal(list.records[0].title, value);
  }
});

test("invalid filters, cross-site paths and duplicate record identities fail closed", () => {
  for (const filters of [{...all, kind: "made-up"}, {...all, actor: "made-up"}, {...all, mechanism: "made-up"}]) {
    assert.throws(() => buildSearchReferences([], filters, context), /Invalid/);
  }
  for (const href of ["https://example.com", "//example.com", "/\\example.com"]) {
    assert.throws(() => buildSearchReferences([{...docs[0], href}], all, context), /Invalid|leaves/);
  }
  assert.throws(() => buildSearchReferences([docs[0], docs[0]], all, context), /Duplicate/);
  assert.throws(() => buildSearchReferences([], all, {...context, siteUrl: "javascript:alert(1)"}), /Invalid/);
  const distinct = [{...docs[0], kind: "event"}, {...docs[0], kind: "source"}] as SearchDoc[];
  assert.equal(buildSearchReferences(distinct, all, context).recordCount, 2);
});
