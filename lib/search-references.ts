/** Browser-safe reference lists, built only from the exact visible search results. */
import {SEARCH_KINDS} from "./search-core";
import type {SearchDoc} from "./search-core";
import {JURISDICTIONS, MECHANISMS} from "./types";

export type SearchReferenceFilters = {
  query: string; kind: string; actor: string; mechanism: string;
};
export type SearchReferenceContext = {
  siteUrl: string; corpusRevision: string; scopeStart: string;
};
export const SEARCH_REFERENCE_NOTICE =
  "Search references from a bounded curated index, not original-source citations or a complete dataset. Follow each record to its cited evidence. Matching records do not establish payment, legal standing or industrial outcomes; counts are not financial totals. The corpus revision is not the date every record was rechecked.";

export function buildSearchReferences(
  results: readonly SearchDoc[], filters: SearchReferenceFilters, context: SearchReferenceContext,
) {
  const {query, kind, actor, mechanism} = filters;
  if (kind !== "all" && !(SEARCH_KINDS as readonly string[]).includes(kind)) throw Error("Invalid record-type filter");
  if (actor !== "all" && !(JURISDICTIONS as readonly string[]).includes(actor)) throw Error("Invalid actor filter");
  if (mechanism !== "all" && !(MECHANISMS as readonly string[]).includes(mechanism)) throw Error("Invalid mechanism filter");
  const base = new URL(context.siteUrl);
  if (base.protocol !== "https:" || base.username || base.password) throw Error("Invalid canonical site URL");
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (kind !== "all") params.set("kind", kind);
  if (actor !== "all") params.set("actor", actor);
  if (mechanism !== "all") params.set("mechanism", mechanism);
  const searchPath = "/search" + (params.size ? "?" + params.toString() : "");
  const identities = new Set<string>();
  const records = results.map(doc => {
    const identity = doc.kind + ":" + doc.id;
    if (identities.has(identity)) throw Error("Duplicate search reference " + identity);
    identities.add(identity);
    if (!doc.href.startsWith("/") || doc.href.startsWith("//") || doc.href.includes("\\")) throw Error("Invalid record path");
    const url = new URL(doc.href, base);
    if (url.origin !== base.origin) throw Error("Record link leaves the canonical site");
    // Deliberately omit the internal haystack and the index's mixed-semantics date.
    return {kind: doc.kind, id: doc.id, title: doc.title, context: doc.subtitle, recordUrl: url.href};
  });
  return {
    format: "smpt-search-references", version: 1,
    corpusRevision: context.corpusRevision, scopeStart: context.scopeStart,
    notice: SEARCH_REFERENCE_NOTICE,
    search: {query: query.trim(), kind, actor, mechanism, path: searchPath, url: new URL(searchPath, base).href},
    recordCount: records.length, records,
  };
}
export type SearchReferences = ReturnType<typeof buildSearchReferences>;

/** Always quote CSV fields; neutralize formula-leading text for spreadsheet use.
 * JSON retains the original text exactly. This does not alter existing /data exports.
 */
function cell(value: string): string {
  const safe = /^[\t\r\n]/.test(value) || /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}
export function searchReferencesCsv(list: SearchReferences): string {
  const headers = ["corpusRevision", "searchPath", "kind", "id", "title", "context", "recordUrl"];
  const rows = list.records.map(record => [
    list.corpusRevision, list.search.path, record.kind, record.id,
    record.title, record.context, record.recordUrl,
  ]);
  return [headers, ...rows].map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
