/**
 * Pure, browser-safe search contract and matcher.
 * Importing this module MUST NOT load the server-only seed graph.
 * Search terms are exact substrings; no fuzzy legal document numbers.
 */
import type { JurisdictionCode, Mechanism } from "./types";

export const SEARCH_KINDS = [
  "event",
  "capital",
  "control",
  "project",
  "organization",
  "programme",
  "material",
  "actor",
  "framing",
  "source",
  "watched",
] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export type SearchDoc = {
  id: string;
  kind: SearchKind;
  title: string;
  /** One line of context shown under the title. */
  subtitle: string;
  href: string;
  /** Pre-normalised concatenation of everything searchable in the record. */
  haystack: string;
  /** ISO date where the record has one, for stable ordering. */
  date: string | null;
  /** The actor this record is attributable to, where that is meaningful
   *  (an event's issuer, a framing claim's actor, an actor profile itself, a
   *  watched source's jurisdiction). Null for materials and sources, which
   *  are not tied to a single actor. Lets the search page filter by actor
   *  across record types without a separate index. */
  jurisdiction: JurisdictionCode | null;
  /** Mechanisms this record carries, where that is meaningful (events and
   *  watched sources). Null otherwise. */
  mechanisms: Mechanism[] | null;
};

/** Lowercase, strip diacritics, collapse whitespace. Leaves CJK untouched. */
export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * All terms must match (AND), each as a substring. Ranking is by where the
 * match lands — title beats body — then by date, newest first, so the same
 * query is stable across builds.
 */
export function searchDocs(docs: SearchDoc[], query: string): SearchDoc[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return [];
  const scored: { doc: SearchDoc; score: number }[] = [];
  for (const doc of docs) {
    const title = normalize(doc.title);
    let score = 0;
    let all = true;
    for (const t of terms) {
      if (title.includes(t)) score += 3;
      else if (doc.haystack.includes(t)) score += 1;
      else {
        all = false;
        break;
      }
    }
    if (all) scored.push({ doc, score });
  }
  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.doc.date ?? "").localeCompare(a.doc.date ?? "") ||
        a.doc.title.localeCompare(b.doc.title),
    )
    .map((s) => s.doc);
}
