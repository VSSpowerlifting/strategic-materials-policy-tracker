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
  byIdOf,
  childLinks,
  controlIssuer,
  controlStatusOn,
  currentFinancialStatus,
  isEnded,
  isFoldedPart,
  legalStanding,
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
import { NO_ITEM_MEASURE_TYPES, SUPPLY_CHAIN_STAGES } from "./types";

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
  "indication", // non-binding letters of intent or interest: listed, never summed, never capital or backing
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

/**
 * A row that can back a project or sit in a portfolio's capital: it has not ended, it is not a funding
 * option and it is not a non-binding indication. An option is a right to call on money, never money that
 * moved; an exercise is its own row, and that row backs. An indication (a letter of intent or interest) is
 * possible support that nobody has committed, so it backs nothing and makes no one a backer. Ended, option
 * and indication rows stay listed wherever they appear, with their status or role.
 */
export const isBackingRow = (c: FinancialCommitment): boolean =>
  !isEnded(c) && c.valueRole !== "funding_option" && c.valueRole !== "indication";

export type ProjectStack = {
  project: Project;
  rows: FinancialCommitment[];
  layers: Layer[];
  /** Tracked governments behind the project's rows, from providerJurisdiction only. */
  governments: JurisdictionCode[];
  providerOrgIds: string[];
  designations: ProjectDesignation[];
  /**
   * The project's latest physical status: each row's current implementation entry (a history lists entries
   * oldest first, so the last), and the one that ranks latest across rows, with the row it came from.
   * An entry ranks by its own date or, when the source gives none, by the date of the nearest earlier dated
   * entry in its own row. That date only orders entries: `date` stays null for an undated entry and is never
   * filled in. Where ranks are equal an undated entry, which follows the entry it is placed after, outranks a
   * dated one; an undated entry with no dated entry before it in its row ranks below every dated entry, since
   * nothing shows it is later; any tie left is broken by the corpus order of the rows.
   */
  latestImplementation: { status: string; date: string | null; rowId: string; sourceId: string } | null;
};

export function projectStack(id: string, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): ProjectStack | null {
  const project = getProjectById(id);
  if (!project) return null;
  const rows = all.filter((c) => c.projectId === id);
  // Who stands behind the project: providers of rows that have not ended. A withdrawn or lapsed row keeps its
  // place in the stack (with its status) but no longer backs the project, and a funding option is standing,
  // not backing, until a commitment drawn from it is recorded (that draw is its own row here).
  const backing = rows.filter(isBackingRow);
  const governments = [...new Set(backing.flatMap((c) => (c.providerJurisdiction ? [c.providerJurisdiction] : [])))].sort(byCodePoint);
  const providerOrgIds = [...new Set(backing.flatMap((c) => c.providerOrgIds))].sort(byCodePoint);
  let latestImplementation: ProjectStack["latestImplementation"] = null;
  let best: { anchor: string; undated: number } | null = null;
  for (const c of rows) {
    const history = c.implementationStatusHistory;
    const current = history.at(-1);
    if (!current) continue;
    const anchor = current.date ?? [...history].reverse().find((e) => e.date)?.date ?? "";
    const undated = current.date ? 0 : 1;
    if (!best || anchor > best.anchor || (anchor === best.anchor && undated > best.undated)) {
      best = { anchor, undated };
      latestImplementation = { status: current.status, date: current.date ?? null, rowId: c.id, sourceId: current.sourceId };
    }
  }
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

export type CoInvestmentKind = "cross_government" | "public_and_private" | "several_public_bodies" | "capital_and_designation";

export type CoInvestment = {
  project: Project;
  kinds: CoInvestmentKind[];
  /** Governments providing capital (from providerJurisdiction). */
  governments: JurisdictionCode[];
  /** Governments whose schemes recognize the project (from the designation's programme). */
  designatingGovernments: JurisdictionCode[];
  providerOrgIds: string[];
  /** The rows the kinds rest on: capital that has not ended, and no funding option. */
  rowIds: string[];
  /** Funding options on the project: listed as options, and no part of any kind above. */
  optionIds: string[];
  /** Withdrawn or lapsed rows on the project: listed, and no part of any kind above. */
  endedIds: string[];
  designationIds: string[];
};

/**
 * Projects with more than one backer, by kind: more than one government's
 * capital; public money alongside private financing or a recipient's own
 * funds; several public bodies of one government; or public capital
 * (a government's, or a multilateral lender's) alongside a designation
 * (standing, not money). Envelopes and total project
 * cost are not capital provided, so they do not count. Neither does a row
 * that has ended (a commitment letter that lapsed undrawn backs nothing) or a
 * funding option (a right to call on money is not money that moved): an
 * exercise is its own commitment and counts as one.
 */
export function coInvestments(all: readonly FinancialCommitment[] = getAllFinancialCommitments()): CoInvestment[] {
  const out: CoInvestment[] = [];
  for (const project of getAllProjects()) {
    const onProject = all.filter(
      (c) => c.projectId === project.id && !["program_envelope", "budget_appropriation", "lending_authority", "total_project_cost"].includes(c.valueRole),
    );
    const rows = onProject.filter(isBackingRow);
    const publicRows = rows.filter((c) => c.providerJurisdiction !== null);
    const privateRows = rows.filter((c) => c.providerJurisdiction === null && ["private_financing", "recipient_own_funds"].includes(c.valueRole));
    const governments = [...new Set(publicRows.map((c) => c.providerJurisdiction!))].sort(byCodePoint);
    const publicOrgs = [...new Set(publicRows.flatMap((c) => c.providerOrgIds))].sort(byCodePoint);
    // A government outside the tracked actors (Germany, say) still counts as a second government:
    // its public rows are identified by their provider organizations' government kind and country.
    const untrackedGovernments = new Set(
      rows
        .filter((c) => c.providerJurisdiction === null && PUBLIC_CAPITAL_SOURCES.includes(c.capitalSource))
        .flatMap((c) => c.providerOrgIds.map((id) => getOrganizationById(id)).filter((o) => o?.kind === "government" && o.countryCode))
        .map((o) => o!.countryCode!),
    );
    const kinds: CoInvestmentKind[] = [];
    if (governments.length + untrackedGovernments.size > 1) kinds.push("cross_government");
    if (publicRows.length && privateRows.length) kinds.push("public_and_private");
    if (governments.length === 1 && publicOrgs.length > 1) kinds.push("several_public_bodies");
    const designations = getAllProjectDesignations().filter((d) => d.projectId === project.id);
    // Public capital here includes multilateral money (a public financier no tracked government owns).
    const publicCapital = rows.filter((c) => c.providerJurisdiction !== null || PUBLIC_CAPITAL_SOURCES.includes(c.capitalSource));
    if (publicCapital.length && designations.length) kinds.push("capital_and_designation");
    if (kinds.length)
      out.push({
        project,
        kinds,
        governments,
        designatingGovernments: [
          ...new Set(designations.flatMap((d) => {
            const g = getProgrammeById(d.programmeId);
            return g ? [g.actor] : [];
          })),
        ].sort(byCodePoint),
        providerOrgIds: [...new Set(rows.flatMap((c) => c.providerOrgIds))].sort(byCodePoint),
        rowIds: rows.map((c) => c.id),
        optionIds: onProject.filter((c) => !isEnded(c) && c.valueRole === "funding_option").map((c) => c.id),
        endedIds: onProject.filter(isEnded).map((c) => c.id),
        designationIds: designations.map((d) => d.id),
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
  /**
   * Record counts, never money. Every count but `ended` is of rows that have not ended, and every count but
   * `byLayer` leaves funding options and non-binding indications out (each is counted once, in its own layer,
   * and never as the instrument, stage or material it would fund if called on or if it came to anything).
   * `byInstrument`, `byStage` and `byMaterial` hold every other value role (commitments, envelopes,
   * appropriations, private financing and the rest), not only commitments. `byInstrument` counts a package once; `byStage` and `byMaterial` count per cell, so a part is
   * counted at a stage or material its package does not cover and never twice where both cover it.
   */
  counts: {
    rows: number;
    /** Rows that withdrew or lapsed: counted here and nowhere else, a package with its parts once. */
    ended: number;
    byLayer: Record<LayerKey, number>;
    byInstrument: Record<string, number>;
    /**
     * Committed rows (any capital source) by legal standing. A row whose status the source does not give is
     * neither binding nor not yet binding; an ended committed row is neither.
     */
    committedBinding: number;
    committedNotYetBinding: number;
    committedStatusNotStated: number;
    committedEnded: number;
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
 * part of a package is counted once, inside its package, in `rows`, the layers,
 * the instrument and the legal standing, so a three-part package is one row of
 * "equity, loans" and not three; the per-currency totals apply the same rule
 * themselves. Stage and material are counted per cell instead (see `counts`).
 */
export function actorPortfolio(actor: JurisdictionCode, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): ActorPortfolio {
  const rows = all.filter((c) => c.providerJurisdiction === actor);
  // Record counts fold a part into its package when the package is in scope and has not ended: an ended
  // package does not hide a part that is still standing, and an ended part is counted as ended.
  // The package must sit in the same layer, so a commitment under an envelope is still a commitment of its own.
  const foldable = (group: readonly FinancialCommitment[]) => {
    const byId = new Map(group.map((c) => [c.id, c]));
    return group.filter((c) => {
      const packageRow = (r: FinancialCommitment["relationships"][number]) => byId.get(r.commitmentId);
      return !c.relationships.some((r) => r.relationship === "part_of" && packageRow(r) && layerOf(packageRow(r)!) === layerOf(c));
    });
  };
  const counted = foldable(rows.filter((c) => !isEnded(c)));
  const endedCounted = foldable(rows.filter(isEnded));
  const byLayer = tally(LAYER_KEYS);
  const byGeography = tally(["domestic", "abroad", "domestic_and_abroad", "not_stated"] as const);
  const byStage = tally(SUPPLY_CHAIN_STAGES);
  const byInstrument: Record<string, number> = {};
  const byMaterial: Record<string, number> = {};
  const standing = { binding: 0, not_yet_binding: 0, status_not_stated: 0, ended: 0 };
  for (const c of counted) {
    byLayer[layerOf(c)]++;
    if (c.valueRole === "funding_option" || c.valueRole === "indication") continue;
    byInstrument[c.instrument] = (byInstrument[c.instrument] ?? 0) + 1;
    if (c.valueRole === "commitment") {
      standing[legalStanding(c)]++;
      byGeography[rowGeography(c, actor, all)!.geography]++;
    }
  }
  // Stage and material are counted per cell: a part folds only where a standing package of the same layer
  // (and, being this actor's rows, the same provider) covers that stage or material, so a part that reaches
  // beyond its package is counted at the stage or material the package does not cover, and never twice
  // where both cover it. `rows` above is unchanged. Funding options and indications are left out, as everywhere here.
  const standingRows = rows.filter((c) => !isEnded(c) && c.valueRole !== "funding_option" && c.valueRole !== "indication");
  const standingById = new Map(standingRows.map((c) => [c.id, c]));
  const coveredByPackage = (c: FinancialCommitment, covers: (p: FinancialCommitment) => boolean) =>
    isFoldedPart(c, standingById, (p) => layerOf(p) === layerOf(c) && covers(p));
  for (const c of standingRows) {
    for (const st of new Set(c.stages)) if (!coveredByPackage(c, (p) => p.stages.includes(st))) byStage[st]++;
    for (const m of new Set(c.materialIds)) if (!coveredByPackage(c, (p) => p.materialIds.includes(m))) byMaterial[m] = (byMaterial[m] ?? 0) + 1;
  }
  standing.ended = endedCounted.filter((c) => c.valueRole === "commitment").length;
  const backing = rows.filter(isBackingRow);
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
      ended: endedCounted.length,
      byLayer,
      byInstrument,
      committedBinding: standing.binding,
      committedNotYetBinding: standing.not_yet_binding,
      committedStatusNotStated: standing.status_not_stated,
      committedEnded: standing.ended,
      byGeography,
      byStage,
      byMaterial,
      providerOrganizations: new Set(backing.flatMap((c) => c.providerOrgIds)).size,
      recipientOrganizations: new Set(backing.flatMap((c) => c.recipientOrgIds)).size,
      projects: new Set(backing.flatMap((c) => (c.projectId ? [c.projectId] : []))).size,
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

// --- Designations by actor: recognition without money -------------------------------------

/** Where a designated project is, relative to the designating government's home territory. */
export function designationGeography(d: ProjectDesignation, actor: JurisdictionCode): RowGeography {
  const own = d.locations.flatMap((l) => (l.countryCode ? [l.countryCode] : []));
  const project = getProjectById(d.projectId);
  const fromProject = project ? project.locations.flatMap((l) => (l.countryCode ? [l.countryCode] : [])) : [];
  const [countries, basis] = own.length ? [own, "row" as const] : fromProject.length ? [fromProject, "project" as const] : [[], null];
  const distinct = [...new Set(countries)].sort(byCodePoint);
  if (!distinct.length) return { geography: "not_stated", countries: [], basis: null };
  const home = ACTOR_HOME_COUNTRIES[actor];
  const inside = distinct.filter((cc) => home.includes(cc)).length;
  return { geography: inside === distinct.length ? "domestic" : inside === 0 ? "abroad" : "domestic_and_abroad", countries: distinct, basis };
}

export type DesignationPortfolio = {
  actor: JurisdictionCode;
  designationIds: string[];
  /** Record counts, never money. */
  counts: {
    designations: number;
    byGeography: Record<Geography, number>;
    byCountry: Record<string, number>;
    byStage: Record<SupplyChainStage, number>;
    /** Designations with no supply-chain stage: substitution projects. */
    noStage: number;
    byMaterial: Record<string, number>;
    holders: number;
    /** Designated projects that also carry a financial row from any provider that has not ended (an option alone is not capital). */
    projectsWithCapital: number;
  };
};

/** One government's project designations, through the programmes it runs. */
export function designationPortfolio(actor: JurisdictionCode, all: readonly FinancialCommitment[] = getAllFinancialCommitments()): DesignationPortfolio {
  const programmes = new Set(getAllProgrammes().filter((g) => g.actor === actor).map((g) => g.id));
  const list = getAllProjectDesignations().filter((d) => programmes.has(d.programmeId));
  const byGeography = tally(["domestic", "abroad", "domestic_and_abroad", "not_stated"] as const);
  const byStage = tally(SUPPLY_CHAIN_STAGES);
  const byCountry: Record<string, number> = {};
  const byMaterial: Record<string, number> = {};
  let noStage = 0;
  for (const d of list) {
    const g = designationGeography(d, actor);
    byGeography[g.geography]++;
    for (const cc of g.countries) byCountry[cc] = (byCountry[cc] ?? 0) + 1;
    for (const st of new Set(d.stages)) byStage[st]++;
    if (!d.stages.length) noStage++;
    for (const m of new Set(d.materialIds)) byMaterial[m] = (byMaterial[m] ?? 0) + 1;
  }
  // A project carries capital when a row that has not ended and is not a bare option is aimed at it.
  const funded = new Set(all.filter(isBackingRow).flatMap((c) => (c.projectId ? [c.projectId] : [])));
  return {
    actor,
    designationIds: list.map((d) => d.id),
    counts: {
      designations: list.length,
      byGeography,
      byCountry,
      byStage,
      noStage,
      byMaterial,
      holders: new Set(list.flatMap((d) => d.holderOrgIds)).size,
      projectsWithCapital: new Set(list.filter((d) => funded.has(d.projectId)).map((d) => d.projectId)).size,
    },
  };
}

/** Actors whose programmes recognize at least one project. */
export function actorsWithDesignations(): JurisdictionCode[] {
  const present = new Set(getAllProjectDesignations().flatMap((d) => {
    const g = getProgrammeById(d.programmeId);
    return g ? [g.actor] : [];
  }));
  return (["eu", "us", "japan", "australia", "canada", "uk", "india", "china", "other"] as const).filter((j) => present.has(j));
}

// --- Flows: from a government to where its money is aimed -----------------------------------

export type FlowCell = { actor: JurisdictionCode; destination: string; rowIds: string[] };

/**
 * Committed rows from each tracked government to each destination country,
 * or "not_stated". Counts records: a package counts once, with its parts
 * folded in (the whole part, not destination by destination: a package whose
 * parts do not all state a country stays "not_stated" and keeps its parts),
 * and a row aimed at two countries appears under both. A row that
 * withdrew or lapsed is not a flow, and an ended package does not hide the
 * parts that are still standing. Funding options are not commitments and are
 * never a flow; an exercise is its own commitment and is one.
 */
export function capitalFlows(all: readonly FinancialCommitment[] = getAllFinancialCommitments()): FlowCell[] {
  const cells = new Map<string, FlowCell>();
  const byId = byIdOf(all);
  const isFlow = (c: FinancialCommitment) => !!c.providerJurisdiction && c.valueRole === "commitment" && !isEnded(c);
  for (const c of all) {
    if (!isFlow(c)) continue;
    if (isFoldedPart(c, byId, isFlow)) continue;
    const actor = c.providerJurisdiction!;
    const g = rowGeography(c, actor, all)!;
    for (const destination of g.countries.length ? g.countries : ["not_stated"]) {
      const key = `${actor}\u0000${destination}`;
      if (!cells.has(key)) cells.set(key, { actor, destination, rowIds: [] });
      cells.get(key)!.rowIds.push(c.id);
    }
  }
  return [...cells.values()].sort((a, b) => byCodePoint(a.actor, b.actor) || byCodePoint(a.destination, b.destination));
}

// --- Stage response map: capital and controls at the same material and stage -----------------

export type ResponseCell = {
  /** Government-provided commitments at this material and stage that have not ended, packages counted once. */
  capitalIds: string[];
  capitalActors: JurisdictionCode[];
  /**
   * Funding options at this material and stage: a right to call on money, listed apart from the commitments
   * above because an option is not an exercise. An exercise is a commitment and is in `capitalIds`.
   */
  optionIds: string[];
  optionActors: JurisdictionCode[];
  /** Withdrawn or lapsed government rows aimed here: listed, and not capital, backing or an option. */
  endedIds: string[];
  /** Control clauses whose covered items sit at this material and stage, by issuer. */
  controlIds: string[];
  controlsByIssuer: Partial<Record<JurisdictionCode, string[]>>;
  /** Of those clauses, how many had each status on the as-of date. */
  controlStatuses: Partial<Record<ControlStatus, number>>;
  /** Project designations at this material and stage: standing, not money. */
  designationIds: string[];
  designationActors: JurisdictionCode[];
};

/**
 * For each tracked material and supply-chain stage: the capital aimed there,
 * the projects designated there, and the control clauses whose covered items
 * sit there. Record counts only, never money; a designation is standing, not
 * capital; and a control's stage is where its items belong, not a claim that
 * the clause restricts that stage. Capital is commitments that have not ended;
 * funding options and ended rows are kept apart, so an unexercised option never
 * reads as money aimed at a stage and ended money never reads as still backing it.
 * A part is folded into its package only in a cell where the package is in the same field and covers that
 * material and stage, so a package never hides a part of it at a cell it does not cover.
 */
export function stageResponseMap(asOf: string, all: readonly FinancialCommitment[] = getAllFinancialCommitments(), controls: readonly ControlMeasure[] = getAllControlMeasures()) {
  const out = new Map<string, Map<SupplyChainStage, ResponseCell>>();
  const cell = (mat: string, stage: SupplyChainStage) => {
    if (!out.has(mat)) out.set(mat, new Map());
    const row = out.get(mat)!;
    if (!row.has(stage))
      row.set(stage, {
        capitalIds: [],
        capitalActors: [],
        optionIds: [],
        optionActors: [],
        endedIds: [],
        controlIds: [],
        controlsByIssuer: {},
        controlStatuses: {},
        designationIds: [],
        designationActors: [],
      });
    return row.get(stage)!;
  };
  const byId = byIdOf(all);
  // Ended rows are listed here too. Each cell has three fields (capital, option, ended), and a part folds into
  // its package only when that package sits in the same field of the same cell: it is placed, is the same
  // kind of row (capital, option or ended), and covers this material and stage.
  const isPlaced = (c: FinancialCommitment) => !!c.providerJurisdiction && ["commitment", "funding_option"].includes(c.valueRole);
  const fieldOf = (c: FinancialCommitment) => (isEnded(c) ? "ended" : c.valueRole === "funding_option" ? "option" : "capital");
  const covers = (p: FinancialCommitment, mat: string, stage: SupplyChainStage) => p.materialIds.includes(mat) && p.stages.includes(stage);
  for (const c of all) {
    if (!isPlaced(c)) continue;
    const actor = c.providerJurisdiction!;
    for (const mat of c.materialIds)
      for (const stage of new Set(c.stages)) {
        if (isFoldedPart(c, byId, (p) => isPlaced(p) && fieldOf(p) === fieldOf(c) && covers(p, mat, stage))) continue;
        const x = cell(mat, stage);
        if (isEnded(c)) x.endedIds.push(c.id);
        else if (c.valueRole === "funding_option") {
          x.optionIds.push(c.id);
          if (!x.optionActors.includes(actor)) x.optionActors.push(actor);
        } else {
          x.capitalIds.push(c.id);
          if (!x.capitalActors.includes(actor)) x.capitalActors.push(actor);
        }
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
  for (const d of getAllProjectDesignations()) {
    const actor = getProgrammeById(d.programmeId)?.actor;
    if (!actor) continue;
    for (const mat of d.materialIds)
      for (const stage of new Set(d.stages)) {
        const x = cell(mat, stage);
        x.designationIds.push(d.id);
        if (!x.designationActors.includes(actor)) x.designationActors.push(actor);
      }
  }
  for (const row of out.values())
    for (const x of row.values()) {
      x.capitalActors.sort(byCodePoint);
      x.optionActors.sort(byCodePoint);
      x.designationActors.sort(byCodePoint);
    }
  return out;
}

/**
 * What the stage response map cannot place, by record kind, using the same placement tests as
 * `stageResponseMap`: a control clause or designation needs a stage and a material; a capital row needs a
 * providing government, the commitment or funding-option role, a stage and a material. Each kind's buckets are
 * exclusive and sum to that kind's total, so nothing is counted twice and none is left out.
 *
 * "No stage" is a statement about the record, not a coverage gap: a clause that restricts by end use,
 * customs enforcement, divestiture or suspension defines no items of its own, so its stage is empty by rule
 * (`NO_ITEM_MEASURE_TYPES`). Those are counted apart from clauses that could carry a stage and record none.
 * Counts only: nothing here is money, and a kind's off-lattice count is never added to another kind's.
 */
export function stageLatticeGaps(
  all: readonly FinancialCommitment[] = getAllFinancialCommitments(),
  controls: readonly ControlMeasure[] = getAllControlMeasures(),
  designations: readonly ProjectDesignation[] = getAllProjectDesignations(),
) {
  const placedControl = (m: ControlMeasure) => m.controlledStages.length > 0 && m.materialIds.length > 0;
  const unplacedControls = controls.filter((m) => !placedControl(m));
  const noStageControls = unplacedControls.filter((m) => m.controlledStages.length === 0);
  const byRule = noStageControls.filter((m) => NO_ITEM_MEASURE_TYPES.includes(m.measureType));

  const isPlacedRole = (c: FinancialCommitment) => c.valueRole === "commitment" || c.valueRole === "funding_option";
  const otherRoles: Partial<Record<ValueRole, number>> = {};
  let noProvider = 0;
  let noStageOrMaterial = 0;
  let onLattice = 0;
  for (const c of all) {
    if (!isPlacedRole(c)) otherRoles[c.valueRole] = (otherRoles[c.valueRole] ?? 0) + 1;
    else if (!c.providerJurisdiction) noProvider++;
    else if (c.stages.length === 0 || c.materialIds.length === 0) noStageOrMaterial++;
    else onLattice++;
  }
  const otherRoleTotal = Object.values(otherRoles).reduce((n, x) => n + x, 0);

  const unplacedDesignations = designations.filter((d) => d.stages.length === 0 || d.materialIds.length === 0);
  return {
    controls: {
      total: controls.length,
      /** Clauses the map cannot place: no stage, or (with a stage) no tracked material. */
      unplaced: unplacedControls.length,
      /** Of the unplaced clauses, those with no stage. */
      noStage: noStageControls.length,
      /** No stage by rule: the clause defines no items of its own. */
      noStageByRule: byRule.length,
      /** No stage although the clause type could carry one. */
      noStageOther: noStageControls.length - byRule.length,
      /** Unplaced although a stage is recorded, because no tracked material is. */
      noMaterialOnly: unplacedControls.length - noStageControls.length,
      placed: controls.length - unplacedControls.length,
    },
    designations: { total: designations.length, unplaced: unplacedDesignations.length, placed: designations.length - unplacedDesignations.length },
    capital: {
      total: all.length,
      /** Commitment or funding-option rows with a providing government and a stage and material. */
      placed: onLattice,
      /** A commitment or funding option that no tracked government provides. */
      noProvider,
      /** A government's commitment or option that records no stage or no tracked material. */
      noStageOrMaterial,
      /** Rows in another value role (envelopes, appropriations, indications, private funds): never placed. */
      otherRoles,
      otherRoleTotal,
    },
  };
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
