/**
 * The capital-flow exhibit model: for one event, who provides what to whom, and what kind of
 * relationship each recorded row is. Pure and deterministic. "As of" is `site.lastUpdated`, the
 * same snapshot date lib/capital-control reads statuses against; nothing here reads the clock.
 *
 * The exhibit never totals money. Every figure is one row's own stated amount in its original
 * currency. A parent row (a package, a ceiling, an option) is an annotation on the rows linked to
 * it and is never drawn as further money beside them.
 */
import {
  getEventById,
  getFinancialCommitmentById,
  getFinancialCommitmentsByEvent,
  getOrganizationById,
  getProjectById,
  getSourceById,
} from "./data";
import {
  BINDING_FINANCIAL_STATUSES,
  evidenceSourceIds,
  financialStatusEntryOn,
  financialStatusEvidenceBoundary,
  optionState,
} from "./capital-control";
import { formatMoney, groupDecimal } from "./decimal";
import { formatDate, formatDateLong } from "./format";
import {
  capitalSourceLabels,
  financialInstrumentLabels,
  financialRelationshipTypeLabels,
  financialStatusLabels,
  organizationKindLabels,
  valueRoleLabels,
} from "./labels";
import { site } from "./site";
import type {
  CapitalSource,
  FinancialCommitment,
  FinancialInstrument,
  FinancialStatus,
  MonetaryAmount,
  TermKind,
  ValueQualifier,
  ValueRole,
} from "./types";

// --- Classification -------------------------------------------------------------------------

/** The classes a drawn line can take. Each has its own mark in the exhibit. */
export const DRAWN_FLOW_CLASSES = [
  "cash",
  "part_disbursed",
  "committed",
  "contingent",
  "commercial",
  "not_public",
  "ended",
  "status_not_stated",
] as const;

/** `reference` rows (ceilings, budget lines, cost figures) are listed apart and never drawn. */
export const FLOW_CLASSES = [...DRAWN_FLOW_CLASSES, "reference"] as const;

export type DrawnFlowClass = (typeof DRAWN_FLOW_CLASSES)[number];
export type FlowClass = (typeof FLOW_CLASSES)[number];

/** `next` hands the row to the following rule. */
type Next = "next";

/**
 * Rule 1, the current status. A row that ended, or whose status the record does not state, is
 * never classed by what it would have been. The other statuses decide only at the last step.
 */
export const STATUS_FLOW: Record<FinancialStatus, "cash" | "part_disbursed" | "committed" | "ended" | "status_not_stated"> = {
  announced: "committed",
  selected_for_negotiations: "committed",
  authorized: "committed",
  allocated: "committed",
  decided: "committed",
  contracted: "committed",
  partially_disbursed: "part_disbursed",
  disbursed: "cash",
  withdrawn: "ended",
  lapsed: "ended",
  not_stated: "status_not_stated",
};

/** Rule 2, what the figure is. Only a `commitment` can go on to be classed as money. */
export const VALUE_ROLE_FLOW: Record<ValueRole, FlowClass | Next> = {
  commitment: "next",
  program_envelope: "reference",
  budget_appropriation: "reference",
  lending_authority: "reference",
  funding_option: "contingent",
  indication: "contingent",
  selection_proposal: "contingent",
  expected_co_investment: "reference",
  private_financing: "not_public",
  recipient_own_funds: "not_public",
  total_project_cost: "reference",
};

/** Rule 3, whose money it is. Private capital is never drawn in a public-support mark. */
export const CAPITAL_SOURCE_FLOW: Record<CapitalSource, "not_public" | Next> = {
  public: "next",
  public_enterprise: "next",
  mixed_vehicle: "next",
  private: "not_public",
  not_stated: "next",
};

/** Rule 4, the instrument. Support that pays only if triggered, and terms under which no capital is provided. */
export const INSTRUMENT_FLOW: Record<FinancialInstrument, "contingent" | "commercial" | Next> = {
  grant: "next",
  loan: "next",
  loan_guarantee: "contingent",
  equity: "next",
  tax_credit: "contingent",
  price_floor: "contingent",
  offtake: "commercial",
  procurement_right: "commercial",
  stockpile_purchase: "commercial",
  mixed: "next",
  unspecified: "next",
};

export type FlowClassification = {
  flowClass: FlowClass;
  /** Which rule decided the class. */
  decidedBy: "status" | "value_role" | "capital_source" | "instrument";
};

/**
 * Class of one row from its recorded fields. `status` is the status in effect on the reading date;
 * null means the corpus establishes none by then, which reads as "not stated", never as live.
 */
export function classifyFlow(
  row: Pick<FinancialCommitment, "instrument" | "valueRole" | "capitalSource">,
  status: FinancialStatus | null,
): FlowClassification {
  const byStatus = status === null ? "status_not_stated" : STATUS_FLOW[status];
  if (byStatus === "status_not_stated" || byStatus === "ended") return { flowClass: byStatus, decidedBy: "status" };
  const byRole = VALUE_ROLE_FLOW[row.valueRole];
  if (byRole !== "next") return { flowClass: byRole, decidedBy: "value_role" };
  const bySource = CAPITAL_SOURCE_FLOW[row.capitalSource];
  if (bySource !== "next") return { flowClass: bySource, decidedBy: "capital_source" };
  const byInstrument = INSTRUMENT_FLOW[row.instrument];
  if (byInstrument !== "next") return { flowClass: byInstrument, decidedBy: "instrument" };
  return { flowClass: byStatus, decidedBy: "status" };
}

/** An equity interest is an overlay on a row that stands as money: the provider holds, or is to hold, a stake. */
export function hasEquityInterest(row: Pick<FinancialCommitment, "instrument">, flowClass: FlowClass): boolean {
  return row.instrument === "equity" && (flowClass === "cash" || flowClass === "part_disbursed" || flowClass === "committed");
}

// --- Wording --------------------------------------------------------------------------------

export const FLOW_CLASS_LABELS: Record<FlowClass, string> = {
  cash: "Cash disbursed",
  part_disbursed: "Partly disbursed",
  committed: "Not yet disbursed",
  contingent: "Contingent or optional",
  commercial: "Commercial arrangement",
  not_public: "Private or own funds",
  ended: "Ended, not in force",
  status_not_stated: "Status not stated",
  reference: "Ceiling, budget line or cost figure",
};

export const FLOW_CLASS_DESCRIPTIONS: Record<FlowClass, string> = {
  cash: "The record shows the money as paid.",
  part_disbursed: "Some money is recorded as paid. The amount shown is the commitment, not the cash paid.",
  committed: "Announced, decided or contracted. No disbursement is recorded.",
  contingent: "No money is committed unless an option is exercised, a trigger is met or a binding agreement follows.",
  commercial: "A purchase, offtake or supply term. No capital is provided.",
  not_public: "Private financing or the recipient's own money. Not public support.",
  ended: "Lapsed or withdrawn. Shown for completeness.",
  status_not_stated: "The record gives no status, so the row is not read as live.",
  reference: "Listed apart. Not a payment to a recipient.",
};

export const EQUITY_INTEREST_LABEL = "Equity interest";
export const EQUITY_INTEREST_DESCRIPTION = "The provider takes a stake in the recipient.";

/** What the row is, said next to its status, so a contingent or commercial row is not read as funding. */
const VALUE_ROLE_REMARK: Partial<Record<ValueRole, string>> = {
  funding_option: "An option, not committed money.",
  indication: "A non-binding indication, not a commitment.",
  selection_proposal: "A selection or proposal, not yet a commitment.",
  private_financing: "Private financing, not public support.",
  recipient_own_funds: "The recipient's own funds, not public support.",
};

const INSTRUMENT_REMARK: Partial<Record<FinancialInstrument, string>> = {
  loan_guarantee: "A guarantee, which pays only if it is called.",
  tax_credit: "A tax credit, claimed against qualifying activity.",
  price_floor: "A floor, which pays only when the price is below it.",
  offtake: "A purchase commitment, not funding.",
  procurement_right: "A right to buy, not funding.",
  stockpile_purchase: "A purchase for a stockpile, not funding.",
};

const CLASS_REMARK: Record<DrawnFlowClass, string> = {
  cash: "Recorded as paid.",
  part_disbursed: "The amount shown is the commitment, not the cash paid.",
  committed: "No disbursement recorded.",
  contingent: "No money committed unless triggered.",
  commercial: "A commercial term, not funding.",
  not_public: "Private capital, not public support.",
  ended: "Not in force.",
  status_not_stated: "Not read as live.",
};

const LISTED_ROLE_REASON: Partial<Record<ValueRole, string>> = {
  program_envelope: "A programme envelope: a ceiling on what may be awarded, not a payment to a recipient.",
  budget_appropriation: "A budget line, not a payment to a recipient.",
  lending_authority: "A lending ceiling, not money lent.",
  expected_co_investment: "Co-investment a source expects, not a commitment.",
  total_project_cost: "A total project cost, not support.",
};

const QUALIFIER_WORD: Record<ValueQualifier, string> = { exact: "", up_to: "up to", approximately: "about", at_least: "at least" };

/** The term that says what a row with no stated amount is about. */
const DEFINING_TERM: Partial<Record<FinancialInstrument, TermKind>> = {
  price_floor: "price_floor",
  offtake: "offtake_share",
  tax_credit: "tax_credit_rate",
  procurement_right: "procurement_share",
};

function sentenceStart(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** One row's own figure with its ceiling or floor wording: "up to USD 350 million". */
export function flowAmountLabel(amount: MonetaryAmount): string {
  const word = QUALIFIER_WORD[amount.qualifier];
  return `${word ? `${word} ` : ""}${formatMoney(amount.value, amount.currency)}`;
}

function definingTerm(c: FinancialCommitment): string | null {
  const kind = DEFINING_TERM[c.instrument];
  if (!kind) return null;
  const term = c.terms.find((t) => t.kind === kind && t.value !== null);
  if (!term || term.value === null) return null;
  const word = term.qualifier ? QUALIFIER_WORD[term.qualifier] : "";
  const figure = `${term.currency ? `${term.currency} ` : ""}${groupDecimal(term.value)}`;
  const unit = term.unit ? (term.unit.startsWith("%") ? term.unit : ` ${term.unit}`) : "";
  return `${word ? `${word} ` : ""}${figure}${unit}`;
}

// --- Model ----------------------------------------------------------------------------------

export type CapitalFlowSource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** Display date of publication, or null when the source record gives none. */
  published: string | null;
};

export type CapitalFlowPartyRef = { id: string; name: string; href: string };

export type CapitalFlowParty = CapitalFlowPartyRef & {
  kindLabel: string;
  /** Drawn flows this organization provides or receives, in lane order. */
  flowIds: string[];
};

export type CapitalFlowUse = {
  id: string;
  name: string;
  href: string;
  /** False when the record associates the project without allocating any of the amount to it. */
  allocated: boolean;
};

export type CapitalFlowAnnotation = {
  /** "Part of" or "Drawn from". */
  label: string;
  targetId: string;
  targetHref: string;
  /** What the parent row is, with its own stated figure. */
  targetText: string;
};

export type CapitalFlowStatus = {
  status: FinancialStatus | null;
  label: string;
  /** Status with its date, in exact wording: "Lapsed 26 Aug 2025". */
  text: string;
  /** For an undated status, the date by which the corpus evidences it. */
  evidencedBy: string | null;
  note: string | null;
  source: CapitalFlowSource | null;
};

type CapitalFlowRowBase = {
  id: string;
  /** The commitment record. */
  href: string;
  flowClass: FlowClass;
  classLabel: string;
  instrumentLabel: string;
  valueRoleLabel: string;
  capitalSourceLabel: string;
  /** "up to USD 350 million", or null when the record states no amount. */
  amountLabel: string | null;
  /** The amount as the source prints it. */
  amountAsStated: string | null;
  /** What the figure is as the sources characterise it, when recorded. */
  amountBasis: string | null;
  /** For a row with no amount, the term that defines it: "USD 110 per kg of NdPr". */
  definingTerm: string | null;
  /** One line for the row: its figure and instrument, or its instrument and defining term. */
  headline: string;
  status: CapitalFlowStatus;
  /** Names of the providing organizations, or the record's free-text provider. Null when none is recorded. */
  providerText: string | null;
  recipientText: string | null;
  providers: CapitalFlowPartyRef[];
  recipients: CapitalFlowPartyRef[];
  annotations: CapitalFlowAnnotation[];
  /** Sources cited in the row's evidence, each with a URL. */
  sources: CapitalFlowSource[];
};

export type CapitalFlow = CapitalFlowRowBase & {
  flowClass: DrawnFlowClass;
  equityInterest: boolean;
  /** What the row is, next to its status. */
  remark: string;
  /** True when the money is the recipient's own and no outside provider exists. */
  ownFunds: boolean;
  uses: CapitalFlowUse[];
  /** Plain-text summary used as the accessible name of the row's mark. */
  summary: string;
};

export type CapitalFlowListedRow = CapitalFlowRowBase & {
  /** Why the row is listed apart rather than drawn. */
  reason: string;
};

/** A box in the provider or recipient column, covering `span` consecutive lanes from `start`. */
export type CapitalFlowRun = { partyIds: string[]; start: number; span: number };

export type CapitalFlowLegendEntry = { key: DrawnFlowClass | "equity"; label: string; description: string };

export type CapitalFlowModel = {
  eventId: string;
  eventTitle: string;
  eventHref: string;
  eventDate: string;
  eventDateLabel: string;
  asOf: string;
  asOfLabel: string;
  /** Drawn rows in lane order. */
  flows: CapitalFlow[];
  parties: CapitalFlowParty[];
  providerRuns: CapitalFlowRun[];
  recipientRuns: CapitalFlowRun[];
  /** Rows recorded for the event that are not drawn, each with the reason. */
  listed: CapitalFlowListedRow[];
  legend: CapitalFlowLegendEntry[];
  /** Every source cited by a drawn or listed row, in first-cited order. */
  sources: CapitalFlowSource[];
  /** True when any drawn row has both an identified provider and an identified recipient. */
  hasIdentifiedParties: boolean;
};

function sourceOf(id: string): CapitalFlowSource | null {
  const s = getSourceById(id);
  if (!s || !s.url) return null;
  return {
    id: s.id,
    title: s.title,
    publisher: s.publisher,
    url: s.url,
    published: s.datePublished ? formatDate(s.datePublished) : null,
  };
}

function partyRefs(ids: readonly string[]): CapitalFlowPartyRef[] {
  const refs: CapitalFlowPartyRef[] = [];
  for (const id of ids) {
    const org = getOrganizationById(id);
    if (org) refs.push({ id: org.id, name: org.name, href: `/organizations/${org.id}` });
  }
  return refs;
}

function statusOf(c: FinancialCommitment, asOf: string, flowClass: FlowClass): CapitalFlowStatus {
  const entry = financialStatusEntryOn(c, asOf);
  if (!entry) {
    return {
      status: null,
      label: "No status recorded",
      text: `No status recorded by ${formatDate(asOf)}`,
      evidencedBy: null,
      note: null,
      source: null,
    };
  }
  const label = financialStatusLabels[entry.status];
  const dated = entry.date ? ` ${formatDate(entry.date)}` : "";
  let text: string;
  if (entry.status === "not_stated") {
    text = "Status not stated";
  } else if (c.valueRole === "funding_option" && flowClass === "contingent") {
    // An executed option is not an exercise. Absence of an exercise means none is recorded.
    const agreement = BINDING_FINANCIAL_STATUSES.includes(entry.status) ? "Option executed" : `Option ${label.toLowerCase()}`;
    const exercised = optionState(c).exercises.length > 0;
    text = `${agreement}${dated || ", date not stated"}, ${exercised ? "exercise recorded" : "no exercise recorded"}`;
  } else {
    text = entry.date ? `${label}${dated}` : `${label}, date not stated`;
  }
  const boundary = entry.date ? null : financialStatusEvidenceBoundary(c, entry);
  return {
    status: entry.status,
    label,
    text,
    evidencedBy: boundary ? formatDate(boundary) : null,
    note: entry.note ?? null,
    source: sourceOf(entry.sourceId),
  };
}

function rowBase(c: FinancialCommitment, asOf: string): CapitalFlowRowBase {
  const status = financialStatusEntryOn(c, asOf)?.status ?? null;
  const { flowClass } = classifyFlow(c, status);
  const providers = partyRefs(c.providerOrgIds);
  const recipients = partyRefs(c.recipientOrgIds);
  const instrumentLabel = financialInstrumentLabels[c.instrument];
  const amountLabel = c.amount ? flowAmountLabel(c.amount) : null;
  const term = c.amount ? null : definingTerm(c);
  const unspecified = c.instrument === "unspecified" || c.instrument === "mixed";
  const headline = amountLabel
    ? unspecified
      ? sentenceStart(amountLabel)
      : `${sentenceStart(amountLabel)}, ${instrumentLabel.toLowerCase()}`
    : term
      ? `${instrumentLabel}, ${term}`
      : `${instrumentLabel}, no amount stated`;

  const annotations: CapitalFlowAnnotation[] = [];
  for (const r of c.relationships) {
    const target = getFinancialCommitmentById(r.commitmentId);
    if (!target) continue;
    const parts = [valueRoleLabels[target.valueRole].toLowerCase()];
    if (target.amount) parts.push(flowAmountLabel(target.amount));
    if (target.provider) parts.push(target.provider);
    annotations.push({
      label: financialRelationshipTypeLabels[r.relationship],
      targetId: target.id,
      targetHref: `/capital/${target.id}`,
      targetText: parts.join(", "),
    });
  }

  const sources: CapitalFlowSource[] = [];
  for (const id of evidenceSourceIds(c)) {
    const s = sourceOf(id);
    if (s) sources.push(s);
  }

  return {
    id: c.id,
    href: `/capital/${c.id}`,
    flowClass,
    classLabel: FLOW_CLASS_LABELS[flowClass],
    instrumentLabel,
    valueRoleLabel: valueRoleLabels[c.valueRole],
    capitalSourceLabel: capitalSourceLabels[c.capitalSource],
    amountLabel,
    amountAsStated: c.amount?.amountAsStated ?? null,
    amountBasis: c.amount?.basisNote ?? null,
    definingTerm: term,
    headline,
    status: statusOf(c, asOf, flowClass),
    providerText: providers.length ? joinNames(providers.map((p) => p.name)) : c.provider,
    recipientText: recipients.length ? joinNames(recipients.map((p) => p.name)) : c.recipient,
    providers,
    recipients,
    annotations,
    sources,
  };
}

const CLASS_RANK = new Map<FlowClass, number>(FLOW_CLASSES.map((k, i) => [k, i]));
const rank = (k: FlowClass) => CLASS_RANK.get(k) ?? FLOW_CLASSES.length;
/** Classes at or past this rank are private, ended or unstated rows, and are laid out after the rest. */
const TAIL_RANK = rank("not_public");

const keyOf = (parties: readonly CapitalFlowPartyRef[]) => parties.map((p) => p.id).sort().join("+");

function countRuns(keys: readonly string[]): number {
  let runs = 0;
  for (let i = 0; i < keys.length; i += 1) if (i === 0 || keys[i] !== keys[i - 1]) runs += 1;
  return runs;
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) out.push([item, ...p]);
  });
  return out;
}

type LaneGroup = { providerKey: string; recipientKey: string; flows: CapitalFlow[]; rank: number };

/**
 * Lane order. Rows between the same parties stay together; groups are ordered so that each
 * party's rows sit next to each other where the relationships allow it, with private, ended and
 * unstated rows after the rest. Deterministic: ties keep the class-then-id order.
 */
function orderLanes(flows: readonly CapitalFlow[]): CapitalFlow[] {
  const groups = new Map<string, LaneGroup>();
  const sorted = [...flows].sort((a, b) => rank(a.flowClass) - rank(b.flowClass) || a.id.localeCompare(b.id));
  for (const f of sorted) {
    const providerKey = keyOf(f.providers);
    const recipientKey = keyOf(f.recipients);
    const key = `${providerKey}>${recipientKey}`;
    const g = groups.get(key);
    if (g) g.flows.push(f);
    else groups.set(key, { providerKey, recipientKey, flows: [f], rank: rank(f.flowClass) });
  }
  const all = [...groups.values()];
  const head = all.filter((g) => g.rank < TAIL_RANK);
  const tail = all.filter((g) => g.rank >= TAIL_RANK);
  const score = (order: readonly LaneGroup[]) =>
    countRuns(order.map((g) => g.providerKey)) + countRuns(order.map((g) => g.recipientKey));

  let best = [...head, ...tail];
  if (head.length <= 6 && tail.length <= 4) {
    let bestScore = score(best);
    for (const h of permutations(head)) {
      for (const t of permutations(tail)) {
        const candidate = [...h, ...t];
        const s = score(candidate);
        if (s < bestScore) {
          best = candidate;
          bestScore = s;
        }
      }
    }
  } else {
    const byParty = (a: LaneGroup, b: LaneGroup) =>
      a.recipientKey.localeCompare(b.recipientKey) || a.providerKey.localeCompare(b.providerKey);
    best = [...[...head].sort(byParty), ...[...tail].sort(byParty)];
  }
  return best.flatMap((g) => g.flows);
}

function runsOf(flows: readonly CapitalFlow[], side: "providers" | "recipients"): CapitalFlowRun[] {
  const runs: CapitalFlowRun[] = [];
  let previous = "";
  flows.forEach((f, i) => {
    const key = keyOf(f[side]);
    const last = runs[runs.length - 1];
    if (key && last && key === previous) last.span += 1;
    else if (key) runs.push({ partyIds: f[side].map((p) => p.id), start: i, span: 1 });
    previous = key;
  });
  return runs;
}

/** The exhibit model for one event, or null when the event or its commitment rows do not exist. */
export function buildCapitalFlowModel(eventId: string, asOf: string = site.lastUpdated): CapitalFlowModel | null {
  const event = getEventById(eventId);
  if (!event) return null;
  const rows = getFinancialCommitmentsByEvent(eventId);
  if (rows.length === 0) return null;

  const drawable: { c: FinancialCommitment; base: CapitalFlowRowBase }[] = [];
  const listed: CapitalFlowListedRow[] = [];

  for (const c of rows) {
    const base = rowBase(c, asOf);
    const ownFunds = c.valueRole === "recipient_own_funds" && base.providers.length === 0;
    if (base.flowClass === "reference") {
      listed.push({ ...base, reason: LISTED_ROLE_REASON[c.valueRole] ?? FLOW_CLASS_DESCRIPTIONS.reference });
    } else if (base.recipients.length === 0 || (base.providers.length === 0 && !ownFunds)) {
      listed.push({ ...base, reason: "The record does not identify both a provider and a recipient organization." });
    } else {
      drawable.push({ c, base });
    }
  }

  // A package whose parts are drawn is the same money as its parts: it is listed, not drawn beside them.
  const drawableIds = new Set(drawable.map((d) => d.c.id));
  const packageIds = new Set<string>();
  for (const { c } of drawable) {
    for (const r of c.relationships) {
      if (r.relationship === "part_of" && drawableIds.has(r.commitmentId)) packageIds.add(r.commitmentId);
    }
  }

  const flows: CapitalFlow[] = [];
  for (const { c, base } of drawable) {
    if (packageIds.has(c.id)) {
      listed.push({ ...base, reason: "A package figure. The parts drawn in the exhibit are included in it, not additional to it." });
      continue;
    }
    const flowClass = base.flowClass as DrawnFlowClass;
    const ownFunds = base.providers.length === 0;
    const decidedRemark =
      flowClass === "ended" || flowClass === "status_not_stated"
        ? CLASS_REMARK[flowClass]
        : (VALUE_ROLE_REMARK[c.valueRole] ??
          (flowClass === "contingent" || flowClass === "commercial" ? INSTRUMENT_REMARK[c.instrument] : undefined) ??
          CLASS_REMARK[flowClass]);

    const uses: CapitalFlowUse[] = [];
    const allocatedProject = c.projectId ? getProjectById(c.projectId) : undefined;
    if (allocatedProject) {
      uses.push({ id: allocatedProject.id, name: allocatedProject.name, href: `/projects/${allocatedProject.id}`, allocated: true });
    }
    for (const id of c.associatedProjectIds ?? []) {
      const p = getProjectById(id);
      if (p && p.id !== allocatedProject?.id) uses.push({ id: p.id, name: p.name, href: `/projects/${p.id}`, allocated: false });
    }

    const from = ownFunds ? "The recipient's own funds" : base.providerText;
    flows.push({
      ...base,
      flowClass,
      equityInterest: hasEquityInterest(c, flowClass),
      remark: decidedRemark,
      ownFunds,
      uses,
      summary: `${from} to ${base.recipientText}: ${base.headline}. ${base.classLabel}. ${base.status.text}.`,
    });
  }

  const ordered = orderLanes(flows);

  const parties = new Map<string, CapitalFlowParty>();
  for (const f of ordered) {
    for (const ref of [...f.providers, ...f.recipients]) {
      const existing = parties.get(ref.id);
      if (existing) {
        if (!existing.flowIds.includes(f.id)) existing.flowIds.push(f.id);
        continue;
      }
      const org = getOrganizationById(ref.id);
      parties.set(ref.id, { ...ref, kindLabel: org ? organizationKindLabels[org.kind] : "", flowIds: [f.id] });
    }
  }

  const legend: CapitalFlowLegendEntry[] = DRAWN_FLOW_CLASSES.filter((k) => ordered.some((f) => f.flowClass === k)).map((k) => ({
    key: k,
    label: FLOW_CLASS_LABELS[k],
    description: FLOW_CLASS_DESCRIPTIONS[k],
  }));
  if (ordered.some((f) => f.equityInterest)) {
    legend.push({ key: "equity", label: EQUITY_INTEREST_LABEL, description: EQUITY_INTEREST_DESCRIPTION });
  }

  const sources = new Map<string, CapitalFlowSource>();
  for (const row of [...ordered, ...listed]) {
    for (const s of row.sources) if (!sources.has(s.id)) sources.set(s.id, s);
    if (row.status.source && !sources.has(row.status.source.id)) sources.set(row.status.source.id, row.status.source);
  }

  return {
    eventId: event.id,
    eventTitle: event.titleEn,
    eventHref: `/events/${event.id}`,
    eventDate: event.date,
    eventDateLabel: formatDateLong(event.date),
    asOf,
    asOfLabel: formatDateLong(asOf),
    flows: ordered,
    parties: [...parties.values()],
    providerRuns: runsOf(ordered, "providers"),
    recipientRuns: runsOf(ordered, "recipients"),
    listed: listed.sort((a, b) => a.id.localeCompare(b.id)),
    legend,
    sources: [...sources.values()],
    hasIdentifiedParties: ordered.some((f) => f.providers.length > 0 && f.recipients.length > 0),
  };
}
