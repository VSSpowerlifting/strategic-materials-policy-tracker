import { getAllFinancialCommitments, getAllProjects } from "../lib/data";
import { deriveLifecycleRefreshQueue, formatLifecycleRefreshQueue } from "../lib/lifecycle-refresh";

function readAsOf(argv: readonly string[]): string {
  const inline = argv.find((arg) => arg.startsWith("--as-of="));
  if (inline) return inline.slice("--as-of=".length);
  const index = argv.indexOf("--as-of");
  if (index >= 0 && argv[index + 1]) return argv[index + 1];
  throw new Error("audit:lifecycle requires an explicit --as-of YYYY-MM-DD; it never reads today's date implicitly");
}

function assertDate(value: string): void {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`invalid --as-of date: ${value}`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  )
    throw new Error(`invalid --as-of date: ${value}`);
}

try {
  const asOf = readAsOf(process.argv.slice(2));
  assertDate(asOf);
  const queue = deriveLifecycleRefreshQueue(
    getAllFinancialCommitments(),
    getAllProjects(),
    asOf,
  );
  process.stdout.write(formatLifecycleRefreshQueue(queue));
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
