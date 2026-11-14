/**
 * Status replay for the capital-flow exhibit: the recorded status of each row of one event, read at each date
 * on which the record's evidence changes it. Pure and deterministic, and built entirely on
 * `buildCapitalFlowModel(eventId, asOf)`, so every class, status text and "recorded by" date is the model's own.
 *
 * Rules:
 * - A step begins at an evidence boundary (`financialStatusEvidenceBoundary`) of a drawn row: a status entry's
 *   own date, or, for an undated entry, the date by which the corpus evidences it. A step's date is therefore
 *   "recorded by", never "happened on".
 * - Each step says what kind of date it is (`StepDateBasis`). A status's own date reads "Recorded by"; the
 *   publication date of a source reporting an undated status reads "Reported on"; an SMPT review or access date
 *   reads "Checked by". A source or check date is never presented as the date the status took effect.
 * - Between boundaries nothing changes. A step holds its state until the next one; nothing is interpolated.
 * - The lane layout is the latest model's. Each step only overlays class and status per row, so lanes never
 *   reorder while the reader steps through dates.
 * - A row with no status entry by a step's date, but one later, is "not yet recorded". It is never given the
 *   "Status not stated" class, which is reserved for what the record says.
 * - The last step is the latest model itself, read at its as-of date (`site.lastUpdated` by default).
 * - If any drawn row would leave the drawing at an earlier date, the exhibit gets no replay.
 */
import {
  financialStatusEntryOn,
  financialStatusEvidence,
  financialStatusEvidenceBoundary,
  type FinancialStatusEvidenceBasis,
} from "@/lib/capital-control";
import {
  DRAWN_FLOW_CLASSES,
  buildCapitalFlowModel,
  type CapitalFlowLegendEntry,
  type CapitalFlowModel,
  type CapitalFlowStatus,
  type DrawnFlowClass,
} from "@/lib/capital-flow";
import { getFinancialCommitmentById } from "@/lib/data";
import { formatDate, formatDateLong } from "@/lib/format";

/** State of one drawn row at one step. */
export type FlowStepState = {
  flowClass: DrawnFlowClass;
  classLabel: string;
  equityInterest: boolean;
  remark: string;
  status: CapitalFlowStatus;
  /** No status entry by this date, though the record has one later. Drawn as an empty lane. */
  notYetRecorded: boolean;
};

/** State of one row listed apart (not drawn) at one step. Only its status changes. */
export type ListedStepState = {
  status: CapitalFlowStatus;
  notYetRecorded: boolean;
};

/**
 * What kind of date a step's date is, for the rows that change there: `recorded`, a status's own date; `reported`,
 * the publication date of a source that reports a status without giving its date; `checked`, the date SMPT
 * reviewed or accessed a source that gives no date for the status.
 */
export type StepDateBasis = "recorded" | "reported" | "checked";

export const STEP_DATE_PREFIX: Record<StepDateBasis, string> = {
  recorded: "Recorded by",
  reported: "Reported on",
  checked: "Checked by",
};

/** Short tag under a step's date in the date bar. A status's own date carries none. */
export const STEP_DATE_TAG: Record<StepDateBasis, string | null> = {
  recorded: null,
  reported: "Reported",
  checked: "Checked",
};

/** Explains a tagged step date, shown under the dates when the replay has one. */
export const STEP_DATE_NOTE: Record<Exclude<StepDateBasis, "recorded">, string> = {
  reported: "Reported: the publication date of a source that reports a status without giving its date.",
  checked: "Checked: the date SMPT reviewed the status or accessed its source, where neither the status nor the source is dated.",
};

const BASIS_OF: Record<FinancialStatusEvidenceBasis, StepDateBasis> = {
  stated: "recorded",
  source_published: "reported",
  review_checked: "checked",
  source_accessed: "checked",
};

/** A status's own date wins, then a source's publication date, then a check date. */
const BASIS_RANK: StepDateBasis[] = ["recorded", "reported", "checked"];

export type CapitalFlowStep = {
  /** The evidence boundary at which this state begins. */
  date: string;
  /**
   * What kind of date `date` is. Where rows changing at one date differ, a status's own date wins, so a step
   * is tagged "Reported" or "Checked" only when no change there has its own date.
   */
  dateBasis: StepDateBasis;
  /** For each changed row (drawn or listed), what kind of date its change rests on. */
  changeBasis: Record<string, StepDateBasis>;
  /** "9 Jul 2025". */
  dateLabel: string;
  /** The reading date of the state: the step's own date, or the exhibit's as-of date for the last step. */
  asOf: string;
  /** "9 July 2025". */
  asOfLabel: string;
  latest: boolean;
  flows: Record<string, FlowStepState>;
  listed: Record<string, ListedStepState>;
  /** Drawn rows whose class or status differs from the previous step, in lane order. Empty at the first step. */
  changedFlowIds: string[];
  /** Listed rows whose status differs from the previous step. */
  changedListedIds: string[];
};

export type CapitalFlowTimeline = {
  /** Oldest first. One step means the record shows no change to replay. */
  steps: CapitalFlowStep[];
  /**
   * Every class drawn at any step, the latest model's entries first in their order, then the classes seen only
   * at earlier steps. Shown once the reader steps back, so the key still names every line on screen.
   */
  legend: CapitalFlowLegendEntry[];
  /** True when some step has a row that is not yet recorded. */
  hasNotYetRecorded: boolean;
  /** Kinds of tagged date the replay uses, for the note under the dates. */
  taggedBases: Array<Exclude<StepDateBasis, "recorded">>;
};

export const NOT_YET_RECORDED_LABEL = "Not yet recorded";
export const NOT_YET_RECORDED_DESCRIPTION = "No status is recorded for this line by the date shown.";

/** Identity of a state for change detection. A missing status compares by its absence, not by its dated wording. */
function signature(s: { status: CapitalFlowStatus; notYetRecorded: boolean; flowClass?: string }): string {
  const status = s.status.status;
  return [s.flowClass ?? "", status ?? "none", status ? s.status.text : "", s.status.evidencedBy ?? "", s.notYetRecorded].join("|");
}

/**
 * Evidence boundaries of the rows the latest model draws, on or before its as-of date. Rows listed apart do not
 * start a step of their own (nothing in the drawing would change); their status is still read at every step.
 */
export function statusBoundaries(model: CapitalFlowModel): string[] {
  const dates = new Set<string>();
  for (const id of model.flows.map((f) => f.id)) {
    const c = getFinancialCommitmentById(id);
    if (!c) continue;
    for (const e of c.financialStatusHistory) {
      const boundary = financialStatusEvidenceBoundary(c, e);
      if (boundary !== null && boundary <= model.asOf) dates.add(boundary);
    }
  }
  return [...dates].sort();
}

/**
 * What kind of date `date` is for one row: the basis of the status entry in effect on that date, when that
 * entry's evidence boundary is the date itself. Null when nothing about the row is evidenced on that date.
 */
function basisOn(id: string, date: string): StepDateBasis | null {
  const c = getFinancialCommitmentById(id);
  if (!c) return null;
  const entry = financialStatusEntryOn(c, date);
  const evidence = entry ? financialStatusEvidence(c, entry) : null;
  return evidence && evidence.date === date ? BASIS_OF[evidence.basis] : null;
}

function stateOf(model: CapitalFlowModel): Pick<CapitalFlowStep, "flows" | "listed"> {
  const flows: Record<string, FlowStepState> = {};
  for (const f of model.flows) {
    flows[f.id] = {
      flowClass: f.flowClass,
      classLabel: f.classLabel,
      equityInterest: f.equityInterest,
      remark: f.remark,
      status: f.status,
      notYetRecorded: false,
    };
  }
  const listed: Record<string, ListedStepState> = {};
  for (const r of model.listed) listed[r.id] = { status: r.status, notYetRecorded: false };
  return { flows, listed };
}

/**
 * The replay for one exhibit. `latest` is the model the exhibit draws; its layout is kept at every step.
 */
export function buildCapitalFlowTimeline(latest: CapitalFlowModel): CapitalFlowTimeline {
  const single: CapitalFlowTimeline = {
    steps: [
      {
        date: latest.asOf,
        dateBasis: "recorded",
        changeBasis: {},
        dateLabel: formatDate(latest.asOf),
        asOf: latest.asOf,
        asOfLabel: latest.asOfLabel,
        latest: true,
        ...stateOf(latest),
        changedFlowIds: [],
        changedListedIds: [],
      },
    ],
    legend: latest.legend,
    hasNotYetRecorded: false,
    taggedBases: [],
  };

  const latestState = stateOf(latest);
  const recordedAtLatest = (status: CapitalFlowStatus) => status.status !== null;

  type Draft = Omit<CapitalFlowStep, "changedFlowIds" | "changedListedIds" | "latest" | "dateBasis" | "changeBasis"> & {
    signature: string;
  };
  const drafts: Draft[] = [];
  const legendByKey = new Map<string, CapitalFlowLegendEntry>();

  const boundaries = statusBoundaries(latest);
  for (let i = 0; i < boundaries.length; i += 1) {
    const date = boundaries[i];
    const isLast = i === boundaries.length - 1;
    // The last state is the latest model, so the default view and the end of the replay are the same reading.
    const model = isLast ? latest : buildCapitalFlowModel(latest.eventId, date);
    if (!model) return single;

    const byId = new Map(model.flows.map((f) => [f.id, f]));
    const listedById = new Map(model.listed.map((r) => [r.id, r]));
    const flows: Record<string, FlowStepState> = {};
    for (const f of latest.flows) {
      const at = byId.get(f.id);
      // A drawn row that the model would list at this date cannot be replayed on a fixed layout.
      if (!at) return single;
      const notYetRecorded = at.status.status === null && recordedAtLatest(f.status);
      flows[f.id] = {
        flowClass: at.flowClass,
        classLabel: notYetRecorded ? NOT_YET_RECORDED_LABEL : at.classLabel,
        equityInterest: notYetRecorded ? false : at.equityInterest,
        remark: notYetRecorded ? NOT_YET_RECORDED_DESCRIPTION : at.remark,
        status: at.status,
        notYetRecorded,
      };
      if (!notYetRecorded) {
        const entry = model.legend.find((e) => e.key === at.flowClass);
        if (entry && !legendByKey.has(entry.key)) legendByKey.set(entry.key, entry);
        if (at.equityInterest) {
          const equity = model.legend.find((e) => e.key === "equity");
          if (equity && !legendByKey.has("equity")) legendByKey.set("equity", equity);
        }
      }
    }
    const listed: Record<string, ListedStepState> = {};
    for (const r of latest.listed) {
      // At an early date a listed row can have no status, and the model then draws it as unstated; only its status is read.
      const status = listedById.get(r.id)?.status ?? byId.get(r.id)?.status;
      if (!status) return single;
      listed[r.id] = { status, notYetRecorded: status.status === null && recordedAtLatest(r.status) };
    }

    const sig = [
      ...latest.flows.map((f) => `${f.id}:${signature(flows[f.id])}`),
      ...latest.listed.map((r) => `${r.id}:${signature(listed[r.id])}`),
    ].join("\n");
    if (drafts.length && drafts[drafts.length - 1].signature === sig) {
      // Same state as the step before: that step keeps its earlier date. Only the reading date moves on at the end.
      if (isLast) {
        const prev = drafts[drafts.length - 1];
        prev.asOf = latest.asOf;
        prev.asOfLabel = latest.asOfLabel;
        prev.flows = latestState.flows;
        prev.listed = latestState.listed;
      }
      continue;
    }
    drafts.push({
      date,
      dateLabel: formatDate(date),
      asOf: isLast ? latest.asOf : date,
      asOfLabel: isLast ? latest.asOfLabel : formatDateLong(date),
      flows: isLast ? latestState.flows : flows,
      listed: isLast ? latestState.listed : listed,
      signature: sig,
    });
  }

  if (drafts.length < 2) return single;

  const steps: CapitalFlowStep[] = drafts.map((d, i) => {
    const prev = i > 0 ? drafts[i - 1] : null;
    const changedFlowIds = prev
      ? latest.flows.map((f) => f.id).filter((id) => signature(prev.flows[id]) !== signature(d.flows[id]))
      : [];
    const changedListedIds = prev
      ? latest.listed.map((r) => r.id).filter((id) => signature(prev.listed[id]) !== signature(d.listed[id]))
      : [];
    // The first step changes nothing; its date is described by the drawn rows evidenced on it.
    const evidencedHere = i === 0 ? latest.flows.map((f) => f.id).filter((id) => basisOn(id, d.date) !== null) : [];
    const changeBasis: Record<string, StepDateBasis> = {};
    for (const id of [...changedFlowIds, ...changedListedIds]) changeBasis[id] = basisOn(id, d.date) ?? "recorded";
    const bases = new Set<StepDateBasis>(
      i === 0
        ? evidencedHere.map((id) => basisOn(id, d.date)!)
        : changedFlowIds.map((id) => changeBasis[id]),
    );
    return {
      date: d.date,
      dateBasis: BASIS_RANK.find((b) => bases.has(b)) ?? "recorded",
      changeBasis,
      dateLabel: d.dateLabel,
      asOf: d.asOf,
      asOfLabel: d.asOfLabel,
      latest: i === drafts.length - 1,
      flows: d.flows,
      listed: d.listed,
      changedFlowIds,
      changedListedIds,
    };
  });

  // The latest entries keep their places; classes seen only at earlier steps follow, in class order.
  const legend: CapitalFlowLegendEntry[] = [...latest.legend];
  const extra = [...DRAWN_FLOW_CLASSES, "equity" as const].filter(
    (k) => legendByKey.has(k) && !legend.some((e) => e.key === k),
  );
  for (const k of extra) legend.push(legendByKey.get(k)!);

  const used = new Set(steps.flatMap((s) => [s.dateBasis, ...Object.values(s.changeBasis)]));
  return {
    steps,
    legend,
    hasNotYetRecorded: steps.some((s) => Object.values(s.flows).some((f) => f.notYetRecorded)),
    taggedBases: (["reported", "checked"] as const).filter((b) => used.has(b)),
  };
}
