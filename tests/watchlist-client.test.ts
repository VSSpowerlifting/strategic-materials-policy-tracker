import { test } from "node:test";
import assert from "node:assert/strict";

import { addId, parseStoredIds, removeId, toggleId } from "@/lib/watchlist-client";

// Pure list/parse cases; browser storage and notifications are covered in
// saved-events-storage.test.ts and the saved-events Chromium workflow.

test("addId is idempotent and preserves existing order", () => {
  assert.deepEqual(addId([], "a"), ["a"]);
  assert.deepEqual(addId(["a"], "b"), ["a", "b"]);
  assert.deepEqual(addId(["a", "b"], "a"), ["a", "b"]);
});

test("removeId drops only the named id", () => {
  assert.deepEqual(removeId(["a", "b", "c"], "b"), ["a", "c"]);
  assert.deepEqual(removeId(["a"], "not-present"), ["a"]);
  assert.deepEqual(removeId([], "a"), []);
});

test("toggleId adds when absent and removes when present", () => {
  assert.deepEqual(toggleId(["a"], "b"), ["a", "b"]);
  assert.deepEqual(toggleId(["a", "b"], "b"), ["a"]);
});

test("parseStoredIds tolerates missing, malformed and mixed-type storage", () => {
  assert.deepEqual(parseStoredIds(null), []);
  assert.deepEqual(parseStoredIds("not json"), []);
  assert.deepEqual(parseStoredIds("{}"), []);
  assert.deepEqual(parseStoredIds("[1, 2, 3]"), []);
  assert.deepEqual(parseStoredIds(JSON.stringify(["evt-a", 1, null, "evt-b"])), ["evt-a", "evt-b"]);
  assert.deepEqual(parseStoredIds(JSON.stringify(["evt-a", "evt-b"])), ["evt-a", "evt-b"]);
});
