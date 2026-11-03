/**
 * The homepage supply-chain strip: for each stage, how many distinct records of each kind the lattice holds at
 * that stage across all materials. Read from the lattice model only, so it inherits its rules: commitments are
 * government commitments that have not ended (options and ended rows are left out), and the three kinds are
 * counted apart and never added together. A record that covers several materials at one stage counts once.
 */
import type { LatticeModel } from "./lattice";
import { supplyChainStageLabels } from "./labels";
import { cellKey } from "./lattice-view";
import type { SupplyChainStage } from "./types";

/** The stages that form the physical chain, in vocabulary order; recycling closes it. */
export const CHAIN_STAGES = [
  "exploration",
  "mining",
  "separation",
  "processing",
  "refining",
  "component_manufacturing",
  "final_manufacturing",
  "recycling",
] as const satisfies readonly SupplyChainStage[];

/** Stages recorded on the lattice that are not links in the physical chain. */
const OUTSIDE_STAGES = ["stockpiling", "research_development", "cross_cutting"] as const satisfies readonly SupplyChainStage[];

export type StageCounts = { stage: SupplyChainStage; label: string; commitments: number; controls: number; designations: number };

function countsAt(model: LatticeModel, stage: SupplyChainStage): StageCounts {
  const ids = { commitments: new Set<string>(), controls: new Set<string>(), designations: new Set<string>() };
  for (const m of model.materials) {
    const cell = model.cells[cellKey(m.id, stage)];
    if (!cell) continue;
    cell.commitments.forEach((id) => ids.commitments.add(id));
    cell.controls.forEach((id) => ids.controls.add(id));
    cell.designations.forEach((id) => ids.designations.add(id));
  }
  return {
    stage,
    label: supplyChainStageLabels[stage],
    commitments: ids.commitments.size,
    controls: ids.controls.size,
    designations: ids.designations.size,
  };
}

export const hasRecords = (c: StageCounts) => c.commitments > 0 || c.controls > 0 || c.designations > 0;

/** Every chain stage (empty ones included, so the chain reads whole) and the outside stages that hold records. */
export function chainStageCounts(model: LatticeModel): { chain: StageCounts[]; outside: StageCounts[] } {
  return {
    chain: CHAIN_STAGES.map((s) => countsAt(model, s)),
    outside: OUTSIDE_STAGES.map((s) => countsAt(model, s)).filter(hasRecords),
  };
}
