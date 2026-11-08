import test from "node:test";
import assert from "node:assert/strict";
import m33Example from "../research/project-execution/m3-3-adjudications.example.json";
import m33Proposed from "../research/project-execution/m3-3-proposed-sources.json";
import { loadCohortInputs, mergeProposedSources } from "../scripts/project-execution-cohort-inputs";
import { auditProjectExecutionPilot } from "../scripts/review-project-execution-pilot";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import { adjudicateProjectExecutionReview } from "../scripts/adjudicate-project-execution";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import type { Source } from "../lib/types";
import { site } from "../lib/site";
import { PRE_PHASE_III_CUTOFF, prePhaseIiiMilestones } from "./phase-iii-release-ids";

const refsFor = (cohort: "m3-2" | "m3-3", corpus: "current" | "pre-phase-iii" = "current") => {
  const inputs = loadCohortInputs(cohort);
  const milestones = corpus === "current" ? getAllProjectMilestones() : prePhaseIiiMilestones(getAllProjectMilestones());
  return {
    inputs,
    refs: {
      projects: getAllProjects(), sources: inputs.sources,
      commitments: getAllFinancialCommitments(),
      corpusCutoff: corpus === "current" ? site.lastUpdated as string : PRE_PHASE_III_CUTOFF,
      publicMilestoneCount: milestones.length,
      publicMilestoneIds: milestones.map((m) => m.id),
      cohort,
    },
  };
};

// Fingerprints computed from the M3.2 queue at ec3bfde, before the cohort split.
// A reviewer who copied one of these must not be forced to re-attest by M3.3 work.
const M3_2_DIGESTS: Record<string, string> = {
  "review-m3-2-alcoa-wagerup": "0f015854c870b226dd33b320c667ed070fa46a3a98bcae3dbb95fae5060e494d",
  "review-m3-2-cyclic-extended-operations": "0e551fd2908be89e9120f85cff2e89e2fd94c84a5a1fd27c20ab5ec107b3d962",
  "review-m3-2-inl-demonstration": "ff45bdc5546dd3cb54df7b573ee9d352f37a021e8e5e7b15084c9a2870e177d1",
  "review-m3-2-neo-narva-magnets": "8fe418cdfdedef8681bb8cba0dbab8e155501a8b9895c562e38f74fd1830a874",
  "review-m3-2-stibnite-burntlog": "7dee8307f3dd8796fef5837b1ef527ddc183469159f5bd9211e0c07b57eb17ff",
  "review-m3-2-stibnite-early-works": "041a26dd9f32e263f6b8317c08743618cd077338c020b38d4f5b3f7806ca0c4e",
  // P3-02 linked the Thompson row to its same-source finance status; this is the
  // one intended M3.2 fingerprint change, accepted by Benjamin Yang on 2026-11-08.
  // Superseded value (queue at ec3bfde/5f85fd2):
  // b75f2aa00db0e085381b1c3750c04eef269c7b24602bfbed765b114aaae255a2
  "review-m3-2-thompson-falls-q2-expansion": "2c91192902c6f897162f364a332405d93ea81c2461dec8bd37e350f63e6c7998",
};

// Phase III release (cutoff 2026-11-08, eight public milestones). Every M3.2 digest binds the
// corpus cutoff and public milestone set, so publishing P3-01, P3-03..P3-06 moves all seven.
// The 2026-11-06 values above remain reproducible from the pre-Phase III corpus.
const M3_2_DIGESTS_AT_PHASE_III: Record<string, string> = {
  "review-m3-2-alcoa-wagerup": "f8bf736beb84a5808b844f6dd5265f5fdee780c5b292849c1d1e971392e41034",
  "review-m3-2-cyclic-extended-operations": "2598771ad578f40614e2935ef6ba35eb2d8b71f752f616846b1319b25df8efde",
  "review-m3-2-inl-demonstration": "230064d95d4aa25cc04c93ecba7d8cabb23a70392d243c82ee1b979c7440c90b",
  "review-m3-2-neo-narva-magnets": "dc1374def43606ba3dc4aa087c2923406c1dd3b0bc4e13a79827aafd2c8b543b",
  "review-m3-2-stibnite-burntlog": "c692829df9805822a9d9ade9901e9689e11470ed9bb9a6e8344c3c286919584c",
  "review-m3-2-stibnite-early-works": "47f39420c0aacb61f01a174084fa0085087ae2ee8fc19ad43d33c3990a1fd87f",
  "review-m3-2-thompson-falls-q2-expansion": "ab54bdb1ab005059885725380a8fc44acedc2a0a0a5ff53652fdd37f87088590",
};

test("M3.3 cohort: M3.2 worksheet fingerprints and taxonomy blocks are unchanged", () => {
  // Historical: the pre-Phase III corpus still reproduces the recorded M3.2 fingerprints.
  const before = refsFor("m3-2", "pre-phase-iii");
  const p0 = buildM3ReviewerPackets(before.inputs.queue, before.refs);
  assert.deepEqual(
    Object.fromEntries(p0.worksheets.map((w) => [w.id, w.reviewInputDigestSha256])),
    M3_2_DIGESTS);
  // Current release corpus.
  const { inputs, refs } = refsFor("m3-2");
  const p = buildM3ReviewerPackets(inputs.queue, refs);
  assert.deepEqual(
    Object.fromEntries(p.worksheets.map((w) => [w.id, w.reviewInputDigestSha256])),
    M3_2_DIGESTS_AT_PHASE_III);
  for (const packets of [p0, p]) {
    assert.equal(packets.worksheets.find((w) => w.id === "review-m3-2-stibnite-burntlog")?.status,
      "taxonomy_blocked");
    assert.equal(packets.blockedOnTaxonomy, 3);
  }
});

test("M3.3 cohort: five unsigned rows pass the queue audit with no taxonomy block", () => {
  const { inputs, refs } = refsFor("m3-3");
  const audit = auditProjectExecutionPilot(inputs.queue, refs);
  assert.deepEqual(audit.errors, []);
  const p = buildM3ReviewerPackets(inputs.queue, refs);
  assert.equal(p.totalQueueCandidates, 5);
  assert.equal(p.awaitingSourceReview, 5);
  assert.equal(p.blockedOnTaxonomy, 0);
  assert.equal(p.publicationAuthorized, false);
  assert.ok(p.worksheets.every((w) => w.humanAttestationPresent === false));
  const rows = inputs.queue as { id: string; scopeProposal: string; occurredOn: string | null }[];
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  // Proposed rulings P3-03..P3-06: only the two Stibnite workstreams carry a stated day.
  assert.equal(byId["review-m3-3-marathon-early-works"].occurredOn, null);
  assert.equal(byId["review-m3-3-nolans-construction"].occurredOn, null);
  assert.equal(byId["review-m3-3-nolans-construction"].scopeProposal, "whole_project");
  assert.equal(byId["review-m3-3-stillwater-phase1a-commissioning"].occurredOn, null);
  assert.equal(byId["review-m3-3-stibnite-early-works-workstream"].occurredOn, "2025-10-21");
  assert.equal(byId["review-m3-3-stibnite-burntlog-workstream"].occurredOn, "2026-05-30");
  assert.equal(rows.filter((r) => r.scopeProposal === "bounded_project_workstream").length, 3);
});

test("M3.3 cohort: namespaces cannot be mixed across cohorts", () => {
  const m32 = refsFor("m3-2");
  const m33 = refsFor("m3-3");
  const crossA = auditProjectExecutionPilot(m32.inputs.queue, { ...m33.refs });
  assert.ok(crossA.errors.some((e) => e.includes("review-m3-3- namespace")));
  const crossB = auditProjectExecutionPilot(m33.inputs.queue, { ...m32.refs, sources: m33.inputs.sources });
  assert.ok(crossB.errors.some((e) => e.includes("review-m3-2- namespace")));
});

test("M3.3 cohort: proposed source is review-only and cannot shadow a seeded record", () => {
  // Phase III promoted the one proposed source (Stillwater) into the seed; the proposal file is now empty.
  assert.deepEqual(m33Proposed as Source[], []);
  const stillwater = "src-usar-stillwater-phase1a-commissioning-2026";
  assert.equal(getAllSources().filter((s) => s.id === stillwater).length, 1);
  assert.equal(refsFor("m3-3").inputs.sources.filter((s) => s.id === stillwater).length, 1);
  assert.equal(refsFor("m3-3").inputs.sources.length, getAllSources().length);
  const seeded = getAllSources();
  assert.throws(() => mergeProposedSources(seeded, [seeded[0]]), /duplicates a seeded source id/);
  assert.throws(() => mergeProposedSources(seeded, [seeded.find((s) => s.id === stillwater)!]),
    /duplicates a seeded source id/);
});

test("M3.3 cohort: the example file is all-pending and yields no proposal", () => {
  const { inputs, refs } = refsFor("m3-3");
  const r = adjudicateProjectExecutionReview(inputs.queue, structuredClone(m33Example), refs);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.counts, { pending: 5, approved: 0, rejected: 0, needs_more_evidence: 0 });
  assert.deepEqual(r.proposals, []);
});
