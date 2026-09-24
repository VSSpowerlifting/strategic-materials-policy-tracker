/**
 * The machine-readable summary behind /api/v1/capital-control/summary and
 * the dataset export. Deterministic: statuses are evaluated on
 * `site.lastUpdated`, never on the build clock.
 */
import {
  LISTED_NOT_SUMMED_ROLES,
  PUBLIC_CAPITAL_SOURCES,
  commitmentActor,
  controlClocks,
  controlIssuer,
  controlStatusOn,
  countBy,
  currentFinancialStatus,
  optionState,
  publicCommitmentRows,
  totalCommitments,
} from "./capital-control";
import { getAllControlMeasures, getAllFinancialCommitments } from "./data";
import { site } from "./site";

const obj = <K extends string>(m: Map<K, number>) =>
  Object.fromEntries([...m.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

export function buildCapitalControlSummary() {
  const asOf = site.lastUpdated;
  const all = getAllFinancialCommitments();
  const controls = getAllControlMeasures();
  const totals = totalCommitments(publicCommitmentRows(all), all);
  const listed = (roles: string[]) =>
    all
      .filter((c) => roles.includes(c.valueRole))
      .map((c) => ({ id: c.id, valueRole: c.valueRole, capitalSource: c.capitalSource, amount: c.amount }));

  return {
    asOf,
    countingRules: [
      "Amounts are never converted between currencies.",
      "Only rows with valueRole \"commitment\" are summed; envelopes, appropriations and lending authorities are listed, never summed.",
      "Funding options (valueRole \"funding_option\") are listed, never summed: an executed option is not an exercise. An exercise is recorded as its own commitment drawn from the option.",
      "A row is not added when a row it is part of or drawn from is counted in the same total.",
      "If two counted rows in one currency share a descendant, that currency's total is withheld: status \"withheld\", sums null, and the overlapping rows named.",
      "Private financing, recipient funds, expected co-investment and total project cost are never public support; mixed vehicles are reported apart.",
      "Sums are kept apart by qualifier: exact, approximately, at least, up to.",
      "Binding money (contracted, partially disbursed, disbursed) is summed apart from money not yet binding (announced, authorized, allocated, decided).",
      "A commitment whose current status is withdrawn or lapsed is left out of every sum and listed as ended.",
    ],
    capital: {
      rows: all.length,
      publicCommitmentTotals: totals.currencies,
      publicCommitmentsWithoutAmount: totals.unquantifiedIds,
      publicCommitmentsEnded: totals.endedIds,
      publicCapitalSources: PUBLIC_CAPITAL_SOURCES,
      envelopesListedNotSummed: listed([...LISTED_NOT_SUMMED_ROLES]),
      fundingOptionsListedNotSummed: all
        .filter((c) => c.valueRole === "funding_option")
        .map((c) => {
          const s = optionState(c, all);
          return {
            id: c.id,
            valueRole: c.valueRole,
            capitalSource: c.capitalSource,
            amount: c.amount,
            agreementExecuted: s.executed ? { date: s.executed.date, sourceId: s.executed.sourceId } : null,
            exercisesRecorded: s.exercises.map((e) => e.id),
            disbursementsRecorded: s.disbursements.map((e) => e.id),
          };
        }),
      keptApartFromPublicSupport: [
        ...listed(["private_financing", "recipient_own_funds", "expected_co_investment", "total_project_cost"]),
        ...all
          .filter((c) => c.valueRole === "commitment" && !PUBLIC_CAPITAL_SOURCES.includes(c.capitalSource))
          .map((c) => ({ id: c.id, valueRole: c.valueRole, capitalSource: c.capitalSource, amount: c.amount })),
      ],
      byActor: obj(countBy(all, (c) => commitmentActor(c) ?? "not_government")),
      byInstrument: obj(countBy(all, (c) => c.instrument)),
      byValueRole: obj(countBy(all, (c) => c.valueRole)),
      byCurrentFinancialStatus: obj(countBy(all, (c) => currentFinancialStatus(c))),
      byStage: obj(countBy(all, (c) => c.stages)),
    },
    controls: {
      rows: controls.length,
      byStatusAsOf: obj(countBy(controls, (m) => controlStatusOn(m, asOf))),
      byIssuer: obj(countBy(controls, (m) => controlIssuer(m))),
      byMeasureType: obj(countBy(controls, (m) => m.measureType)),
      byDirection: obj(countBy(controls, (m) => m.direction)),
      clocks: controlClocks(asOf).map(({ measure, entry, daysLeft }) => ({
        id: measure.id,
        status: entry.status,
        until: entry.until,
        daysFromAsOf: daysLeft,
      })),
    },
  };
}
