/**
 * Capital & Control analytics: the one place figures are derived from the
 * financial-commitment and control-measure seeds.
 *
 * Every function is pure and deterministic. "Today" is never read from the
 * clock: status-as-of questions take an explicit date, and the site passes
 * `site.lastUpdated`, so a rebuild on another day cannot change a page.
 *
 * Aggregation rules (see /methodology#capital-counting):
 *  - Money is never converted. Totals are per currency.
 *  - Unlike instruments are never added: within a currency, each instrument
 *    (grant, loan, equity, loan guarantee...) has its own sums, and rows
 *    whose instrument is not stated or is a mix are listed, never summed.
 *  - Unlike value roles are never added. Only rows whose role is
 *    "commitment" are ever summed; envelopes, appropriations and lending
 *    authorities are listed, never totalled, because two envelopes can share
 *    a drawdown (a reserve component drawn from a separate facility).
 *  - A row is never counted together with a row it is part of or drawn from:
 *    within any sum, a row whose ancestor is also counted is left out.
 *  - If two counted rows share a descendant the sum would double-count, so
 *    that currency's total is withheld: its sums are null (status
 *    "withheld") and the overlap is reported instead.
 *  - Funding options (a ceiling a party may call on under an executed
 *    agreement) are listed, never summed; an exercise is its own commitment.
 *  - Private capital, a recipient's own funds and total project cost are not
 *    public support. Mixed public-private vehicles are reported apart from
 *    public money because their public share is not stated.
 *  - Figures stated as ceilings, approximations or floors are kept apart from
 *    exact figures, so a total never hides how much of it is "up to".
 *  - A commitment whose current status is withdrawn or lapsed is left out of
 *    every sum and listed as ended: money that will not flow is not support.
 *  - A commitment whose current status is "not_stated" is left out of every
 *    sum and listed apart: the split into binding and not yet binding is a
 *    claim about status, and a source that gives none supports neither. This
 *    is the same rule as an instrument the source does not name.
 *  - Only a row that is itself counted can keep another row out of a sum. An
 *    ended, status-not-stated or amountless row never suppresses its parts.
 *  - Decimal arithmetic is exact (BigInt), never floating point.
 */
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getEventById,
} from "./data";
import { FINANCIAL_INSTRUMENTS } from "./types";
import type {
  CapitalSource,
  FinancialInstrument,
  ControlMeasure,
  ControlStatus,
  ControlStatusEntry,
  FinancialCommitment,
  FinancialStatus,
  FinancialStatusEntry,
  JurisdictionCode,
  PolicyEvent,
  ValueQualifier,
  ValueRole,
} from "./types";

export { addDecimals, compareDecimals, formatDecimalCompact, formatMoney, groupDecimal } from "./decimal";
import { addDecimals } from "./decimal";

// --- Status helpers -------------------------------------------------------------

export function currentFinancialStatus(c: FinancialCommitment): FinancialStatus {
  return c.financialStatusHistory[c.financialStatusHistory.length - 1].status;
}

export function currentControlEntry(m: ControlMeasure): ControlStatusEntry {
  return m.statusHistory[m.statusHistory.length - 1];
}

export function currentControlStatus(m: ControlMeasure): ControlStatus {
  return currentControlEntry(m).status;
}

/**
 * The status a control measure had on `date`: the last dated entry on or
 * before it, with an undated entry taking effect only after an earlier dated
 * one. Null when the measure had not yet been announced.
 */
export function controlStatusOn(m: ControlMeasure, date: string): ControlStatus | null {
  let status: ControlStatus | null = null;
  for (const e of m.statusHistory) {
    if (e.date === null) {
      if (status !== null) status = e.status;
      continue;
    }
    if (e.date <= date) status = e.status;
    else break;
  }
  return status;
}

/** Whole days from `from` to `to` (ISO dates), UTC. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

// --- Relationship graph -----------------------------------------------------------

/** Every commitment this one is part of or drawn from, transitively. */
export function ancestorIds(
  c: FinancialCommitment,
  all: readonly FinancialCommitment[] = getAllFinancialCommitments(),
): Set<string> {
  const byId = new Map(all.map((x) => [x.id, x]));
  const seen = new Set<string>();
  const stack = c.relationships.map((r) => r.commitmentId);
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    byId.get(id)?.relationships.forEach((r) => stack.push(r.commitmentId));
  }
  return seen;
}

export type ChildLink = { commitment: FinancialCommitment; relationship: "part_of" | "drawn_from" };

/** Commitments that name this one in a relationship, with the relationship type. */
export function childLinks(id: string, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): ChildLink[] {
  const out: ChildLink[] = [];
  for (const c of all)
    for (const r of c.relationships) if (r.commitmentId === id) out.push({ commitment: c, relationship: r.relationship });
  return out;
}

export function descendantIds(id: string, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): Set<string> {
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const { commitment } of childLinks(cur, all))
      if (!seen.has(commitment.id)) {
        seen.add(commitment.id);
        stack.push(commitment.id);
      }
  }
  return seen;
}

export function isRootCommitment(c: FinancialCommitment): boolean {
  return c.relationships.length === 0;
}

// --- Aggregation --------------------------------------------------------------------

/** Capital sources counted as public support. Mixed vehicles are reported apart. */
export const PUBLIC_CAPITAL_SOURCES: readonly CapitalSource[] = ["public", "public_enterprise"];

type QualifierSums = Partial<Record<ValueQualifier, string>>;

/**
 * The counted rows of one instrument in one currency, summed. Unlike
 * instruments are never added: a grant, a loan, an equity stake and a loan
 * guarantee are different promises, so each has its own sums.
 */
export type InstrumentSum = {
  instrument: FinancialInstrument;
  countedIds: string[];
} & (
  | {
      summed: true;
      /** Sums of the counted rows' figures, kept apart by how the source qualifies them. */
      byQualifier: QualifierSums;
      /**
       * The same sums split by whether a binding agreement exists (contracted,
       * partially disbursed, disbursed) or not yet (announced, authorized,
       * allocated, decided, including conditional and non-binding commitments).
       */
      binding: QualifierSums;
      notYetBinding: QualifierSums;
    }
  | {
      /**
       * Rows whose instrument the sources do not name ("unspecified"), or
       * that combine instruments without a split ("mixed"), are listed with
       * their own figures and never summed: adding them could add a loan to a
       * grant without anyone being able to tell.
       */
      summed: false;
      reason: "instrument_not_stated" | "several_instruments";
      byQualifier: null;
      binding: null;
      notYetBinding: null;
    }
);

/** Instrument values that name no single instrument, so rows under them are listed, never summed. */
export const UNSUMMED_INSTRUMENTS: readonly FinancialInstrument[] = ["mixed", "unspecified"];

/** What every currency entry carries, summed or not. */
type CurrencyTotalBase = {
  currency: string;
  /** Rows the totals are made of (or would be, were it safe to add them). */
  countedIds: string[];
  /** Rows left out because a row they belong to is counted in the same currency. */
  nestedIds: string[];
};

/**
 * One currency's totals, one entry per instrument. Discriminated on
 * `status`, so no consumer can read a sum for a currency whose rows overlap:
 *  - "summed": the per-instrument sums are safe to show. There is no sum
 *    across instruments.
 *  - "withheld": two counted rows share a descendant, so adding them would
 *    double-count. The sums are null, never zero or partial, and `overlap`
 *    names the rows.
 * A part is left out when a row it belongs to is counted in the same
 * currency, whatever either row's instrument: nesting is decided before the
 * rows are split by instrument, so a package's parts are never counted
 * beside it under their own instruments.
 */
export type CurrencyTotal =
  | (CurrencyTotalBase & {
      status: "summed";
      instruments: InstrumentSum[];
      overlap: null;
    })
  | (CurrencyTotalBase & {
      status: "withheld";
      reason: "overlap";
      instruments: null;
      overlap: { a: string; b: string; shared: string };
    });

export type SummedCurrencyTotal = Extract<CurrencyTotal, { status: "summed" }>;

export type CommitmentTotals = {
  currencies: CurrencyTotal[];
  /** Rows in scope that state no amount (price floors, offtakes, tax credits). */
  unquantifiedIds: string[];
  /** Rows whose current status is withdrawn or lapsed: money that will not flow, listed and never summed. */
  endedIds: string[];
  /**
   * Rows with an amount whose current status is "not_stated": the source
   * gives no stage, so they are neither binding nor not yet binding, and are
   * listed with their own figures and never summed.
   */
  statusNotStatedIds: string[];
};

/** Financial statuses at which a commitment has ended without the money flowing. */
export const ENDED_FINANCIAL_STATUSES: readonly FinancialStatus[] = ["withdrawn", "lapsed"];

/**
 * Per-currency totals of the given rows under the counting rules above. The
 * caller chooses the scope; this function refuses to add unlike value roles
 * and only ever adds rows that share a currency.
 */
export function totalCommitments(
  rows: readonly FinancialCommitment[],
  all: readonly FinancialCommitment[] = getAllFinancialCommitments(),
): CommitmentTotals {
  const roles = new Set(rows.map((r) => r.valueRole));
  if (roles.size > 1)
    throw new Error(`totalCommitments: refusing to add unlike value roles (${[...roles].join(", ")})`);

  const inScope = new Map(rows.map((r) => [r.id, r]));
  const unquantifiedIds: string[] = [];
  const endedIds: string[] = [];
  const statusNotStatedIds: string[] = [];
  const counted = new Map<string, FinancialCommitment[]>();
  const nested = new Map<string, string[]>();
  // A row that reaches a sum: not ended, states an amount, and states its status.
  const counts = (c: FinancialCommitment | undefined): c is FinancialCommitment & { amount: NonNullable<FinancialCommitment["amount"]> } =>
    !!c && !!c.amount && legalStanding(c) !== "ended" && legalStanding(c) !== "status_not_stated";
  for (const c of rows) {
    if (isEnded(c)) {
      endedIds.push(c.id);
      continue;
    }
    if (!c.amount) {
      unquantifiedIds.push(c.id);
      continue;
    }
    if (!counts(c)) {
      statusNotStatedIds.push(c.id);
      continue;
    }
    const cur = c.amount.currency;
    // Only an ancestor that itself reaches the sum keeps this row out of it.
    const ancestorCounted = [...ancestorIds(c, all)].some((a) => {
      const p = inScope.get(a);
      return counts(p) && p.amount.currency === cur;
    });
    if (ancestorCounted) nested.set(cur, [...(nested.get(cur) ?? []), c.id]);
    else counted.set(cur, [...(counted.get(cur) ?? []), c]);
  }

  const currencies: CurrencyTotal[] = [...counted.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([currency, list]): CurrencyTotal => {
      let overlap: { a: string; b: string; shared: string } | null = null;
      const desc = list.map((c) => ({ id: c.id, d: descendantIds(c.id, all) }));
      outer: for (let i = 0; i < desc.length; i++)
        for (let j = i + 1; j < desc.length; j++)
          for (const s of desc[i].d)
            if (desc[j].d.has(s)) {
              overlap = { a: desc[i].id, b: desc[j].id, shared: s };
              break outer;
            }
      const base = { currency, countedIds: list.map((c) => c.id), nestedIds: nested.get(currency) ?? [] };
      if (overlap) return { ...base, status: "withheld", reason: "overlap", instruments: null, overlap };
      const instruments: InstrumentSum[] = [];
      for (const instrument of FINANCIAL_INSTRUMENTS) {
        const of = list.filter((c) => c.instrument === instrument);
        if (!of.length) continue;
        if (UNSUMMED_INSTRUMENTS.includes(instrument)) {
          instruments.push({
            instrument,
            countedIds: of.map((c) => c.id),
            summed: false,
            reason: instrument === "mixed" ? "several_instruments" : "instrument_not_stated",
            byQualifier: null,
            binding: null,
            notYetBinding: null,
          });
          continue;
        }
        const byQualifier: QualifierSums = {};
        const binding: QualifierSums = {};
        const notYetBinding: QualifierSums = {};
        for (const c of of) {
          const q = c.amount!.qualifier;
          byQualifier[q] = addDecimals([byQualifier[q] ?? "0", c.amount!.value]);
          const bucket = isBinding(c) ? binding : notYetBinding;
          bucket[q] = addDecimals([bucket[q] ?? "0", c.amount!.value]);
        }
        instruments.push({ instrument, countedIds: of.map((c) => c.id), summed: true, byQualifier, binding, notYetBinding });
      }
      return { ...base, status: "summed", instruments, overlap: null };
    });
  return { currencies, unquantifiedIds, endedIds, statusNotStatedIds };
}

/** Public support committed to recipients: role "commitment", public capital. */
export function publicCommitmentRows(all: readonly FinancialCommitment[] = getAllFinancialCommitments()) {
  return all.filter((c) => c.valueRole === "commitment" && PUBLIC_CAPITAL_SOURCES.includes(c.capitalSource));
}

/** Value roles that describe money available but not committed: listed, never summed. */
export const LISTED_NOT_SUMMED_ROLES: readonly ValueRole[] = ["program_envelope", "budget_appropriation", "lending_authority"];

/**
 * Where a funding option stands, from the corpus alone. The option is
 * executed when its agreement is contracted; it is exercised only when a
 * commitment drawn from it is recorded and has not ended; money has moved
 * only when that commitment is (partly) disbursed. Absence means "none
 * recorded in the corpus", never "not exercised".
 */
export type OptionState = {
  executed: FinancialStatusEntry | null;
  /** Commitments drawn from the option that have not ended. A withdrawn or lapsed draw is not an exercise. */
  exercises: FinancialCommitment[];
  /** Draws that were recorded and then withdrew or lapsed: listed, never read as an exercise or as money moved. */
  endedExercises: FinancialCommitment[];
  disbursements: FinancialCommitment[];
};

export function optionState(c: FinancialCommitment, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): OptionState {
  const executed = [...c.financialStatusHistory].reverse().find((e) => BINDING_FINANCIAL_STATUSES.includes(e.status)) ?? null;
  const draws = childLinks(c.id, all)
    .filter((l) => l.relationship === "drawn_from" && l.commitment.valueRole === "commitment")
    .map((l) => l.commitment);
  const exercises = draws.filter((e) => !isEnded(e));
  const endedExercises = draws.filter(isEnded);
  const disbursements = exercises.filter((e) => ["partially_disbursed", "disbursed"].includes(currentFinancialStatus(e)));
  return { executed, exercises, endedExercises, disbursements };
}

/** Rows grouped by value role. */
export function rowsByValueRole(all: readonly FinancialCommitment[] = getAllFinancialCommitments()) {
  const out = new Map<ValueRole, FinancialCommitment[]>();
  for (const c of all) out.set(c.valueRole, [...(out.get(c.valueRole) ?? []), c]);
  return out;
}

// --- Counts and attribution ----------------------------------------------------------

export function countBy<T, K extends string>(items: readonly T[], key: (t: T) => K | readonly K[] | null): Map<K, number> {
  const m = new Map<K, number>();
  for (const it of items) {
    const k = key(it);
    if (k === null) continue;
    const keys: readonly K[] = typeof k === "string" ? [k as K] : [...new Set(k as readonly K[])];
    for (const one of keys) m.set(one, (m.get(one) ?? 0) + 1);
  }
  return m;
}

/** Issuer of a control measure: the jurisdiction of its event. */
export function controlIssuer(m: ControlMeasure): JurisdictionCode {
  return getEventById(m.eventId)!.jurisdiction;
}

/**
 * The tracked government behind a commitment, or null. Never inferred from the
 * event: a bank loan, a company's own cash or a project pipeline announced in
 * a government's event is not that government's money.
 */
export function commitmentActor(c: FinancialCommitment): JurisdictionCode | null {
  return c.providerJurisdiction;
}

/** Financial statuses at which a binding agreement exists. */
export const BINDING_FINANCIAL_STATUSES: readonly FinancialStatus[] = ["contracted", "partially_disbursed", "disbursed"];

/** Financial statuses at which money is promised or decided but no binding agreement exists yet. */
export const NOT_YET_BINDING_FINANCIAL_STATUSES: readonly FinancialStatus[] = ["announced", "authorized", "allocated", "decided"];

export function isBinding(c: FinancialCommitment): boolean {
  return BINDING_FINANCIAL_STATUSES.includes(currentFinancialStatus(c));
}

/** The commitment has ended without the money flowing: withdrawn, or lapsed unused. */
export function isEnded(c: FinancialCommitment): boolean {
  return ENDED_FINANCIAL_STATUSES.includes(currentFinancialStatus(c));
}

/**
 * Where a commitment stands, in the four terms every count and total uses. A
 * status the source does not give is never read as "not yet binding".
 */
export type LegalStanding = "binding" | "not_yet_binding" | "ended" | "status_not_stated";

export function legalStanding(c: FinancialCommitment): LegalStanding {
  const status = currentFinancialStatus(c);
  if (ENDED_FINANCIAL_STATUSES.includes(status)) return "ended";
  if (BINDING_FINANCIAL_STATUSES.includes(status)) return "binding";
  if (NOT_YET_BINDING_FINANCIAL_STATUSES.includes(status)) return "not_yet_binding";
  return "status_not_stated";
}

// --- Timelines ---------------------------------------------------------------------------

export type InstrumentMark = {
  kind: "capital" | "control";
  id: string;
  eventId: string;
  jurisdiction: JurisdictionCode;
  date: string;
  status: string;
  label: string;
  /** Capital marks only: the row's value role, so an option never reads as committed money. */
  valueRole?: ValueRole;
};

/**
 * Every dated status change across both entities, oldest first. Undated
 * entries are left out rather than placed at a guessed date.
 */
export function instrumentChronology(): InstrumentMark[] {
  const marks: InstrumentMark[] = [];
  // Rows with no government provider (private capital, a project pipeline)
  // have no actor lane and are left out rather than credited to one.
  for (const c of getAllFinancialCommitments()) {
    const actor = commitmentActor(c);
    if (!actor) continue;
    for (const e of c.financialStatusHistory)
      if (e.date)
        marks.push({
          kind: "capital",
          id: c.id,
          eventId: c.eventId,
          jurisdiction: actor,
          date: e.date,
          status: e.status,
          label: c.recipient ?? c.provider ?? c.id,
          valueRole: c.valueRole,
        });
  }
  for (const m of getAllControlMeasures())
    for (const e of m.statusHistory)
      if (e.date)
        marks.push({
          kind: "control",
          id: m.id,
          eventId: m.eventId,
          jurisdiction: controlIssuer(m),
          date: e.date,
          status: e.status,
          label: m.clause ?? m.id,
        });
  return marks.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export type StatusSpan = { status: ControlStatus; from: string; to: string | null; until: string | null };

/**
 * A control measure's history as contiguous spans for the status chart. Each
 * dated entry runs until the next dated entry, or stays open. Undated entries
 * have no position in time and are omitted.
 */
export function controlSpans(m: ControlMeasure): StatusSpan[] {
  const dated = m.statusHistory.filter((e): e is ControlStatusEntry & { date: string } => e.date !== null);
  return dated.map((e, i) => ({
    status: e.status,
    from: e.date,
    to: i + 1 < dated.length ? dated[i + 1].date : null,
    until: e.until ?? null,
  }));
}

/** Measures whose current status carries a stated end date, soonest first. */
export function controlClocks(asOf: string) {
  return getAllControlMeasures()
    .map((measure) => ({ measure, entry: currentControlEntry(measure) }))
    .filter(({ entry }) => Boolean(entry.until))
    .map(({ measure, entry }) => ({ measure, entry, daysLeft: daysBetween(asOf, entry.until!) }))
    .sort((a, b) => a.daysLeft - b.daysLeft || (a.measure.id < b.measure.id ? -1 : 1));
}

// --- Material × actor interplay ------------------------------------------------------------

export type InterplayCell = { capitalIds: string[]; controlIds: string[]; controlsInForce: number };

/**
 * For each tracked material and actor: the financial rows that actor provides
 * (a package counted once, its parts folded in) and the control clauses it
 * issues naming the material. Counts of records, never of money, so no
 * currency or value role is mixed.
 */
export function materialInterplay(asOf: string): Map<string, Map<JurisdictionCode, InterplayCell>> {
  const out = new Map<string, Map<JurisdictionCode, InterplayCell>>();
  const cell = (mat: string, j: JurisdictionCode) => {
    if (!out.has(mat)) out.set(mat, new Map());
    const row = out.get(mat)!;
    if (!row.has(j)) row.set(j, { capitalIds: [], controlIds: [], controlsInForce: 0 });
    return row.get(j)!;
  };
  // A part of a package is folded into the package, so one deal counts once, but only into a package
  // that is itself counted here. An ended row is not capital aimed at a material and is left out.
  // A part folds only into a package this matrix counts under the same actor: a private row, another
  // provider's row or an ended row does not hide it.
  const live = getAllFinancialCommitments().filter((c) => !isEnded(c) && commitmentActor(c));
  const liveById = new Map(live.map((c) => [c.id, c]));
  for (const c of live)
    if (!c.relationships.some((r) => r.relationship === "part_of" && liveById.get(r.commitmentId)?.providerJurisdiction === c.providerJurisdiction))
      for (const mat of c.materialIds) cell(mat, commitmentActor(c)!).capitalIds.push(c.id);
  for (const m of getAllControlMeasures())
    for (const mat of m.materialIds) {
      const x = cell(mat, controlIssuer(m));
      x.controlIds.push(m.id);
      if (controlStatusOn(m, asOf) === "in_force") x.controlsInForce++;
    }
  return out;
}

/** Events that carry at least one Capital & Control row, newest first. */
export function eventsWithInstruments() {
  const withRows = new Set([
    ...getAllFinancialCommitments().map((c) => c.eventId),
    ...getAllControlMeasures().map((m) => m.eventId),
  ]);
  return getAllEvents().filter((e) => withRows.has(e.id));
}

/** The distinct sources a row's evidence cites, in first-cited order. */
export function evidenceSourceIds(row: { evidence: readonly { sourceId: string }[] }): string[] {
  return [...new Set(row.evidence.map((e) => e.sourceId))];
}

// --- Serializable row summaries for the client explorers ------------------------------------

export type CommitmentSummary = {
  id: string;
  eventId: string;
  eventTitle: string;
  /** The providing government; null for private or unattributed capital. */
  actor: JurisdictionCode | null;
  instrument: FinancialCommitment["instrument"];
  valueRole: ValueRole;
  capitalSource: CapitalSource;
  amount: FinancialCommitment["amount"];
  provider: string | null;
  recipient: string | null;
  project: string | null;
  stages: FinancialCommitment["stages"];
  materialIds: string[];
  status: FinancialStatus;
  /** Date of the latest dated financial status entry, if any. */
  statusDate: string | null;
  parents: { id: string; relationship: "part_of" | "drawn_from" }[];
  childCount: number;
  termCount: number;
  sourceCount: number;
  hasAmbiguity: boolean;
  /**
   * For a funding option only: whether a commitment drawn from it (an
   * exercise) is recorded in the corpus. Null for every other value role.
   */
  optionExerciseRecorded: boolean | null;
};

function latestDate(entries: readonly { date: string | null }[]): string | null {
  const dated = entries.filter((e) => e.date).map((e) => e.date!);
  return dated.length ? dated[dated.length - 1] : null;
}

export function summarizeCommitment(c: FinancialCommitment): CommitmentSummary {
  const e = getEventById(c.eventId)!;
  return {
    id: c.id,
    eventId: c.eventId,
    eventTitle: e.titleEn,
    actor: commitmentActor(c),
    instrument: c.instrument,
    valueRole: c.valueRole,
    capitalSource: c.capitalSource,
    amount: c.amount,
    provider: c.provider,
    recipient: c.recipient,
    project: c.project ?? c.facility,
    stages: c.stages,
    materialIds: c.materialIds,
    status: currentFinancialStatus(c),
    statusDate: latestDate(c.financialStatusHistory),
    parents: c.relationships.map((r) => ({ id: r.commitmentId, relationship: r.relationship })),
    childCount: childLinks(c.id).length,
    termCount: c.terms.length,
    sourceCount: evidenceSourceIds(c).length,
    hasAmbiguity: c.evidence.some((x) => x.evidence === "ambiguous"),
    optionExerciseRecorded: c.valueRole === "funding_option" ? optionState(c).exercises.length > 0 : null,
  };
}

/**
 * Status entries of a control measure that another event in the corpus
 * records: the entry's source is one of that event's sources. This is how an
 * outcome that is not itself a restriction (a proclamation that closes an
 * investigation with a negotiation mandate) stays linked to the measure
 * without being coded as a control.
 */
export function statusEntriesRecordedElsewhere(m: ControlMeasure): { entry: ControlStatusEntry; event: PolicyEvent }[] {
  const own = getEventById(m.eventId)?.sourceIds ?? [];
  const out: { entry: ControlStatusEntry; event: PolicyEvent }[] = [];
  for (const entry of m.statusHistory) {
    if (own.includes(entry.sourceId)) continue;
    for (const e of getAllEvents())
      if (e.id !== m.eventId && e.sourceIds.includes(entry.sourceId)) out.push({ entry, event: e });
  }
  return out;
}

/** The reverse: control measures of other events whose status entries this event's sources record. */
export function controlStatusesRecordedIn(eventId: string): { measure: ControlMeasure; entry: ControlStatusEntry }[] {
  const e = getEventById(eventId);
  if (!e) return [];
  const out: { measure: ControlMeasure; entry: ControlStatusEntry }[] = [];
  for (const m of getAllControlMeasures())
    if (m.eventId !== eventId)
      for (const { entry, event } of statusEntriesRecordedElsewhere(m)) if (event.id === eventId) out.push({ measure: m, entry });
  return out;
}

export type ControlSummary = {
  id: string;
  eventId: string;
  eventTitle: string;
  documentNumber: string | null;
  issuer: JurisdictionCode;
  measureType: ControlMeasure["measureType"];
  direction: ControlMeasure["direction"];
  clause: string | null;
  targetScopes: ControlMeasure["targetScopes"];
  targetJurisdictions: string[];
  targetEntities: string[];
  materialIds: string[];
  untrackedMaterials: string[];
  status: ControlStatus;
  statusDate: string | null;
  until: string | null;
  productCodeCount: number;
  firstDate: string | null;
  hasAmbiguity: boolean;
};

export function summarizeControl(m: ControlMeasure): ControlSummary {
  const e = getEventById(m.eventId)!;
  const cur = currentControlEntry(m);
  const dated = m.statusHistory.filter((x) => x.date);
  return {
    id: m.id,
    eventId: m.eventId,
    eventTitle: e.titleEn,
    documentNumber: e.documentNumber ?? null,
    issuer: e.jurisdiction,
    measureType: m.measureType,
    direction: m.direction,
    clause: m.clause,
    targetScopes: m.targetScopes,
    targetJurisdictions: m.targetJurisdictions,
    targetEntities: m.targetEntities,
    materialIds: m.materialIds,
    untrackedMaterials: m.untrackedMaterialsAsStated,
    status: cur.status,
    statusDate: latestDate(m.statusHistory),
    until: cur.until ?? null,
    productCodeCount: m.productCodes.length,
    firstDate: dated.length ? dated[0].date : null,
    hasAmbiguity: m.evidence.some((x) => x.evidence === "ambiguous"),
  };
}

/**
 * A compact handle for an event's instrument, for chart labels:
 * "No. 18/2025", "EO 14272", "Proclamation 11001", "Decree 785". Falls back
 * to the start of the English title when there is no document number.
 */
export function shortInstrumentLabel(event: { documentNumber?: string | null; titleEn: string }): string {
  const d = event.documentNumber ?? "";
  const no = /No\.\s*(\d+)\s*\((\d{4})\)/.exec(d) ?? /\[(\d{4})\]\s*No\.\s*(\d+)/.exec(d);
  if (no) return /\[/.test(no[0]) ? `No. ${no[2]}/${no[1]}` : `No. ${no[1]}/${no[2]}`;
  const eo = /Executive Order (\d+)/.exec(d);
  if (eo) return `EO ${eo[1]}`;
  const pr = /Proclamation (\d+)/.exec(d);
  if (pr) return `Proclamation ${pr[1]}`;
  const dec = /Decree No\.\s*(\d+)/.exec(d);
  if (dec) return `Decree ${dec[1]}`;
  const t = event.titleEn;
  return t.length > 24 ? `${t.slice(0, 23).trimEnd()}…` : t;
}
