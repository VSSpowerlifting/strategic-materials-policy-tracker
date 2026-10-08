/**
 * Local, read-only shadow audit. Run: node --import tsx scripts/audit-project-execution.ts
 * Optional --json is accepted for programmatic automation. No network or writes.
 */
import { getAllFinancialCommitments, getAllProjects, getAllSources } from "../lib/data";
import { auditLegacyProjectExecution, formatLegacyExecutionAudit } from "../lib/project-execution-audit";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--json")) {
  console.error("Usage: node --import tsx scripts/audit-project-execution.ts [--json]");
  process.exitCode = 2;
} else {
  const report = auditLegacyProjectExecution(
    getAllFinancialCommitments(), getAllProjects(), getAllSources(),
  );
  process.stdout.write(formatLegacyExecutionAudit(report));
}
