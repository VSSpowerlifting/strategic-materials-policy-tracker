/**
 * F5-5: check a public-original source navigation packet against the existing
 * unsigned Thompson Falls M3 proposal and financial/source registry.
 *
 * NO fetching, human attestation, source-body authentication, publication,
 * financial aggregation, or private evidence persistence is performed.
 */
import type { FinancialCommitment, Project, Source } from "../lib/types";

type M3Row = {
  id: string; projectId: string; sourceId: string;
  kindProposal: string; scopeProposal: string; occurredOn: string | null;
  targetOn: string | null; gate: string; reviewVerdict: string; relatedFinanceIds: readonly string[];
};
export type ThompsonSourceReviewContext = {
  m3Queue: readonly M3Row[];
  projects: readonly Project[];
  sources: readonly Source[];
  commitments: readonly FinancialCommitment[];
  publicMilestoneCount: number;
};
type Role = "registered_q2_form10q" | "sec_edgar_filing_index" |
  "q2_issuer_earnings_exhibit" | "q2_issuer_call_transcript" | "original_local_field_report";
const roles: readonly Role[] = [
  "registered_q2_form10q", "sec_edgar_filing_index",
  "q2_issuer_earnings_exhibit", "q2_issuer_call_transcript", "original_local_field_report",
];
const evidence: Record<Role, {sourceId: string | null; url: string; date: string; finding: string}> = {
  registered_q2_form10q: {
    sourceId: "src-usac-2026-q2-10q",
    url: "https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/uamy-20260630x10q.htm",
    date: "2026-08-11", finding: "issuer_q2_substantially_complete_some_assets_in_service",
  },
  sec_edgar_filing_index: {
    sourceId: null,
    url: "https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/0001104659-26-094035-index.htm",
    date: "2026-08-11", finding: "sec_filing_clock_not_independent_physical_confirmation",
  },
  q2_issuer_earnings_exhibit: {
    sourceId: null,
    url: "https://www.sec.gov/Archives/edgar/data/101538/000110465926094130/tm2622899d1_ex99-1.htm",
    date: "2026-08-11", finding: "q3_full_nine_furnace_operation_was_forward_looking",
  },
  q2_issuer_call_transcript: {
    sourceId: null,
    url: "https://www.sec.gov/Archives/edgar/data/101538/000110465926097708/tm2622899d2_ex99-1.htm",
    date: "2026-08-17", finding: "management_ramp_remarks_not_new_independent_facility_milestone",
  },
  original_local_field_report: {
    sourceId: null,
    url: "https://www.scledger.net/story/2026/08/27/news/usac-capacity-expands-with-new-t-falls-facility/14209.html",
    date: "2026-08-27", finding: "independent_report_of_partial_new_furnace_operation",
  },
};
const prohibitedInferences = [
  "all_nine_furnaces_operational","full_year_nameplate_output_achieved",
  "exact_q2_completion_day","government_award_equals_expansion_budget",
  "grant_receipt_equals_plant_commissioning","independent_article_equals_human_approval",
];
const keys = (o: Record<string,unknown>, fields: readonly string[]) =>
  Object.keys(o).length === fields.length && fields.every(k => Object.hasOwn(o,k));
const object = (x: unknown): x is Record<string,unknown> =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const topKeys = [
  "schemaVersion","researchCheckedOn","purpose","canonicalReviewId","canonicalProjectId",
  "canonicalSourceId","proposalKind","proposalScope","occurredOn","targetOn",
  "q2PeriodEnd","secFilingDate","issuerConstructionFinding","reportedAssetsPlacedInServiceUsd",
  "reportedGrossConstructionInProgressUsdApprox","sameCompanySourcesNotIndependent",
  "localReportDoesNotEstablishAllFurnacesRunning","registeredPrimarySourceBodyAuthenticated",
  "independentSiteVisitVerifiedByHuman","humanAttestationPresent","publicPublicationAuthorized",
  "evidence","editorialHandoff",
];
const sourceKeys=["role","sourceId","publisher","url","documentDate","locator","finding","limitation"];
const handoffKeys=["existingM3Authority","independentCorroborationStatus","additionalEvidenceRegistration",
  "nextAction","doNotInfer"];

export function auditThompsonSourceTriangulation(packet: unknown, ctx: ThompsonSourceReviewContext) {
  const errors: string[] = [];
  const check=(ok: boolean,label: string) => {if(!ok) errors.push(label);};
  if(!object(packet)) errors.push("source packet must be an object");
  else {
    check(keys(packet,topKeys),"packet has missing or unknown fields (possible approval authority)");
    check(packet.schemaVersion==="f5-5-thompson-source-triangulation-1","schema version");
    check(packet.researchCheckedOn==="2026-10-16","research check date is not M3 adjudication");
    check(packet.purpose==="public_original_source_navigation_for_existing_unsigned_M3_review_only","review-only purpose");
    check(packet.canonicalReviewId==="review-m3-2-thompson-falls-q2-expansion","canonical M3 identity");
    check(packet.canonicalProjectId==="prj-us-usac-thompson-falls-expansion","canonical project identity");
    check(packet.canonicalSourceId==="src-usac-2026-q2-10q","canonical registered source identity");
    check(packet.proposalKind==="construction_progress_reported" && packet.proposalScope==="named_facility",
      "reported construction progress cannot become operating/completed project claim");
    check(packet.occurredOn===null && packet.targetOn===null, "undated industrial stage must remain undated");
    check(packet.q2PeriodEnd==="2026-06-30" && packet.secFilingDate==="2026-08-11",
      "filing/event/accounting clocks conflated");
    check(packet.issuerConstructionFinding==="substantially_completed_q2_not_total_operations",
      "substantial completion is not proof of full operation");
    check(packet.reportedAssetsPlacedInServiceUsd==="4100000" &&
      packet.reportedGrossConstructionInProgressUsdApprox==="29000000",
      "SEC partial PP&E / construction-in-progress observation changed");
    check(packet.sameCompanySourcesNotIndependent===true &&
      packet.localReportDoesNotEstablishAllFurnacesRunning===true,
      "independence / incomplete nine-furnace coverage misrepresented");
    check(packet.registeredPrimarySourceBodyAuthenticated===false &&
      packet.independentSiteVisitVerifiedByHuman===false &&
      packet.humanAttestationPresent===false &&
      packet.publicPublicationAuthorized===false,
      "no content authentication, reviewer signature or release authority");
    const rows=Array.isArray(packet.evidence) ? packet.evidence : [];
    check(rows.length===roles.length,"exact five source-role records required");
    const seen=new Set<Role>();
    for(const row of rows) {
      if(!object(row) || typeof row.role!=="string" || !roles.includes(row.role as Role)) {
        errors.push("invalid source role"); continue;
      }
      const role=row.role as Role, spec=evidence[role];
      check(!seen.has(role),"duplicate evidence role: "+role);
      seen.add(role);
      check(keys(row,sourceKeys),"invalid source record fields: "+role);
      check(row.sourceId===spec.sourceId && row.url===spec.url,
        "source registration or original URL mismatch: "+role);
      check(row.documentDate===spec.date && row.finding===spec.finding,
        "document clock or interpretation mismatch: "+role);
      check(typeof row.publisher==="string" && row.publisher.length>=15 &&
        typeof row.locator==="string" && row.locator.length>=25 &&
        typeof row.limitation==="string" && row.limitation.length>=35,
        "original publisher/locator/limitation missing: "+role);
    }
    for(const role of roles) check(seen.has(role),"source role absent: "+role);
    const handoff=packet.editorialHandoff;
    if(!object(handoff)) errors.push("M3 handoff is absent");
    else {
      check(keys(handoff,handoffKeys),"invalid M3 handoff shape");
      check(handoff.existingM3Authority==="gitignored_original_M3_adjudications_only" &&
        handoff.independentCorroborationStatus==="local_reporting_requires_human_source_and_scope_validation" &&
        handoff.additionalEvidenceRegistration==="separate_editor_authorized_source_registration_if_used",
        "separate human authority or original evidence registration bypass");
      check(typeof handoff.nextAction==="string" && handoff.nextAction.length>=30,
        "human source validation action omitted");
      const denied=handoff.doNotInfer;
      check(Array.isArray(denied) &&
        denied.length===prohibitedInferences.length &&
        prohibitedInferences.every(s=>denied.includes(s)) &&
        new Set(denied).size===prohibitedInferences.length,
        "lost prohibition against unproved full operation, funding causality, or synthetic approval");
    }
  }

  const row=ctx.m3Queue.filter(m=>m.id==="review-m3-2-thompson-falls-q2-expansion");
  check(row.length===1 && row[0].projectId==="prj-us-usac-thompson-falls-expansion" &&
    row[0].sourceId==="src-usac-2026-q2-10q" &&
    row[0].kindProposal==="construction_progress_reported" &&
    row[0].scopeProposal==="named_facility" &&
    row[0].occurredOn===null && row[0].targetOn===null &&
    row[0].gate==="human_source_review" && row[0].reviewVerdict==="unreviewed" &&
    row[0].relatedFinanceIds.length===0,
    "existing M3 unsigned review or no-duplicate-finance contract drifted");
  const project=ctx.projects.filter(p=>p.id==="prj-us-usac-thompson-falls-expansion");
  check(project.length===1,"exactly one registered Thompson Falls project required");
  const source=ctx.sources.filter(s=>s.id==="src-usac-2026-q2-10q");
  check(source.length===1 && source[0].url===evidence.registered_q2_form10q.url &&
    source[0].datePublished==="2026-08-11" && source[0].dateAccessed==="2026-10-02",
    "canonical SEC source and existing published/access clocks drifted");
  const byId=(id: string)=>ctx.commitments.filter(c=>c.id===id);
  const parent=byId("fin-us-dow-usac-antimony-2026");
  const montana=byId("fin-us-dow-usac-antimony-2026-thompson-falls");
  const alaska=byId("fin-us-dow-usac-antimony-2026-alaska");
  check(parent.length===1 && parent[0].projectId===null &&
    parent[0].amount?.value==="27000000" &&
    parent[0].financialStatusHistory.some(s=>s.sourceId==="src-usac-2026-q2-10q" &&
      s.status==="partially_disbursed" && s.date===null),
    "$27M parent / April receipt provenance changed");
  check(montana.length===1 && montana[0].projectId==="prj-us-usac-thompson-falls-expansion" &&
    montana[0].amount?.value==="20000000" &&
    montana[0].implementationStatusHistory.length===0 &&
    !montana[0].financialStatusHistory.some(s=>s.status==="disbursed"),
    "Montana $20M allocation is not a second grant or fully paid facility milestone");
  check(alaska.length===1 && alaska[0].projectId==="prj-us-usac-alaska-antimony-feedstock" &&
    alaska[0].amount?.value==="7000000" && alaska[0].implementationStatusHistory.length===0,
    "Alaska $7M allocation must remain distinct and not imply Montana output");
  check(ctx.publicMilestoneCount===0,"no public project-native milestone promotion authorized");
  return {
    schemaVersion:"f5-5-thompson-source-audit-1" as const,
    errors,
    researchCrosscheckConsistent:errors.length===0,
    independentOriginalFieldReportIncluded:errors.length===0,
    originalSourceVerifiedByHuman:false as const,
    existingM3AdjudicationCompleted:false as const,
    publishAuthorized:false as const,
  };
}
