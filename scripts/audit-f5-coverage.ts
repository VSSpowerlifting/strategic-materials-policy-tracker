/**
 * Offline F5-4a distinct-project evidence coverage; no public output or writes.
 * Usage: npm run audit:f5-coverage -- [--json] [--material ID] [--stage ID] [--provider JURISDICTION] [--source-horizon YYYY-MM-DD]
 */
import { buildF5ComparativeCoverage, type F5ComparisonFilters } from "../lib/f5-comparative-coverage";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllMaterials, getAllProjectDesignations, getAllProjectMilestones,
  getAllProjects, getAllSources,
} from "../lib/data";
import { JURISDICTIONS, SUPPLY_CHAIN_STAGES } from "../lib/types";
import { site } from "../lib/site";

const usage = "Usage: npm run audit:f5-coverage -- [--json] [--material ID] [--stage ID] [--provider JURISDICTION] [--source-horizon YYYY-MM-DD]";
const args = process.argv.slice(2);
const filters: F5ComparisonFilters = {};
let json = false;
let sourceHorizon: string | null = null;
const seen = new Set<string>();
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (seen.has(arg) || !["--json","--material","--stage","--provider","--source-horizon"].includes(arg)) {
    console.error(usage); process.exit(2);
  }
  seen.add(arg);
  if (arg === "--json") { json = true; continue; }
  const value = args[++i];
  if (!value || value.startsWith("--")) { console.error(usage); process.exit(2); }
  if (arg === "--source-horizon") {
    sourceHorizon = value;
  } else if (arg === "--material") {
    if (!getAllMaterials().some(m => m.id === value)) { console.error("Unknown material ID: " + value); process.exit(2); }
    filters.materialId = value;
  } else if (arg === "--stage") {
    if (!SUPPLY_CHAIN_STAGES.some(s => s === value)) { console.error("Unknown stage: " + value); process.exit(2); }
    filters.stage = value as F5ComparisonFilters["stage"];
  } else {
    if (!JURISDICTIONS.some(j => j === value)) { console.error("Unknown provider: " + value); process.exit(2); }
    filters.providerJurisdiction = value as F5ComparisonFilters["providerJurisdiction"];
  }
}
try {
  const report = buildF5ComparativeCoverage({
    events: getAllEvents(), finances: getAllFinancialCommitments(),
    controls: getAllControlMeasures(), projects: getAllProjects(),
    designations: getAllProjectDesignations(), milestones: getAllProjectMilestones(),
    sources: getAllSources(),
  }, site.lastUpdated, filters, sourceHorizon);
  if (json) process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  else process.stdout.write([
    "F5-4a internal comparative evidence coverage (NO publication)",
    "Unique project denominator: " + report.cohort.distinctSelectedProjects +
      " of " + report.cohort.registryProjects + " registered",
    "Direct finance references: " + report.counts.withDirectFinanceReference +
      "; nonallocative associations: " + report.counts.withNonallocativeFinanceAssociation,
    "Government direct commitment references: " + report.counts.withDirectGovernmentCommitmentReference,
    "Public /response eligible at " + site.lastUpdated + ": " +
      report.counts.publicResponseEligibleGovernmentProjects,
    "Native occurred evidence: " + report.counts.withNativeOccurredMilestone +
      "; missing native reviewed evidence: " + report.counts.withoutNativeReviewedMilestone,
    "Current-corpus legacy physical observations (unreviewed): " +
      report.counts.withUnreviewedLegacyPhysicalObservation,
    "Material membership rows: " + report.byMaterial.reduce((n, x) => n + x.projects, 0) +
      " (not additive across materials)",
    ...(report.selectedCohortSourceHorizon ? [
      "Source horizon (publication vs SMPT registered access, NOT historical knowledge): " +
        report.selectedCohortSourceHorizon.horizon,
      "Unique cited sources: " + report.selectedCohortSourceHorizon.distinctSourceIds.length,
      "Published later: " + report.selectedCohortSourceHorizon.publishedAfterSourceIds.length +
        "; publication undated: " + report.selectedCohortSourceHorizon.publicationDateUnknownSourceIds.length +
        "; recorded access date later: " + report.selectedCohortSourceHorizon.accessedAfterSourceIds.length,
    ] : []),
    "No capital totals, physical as-of claims, impact scores or automatic publication.",
    "",
  ].join("\n"));
} catch (error) {
  console.error("F5-4a refused: " + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
