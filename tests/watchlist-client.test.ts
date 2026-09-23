import { test } from "node:test";
import assert from "node:assert/strict";

import { addId, parseStoredIds, removeId, toggleId } from "@/lib/watchlist-client";

// These test only the pure list/parse logic. The localStorage- and
// window-event-touching functions (getSavedEventIds, saveEvent, unsaveEvent,
// toggleSavedEvent, subscribeSavedEvents) are thin wrappers around this logic
// plus browser APIs unavailable under node:test; they are exercised by
// browser testing instead, the same boundary this codebase already draws for
// clipboard code in components/cite-block.tsx.

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
