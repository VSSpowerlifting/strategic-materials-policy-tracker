import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import packet from "../research/f5/industrial-evidence-pilot-chronology.json";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import template from "../research/project-execution/m3-2-adjudications.example.json";
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { validateProjectMilestones } from "../lib/project-milestones";
import { buildIndustrialResponse } from "../lib/industrial-response";
import { legalStandingOn } from "../lib/capital-control";
import { adjudicateProjectExecutionReview } from "../scripts/adjudicate-project-execution";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import {
  auditReviewerIdentities, buildF5IndustrialEvidence, canonicalReviewerKey,
  findDuplicateReviewerIdentities,
} from "../scripts/f5-industrial-evidence";
import type { Source } from "../lib/types";

// Reviewer names below are test fixtures only. No real review is recorded.
const cutoff = site.lastUpdated as string;
const refs = () => ({
  queue: structuredClone(queue), projects: getAllProjects(), sources: getAllSources(),
  commitments: getAllFinancialCommitments(), corpusCutoff: cutoff,
  publicMilestoneCount: getAllProjectMilestones().length,
});
type Packet = typeof packet & Record<string, unknown>;
const sidecar = () => structuredClone(packet) as Packet;
const run = (p: unknown = sidecar(), r = refs()) => buildF5IndustrialEvidence(p, r);
const failures = (p: unknown, r = refs()) => run(p, r).errors.join(" | ");
const caseOf = (p: Packet, suffix: string) => p.cases.find((c) => c.reviewId.endsWith(suffix))!;
const leadOf = (p: Packet, suffix: string, key: string) =>
  caseOf(p, suffix).leads.find((l) => l.key === key)! as Record<string, unknown>;
const row = (suffix: string) => queue.find((r) => r.id.endsWith(suffix))!;

/** A milestone built from an M3 queue row, as a reviewer would after a real review. */
const milestoneFrom = (suffix: string, id: string, over: Record<string, unknown> = {}) => {
  const r = row(suffix);
  return {
    id, projectId: r.projectId, kind: r.kindProposal, claimMode: r.claimMode, scope: r.scopeProposal,
    scopeAsStated: r.scopeAsStated, occurredOn: r.occurredOn, targetOn: r.targetOn, sourceId: r.sourceId,
    locator: r.locator, statementOriginal: r.statementOriginal, statementEn: r.statementEn,
    statementEnSource: r.statementEnSource, reviewedBy: "Jane Doe", reviewedAt: "2026-10-05",
    note: null, ...over,
  };
};
const milestoneRefs = (extra: Source[] = []) => ({
  projects: getAllProjects(), sources: [...getAllSources(), ...extra], corpusDate: cutoff,
});
const validate = (rows: unknown[], extra: Source[] = []) =>
  validateProjectMilestones(rows, milestoneRefs(extra)).join(" | ");

const adjRefs = () => ({
  projects: getAllProjects(), sources: getAllSources(), commitments: getAllFinancialCommitments(),
  corpusCutoff: cutoff, publicMilestoneIds: getAllProjectMilestones().map((x) => x.id),
});
const decisions = () => structuredClone(template);
const digestFor = (id: string) => buildM3ReviewerPackets(queue, {
  ...adjRefs(), publicMilestoneCount: 0,
}, id).worksheets[0].reviewInputDigestSha256;
const complete = (d: ReturnType<typeof decisions>[number], reviewedAt: string, digest = digestFor(d.id)) => {
  d.verdict = "approved";
  d.reviewedBy = "Jane Doe" as never;
  d.reviewedAt = reviewedAt as never;
  d.rationale = "Test fixture only; no original source was reviewed." as never;
  d.proposedMilestoneId = ("mil-test-" + d.id.slice("review-m3-2-".length)) as never;
  d.reviewInputDigestSha256 = digest as never;
  for (const k of Object.keys(d.checks) as (keyof typeof d.checks)[]) d.checks[k] = true;
};
const adjudicate = (d: unknown) => adjudicateProjectExecutionReview(queue, d, adjRefs());
const indexOf = (suffix: string) => queue.findIndex((r) => r.id.endsWith(suffix));
/** Run the real reviewer CLI on a scratch decisions file (never the private review folder). */
const runAdjudicationCli = (d: unknown) => {
  const dir = mkdtempSync(join(tmpdir(), "f5-adjudications-"));
  try {
    const file = join(dir, "adjudications.json");
    writeFileSync(file, JSON.stringify(d));
    const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/audit-project-execution-adjudications.ts", "--file", file], { encoding: "utf8" });
    return { status: r.status, out: JSON.parse(r.stdout) as { errors: string[]; proposals: unknown[]; reviewerIdentityErrors: string[] } };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test("the committed sidecar passes, stays unsigned and never authorizes publication", () => {
  const r = run();
  assert.deepEqual(r.errors, []);
  assert.equal(r.publicationAuthorized, false);
  assert.equal(r.cases, 4);
  assert.equal(r.taxonomyBlocked, 2);
  assert.match(r.markdown!, /UNSIGNED RESEARCH/);
  assert.match(r.markdown!, /Publication is NOT AUTHORIZED/);
});

test("§7.1 one physical event referenced by several finance rows is one milestone", () => {
  const alcoa = caseOf(sidecar(), "alcoa-wagerup");
  assert.equal(alcoa.financeRefs.length, 3, "three financing rows describe the ceremony");
  // A second primary publisher reporting the same day cannot create a second event.
  const ministerial: Source = {
    ...structuredClone(getAllSources().find((s) => s.id === row("alcoa-wagerup").sourceId)!),
    id: "src-test-ministerial-first-sod", url: "https://example.gov.au/first-sod",
  };
  const issues = validate([
    milestoneFrom("alcoa-wagerup", "mil-test-a"),
    milestoneFrom("alcoa-wagerup", "mil-test-b", { sourceId: ministerial.id }),
  ], [ministerial]);
  assert.match(issues, /mil-test-b.*duplicate dated physical event across sources \(already represented by mil-test-a\)/);
  // Repeating the same assertion (one per financer) is a duplicate assertion.
  assert.match(validate([milestoneFrom("alcoa-wagerup", "mil-test-a"), milestoneFrom("alcoa-wagerup", "mil-test-b")]),
    /multiple financers do not create new milestones/);
  // An approved Alcoa review yields exactly one proposal, not one per finance row.
  const d = decisions();
  complete(d[indexOf("alcoa-wagerup")], "2026-10-05");
  const report = adjudicate(d);
  assert.deepEqual(report.errors, []);
  assert.equal(report.proposals.length, 1);
});

test("§7.2 an issuer-reported state whose start day is unknown keeps occurredOn null", () => {
  assert.equal(row("neo-narva-magnets").occurredOn, null);
  assert.equal(validate([milestoneFrom("neo-narva-magnets", "mil-test-neo")]), "", "an undated state is a valid observation");
  const p = sidecar();
  caseOf(p, "neo-narva-magnets").m3.occurredOn = "2026-09-14" as never; // the release date
  const f = failures(p);
  assert.match(f, /issuer-reported state has no known start day; occurredOn must stay null/);
  assert.match(f, /m3\.occurredOn differs from the queue row/);
  // A day later than the cited release cannot be recorded as the event day either.
  const q = sidecar();
  leadOf(q, "neo-narva-magnets", "issuer_commercial_production_release").timeAsStated = "2026-09-15";
  leadOf(q, "neo-narva-magnets", "issuer_commercial_production_release").assertionType = "event";
  assert.match(failures(q), /event day postdates its own evidence boundary/);
});

test("§7.3 early works is not general mine construction (whole_project stays taxonomy blocked)", () => {
  const r = row("stibnite-early-works");
  assert.equal(r.scopeProposal, "whole_project");
  assert.equal(r.gate, "taxonomy_blocked");
  const d = decisions();
  complete(d[indexOf("stibnite-early-works")], "2026-10-05");
  const report = adjudicate(d);
  assert.deepEqual(report.proposals, []);
  assert.deepEqual(report.blocked, [{ id: r.id, reason: "Unresolved taxonomy blocks approval; do not override with checklist." }]);
  const p = sidecar();
  caseOf(p, "stibnite-early-works").disposition = "Conditionally supportable with a specified caveat";
  assert.match(failures(p), /taxonomy_blocked gate requires disposition Taxonomy blocked/);
  // The 10-Q state that full construction waits for financing is never an occurred start.
  const part7 = (p.stibniteChronology as Record<string, unknown>[]).find((x) => x.part === 7)!;
  assert.equal(part7.assertionType, "target");
  assert.equal(part7.mapsToReviewId, null);
});

test("§7.4 named infrastructure is not a named operating facility", () => {
  const issues = validate([milestoneFrom("stibnite-burntlog", "mil-test-burntlog")]);
  assert.match(issues, /scope not in allowed set/);
  const p = sidecar();
  caseOf(p, "stibnite-burntlog").m3.scope = "named_facility"; // option D, silently applied
  assert.match(failures(p), /review-m3-2-stibnite-burntlog: m3\.scope differs from the queue row/);
  const d = decisions();
  complete(d[indexOf("stibnite-burntlog")], "2026-10-05");
  assert.equal(adjudicate(d).blocked[0].reason, "Unresolved taxonomy blocks approval; do not override with checklist.");
});

test("§7.5 planned targets never become occurred milestones", () => {
  assert.match(validate([milestoneFrom("stibnite-early-works", "mil-test-plan", {
    claimMode: "planned", occurredOn: "2025-10-21", targetOn: null,
  })]), /planned claim cannot have occurredOn/);
  assert.match(validate([milestoneFrom("alcoa-wagerup", "mil-test-future", { occurredOn: "2029-01-01" })]),
    /occurredOn is after corpus cutoff; planned targets must not be marked occurred/);
  const p = sidecar();
  const parts = p.stibniteChronology as Record<string, unknown>[];
  parts[6].mapsToReviewId = "review-m3-2-stibnite-burntlog";
  parts[5].mapsToReviewId = null;
  assert.match(failures(p), /chronology part 7: a planned target can never map to an occurred M3 observation/);
  const q = sidecar();
  leadOf(q, "alcoa-wagerup", "issuer_groundbreaking_release").assertionType = "target";
  assert.match(failures(q), /a target or aspiration cannot back an occurred claim/);
});

test("§7.6 unallocated financing never becomes attributable capital", () => {
  const money = /[$€£¥]|\b\d[\d,.]*\s*(?:million|billion|bn|m)\b|\b(?:USD|EUR|AUD|CAD|JPY|GBP)\b/i;
  for (const c of sidecar().cases) assert.doesNotMatch(c.financeNote, money);
  const p = sidecar();
  caseOf(p, "stibnite-early-works").financeNote = "Perpetua posted $139 million of assurance.";
  assert.match(failures(p), /financeNote must be present and carry no money figure/);
  const q = sidecar();
  (caseOf(q, "alcoa-wagerup").leads[0] as Record<string, unknown>).amount = "139000000";
  assert.match(failures(q), /\.amount: sidecar must not carry review, approval or amount fields/);
  // An associated-but-unallocated binding row must not lift Alcoa out of not-yet-binding.
  const all = getAllFinancialCommitments();
  const neoBinding = all.find((c) => c.projectId === "prj-ee-neo-rare-earth-magnet-project" &&
    c.valueRole === "commitment" && !!c.providerJurisdiction && legalStandingOn(c, cutoff) === "binding")!;
  assert.ok(neoBinding, "a binding government commitment to clone");
  const alcoaWith = (over: Record<string, unknown>) => buildIndustrialResponse(cutoff, [...all,
    { ...structuredClone(neoBinding), id: "fin-test-unallocated", ...over }])
    .rows.find((x) => x.id === "prj-au-alcoa-sojitz-gallium")!;
  const unallocated = alcoaWith({ projectId: null, associatedProjectIds: ["prj-au-alcoa-sojitz-gallium"] });
  assert.equal(unallocated.finance, "binding_not_evidenced");
  assert.ok(!unallocated.financialIds.includes("fin-test-unallocated"));
  // Positive control: the same row, allocated, does make Alcoa binding.
  const allocated = alcoaWith({ projectId: "prj-au-alcoa-sojitz-gallium", associatedProjectIds: [] });
  assert.equal(allocated.finance, "binding");
  assert.ok(allocated.financialIds.includes("fin-test-unallocated"));
});

test("§7.7 missing or contradictory provenance fails closed", () => {
  const cases: [(p: Packet) => void, RegExp][] = [
    [(p) => { leadOf(p, "alcoa-wagerup", "issuer_groundbreaking_release").url = "https://example.com/other"; }, /url contradicts the registered source/],
    [(p) => { leadOf(p, "neo-narva-magnets", "issuer_annual_information_form_2026").publishedOn = "2026-03-02"; }, /publishedOn contradicts the registered source/],
    [(p) => { leadOf(p, "stibnite-burntlog", "issuer_q2_2026_10q").publishedOn = "2026-08-05"; }, /publishedOn contradicts the registered source/],
    [(p) => { leadOf(p, "alcoa-wagerup", "ministerial_first_sod_release").publisher = " "; }, /publisher required \(missing provenance\)/],
    [(p) => { leadOf(p, "alcoa-wagerup", "ministerial_first_sod_release").url = "http://example.gov.au/x"; }, /url must be an https original-source link/],
    [(p) => { leadOf(p, "neo-narva-magnets", "issuer_opening_release").registeredSourceId = "src-missing"; }, /registeredSourceId does not resolve/],
    [(p) => { caseOf(p, "neo-narva-magnets").leads.splice(3, 1); }, /no lead carries the canonical source/],
    [(p) => { caseOf(p, "alcoa-wagerup").canonicalSourceId = "src-neo-aif-2026"; }, /canonicalSourceId differs from the queue sourceId/],
    [(p) => { caseOf(p, "alcoa-wagerup").financeRefs = ["fin-missing"]; }, /financeRefs must equal the queue relatedFinanceIds/],
    [(p) => { caseOf(p, "alcoa-wagerup").m3.reviewInputDigestSha256 = "0".repeat(64); }, /worksheet digest is stale or invented/],
  ];
  for (const [mutate, expected] of cases) {
    const p = sidecar();
    mutate(p);
    const r = run(p);
    assert.equal(r.markdown, null);
    assert.match(r.errors.join(" | "), expected);
  }
  assert.match(validate([milestoneFrom("alcoa-wagerup", "mil-test-x", { sourceId: "src-missing" })]), /sourceId does not resolve/);
  // A stale queue (edited after the worksheet digests were taken) also fails closed.
  const r = refs();
  (r.queue as { statementEn: string }[])[0].statementEn += " (edited)";
  assert.match(failures(sidecar(), r), /worksheet digest is stale or invented|M3 review queue invalid/);
});

test("§7.8 invalid source, event, review and corpus date relationships fail", () => {
  const cases: [(p: Packet) => void, RegExp][] = [
    [(p) => { p.corpusCutoff = "2026-10-16"; }, /does not match site\.lastUpdated/],
    [(p) => { p.researchedOn = cutoff; }, /researchedOn must postdate the corpus cutoff/],
    [(p) => { p.researchedOn = "2026-02-30"; }, /researchedOn must be a real ISO date/],
    [(p) => { leadOf(p, "alcoa-wagerup", "ministerial_first_sod_release").accessedOn = "2026-08-23"; }, /accessedOn precedes publishedOn/],
    [(p) => { leadOf(p, "alcoa-wagerup", "ministerial_first_sod_release").accessedOn = "2026-10-17"; }, /accessedOn postdates researchedOn/],
    [(p) => { leadOf(p, "alcoa-wagerup", "issuer_q3_2026_results").quote = "quoted after the cutoff"; }, /a post-cutoff lead cannot carry a quote/],
    [(p) => {
      const d = caseOf(p, "alcoa-wagerup").discrepancies.find((x) => x.leadKeys.join() === "issuer_q3_2026_results")!;
      d.disposition = "Resolved and source-supported";
    }, /a finding cannot rest only on post-cutoff leads/],
  ];
  for (const [mutate, expected] of cases) {
    const p = sidecar();
    mutate(p);
    assert.match(failures(p), expected);
  }
  // Milestone-level date order: event <= source boundary <= review <= corpus cutoff.
  assert.match(validate([milestoneFrom("stibnite-early-works", "mil-test-e", { occurredOn: "2025-10-22" })]),
    /occurredOn is later than the cited source evidence boundary/);
  assert.match(validate([milestoneFrom("alcoa-wagerup", "mil-test-r", { reviewedAt: "2026-08-23" })]),
    /review occurred before source publication\/access evidence boundary/);
  assert.match(validate([milestoneFrom("alcoa-wagerup", "mil-test-late", { reviewedAt: "2026-10-16" })]),
    /reviewedAt is after corpus cutoff/);
});

test("§7.9 duplicate canonical reviewer identities are detected", () => {
  assert.equal(canonicalReviewerKey("  Ｊａｎｅ   DOE "), "jane doe");
  const groups = findDuplicateReviewerIdentities(["Jane Doe", "jane  doe", "Ｊａｎｅ Doe", "John Roe", "Jane Doe"]);
  assert.deepEqual(groups, [{ key: "jane doe", variants: ["Jane Doe", "jane  doe", "Ｊａｎｅ Doe"].sort() }]);
  assert.deepEqual(findDuplicateReviewerIdentities(["Jane Doe", "John Roe"]), []);
  const d = decisions();
  complete(d[indexOf("alcoa-wagerup")], "2026-10-05");
  complete(d[indexOf("neo-narva-magnets")], "2026-10-05");
  d[indexOf("neo-narva-magnets")].reviewedBy = "jane  DOE" as never;
  assert.deepEqual(auditReviewerIdentities(d), ['reviewer identity "jane doe" appears under 2 spellings: "Jane Doe", "jane  DOE"']);
  // The real reviewer CLI enforces it, so one person cannot sign twice.
  const cli = runAdjudicationCli(d);
  assert.equal(cli.status, 1);
  assert.deepEqual(cli.out.reviewerIdentityErrors, auditReviewerIdentities(d));
});

test("§7.10 synthetic or unsigned approvals are rejected", () => {
  // Pending rows cannot carry a reviewer, date or digest.
  const pending = decisions();
  pending[0].reviewedBy = "Jane Doe" as never;
  assert.match(adjudicate(pending).errors.join(" | "), /pending cannot impersonate a completed review/);
  // An approval without a reviewer or a current digest is refused.
  const unsigned = decisions();
  complete(unsigned[0], "2026-10-05");
  unsigned[0].reviewedBy = null as never;
  assert.match(adjudicate(unsigned).errors.join(" | "), /requires named reviewer and actual reviewedAt date/);
  const stale = decisions();
  complete(stale[0], "2026-10-05", "f".repeat(64));
  assert.match(adjudicate(stale).errors.join(" | "), /review input fingerprint differs/);
  const missing = decisions();
  complete(missing[0], "2026-10-05", "not-a-digest");
  assert.match(adjudicate(missing).errors.join(" | "), /completed review requires a current 64-hex worksheet reviewInputDigestSha256/);
  // A real review today postdates the cutoff and cannot be backdated past it.
  const today = decisions();
  complete(today[0], "2026-10-17");
  const report = adjudicate(today);
  assert.deepEqual(report.proposals, []);
  assert.match(report.blocked[0].reason, /requires a separately authorized site\.lastUpdated revision/);
  // Machine or placeholder names are not human reviewers.
  for (const name of ["Claude", "AI reviewer", "Automated check", "codex-bot", "Synthetic reviewer in regression test", "TBD", "  "]) {
    const d = decisions();
    complete(d[0], "2026-10-05");
    d[0].reviewedBy = name as never;
    assert.notEqual(auditReviewerIdentities(d).length, 0, name);
  }
  assert.deepEqual(auditReviewerIdentities(decisions()), [], "pending template carries no reviewer");
  const named = decisions();
  complete(named[0], "2026-10-05");
  assert.deepEqual(auditReviewerIdentities(named), [], "a named human reviewer passes the identity audit");
  named[0].reviewedBy = "Ai Tanaka" as never;
  assert.deepEqual(auditReviewerIdentities(named), [], "a real given name is not mistaken for AI");
  // The real reviewer CLI refuses a machine signature even when the adjudicator alone would accept it.
  const machine = decisions();
  complete(machine[indexOf("alcoa-wagerup")], "2026-10-05");
  machine[indexOf("alcoa-wagerup")].reviewedBy = "Claude" as never;
  assert.equal(adjudicate(machine).proposals.length, 1, "adjudicator alone does not judge names");
  const cli = runAdjudicationCli(machine);
  assert.equal(cli.status, 1);
  assert.match(cli.out.reviewerIdentityErrors.join(" | "), /reviewer "Claude" is synthetic or a placeholder/);
  // The sidecar itself can never carry a signature, verdict or approval flag.
  for (const mutate of [
    (p: Packet) => { (p.cases[0] as Record<string, unknown>).reviewedBy = "Jane Doe"; },
    (p: Packet) => { (p.cases[1] as Record<string, unknown>).verdict = "approved"; },
    (p: Packet) => { (p as Record<string, unknown>).humanReceiptsPresent = true; },
    (p: Packet) => { (p as Record<string, unknown>).publicationAuthorized = true; },
    (p: Packet) => { caseOf(p, "neo-narva-magnets").disposition = "Resolved and source-supported"; },
  ]) {
    const p = sidecar();
    mutate(p);
    assert.equal(run(p).markdown, null);
  }
  // Published milestones would make this unsigned research incoherent.
  assert.match(failures(sidecar(), { ...refs(), publicMilestoneCount: 1 }), /public milestones exist/);
});

test("§7.11 output is deterministic and never mutates the seed or the sidecar", () => {
  const before = structuredClone(packet);
  const seedBefore = readFileSync("data/seed/project-milestones.json", "utf8");
  const a = run(packet), b = run(packet);
  assert.equal(a.markdown, b.markdown);
  assert.deepEqual(packet, before);
  assert.equal(readFileSync("data/seed/project-milestones.json", "utf8"), seedBefore);
  assert.deepEqual(JSON.parse(seedBefore), []);
  assert.equal(getAllProjectMilestones().length, 0);
  assert.doesNotMatch(a.markdown!, /\d{2}:\d{2}:\d{2}|T\d{2}:/, "no wall-clock timestamp");
});

test("§7.12 /response financing semantics are preserved for the pilots", () => {
  const res = buildIndustrialResponse(cutoff);
  const cell = (id: string) => {
    const r = res.rows.find((x) => x.id === id)!;
    return [r.finance, r.financeDetail, r.physical];
  };
  assert.deepEqual(cell("prj-au-alcoa-sojitz-gallium"), ["binding_not_evidenced", "not_yet_binding", "construction_or_later"]);
  assert.deepEqual(cell("prj-ee-neo-rare-earth-magnet-project"), ["binding", "binding", "construction_or_later"]);
  assert.deepEqual(cell("prj-us-stibnite"), ["binding", "binding", "construction_or_later"]);
  // Physical stage still comes from the financing rows, not from these unsigned dossiers.
  for (const id of ["prj-au-alcoa-sojitz-gallium", "prj-ee-neo-rare-earth-magnet-project", "prj-us-stibnite"])
    assert.ok(res.rows.find((x) => x.id === id)!.financialIds.length > 0);
});
