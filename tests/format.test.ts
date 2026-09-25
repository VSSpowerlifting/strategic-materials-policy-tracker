import { test } from "node:test";
import assert from "node:assert/strict";

import { formatDate, formatDateLong, formatMonthYear, isoYear } from "@/lib/format";

test("formatDate is deterministic and locale-free", () => {
  assert.equal(formatDate("2025-04-04"), "4 Apr 2025");
  assert.equal(formatDate("2025-11-15"), "15 Nov 2025");
  assert.equal(formatDate("2025-12-01T09:00:00Z"), "1 Dec 2025");
});

test("formatDate passes non-ISO input through unchanged", () => {
  assert.equal(formatDate("not yet coded"), "not yet coded");
});

test("formatMonthYear and isoYear", () => {
  assert.equal(formatMonthYear("2025-04-04"), "Apr 2025");
  assert.equal(isoYear("2025-04-04"), "2025");
});

test("formatDateLong spells the month out and passes non-ISO input through", () => {
  assert.equal(formatDateLong("2026-09-23"), "23 September 2026");
  assert.equal(formatDateLong("2025-05-01"), "1 May 2025");
  assert.equal(formatDateLong("not yet coded"), "not yet coded");
});
