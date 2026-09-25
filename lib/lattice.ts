/**
 * The lattice model: the stage response map reshaped into one plain, serializable payload for the Overview and
 * Compare views. It adds no analysis of its own. Each cell holds record ids by kind (commitments, control
 * clauses, designations) and a `records` table with just the display fields; the client counts records of one
 * kind at a time and never adds one kind to another. Amounts stay in the source's currency and qualifier
 * (`amountAsStated` is carried through), and no cell holds a money total. Deterministic: "as of" is an argument.
 */
import { commitmentActor, controlIssuer, controlSpans, controlStatusOn, currentFinancialStatus, formatDecimalCompact, isEnded } from "./capital-control";
import { stageLatticeGaps, stageResponseMap } from "./capital-intelligence";
import {
  getAllControlMeasures,
  getAllFinancialCommitments,
  getAllMaterials,
  getAllProjectDesignations,
  getEventById,
  getOrganizationById,
  getProgrammeById,
  getProjectById,
} from "./data";
import { formatDate } from "./format";
import {
  controlMeasureTypeLabels,
  controlStatusLabels,
  controlledItemTypeLabels,
  designationStatusLabels,
  financialInstrumentLabels,
  financialStatusLabels,
  jurisdictionLabels,
  jurisdictionShort,
  supplyChainStageLabels,
} from "./labels";
import { SUPPLY_CHAIN_STAGES } from "./types";
import type { ControlMeasure, ControlStatus, FinancialCommitment, JurisdictionCode, ProjectDesignation, SupplyChainStage } from "./types";

export type LatticeKind = "commitment" | "control" | "designation";

/** Which of a cell's three capital fields a commitment sits in. */
export type CapitalField = "capital" | "option" | "ended";

type Common = { id: string; href: string; actor: JurisdictionCode; actorShort: string; title: string };

export type LatticeCommitment = Common & {
  kind: "commitment";
  field: CapitalField;
  /** "National Wealth Fund to Tungsten West"; a missing party is left out, never guessed. */
  parties: string;
  /** Null when the source states no amount. `value` is the compact decimal in `currency`, never converted. */
  amount: { qualifier: string | null; currency: string; value: string; asStated: string } | null;
  instrument: string;
  /** "Announced, 25 Aug 2026"; the date is the status entry's own, absent when the source gives none. */
  status: string;
};

export type LatticeControl = Common & {
  kind: "control";
  documentNumber: string | null;
  /** The clause's status on the model date; null when its history has no entry that early. */
  statusKey: ControlStatus | null;
  /** "in force, since 4 Feb 2025" as of the model date. */
  status: string;
  /** "goods, technology": what kind of item the clause covers, where the clause defines items. */
  items: string | null;
};

export type LatticeDesignation = Common & {
  kind: "designation";
  programme: string;
  /** The project name exactly as the designation gives it, when it differs from the registry's English name. */
  asStated: string | null;
  status: string;
};

export type LatticeRecord = LatticeCommitment | LatticeControl | LatticeDesignation;

export type LatticeCell = {
  /** Government commitments that have not ended, a package once. */
  commitments: string[];
  /** Funding options: a right to call on money, not an exercise. Never counted as commitments. */
  options: string[];
  /** Withdrawn or lapsed rows: listed, not capital. */
  ended: string[];
  controls: string[];
  designations: string[];
};

export type LatticeModel = {
  asOf: string;
  materials: { id: string; slug: string; nameEn: string; nameZh: string | null }[];
  /** Only stages at least one record occupies, in vocabulary order. */
  stages: { id: SupplyChainStage; label: string }[];
  cells: Record<string, LatticeCell>;
  records: Record<string, LatticeRecord>;
  actors: { code: JurisdictionCode; short: string; name: string }[];
  /**
   * Per material: the records that name it but record no stage, so no cell can hold them. A government's
   * commitment or option, a control clause or a designation; ids resolve in `records`. Not on the lattice.
   */
  unstaged: Record<string, { commitments: string[]; controls: string[]; designations: string[] }>;
  gaps: ReturnType<typeof stageLatticeGaps>;
};

export const cellKey = (materialId: string, stage: SupplyChainStage) => `${materialId}|${stage}`;

const QUALIFIER_WORD: Record<string, string | null> = { exact: null, up_to: "up to", approximately: "about", at_least: "at least" };

const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function latestOnOrBefore<E extends { status: string; date: string | null }>(history: readonly E[], asOf: string): E | null {
  let hit: E | null = null;
  for (const e of history) if (e.date && e.date <= asOf) hit = e;
  return hit;
}

/** The registry's English name when exactly one organization is linked; otherwise the source's own string. */
function partyName(orgIds: readonly string[], asStated: string | null): string | null {
  if (orgIds.length === 1) return getOrganizationById(orgIds[0])?.name ?? asStated;
  return asStated;
}

function commitmentRecord(c: FinancialCommitment, field: CapitalField): LatticeCommitment {
  const actor = commitmentActor(c)!;
  const status = currentFinancialStatus(c);
  const dated = [...c.financialStatusHistory].reverse().find((e) => e.status === status && e.date);
  const parties = [partyName(c.providerOrgIds, c.provider), partyName(c.recipientOrgIds, c.recipient)].filter(Boolean);
  return {
    kind: "commitment",
    id: c.id,
    href: `/capital/${c.id}`,
    actor,
    actorShort: jurisdictionShort[actor],
    field,
    title: parties.length === 2 ? `${parties[0]} to ${parties[1]}` : (parties[0] ?? c.project ?? c.id),
    parties: parties.join(" to "),
    amount: c.amount
      ? {
          qualifier: QUALIFIER_WORD[c.amount.qualifier] ?? null,
          currency: c.amount.currency,
          value: formatDecimalCompact(c.amount.value),
          asStated: c.amount.amountAsStated,
        }
      : null,
    instrument: financialInstrumentLabels[c.instrument],
    status: dated?.date ? `${financialStatusLabels[status]}, ${formatDate(dated.date)}` : financialStatusLabels[status],
  };
}

function controlRecord(m: ControlMeasure, asOf: string): LatticeControl {
  const issuer = controlIssuer(m);
  const event = getEventById(m.eventId);
  const status = controlStatusOn(m, asOf);
  const span = controlSpans(m).find((s) => s.from <= asOf && (s.to === null || asOf < s.to));
  const label = controlMeasureTypeLabels[m.measureType];
  return {
    kind: "control",
    id: m.id,
    href: `/controls/${m.id}`,
    actor: issuer,
    actorShort: jurisdictionShort[issuer],
    title: m.clause ? `${label}, ${m.clause}` : label,
    documentNumber: event?.documentNumber ?? null,
    statusKey: status,
    status: status
      ? `${controlStatusLabels[status].toLowerCase()}${span?.from ? `, since ${formatDate(span.from)}` : ""}`
      : "no status recorded on this date",
    items: m.controlledItemTypes.length ? m.controlledItemTypes.map((t) => controlledItemTypeLabels[t].toLowerCase()).join(", ") : null,
  };
}

function designationRecord(d: ProjectDesignation, asOf: string): LatticeDesignation | null {
  const programme = getProgrammeById(d.programmeId);
  if (!programme) return null;
  const project = getProjectById(d.projectId);
  const entry = latestOnOrBefore(d.statusHistory, asOf) ?? d.statusHistory[d.statusHistory.length - 1];
  return {
    kind: "designation",
    id: d.id,
    href: `/projects/${d.projectId}`,
    actor: programme.actor,
    actorShort: jurisdictionShort[programme.actor],
    title: project?.name ?? d.projectNameAsStated,
    programme: programme.name,
    asStated: project && project.name !== d.projectNameAsStated ? d.projectNameAsStated : null,
    status: entry
      ? `${designationStatusLabels[entry.status]}${entry.date ? ` ${formatDate(entry.date)}` : ""}${entry.date ? " (status date)" : ""}`
      : "no status recorded",
  };
}

export function buildLatticeModel(
  asOf: string,
  all: readonly FinancialCommitment[] = getAllFinancialCommitments(),
  controls: readonly ControlMeasure[] = getAllControlMeasures(),
  designations: readonly ProjectDesignation[] = getAllProjectDesignations(),
): LatticeModel {
  const map = stageResponseMap(asOf, all, controls);
  const commitmentById = new Map(all.map((c) => [c.id, c]));
  const controlById = new Map(controls.map((m) => [m.id, m]));
  const designationById = new Map(designations.map((d) => [d.id, d]));

  const records: Record<string, LatticeRecord> = {};
  const cells: Record<string, LatticeCell> = {};
  const addCommitment = (id: string, field: CapitalField) => {
    const c = commitmentById.get(id);
    if (c && !records[id]) records[id] = commitmentRecord(c, field);
    return id;
  };

  for (const [materialId, row] of map) {
    for (const [stage, cell] of row) {
      for (const id of cell.controlIds) {
        const m = controlById.get(id);
        if (m && !records[id]) records[id] = controlRecord(m, asOf);
      }
      for (const id of cell.designationIds) {
        const d = designationById.get(id);
        const r = d && designationRecord(d, asOf);
        if (r && !records[id]) records[id] = r;
      }
      cells[cellKey(materialId, stage)] = {
        commitments: cell.capitalIds.map((id) => addCommitment(id, "capital")).sort(byCodePoint),
        options: cell.optionIds.map((id) => addCommitment(id, "option")).sort(byCodePoint),
        ended: cell.endedIds.map((id) => addCommitment(id, "ended")).sort(byCodePoint),
        controls: [...cell.controlIds].sort(byCodePoint),
        designations: cell.designationIds.filter((id) => records[id]).sort(byCodePoint),
      };
    }
  }

  const unstaged: LatticeModel["unstaged"] = {};
  const slot = (mat: string) => (unstaged[mat] ??= { commitments: [], controls: [], designations: [] });
  for (const m of controls)
    if (m.controlledStages.length === 0)
      for (const mat of m.materialIds) {
        slot(mat).controls.push(m.id);
        records[m.id] ??= controlRecord(m, asOf);
      }
  for (const c of all) {
    if (!c.providerJurisdiction || !(c.valueRole === "commitment" || c.valueRole === "funding_option") || c.stages.length > 0) continue;
    for (const mat of c.materialIds) {
      slot(mat).commitments.push(c.id);
      records[c.id] ??= commitmentRecord(c, isEnded(c) ? "ended" : c.valueRole === "funding_option" ? "option" : "capital");
    }
  }
  for (const d of designations)
    if (d.stages.length === 0) {
      const r = designationRecord(d, asOf);
      if (!r) continue;
      for (const mat of d.materialIds) {
        slot(mat).designations.push(d.id);
        records[d.id] ??= r;
      }
    }
  for (const x of Object.values(unstaged)) {
    x.commitments.sort(byCodePoint);
    x.controls.sort(byCodePoint);
    x.designations.sort(byCodePoint);
  }

  const occupiedStages = SUPPLY_CHAIN_STAGES.filter((s) => [...map.values()].some((row) => row.has(s)));
  const materials = getAllMaterials()
    .filter((m) => map.has(m.id))
    .map((m) => ({ id: m.id, slug: m.slug, nameEn: m.nameEn, nameZh: m.nameZh ?? null }));
  const actorCodes = [...new Set(Object.values(records).map((r) => r.actor))].sort(byCodePoint);

  return {
    asOf,
    materials,
    stages: occupiedStages.map((id) => ({ id, label: supplyChainStageLabels[id] })),
    cells,
    records,
    actors: actorCodes.map((code) => ({ code, short: jurisdictionShort[code], name: jurisdictionLabels[code] })),
    unstaged,
    gaps: stageLatticeGaps(all, controls, designations),
  };
}
