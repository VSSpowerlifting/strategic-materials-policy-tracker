/**
 * Search index over the whole corpus.
 *
 * Built at module load from the seed and shipped to the client, which is
 * affordable precisely because the corpus is bounded (see the scope rule in
 * CLAUDE.md) — hundreds of records rather than millions. That keeps search
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
  getAllOrganizations,
  getAllProgrammes,
  getAllProjects,
  getAllProjectMilestones,
  getAllSources,
  getAllWatchedSources,
  getProgrammeById,
  getProjectById,
} from "./data";
import {
  controlMeasureTypeLabels,
  controlStatusLabels,
  financialInstrumentLabels,
  jurisdictionLabels,
  mechanismLabels,
  organizationKindLabels,
  policyStatusLabels,
  programmeKindLabels,
  supplyChainStageLabels,
  valueRoleLabels,
} from "./labels";
import { commitmentActor, controlIssuer, currentControlStatus, currentFinancialStatus } from "./capital-control";
import { formatMoney } from "./decimal";

import type { JurisdictionCode } from "./types";
import { normalize } from "./search-core";
import type { SearchDoc } from "./search-core";
export { SEARCH_KINDS, normalize, searchDocs } from "./search-core";
export type { SearchDoc, SearchKind } from "./search-core";

const join = (...parts: (string | null | undefined)[]) => normalize(parts.filter(Boolean).join(" "));

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  // Entity names are indexed ONLY when a record declares the exact canonical
  // organization ID. Searching a name does not infer finance, ownership or
  // government affiliation. Unresolved links are corrupt registry references.
  const organizations = getAllOrganizations();
  const organizationById = new Map(organizations.map((o) => [o.id, o]));
  if (organizationById.size !== organizations.length)
    throw new Error("Duplicate organization in search index");
  const linkedOrganizations = (ids: readonly string[], recordId: string) =>
    ids.map((id) => {
      const org = organizationById.get(id);
      if (!org) throw new Error("Unresolved organization " + id + " in search record " + recordId);
      return org;
    });
  const organizationTerms = (ids: readonly string[], recordId: string) =>
    linkedOrganizations(ids, recordId)
      .flatMap((o) => [o.name, o.nameOriginal ?? "", ...o.aliases]).join(" ");

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
      subtitle: `${actor ? jurisdictionLabels[actor] : "No tracked government"} · ${valueRoleLabels[c.valueRole]}${c.amount ? ` · ${c.amount.qualifier === "exact" ? "" : `${c.amount.qualifier.replace("_", " ")} `}${formatMoney(c.amount.value, c.amount.currency)}` : ""}`,
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
        c.programmeId ? getProgrammeById(c.programmeId)?.name : null,
        c.projectId ? getProjectById(c.projectId)?.name : null,
        (c.associatedProjectIds ?? []).map((id) => getProjectById(id)?.name).filter(Boolean).join(" "),
        // Explicit canonical provider/recipient links; not inferred from free text.
        organizationTerms([...c.providerOrgIds, ...c.recipientOrgIds], c.id),
      ),
    });
  }

  // v0.6 registries: only source-linked sponsor IDs supply names/aliases.
  for (const p of getAllProjects()) {
    const sponsors = linkedOrganizations(p.sponsorOrgIds, p.id);
    // Native claims are discoverable through their real investigation, without
    // creating another entity kind, inferred relationship or nonexistent route.
    const milestones = getAllProjectMilestones().filter(m => m.projectId === p.id);
    const sponsorLabel = sponsors.map(o => o.name).join(", ");
    docs.push({
      id: p.id,
      kind: "project",
      title: p.name,
      subtitle: `Project · ${[...p.locations.map((l) => l.asStated ?? l.countryCode), ...p.stages.map((s) => supplyChainStageLabels[s])].filter(Boolean).join(" · ")}${sponsors.length ? ` · Registered sponsor: ${sponsorLabel}` : ""}`,
      href: `/projects/${p.id}${milestones.length ? "#project-industrial" : ""}`,
      date: null,
      jurisdiction: null,
      mechanisms: null,
      haystack: join(
        p.id,
        p.name,
        p.notes,
        p.locations.map((l) => [l.asStated, l.subnational, l.countryCode].join(" ")).join(" "),
        p.materialIds.join(" "),
        p.untrackedMaterialsAsStated.join(" "),
        p.sponsorOrgIds.join(" "),
        organizationTerms(p.sponsorOrgIds, p.id),
        milestones.map(m => [m.id, m.kind.replaceAll("_", " "), m.scopeAsStated, m.statementOriginal, m.statementEn, m.note].filter(Boolean).join(" ")).join(" "),
      ),
    });
  }

  for (const o of organizations) {
    docs.push({
      id: o.id,
      kind: "organization",
      title: o.name,
      subtitle: `${organizationKindLabels[o.kind]}${o.actor ? ` · ${jurisdictionLabels[o.actor]}` : o.countryCode ? ` · ${o.countryCode}` : ""}`,
      href: `/organizations/${o.id}`,
      date: null,
      jurisdiction: o.actor,
      mechanisms: null,
      // The original-language name is indexed unnormalised too, so a search in its own script matches.
      haystack: join(o.id, o.name, o.nameOriginal, o.aliases.join(" "), o.notes, organizationKindLabels[o.kind]) + " " + (o.nameOriginal ?? ""),
    });
  }

  for (const g of getAllProgrammes()) {
    const administrators = linkedOrganizations(g.administeringOrgIds, g.id);
    docs.push({
      id: g.id,
      kind: "programme",
      title: g.name,
      subtitle: `Programme · ${jurisdictionLabels[g.actor]} · ${programmeKindLabels[g.kind]}${administrators.length ? ` · Registered administrator: ${administrators.map(o => o.name).join(", ")}` : ""}`,
      href: `/programmes/${g.id}`,
      date: null,
      jurisdiction: g.actor,
      mechanisms: null,
      haystack: join(g.id, g.name, g.nameOriginal, g.legalAuthorityAsStated, g.notes,
        programmeKindLabels[g.kind], organizationTerms(g.administeringOrgIds, g.id)),
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
      href: `/sources/${s.id}`,
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

