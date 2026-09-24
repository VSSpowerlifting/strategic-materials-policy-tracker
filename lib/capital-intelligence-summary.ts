/**
 * The machine-readable summary behind /api/v1/capital-intelligence/summary
 * and the dataset export. Deterministic: statuses are evaluated on
 * `site.lastUpdated`. Every money figure is a per-currency CurrencyTotal
 * from `totalCommitments`; the summary carries no ratio, share, percentage,
 * utilisation rate or cross-currency figure, and a test holds it to that.
 */
import {
  ACTOR_HOME_COUNTRIES,
  actorPortfolio,
  actorsWithCapital,
  actorsWithDesignations,
  designationPortfolio,
  capitalFlows,
  coInvestments,
  layerOf,
  programmeLedger,
  projectStack,
  stageResponseMap,
} from "./capital-intelligence";
import {
  getAllFinancialCommitments,
  getAllOrganizations,
  getAllProgrammes,
  getAllProjectDesignations,
  getAllProjects,
} from "./data";
import { site } from "./site";

const ids = <T extends { id: string }>(rows: readonly T[]) => rows.map((r) => r.id);

export function buildCapitalIntelligenceSummary() {
  const asOf = site.lastUpdated;
  const all = getAllFinancialCommitments();
  const orgs = getAllOrganizations();

  const map = stageResponseMap(asOf, all);
  const responseMap = [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([materialId, stages]) => ({
      materialId,
      stages: [...stages.entries()].map(([stage, cell]) => ({
        stage,
        capitalRows: cell.capitalIds.length,
        capitalIds: cell.capitalIds,
        capitalActors: cell.capitalActors,
        fundingOptionIds: cell.optionIds,
        fundingOptionActors: cell.optionActors,
        endedRowIds: cell.endedIds,
        controlClauses: cell.controlIds.length,
        controlIds: cell.controlIds,
        controlsByIssuer: cell.controlsByIssuer,
        controlStatusesAsOf: cell.controlStatuses,
        designations: cell.designationIds.length,
        designationIds: cell.designationIds,
        designationActors: cell.designationActors,
      })),
    }));

  return {
    asOf,
    countingRules: [
      "Every money figure is a per-currency, per-instrument total from the counting rules; nothing is converted between currencies and nothing is added across instruments.",
      "A stack, portfolio or programme is split into layers of one value role; only committed money (public, and joint vehicles apart) is summed.",
      "Funding options, envelopes, appropriations, lending authorities, private financing, recipient funds, expected co-investment and total project cost are listed, never summed.",
      "There is no grand stack total, public-share percentage, leverage or crowding-in ratio, or programme utilisation rate.",
      "Recorded awards under a programme are what the corpus records, not the programme's spend, and are never divided by its envelope.",
      "Portfolios roll up from an office to the department it is part of, never from a joint vehicle to the bodies that established it.",
      "Flows, co-investment and the stage response map count records, never money; a package counts once, with its parts folded in, unless the package has ended, in which case its standing parts count as rows of their own.",
      "A withdrawn or lapsed row is not capital: it is left out of every count of committed capital, flow, co-investment kind, project government and portfolio reach, and is listed as ended (portfolio counts.ended, ended row ids on co-investment and the response map).",
      "A funding option is listed as an option and never as a commitment or as backing: it is counted in its own portfolio layer only, and in its own field on co-investment and the response map. An exercise is its own commitment and counts as one.",
      "A commitment whose current status is not_stated is counted apart from binding and not yet binding (portfolio counts.committedStatusNotStated).",
      "A control clause's stage is where its covered items belong, not a claim that it restricts that stage.",
      "A project designation confers standing, not money, and never enters a sum.",
    ],
    homeTerritories: ACTOR_HOME_COUNTRIES,
    registries: {
      organizations: orgs.length,
      projects: getAllProjects().length,
      programmes: getAllProgrammes().length,
      projectDesignations: getAllProjectDesignations().length,
    },
    portfolios: actorsWithCapital(all).map((actor) => {
      const p = actorPortfolio(actor, all);
      return { actor, publicCommitmentTotals: p.publicTotals, jointVehicleCommitmentTotals: p.jointVehicleTotals, counts: p.counts };
    }),
    designationPortfolios: actorsWithDesignations().map((actor) => designationPortfolio(actor, all)),
    projects: getAllProjects().map((project) => {
      const s = projectStack(project.id, all)!;
      return {
        id: project.id,
        governments: s.governments,
        providerOrgIds: s.providerOrgIds,
        layers: s.layers.map((l) => ({ layer: l.key, rowIds: ids(l.rows), totals: l.totals })),
        designationIds: ids(s.designations),
      };
    }),
    coInvestment: coInvestments(all).map((c) => ({
      projectId: c.project.id,
      kinds: c.kinds,
      governments: c.governments,
      designatingGovernments: c.designatingGovernments,
      providerOrgIds: c.providerOrgIds,
      rowIds: c.rowIds,
      fundingOptionIds: c.optionIds,
      endedRowIds: c.endedIds,
      designationIds: c.designationIds,
    })),
    programmes: getAllProgrammes().map((g) => {
      const l = programmeLedger(g.id, all)!;
      return {
        id: g.id,
        actor: g.actor,
        kind: g.kind,
        envelopesListedNotSummed: l.envelopes.map((c) => ({ id: c.id, valueRole: c.valueRole, amount: c.amount })),
        recordedAwardTotals: l.recordedAwards?.totals ?? null,
        recordedAwardIds: l.recordedAwards ? ids(l.recordedAwards.rows) : [],
        otherRowIds: l.otherLayers.flatMap((x) => ids(x.rows)),
        designationIds: ids(l.designations),
      };
    }),
    flows: capitalFlows(all).map((f) => ({ actor: f.actor, destination: f.destination, rows: f.rowIds.length, rowIds: f.rowIds })),
    stageResponseMap: responseMap,
    layerOfRow: Object.fromEntries(all.map((c) => [c.id, layerOf(c)])),
  };
}
