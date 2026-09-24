/**
 * Capital intelligence (v0.6): what the organization, project and programme
 * registries let the corpus answer, derived from the financial rows that point
 * at them. Pure and deterministic, like lib/capital-control.ts: "today" is
 * always an argument, and the site passes `site.lastUpdated`.
 *
 * Every money figure here comes from `totalCommitments`, one value role and
 * one currency at a time, under the v0.5 counting rules. Nothing in this
 * module adds a stack into one grand total, divides one figure by another
 * (no public share, leverage, crowding-in or utilisation rate), or converts a
 * currency. Where a view needs a size, it counts records, never money.
 */
import {
  LISTED_NOT_SUMMED_ROLES,
  PUBLIC_CAPITAL_SOURCES,
  childLinks,
  controlIssuer,
  controlStatusOn,
  currentFinancialStatus,
  isBinding,
  totalCommitments,
  type CommitmentTotals,
} from "./capital-control";
import {
  getAllControlMeasures,
  getAllFinancialCommitments,
  getAllOrganizations,
  getAllProgrammes,
  getAllProjectDesignations,
  getAllProjects,
  getOrganizationById,
  getProgrammeById,
  getProjectById,
} from "./data";
import type {
  ControlMeasure,
  ControlStatus,
  FinancialCommitment,
  JurisdictionCode,
  Organization,
  Programme,
  Project,
  ProjectDesignation,
  SupplyChainStage,
  ValueRole,
} from "./types";
import { SUPPLY_CHAIN_STAGES } from "./types";

const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// --- Home territory -------------------------------------------------------------------

/** The 27 EU member states, as ISO 3166-1 alpha-2 codes (Greece is GR). */
export const EU_MEMBER_STATES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU",
  "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
] as const;

/**
 * Where each tracked actor's money counts as staying at home. The United
 * Kingdom's ISO code is GB. Greenland (GL) is not in the EU. "other" has no
 * home territory, so its rows are never classed as domestic.
 */
export const ACTOR_HOME_COUNTRIES: Readonly<Record<JurisdictionCode, readonly string[]>> = {
  china: ["CN"],
  us: ["US"],
  eu: EU_MEMBER_STATES,
  australia: ["AU"],
  japan: ["JP"],
  canada: ["CA"],
  uk: ["GB"],
  india: ["IN"],
  other: [],
};

export type Geography = "domestic" | "abroad" | "domestic_and_abroad" | "not_stated";

export type RowGeography = {
  geography: Geography;
  /** Country codes the classification rests on, sorted. */
  countries: string[];
  /**
   * Where they come from: the row's own locations, its project's, or (for a
   * package that states none) the locations its parts or their projects
   * state. Null when nothing is stated.
   */
  basis: "row" | "project" | "parts" | null;
};

/** Country codes a row states, directly or through its project. */
function statedCountries(c: FinancialCommitment): { countries: string[]; basis: "row" | "project" | null } {
  const own = c.locations.flatMap((l) => (l.countryCode ? [l.countryCode] : []));
  if (own.length) return { countries: own, basis: "row" };
  const project = c.projectId ? getProjectById(c.projectId) : undefined;
  const fromProject = project ? project.locations.flatMap((l) => (l.countryCode ? [l.countryCode] : [])) : [];
  return fromProject.length ? { countries: fromProject, basis: "project" } : { countries: [], basis: null };
}

/**
 * Where a government's money goes, relative to its home territory. The row's
 * own stated locations are used first, then its project's; a package that
 * states neither takes the locations its parts state, since the package is
 * the sum of them. A location with no country code, or no location at all,
 * is "not stated", never guessed.
 */
export function rowGeography(
  c: FinancialCommitment,
  actor: JurisdictionCode | null = c.providerJurisdiction,
  all: readonly FinancialCommitment[] = getAllFinancialCommitments(),
): RowGeography | null {
  if (!actor) return null;
  let { countries, basis }: { countries: string[]; basis: RowGeography["basis"] } = statedCountries(c);
  if (!countries.length) {
    const parts = childLinks(c.id, all).filter((l) => l.relationship === "part_of");
    const fromParts = parts.flatMap((l) => statedCountries(l.commitment).countries);
    // Only when every part states a country: otherwise the package's reach is partly unknown.
    if (parts.length && parts.every((l) => statedCountries(l.commitment).countries.length)) {
      countries = fromParts;
      basis = "parts";
    }
  }
  const distinct = [...new Set(countries)].sort(byCodePoint);
  if (!distinct.length) return { geography: "not_stated", countries: [], basis: null };
  const home = ACTOR_HOME_COUNTRIES[actor];
  const inside = distinct.filter((cc) => home.includes(cc)).length;
  const geography: Geography = inside === distinct.length ? "domestic" : inside === 0 ? "abroad" : "domestic_and_abroad";
  return { geography, countries: distinct, basis };
}

// --- Organization graph ---------------------------------------------------------------

/** Organizations that are part of this one, transitively (offices of a department). Joint vehicles are not. */
export function partOfDescendants(id: string, orgs: readonly Organization[] = getAllOrganizations()): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const o of orgs)
      if (!out.has(o.id) && o.parents.some((p) => p.relationship === "part_of" && p.organizationId === cur)) {
        out.add(o.id);
        stack.push(o.id);
      }
  }
  return out;
}

/** Organizations this one was established by or is part of, one level up. */
export function parentOrganizations(o: Organization): { organization: Organization; relationship: Organization["parents"][number]["relationship"] }[] {
  return o.parents.flatMap((p) => {
    const organization = getOrganizationById(p.organizationId);
    return organization ? [{ organization, relationship: p.relationship }] : [];
  });
}

/** Organizations that name this one as a parent, with the link type. */
export function childOrganizations(id: string): { organization: Organization; relationship: Organization["parents"][number]["relationship"] }[] {
  return getAllOrganizations().flatMap((o) =>
    o.parents.filter((p) => p.organizationId === id).map((p) => ({ organization: o, relationship: p.relationship })),
  );
}

export type OrganizationRoles = {
  /** Rows this organization provides, or an office that is part of it provides. */
  provided: FinancialCommitment[];
  /** Rows this organization receives. */
  received: FinancialCommitment[];
  sponsoredProjects: Project[];
  administeredProgrammes: Programme[];
  heldDesignations: ProjectDesignation[];
  /** Organizations whose rows are rolled into `provided` (itself first). */
  rolledUpIds: string[];
};

export function organizationRoles(id: string, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): OrganizationRoles {
  const rolledUpIds = [id, ...[...partOfDescendants(id)].sort(byCodePoint)];
  const rolled = new Set(rolledUpIds);
  return {
    provided: all.filter((c) => c.providerOrgIds.some((o) => rolled.has(o))),
    received: all.filter((c) => c.recipientOrgIds.includes(id)),
    sponsoredProjects: getAllProjects().filter((p) => p.sponsorOrgIds.includes(id)),
    administeredProgrammes: getAllProgrammes().filter((g) => g.administeringOrgIds.includes(id)),
    heldDesignations: getAllProjectDesignations().filter((d) => d.holderOrgIds.includes(id)),
    rolledUpIds,
  };
}

// --- Value-role layers ---------------------------------------------------------------------

/**
 * One layer of a stack or portfolio: rows of a single value role and capital
 * grouping. Only layers of committed money carry totals, and each total is
 * one `totalCommitments` call over rows of that one role.
 */
export type Layer = {
  key: LayerKey;
  rows: FinancialCommitment[];
  /** Per-currency totals; null for layers that are listed, never summed. */
  totals: CommitmentTotals | null;
};

export const LAYER_KEYS = [
  "public_commitment", // committed to a recipient by a government or public enterprise: summed
  "joint_vehicle_commitment", // committed by a joint vehicle whose public share is not stated: summed apart
  "other_commitment", // committed, but private or of unstated source: listed
  "funding_option", // listed, never summed
  "envelope", // envelopes, appropriations and lending authorities: listed, never summed
  "private_financing",
  "recipient_own_funds",
  "expected_co_investment",
  "total_project_cost",
] as const;
export type LayerKey = (typeof LAYER_KEYS)[number];

/** Layers whose rows may be added up (per currency, under the counting rules). */
export const SUMMED_LAYERS: readonly LayerKey[] = ["public_commitment", "joint_vehicle_commitment"];

export function layerOf(c: FinancialCommitment): LayerKey {
  if (c.valueRole === "commitment") {
    if (PUBLIC_CAPITAL_SOURCES.includes(c.capitalSource)) return "public_commitment";
    if (c.capitalSource === "mixed_vehicle") return "joint_vehicle_commitment";
    return "other_commitment";
  }
  if (c.valueRole === "funding_option") return "funding_option";
  if (LISTED_NOT_SUMMED_ROLES.includes(c.valueRole)) return "envelope";
  return c.valueRole as Exclude<ValueRole, "commitment" | "funding_option" | "program_envelope" | "budget_appropriation" | "lending_authority">;
}

/** Splits rows into layers, in LAYER_KEYS order, leaving out empty ones. */
export function layers(rows: readonly FinancialCommitment[], all: readonly FinancialCommitment[] = getAllFinancialCommitments()): Layer[] {
  return LAYER_KEYS.flatMap((key) => {
    const inLayer = rows.filter((c) => layerOf(c) === key);
    if (!inLayer.length) return [];
    return [{ key, rows: inLayer, totals: SUMMED_LAYERS.includes(key) ? totalCommitments(inLayer, all) : null }];
  });
}

// --- Projects: capital stack and co-investment --------------------------------------------

export type ProjectStack = {
  project: Project;
  rows: FinancialCommitment[];
  layers: Layer[];
  /** Tracked governments behind the project's rows, from providerJurisdiction only. */
  governments: JurisdictionCode[];
  providerOrgIds: string[];
  designations: ProjectDesignation[];
  /** The latest dated implementation entry any of its rows records, with the row it came from. */
  latestImplementation: { status: string; date: string; rowId: string; sourceId: string } | null;
};

export function projectStack(id: string, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): ProjectStack | null {
  const project = getProjectById(id);
  if (!project) return null;
  const rows = all.filter((c) => c.projectId === id);
  const governments = [...new Set(rows.flatMap((c) => (c.providerJurisdiction ? [c.providerJurisdiction] : [])))].sort(byCodePoint);
  const providerOrgIds = [...new Set(rows.flatMap((c) => c.providerOrgIds))].sort(byCodePoint);
  let latestImplementation: ProjectStack["latestImplementation"] = null;
  for (const c of rows)
    for (const e of c.implementationStatusHistory)
      if (e.date && (!latestImplementation || e.date > latestImplementation.date))
        latestImplementation = { status: e.status, date: e.date, rowId: c.id, sourceId: e.sourceId };
  return {
    project,
    rows,
    layers: layers(rows, all),
    governments,
    providerOrgIds,
    designations: getAllProjectDesignations().filter((d) => d.projectId === id),
    latestImplementation,
  };
}

export type CoInvestmentKind = "cross_government" | "public_and_private" | "several_public_bodies";

export type CoInvestment = {
  project: Project;
  kinds: CoInvestmentKind[];
  governments: JurisdictionCode[];
  providerOrgIds: string[];
  rowIds: string[];
};

/**
 * Projects with more than one provider of capital, by kind: more than one
 * government; public money alongside private financing or a recipient's own
 * funds; or several public bodies of one government. Envelopes and
 * total project cost are not capital provided, so they do not count.
 */
export function coInvestments(all: readonly FinancialCommitment[] = getAllFinancialCommitments()): CoInvestment[] {
  const out: CoInvestment[] = [];
  for (const project of getAllProjects()) {
    const rows = all.filter(
      (c) => c.projectId === project.id && !["program_envelope", "budget_appropriation", "lending_authority", "total_project_cost"].includes(c.valueRole),
    );
    const publicRows = rows.filter((c) => c.providerJurisdiction !== null);
    const privateRows = rows.filter((c) => c.providerJurisdiction === null && ["private_financing", "recipient_own_funds"].includes(c.valueRole));
    const governments = [...new Set(publicRows.map((c) => c.providerJurisdiction!))].sort(byCodePoint);
    const publicOrgs = [...new Set(publicRows.flatMap((c) => c.providerOrgIds))].sort(byCodePoint);
    const kinds: CoInvestmentKind[] = [];
    if (governments.length > 1) kinds.push("cross_government");
    if (publicRows.length && privateRows.length) kinds.push("public_and_private");
    if (governments.length === 1 && publicOrgs.length > 1) kinds.push("several_public_bodies");
    if (kinds.length)
      out.push({
        project,
        kinds,
        governments,
        providerOrgIds: [...new Set(rows.flatMap((c) => c.providerOrgIds))].sort(byCodePoint),
        rowIds: rows.map((c) => c.id),
      });
  }
  return out;
}

// --- Programmes: envelopes beside recorded awards ------------------------------------------

export function programmeDescendants(id: string, programmes: readonly Programme[] = getAllProgrammes()): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const g of programmes)
      if (g.parentProgrammeId === cur && !out.has(g.id)) {
        out.add(g.id);
        stack.push(g.id);
      }
  }
  return out;
}

export type ProgrammeLedger = {
  programme: Programme;
  parent: Programme | null;
  children: Programme[];
  /** Every row under this programme or one beneath it. */
  rows: FinancialCommitment[];
  /** Ceilings: envelopes, appropriations and lending authorities. Listed, never summed. */
  envelopes: FinancialCommitment[];
  /**
   * Committed rows recorded under the programme, summed per currency under the
   * counting rules. This is what the corpus records, not the programme's
   * total spend, and it is never divided by an envelope.
   */
  recordedAwards: Layer | null;
  otherLayers: Layer[];
  designations: ProjectDesignation[];
};

export function programmeLedger(id: string, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): ProgrammeLedger | null {
  const programme = getProgrammeById(id);
  if (!programme) return null;
  const scope = new Set([id, ...programmeDescendants(id)]);
  const rows = all.filter((c) => c.programmeId !== null && scope.has(c.programmeId));
  const ls = layers(rows, all);
  return {
    programme,
    parent: programme.parentProgrammeId ? getProgrammeById(programme.parentProgrammeId) ?? null : null,
    children: getAllProgrammes().filter((g) => g.parentProgrammeId === id),
    rows,
    envelopes: rows.filter((c) => layerOf(c) === "envelope"),
    recordedAwards: ls.find((l) => l.key === "public_commitment") ?? null,
    otherLayers: ls.filter((l) => l.key !== "public_commitment" && l.key !== "envelope"),
    designations: getAllProjectDesignations().filter((d) => scope.has(d.programmeId)),
  };
}

// --- Portfolios by actor -------------------------------------------------------------------------

const tally = <K extends string>(keys: readonly K[]): Record<K, number> => Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;

export type ActorPortfolio = {
  actor: JurisdictionCode;
  rowIds: string[];
  /** Public commitments to recipients, per currency. */
  publicTotals: CommitmentTotals;
  /** Joint-vehicle commitments, per currency, kept apart from public money. */
  jointVehicleTotals: CommitmentTotals;
  /** Record counts, never money. */
  counts: {
    rows: number;
    byLayer: Record<LayerKey, number>;
    byInstrument: Record<string, number>;
    /** Committed rows (any capital source) under a binding agreement, or not yet. */
    committedBinding: number;
    committedNotYetBinding: number;
    byGeography: Record<Geography, number>;
    byStage: Record<SupplyChainStage, number>;
    byMaterial: Record<string, number>;
    providerOrganizations: number;
    recipientOrganizations: number;
    projects: number;
    programmes: number;
    designations: number;
  };
};

/**
 * One tracked government's capital, from `providerJurisdiction` only. A
 * part of a package is counted once, inside its package, in every record
 * count here, so a three-part package is one row of "equity, loans" and not
 * three; the per-currency totals apply the same rule themselves.
 */
export function actorPortfolio(actor: JurisdictionCode, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): ActorPortfolio {
  const rows = all.filter((c) => c.providerJurisdiction === actor);
  const inScope = new Set(rows.map((c) => c.id));
  // Record counts fold a part into its package when the package is in scope.
  const counted = rows.filter((c) => !c.relationships.some((r) => r.relationship === "part_of" && inScope.has(r.commitmentId)));
  const byLayer = tally(LAYER_KEYS);
  const byGeography = tally(["domestic", "abroad", "domestic_and_abroad", "not_stated"] as const);
  const byStage = tally(SUPPLY_CHAIN_STAGES);
  const byInstrument: Record<string, number> = {};
  const byMaterial: Record<string, number> = {};
  let committedBinding = 0;
  let committedNotYetBinding = 0;
  for (const c of counted) {
    byLayer[layerOf(c)]++;
    byInstrument[c.instrument] = (byInstrument[c.instrument] ?? 0) + 1;
    for (const s of new Set(c.stages)) byStage[s]++;
    for (const m of new Set(c.materialIds)) byMaterial[m] = (byMaterial[m] ?? 0) + 1;
    if (c.valueRole === "commitment") {
      if (isBinding(c)) committedBinding++;
      else committedNotYetBinding++;
      byGeography[rowGeography(c, actor, all)!.geography]++;
    }
  }
  const committedPublic = rows.filter((c) => layerOf(c) === "public_commitment");
  const committedJoint = rows.filter((c) => layerOf(c) === "joint_vehicle_commitment");
  const programmes = new Set(getAllProgrammes().filter((g) => g.actor === actor).map((g) => g.id));
  return {
    actor,
    rowIds: rows.map((c) => c.id),
    publicTotals: totalCommitments(committedPublic, all),
    jointVehicleTotals: totalCommitments(committedJoint, all),
    counts: {
      rows: counted.length,
      byLayer,
      byInstrument,
      committedBinding,
      committedNotYetBinding,
      byGeography,
      byStage,
      byMaterial,
      providerOrganizations: new Set(rows.flatMap((c) => c.providerOrgIds)).size,
      recipientOrganizations: new Set(rows.flatMap((c) => c.recipientOrgIds)).size,
      projects: new Set(rows.flatMap((c) => (c.projectId ? [c.projectId] : []))).size,
      programmes: programmes.size,
      designations: getAllProjectDesignations().filter((d) => programmes.has(d.programmeId)).length,
    },
  };
}

/** Actors that provide at least one row, in the taxonomy's order. */
export function actorsWithCapital(all: readonly FinancialCommitment[] = getAllFinancialCommitments()): JurisdictionCode[] {
  const present = new Set(all.flatMap((c) => (c.providerJurisdiction ? [c.providerJurisdiction] : [])));
  return (["us", "eu", "japan", "australia", "canada", "uk", "india", "china", "other"] as const).filter((j) => present.has(j));
}

// --- Flows: from a government to where its money is aimed -----------------------------------

export type FlowCell = { actor: JurisdictionCode; destination: string; rowIds: string[] };

/**
 * Committed rows from each tracked government to each destination country,
 * or "not_stated". Counts records: a package counts once, with its parts
 * folded in, and a row aimed at two countries appears under both.
 */
export function capitalFlows(all: readonly FinancialCommitment[] = getAllFinancialCommitments()): FlowCell[] {
  const cells = new Map<string, FlowCell>();
  for (const c of all) {
    if (!c.providerJurisdiction || c.valueRole !== "commitment") continue;
    if (c.relationships.some((r) => r.relationship === "part_of")) continue;
    const g = rowGeography(c, c.providerJurisdiction, all)!;
    for (const destination of g.countries.length ? g.countries : ["not_stated"]) {
      const key = `${c.providerJurisdiction}\u0000${destination}`;
      if (!cells.has(key)) cells.set(key, { actor: c.providerJurisdiction, destination, rowIds: [] });
      cells.get(key)!.rowIds.push(c.id);
    }
  }
  return [...cells.values()].sort((a, b) => byCodePoint(a.actor, b.actor) || byCodePoint(a.destination, b.destination));
}

// --- Stage response map: capital and controls at the same material and stage -----------------

export type ResponseCell = {
  /** Government-provided committed rows and funding options at this material and stage, packages counted once. */
  capitalIds: string[];
  capitalActors: JurisdictionCode[];
  /** Control clauses whose covered items sit at this material and stage, by issuer. */
  controlIds: string[];
  controlsByIssuer: Partial<Record<JurisdictionCode, string[]>>;
  /** Of those clauses, how many had each status on the as-of date. */
  controlStatuses: Partial<Record<ControlStatus, number>>;
};

/**
 * For each tracked material and supply-chain stage: the capital aimed there
 * and the control clauses whose covered items sit there. Record counts only,
 * never money, and a control's stage is where its items belong, not a claim
 * that the clause restricts that stage.
 */
export function stageResponseMap(asOf: string, all: readonly FinancialCommitment[] = getAllFinancialCommitments(), controls: readonly ControlMeasure[] = getAllControlMeasures()) {
  const out = new Map<string, Map<SupplyChainStage, ResponseCell>>();
  const cell = (mat: string, stage: SupplyChainStage) => {
    if (!out.has(mat)) out.set(mat, new Map());
    const row = out.get(mat)!;
    if (!row.has(stage)) row.set(stage, { capitalIds: [], capitalActors: [], controlIds: [], controlsByIssuer: {}, controlStatuses: {} });
    return row.get(stage)!;
  };
  for (const c of all) {
    if (!c.providerJurisdiction || !["commitment", "funding_option"].includes(c.valueRole)) continue;
    if (c.relationships.some((r) => r.relationship === "part_of")) continue;
    for (const mat of c.materialIds)
      for (const stage of new Set(c.stages)) {
        const x = cell(mat, stage);
        x.capitalIds.push(c.id);
        if (!x.capitalActors.includes(c.providerJurisdiction)) x.capitalActors.push(c.providerJurisdiction);
      }
  }
  for (const m of controls) {
    const issuer = controlIssuer(m);
    const status = controlStatusOn(m, asOf);
    for (const mat of m.materialIds)
      for (const stage of new Set(m.controlledStages)) {
        const x = cell(mat, stage);
        x.controlIds.push(m.id);
        (x.controlsByIssuer[issuer] ??= []).push(m.id);
        if (status) x.controlStatuses[status] = (x.controlStatuses[status] ?? 0) + 1;
      }
  }
  for (const row of out.values()) for (const x of row.values()) x.capitalActors.sort(byCodePoint);
  return out;
}

/**
 * Control clauses whose covered items share a material and a stage with the
 * project. Returned with their status on `asOf`. This says the items overlap;
 * it does not say the project is affected, which depends on facts the corpus
 * does not hold (inputs, destinations, licences).
 */
export function controlsAtProjectStages(project: Project, asOf: string): { measure: ControlMeasure; status: ControlStatus | null }[] {
  return getAllControlMeasures()
    .filter(
      (m) => m.materialIds.some((x) => project.materialIds.includes(x)) && m.controlledStages.some((s) => project.stages.includes(s)),
    )
    .map((measure) => ({ measure, status: controlStatusOn(measure, asOf) }));
}

// --- Small helpers for pages -----------------------------------------------------------------

/** The financial status of each row, for list rendering. */
export const statusOf = currentFinancialStatus;

/** Rows drawn from or part of this one, for the drawdown list on a programme page. */
export { childLinks };
