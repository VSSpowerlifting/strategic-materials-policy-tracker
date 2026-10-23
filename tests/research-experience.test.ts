import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import {
  getInvestigationEntries,
  getPublicProjectInvestigation,
} from "../lib/research-experience";
import {
  getProjectById,
  getEventById,
  getSourceById,
  getAllProjectMilestones,
  getDatasetSummary,
} from "../lib/data";
import { projectStack } from "../lib/capital-intelligence";
import {
  ProjectOverview,
  ProjectFinancialRecord,
  ProjectUnknowns,
} from "../components/projects/project-investigation";
import Home from "../app/page";

const wagerup = "prj-au-alcoa-sojitz-gallium";

test("featured investigations omit unavailable public records or source references", () => {
  const all = getInvestigationEntries();
  assert.equal(all.length, 3);
  assert.ok(all.every((entry) => entry.name && entry.href.includes(entry.id)));
  const absent = getInvestigationEntries({
    project: () => undefined,
    event: () => undefined,
    source: () => undefined,
  });
  assert.deepEqual(absent, []);
  const onlyEvents = getInvestigationEntries({
    project: () => undefined,
    event: getEventById,
    source: getSourceById,
  });
  assert.deepEqual(
    onlyEvents.map((e) => e.id),
    ["evt-cn-gage-2023"],
  );
  const sourceUnavailable = getInvestigationEntries({
    project: getProjectById,
    event: getEventById,
    source: () => undefined,
  });
  assert.deepEqual(sourceUnavailable, []);
});

test("public project adapter preserves the authoritative stack and published milestone identity", () => {
  const result = getPublicProjectInvestigation(wagerup)!;
  assert.deepEqual(result.stack, projectStack(wagerup));
  assert.deepEqual(
    result.pathway.nativeMilestones.map((m) => m.id),
    getAllProjectMilestones()
      .filter((m) => m.projectId === wagerup)
      .map((m) => m.id),
  );
  assert.equal(result.pathway.verifiedCausality, "not_asserted");
  assert.equal(result.pathway.historicalCapitalTotals, "not_authorized");
  assert.equal(result.pathway.reviewGaps.absenceMeansInactivity, false);
  assert.ok(
    result.pathway.financing.every((f) =>
      result.stack.rows.some((c) => c.id === f.id),
    ),
  );
  for (const f of result.pathway.financing)
    for (const s of f.sourceEvidence)
      assert.equal(s.url, getSourceById(s.id)!.url);
  assert.equal(
    getPublicProjectInvestigation("prj-synthetic-unpublished-not-real"),
    null,
  );
});

test("financing remains visible without a published project milestone, with explicit gaps", () => {
  const investigation = getPublicProjectInvestigation("prj-us-stibnite")!;
  assert.ok(investigation.stack.rows.length > 0);
  assert.equal(investigation.pathway.nativeMilestones.length, 0);
  const overview = renderToStaticMarkup(
    createElement(ProjectOverview, { investigation }),
  );
  const gaps = renderToStaticMarkup(
    createElement(ProjectUnknowns, { investigation }),
  );
  assert.match(overview, /No source-reviewed project milestone is published/);
  assert.match(gaps, /does not|do not/);
  assert.match(
    gaps,
    /no exact milestone date or facility-wide conclusion is inferred/,
  );
  assert.doesNotMatch(
    overview + gaps,
    /construction has not begun|project has failed|0% complete/i,
  );
});

test("financial chronology retains amount wording, status dates, qualifications and evidence links", () => {
  const investigation = getPublicProjectInvestigation("prj-us-stibnite")!;
  const view = renderToStaticMarkup(
    createElement(ProjectFinancialRecord, { investigation }),
  );
  for (const row of investigation.stack.rows) {
    assert.ok(view.includes(`/capital/${row.id}`));
    for (const entry of row.financialStatusHistory)
      assert.ok(
        view.includes(
          getSourceById(entry.sourceId)!.url.replaceAll("&", "&amp;"),
        ),
      );
  }
  assert.match(view, /conditions precedent/);
  assert.match(view, /not construction or production/);
  assert.match(view, /current recorded terms, not historical amounts/);
  const synthetic = structuredClone(investigation);
  synthetic.stack.rows = [
    {
      ...synthetic.stack.rows[0],
      amount: null,
      financialStatusHistory: [
        { ...synthetic.stack.rows[0].financialStatusHistory[0], date: null },
      ],
    },
  ];
  const missing = renderToStaticMarkup(
    createElement(ProjectFinancialRecord, { investigation: synthetic }),
  );
  assert.match(missing, /Amount not stated/);
  assert.match(missing, /Exact status date not stated/);
  assert.doesNotMatch(missing, /<time /);
});

test("homepage coverage reconciles to public loaders and the opening leads straight to evidence", () => {
  const view = renderToStaticMarkup(createElement(Home));
  const counts = getDatasetSummary();
  for (const count of [
    counts.events,
    counts.financialCommitments,
    counts.projects,
    counts.projectMilestones,
  ])
    assert.ok(view.includes(`>${count}</dd>`));
  assert.match(view, /Curated revision/);
  assert.match(view, /not all government activity/);
  assert.match(view, /href="\/events\?material=gallium"/);
  assert.match(view, /href="\/projects\/prj-au-alcoa-sojitz-gallium"/);
  assert.doesNotMatch(view, /<dialog/);
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.doesNotMatch(layout, /TitlePage/);
  assert.match(layout, /Skip to content/);
});


test("public edition body and metadata text remain readable on each research surface", () => {
  const css = readFileSync("app/globals.css", "utf8").split(".research-edition {")[1].split("}")[0];
  const color = (name: string) => new RegExp("--" + name + ": (#.+?);").exec(css)![1];
  const luminance = (hex: string) => {
    const channels = hex.slice(1).match(/../g)!.map(v => parseInt(v, 16) / 255)
      .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const contrast = (a: string, b: string) => {
    const values = [luminance(color(a)), luminance(color(b))].sort((x, y) => x - y);
    return (values[1] + .05) / (values[0] + .05);
  };
  for (const surface of ["bg", "surface", "elevated", "plate"])
    for (const ink of ["fg", "muted", "faint", "accent"])
      assert.ok(contrast(surface, ink) >= 4.5, `${ink} on ${surface}`);
  for (const ink of ["paper-fg", "paper-muted", "paper-faint", "paper-accent"])
    assert.ok(contrast("paper", ink) >= 4.5, ink);
});
