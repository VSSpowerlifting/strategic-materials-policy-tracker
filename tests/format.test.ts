import { test } from "node:test";
import assert from "node:assert/strict";

import { formatDate, formatDateLong, formatDateLongUS, formatDateUS, formatMonthYear, isoYear } from "@/lib/format";

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

test("masthead and footer use U.S.-style dates without changing ISO semantics", () => {
  assert.equal(formatDateUS("2026-11-09"), "Nov 9, 2026");
  assert.equal(formatDateLongUS("2026-11-09"), "November 9, 2026");
  assert.equal(formatDateUS("not yet coded"), "not yet coded");
  assert.equal(formatDateLongUS("not yet coded"), "not yet coded");
});
