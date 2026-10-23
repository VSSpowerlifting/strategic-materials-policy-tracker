/** Browser-safe analytical query contract. Government always means record role,
 * never project geography. Legacy material:stage hashes remain valid. */
import type { LatticeModel } from "./lattice";
import { cellView, defaultSelection, type LatticeFilter } from "./lattice-view";
import type { SupplyChainStage } from "./types";

export const QUERY_KINDS = ["all", "commitments", "controls", "designations", "commitments,controls", "commitments,designations", "controls,designations", "none"] as const;
export type ResearchQuery = {
  selection: { materialId: string; stage: SupplyChainStage } | null;
  filter: LatticeFilter;
  kind: (typeof QUERY_KINDS)[number];
  issues: string[];
};
const keys = ["material", "stage", "government", "kind"] as const;

/** Unrelated parameters are untouched. Repeated, empty and unsupported analytical
 * values fail closed. An explicit empty cell stays selected; it never falls back. */
export function normalizeResearchQuery(model: LatticeModel, input: string, preferred?: { slug: string; stage: SupplyChainStage }): ResearchQuery {
  const url = new URL(input || "/", "https://smpt.invalid");
  const issues: string[] = [];
  const value = (key: typeof keys[number]) => {
    const values = url.searchParams.getAll(key);
    if (values.length > 1) issues.push(`Repeated ${key} parameter.`);
    if (values.length && !values[0].trim()) issues.push(`Empty ${key} parameter.`);
    return values[0] ?? null;
  };
  let material = value("material"), stage = value("stage");
  const government = value("government");
  const rawKind = value("kind");
  const hash = url.hash;
  if (hash && !["#analytical-view", "#main-content", "#selected-evidence"].includes(hash)) {
    const match = /^#([a-z0-9-]+):([a-z_]+)$/.exec(hash);
    if (!match) issues.push("Unsupported analytical selection hash.");
    else {
      const sameMaterial = (a: string, b: string) => model.materials.find(m => m.id === a || m.slug === a)?.id === model.materials.find(m => m.id === b || m.slug === b)?.id;
      if ((material && !sameMaterial(material, match[1])) || (stage && stage !== match[2])) issues.push("Conflicting query and hash selection.");
      material ??= match[1]; stage ??= match[2];
    }
  }
  const actor = government === null || government === "all" ? "all" : model.actors.find(a => a.code.toLowerCase() === government.toLowerCase() || a.short.toLowerCase() === government.toLowerCase())?.code;
  if (!actor) issues.push("Unknown providing, issuing or designating government.");
  const kind = QUERY_KINDS.find(k => k === (rawKind ?? "all"));
  if (!kind) issues.push("Unsupported record kind.");
  let selection: ResearchQuery["selection"] = null;
  if (material !== null || stage !== null) {
    const m = model.materials.find(m => m.id === material || m.slug === material);
    const s = model.stages.find(s => s.id === stage);
    if (!m || !s) issues.push("Select a supported material and stage together.");
    else selection = { materialId: m.id, stage: s.id };
  } else if (!issues.length) selection = defaultSelection(model, preferred);
  return {
    selection: issues.length ? null : selection,
    filter: { actor: actor ?? "all", kinds: {
      commitments: kind === "all" || !!kind?.split(",").includes("commitments"),
      controls: kind === "all" || !!kind?.split(",").includes("controls"),
      designations: kind === "all" || !!kind?.split(",").includes("designations"),
    } },
    kind: kind ?? "none", issues,
  };
}

/** Canonical links use established hashes plus government/kind query parameters. */
export function researchQueryHref(model: LatticeModel, query: ResearchQuery, pathname: string, existing = ""): string {
  const url = new URL(existing || pathname, "https://smpt.invalid");
  url.pathname = pathname;
  for (const key of keys) url.searchParams.delete(key);
  if (query.filter.actor !== "all") url.searchParams.set("government", query.filter.actor);
  if (query.kind !== "all") url.searchParams.set("kind", query.kind);
  const material = model.materials.find(m => m.id === query.selection?.materialId);
  url.hash = material && query.selection ? `${material.slug}:${query.selection.stage}` : "";
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Canonical directly counted IDs; context, options and ended rows stay apart. */
export function researchQueryResult(model: LatticeModel, query: ResearchQuery) {
  const view = !query.issues.length && query.selection ? cellView(model, query.selection.materialId, query.selection.stage, query.filter) : null;
  return {
    view,
    recordIds: {
      commitments: view?.commitments.map(r => r.id) ?? [],
      controls: view?.controls.map(r => r.id) ?? [],
      designations: view?.designations.map(r => r.id) ?? [],
    },
    optionIds: view?.options.map(r => r.id) ?? [],
    endedIds: view?.ended.map(r => r.id) ?? [],
  };
}
