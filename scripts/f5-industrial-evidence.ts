/**
 * F5-1 — fail-closed audit of the unsigned industrial evidence sidecar for the
 * four M3 pilots (research/f5/industrial-evidence-pilot-chronology.json).
 *
 * Read only. It reconciles every case with the live M3 queue row and worksheet
 * digest, every registered lead with the source registry, and every date with
 * its evidence boundary. It records no review, approval or milestone, writes no
 * file and never authorizes publication.
 */
import type { FinancialCommitment, Project, Source } from "../lib/types";
import { isMilestoneIsoDate } from "../lib/project-milestones";
import { buildM3ReviewerPackets } from "./project-execution-review-packets";

export const F5_INDUSTRIAL_EVIDENCE_SCHEMA = "f5-1-industrial-evidence-pilot-chronology-v1";
export const F5_PILOT_REVIEW_IDS = [
  "review-m3-2-alcoa-wagerup",
  "review-m3-2-neo-narva-magnets",
  "review-m3-2-stibnite-burntlog",
  "review-m3-2-stibnite-early-works",
] as const;
export const DISPOSITION_LABELS = [
  "Resolved and source-supported",
  "Conditionally supportable with a specified caveat",
  "Awaiting human review",
  "Taxonomy blocked",
  "Missing original documentation",
  "Contradicted or unsupported",
] as const;
const ASSERTION_TYPES = ["event", "state", "target", "aspiration"] as const;
const FORWARD_LOOKING = new Set(["target", "aspiration"]);
/** Dispositions that would rest a finding on the lead's content. */
const SUPPORTING = new Set([
  "Resolved and source-supported",
  "Conditionally supportable with a specified caveat",
  "Contradicted or unsupported",
]);
/** Keys that would turn research into a signature, a verdict or a money figure. */
const FORBIDDEN_KEYS = new Set([
  "reviewedBy", "reviewedAt", "reviewer", "reviewers", "verdict", "approved", "approval",
  "approvedBy", "signature", "signedBy", "attestation", "amount", "amountAsStated", "currency",
]);
const MAX_QUOTE_WORDS = 15;

type Refs = {
  queue: unknown;
  projects: readonly Project[];
  sources: readonly Source[];
  commitments: readonly FinancialCommitment[];
  corpusCutoff: string;
  publicMilestoneCount: number;
};

export type F5IndustrialEvidenceReport = {
  errors: string[];
  markdown: string | null;
  publicationAuthorized: false;
  cases: number;
  taxonomyBlocked: number;
};

type QueueRow = {
  id: string; projectId: string; sourceId: string; kindProposal: string; scopeProposal: string;
  scopeAsStated: string | null; claimMode: string; occurredOn: string | null; gate: string;
  relatedFinanceIds: string[];
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const nonblank = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const sameList = (a: unknown, b: readonly string[]) =>
  Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
/** A financing note may name rows but never restate a money figure. */
const MONEY = /[$€£¥]|\b\d[\d,.]*\s*(?:million|billion|bn|m)\b|\b(?:USD|EUR|AUD|CAD|JPY|GBP)\b/i;

/** NFKC, trim, collapse internal whitespace, lowercase. */
export function canonicalReviewerKey(name: string): string {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Groups of distinct spellings that share one canonical identity. Any group
 * means one person could be counted as two independent reviewers.
 */
export function findDuplicateReviewerIdentities(names: readonly string[]):
  { key: string; variants: string[] }[] {
  const byKey = new Map<string, Set<string>>();
  for (const n of names) {
    const key = canonicalReviewerKey(n);
    byKey.set(key, (byKey.get(key) ?? new Set()).add(n));
  }
  return [...byKey.entries()]
    .filter(([, v]) => v.size > 1)
    .map(([key, v]) => ({ key, variants: [...v].sort() }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

const SYNTHETIC_REVIEWER = /\b(?:claude|gpt|chatgpt|llm|ai|bot|assistant|automated|automation|agent|system|copilot|codex|model|script|ci|synthetic|placeholder|example|dummy|fake)\b/i;

/**
 * Audit the reviewer names on a set of adjudication decisions. Pending rows are
 * skipped (the adjudicator separately refuses a pending row presented as done).
 * A completed decision needs a human name that is not a machine or placeholder,
 * and one person must not appear under two spellings.
 */
export function auditReviewerIdentities(decisions: unknown): string[] {
  if (!Array.isArray(decisions)) return ["reviewer roster: decisions must be an array"];
  const errors: string[] = [];
  const names: string[] = [];
  for (const d of decisions) {
    if (!isRecord(d) || d.verdict === "pending") continue;
    const id = typeof d.id === "string" ? d.id : "(unknown)";
    if (!nonblank(d.reviewedBy)) {
      errors.push(`${id}: completed decision has no named human reviewer`);
      continue;
    }
    if (SYNTHETIC_REVIEWER.test(d.reviewedBy) || /^(?:reviewer|test|tbd|todo|n\/?a|unknown)\b/i.test(d.reviewedBy.trim()))
      errors.push(`${id}: reviewer "${d.reviewedBy}" is synthetic or a placeholder, not a human identity`);
    names.push(d.reviewedBy);
  }
  for (const g of findDuplicateReviewerIdentities(names))
    errors.push(`reviewer identity "${g.key}" appears under ${g.variants.length} spellings: ${g.variants.map((v) => JSON.stringify(v)).join(", ")}`);
  return errors;
}

function scanForbiddenKeys(v: unknown, path: string, out: string[]) {
  if (Array.isArray(v)) v.forEach((x, i) => scanForbiddenKeys(x, `${path}[${i}]`, out));
  else if (isRecord(v))
    for (const [k, x] of Object.entries(v)) {
      if (FORBIDDEN_KEYS.has(k)) out.push(`${path}.${k}: sidecar must not carry review, approval or amount fields`);
      scanForbiddenKeys(x, `${path}.${k}`, out);
    }
}

function validUrl(u: unknown): boolean {
  if (typeof u !== "string") return false;
  try {
    const p = new URL(u);
    return p.protocol === "https:" && !!p.hostname && !p.username && !p.password;
  } catch { return false; }
}

export function buildF5IndustrialEvidence(packet: unknown, refs: Refs): F5IndustrialEvidenceReport {
  const fail = (errors: string[]): F5IndustrialEvidenceReport =>
    ({ errors, markdown: null, publicationAuthorized: false, cases: 0, taxonomyBlocked: 0 });
  const errors: string[] = [];
  if (!isRecord(packet)) return fail(["sidecar must be an object"]);

  let worksheets;
  try {
    worksheets = buildM3ReviewerPackets(refs.queue, {
      projects: refs.projects, sources: refs.sources, commitments: refs.commitments,
      corpusCutoff: refs.corpusCutoff, publicMilestoneCount: refs.publicMilestoneCount,
    }).worksheets;
  } catch (e) {
    return fail([(e as Error).message]);
  }
  if (refs.publicMilestoneCount !== 0)
    errors.push("public milestones exist; this unsigned research must not coexist with published pilot milestones");

  if (packet.schemaVersion !== F5_INDUSTRIAL_EVIDENCE_SCHEMA) errors.push("unexpected schemaVersion");
  if (packet.authority !== "public_evidence_navigation_only") errors.push("authority must be public_evidence_navigation_only");
  for (const flag of ["humanReceiptsPresent", "originalBodiesAuthenticatedByHuman", "publicationAuthorized"] as const)
    if (packet[flag] !== false) errors.push(`${flag} must be false`);
  if (packet.corpusCutoff !== refs.corpusCutoff)
    errors.push(`corpusCutoff ${String(packet.corpusCutoff)} does not match site.lastUpdated ${refs.corpusCutoff}`);
  const researchedOn = packet.researchedOn;
  if (!isMilestoneIsoDate(researchedOn)) errors.push("researchedOn must be a real ISO date");
  else if (researchedOn <= refs.corpusCutoff) errors.push("researchedOn must postdate the corpus cutoff it reports against");
  if (!sameList(packet.dispositionLabels, DISPOSITION_LABELS)) errors.push("dispositionLabels must be exactly the six F5-1 labels");
  scanForbiddenKeys(packet, "$", errors);

  const queueRows = new Map((refs.queue as QueueRow[]).map((r) => [r.id, r]));
  const sheetMap = new Map(worksheets.map((w) => [w.id, w]));
  const sourceMap = new Map(refs.sources.map((s) => [s.id, s]));
  const financeIds = new Set(refs.commitments.map((c) => c.id));
  const leadIndex = new Map<string, { reviewId: string; assertionType: string }>();

  const cases = Array.isArray(packet.cases) ? packet.cases : [];
  if (!Array.isArray(packet.cases)) errors.push("cases must be an array");
  if (!sameList(cases.map((c) => (isRecord(c) ? c.reviewId : null)), F5_PILOT_REVIEW_IDS))
    errors.push("cases must be exactly the four pilots in review-ID order");

  let taxonomyBlocked = 0;
  for (const c of cases) {
    if (!isRecord(c) || typeof c.reviewId !== "string") { errors.push("malformed case"); continue; }
    const at = c.reviewId;
    const row = queueRows.get(at);
    const sheet = sheetMap.get(at);
    if (!row || !sheet) { errors.push(`${at}: not in the M3 review queue`); continue; }
    const m3 = isRecord(c.m3) ? c.m3 : {};
    if (c.projectId !== row.projectId) errors.push(`${at}: projectId differs from the queue row`);
    if (c.canonicalSourceId !== row.sourceId) errors.push(`${at}: canonicalSourceId differs from the queue sourceId`);
    const expected: [string, unknown][] = [
      ["kind", row.kindProposal], ["scope", row.scopeProposal], ["scopeAsStated", row.scopeAsStated],
      ["claimMode", row.claimMode], ["occurredOn", row.occurredOn], ["gate", row.gate],
    ];
    for (const [k, v] of expected) if (m3[k] !== v) errors.push(`${at}: m3.${k} differs from the queue row`);
    if (m3.reviewInputDigestSha256 !== sheet.reviewInputDigestSha256)
      errors.push(`${at}: worksheet digest is stale or invented; it must equal the live M3 worksheet digest`);
    if (!sameList(c.financeRefs, row.relatedFinanceIds)) errors.push(`${at}: financeRefs must equal the queue relatedFinanceIds`);
    for (const f of Array.isArray(c.financeRefs) ? c.financeRefs : [])
      if (!financeIds.has(f as string)) errors.push(`${at}: finance ref ${String(f)} does not resolve`);
    if (!nonblank(c.financeNote) || MONEY.test(c.financeNote))
      errors.push(`${at}: financeNote must be present and carry no money figure`);
    if (!nonblank(c.adjudicationQuestion)) errors.push(`${at}: adjudicationQuestion required`);

    const disp = c.disposition;
    if (typeof disp !== "string" || !(DISPOSITION_LABELS as readonly string[]).includes(disp))
      errors.push(`${at}: disposition not in the six labels`);
    else if (disp === "Resolved and source-supported")
      errors.push(`${at}: an unreviewed case cannot be Resolved; that label belongs to discrepancies only`);
    if (row.gate === "taxonomy_blocked") {
      taxonomyBlocked++;
      if (disp !== "Taxonomy blocked") errors.push(`${at}: a taxonomy_blocked gate requires disposition Taxonomy blocked`);
    } else if (disp === "Taxonomy blocked") errors.push(`${at}: Taxonomy blocked disposition without a taxonomy gate`);
    if (disp === "Conditionally supportable with a specified caveat" && !nonblank(c.dispositionCaveat))
      errors.push(`${at}: conditional disposition needs its caveat`);

    const leads = Array.isArray(c.leads) ? c.leads : [];
    const keys = new Map<string, Record<string, unknown>>();
    let canonical: Record<string, unknown> | null = null;
    for (const l of leads) {
      if (!isRecord(l) || !nonblank(l.key)) { errors.push(`${at}: malformed lead`); continue; }
      const lk = `${at}/${l.key}`;
      if (keys.has(l.key)) errors.push(`${lk}: duplicate lead key`);
      keys.set(l.key, l);
      leadIndex.set(l.key, { reviewId: at, assertionType: String(l.assertionType) });
      for (const f of ["publisher", "title", "locator", "finding", "limitation", "dateMeaning", "timeAsStated", "role"] as const)
        if (!nonblank(l[f])) errors.push(`${lk}: ${f} required (missing provenance)`);
      if (!validUrl(l.url)) errors.push(`${lk}: url must be an https original-source link`);
      if (!(ASSERTION_TYPES as readonly string[]).includes(String(l.assertionType)))
        errors.push(`${lk}: assertionType must be event, state, target or aspiration`);
      if (!["na", "official", "self"].includes(String(l.translation))) errors.push(`${lk}: translation provenance missing`);
      // An issuer's own English edition is "official"; only a non-English original needs a translation.
      if (l.language !== "en" && l.translation === "na") errors.push(`${lk}: a non-English original needs translation provenance`);
      if (l.language === "en" && l.translation === "self") errors.push(`${lk}: an English text cannot carry a self translation`);
      if (l.quote !== null && (!nonblank(l.quote) || words(l.quote) > MAX_QUOTE_WORDS))
        errors.push(`${lk}: quote must be null or at most ${MAX_QUOTE_WORDS} words`);

      // Dates: publication (when known) <= access <= research day.
      const pub = l.publishedOn, acc = l.accessedOn;
      if (pub !== null && !isMilestoneIsoDate(pub)) errors.push(`${lk}: publishedOn must be a real ISO date or null`);
      if (!isMilestoneIsoDate(acc)) errors.push(`${lk}: accessedOn must be a real ISO date`);
      else {
        if (isMilestoneIsoDate(pub) && acc < pub) errors.push(`${lk}: accessedOn precedes publishedOn`);
        if (isMilestoneIsoDate(researchedOn) && acc > researchedOn) errors.push(`${lk}: accessedOn postdates researchedOn`);
      }
      const boundary = isMilestoneIsoDate(pub) ? pub : isMilestoneIsoDate(acc) ? acc : null;
      if (l.assertionType === "event" && isMilestoneIsoDate(l.timeAsStated) && boundary && l.timeAsStated > boundary)
        errors.push(`${lk}: event day postdates its own evidence boundary`);
      const postCutoff = boundary !== null && boundary > refs.corpusCutoff;
      if (postCutoff && l.quote !== null) errors.push(`${lk}: a post-cutoff lead cannot carry a quote`);

      // Registered leads must match the registry exactly.
      if (l.registeredSourceId !== null) {
        const s = sourceMap.get(String(l.registeredSourceId));
        if (!s) errors.push(`${lk}: registeredSourceId does not resolve`);
        else {
          const pairs: [string, unknown, unknown][] = [
            ["url", l.url, s.url], ["publisher", l.publisher, s.publisher], ["title", l.title, s.title],
            ["language", l.language, s.language], ["publishedOn", l.publishedOn, s.datePublished ?? null],
            ["accessedOn", l.accessedOn, s.dateAccessed],
          ];
          for (const [k, a, b] of pairs) if (a !== b) errors.push(`${lk}: ${k} contradicts the registered source`);
        }
        if (l.registeredSourceId === c.canonicalSourceId && l.role === "original_issuer_statement" && !canonical) canonical = l;
      }
    }
    if (!canonical) errors.push(`${at}: no lead carries the canonical source`);
    else {
      if (FORWARD_LOOKING.has(String(canonical.assertionType)) && m3.claimMode === "occurred")
        errors.push(`${at}: a target or aspiration cannot back an occurred claim`);
      if (canonical.assertionType === "state" && m3.occurredOn !== null)
        errors.push(`${at}: an issuer-reported state has no known start day; occurredOn must stay null`);
      if (isMilestoneIsoDate(m3.occurredOn)) {
        const s = sourceMap.get(row.sourceId);
        const b = s && (isMilestoneIsoDate(s.datePublished) ? s.datePublished : s.dateAccessed);
        if (b && m3.occurredOn > b) errors.push(`${at}: occurredOn postdates the canonical source boundary`);
        if (m3.occurredOn > refs.corpusCutoff) errors.push(`${at}: occurredOn postdates the corpus cutoff`);
      }
    }

    for (const d of Array.isArray(c.discrepancies) ? c.discrepancies : []) {
      if (!isRecord(d) || !nonblank(d.topic)) { errors.push(`${at}: malformed discrepancy`); continue; }
      const dk = `${at}/"${d.topic}"`;
      if (!(DISPOSITION_LABELS as readonly string[]).includes(String(d.disposition)))
        errors.push(`${dk}: disposition not in the six labels`);
      if (!nonblank(d.justification)) errors.push(`${dk}: justification required`);
      const lks = Array.isArray(d.leadKeys) ? d.leadKeys as string[] : [];
      if (!lks.length) errors.push(`${dk}: needs at least one lead`);
      const resolved = lks.map((k) => keys.get(k));
      if (resolved.some((x) => !x)) errors.push(`${dk}: leadKey does not resolve within the case`);
      const usable = resolved.filter((x): x is Record<string, unknown> => !!x).filter((x) => {
        const b = isMilestoneIsoDate(x.publishedOn) ? x.publishedOn : x.accessedOn;
        return typeof b === "string" && b <= refs.corpusCutoff;
      });
      if (SUPPORTING.has(String(d.disposition)) && resolved.length && !usable.length)
        errors.push(`${dk}: a finding cannot rest only on post-cutoff leads`);
    }
  }

  // Seven-part Stibnite chronology.
  const parts = Array.isArray(packet.stibniteChronology) ? packet.stibniteChronology : [];
  if (!sameList(parts.map((p) => (isRecord(p) ? String(p.part) : "")), ["1", "2", "3", "4", "5", "6", "7"]))
    errors.push("stibniteChronology must be parts 1-7 in order");
  const stibnite = new Set(["review-m3-2-stibnite-early-works", "review-m3-2-stibnite-burntlog"]);
  const mapped = new Set<string>();
  for (const p of parts) {
    if (!isRecord(p)) continue;
    const pk = `chronology part ${String(p.part)}`;
    for (const f of ["label", "timeAsStated", "finding", "limitation"] as const)
      if (!nonblank(p[f])) errors.push(`${pk}: ${f} required`);
    if (!(ASSERTION_TYPES as readonly string[]).includes(String(p.assertionType))) errors.push(`${pk}: bad assertionType`);
    const lks = Array.isArray(p.leadKeys) ? p.leadKeys as string[] : [];
    if (!lks.length) errors.push(`${pk}: needs a lead`);
    for (const k of lks) {
      const hit = leadIndex.get(k);
      if (!hit || !stibnite.has(hit.reviewId)) errors.push(`${pk}: lead ${k} is not a Stibnite lead`);
    }
    if (p.mapsToReviewId !== null) {
      if (!stibnite.has(String(p.mapsToReviewId))) errors.push(`${pk}: mapsToReviewId must be a Stibnite review or null`);
      if (mapped.has(String(p.mapsToReviewId))) errors.push(`${pk}: two parts map to one review`);
      mapped.add(String(p.mapsToReviewId));
      if (FORWARD_LOOKING.has(String(p.assertionType)) || lks.some((k) => FORWARD_LOOKING.has(leadIndex.get(k)?.assertionType ?? "")))
        errors.push(`${pk}: a planned target can never map to an occurred M3 observation`);
      const row = queueRows.get(String(p.mapsToReviewId));
      if (row && p.timeAsStated !== row.occurredOn) errors.push(`${pk}: timeAsStated differs from the mapped occurredOn`);
    }
  }
  if (mapped.size !== stibnite.size) errors.push("each Stibnite review must map to exactly one chronology part");
  const decisions = Array.isArray(packet.smallestHumanDecisionSet) ? packet.smallestHumanDecisionSet : [];
  if (!decisions.length || !decisions.every(nonblank)) errors.push("smallestHumanDecisionSet must list the human decisions");

  if (errors.length) return fail(errors);
  return {
    errors: [], publicationAuthorized: false, cases: cases.length, taxonomyBlocked,
    markdown: render(packet, cases as Record<string, unknown>[], parts as Record<string, unknown>[], decisions as string[]),
  };
}

const cell = (v: unknown) => (v === null || v === undefined ? "—" : String(v).replace(/\|/g, "\\|"));

function render(packet: Record<string, unknown>, cases: Record<string, unknown>[],
  parts: Record<string, unknown>[], decisions: string[]): string {
  const out: string[] = [
    "# F5-1 industrial evidence: UNSIGNED RESEARCH",
    "",
    `Researched ${cell(packet.researchedOn)} against corpus cutoff ${cell(packet.corpusCutoff)}. ` +
      "No human review, approval or milestone is recorded. Publication is NOT AUTHORIZED.",
    "",
    "| Review | Project | Proposal | Gate | Worksheet digest | Disposition |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const c of cases) {
    const m3 = c.m3 as Record<string, unknown>;
    out.push(`| ${cell(c.reviewId)} | ${cell(c.projectId)} | ${cell(m3.kind)} / ${cell(m3.scope)} / ${cell(m3.claimMode)} ${cell(m3.occurredOn)} | ${cell(m3.gate)} | \`${cell(m3.reviewInputDigestSha256)}\` | ${cell(c.disposition)} |`);
  }
  for (const c of cases) {
    out.push("", `## ${cell(c.reviewId)}`, "", `Question: ${cell(c.adjudicationQuestion)}`, "",
      `Finance (context only): ${(c.financeRefs as string[]).join(", ") || "none"}. ${cell(c.financeNote)}`, "",
      "| Lead | Type | Time as stated | Published / accessed | Registered | Quote |",
      "| --- | --- | --- | --- | --- | --- |");
    for (const l of c.leads as Record<string, unknown>[])
      out.push(`| ${cell(l.key)} | ${cell(l.assertionType)} | ${cell(l.timeAsStated)} | ${cell(l.publishedOn)} / ${cell(l.accessedOn)} | ${cell(l.registeredSourceId)} | ${l.quote === null ? "—" : `"${cell(l.quote)}"`} |`);
    out.push("", "| Discrepancy | Disposition |", "| --- | --- |");
    for (const d of c.discrepancies as Record<string, unknown>[])
      out.push(`| ${cell(d.topic)} | ${cell(d.disposition)} |`);
  }
  out.push("", "## Stibnite chronology", "", "| Part | Label | Time as stated | Type | Maps to |", "| --- | --- | --- | --- | --- |");
  for (const p of parts)
    out.push(`| ${cell(p.part)} | ${cell(p.label)} | ${cell(p.timeAsStated)} | ${cell(p.assertionType)} | ${cell(p.mapsToReviewId)} |`);
  out.push("", "## Smallest human decision set", "", ...decisions.map((d, i) => `${i + 1}. ${d}`));
  return out.join("\n");
}
