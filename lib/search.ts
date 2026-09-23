/**
 * Search index over the whole corpus.
 *
 * Built at module load from the seed and shipped to the client, which is
 * affordable precisely because the corpus is bounded (see the scope rule in
 * CLAUDE.md) — a few dozen records, not a few million. That keeps search
 * dependency-free and, more importantly, keeps every result derived from the
 * same loaders the pages use, so search can never surface something the rest of
 * the site would not.
 *
 * Matching is substring, case- and diacritic-insensitive, over a per-record
 * haystack. It deliberately does NOT stem or fuzzy-match: this is a legal and
 * policy corpus where "No. 61" and "No. 62" are different instruments, and a
 * near-miss is worse than no match. CJK text is indexed verbatim so that a
 * Chinese or Japanese title can be searched in its own script.
 */
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getAllFramingClaims,
  getAllJurisdictions,
  getAllMaterials,
  getAllSources,
  getAllWatchedSources,
} from "./data";
import {
  controlMeasureTypeLabels,
  controlStatusLabels,
  financialInstrumentLabels,
  jurisdictionLabels,
  mechanismLabels,
  policyStatusLabels,
  valueRoleLabels,
} from "./labels";
import { commitmentActor, controlIssuer, currentControlStatus, currentFinancialStatus } from "./capital-control";
import { formatMoney } from "./decimal";
import type { JurisdictionCode, Mechanism } from "./types";

export const SEARCH_KINDS = ["event", "capital", "control", "material", "actor", "framing", "source", "watched"] as const;
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

const join = (...parts: (string | null | undefined)[]) => normalize(parts.filter(Boolean).join(" "));

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const e of getAllEvents()) {
    docs.push({
      id: e.id,
      kind: "event",
      title: e.titleEn,
      subtitle: `${jurisdictionLabels[e.jurisdiction]} · ${e.date} · ${e.mechanism.map((m) => mechanismLabels[m]).join(", ")}`,
      href: `/events/${e.id}`,
      date: e.date,
      jurisdiction: e.jurisdiction,
      mechanisms: e.mechanism,
      haystack: join(
        e.id,
        e.titleEn,
        e.titleOriginal,
        e.documentNumber,
        e.issuingBody,
        e.summary,
        e.analyticalSignificance,
        jurisdictionLabels[e.jurisdiction],
        policyStatusLabels[e.policyStatus],
        e.mechanism.map((m) => mechanismLabels[m]).join(" "),
        e.affectedMaterialIds.join(" "),
      ),
    });
  }

  // Capital & Control rows: indexed with their amounts as stated, parties,
  // clauses, targets and source wording, so a document number, a company or
  // a customs code finds the row itself, not only its event.
  for (const c of getAllFinancialCommitments()) {
    const actor = commitmentActor(c);
    docs.push({
      id: c.id,
      kind: "capital",
      title: `${financialInstrumentLabels[c.instrument]} · ${c.recipient ?? c.provider ?? c.id}`,
      subtitle: `${jurisdictionLabels[actor]} · ${valueRoleLabels[c.valueRole]}${c.amount ? ` · ${c.amount.qualifier === "exact" ? "" : `${c.amount.qualifier.replace("_", " ")} `}${formatMoney(c.amount.value, c.amount.currency)}` : ""}`,
      href: `/capital/${c.id}`,
      date: c.financialStatusHistory.find((e) => e.date)?.date ?? null,
      jurisdiction: actor,
      mechanisms: null,
      haystack: join(
        c.id,
        c.provider,
        c.recipient,
        c.project,
        c.facility,
        c.legalAuthority,
        c.amount?.amountAsStated,
        c.amount?.currency,
        c.notes,
        financialInstrumentLabels[c.instrument],
        valueRoleLabels[c.valueRole],
        currentFinancialStatus(c),
        c.materialIds.join(" "),
        c.untrackedMaterialsAsStated.join(" "),
        c.terms.map((x) => x.asStated).join(" "),
        c.locations.map((l) => l.asStated).join(" "),
      ),
    });
  }

  for (const m of getAllControlMeasures()) {
    const issuer = controlIssuer(m);
    docs.push({
      id: m.id,
      kind: "control",
      title: `${controlMeasureTypeLabels[m.measureType]}${m.clause ? ` · ${m.clause}` : ""}`,
      subtitle: `${jurisdictionLabels[issuer]} · ${controlStatusLabels[currentControlStatus(m)]}`,
      href: `/controls/${m.id}`,
      date: m.statusHistory.find((e) => e.date)?.date ?? null,
      jurisdiction: issuer,
      mechanisms: null,
      haystack:
        join(
          m.id,
          m.clause,
          m.notes,
          m.legalBasisAsStated,
          controlMeasureTypeLabels[m.measureType],
          m.targetEntities.join(" "),
          m.targetJurisdictions.join(" "),
          m.targetEndUsersAsStated.join(" "),
          m.targetEndUsesAsStated.join(" "),
          m.materialIds.join(" "),
          m.untrackedMaterialsAsStated.join(" "),
          m.productCodes.map((p) => p.code).join(" "),
          m.modifiesExternalInstruments.join(" "),
        ) +
        " " +
        (m.productScopeAsStated ?? ""),
    });
  }

  for (const m of getAllMaterials()) {
    docs.push({
      id: m.id,
      kind: "material",
      title: m.nameEn,
      subtitle: m.grouping ? `Material · ${m.grouping}` : "Material",
      href: `/materials/${m.slug}`,
      date: null,
      jurisdiction: null,
      mechanisms: null,
      haystack: join(
        m.id,
        m.nameEn,
        m.nameZh,
        m.grouping,
        m.statusSummary,
        m.chinaPositionNote,
        m.diversificationNote,
        m.downstreamIndustries.join(" "),
      ),
    });
  }

  for (const j of getAllJurisdictions()) {
    docs.push({
      id: j.id,
      kind: "actor",
      title: j.name,
      subtitle: "Actor profile",
      href: `/actors/${j.code.toLowerCase()}`,
      date: null,
      jurisdiction: j.id as JurisdictionCode,
      mechanisms: null,
      haystack: join(
        j.id,
        j.name,
        j.code,
        j.supplyChainPosition,
        j.framingPosture,
        j.keyBodies.join(" "),
        j.roles.join(" "),
      ),
    });
  }

  for (const f of getAllFramingClaims()) {
    docs.push({
      id: f.id,
      kind: "framing",
      title: f.quoteEn,
      subtitle: `Framing · ${jurisdictionLabels[f.actor]} · ${f.category.join(", ")}`,
      href: `/events/${f.eventId}#${f.id}`,
      date: null,
      jurisdiction: f.actor,
      mechanisms: null,
      // The original-language quote is indexed unnormalised as well, so a
      // search in Chinese or Japanese script matches.
      haystack: join(f.id, f.quoteEn, f.quoteOriginal, f.notes, f.category.join(" ")) + " " + f.quoteOriginal,
    });
  }

  for (const s of getAllSources()) {
    docs.push({
      id: s.id,
      kind: "source",
      title: s.title,
      subtitle: `Source · ${s.publisher}`,
      href: `/sources#${s.id}`,
      date: s.datePublished ?? null,
      jurisdiction: null,
      mechanisms: null,
      haystack: join(s.id, s.title, s.publisher, s.url, s.notes) + " " + s.title,
    });
  }

  for (const w of getAllWatchedSources()) {
    docs.push({
      id: w.id,
      kind: "watched",
      title: w.title,
      subtitle: `Watchlist · ${w.issuingBody}`,
      href: `/watchlist#${w.id}`,
      date: null,
      jurisdiction: w.jurisdiction,
      mechanisms: w.mechanisms,
      haystack:
        join(w.id, w.title, w.issuingBody, w.issuingBodyOriginal, w.url, w.notes) +
        " " +
        (w.issuingBodyOriginal ?? ""),
    });
  }

  return docs;
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
