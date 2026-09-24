import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ACTOR_HOME_COUNTRIES,
  EU_MEMBER_STATES,
  LAYER_KEYS,
  SUMMED_LAYERS,
  actorPortfolio,
  actorsWithCapital,
  actorsWithDesignations,
  capitalFlows,
  coInvestments,
  controlsAtProjectStages,
  designationGeography,
  designationPortfolio,
  layerOf,
  layers,
  organizationRoles,
  partOfDescendants,
  programmeLedger,
  projectStack,
  rowGeography,
  stageResponseMap,
} from "@/lib/capital-intelligence";
import { buildCapitalIntelligenceSummary } from "@/lib/capital-intelligence-summary";
import { totalCommitments } from "@/lib/capital-control";
import {
  getAllFinancialCommitments,
  getAllOrganizations,
  getAllProgrammes,
  getAllProjectDesignations,
  getAllProjects,
  getFinancialCommitmentById,
} from "@/lib/data";
import { site } from "@/lib/site";
import { JURISDICTIONS } from "@/lib/types";
import type { FinancialCommitment } from "@/lib/types";

// Capital intelligence (v0.6): the derived views. Fixture rows are in-memory
// only; corpus assertions name records by id and never pin a corpus count.

function fin(id: string, over: Partial<FinancialCommitment> = {}): FinancialCommitment {
  return {
    id,
    eventId: "evt-x",
    relationships: [],
    instrument: "grant",
    valueRole: "commitment",
    capitalSource: "public",
    amount: { value: "100", currency: "USD", qualifier: "exact", amountAsStated: "$100", currencyBasis: "issuer_context" },
    provider: null,
    providerJurisdiction: "us",
    providerOrgIds: [],
    legalAuthority: null,
    programmeId: null,
    recipient: null,
    recipientOrgIds: [],
    project: null,
    projectId: null,
    facility: null,
    locations: [],
    stages: [],
    stageAllocation: "not_stated",
    materialIds: [],
    materialAttribution: "not_stated",
    untrackedMaterialsAsStated: [],
    financialStatusHistory: [{ status: "announced", date: "2025-01-01", sourceId: "s" }],
    implementationStatusHistory: [],
    terms: [],
    outcomes: [],
    evidence: [],
    ...over,
  };
}
const at = (countryCode: string | null) => ({ countryCode, subnational: null, asStated: countryCode ?? "somewhere" });

// --- Home territory -------------------------------------------------------------------

test("every actor has a home territory; the EU is its 27 member states, the UK is GB, Greenland is not EU", () => {
  assert.deepEqual(Object.keys(ACTOR_HOME_COUNTRIES).sort(), [...JURISDICTIONS].sort());
  assert.equal(EU_MEMBER_STATES.length, 27);
  assert.equal(new Set(EU_MEMBER_STATES).size, 27);
  for (const cc of EU_MEMBER_STATES) assert.match(cc, /^[A-Z]{2}$/);
  assert.ok(ACTOR_HOME_COUNTRIES.eu.includes("GR") && !ACTOR_HOME_COUNTRIES.eu.includes("EL"), "Greece is GR in ISO 3166-1");
  assert.ok(!ACTOR_HOME_COUNTRIES.eu.includes("GL"), "Greenland is not in the EU");
  assert.ok(!ACTOR_HOME_COUNTRIES.eu.includes("GB"), "the UK is not in the EU");
  assert.deepEqual(ACTOR_HOME_COUNTRIES.uk, ["GB"]);
  assert.deepEqual(ACTOR_HOME_COUNTRIES.other, []);
});

test("geography reads the row's own location first, then its project's, and never guesses", () => {
  assert.deepEqual(rowGeography(fin("a", { locations: [at("US")] })), { geography: "domestic", countries: ["US"], basis: "row" });
  assert.deepEqual(rowGeography(fin("b", { locations: [at("AU")] })), { geography: "abroad", countries: ["AU"], basis: "row" });
  assert.deepEqual(rowGeography(fin("c", { locations: [at("US"), at("AU")] })), {
    geography: "domestic_and_abroad",
    countries: ["AU", "US"],
    basis: "row",
  });
  // A location with no country says nothing about the country.
  assert.deepEqual(rowGeography(fin("d", { locations: [at(null)] })), { geography: "not_stated", countries: [], basis: null });
  assert.deepEqual(rowGeography(fin("e")), { geography: "not_stated", countries: [], basis: null });
  // The project's location stands in when the row states none: Lofdal is in Namibia.
  assert.deepEqual(rowGeography(fin("f", { providerJurisdiction: "japan", projectId: "prj-na-lofdal" })), {
    geography: "abroad",
    countries: ["NA"],
    basis: "project",
  });
  // EU money in a member state is domestic; in Greenland it is not.
  assert.equal(rowGeography(fin("g", { providerJurisdiction: "eu", locations: [at("SE")] }))!.geography, "domestic");
  assert.equal(rowGeography(fin("h", { providerJurisdiction: "eu", locations: [at("GL")] }))!.geography, "abroad");
  // A package that states no location takes its parts' locations, but only when every part states one.
  const pkg = fin("fin-pkg");
  const partA = fin("fin-pkg-a", { relationships: [{ commitmentId: "fin-pkg", relationship: "part_of", sourceId: "s" }], locations: [at("US")] });
  const partB = fin("fin-pkg-b", { relationships: [{ commitmentId: "fin-pkg", relationship: "part_of", sourceId: "s" }], projectId: "prj-na-lofdal" });
  assert.deepEqual(rowGeography(pkg, "us", [pkg, partA, partB]), { geography: "domestic_and_abroad", countries: ["NA", "US"], basis: "parts" });
  const partC = fin("fin-pkg-c", { relationships: [{ commitmentId: "fin-pkg", relationship: "part_of", sourceId: "s" }] });
  assert.deepEqual(rowGeography(pkg, "us", [pkg, partA, partC]), { geography: "not_stated", countries: [], basis: null });
  // The Kingston awards state no location; both awards point to projects in Kingston, Ontario.
  assert.deepEqual(rowGeography(getFinancialCommitmentById("fin-ca-cmrdd-2024-kingston-awards")!), { geography: "domestic", countries: ["CA"], basis: "parts" });
  // No government, no geography: private money has no home territory to compare with.
  assert.equal(rowGeography(fin("i", { providerJurisdiction: null })), null);
});

// --- Layers ---------------------------------------------------------------------------------

test("only committed public money and joint-vehicle money are summed, each apart; everything else is listed", () => {
  const rows = [
    fin("fin-a"),
    fin("fin-b", { capitalSource: "public_enterprise" }),
    fin("fin-c", { capitalSource: "mixed_vehicle" }),
    fin("fin-d", { capitalSource: "private", providerJurisdiction: null }),
    fin("fin-e", { valueRole: "funding_option" }),
    fin("fin-f", { valueRole: "program_envelope" }),
    fin("fin-g", { valueRole: "lending_authority" }),
    fin("fin-h", { valueRole: "private_financing", capitalSource: "private", providerJurisdiction: null }),
    fin("fin-i", { valueRole: "total_project_cost", capitalSource: "not_stated", providerJurisdiction: null }),
  ];
  const ls = layers(rows, rows);
  assert.deepEqual(
    ls.map((l) => [l.key, l.rows.map((r) => r.id), l.totals !== null]),
    [
      ["public_commitment", ["fin-a", "fin-b"], true],
      ["joint_vehicle_commitment", ["fin-c"], true],
      ["other_commitment", ["fin-d"], false],
      ["funding_option", ["fin-e"], false],
      ["envelope", ["fin-f", "fin-g"], false],
      ["private_financing", ["fin-h"], false],
      ["total_project_cost", ["fin-i"], false],
    ],
  );
  const pub = ls.find((l) => l.key === "public_commitment")!.totals!;
  assert.equal(pub.currencies[0].status, "summed");
  assert.deepEqual(pub.currencies[0].status === "summed" && pub.currencies[0].instruments.map((i) => [i.instrument, i.byQualifier]), [["grant", { exact: "200" }]]);
  assert.deepEqual(SUMMED_LAYERS, ["public_commitment", "joint_vehicle_commitment"]);
  for (const key of LAYER_KEYS) assert.ok(typeof key === "string");
  // Every corpus row falls in exactly one layer.
  for (const c of getAllFinancialCommitments()) assert.ok(LAYER_KEYS.includes(layerOf(c)), c.id);
});

// --- Organizations --------------------------------------------------------------------------

test("an office rolls up into its department; a joint vehicle never rolls up into its founders", () => {
  assert.ok(partOfDescendants("org-us-dod").has("org-us-osc"));
  assert.ok(!partOfDescendants("org-jp-jogmec").has("org-jare"));
  assert.ok(!partOfDescendants("org-sojitz").has("org-jare"));

  const dod = organizationRoles("org-us-dod");
  assert.ok(dod.provided.some((c) => c.id === "fin-us-osc-vulcan-reelement-2025-joint-commitment"), "OSC rows count in DoD's portfolio");
  assert.ok(dod.provided.some((c) => c.id === "fin-us-dod-mp-2025-preferred-equity"));
  assert.deepEqual(dod.rolledUpIds, ["org-us-dod", "org-us-osc"]);
  const osc = organizationRoles("org-us-osc");
  assert.ok(!osc.provided.some((c) => c.id === "fin-us-dod-mp-2025-preferred-equity"), "a department's rows do not roll down to its office");

  const jogmec = organizationRoles("org-jp-jogmec");
  assert.ok(!jogmec.provided.some((c) => c.id === "fin-jp-jare-lynas-2023-equity"), "JARE's equity is not JOGMEC's money");
  assert.ok(jogmec.provided.some((c) => c.id === "fin-jp-jogmec-lofdal-2026-equity"));
  assert.ok(jogmec.sponsoredProjects.some((p) => p.id === "prj-na-lofdal"));

  const lynas = organizationRoles("org-lynas");
  assert.deepEqual(lynas.received.map((c) => c.id).sort(), ["fin-jp-jare-lynas-2023-equity", "fin-jp-jare-lynas-2023-hre-offtake"]);
});

test("the renamed department is one record, so its portfolio does not split", () => {
  const dod = getAllOrganizations().filter((o) => o.name.includes("Department of Defense") || o.aliases.includes("Department of War"));
  assert.equal(dod.length, 1);
  assert.ok(dod[0].aliases.includes("Department of War"));
});

// --- Projects -------------------------------------------------------------------------------

test("a capital stack is layers of one value role each, with no grand total", () => {
  const stack = projectStack("prj-us-mp-10x-facility")!;
  assert.deepEqual(
    stack.layers.map((l) => [l.key, l.rows.map((r) => r.id)]),
    [
      ["public_commitment", ["fin-us-dod-mp-2025-magnet-offtake"]],
      ["private_financing", ["fin-us-dod-mp-2025-bank-financing"]],
    ],
  );
  // The offtake states no amount, so the public layer sums nothing and lists it as unquantified.
  const pub = stack.layers[0].totals!;
  assert.deepEqual(pub.currencies, []);
  assert.deepEqual(pub.unquantifiedIds, ["fin-us-dod-mp-2025-magnet-offtake"]);
  // Private financing is listed, never summed, and never merged with public money.
  assert.equal(stack.layers[1].totals, null);
  for (const key of ["total", "grandTotal", "publicShare", "leverage"]) assert.ok(!(key in stack), `stack has no ${key}`);
  assert.deepEqual(stack.governments, ["us"]);
});

test("a package inside a stack is counted once, its parts left out of the sum", () => {
  const stack = projectStack("prj-gb-hemerdon")!;
  const pub = stack.layers.find((l) => l.key === "public_commitment")!.totals!;
  assert.equal(pub.currencies.length, 1);
  const gbp = pub.currencies[0];
  assert.equal(gbp.status, "summed");
  assert.deepEqual(gbp.countedIds, ["fin-uk-nwf-2026-tungsten-west-package"]);
  assert.deepEqual(gbp.nestedIds.sort(), ["fin-uk-nwf-2026-tungsten-west-equity", "fin-uk-nwf-2026-tungsten-west-lending"]);
  // The package combines equity and lending without a split in its own figure, so it is listed, never summed.
  assert.deepEqual(gbp.status === "summed" && gbp.instruments.map((i) => [i.instrument, i.summed, i.byQualifier]), [["mixed", false, null]]);
});

test("co-investment is classed by who provides the capital, and counts no envelope or project cost", () => {
  const byProject = new Map(coInvestments().map((c) => [c.project.id, c]));
  assert.deepEqual(byProject.get("prj-au-alcoa-sojitz-gallium")?.kinds, ["cross_government"]);
  assert.deepEqual(byProject.get("prj-au-alcoa-sojitz-gallium")?.governments, ["australia", "us"]);
  assert.deepEqual(byProject.get("prj-us-mp-10x-facility")?.kinds, ["public_and_private"]);
  // Hemerdon: NWF and the UK Government provide capital; the EU recognizes it as a Strategic Project.
  assert.deepEqual(byProject.get("prj-gb-hemerdon")?.kinds, ["several_public_bodies", "capital_and_designation"]);
  assert.deepEqual(byProject.get("prj-gb-hemerdon")?.governments, ["uk"]);
  assert.deepEqual(byProject.get("prj-gb-hemerdon")?.designatingGovernments, ["eu"]);
  assert.ok(!byProject.has("prj-na-lofdal"), "one provider is not co-investment");
  assert.ok(!byProject.has("prj-fr-caremag"), "a designation alone is not co-investment");
  // Multilateral public money beside an EU designation: EBRD equity in Sarytogan.
  assert.deepEqual(byProject.get("prj-kz-sarytogan")?.kinds, ["capital_and_designation"]);
  assert.deepEqual(byProject.get("prj-kz-sarytogan")?.governments, [], "the EBRD is credited to no government");
});

test("control clauses at a project's materials and stages are found by item overlap, with their status on the as-of date", () => {
  const project = getAllProjects().find((p) => p.id === "prj-us-mountain-pass-samarium")!;
  const found = controlsAtProjectStages(project, site.lastUpdated);
  const ids = found.map((f) => f.measure.id);
  assert.ok(ids.includes("ctl-cn-ree-2025-10-foreign-direct-product-licensing"));
  assert.ok(ids.includes("ctl-cn-ree-regs-2024-total-quantity-control"));
  // A clause with no coded stage never matches, however it restricts the material.
  assert.ok(!ids.includes("ctl-cn-ree-2025-10-prohibited-end-uses"));
  const fdp = found.find((f) => f.measure.id === "ctl-cn-ree-2025-10-foreign-direct-product-licensing")!;
  assert.equal(fdp.status, "suspended");
});

// --- Programmes -----------------------------------------------------------------------------

test("a programme ledger lists its ceilings apart and sums recorded awards, never dividing one by the other", () => {
  const osc = programmeLedger("prg-us-osc-critical-minerals-lending")!;
  assert.deepEqual(osc.envelopes.map((c) => c.id).sort(), ["fin-us-osc-obbba-2025-credit-subsidy", "fin-us-osc-obbba-2025-lending-authority"]);
  const usd = osc.recordedAwards!.totals!.currencies.find((c) => c.currency === "USD")!;
  assert.equal(usd.status, "summed");
  // The joint commitment counts once; its two loans are its parts and are not added again.
  assert.deepEqual(usd.countedIds.sort(), ["fin-us-dod-mp-2025-samarium-loan", "fin-us-osc-vulcan-reelement-2025-joint-commitment"]);
  assert.deepEqual(usd.nestedIds.sort(), ["fin-us-osc-vulcan-reelement-2025-reelement-loan", "fin-us-osc-vulcan-reelement-2025-vulcan-elements-loan"]);
  // Both are loans, so they share one instrument's sums: the samarium loan is binding, the joint commitment is not yet.
  assert.deepEqual(usd.status === "summed" && usd.instruments.map((i) => [i.instrument, i.binding, i.notYetBinding]), [["loan", { exact: "150000000" }, { exact: "700000000" }]]);
  for (const key of ["utilisation", "utilization", "share", "remaining", "undrawn"]) assert.ok(!(key in osc), `ledger has no ${key}`);
});

test("a programme's ledger takes in the programmes beneath it", () => {
  const cms = programmeLedger("prg-ca-cms")!;
  assert.deepEqual(cms.children.map((g) => g.id), ["prg-ca-cmrdd"]);
  assert.ok(cms.rows.some((c) => c.programmeId === "prg-ca-cmrdd"));
  assert.deepEqual(cms.envelopes.map((c) => c.id), ["fin-ca-cms-2022-budget-envelope"]);
  const cmrdd = programmeLedger("prg-ca-cmrdd")!;
  assert.equal(cmrdd.parent?.id, "prg-ca-cms");
  assert.ok(!cmrdd.rows.some((c) => c.id === "fin-ca-cms-2022-budget-envelope"), "a parent's envelope is not a child's row");
});

test("a row drawn from one programme's facility and part of another's reserve belongs to the facility's programme", () => {
  const tx = getFinancialCommitmentById("fin-au-cmsr-2026-transactions")!;
  assert.equal(tx.programmeId, "prg-au-cmf");
  assert.ok(programmeLedger("prg-au-cmf")!.rows.some((c) => c.id === tx.id));
  assert.ok(!programmeLedger("prg-au-cmsr")!.rows.some((c) => c.id === tx.id));
});

// --- Portfolios and flows -------------------------------------------------------------------

test("an actor's portfolio counts a package once and sums public and joint-vehicle money apart", () => {
  const uk = actorPortfolio("uk");
  // The NWF package with its two parts folded in, the procurement right and the DBT fund.
  assert.equal(uk.counts.rows, 3);
  assert.equal(uk.counts.byLayer.public_commitment, 2);
  assert.equal(uk.counts.byLayer.envelope, 1);
  const japan = actorPortfolio("japan");
  assert.equal(japan.jointVehicleTotals.currencies[0]?.currency, "AUD", "JARE's equity is summed apart from public money");
  assert.ok(japan.publicTotals.currencies.every((c) => c.currency !== "AUD"));
  // Totals equal a direct call over the same rows: nothing is added outside totalCommitments.
  const all = getAllFinancialCommitments();
  const direct = totalCommitments(all.filter((c) => c.providerJurisdiction === "us" && layerOf(c) === "public_commitment"), all);
  assert.deepEqual(actorPortfolio("us").publicTotals, direct);
});

test("flows count committed rows from a government to each stated country, packages once", () => {
  const flows = capitalFlows();
  const cell = (a: string, d: string) => flows.find((f) => f.actor === a && f.destination === d);
  assert.deepEqual(cell("uk", "GB")?.rowIds.sort(), ["fin-uk-nwf-2026-tungsten-procurement-right", "fin-uk-nwf-2026-tungsten-west-package"]);
  assert.deepEqual(cell("japan", "NA")?.rowIds, ["fin-jp-jogmec-lofdal-2026-equity"]);
  assert.ok(cell("us", "AU")?.rowIds.includes("fin-us-alcoa-sojitz-gallium-2025-equity"));
  for (const f of flows) {
    assert.ok(f.destination === "not_stated" || /^[A-Z]{2}$/.test(f.destination));
    for (const id of f.rowIds) assert.equal(getFinancialCommitmentById(id)?.valueRole, "commitment");
  }
  assert.ok(!flows.some((f) => f.rowIds.includes("fin-uk-nwf-2026-tungsten-west-equity")), "a part is folded into its package");
});

test("the stage response map places capital and controls by material and stage, counting records", () => {
  const map = stageResponseMap(site.lastUpdated);
  const magnets = map.get("ndfeb-magnets")?.get("component_manufacturing");
  assert.ok(magnets?.capitalIds.includes("fin-us-dod-mp-2025-magnet-offtake"));
  assert.ok(magnets?.controlIds.includes("ctl-cn-ree-2025-04-export-licensing"));
  assert.deepEqual(magnets?.controlsByIssuer.china?.includes("ctl-cn-ree-2025-04-export-licensing"), true);
  // Envelopes are ceilings, not capital aimed at a stage.
  for (const row of map.values())
    for (const cell of row.values())
      for (const id of cell.capitalIds) assert.ok(["commitment", "funding_option"].includes(getFinancialCommitmentById(id)!.valueRole), id);
});

// --- The summary API -------------------------------------------------------------------------

/** Every key anywhere in a JSON value. */
function keys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => keys(v, out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      keys(v, out);
    }
  return out;
}

test("the summary carries no ratio, share, percentage, utilisation or grand total, and no money as a number", () => {
  const summary = buildCapitalIntelligenceSummary();
  // Keys are split into words ("publicShare" -> public, share; "grand_total" -> grand, total) so that a
  // stage such as "exploration" is not mistaken for a ratio.
  const forbidden = new Set(["share", "percent", "percentage", "pct", "ratio", "leverage", "crowding", "utilisation", "utilization", "grand", "overall", "converted", "equivalent", "score", "index", "rank"]);
  const words = (k: string) => k.split(/[_\-\s]+|(?=[A-Z])/).map((w) => w.toLowerCase());
  for (const k of keys(summary)) assert.ok(!words(k).some((w) => forbidden.has(w)), `summary key "${k}" suggests a synthetic figure`);
  // Money only ever appears as decimal strings inside CurrencyTotals or amounts.
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    else if (typeof v === "number") assert.ok(!/byQualifier|binding|notYetBinding|amount|value/.test(path), `${path} is a number`);
  };
  walk(summary, "");
  assert.deepEqual(buildCapitalIntelligenceSummary(), summary, "deterministic");
  assert.equal(summary.asOf, site.lastUpdated);
  assert.equal(summary.programmes.length, getAllProgrammes().length);
});

test("a government's designations are counted apart from its capital, at home and abroad by the project's country", () => {
  const eu = designationPortfolio("eu");
  assert.equal(eu.counts.designations, eu.designationIds.length);
  assert.ok(eu.counts.byGeography.domestic > 0 && eu.counts.byGeography.abroad > 0);
  // Greenland is an overseas territory, not EU territory: the Norway-Greenland graphite project is abroad.
  const d = getAllProjectDesignations().find((x) => x.id === "dsg-eu-crma-greenroc-norgraph")!;
  assert.equal(designationGeography(d, "eu").geography, "abroad");
  // The graphite initiative in France, Namibia and Germany straddles the border.
  const ngc = getAllProjectDesignations().find((x) => x.id === "dsg-eu-crma-ngc-graphite")!;
  assert.equal(designationGeography(ngc, "eu").geography, "domestic_and_abroad");
  // Substitution projects carry no stage and are counted as such.
  assert.equal(eu.counts.noStage, getAllProjectDesignations().filter((x) => !x.stages.length).length);
  // Designations never enter a money figure: the EU's capital portfolio counts its financial rows only.
  const euCapital = actorPortfolio("eu");
  assert.equal(euCapital.counts.rows, getAllFinancialCommitments().filter((c) => c.providerJurisdiction === "eu").length);
  assert.ok(actorsWithCapital().includes("eu"));
  assert.deepEqual(actorsWithDesignations(), ["eu", "japan"]);
  // Japan's certified plans: three in Japan, one whose location the list does not state.
  const jp = designationPortfolio("japan");
  assert.equal(jp.counts.byGeography.domestic, 3);
  assert.equal(jp.counts.byGeography.not_stated, 1);
  assert.equal(jp.counts.projectsWithCapital, jp.counts.designations, "every certified plan carries its JOGMEC grant row");
  // Hemerdon (UK capital), CO2Graphite (EIB loan) and Sarytogan (EBRD equity) carry both a designation and a financial row.
  assert.equal(eu.counts.projectsWithCapital, 3);
});

test("the response map places designations beside capital and controls without counting them as capital", () => {
  const map = stageResponseMap(site.lastUpdated);
  const separation = map.get("rare-earth-elements")?.get("separation");
  assert.ok(separation?.designationIds.includes("dsg-eu-crma-pulawy"));
  assert.deepEqual(separation?.designationActors, ["eu"]);
  for (const row of map.values()) for (const cell of row.values()) for (const id of cell.capitalIds) assert.ok(id.startsWith("fin-"));
});
