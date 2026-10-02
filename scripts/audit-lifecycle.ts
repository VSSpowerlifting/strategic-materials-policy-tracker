import { getAllFinancialCommitments } from "../lib/data";
import {
  bundleLifecycleRefreshQueue,
  deriveLifecycleRefreshQueue,
  formatLifecycleRefreshReport,
} from "../lib/lifecycle-refresh";
import { site } from "../lib/site";

const arg = process.argv.slice(2).find((value) => value.startsWith("--as-of="));
const asOf = arg ? arg.slice("--as-of=".length) : site.lastUpdated;
const commitments = getAllFinancialCommitments();
const rows = deriveLifecycleRefreshQueue(commitments, asOf);
const bundles = bundleLifecycleRefreshQueue(commitments, rows);

process.stdout.write(formatLifecycleRefreshReport(bundles, asOf));
