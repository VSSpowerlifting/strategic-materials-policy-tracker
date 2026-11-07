// Analytical integrity checks shared by renderers. Pure functions that return
// issues instead of throwing, so a build can report every violation at once.
// Rules mirror EXHIBIT_AND_CHART_RULES.md (v2.0).

import type { IntegrityIssue } from "./types";

/** SMPT transaction/financing status taxonomy, in order. */
export const STATUS_TAXONOMY = [
  "announcement",
  "authorization",
  "binding",
  "drawdown",
  "expenditure",
  "operational",
] as const;
export type Status = (typeof STATUS_TAXONOMY)[number];

/** Evidence states for milestone/sequence exhibits. */
export const EVIDENCE_STATES = [
  "announced",
  "targeted",
  "reported",
  "independently-verified",
] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

const EPS = 1e-9;
const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol + EPS;

export function nonNegative(values: number[], rule = "magnitude-nonnegative"): IntegrityIssue[] {
  const bad = values.filter((v) => v < 0);
  return bad.length
    ? [{ rule, message: `magnitude bars must be non-negative; found ${bad.join(", ")}` }]
    : [];
}

export function maxItems(n: number, max: number, what: string): IntegrityIssue[] {
  return n > max
    ? [{ rule: "max-categories", message: `${n} ${what} exceed the legible maximum of ${max}` }]
    : [];
}

export function minItems(n: number, min: number, what: string): IntegrityIssue[] {
  return n < min
    ? [{ rule: "min-categories", message: `${n} ${what} are fewer than the minimum of ${min}` }]
    : [];
}

export function uniqueLabels(labels: string[], what = "labels"): IntegrityIssue[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const l of labels) (seen.has(l) ? dup : seen).add(l);
  return dup.size
    ? [{ rule: "unique-labels", message: `duplicate ${what}: ${[...dup].join(", ")}` }]
    : [];
}

export function sameLength(a: unknown[], b: unknown[], what: string): IntegrityIssue[] {
  return a.length === b.length
    ? []
    : [{ rule: "aligned-series", message: `${what}: lengths ${a.length} and ${b.length} differ` }];
}

/** start + Σ deltas must equal end (true waterfall / bridge reconciliation). */
export function reconciles(start: number, deltas: number[], end: number, tol = 1e-6): IntegrityIssue[] {
  const computed = deltas.reduce((s, d) => s + d, start);
  return close(computed, end, tol)
    ? []
    : [
        {
          rule: "bridge-reconciles",
          message: `start ${start} + movements ${deltas.join(" ")} = ${round(computed)}, not the stated end ${end}`,
        },
      ];
}

export function totalsMatch(a: number, b: number, what: string, tol = 1e-6): IntegrityIssue[] {
  return close(a, b, tol)
    ? []
    : [{ rule: "totals-match", message: `${what}: ${round(a)} ≠ ${round(b)}` }];
}

export function sumsTo(values: number[], target: number, what: string, tol = 0.05): IntegrityIssue[] {
  const s = values.reduce((x, y) => x + y, 0);
  return close(s, target, tol)
    ? []
    : [{ rule: "sums-to-total", message: `${what} sums to ${round(s)}, expected ${target}` }];
}

export function within(values: number[], lo: number, hi: number, what: string): IntegrityIssue[] {
  const bad = values.filter((v) => v < lo - EPS || v > hi + EPS);
  return bad.length
    ? [{ rule: "bounded-values", message: `${what} outside [${lo}, ${hi}]: ${bad.join(", ")}` }]
    : [];
}

export function ordered(lo: number, mid: number | undefined, hi: number, what: string): IntegrityIssue[] {
  const okMid = mid === undefined || (mid >= lo - EPS && mid <= hi + EPS);
  return lo <= hi + EPS && okMid
    ? []
    : [{ rule: "interval-ordered", message: `${what}: expected low ≤ ${mid === undefined ? "" : "mid ≤ "}high` }];
}

export function datesAscending(dates: string[], what: string): IntegrityIssue[] {
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] < dates[i - 1]) {
      return [{ rule: "dates-ascending", message: `${what}: ${dates[i]} precedes ${dates[i - 1]}` }];
    }
  }
  return [];
}

export function dateOrder(start: string, end: string, what: string): IntegrityIssue[] {
  return start <= end
    ? []
    : [{ rule: "interval-ordered", message: `${what}: start ${start} is after end ${end}` }];
}

export function inVocabulary(values: string[], vocab: readonly string[], what: string): IntegrityIssue[] {
  const bad = values.filter((v) => !vocab.includes(v));
  return bad.length
    ? [{ rule: "controlled-vocabulary", message: `${what} not in [${vocab.join(", ")}]: ${bad.join(", ")}` }]
    : [];
}

/** Every edge endpoint must be a declared node; no self-loops. */
export function edgesResolve(nodeIds: string[], edges: { from: string; to: string }[]): IntegrityIssue[] {
  const ids = new Set(nodeIds);
  const issues: IntegrityIssue[] = [];
  for (const e of edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) {
      issues.push({ rule: "edges-resolve", message: `edge ${e.from}→${e.to} references an undeclared node` });
    }
    if (e.from === e.to) issues.push({ rule: "edges-resolve", message: `self-loop on ${e.from}` });
  }
  return issues;
}

/** Histogram bins must be contiguous and strictly increasing. */
export function binsContiguous(bins: { from: number; to: number }[]): IntegrityIssue[] {
  for (let i = 0; i < bins.length; i++) {
    if (!(bins[i].to > bins[i].from)) {
      return [{ rule: "bins-contiguous", message: `bin ${i} has non-positive width` }];
    }
    if (i > 0 && !close(bins[i].from, bins[i - 1].to)) {
      return [{ rule: "bins-contiguous", message: `bin ${i} starts at ${bins[i].from}, previous ends at ${bins[i - 1].to}` }];
    }
  }
  return [];
}

export function round(v: number, dp = 6): number {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}
