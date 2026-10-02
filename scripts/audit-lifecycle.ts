import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  bundleLifecycleRefreshQueue,
  deriveLifecycleRefreshQueue,
  isIsoDate,
  validateLifecycleReviews,
  type LifecyclePriority,
  type LifecycleReviewRecord,
} from "../lib/lifecycle-refresh";
import { site } from "../lib/site";
import type { FinancialCommitment } from "../lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), "utf8")) as T;

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  const value = process.argv[i + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}

const asOf = argValue("--as-of") ?? site.lastUpdated;
const showAll = process.argv.includes("--all");
if (!isIsoDate(asOf)) throw new Error(`--as-of must be YYYY-MM-DD, got ${JSON.stringify(asOf)}`);

const commitments = read<FinancialCommitment[]>("data/seed/financial-commitments.json");
const reviews = read<LifecycleReviewRecord[]>("data/maintenance/lifecycle-reviews.json");
const commitmentIds = new Set(commitments.map((commitment) => commitment.id));
const reviewErrors = validateLifecycleReviews(reviews, commitmentIds);
for (const review of reviews) {
  for (const [field, value] of [
    ["financialStatusCheckedAt", review.financialStatusCheckedAt],
    ["implementationStatusCheckedAt", review.implementationStatusCheckedAt],
  ] as const)
    if (value !== null && value > asOf) reviewErrors.push(`${review.commitmentId}.${field} (${value}) is after audit as-of ${asOf}`);
}
if (reviewErrors.length) {
  process.stderr.write(`Lifecycle review ledger is invalid:\n${reviewErrors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  const tracked = commitments.filter((commitment) =>
    ["commitment", "indication", "funding_option"].includes(commitment.valueRole),
  );
  const items = deriveLifecycleRefreshQueue(tracked, asOf, reviews);
  const bundles = bundleLifecycleRefreshQueue(tracked, items);
  const visible = showAll ? bundles : bundles.filter((bundle) => bundle.priority !== "P3");

  const count = (priority: LifecyclePriority) => bundles.filter((bundle) => bundle.priority === priority).length;
  process.stdout.write(`Lifecycle refresh audit — as of ${asOf}\n`);
  process.stdout.write(`Tracked financial records: ${tracked.length} / ${commitments.length}\n`);
  process.stdout.write(`Bundles: P0 ${count("P0")} · P1 ${count("P1")} · P2 ${count("P2")} · P3 ${count("P3")}\n\n`);

  if (!visible.length) process.stdout.write("No lifecycle refresh bundles at the selected priority scope.\n");
  else
    for (const bundle of visible) {
      const label = bundle.project ?? bundle.projectId ?? bundle.commitmentIds[0];
      process.stdout.write(`## ${bundle.priority} — ${label}\n`);
      process.stdout.write(`Key: ${bundle.key}\n`);
      process.stdout.write(`Records: ${bundle.commitmentIds.join(", ")}\n`);
      for (const reason of bundle.reasons) process.stdout.write(`- ${reason}\n`);
      for (const item of bundle.items) {
        const f = item.financial;
        const p = item.implementation;
        process.stdout.write(
          `  - ${item.commitmentId}: financial=${f.status ?? "none"}; financial freshness=${f.freshnessDate ?? "never"}` +
            `${f.ageDays === null ? "" : ` (${f.ageDays}d)`}; implementation=${p.status ?? "none"}; implementation freshness=${p.freshnessDate ?? "never"}` +
            `${p.ageDays === null ? "" : ` (${p.ageDays}d)`}\n`,
        );
      }
      process.stdout.write("\n");
    }
}
