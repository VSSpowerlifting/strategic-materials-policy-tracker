import { test } from "node:test";
import assert from "node:assert/strict";

import { isExampleCandidateFile } from "@/scripts/candidate-files";

// Regression guard: the validator's private-candidate count must never
// silently include the checked-in candidates.example.json fixture again.
test("flags the checked-in example fixture", () => {
  assert.equal(isExampleCandidateFile("candidates.example.json"), true);
});

test("does not flag the real private candidates file", () => {
  assert.equal(isExampleCandidateFile("candidates.json"), false);
});

test("does not flag other private *.local.json candidate files", () => {
  assert.equal(isExampleCandidateFile("scratch.local.json"), false);
});
