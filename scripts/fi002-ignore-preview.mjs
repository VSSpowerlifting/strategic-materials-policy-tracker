// Vercel ignoreCommand: exit 0 skips, exit 1 permits the ordinary build.
// Scope strictly to the preparation branch; do not change production behavior.
process.exit(
  process.env.VERCEL_GIT_COMMIT_REF === "codex/fi002-website-release-candidate"
    ? 0
    : 1,
);
