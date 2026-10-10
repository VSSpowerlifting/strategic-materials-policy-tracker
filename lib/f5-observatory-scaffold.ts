/**
 * F5-4 (prepublication): the Industrial Outcome Observatory research scaffold.
 *
 * No public route, exported dataset, API, publication toggle, inferred policy
 * effect, historical/as-of state, or summed commitment amount is produced.
 * Existing seed-backed F5-2/F5-3a projections are the only evidence inputs.
 */
import type { PathwayInputs } from "./evidence-pathway-contract";
import {
  buildF5EditorialCasefilePreview,
  type F5EditorialCasefilePreview,
} from "./f5-casefile-preview";
import { auditF5CasefileReadiness } from "./f5-casefile-readiness";

export const F5_OBSERVATORY_COHORT = [
  {
    projectId: "prj-au-alcoa-sojitz-gallium",
    track: "initial_pilot",
    researchQuestion: "Does original evidence establish gallium-facility construction, distinct from associated policy and finance announcements?",
  },
  {
    projectId: "prj-ee-neo-rare-earth-magnet-project",
    track: "initial_pilot",
    researchQuestion: "What production and shipment activity is actually reported at Narva, and what remains unknown about dates and capacity?",
  },
  {
    projectId: "prj-us-stibnite",
    track: "initial_pilot",
    researchQuestion: "Which distinct early-works and site-access activities are verified without assigning financing causality or mine-wide commissioning?",
  },
  {
    projectId: "prj-us-usac-thompson-falls-expansion",
    track: "extended_comparator",
    researchQuestion: "What source-reported construction progress can be separated from government grant amounts and fully operational output?",
  },
] as const;

export type ObservatoryCohortMember = {
  projectId: string;
  track: "initial_pilot" | "extended_comparator";
  researchQuestion: string;
};

export type ObservatoryEvidenceIndexItem = {
  sourceId: string;
  publisher: string;
  url: string;
  publishedOn: string | null;
  accessedOn: string;
  /** Source presence is a reference, not independent outcome verification. */
  inLanes: ("project" | "policy" | "finance" | "designation" | "physical")[];
};

export type ObservatoryComparisonRow = {
  projectId: string;
  projectName: string;
  track: ObservatoryCohortMember["track"];
  researchQuestion: string;
  materialIds: string[];
  /** These are *counts of record references*, not counts of attributable policy effects. */
  policyRecordReferences: number;
  directFinancialInstrumentReferences: number;
  nonallocativeFinancialAssociations: number;
  financialPackageReferences: number;
  designationReferences: number;
  registeredReviewedOccurredClaims: number;
  registeredReviewedPlannedClaims: number;
  unreviewedLegacyPhysicalObservations: number;
  occurredEvidence: "registered_reviewed_claims" | "no_approved_occurred_claims";
  missingEvidenceDoesNotMeanFailure: true;
  allocationOrMonetaryTotalAuthorized: false;
  financialCausalityAuthorized: false;
  manualSourceAndBrowserQaCandidate: boolean;
  blockers: string[];
};

export type ObservatoryCasefile = {
  comparison: ObservatoryComparisonRow;
  sourceIndex: ObservatoryEvidenceIndexItem[];
  /** Explicitly pre-publication; every lane retains the existing evidence contract. */
  draft: F5EditorialCasefilePreview;
};

export type F5ObservatoryScaffold = {
  schemaVersion: "f5-observatory-prepublication-1";
  audience: "internal_research_and_design";
  view: "current_corpus_revision";
  curatedCorpusCutoff: string;
  publicReleaseAuthorized: false;
  editorialClaimsAutomaticallyApproved: false;
  inferredCausalityAuthorized: false;
  attributableCapitalTotalsAuthorized: false;
  historicalAsOfAnalysisAuthorized: false;
  architecture: {
    sections: readonly string[];
    casefileLanes: readonly ["policy", "finance", "designations", "physical"];
    comparisonMetricsAreCountsNotImpactScores: true;
    publicationRouteEnabled: false;
  };
  cohortSize: number;
  sourceReviewedCasefilesReadyForManualQa: number;
  /** All cases must be structurally QA-eligible; even then a maintainer signs off separately. */
  nextGate: "source_adjudication" | "manual_source_browser_accessibility_qa";
  cases: ObservatoryCasefile[];
  allCasefilesEligibleForManualQa: boolean;
  requiredHumanChecks: string[];
  limitations: string[];
};

const lex = (a: string,b: string) => a < b ? -1 : a > b ? 1 : 0;
type EvidenceRole = ObservatoryEvidenceIndexItem["inLanes"][number];

function buildEvidenceIndex(draft: F5EditorialCasefilePreview): ObservatoryEvidenceIndexItem[] {
  const map = new Map<string, {
    sourceId: string; publisher: string; url: string;
    publishedOn: string | null; accessedOn: string;
    roles: Set<EvidenceRole>;
  }>();
  const add = (source: {
    id: string; publisher: string; url: string;
    publishedOn: string | null; accessedOn: string;
  }, role: EvidenceRole) => {
    const prev = map.get(source.id);
    if (prev) {
      if (prev.publisher !== source.publisher || prev.url !== source.url ||
          prev.publishedOn !== source.publishedOn || prev.accessedOn !== source.accessedOn)
        throw new Error("F5 observatory conflicting source identity " + source.id);
      prev.roles.add(role);
    } else map.set(source.id, {
      sourceId: source.id, publisher: source.publisher, url: source.url,
      publishedOn: source.publishedOn, accessedOn: source.accessedOn,
      roles: new Set([role]),
    });
  };
  draft.project.evidence.forEach(s => add(s, "project"));
  draft.lanes.policy.forEach(p => p.sourceRecords.forEach(s => add(s, "policy")));
  draft.lanes.finance.forEach(f => f.evidence.forEach(s => add(s, "finance")));
  draft.lanes.designations.forEach(d => d.evidence.forEach(s => add(s, "designation")));
  [...draft.lanes.physical.occurred, ...draft.lanes.physical.planned]
    .forEach(m => add(m.evidence, "physical"));
  return [...map.values()].sort((a,b)=>lex(a.sourceId,b.sourceId))
    .map(s=>({
      sourceId:s.sourceId, publisher:s.publisher, url:s.url,
      publishedOn:s.publishedOn, accessedOn:s.accessedOn,
      inLanes:[...s.roles].sort(lex),
    }));
}

/**
 * Compose the *entire* cohort before any optional selector, so an unknown or
 * broken project cannot be hidden by displaying only one "good" casefile.
 * This is a private visual/data contract; the existence of reviewed fields
 * does not demonstrate that sources were actually checked by a human.
 */
export function buildF5ObservatoryScaffold(
  input: PathwayInputs,
  corpusCutoff: string,
  cohort: readonly ObservatoryCohortMember[] = F5_OBSERVATORY_COHORT,
): F5ObservatoryScaffold {
  if (!cohort.length || cohort.some(c => !c.projectId?.trim() ||
      !c.researchQuestion?.trim() ||
      !["initial_pilot","extended_comparator"].includes(c.track)) ||
      new Set(cohort.map(c=>c.projectId)).size !== cohort.length)
    throw new Error("F5 observatory cohort must use unique projects, recognized tracks and nonblank questions");

  const uniqueProjects = [...cohort.map(c=>c.projectId)].sort(lex);
  const quality = auditF5CasefileReadiness(input, corpusCutoff, uniqueProjects);
  const eligible = new Map(quality.pilots.map(p => [p.projectId, p]));
  const selected = new Map(cohort.map(c=>[c.projectId,c]));
  const cases: ObservatoryCasefile[] = uniqueProjects.map(projectId => {
    const d = buildF5EditorialCasefilePreview(projectId, input, corpusCutoff);
    const c = selected.get(projectId)!;
    const audit = eligible.get(projectId)!;
    if (d.project.id !== projectId || audit.projectId !== projectId ||
        d.readiness.eligibleForManualSourceAndBrowserQa !== audit.eligibleForManualQa)
      throw new Error("F5 observatory mismatched casefile/readiness identity " + projectId);
    if (d.publicReleaseAuthorized !== false || d.policyCausalityAsserted !== false ||
        d.historicalMoneyTotalsAuthorized !== false)
      throw new Error("F5 observatory cannot import a release or inferred-causality flag");

    const direct = d.lanes.finance.filter(f=>f.relationship === "directly_attributable").length;
    const associated = d.lanes.finance.length-direct;
    return {
      comparison: {
        projectId, projectName:d.project.name,
        track:c.track, researchQuestion:c.researchQuestion,
        materialIds:[...d.project.materialIds],
        policyRecordReferences:d.lanes.policy.length,
        directFinancialInstrumentReferences:direct,
        nonallocativeFinancialAssociations:associated,
        financialPackageReferences:d.lanes.financePackageReferences.length,
        designationReferences:d.lanes.designations.length,
        registeredReviewedOccurredClaims:d.lanes.physical.occurred.length,
        registeredReviewedPlannedClaims:d.lanes.physical.planned.length,
        unreviewedLegacyPhysicalObservations:d.lanes.physical.legacyFinanceObservationsAwaitingReview,
        occurredEvidence:d.lanes.physical.occurredEvidence,
        missingEvidenceDoesNotMeanFailure:true,
        allocationOrMonetaryTotalAuthorized:false,
        financialCausalityAuthorized:false,
        manualSourceAndBrowserQaCandidate:audit.eligibleForManualQa,
        blockers:[...audit.blockers],
      },
      sourceIndex:buildEvidenceIndex(d),
      draft:d,
    };
  });
  const ready = cases.filter(c=>c.comparison.manualSourceAndBrowserQaCandidate).length;
  return {
    schemaVersion:"f5-observatory-prepublication-1",
    audience:"internal_research_and_design",
    view:"current_corpus_revision",
    curatedCorpusCutoff:corpusCutoff,
    publicReleaseAuthorized:false,
    editorialClaimsAutomaticallyApproved:false,
    inferredCausalityAuthorized:false,
    attributableCapitalTotalsAuthorized:false,
    historicalAsOfAnalysisAuthorized:false,
    architecture:{
      sections:["scope_and_method", "cross_project_evidence_matrix", "project_casefiles",
        "source_register", "limitations_and_release_criteria"],
      casefileLanes:["policy","finance","designations","physical"],
      comparisonMetricsAreCountsNotImpactScores:true,
      publicationRouteEnabled:false,
    },
    cohortSize:cases.length,
    sourceReviewedCasefilesReadyForManualQa:ready,
    nextGate:ready===cases.length
      ? "manual_source_browser_accessibility_qa" : "source_adjudication",
    cases,
    allCasefilesEligibleForManualQa:ready===cases.length,
    requiredHumanChecks:[
      "Original publisher quotations, event dates, and component scopes adjudicated and source pinpoints independently verified",
      "Policy events, finance instruments and designations presented as adjacent records, never demonstrated policy causes",
      "No grant/loan/project-cost summation or nonallocative finance being represented as attributable money",
      "Unknown physical event dates explicitly distinguished from publication, source-access and review dates",
      "Responsive mobile, tablet and desktop inspection of future casefile view",
      "Keyboard navigation, semantic headings, screen-reader labels and WCAG contrast reviewed on rendered pages",
      "All source links, translations, empty/error states and casefile comparison labels checked manually",
      "Maintainer explicitly approves exact reviewed public data/corpus revision and production release",
    ],
    limitations:[
      "INTERNAL ONLY — there is no Observatory page, route, sitemap, API, feed or public dataset in this phase.",
      "This current-corpus evidence comparison is not a historical known-as-of analysis or a policy-impact estimate.",
      "Counts indicate recorded references only and do not measure effectiveness, progress rates or project success.",
      "Company statements of reported operations or progress are source claims, not independent physical-site verification.",
      "Three initial research pilots and one extended comparator are an editorial selection, not a representative population.",
      "No recorded milestone is a review gap; it does not establish real-world industrial inactivity.",
      "No source or reviewer packet can authorize production without separate source adjudication and maintainer signoff.",
    ],
  };
}

/** Minimal reviewable outline without presenting private claim text on a public site. */
export function formatF5ObservatoryScaffold(scaffold:F5ObservatoryScaffold):string {
  const lines=[
    "SMPT Industrial Outcome Observatory — INTERNAL PREPUBLICATION SCAFFOLD",
    "Curated corpus cutoff: "+scaffold.curatedCorpusCutoff,
    "Cohort projects: "+scaffold.cohortSize,
    "Ready for manual source/browser QA: "+scaffold.sourceReviewedCasefilesReadyForManualQa,
    "Next gate: "+scaffold.nextGate,
    "Public release: NOT AUTHORIZED",
    "Causality or project capital sums: NOT AUTHORIZED",
    "",
    "Project | Track | Policy contexts | Direct finance refs | Nonallocative refs | Reviewed occurred | Legacy source observations | QA",
  ];
  for(const c of scaffold.cases){
    const m=c.comparison;
    lines.push([m.projectName,m.track,String(m.policyRecordReferences),
      String(m.directFinancialInstrumentReferences),String(m.nonallocativeFinancialAssociations),
      String(m.registeredReviewedOccurredClaims),String(m.unreviewedLegacyPhysicalObservations),
      m.manualSourceAndBrowserQaCandidate?"human QA candidate":"evidence blocked"].join(" | "));
    m.blockers.forEach(b=>lines.push("  BLOCKED: "+b));
  }
  lines.push("","Human checks required:",...scaffold.requiredHumanChecks.map(x=>"- "+x),"",
    "No inferred project success, policy effect, payment total, or actual production is asserted.","");
  return lines.join("\n");
}
