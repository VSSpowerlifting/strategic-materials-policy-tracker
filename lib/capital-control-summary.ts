/**
 * The machine-readable summary behind /api/v1/capital-control/summary and
 * the dataset export. Deterministic: statuses are evaluated on
 * `site.lastUpdated`, never on the build clock.
 */
import {
  PUBLIC_CAPITAL_SOURCES,
  commitmentActor,
  controlClocks,
  controlIssuer,
  controlStatusOn,
  countBy,
  currentFinancialStatus,
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
      "A row is not added when a row it is part of or drawn from is counted in the same total.",
      "Private financing, recipient funds, expected co-investment and total project cost are never public support; mixed vehicles are reported apart.",
      "Sums are kept apart by qualifier: exact, approximately, at least, up to.",
    ],
    capital: {
      rows: all.length,
      publicCommitmentTotals: totals.currencies,
      publicCommitmentsWithoutAmount: totals.unquantifiedIds,
      publicCapitalSources: PUBLIC_CAPITAL_SOURCES,
      envelopesListedNotSummed: listed(["program_envelope", "budget_appropriation", "lending_authority"]),
      keptApartFromPublicSupport: [
        ...listed(["private_financing", "recipient_own_funds", "expected_co_investment", "total_project_cost"]),
        ...all
          .filter((c) => c.valueRole === "commitment" && !PUBLIC_CAPITAL_SOURCES.includes(c.capitalSource))
          .map((c) => ({ id: c.id, valueRole: c.valueRole, capitalSource: c.capitalSource, amount: c.amount })),
      ],
      byActor: obj(countBy(all, (c) => commitmentActor(c))),
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
