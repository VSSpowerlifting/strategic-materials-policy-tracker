/**
 * `data/candidates/candidates.example.json` is a checked-in fixture — the
 * shape reference for `CandidateRecord`, validated in CI like any other
 * candidate file — but it is not real private research and must never count
 * toward the private candidate inventory the validator reports.
 *
 * Pure and side-effect-free on purpose: `scripts/validate-data.ts` reads real
 * seed/candidate files at module load, which makes it unsafe to import
 * directly from a test. This predicate is the one bit of that logic worth
 * unit-testing, so it lives on its own.
 */
export function isExampleCandidateFile(fileName: string): boolean {
  return fileName.endsWith(".example.json");
}
