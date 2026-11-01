import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import {
  currentFinancialStatus,
  financialStatusOn,
  isEndedOn,
  legalStandingOn,
} from "@/lib/capital-control";
import { stageResponseMap } from "@/lib/capital-intelligence";
import {
  getFinancialCommitmentById,
  getProjectById,
} from "@/lib/data";
import { deriveLifecycleRefreshQueue } from "@/lib/lifecycle-refresh";

test("5N's undated partial-disbursement evidence does not leak before its 2026-10-04 evidence boundary", () => {
  const row = getFinancialCommitmentById("fin-us-dod-5n-germanium-2024")!;

  assert.equal(currentFinancialStatus(row), "partially_disbursed");
  assert.equal(financialStatusOn(row, "2024-04-10"), null);
  assert.equal(financialStatusOn(row, "2024-04-11"), "contracted");
  assert.equal(financialStatusOn(row, "2026-10-03"), "contracted");
  assert.equal(financialStatusOn(row, "2026-10-04"), "partially_disbursed");
  assert.equal(legalStandingOn(row, "2026-10-03"), "binding");
  assert.equal(legalStandingOn(row, "2024-04-10"), null);
});

test("an undated status can enter history from a dated source publication without inventing an effective day", () => {
  const row = getFinancialCommitmentById("fin-jp-jare-lynas-2023-equity")!;

  assert.equal(row.financialStatusHistory.at(-1)?.status, "disbursed");
  assert.equal(row.financialStatusHistory.at(-1)?.date, null);
  assert.equal(financialStatusOn(row, "2023-04-20"), "contracted");
  assert.equal(financialStatusOn(row, "2023-04-21"), "disbursed");
});

test("verified SEC filing date moves only the earliest knowable status boundary, not its effective day", () => {
  const otia = getFinancialCommitmentById("fin-us-army-perpetua-antimony-otia")!;
  const dpa = getFinancialCommitmentById("fin-us-dod-perpetua-stibnite-dpa")!;

  // The Q2 10-Q was publicly filed on 2026-08-14. Its fiscal period ended
  // 2026-06-30, but a reported state is not retroactively known on that day.
  assert.equal(otia.financialStatusHistory.at(-1)?.status, "partially_disbursed");
  assert.equal(otia.financialStatusHistory.at(-1)?.date, null);
  assert.equal(financialStatusOn(otia, "2026-08-13"), "contracted");
  assert.equal(financialStatusOn(otia, "2026-08-14"), "partially_disbursed");
  assert.equal(financialStatusOn(otia, "2026-10-01"), "partially_disbursed");

  assert.equal(dpa.financialStatusHistory.at(-1)?.status, "disbursed");
  assert.equal(dpa.financialStatusHistory.at(-1)?.date, null);
  assert.equal(financialStatusOn(dpa, "2026-08-13"), "contracted");
  assert.equal(financialStatusOn(dpa, "2026-08-14"), "disbursed");
});

test("access-only evidence remains conservative when neither status nor source has a publication date", () => {
  // JOGMEC grant index's original registered source still has no verified
  // publication day. Its 2026-10-03 access receipt is the earliest evidence
  // boundary, NOT an invented legal decision day.
  const row = getFinancialCommitmentById("fin-jp-jogmec-santoku-rare-earth-grant")!;
  assert.equal(row.financialStatusHistory.at(-1)?.status, "decided");
  assert.equal(row.financialStatusHistory.at(-1)?.date, null);
  assert.equal(financialStatusOn(row, "2026-10-02"), "announced");
  assert.equal(financialStatusOn(row, "2026-10-03"), "decided");
});

test("historical lifecycle refresh uses the financial status evidenced by the as-of date and ignores later financial reviews", () => {
  const row = getFinancialCommitmentById("fin-us-dod-5n-germanium-2024")!;
  const project = getProjectById(row.projectId!)!;
  const [before] = deriveLifecycleRefreshQueue([row], [project], "2026-10-03").rows;
  const [after] = deriveLifecycleRefreshQueue([row], [project], "2026-10-04").rows;

  assert.equal(before.financial.status, "contracted");
  assert.equal(before.financial.statusDate, "2024-04-11");
  assert.equal(before.financial.checkedAt, null);
  assert.equal(before.financial.referenceDate, "2024-04-11");
  assert.ok(before.financial.ageDays !== null && before.financial.ageDays >= 0);

  assert.equal(after.financial.status, "partially_disbursed");
  assert.equal(after.financial.statusDate, null);
  assert.equal(after.financial.checkedAt, "2026-10-04");
  assert.equal(after.financial.referenceDate, "2026-10-04");
  assert.equal(after.financial.ageDays, 0);
});

test("stageResponseMap uses as-of endedness instead of a row's later current status", () => {
  const base = structuredClone(getFinancialCommitmentById("fin-us-dod-5n-germanium-2024")!);
  base.id = "fin-test-future-lapse";
  base.relationships = [];
  base.financialStatusHistory = [
    {
      status: "contracted",
      date: "2026-01-01",
      sourceId: base.financialStatusHistory[1].sourceId,
      note: null,
    },
    {
      status: "lapsed",
      date: "2026-06-01",
      sourceId: base.financialStatusHistory[1].sourceId,
      note: null,
    },
  ];
  delete base.lifecycleReview;

  assert.equal(isEndedOn(base, "2026-05-31"), false);
  assert.equal(isEndedOn(base, "2026-06-01"), true);

  const before = stageResponseMap("2026-05-31", [base], [], []);
  const after = stageResponseMap("2026-06-01", [base], [], []);
  for (const stage of base.stages) {
    assert.deepEqual(before.get("germanium")?.get(stage)?.capitalIds, [base.id]);
    assert.deepEqual(before.get("germanium")?.get(stage)?.endedIds, []);
    assert.deepEqual(after.get("germanium")?.get(stage)?.capitalIds, []);
    assert.deepEqual(after.get("germanium")?.get(stage)?.endedIds, [base.id]);
  }
});

test("concern-response CLI wires --as-of through financial standing", () => {
  const output = execFileSync(
    process.execPath,
    ["--import", "tsx", "scripts/analyze-concern-response.ts", "--as-of", "2026-10-03"],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  const projectRow = output
    .split("\n")
    .find((line) => line.includes("us-dod-5n-germanium-2024: commitment"));
  assert.ok(projectRow, "5N row appears in the generated project register");
  assert.match(projectRow, /us-dod-5n-germanium-2024: commitment, contracted/);
  assert.doesNotMatch(projectRow, /us-dod-5n-germanium-2024: commitment, partially_disbursed/);
  assert.match(output, /Financial rows by legal standing on the as-of date/);
});
