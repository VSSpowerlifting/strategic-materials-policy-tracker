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
import { isEnded, totalCommitments } from "@/lib/capital-control";
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
  // The 10X facility carries a US offtake and the banks' commitment letter, which lapsed undrawn on 2025-08-26:
  // ended money no longer backs the project, so it is not public-and-private co-investment.
  assert.ok(!byProject.has("prj-us-mp-10x-facility"), "a lapsed private letter beside one public row is not co-investment");
  const tenX = projectStack("prj-us-mp-10x-facility")!;
  assert.deepEqual(tenX.governments, ["us"]);
  assert.ok(tenX.rows.some((c) => c.id === "fin-us-dod-mp-2025-bank-financing"), "the lapsed letter stays listed in the stack");
  // Hemerdon: NWF and the UK Government provide capital; the EU recognizes it as a Strategic Project.
  assert.deepEqual(byProject.get("prj-gb-hemerdon")?.kinds, ["several_public_bodies", "capital_and_designation"]);
  assert.deepEqual(byProject.get("prj-gb-hemerdon")?.governments, ["uk"]);
  assert.deepEqual(byProject.get("prj-gb-hemerdon")?.designatingGovernments, ["eu"]);
  assert.ok(!byProject.has("prj-na-lofdal"), "one provider is not co-investment");
  // Canada's EDC and the German government (not a tracked actor) behind one facility.
  assert.ok(byProject.get("prj-ca-vianode-st-thomas")?.kinds.includes("cross_government"));
  assert.deepEqual(byProject.get("prj-ca-vianode-st-thomas")?.governments, ["canada"], "only tracked governments are named as governments");
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

/**
 * The documented folding rule, written out apart from `actorPortfolio`: a part is counted inside its package when
 * the package is the same provider's, is in the same layer, and is in the same group (standing, or ended), and is
 * counted on its own otherwise. Returns [rows that have not ended, rows that have ended].
 */
function expectedPortfolioRows(actor: string, all: readonly FinancialCommitment[]): [number, number] {
  const mine = all.filter((c) => c.providerJurisdiction === actor);
  const byId = new Map(mine.map((c) => [c.id, c]));
  const count = (group: FinancialCommitment[]) =>
    group.filter((c) => !c.relationships.some((r) => {
      const p = byId.get(r.commitmentId);
      return r.relationship === "part_of" && p && isEnded(p) === isEnded(c) && layerOf(p) === layerOf(c);
    })).length;
  return [count(mine.filter((c) => !isEnded(c))), count(mine.filter(isEnded))];
}

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
  // Designations never enter a money figure: the EU's capital portfolio counts its financial rows only,
  // less the parts the folding rule folds into a package (see the oracle below).
  const euCapital = actorPortfolio("eu");
  assert.deepEqual([euCapital.counts.rows, euCapital.counts.ended], expectedPortfolioRows("eu", getAllFinancialCommitments()));
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

// --- Ended rows and unexercised options in the derived views ---------------------------------

const usd = (value: string) => ({ value, currency: "USD", qualifier: "exact" as const, amountAsStated: value, currencyBasis: "stated" as const });
const history = (...statuses: FinancialCommitment["financialStatusHistory"][number]["status"][]) =>
  statuses.map((status, i) => ({ status, date: `2025-0${i + 1}-01`, sourceId: "s" }));
const partOf = (of: string) => [{ commitmentId: of, relationship: "part_of" as const, sourceId: "s" }];
const ids = (list: readonly { id: string }[]) => list.map((c) => c.id);

test("co-investment and a project's backers leave out ended rows and unexercised options, and list them apart", () => {
  const project = "prj-au-alcoa-sojitz-gallium";
  const us = fin("us", { projectId: project, financialStatusHistory: history("contracted") });
  const auLive = fin("au", { providerJurisdiction: "australia", projectId: project });
  const auEnded = fin("au-ended", { providerJurisdiction: "australia", projectId: project, financialStatusHistory: history("announced", "withdrawn") });
  const auOption = fin("au-option", { providerJurisdiction: "australia", projectId: project, valueRole: "funding_option", financialStatusHistory: history("contracted") });
  const bank = fin("bank", { providerJurisdiction: null, capitalSource: "private", valueRole: "private_financing", projectId: project });
  const bankLapsed = fin("bank-lapsed", { providerJurisdiction: null, capitalSource: "private", valueRole: "private_financing", projectId: project, financialStatusHistory: history("decided", "lapsed") });
  const find = (all: FinancialCommitment[]) => coInvestments(all).find((c) => c.project.id === project);

  // Two governments, one of which has withdrawn: one government stands behind the project.
  assert.equal(find([us, auEnded]), undefined);
  assert.deepEqual(projectStack(project, [us, auEnded])!.governments, ["us"]);
  // An option beside one government's capital is not a second provider.
  assert.equal(find([us, auOption]), undefined);
  assert.deepEqual(projectStack(project, [us, auOption])!.governments, ["us"]);
  // The same rows once live are co-investment.
  assert.deepEqual(find([us, auLive])!.kinds, ["cross_government"]);
  // A lapsed private letter is not private co-investment.
  assert.equal(find([us, bankLapsed]), undefined);
  assert.deepEqual(find([us, bank])!.kinds, ["public_and_private"]);

  // With everything present, the kinds rest on what stands and the rest is listed under its own field.
  const co = find([us, bank, auEnded, auOption, bankLapsed])!;
  assert.deepEqual(co.kinds, ["public_and_private"]);
  assert.deepEqual(co.governments, ["us"]);
  assert.deepEqual(co.rowIds, ["us", "bank"]);
  assert.deepEqual(co.optionIds, ["au-option"]);
  assert.deepEqual(co.endedIds, ["au-ended", "bank-lapsed"]);
  // Every row of the stack is still there, with its status.
  assert.deepEqual(ids(projectStack(project, [us, bank, auEnded, auOption, bankLapsed])!.rows), ["us", "bank", "au-ended", "au-option", "bank-lapsed"]);

  // A designation beside capital that has ended, or beside an option, is not capital and designation.
  const hemerdon = "prj-gb-hemerdon";
  const uk = (over: Partial<FinancialCommitment>) => fin("uk", { providerJurisdiction: "uk", projectId: hemerdon, ...over });
  const capitalAndDesignation = (row: FinancialCommitment) => coInvestments([row]).find((c) => c.project.id === hemerdon)?.kinds.includes("capital_and_designation") ?? false;
  assert.equal(capitalAndDesignation(uk({})), true);
  assert.equal(capitalAndDesignation(uk({ financialStatusHistory: history("announced", "withdrawn") })), false);
  assert.equal(capitalAndDesignation(uk({ valueRole: "funding_option" })), false);
  assert.equal(designationPortfolio("eu", [uk({})]).counts.projectsWithCapital >= 1, true);
  const withoutBacking = designationPortfolio("eu", [uk({ valueRole: "funding_option" }), uk({ financialStatusHistory: history("announced", "lapsed") })]);
  assert.equal(withoutBacking.counts.projectsWithCapital, designationPortfolio("eu", []).counts.projectsWithCapital);
});

test("a portfolio counts what has not ended once, keeps ended rows and options apart, and never reads a missing status as not yet binding", () => {
  const at = (cc: string) => [{ countryCode: cc, subnational: null, asStated: cc }];
  const common = { locations: at("US"), stages: ["processing" as const], materialIds: ["test-material"] };
  const pkg = fin("pkg", { ...common, amount: usd("100"), financialStatusHistory: history("contracted") });
  const pkgPart = fin("pkg-part", { ...common, amount: usd("60"), relationships: partOf("pkg"), financialStatusHistory: history("contracted") });
  const endedPkg = fin("ended-pkg", { ...common, amount: usd("300"), financialStatusHistory: history("announced", "withdrawn") });
  const standing = fin("standing", { ...common, amount: usd("120"), relationships: partOf("ended-pkg") });
  const unknown = fin("unknown", { ...common, amount: usd("7"), financialStatusHistory: history("not_stated") });
  const option = fin("option", { ...common, valueRole: "funding_option", amount: usd("350"), financialStatusHistory: history("contracted") });
  const dead = fin("dead", { ...common, amount: usd("9"), financialStatusHistory: history("decided", "lapsed") });
  const all = [pkg, pkgPart, endedPkg, standing, unknown, option, dead];
  const p = actorPortfolio("us", all);

  // A part folds into a package that stands; a part of an ended package is a row of its own.
  assert.equal(p.counts.rows, 4, "pkg (with its part), standing, unknown, and the option's layer");
  assert.equal(p.counts.ended, 2, "the ended package and the lapsed row");
  assert.deepEqual([p.counts.rows, p.counts.ended], expectedPortfolioRows("us", all));
  assert.deepEqual(
    [p.counts.committedBinding, p.counts.committedNotYetBinding, p.counts.committedStatusNotStated, p.counts.committedEnded],
    [1, 1, 1, 2],
  );
  assert.equal(p.counts.byLayer.funding_option, 1);
  assert.equal(p.counts.byLayer.public_commitment, 3);
  // An option is counted in its own layer only, never as the instrument, stage or material it would fund.
  assert.deepEqual(p.counts.byInstrument, { grant: 3 });
  assert.equal(p.counts.byStage.processing, 3);
  assert.equal(p.counts.byMaterial["test-material"], 3);
  assert.equal(p.counts.byGeography.domestic, 3);
  // Money: the standing part and the package are summed; the rest is listed as ended or apart.
  assert.deepEqual(p.publicTotals.endedIds.sort(), ["dead", "ended-pkg"]);
  assert.deepEqual(p.publicTotals.statusNotStatedIds, ["unknown"]);
  const cur = p.publicTotals.currencies[0];
  assert.deepEqual([cur.countedIds.sort(), cur.nestedIds], [["pkg", "standing"], ["pkg-part"]]);
  assert.deepEqual((cur.status === "summed" ? cur.instruments[0].binding : null), { exact: "100" });
  assert.deepEqual((cur.status === "summed" ? cur.instruments[0].notYetBinding : null), { exact: "120" });

  // Flows: ended rows and options are no flow, and a standing part of an ended package is one.
  const flows = capitalFlows(all).filter((f) => f.actor === "us");
  assert.deepEqual(flows.map((f) => f.destination), ["US"]);
  assert.deepEqual(flows[0].rowIds.sort(), ["pkg", "standing", "unknown"]);

  // Response map: capital, options and ended rows sit in their own fields of one cell.
  const cell = stageResponseMap(site.lastUpdated, all, []).get("test-material")!.get("processing")!;
  assert.deepEqual(cell.capitalIds.sort(), ["pkg", "standing", "unknown"]);
  assert.deepEqual(cell.optionIds, ["option"]);
  assert.deepEqual(cell.endedIds.sort(), ["dead", "ended-pkg"]);
  assert.deepEqual([cell.capitalActors, cell.optionActors], [["us"], ["us"]]);
  assert.ok(![...cell.capitalIds].includes("option"));
  assert.ok(all.filter(isEnded).every((c) => !cell.capitalIds.includes(c.id)));
});

test("every actor's portfolio rows follow the folding rule, with an ended package and its standing part", () => {
  const all = getAllFinancialCommitments();
  for (const actor of actorsWithCapital(all)) {
    const c = actorPortfolio(actor, all).counts;
    assert.deepEqual([c.rows, c.ended], expectedPortfolioRows(actor, all), actor);
  }
  const at = { locations: [{ countryCode: "US", subnational: null, asStated: "US" }], stages: ["processing" as const], materialIds: ["m"] };
  const ended = fin("ended-pkg", { ...at, financialStatusHistory: history("announced", "withdrawn") });
  const standing = fin("standing", { ...at, relationships: partOf("ended-pkg") });
  const endedPart = fin("ended-part", { ...at, relationships: partOf("ended-pkg"), financialStatusHistory: history("announced", "lapsed") });
  const live = fin("live-pkg", at);
  const livePart = fin("live-part", { ...at, relationships: partOf("live-pkg") });
  const endedPartOfLive = fin("ended-part-of-live", { ...at, relationships: partOf("live-pkg"), financialStatusHistory: history("announced", "withdrawn") });
  const rows = [ended, standing, endedPart, live, livePart, endedPartOfLive];
  const c = actorPortfolio("us", rows).counts;
  // Standing: the part of the ended package is a row of its own, and the live package folds its live part.
  assert.equal(c.rows, 2, "standing part of an ended package, and the live package with its part");
  // Ended: the package folds its ended part; an ended part of a live package is ended money and is counted so.
  assert.equal(c.ended, 2, "the ended package with its ended part, and the ended part of the live package");
  assert.deepEqual([c.rows, c.ended], expectedPortfolioRows("us", rows));
});

test("a portfolio counts stage and material per cell: a part beyond its package is counted there, a covered one is not counted twice", () => {
  const at = (materialIds: string[], stages: FinancialCommitment["stages"], over: Partial<FinancialCommitment> = {}) => ({ materialIds, stages, ...over });
  const gone = history("announced", "withdrawn");
  const rows = [
    // A standing package, a part inside it, and a part that reaches past it.
    fin("pkg", at(["ma", "mb"], ["mining", "processing"])),
    fin("covered", at(["ma"], ["mining"], { relationships: partOf("pkg") })),
    fin("beyond", at(["ma", "mc"], ["mining", "refining"], { relationships: partOf("pkg") })),
    // An ended package does not cover its standing part, and an ended part is not counted here at all.
    fin("ended-pkg", at(["md"], ["separation"], { financialStatusHistory: gone })),
    fin("ended-pkg-standing", at(["md"], ["separation"], { relationships: partOf("ended-pkg") })),
    fin("ended-pkg-ended", at(["md"], ["separation"], { relationships: partOf("ended-pkg"), financialStatusHistory: gone })),
    // A package of another layer (an envelope) covers nothing for a commitment under it.
    fin("env", at(["me"], ["stockpiling"], { valueRole: "program_envelope" })),
    fin("env-part", at(["me"], ["stockpiling"], { relationships: partOf("env") })),
    // An option is left out of stage and material, and does not cover a commitment that is part of it.
    fin("opt", at(["mf"], ["component_manufacturing"], { valueRole: "funding_option" })),
    fin("opt-part", at(["mf"], ["component_manufacturing"], { relationships: partOf("opt") })),
  ];
  const c = actorPortfolio("us", rows).counts;
  const stages = Object.fromEntries(Object.entries(c.byStage).filter(([, n]) => n));
  const materials = Object.fromEntries(Object.entries(c.byMaterial));
  assert.deepEqual(stages, { mining: 1, processing: 1, refining: 1, separation: 1, stockpiling: 2, component_manufacturing: 1 });
  assert.deepEqual(materials, { ma: 1, mb: 1, mc: 1, md: 1, me: 2, mf: 1 });
  // Rows are unchanged by the per-cell rule: a part still folds into its package there.
  assert.deepEqual([c.rows, c.ended], [6, 1]);
  assert.deepEqual([c.rows, c.ended], expectedPortfolioRows("us", rows));
});

test("in the corpus, Australia's stockpiling allocation is counted at stockpiling, and no covered part is counted twice", () => {
  const part = getFinancialCommitmentById("fin-au-cmsr-2026-stockpiling-allocation")!;
  const pkg = getFinancialCommitmentById("fin-au-cmsr-2026-reserve")!;
  assert.deepEqual(part.relationships.map((r) => [r.relationship, r.commitmentId]), [["part_of", pkg.id]]);
  assert.ok(part.stages.includes("stockpiling") && !pkg.stages.includes("stockpiling"), "the package does not cover the part's stage");
  const all = getAllFinancialCommitments();
  const au = actorPortfolio("australia", all).counts;
  assert.ok(au.byStage.stockpiling >= 1, "the part is counted at the stage its package does not cover");
  assert.deepEqual([au.rows, au.ended], expectedPortfolioRows("australia", all), "and `rows` still folds the part into its package");
  // Take the allocation away: exactly one stockpiling record goes, and nothing else moves.
  const without = actorPortfolio("australia", all.filter((c) => c.id !== part.id)).counts;
  assert.equal(au.byStage.stockpiling - without.byStage.stockpiling, 1);
  assert.deepEqual({ ...au.byStage, stockpiling: 0 }, { ...without.byStage, stockpiling: 0 });
  assert.deepEqual(au.byMaterial, without.byMaterial, "the allocation lists no material of its own, so the reserve's materials are not counted twice");
  assert.equal(au.rows, without.rows, "the part still folds into the reserve for the row count");
  // A part that its package genuinely covers is not counted at all: every stage and material of the USAR round-top
  // part is listed by its package, so dropping the part changes no count.
  const covered = getFinancialCommitmentById("fin-us-chips-usar-2026-round-top-direct-funding")!;
  const owner = getFinancialCommitmentById("fin-us-chips-usar-2026-direct-funding")!;
  assert.ok(covered.stages.every((x) => owner.stages.includes(x)) && covered.materialIds.every((m) => owner.materialIds.includes(m)));
  const us = actorPortfolio("us", all).counts;
  const usWithout = actorPortfolio("us", all.filter((c) => c.id !== covered.id)).counts;
  assert.deepEqual([us.byStage, us.byMaterial, us.rows], [usWithout.byStage, usWithout.byMaterial, usWithout.rows]);

  // Every actor's stage and material counts equal the rule, written out apart from `actorPortfolio`.
  for (const actor of actorsWithCapital(all)) {
    const mine = all.filter((x) => x.providerJurisdiction === actor && !isEnded(x) && x.valueRole !== "funding_option");
    const byId = new Map(mine.map((x) => [x.id, x]));
    const covered = (x: FinancialCommitment, has: (p: FinancialCommitment) => boolean) =>
      x.relationships.some((r) => {
        const p = byId.get(r.commitmentId);
        return r.relationship === "part_of" && !!p && layerOf(p) === layerOf(x) && has(p);
      });
    const expectStage: Record<string, number> = {};
    const expectMaterial: Record<string, number> = {};
    for (const x of mine) {
      for (const st of new Set(x.stages)) if (!covered(x, (p) => p.stages.includes(st))) expectStage[st] = (expectStage[st] ?? 0) + 1;
      for (const m of new Set(x.materialIds)) if (!covered(x, (p) => p.materialIds.includes(m))) expectMaterial[m] = (expectMaterial[m] ?? 0) + 1;
    }
    const c = actorPortfolio(actor, all).counts;
    assert.deepEqual(Object.fromEntries(Object.entries(c.byStage).filter(([, n]) => n)), expectStage, `${actor} by stage`);
    assert.deepEqual(c.byMaterial, expectMaterial, `${actor} by material`);
  }
  // The API summary carries the same counts.
  const summary = buildCapitalIntelligenceSummary().portfolios.find((p) => p.actor === "australia")!;
  assert.deepEqual(summary.counts.byStage, au.byStage);
});

test("the response map folds a part only into a package in the same field of the same cell", () => {
  const at = (materialIds: string[], stages: FinancialCommitment["stages"], over: Partial<FinancialCommitment> = {}) => ({ materialIds, stages, ...over });
  const gone = history("announced", "withdrawn");
  const rows = [
    // A package over two materials and two stages, with parts at, inside and beyond it.
    fin("pkg", at(["ma", "mb"], ["mining", "processing"])),
    fin("p-inside", at(["ma"], ["mining"], { relationships: partOf("pkg") })),
    fin("p-other-material", at(["ma", "mc"], ["mining"], { relationships: partOf("pkg") })),
    fin("p-other-stage", at(["ma"], ["mining", "refining"], { relationships: partOf("pkg") })),
    fin("p-ended", at(["ma"], ["mining"], { relationships: partOf("pkg"), financialStatusHistory: gone })),
    // An unexercised option does not hide a commitment that is part of it.
    fin("opt", at(["md"], ["mining"], { valueRole: "funding_option" })),
    fin("opt-part", at(["md"], ["mining"], { relationships: partOf("opt") })),
    // An ended package does not hide a standing part; its own ended part folds into it.
    fin("ended-pkg", at(["me"], ["mining"], { financialStatusHistory: gone })),
    fin("ended-pkg-standing", at(["me"], ["mining"], { relationships: partOf("ended-pkg") })),
    fin("ended-pkg-ended", at(["me"], ["mining"], { relationships: partOf("ended-pkg"), financialStatusHistory: gone })),
    // Another provider's package does not hide it.
    fin("eu-pkg", at(["mf"], ["mining"], { providerJurisdiction: "eu" })),
    fin("us-part-of-eu", at(["mf"], ["mining"], { relationships: partOf("eu-pkg") })),
  ];
  const map = stageResponseMap(site.lastUpdated, rows, []);
  const cell = (m: string, s: FinancialCommitment["stages"][number]) => map.get(m)?.get(s);
  const capital = (m: string, s: FinancialCommitment["stages"][number]) => (cell(m, s)?.capitalIds ?? []).slice().sort();

  assert.deepEqual(capital("ma", "mining"), ["pkg"], "package and part cover the same cell: one row");
  assert.deepEqual(cell("ma", "mining")!.endedIds, ["p-ended"], "an ended part of a standing package is listed as ended, not hidden");
  assert.deepEqual(capital("ma", "processing"), ["pkg"]);
  assert.deepEqual(capital("mb", "mining"), ["pkg"]);
  assert.deepEqual(capital("mc", "mining"), ["p-other-material"], "the package does not cover this material");
  assert.deepEqual(capital("ma", "refining"), ["p-other-stage"], "the package does not cover this stage");
  assert.deepEqual([capital("md", "mining"), cell("md", "mining")!.optionIds], [["opt-part"], ["opt"]]);
  assert.deepEqual([capital("me", "mining"), cell("me", "mining")!.endedIds], [["ended-pkg-standing"], ["ended-pkg"]]);
  assert.deepEqual(capital("mf", "mining"), ["eu-pkg", "us-part-of-eu"]);
  assert.deepEqual(cell("mf", "mining")!.capitalActors, ["eu", "us"]);
  // No row sits twice in one cell, and a part of a package that covers the cell never sits beside it.
  for (const row of map.values())
    for (const x of row.values()) for (const list of [x.capitalIds, x.optionIds, x.endedIds]) assert.equal(new Set(list).size, list.length);

  // The corpus map and the API summary carry the same cells, field for field.
  const summary = buildCapitalIntelligenceSummary().stageResponseMap;
  const real = stageResponseMap(site.lastUpdated);
  for (const { materialId, stages } of summary)
    for (const s of stages) {
      const x = real.get(materialId)!.get(s.stage as FinancialCommitment["stages"][number])!;
      assert.deepEqual([s.capitalIds, s.fundingOptionIds, s.endedRowIds], [x.capitalIds, x.optionIds, x.endedIds]);
    }
  assert.equal(summary.reduce((n, m) => n + m.stages.length, 0), [...real.values()].reduce((n, m) => n + m.size, 0));
});

test("in the corpus, the unexercised option is listed as an option and the lapsed letter backs nothing", () => {
  const OPTION = "fin-us-dod-mp-2025-additional-preferred-option";
  const map = stageResponseMap(site.lastUpdated);
  const seenAs = { capital: 0, option: 0 };
  // The corpus option codes no stage, so the map (which is by stage) never places it; a staged option is
  // placed as an option by the fixture test above.
  for (const row of map.values())
    for (const cell of row.values()) {
      if (cell.capitalIds.includes(OPTION)) seenAs.capital++;
      if (cell.optionIds.includes(OPTION)) seenAs.option++;
      for (const id of cell.capitalIds) assert.ok(!isEnded(getFinancialCommitmentById(id)!), `${id} has ended and is shown as capital`);
      for (const id of cell.endedIds) assert.ok(isEnded(getFinancialCommitmentById(id)!), `${id} is listed as ended but has not ended`);
    }
  assert.equal(seenAs.capital, 0, "an option is never a commitment in the response map");
  assert.equal(seenAs.option, 0, "the option has no stage to be placed at");
  // The US portfolio counts the option in its own layer and leaves it out of every other count.
  const us = actorPortfolio("us");
  assert.ok(us.counts.byLayer.funding_option >= 1);
  // The summary API says the same in named fields.
  const summary = buildCapitalIntelligenceSummary();
  const cells = summary.stageResponseMap.flatMap((m) => m.stages);
  assert.ok(cells.every((c) => Array.isArray(c.fundingOptionIds) && Array.isArray(c.endedRowIds)));
  assert.ok(cells.every((c) => !c.capitalIds.includes(OPTION)));
  assert.ok(summary.coInvestment.every((c) => Array.isArray(c.fundingOptionIds) && Array.isArray(c.endedRowIds)));
  assert.ok(summary.portfolios.every((x) => typeof x.counts.committedStatusNotStated === "number" && typeof x.counts.ended === "number"));
  assert.ok(summary.countingRules.some((r) => r.includes("funding option is listed as an option")));
  assert.ok(summary.countingRules.some((r) => r.includes("not_stated")));
});

test("a commitment under an envelope is still a commitment: no view folds a part into a package it does not count", () => {
  const at = [{ countryCode: "AU", subnational: null, asStated: "AU" }];
  const envelope = fin("envelope", {
    providerJurisdiction: "australia",
    valueRole: "program_envelope",
    amount: usd("5000"),
    stages: ["processing"],
    materialIds: ["test-material"],
    financialStatusHistory: history("announced"),
  });
  const equity = fin("equity", {
    providerJurisdiction: "australia",
    instrument: "equity",
    amount: usd("50"),
    relationships: partOf("envelope"),
    locations: at,
    stages: ["processing"],
    materialIds: ["test-material"],
    financialStatusHistory: history("contracted"),
  });
  const all = [envelope, equity];

  // The envelope is a ceiling, not a flow and not capital aimed at a stage, so it hides nothing.
  assert.deepEqual(capitalFlows(all).map((f) => [f.actor, f.destination, f.rowIds]), [["australia", "AU", ["equity"]]]);
  const cell = stageResponseMap(site.lastUpdated, all, []).get("test-material")!.get("processing")!;
  assert.deepEqual([cell.capitalIds, cell.optionIds, cell.endedIds], [["equity"], [], []]);
  // The portfolio counts the commitment in its own layer beside the envelope, matching its summed money.
  const p = actorPortfolio("australia", all);
  assert.equal(p.counts.byLayer.public_commitment, 1);
  assert.equal(p.counts.byLayer.envelope, 1);
  assert.equal(p.counts.committedBinding, 1);
  assert.deepEqual(p.publicTotals.currencies[0].countedIds, ["equity"]);
  // A part of another actor's package, or of a package that is not capital at all, is not hidden either.
  const foreign = fin("foreign", { providerJurisdiction: "us", relationships: partOf("equity"), amount: usd("5"), locations: at });
  assert.deepEqual(capitalFlows([envelope, equity, foreign]).map((f) => f.actor).sort(), ["australia", "us"]);
  const privatePkg = fin("private-pkg", { providerJurisdiction: null, capitalSource: "private", valueRole: "private_financing" });
  const underPrivate = fin("under-private", { relationships: partOf("private-pkg"), locations: [{ countryCode: "US", subnational: null, asStated: "US" }] });
  assert.deepEqual(capitalFlows([privatePkg, underPrivate]).map((f) => f.rowIds), [["under-private"]]);
  // The corpus's two Australian equity stakes under the US-Australia financing envelope are in the flows again.
  const flows = capitalFlows();
  for (const id of ["fin-au-alcoa-sojitz-gallium-2025-equity", "fin-au-arafura-nolans-2025-equity"]) assert.ok(flows.some((f) => f.rowIds.includes(id)), `${id} is missing from the flows`);
});
