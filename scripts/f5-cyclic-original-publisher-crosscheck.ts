/**
 * F5-5 original-publisher research consistency audit for the Cyclic Kingston M3 lead.
 * No network, source-body authentication, decisions, or writes. Research metadata
 * is NOT an M3 adjudication and never authorizes a public industrial milestone.
 */
type M3Row = {
  id: string; projectId: string; sourceId: string; kindProposal: string;
  scopeProposal: string; occurredOn: string | null; gate: string; reviewVerdict: string;
};
type SourceRef = { id: string; url: string; datePublished: string | null; dateAccessed: string };
type FinanceRef = {
  id: string; projectId: string | null; amount: {value: string; currency?: string} | null;
  implementationStatusHistory: readonly { status: string; date: string | null; sourceId: string }[];
};
type ProjectRef = {id: string};
export type CyclicSourceCrosscheckContext = {
  m3Queue: readonly M3Row[]; sources: readonly SourceRef[];
  commitments: readonly FinanceRef[]; projects: readonly ProjectRef[];
  publicMilestoneCount: number;
};
type CheckRole = "program_status" | "agreement_registry" | "funding_announcement" |
  "bilingual_status" | "separate_programme_comparator";
const roles: readonly CheckRole[] = [
  "program_status", "agreement_registry", "funding_announcement",
  "bilingual_status", "separate_programme_comparator",
];
const specs: Record<CheckRole, {sourceId: string | null; finding: string; url?: string}> = {
  program_status: {
    sourceId: "src-nrcan-cmrdd-programme",
    finding: "reported_cmrdd_activity_completion_month_only",
  },
  agreement_registry: {
    sourceId: "src-canada-grant-cyclic-cmrdd-2024",
    finding: "legal_agreement_period_only",
  },
  funding_announcement: {
    sourceId: "src-nrcan-cmrdd-2024",
    finding: "initial_project_scope_and_funding_only",
  },
  bilingual_status: {
    sourceId: null,
    finding: "same_nrcan_translation_not_independent_confirmation",
    url: "https://www.canada.ca/fr/campagne/mineraux-critiques-au-canada/soutien-du-gouvernement-federal-aux-projets-sur-les-mineraux-critiques-et-les-chaines-de-valeur/mineraux-critiques-recherche-developpement-et-demonstration-programme.html",
  },
  separate_programme_comparator: {
    sourceId: null,
    finding: "separate_bsup_centre_not_cmrdd_completion",
    url: "https://search.open.canada.ca/grants/record/feddevontario%2C062-2025-2026-Q4-00111%2Ccurrent",
  },
};
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const allowed = (o: Record<string, unknown>, fields: readonly string[]): boolean =>
  Object.keys(o).every(k => fields.includes(k)) && fields.every(k => Object.hasOwn(o, k));

export function auditCyclicOriginalPublisherCrosscheck(input: unknown, ctx: CyclicSourceCrosscheckContext) {
  const errors: string[] = [];
  const check = (condition: boolean, label: string) => {if (!condition) errors.push(label);};
  if (!isObject(input)) {
    return {schemaVersion: "f5-5-cyclic-crosscheck-audit-1" as const,
      errors: ["crosscheck: expected object"], registryCrosscheckConsistent: false,
      originalSourceAuthenticated: false as const, humanReviewed: false as const,
      publicPublicationAuthorized: false as const};
  }
  const top = [
    "schemaVersion","researchCheckedOn","interpretation","canonicalReviewId",
    "canonicalProjectId","canonicalFinanceId","canonicalSourceId","proposalKind",
    "proposalScope","reportedCompletionMonth","occurredOn","sourceIndependence",
    "sourceChecks","needsHumanOriginalSourceReview","humanAttestationPresent",
    "publicMilestonePromotionAuthorized","sourceBodyHashCaptured","note",
  ];
  check(allowed(input,top), "unexpected or absent top-level fields (including approval fields)");
  check(input.schemaVersion === "f5-5-cyclic-original-publisher-crosscheck-1", "schema version");
  check(input.researchCheckedOn === "2026-10-16", "research check date is not a reviewer signature");
  check(input.interpretation === "nrcan_reports_completed_funded_activity_not_commercial_plant",
    "completion interpretation overstates funded activity");
  check(input.canonicalReviewId === "review-m3-2-cyclic-extended-operations", "M3 review identity");
  check(input.canonicalProjectId === "prj-ca-cyclic-kingston-demonstration-plant", "project identity");
  check(input.canonicalFinanceId === "fin-ca-cmrdd-2024-cyclic-materials", "financing identity");
  check(input.canonicalSourceId === "src-nrcan-cmrdd-programme", "primary source identity");
  check(input.proposalKind === "funded_activity_completed", "M3 funded-activity kind");
  check(input.proposalScope === "funded_activity", "M3 funded-activity scope");
  check(input.reportedCompletionMonth === "2026-03", "reported month (not a day)");
  check(input.occurredOn === null, "a specific physical completion day was fabricated");
  check(input.sourceIndependence === "single_federal_reporting_chain_no_independent_physical_inspection",
    "same-government reports cannot become independent physical corroboration");
  check(input.needsHumanOriginalSourceReview === true &&
    input.humanAttestationPresent === false &&
    input.publicMilestonePromotionAuthorized === false &&
    input.sourceBodyHashCaptured === false, "unapproved research cannot be promoted or source-authenticated");
  check(typeof input.note === "string" && input.note.length > 60, "missing research limitation");

  const row = ctx.m3Queue.find(x => x.id === input.canonicalReviewId);
  check(ctx.m3Queue.filter(x => x.id === input.canonicalReviewId).length === 1, "M3 ID missing or duplicated");
  check(!!row && row.projectId === input.canonicalProjectId &&
    row.sourceId === input.canonicalSourceId && row.kindProposal === input.proposalKind &&
    row.scopeProposal === input.proposalScope && row.occurredOn === null &&
    row.gate === "human_source_review" && row.reviewVerdict === "unreviewed",
    "canonical M3 source/claim/gate drifted");
  check(ctx.projects.filter(x => x.id === input.canonicalProjectId).length === 1,
    "project ID missing or ambiguous");
  const fin = ctx.commitments.filter(x => x.id === input.canonicalFinanceId);
  check(fin.length === 1 && fin[0].projectId === input.canonicalProjectId &&
    fin[0].amount?.value === "4893125" && fin[0].amount?.currency === "CAD" &&
    fin[0].implementationStatusHistory.some(s => s.status === "completed" &&
      s.date === null && s.sourceId === input.canonicalSourceId),
    "Cyclic finance/activity boundary changed");
  check(ctx.publicMilestoneCount === 1, "public project milestones changed");

  const expectedClocks: Record<string, [string | null, string]> = {
    "src-nrcan-cmrdd-programme": [null, "2026-10-07"],
    "src-canada-grant-cyclic-cmrdd-2024": [null, "2026-10-02"],
    "src-nrcan-cmrdd-2024": ["2024-09-04", "2026-09-23"],
  };
  for (const [id, [published, accessed]] of Object.entries(expectedClocks)) {
    const found = ctx.sources.filter(x => x.id === id);
    check(found.length === 1 && found[0].datePublished === published &&
      found[0].dateAccessed === accessed, "source registry clock changed: " + id);
  }

  const evidence = Array.isArray(input.sourceChecks) ? input.sourceChecks : [];
  check(evidence.length === roles.length, "expected five publisher evidence pointers");
  const seen = new Set<string>();
  for (const checkRow of evidence) {
    if (!isObject(checkRow) || typeof checkRow.role !== "string" ||
      !(roles as readonly string[]).includes(checkRow.role)) {
      errors.push("invalid evidence role"); continue;
    }
    const role = checkRow.role as CheckRole, spec = specs[role];
    check(!seen.has(role), "duplicate source role: " + role); seen.add(role);
    check(allowed(checkRow, ["role","registeredSourceId","url","locator","finding","clock"]),
      "invalid evidence field shape: " + role);
    const source = ctx.sources.find(s => s.id === spec.sourceId);
    check(checkRow.registeredSourceId === spec.sourceId, "source identity changed: " + role);
    check(checkRow.finding === spec.finding, "overstated conclusion: " + role);
    check(typeof checkRow.locator === "string" && checkRow.locator.length >= 15,
      "missing original document locator: " + role);
    check(typeof checkRow.clock === "string" && checkRow.clock.length >= 16,
      "missing evidence clock caution: " + role);
    check(checkRow.url === (spec.sourceId ? source?.url : spec.url),
      "original official URL changed: " + role);
  }
  for (const role of roles) check(seen.has(role), "missing original-source role: " + role);
  // This report is evidence-navigation only. It cannot issue an M3 decision.
  return {schemaVersion: "f5-5-cyclic-crosscheck-audit-1" as const,
    errors, registryCrosscheckConsistent: errors.length === 0,
    originalSourceAuthenticated: false as const, humanReviewed: false as const,
    publicPublicationAuthorized: false as const};
}
