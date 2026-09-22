/**
 * Citation builders — BibTeX, RIS and CSL-JSON.
 *
 * A source-linked database is only useful if what it cites can be cited back.
 * Two things are citable here and they are kept distinct:
 *
 *   - a **record** on this site (an event page), which is this project's
 *     analysis of an instrument, and
 *   - the **primary document** the record rests on, which belongs to the
 *     issuing government and should be cited directly in serious work.
 *
 * Conflating them would let this tracker be cited where the government's own
 * text is what a reader actually needs, so every event citation carries its
 * sources alongside, and the record citation names this project as the author
 * of the *record*, never of the instrument.
 *
 * Pure and deterministic (no wall-clock reads) so the route handlers can be
 * prerendered with `dynamic = "force-static"`. That means no "accessed today"
 * date is generated: an accessed date that changes on every build is not
 * reproducible, and each Source already carries the `dateAccessed` on which
 * the project actually read it.
 */
import { site } from "./site";
import { jurisdictionLabels } from "./labels";
import type { PolicyEvent, Source } from "./types";
import { getAllEvents, getSourcesByIds } from "./data";

const YEAR = (iso: string) => iso.slice(0, 4);

/** BibTeX keys must be ASCII and collision-free; event ids already are both. */
const citeKey = (event: PolicyEvent) => `smpt:${event.id}`;

/** Escape the characters that break a BibTeX field. */
function bibtexValue(s: string): string {
  return s.replace(/[\\{}]/g, "\\$&").replace(/[&%$#_]/g, "\\$&");
}

/**
 * A field value plus whether its braces are load-bearing. A corporate author
 * must reach BibTeX as `author = {{Some Organisation}}` — the inner braces are
 * what stop the style from splitting the name into "first" and "last" and
 * rendering it as "Tracker, Strategic Materials Policy". Escaping them would
 * be silently wrong in the output rather than loudly wrong here.
 */
type BibField = [key: string, value: string | null, literal?: boolean];

function bibtexEntry(type: string, key: string, fields: BibField[]): string {
  const body = fields
    .filter((f): f is [string, string, boolean?] => Boolean(f[1]))
    .map(([k, v, literal]) => `  ${k} = {${literal ? v : bibtexValue(v)}}`)
    .join(",\n");
  return `@${type}{${key},\n${body}\n}`;
}

/**
 * The event record as published here. `@misc` with an explicit `howpublished`
 * rather than `@online`, which older BibTeX styles do not define.
 */
export function eventToBibtex(event: PolicyEvent, sources: Source[]): string {
  const notes = [
    `Record of a policy instrument issued by ${event.issuingBody} (${jurisdictionLabels[event.jurisdiction]}).`,
    event.documentNumber ? `Document: ${event.documentNumber}.` : null,
    sources.length
      ? `Primary sources: ${sources.map((s) => s.url).join(" ")}`
      : null,
    "Cite the issuing government's own text for the instrument itself; cite this entry only for the record and its coding.",
  ]
    .filter(Boolean)
    .join(" ");

  return bibtexEntry("misc", citeKey(event), [
    ["title", event.titleEn],
    ["author", `{${bibtexValue(site.name)}}`, true],
    ["year", YEAR(event.date)],
    ["month", event.date.slice(5, 7)],
    ["howpublished", `${site.name}, record ${event.id}`],
    ["url", `${site.url}/events/${event.id}`],
    ["note", notes],
  ]);
}

/** RIS: `TY  - ` … `ER  - `, two-letter tags, CRLF line endings by convention. */
export function eventToRis(event: PolicyEvent, sources: Source[]): string {
  const rows: [string, string][] = [
    ["TY", "GEN"],
    ["TI", event.titleEn],
    ["AU", site.name],
    ["PY", YEAR(event.date)],
    ["DA", event.date.replace(/-/g, "/")],
    ["PB", site.name],
    ["UR", `${site.url}/events/${event.id}`],
    ["LA", "en"],
  ];
  if (event.titleOriginal && event.titleOriginal !== event.titleEn)
    rows.push(["ST", event.titleOriginal]);
  if (event.documentNumber) rows.push(["M1", event.documentNumber]);
  rows.push(["KW", jurisdictionLabels[event.jurisdiction]]);
  for (const m of event.mechanism) rows.push(["KW", m]);
  for (const s of sources) rows.push(["L2", s.url]);
  rows.push([
    "N1",
    "Record of a government policy instrument. Cite the issuing government's own text for the instrument itself.",
  ]);
  rows.push(["ER", ""]);
  return rows.map(([tag, value]) => `${tag}  - ${value}`).join("\r\n") + "\r\n";
}

/** CSL-JSON, the format Zotero / Pandoc consume. */
export function eventToCsl(event: PolicyEvent, sources: Source[]): Record<string, unknown> {
  const [y, m, d] = event.date.split("-").map(Number);
  return {
    id: citeKey(event),
    type: "document",
    title: event.titleEn,
    "original-title": event.titleOriginal !== event.titleEn ? event.titleOriginal : undefined,
    author: [{ literal: site.name }],
    publisher: site.name,
    URL: `${site.url}/events/${event.id}`,
    issued: { "date-parts": [[y, m, d]] },
    number: event.documentNumber ?? undefined,
    authority: event.issuingBody,
    jurisdiction: jurisdictionLabels[event.jurisdiction],
    note: sources.length
      ? `Primary sources: ${sources.map((s) => s.url).join(" ")}`
      : undefined,
  };
}

/** The primary document itself, cited in its own right. */
export function sourceToCsl(source: Source): Record<string, unknown> {
  const parts = source.datePublished?.split("-").map(Number);
  return {
    id: `smpt-src:${source.id}`,
    type: source.sourceType === "news" ? "article-newspaper" : "document",
    title: source.title,
    author: [{ literal: source.publisher }],
    publisher: source.publisher,
    URL: source.url,
    language: source.language,
    accessed: source.dateAccessed
      ? { "date-parts": [source.dateAccessed.split("-").map(Number)] }
      : undefined,
    issued: parts ? { "date-parts": [parts] } : undefined,
  };
}

function forEvent(event: PolicyEvent) {
  return getSourcesByIds(event.sourceIds);
}

export function buildBibtexForEvent(event: PolicyEvent): string {
  return eventToBibtex(event, forEvent(event)) + "\n";
}

export function buildRisForEvent(event: PolicyEvent): string {
  return eventToRis(event, forEvent(event));
}

export function buildCslForEvent(event: PolicyEvent): Record<string, unknown>[] {
  const sources = forEvent(event);
  return [eventToCsl(event, sources), ...sources.map(sourceToCsl)];
}

/** Whole-corpus exports, in the loaders' own (date-descending) order. */
export function buildBibtexAll(): string {
  return getAllEvents().map(buildBibtexForEvent).join("\n") + "\n";
}

export function buildRisAll(): string {
  return getAllEvents().map(buildRisForEvent).join("\r\n");
}

export function buildCslAll(): Record<string, unknown>[] {
  return getAllEvents().flatMap(buildCslForEvent);
}

/** A plain-text citation for the copy button on an event page. */
export function plainCitation(event: PolicyEvent): string {
  return `${site.name}. "${event.titleEn}." Record ${event.id}, ${event.date}. ${site.url}/events/${event.id}`;
}
