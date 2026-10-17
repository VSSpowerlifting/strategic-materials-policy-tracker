/**
 * F5-1 release rehearsal: an OFFLINE, read-only comparison of today's approved
 * public milestone register with what *genuinely recorded* M3 human decisions
 * would structurally enable at an explicitly proposed future corpus cutoff.
 *
 * No publication, seed mutation, claim approval, auto-signing or reviewer
 * authority is created here. The existing M3 adjudicator is the sole gate.
 */
import type { PathwayInputs } from "../lib/evidence-pathway-contract";
import { auditF5CasefileReadiness } from "../lib/f5-casefile-readiness";
import { isMilestoneIsoDate, validateProjectMilestones } from "../lib/project-milestones";
import { adjudicateProjectExecutionReview } from "./adjudicate-project-execution";

export type F5ReleaseRehearsal = {
  schemaVersion: "f5-prepublication-rehearsal-1";
  audience: "private_maintainer_only";
  basis: "current_public_seed_plus_nonpublishing_human_M3_proposals";
  publishedCorpusCutoff: string;
  proposedCorpusCutoff: string;
  cutoffChangeRequested: boolean;
  publicationAuthorized: false;
  automaticApprovalAuthorized: false;
  candidateSeedWritesAuthorized: false;
  completeOriginalSourceVerificationProven: false;
  historicalKnownAsOfAuthorized: false;
  before: { publishedMilestoneIds: string[]; structurallyEligiblePilots: string[] };
  after: { stagedMilestoneIds: string[]; structurallyEligiblePilots: string[] };
  humanDecisionCounts: { pending: number; approved: number; rejected: number; needs_more_evidence: number };
  gateErrors: string[];
  gateBlockers: { id: string; reason: string }[];
  proposedMilestoneIds: string[];
  stagingAllowed: boolean;
  nextHumanActions: string[];
};

const lex = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/**
 * All supplied decisions must come from the *real* local, gitignored M3
 * adjudication ledger. Only tests may use synthetic in-memory decisions.
 * The prospective cutoff participates in the existing M3 worksheet digest:
 * old signed digests must fail, never be silently updated.
 */
export function rehearseF5Release(
  queue: unknown,
  decisions: unknown,
  corpus: PathwayInputs,
  publishedCutoff: string,
  proposedCutoff: string,
): F5ReleaseRehearsal {
  if (!isMilestoneIsoDate(publishedCutoff) || !isMilestoneIsoDate(proposedCutoff))
    throw new Error("Release rehearsal requires real ISO corpus cutoff dates");
  if (proposedCutoff < publishedCutoff)
    throw new Error("Release rehearsal cannot backdate the public corpus cutoff");

  const before = auditF5CasefileReadiness(corpus, publishedCutoff);
  const human = adjudicateProjectExecutionReview(queue, decisions, {
    projects: corpus.projects,
    sources: corpus.sources,
    commitments: corpus.finances,
    corpusCutoff: proposedCutoff,
    publicMilestoneIds: corpus.milestones.map(m => m.id),
  });

  const gateErrors = [...human.errors];
  const gateBlockers = [...human.blocked];
  const stageAllowed = gateErrors.length === 0 && gateBlockers.length === 0;
  const proposals = stageAllowed ? human.proposals : [];
  const staged = [...corpus.milestones, ...proposals].sort((a, b) => lex(a.id, b.id));
  // Always validate the entire hypothetical published seed before showing
  // readiness. Validating isolated proposals misses cross-project duplicates
  // and collisions with the already public register.
  const issues = validateProjectMilestones(staged, {
    projects: corpus.projects, sources: corpus.sources, corpusDate: proposedCutoff,
  });
  if (issues.length) {
    gateErrors.push(...issues.map(x => "staged seed: " + x));
  }
  // On invalid metadata, never include even an individual approved candidate
  // in a ready-looking after state.
  const stagingAllowed = stageAllowed && issues.length === 0;
  const candidateCorpus = stagingAllowed ? {...corpus, milestones: staged} : corpus;
  const after = auditF5CasefileReadiness(candidateCorpus, proposedCutoff);

  return {
    schemaVersion: "f5-prepublication-rehearsal-1",
    audience: "private_maintainer_only",
    basis: "current_public_seed_plus_nonpublishing_human_M3_proposals",
    publishedCorpusCutoff: publishedCutoff,
    proposedCorpusCutoff: proposedCutoff,
    cutoffChangeRequested: proposedCutoff !== publishedCutoff,
    publicationAuthorized: false,
    automaticApprovalAuthorized: false,
    candidateSeedWritesAuthorized: false,
    completeOriginalSourceVerificationProven: false,
    historicalKnownAsOfAuthorized: false,
    before: {
      publishedMilestoneIds: corpus.milestones.map(m => m.id).sort(lex),
      structurallyEligiblePilots: before.pilots.filter(p => p.eligibleForManualQa).map(p => p.projectId),
    },
    after: {
      stagedMilestoneIds: candidateCorpus.milestones.map(m => m.id).sort(lex),
      structurallyEligiblePilots: after.pilots.filter(p => p.eligibleForManualQa).map(p => p.projectId),
    },
    humanDecisionCounts: {...human.counts},
    gateErrors,
    gateBlockers,
    proposedMilestoneIds: stagingAllowed ? proposals.map(p => p.id).sort(lex) : [],
    stagingAllowed,
    nextHumanActions: [
      "Read full original publisher documents and verify source quotes, project/facility scope and date clocks independently.",
      "Record genuine decisions in the existing gitignored M3 adjudications file. Manually transfer current prospective-cutoff worksheet digests; never auto-sign.",
      "Resolve all taxonomy holds through separate editorial review, not renamed or relabelled milestone fields.",
      "Request explicit maintainer approval for a separate source-reviewed seed and site.lastUpdated change, with independent citation review.",
      "Only after publication review may a public F5-3 casefile be built and independently browser-reviewed.",
    ],
  };
}
