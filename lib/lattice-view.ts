/**
 * Pure view logic for the lattice: apply the Compare filters to a `LatticeModel`, count records per kind for a
 * cell, and split one material by government. Counts are records of one kind at a time; nothing here adds one
 * kind to another or totals a row or a column, and no function reads money. Kept apart from the components so
 * the rules are testable.
 */
import { cellKey } from "./lattice";
import type { LatticeCell, LatticeCommitment, LatticeControl, LatticeDesignation, LatticeModel, LatticeRecord } from "./lattice";
import type { JurisdictionCode, SupplyChainStage } from "./types";

export type KindVisibility = { commitments: boolean; controls: boolean; designations: boolean };

/**
 * "Government" means the role each kind of record names: the providing government of a commitment, the issuer
 * of a clause, the designating government of a designation. `"all"` applies no government filter.
 */
export type LatticeFilter = { kinds: KindVisibility; actor: JurisdictionCode | "all" };

export const ALL_KINDS: KindVisibility = { commitments: true, controls: true, designations: true };
export const NO_FILTER: LatticeFilter = { kinds: ALL_KINDS, actor: "all" };

export type CellView = {
  commitments: LatticeCommitment[];
  /** Funding options: listed apart, never counted as commitments. */
  options: LatticeCommitment[];
  /** Withdrawn or lapsed rows: listed apart, never counted as capital. */
  ended: LatticeCommitment[];
  controls: LatticeControl[];
  designations: LatticeDesignation[];
  counts: { commitments: number; controls: number; designations: number };
  /** Short codes of the governments behind each kind, sorted. */
  actors: { commitments: string[]; controls: string[]; designations: string[] };
};

const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const shortCodes = (rs: readonly { actorShort: string }[]) => [...new Set(rs.map((r) => r.actorShort))].sort(byCodePoint);

function pick<T extends LatticeRecord>(model: LatticeModel, ids: readonly string[], on: boolean, actor: LatticeFilter["actor"]): T[] {
  if (!on) return [];
  return ids.map((id) => model.records[id] as T).filter((r) => r && (actor === "all" || r.actor === actor));
}

/** The cell's records after the filter, or null when the cell holds none of the visible kinds. */
export function cellView(model: LatticeModel, materialId: string, stage: SupplyChainStage, filter: LatticeFilter = NO_FILTER): CellView | null {
  const cell: LatticeCell | undefined = model.cells[cellKey(materialId, stage)];
  if (!cell) return null;
  const commitments = pick<LatticeCommitment>(model, cell.commitments, filter.kinds.commitments, filter.actor);
  const options = pick<LatticeCommitment>(model, cell.options, filter.kinds.commitments, filter.actor);
  const ended = pick<LatticeCommitment>(model, cell.ended, filter.kinds.commitments, filter.actor);
  const controls = pick<LatticeControl>(model, cell.controls, filter.kinds.controls, filter.actor);
  const designations = pick<LatticeDesignation>(model, cell.designations, filter.kinds.designations, filter.actor);
  if (!commitments.length && !options.length && !ended.length && !controls.length && !designations.length) return null;
  return {
    commitments,
    options,
    ended,
    controls,
    designations,
    counts: { commitments: commitments.length, controls: controls.length, designations: designations.length },
    actors: { commitments: shortCodes(commitments), controls: shortCodes(controls), designations: shortCodes(designations) },
  };
}

/** Whether the cell has anything to draw: a counted kind. Options and ended rows alone leave the cell empty. */
export const isMarked = (v: CellView | null): boolean => !!v && (v.counts.commitments > 0 || v.counts.controls > 0 || v.counts.designations > 0);

export type GovernmentRow = {
  actor: JurisdictionCode;
  short: string;
  name: string;
  /** The roles this government plays for the material: "provider", "issuer", "designating government". */
  roles: string[];
  cells: Partial<Record<SupplyChainStage, { commitments: number; controls: number; designations: number }>>;
};

const ROLE_WORD = { commitments: "provider", controls: "issuer", designations: "designating government" } as const;

/** One material split by the government each record names, over the same filter and the same stage columns. */
export function governmentRows(model: LatticeModel, materialId: string, filter: LatticeFilter = NO_FILTER): GovernmentRow[] {
  const rows = new Map<JurisdictionCode, GovernmentRow>();
  for (const stage of model.stages) {
    const v = cellView(model, materialId, stage.id, filter);
    if (!v) continue;
    for (const kind of ["commitments", "controls", "designations"] as const) {
      for (const r of v[kind]) {
        if (!rows.has(r.actor)) {
          const a = model.actors.find((x) => x.code === r.actor);
          rows.set(r.actor, { actor: r.actor, short: r.actorShort, name: a?.name ?? r.actorShort, roles: [], cells: {} });
        }
        const row = rows.get(r.actor)!;
        const cell = (row.cells[stage.id] ??= { commitments: 0, controls: 0, designations: 0 });
        cell[kind]++;
        if (!row.roles.includes(ROLE_WORD[kind])) row.roles.push(ROLE_WORD[kind]);
      }
    }
  }
  return [...rows.values()].sort((a, b) => byCodePoint(a.name, b.name));
}

/** Parse a `material:stage` hash against the model; null when it names no marked cell. */
export function parseSelection(model: LatticeModel, hash: string): { materialId: string; stage: SupplyChainStage } | null {
  const m = /^#?([a-z0-9-]+):([a-z_]+)$/.exec(hash);
  if (!m) return null;
  const stage = model.stages.find((s) => s.id === m[2]);
  const material = model.materials.find((x) => x.id === m[1] || x.slug === m[1]);
  if (!stage || !material) return null;
  return isMarked(cellView(model, material.id, stage.id)) ? { materialId: material.id, stage: stage.id } : null;
}

/** "3 commitments", "1 control clause", "2 designations". */
export const countWord = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The node selected before anyone chooses one: the preferred material and stage when that cell holds a record,
 * otherwise the first marked cell in the model's material and stage order. Null only for an empty model.
 */
export function defaultSelection(
  model: LatticeModel,
  prefer?: { slug: string; stage: SupplyChainStage },
): { materialId: string; stage: SupplyChainStage } | null {
  const want = prefer && model.materials.find((m) => m.slug === prefer.slug);
  if (want && isMarked(cellView(model, want.id, prefer.stage))) return { materialId: want.id, stage: prefer.stage };
  for (const m of model.materials) for (const s of model.stages) if (isMarked(cellView(model, m.id, s.id))) return { materialId: m.id, stage: s.id };
  return null;
}
