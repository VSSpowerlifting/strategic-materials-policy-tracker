/**
 * Strategic Concern -> Industrial Response: read-only derivation over the seed data.
 *
 *   node --import tsx scripts/analyze-concern-response.ts --as-of 2026-10-03 > tables.md
 *
 * Prints deterministic Markdown tables to stdout. It reads no clock and writes no file. Everything is a record
 * count; no money is totalled and no currencies are combined. Placement, folding and control status reuse
 * `stageResponseMap`, `stageLatticeGaps`, `isFoldedPart`, `legalStanding` and the lifecycle queue, so the
 * numbers follow the corpus's own counting rules. The "ladder" columns are presentation only: financial
 * standing and physical status are separate axes and are never combined into a score.
 */
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getAllFramingClaims,
  getAllMaterials,
  getAllProjectDesignations,
  getAllProjects,
  getSourceById,
} from "../lib/data";
import {
  byIdOf,
  controlIssuer,
  controlStatusOn,
  currentControlEntry,
  currentFinancialStatus,
  daysBetween,
  isEnded,
  isFoldedPart,
  legalStanding,
} from "../lib/capital-control";
import { stageLatticeGaps, stageResponseMap } from "../lib/capital-intelligence";
import { deriveLifecycleRefreshQueue } from "../lib/lifecycle-refresh";
import type { LifecycleRefreshRow } from "../lib/lifecycle-refresh";
import { site } from "../lib/site";
import { SUPPLY_CHAIN_STAGES } from "../lib/types";
import type { FinancialCommitment } from "../lib/types";

function readAsOf(argv: readonly string[]): string {
  const inline = argv.find((arg) => arg.startsWith("--as-of="));
  const value = inline ? inline.slice("--as-of=".length) : argv[argv.indexOf("--as-of") + 1];
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("analyze-concern-response requires an explicit --as-of YYYY-MM-DD");
  return value;
}

const asOf = readAsOf(process.argv.slice(2));
const all = getAllFinancialCommitments();
const byId = byIdOf(all);
const projects = new Map(getAllProjects().map((p) => [p.id, p]));
const controls = getAllControlMeasures();
const events = getAllEvents();
const eventById = new Map(events.map((e) => [e.id, e]));
const framing = getAllFramingClaims();
const materials = getAllMaterials();
const queue = deriveLifecycleRefreshQueue(all, getAllProjects(), asOf);
const queueRow = new Map(queue.rows.map((r) => [r.commitmentId, r]));
const bundleOf = new Map(queue.bundles.flatMap((b) => b.commitmentIds.map((id) => [id, b] as const)));

const out: string[] = [];
const line = (s = "") => out.push(s);
const table = (headers: string[], rows: (string | number)[][]) => {
  line(`| ${headers.join(" | ")} |`);
  line(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const r of rows) line(`| ${r.join(" | ")} |`);
  line();
};
const sortIds = (ids: Iterable<string>) => [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const tally = <T extends string>(items: readonly T[]) => {
  const m = new Map<T, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  return m;
};

// --- Row helpers ---------------------------------------------------------------------------
const finStatus = currentFinancialStatus;
const implEntry = (c: FinancialCommitment) => c.implementationStatusHistory[c.implementationStatusHistory.length - 1] ?? null;
/** The row's current physical status; with no history, "not applicable" when the queue rule says no physical lifecycle applies, else "none recorded". */
const implStatus = (c: FinancialCommitment): string => implEntry(c)?.status ?? (queueRow.get(c.id)?.implementation.applicable === false ? "not applicable" : "none recorded");
const BUILT = ["construction", "commissioning", "operational", "completed"];
/**
 * Projects whose "construction or later" status is the completion of a funded activity, not a statement about the facility
 * (read from the status entry's own note and source). Reported in the headline count and again without them.
 */
const FUNDED_ACTIVITY_STATUS = new Set(["prj-ca-cyclic-kingston-demonstration-plant"]);
/** Framing counted as official government framing only when its source is an official document (not news or state media). */
const officialFraming = (f: { sourceId: string }) => getSourceById(f.sourceId)?.sourceType === "official";
const BINDING = ["contracted", "partially_disbursed", "disbursed"];
const FUNDED = ["partially_disbursed", "disbursed"];
/** A government commitment: role "commitment", a tracked providing government, not ended. */
const isGC = (c: FinancialCommitment) => c.valueRole === "commitment" && !!c.providerJurisdiction && !isEnded(c);
/** Counted once: a part of a package that is itself a government commitment is folded into it. */
const gcFolded = (rows: readonly FinancialCommitment[], pkgTest: (p: FinancialCommitment) => boolean = isGC) =>
  rows.filter((c) => isGC(c) && !isFoldedPart(c, byId, pkgTest));
const amountText = (c: FinancialCommitment) => (c.amount ? `${c.amount.amountAsStated} [${c.amount.qualifier} ${c.amount.currency}]` : "no amount stated");
const histText = (h: readonly { status: string; date: string | null }[]) => (h.length ? h.map((e) => `${e.status}@${e.date ?? "undated"}`).join(" > ") : "none recorded");
const srcDate = (id: string) => {
  const s = getSourceById(id);
  return s ? (s.datePublished ? { date: s.datePublished, kind: "published" } : { date: s.dateAccessed, kind: "accessed" }) : null;
};

// --- 1. Scope and denominators -------------------------------------------------------------
line(`# Strategic Concern -> Industrial Response: generated tables`);
line();
line(`As-of date: **${asOf}** (explicit argument). Dataset record-as-of (\`site.lastUpdated\`): **${site.lastUpdated}**. These are different dates.`);
line(`All figures are record counts over the checked-out seed data. No money is summed.`);
line();
line(`## 1. Denominators`);
line();
const commitEvents = new Set(all.map((c) => c.eventId));
const ctlEvents = new Set(controls.map((c) => c.eventId));
const framedEvents = new Set(framing.map((f) => f.eventId));
const officialFramedEvents = new Set(framing.filter(officialFraming).map((f) => f.eventId));
table(
  ["Record kind", "Count"],
  [
    ["Policy events", events.length],
    ["Events carrying >=1 financial commitment row", commitEvents.size],
    ["Events carrying >=1 control clause", ctlEvents.size],
    ["Events carrying both", [...commitEvents].filter((e) => ctlEvents.has(e)).length],
    ["Framing claims (quoted rationale)", framing.length],
    ["Events with >=1 framing claim", framedEvents.size],
    ["Commitment-bearing events with >=1 framing claim (any source)", [...commitEvents].filter((e) => framedEvents.has(e)).length],
    ["Commitment-bearing events with >=1 framing claim from an official source", [...commitEvents].filter((e) => officialFramedEvents.has(e)).length],
    ["Financial commitment rows", all.length],
    ["Control clauses", controls.length],
    ["Project designations", getAllProjectDesignations().length],
    ["Registry projects", projects.size],
    ["Registry projects linked by >=1 commitment row", new Set(all.map((c) => c.projectId).filter(Boolean)).size],
  ],
);
line(`Financial rows by value role (every row has exactly one):`);
line();
const roles = tally(all.map((c) => c.valueRole));
table(["Value role", "Rows"], [...roles.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([r, n]) => [r, n]));
line(`Financial rows by legal standing (rule in \`legalStanding\`; an unstated status is never read as not-yet-binding):`);
line();
const standing = tally(all.map((c) => legalStanding(c)));
table(["Legal standing", "Rows"], [...standing.entries()].sort().map(([s, n]) => [s, n]));
const gaps = stageLatticeGaps();
line(`Stage-lattice placement (from \`stageLatticeGaps\`; each kind's buckets are exclusive):`);
line();
table(
  ["Kind", "Total", "Placed on a material x stage cell", "Not placed (why)"],
  [
    [
      "Capital rows",
      gaps.capital.total,
      gaps.capital.placed,
      `no providing tracked government ${gaps.capital.noProvider}; government row missing stage or material ${gaps.capital.noStageOrMaterial}; other value roles ${gaps.capital.otherRoleTotal} (${Object.entries(gaps.capital.otherRoles).map(([k, v]) => `${k} ${v}`).join(", ")})`,
    ],
    [
      "Control clauses",
      gaps.controls.total,
      gaps.controls.placed,
      `no stage by rule ${gaps.controls.noStageByRule}; no stage, other ${gaps.controls.noStageOther}; stage but no tracked material ${gaps.controls.noMaterialOnly}`,
    ],
    ["Designations", gaps.designations.total, gaps.designations.placed, `unplaced ${gaps.designations.unplaced}`],
  ],
);

// --- 2. Lifecycle queue --------------------------------------------------------------------
line(`## 2. Lifecycle refresh queue regenerated at ${asOf}`);
line();
const rowPrio = tally(queue.rows.map((r) => r.priority));
table(
  ["Priority", "Bundles", "Rows (row's own priority)"],
  (["P0", "P1", "P2", "P3"] as const).map((p) => [p, queue.counts[p], rowPrio.get(p) ?? 0]),
);
const p1Bundles = queue.bundles.filter((b) => b.priority === "P1");
const p1BundleRows = p1Bundles.flatMap((b) => b.rows);
line(`P1 bundles: ${p1Bundles.length}; rows in them: ${p1BundleRows.length}; of those rows, individually P1: ${p1BundleRows.filter((r) => r.priority === "P1").length}; P1 only through bundle membership: ${p1BundleRows.filter((r) => r.priority !== "P1").length}.`);
line();
const isP1Row = (id: string) => queueRow.get(id)?.priority === "P1";
const inP1Bundle = (id: string) => bundleOf.get(id)?.priority === "P1";

// --- 3. Ladder tables ----------------------------------------------------------------------
line(`## 3. Government commitments: financial standing x physical status (independent axes)`);
line();
const gcAll = all.filter(isGC);
const gc = gcFolded(all);
const nonGcRoles = all.filter((c) => !isGC(c));
line(`Government commitment (GC) rows: role \`commitment\`, a providing tracked government, not ended. ${gcAll.length} rows; ${gc.length} after folding parts into packages that are themselves GC rows (package counted once).`);
line(`Not GC (${nonGcRoles.length}): ${[...tally(nonGcRoles.map((c) => (isEnded(c) ? `ended ${c.valueRole}` : c.valueRole === "commitment" ? "commitment with no tracked providing government" : c.valueRole))).entries()].sort().map(([k, v]) => `${k} ${v}`).join("; ")}.`);
line(`GC rows by capital source: ${[...tally(gcAll.map((c) => c.capitalSource)).entries()].sort().map(([k, v]) => `${k} ${v}`).join("; ")} (mixed_vehicle and not_stated are not public capital).`);
line();
const finOrder = ["announced", "authorized", "allocated", "decided", "not_stated", "contracted", "partially_disbursed", "disbursed"];
const implOrder = ["none recorded", "not applicable", "announced", "feasibility", "construction", "commissioning", "operational", "completed", "suspended", "cancelled", "not_stated", "not_applicable"];
const present = (rows: readonly FinancialCommitment[]) => implOrder.filter((s) => rows.some((c) => implStatus(c) === s));
const gcPhys = present(gcAll);
line(`Unfolded GC rows (${gcAll.length}), current financial status (rows) x current physical status of the row's own implementation history:`);
line();
table(
  ["Financial status", ...gcPhys, "Total"],
  finOrder
    .filter((f) => gcAll.some((c) => finStatus(c) === f))
    .map((f) => {
      const rows = gcAll.filter((c) => finStatus(c) === f);
      return [f, ...gcPhys.map((s) => rows.filter((c) => implStatus(c) === s).length), rows.length];
    }),
);
line(`Folded view (${gc.length}):`);
line();
const gcFoldPhys = present(gc);
table(
  ["Financial status", ...gcFoldPhys, "Total"],
  finOrder
    .filter((f) => gc.some((c) => finStatus(c) === f))
    .map((f) => {
      const rows = gc.filter((c) => finStatus(c) === f);
      return [f, ...gcFoldPhys.map((s) => rows.filter((c) => implStatus(c) === s).length), rows.length];
    }),
);

line(`GC rows (folded, ${gc.length}) by instrument and legal standing. Price floors, offtakes, procurement rights and tax credits carry no funding amount; they are commitments of the government but are not money, and are never added to money instruments. Conditional or preliminary decisions (status \`decided\`) are not binding.`);
line();
const instruments = [...new Set(gc.map((c) => c.instrument))].sort();
table(
  ["Instrument", "Binding (contracted / part. disbursed / disbursed)", "Not yet binding (announced / authorized / allocated / decided)", "Status not stated", "Total"],
  instruments.map((i) => {
    const r = gc.filter((c) => c.instrument === i);
    return [i, r.filter((c) => BINDING.includes(finStatus(c))).length, r.filter((c) => legalStanding(c) === "not_yet_binding").length, r.filter((c) => legalStanding(c) === "status_not_stated").length, r.length];
  }),
);
line(`Rows named in the analysis and kept apart from GC: options (\`funding_option\`), indications, program envelopes, appropriations, lending authority, private financing, recipient own funds (a cash balance a company commits to spend), total project cost and expected co-investment. Their count by role is in section 1.`);
line();
line(`### 3b. Project-level view (deduplicated by registry project)`);
line();
const byProject = new Map<string, FinancialCommitment[]>();
for (const c of all) if (c.projectId) byProject.set(c.projectId, [...(byProject.get(c.projectId) ?? []), c]);
type ProjectView = {
  id: string;
  name: string;
  rows: FinancialCommitment[];
  gcRows: FinancialCommitment[];
  binding: boolean;
  funded: boolean;
  physical: string[];
  built: boolean;
  /** built, and not only because a funded activity is recorded as completed */
  builtStrict: boolean;
};
const projectViews: ProjectView[] = sortIds(byProject.keys()).map((id) => {
  const rows = byProject.get(id)!;
  const gcRows = rows.filter(isGC);
  const physical = [...new Set(rows.map((c) => implStatus(c)).filter((s) => s !== "none recorded" && s !== "not applicable"))];
  return {
    id,
    name: projects.get(id)?.name ?? id,
    rows,
    gcRows,
    binding: gcRows.some((c) => BINDING.includes(finStatus(c))),
    funded: gcRows.some((c) => FUNDED.includes(finStatus(c))),
    physical,
    built: physical.some((s) => BUILT.includes(s)),
    builtStrict: physical.some((s) => BUILT.includes(s)) && !FUNDED_ACTIVITY_STATUS.has(id),
  };
});
const withGc = projectViews.filter((p) => p.gcRows.length > 0);
table(
  ["Measure", "Projects", "Denominator"],
  [
    ["Registry projects with >=1 commitment row of any role", projectViews.length, `${projects.size} registry projects`],
    ["...with >=1 GC row", withGc.length, `${projectViews.length}`],
    ["...with >=1 binding GC row (contracted, partially disbursed or disbursed)", withGc.filter((p) => p.binding).length, `${withGc.length}`],
    ["...with >=1 funded GC row (partially disbursed or disbursed)", withGc.filter((p) => p.funded).length, `${withGc.length}`],
    ["...with a recorded physical status on any linked row", withGc.filter((p) => p.physical.length).length, `${withGc.length}`],
    ["...with a recorded physical status of construction or later on any linked row", withGc.filter((p) => p.built).length, `${withGc.length}`],
    ["...binding GC row AND construction-or-later recorded", withGc.filter((p) => p.binding && p.built).length, `${withGc.length}`],
    ["...construction-or-later recorded but NO binding GC row", withGc.filter((p) => !p.binding && p.built).length, `${withGc.length}`],
    ["...strict: construction-or-later recorded, excluding a funded-activity completion (see overlap table)", withGc.filter((p) => p.builtStrict).length, `${withGc.length}`],
    ["...strict: binding GC row AND construction-or-later", withGc.filter((p) => p.binding && p.builtStrict).length, `${withGc.length}`],
    ["...binding GC row but NO physical status recorded", withGc.filter((p) => p.binding && p.physical.length === 0).length, `${withGc.length}`],
    ["...physical statuses that disagree across linked rows", withGc.filter((p) => p.physical.length > 1).length, `${withGc.length}`],
  ],
);
line(`Overlap of the binding and construction-or-later sets (29 projects with a GC row; the two sets are **not nested**). Funded-activity completions: ${[...FUNDED_ACTIVITY_STATUS].join(", ")} (status is the completion of a funded "Extended Operations" project per its own note, so it is counted in the headline but excluded from the strict column).`);
line();
const cell = (pred: (p: ProjectView) => boolean) => {
  const ps = withGc.filter(pred);
  return [ps.length, ps.map((p) => p.id.replace(/^prj-/, "")).join(", ") || "-"];
};
table(
  ["Cell", "Projects", "Which"],
  [
    ["Binding GC row AND construction-or-later (as recorded)", ...cell((p) => p.binding && p.built)],
    ["Binding GC row, construction-or-later NOT recorded: some physical status below construction", ...cell((p) => p.binding && !p.built && p.physical.length > 0)],
    ["Binding GC row, NO physical status recorded", ...cell((p) => p.binding && p.physical.length === 0)],
    ["NO binding GC row, construction-or-later recorded", ...cell((p) => !p.binding && p.built)],
    ["NO binding GC row, some physical status below construction", ...cell((p) => !p.binding && !p.built && p.physical.length > 0)],
    ["NO binding GC row, NO physical status recorded", ...cell((p) => !p.binding && p.physical.length === 0)],
    ["Total", withGc.length, "-"],
  ],
);
line(`Project register (every registry project with a commitment row; physical status is a fact about the project's linked rows as recorded, not completion of any one instrument's deliverables):`);
line();
table(
  ["Project", "Name", "Rows (id: role, financial status)", "Recorded physical status (row: history)"],
  projectViews.map((p) => [
    p.id,
    p.name,
    p.rows.map((c) => `${c.id.replace(/^fin-/, "")}: ${c.valueRole}${isGC(c) ? "" : " (not GC)"}, ${finStatus(c)}`).join("; "),
    p.rows.map((c) => `${c.id.replace(/^fin-/, "")}: ${c.implementationStatusHistory.length ? histText(c.implementationStatusHistory) : implStatus(c)}`).join("; "),
  ]),
);
const unnamed = gc.filter((c) => !c.projectId);
line(`GC rows (folded) with no registry project: ${unnamed.length} of ${gc.length}. By recipient: ${unnamed.map((c) => `${c.id.replace(/^fin-/, "")} (${c.recipient ?? "recipient not stated"})`).join("; ")}.`);
line();

// --- 4. Material by material ---------------------------------------------------------------
line(`## 4. Material-by-material comparison`);
line();
line(`A row or clause tagged to several materials appears in each of those materials' rows below. **Material rows must never be added together.** Event and clause counts are likewise per material.`);
line();
const framedOn = (materialId: string) => {
  const evs = events.filter((e) => e.affectedMaterialIds.includes(materialId));
  const evIds = new Set(evs.map((e) => e.id));
  const claims = framing.filter((f) => evIds.has(f.eventId));
  return { evs, claims };
};
const ctlOf = (materialId: string) => controls.filter((m) => m.materialIds.includes(materialId));
line(`### 4a. Concern and controls`);
line();
table(
  ["Material", "Events naming it", "Framing claims on those events", "of which on commitment-bearing events (responder framing, any source)", "...official source only", "Framing categories on commitment-bearing events (official source only)", "Control clauses tagged", "Status on as-of: in force / suspended / announced / concluded", "Clauses whose current status has a stated end after as-of"],
  materials.map((m) => {
    const { evs, claims } = framedOn(m.id);
    const resp = claims.filter((f) => commitEvents.has(f.eventId));
    const respOfficial = resp.filter(officialFraming);
    const cats = [...tally(respOfficial.flatMap((f) => f.category)).entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([k, v]) => `${k} ${v}`).join(", ");
    const cl = ctlOf(m.id);
    const st = tally(cl.map((x) => controlStatusOn(x, asOf) ?? "none"));
    const ending = cl.filter((x) => {
      const u = currentControlEntry(x).until;
      return u && u > asOf;
    }).length;
    return [m.id, evs.length, claims.length, resp.length, respOfficial.length, cats || "none", cl.length, `${st.get("in_force") ?? 0} / ${st.get("suspended") ?? 0} / ${st.get("announced") ?? 0} / ${st.get("concluded") ?? 0}`, ending];
  }),
);
line(`### 4b. Government response: standing and physical, per material`);
line();
line(`Government commitment rows folded per material (a part folds only into a GC package that names the same material). "Named project rows" are GC rows with a registry project; "distinct projects" dedupes them.`);
line();
const gcFor = (materialId: string) => gcFolded(all.filter((c) => c.materialIds.includes(materialId)), (p) => isGC(p) && p.materialIds.includes(materialId));
const respRows = materials.map((m) => {
  const rows = gcFor(m.id);
  const named = rows.filter((c) => c.projectId);
  // Distinct projects come from unfolded GC rows: a folded part can carry the project its package row lacks.
  const projIds = new Set(all.filter((c) => isGC(c) && c.materialIds.includes(m.id) && c.projectId).map((c) => c.projectId!));
  const projBuilt = [...projIds].filter((id) => projectViews.find((p) => p.id === id)?.built).length;
  const ledger = all.filter((c) => c.materialIds.includes(m.id));
  return {
    m,
    rows,
    cells: [
      m.id,
      rows.length,
      rows.filter((c) => finStatus(c) === "disbursed" || finStatus(c) === "partially_disbursed").length,
      rows.filter((c) => finStatus(c) === "contracted").length,
      rows.filter((c) => legalStanding(c) === "not_yet_binding").length,
      rows.filter((c) => legalStanding(c) === "status_not_stated").length,
      named.length,
      projIds.size,
      projBuilt,
      ledger.filter((c) => c.valueRole === "funding_option").length,
      ledger.filter((c) => c.valueRole === "indication").length,
      ledger.filter((c) => ["program_envelope", "budget_appropriation", "lending_authority"].includes(c.valueRole)).length,
      ledger.filter((c) => ["private_financing", "recipient_own_funds", "total_project_cost", "expected_co_investment"].includes(c.valueRole)).length,
      ledger.filter((c) => c.valueRole === "commitment" && isEnded(c)).length + ledger.filter((c) => c.valueRole !== "commitment" && isEnded(c)).length,
    ] as (string | number)[],
  };
});
table(
  ["Material", "GC rows (folded)", "funded (part./full disb.)", "contracted only", "not yet binding", "status not stated", "named-project GC rows (folded)", "distinct named projects (unfolded GC rows)", "of those, construction-or-later recorded", "funding options", "indications", "envelopes / appropriations / authority", "private / own funds / total cost / expected co-invest", "ended rows (any role)"],
  respRows.map((r) => r.cells),
);
line(`Material tagging caveat. Rows naming at least three tracked materials (they inflate thin materials' rows):`);
line();
table(
  ["Row", "Role", "Materials", "materialAttribution", "stageAllocation"],
  all.filter((c) => c.materialIds.length >= 3).map((c) => [c.id, c.valueRole, c.materialIds.join(", "), c.materialAttribution, c.stageAllocation]),
);
line(`### 4c. Providing government of GC rows (folded), per material`);
line();
const actors = [...new Set(gcAll.map((c) => c.providerJurisdiction!))].sort();
table(
  ["Material", ...actors],
  materials.map((m) => {
    const rows = gcFor(m.id);
    return [m.id, ...actors.map((a) => rows.filter((c) => c.providerJurisdiction === a).length)];
  }),
);
line(`### 4d. Stage cells: capital and controls on the same material x stage (from \`stageResponseMap\`)`);
line();
line(`A cell holds record counts. A control's stage is where its covered items sit, not a claim that the clause restricts that stage; sharing a cell shows co-location, not effect or cause. Capital = non-ended government commitments (packages once); options and ended rows are apart.`);
line();
const map = stageResponseMap(asOf);
const cellRows: (string | number)[][] = [];
const pattern = { both: 0, capitalOnly: 0, controlOnly: 0, other: 0 };
for (const m of materials) {
  const row = map.get(m.id);
  if (!row) continue;
  for (const stage of SUPPLY_CHAIN_STAGES) {
    const x = row.get(stage);
    if (!x) continue;
    const cap = x.capitalIds.length;
    const ctl = x.controlIds.length;
    if (cap && ctl) pattern.both++;
    else if (cap) pattern.capitalOnly++;
    else if (ctl) pattern.controlOnly++;
    else pattern.other++;
    cellRows.push([
      m.id,
      stage,
      `${cap}${x.capitalActors.length ? ` (${x.capitalActors.join("/")})` : ""}`,
      x.optionIds.length,
      x.endedIds.length,
      `${ctl}${ctl ? ` (${Object.entries(x.controlsByIssuer).map(([k, v]) => `${k} ${v!.length}`).join(", ")})` : ""}`,
      Object.entries(x.controlStatuses).map(([k, v]) => `${k} ${v}`).join(", ") || "-",
      x.designationIds.length,
    ]);
  }
}
line(`Cells (material x stage with any record): ${cellRows.length}. Capital and controls both: ${pattern.both}; capital only: ${pattern.capitalOnly}; controls only: ${pattern.controlOnly}; designation/option/ended only: ${pattern.other}. (A row counted in a cell is counted once per cell; cells are not additive.)`);
line();
table(["Material", "Stage", "Capital rows (actors)", "Options", "Ended", "Control clauses (issuer)", "Control status on as-of", "Designations"], cellRows);

// --- 5. Concern <-> response join at the event ---------------------------------------------
line(`## 5. Rationale on the announcing event, per commitment-bearing event`);
line();
line(`Framing attached to the event that announces a commitment is the announcing government's stated rationale for that event. It is quoted framing, not evidence that a control caused the instrument. Only events carrying commitment rows are listed. A claim whose source is not an official document is marked; it is excluded from every count that requires official government framing.`);
line();
table(
  ["Event", "Actor", "Date", "Framing claims (id: categories)", "Fin. rows", "Control clauses on same event"],
  sortIds(commitEvents).map((id) => {
    const e = eventById.get(id)!;
    const cl = framing.filter((f) => f.eventId === id);
    return [id, e.jurisdiction, e.date, cl.length ? cl.map((f) => `${f.id}: ${f.category.join("+")}${officialFraming(f) ? "" : ` [source is ${getSourceById(f.sourceId)?.sourceType ?? "unknown"}/${getSourceById(f.sourceId)?.confidence ?? "?"}, not official]`}`).join("; ") : "none on record", all.filter((c) => c.eventId === id).length, controls.filter((m) => m.eventId === id).length];
  }),
);

// --- 6. Controls with stated end dates -----------------------------------------------------
line(`## 6. Control clauses and stated end dates at ${asOf}`);
line();
const endingClauses = controls
  .map((m) => ({ m, e: currentControlEntry(m) }))
  .filter(({ e }) => e.until && e.until > asOf)
  .sort((a, b) => (a.e.until! < b.e.until! ? -1 : a.e.until! > b.e.until! ? 1 : a.m.id < b.m.id ? -1 : 1));
const endGroups = tally(endingClauses.map(({ m, e }) => `${controlIssuer(m)} ${e.status} until ${e.until}`));
table(
  ["Issuer, current status, stated end", "Clauses", "Days after as-of"],
  [...endGroups.entries()].sort().map(([k, v]) => [k, v, daysBetween(asOf, k.split("until ")[1])]),
);
line(`Clause ids with a stated end after the as-of date: ${endingClauses.map(({ m }) => m.id).join(", ")}.`);
line();
const byIssuer = tally(controls.map((m) => `${controlIssuer(m)}|${m.direction}|${controlStatusOn(m, asOf) ?? "none"}`));
table(["Issuer", "Direction", "Status on as-of", "Clauses"], [...byIssuer.entries()].sort().map(([k, v]) => [...k.split("|"), v]));

// --- 7. Freshness of the P1 rows -----------------------------------------------------------
line(`## 7. P1-bundle rows: what the queue flag rests on`);
line();
line(`For each row in a P1 bundle: the queue's own categorical priorities for the two separate clocks (financial status and physical status), the \`lifecycleReview\` stamps as recorded, and the newest source cited for the status history (published date preferred; a source with only an access date is labelled and is not an evidence date). The flag is a maintenance flag; it does not say the status is wrong, and the rows stay in every baseline count. No freshness score is computed. The last column is the queue's own reason text, verbatim.`);
line();
function statusSources(c: FinancialCommitment, kind: "fin" | "impl") {
  const hist = kind === "fin" ? c.financialStatusHistory : c.implementationStatusHistory;
  const ids = new Set(hist.map((e) => e.sourceId));
  const list = [...ids].map((id) => ({ id, ...(srcDate(id) ?? { date: "unknown", kind: "?" }) }));
  // Evidence recency: published dates first (newest last); sources with only an access date sort before them.
  return list.sort((a, b) => (a.kind === b.kind ? (a.date < b.date ? -1 : 1) : a.kind === "published" ? 1 : -1));
}
function newest(c: FinancialCommitment, kind: "fin" | "impl"): string {
  const s = statusSources(c, kind);
  if (!s.length) return "no status entries";
  const n = s[s.length - 1];
  return `${n.id} (${n.kind === "published" ? "published" : "ACCESSED only, not an evidence date"} ${n.date}; ${n.date === "unknown" ? "?" : daysBetween(n.date, asOf)}d)`;
}
const clock = (r: LifecycleRefreshRow, k: "financial" | "implementation") => {
  const a = r[k];
  if (!a.applicable) return "n/a";
  return `${a.status ?? "none recorded"}, ${a.ageDays === null ? "no dated evidence and no review date recorded" : `${a.ageDays}d`}, ${a.priority}`;
};
table(
  ["Row", "Role (GC?)", "Bundle", "Row priority", "Financial clock", "Physical clock", "Review stamps (fin / phys)", "Newest source in financial history", "Newest source in physical history", "Queue reason text (verbatim)"],
  p1BundleRows.map((r) => {
    const c = byId.get(r.commitmentId)!;
    return [
      r.commitmentId,
      `${c.valueRole}${isGC(c) ? " (GC)" : ""}`,
      bundleOf.get(r.commitmentId)!.title,
      r.priority,
      clock(r, "financial"),
      clock(r, "implementation"),
      c.lifecycleReview ? `${c.lifecycleReview.financialStatusCheckedAt ?? "null"} / ${c.lifecycleReview.implementationStatusCheckedAt ?? "null"}` : "none",
      newest(c, "fin"),
      c.implementationStatusHistory.length ? newest(c, "impl") : "no physical history",
      [...r.financial.reasons, ...r.implementation.reasons].join("; "),
    ];
  }),
);
const p1Own = p1BundleRows.filter((r) => r.priority === "P1");
table(
  ["Row-level cause of P1 (rows individually P1)", "Rows"],
  [
    ["financial clock P1 (age > 365d or undated, or pre-binding named project > 180d)", p1Own.filter((r) => r.financial.priority === "P1").length],
    ["physical clock P1 (no review date recorded and binding/old financial status, or construction/feasibility undated or > 365d)", p1Own.filter((r) => r.implementation.priority === "P1").length],
    ["both clocks P1", p1Own.filter((r) => r.financial.priority === "P1" && r.implementation.priority === "P1").length],
    ["physical clock only (financial clock below P1)", p1Own.filter((r) => r.financial.priority !== "P1").length],
    ["financial clock only (physical clock below P1 or n/a)", p1Own.filter((r) => r.implementation.priority !== "P1").length],
  ],
);

// --- 8. Sensitivity of the material table to P1 rows ---------------------------------------
line(`## 8. Diagnostic sensitivity scenario: material counts with P1-exposed rows removed`);
line();
line(`This is a diagnostic scenario, not an estimate. Every row stays in the baseline; queue membership does not invalidate a supported fact. It shows how many baseline counts rest on rows the queue marks for review. "P1-exposed" = the row's own queue priority is P1. "Bundle-only" rows sit in a P1 bundle but are not individually P1 (kept in the base). The base is the folded GC rows of 4b.`);
line();
table(
  ["Material", "GC rows (folded)", "P1-exposed", "bundle-only", "binding GC rows: all", "scenario: binding GC rows with P1-exposed removed", "funded GC rows: all", "scenario: funded with P1-exposed removed", "named projects with construction-or-later: all", "scenario: ...with projects having a P1-exposed row removed"],
  respRows.map(({ m, rows }) => {
    const exposed = rows.filter((c) => isP1Row(c.id));
    const bundleOnly = rows.filter((c) => !isP1Row(c.id) && inP1Bundle(c.id));
    const keep = rows.filter((c) => !isP1Row(c.id));
    const projIds = new Set(all.filter((c) => isGC(c) && c.materialIds.includes(m.id) && c.projectId).map((c) => c.projectId!));
    const builtAll = [...projIds].filter((id) => projectViews.find((p) => p.id === id)?.built);
    const builtClean = builtAll.filter((id) => !(byProject.get(id) ?? []).some((c) => isP1Row(c.id)));
    return [
      m.id,
      rows.length,
      exposed.length,
      bundleOnly.length,
      rows.filter((c) => BINDING.includes(finStatus(c))).length,
      keep.filter((c) => BINDING.includes(finStatus(c))).length,
      rows.filter((c) => FUNDED.includes(finStatus(c))).length,
      keep.filter((c) => FUNDED.includes(finStatus(c))).length,
      builtAll.length,
      builtClean.length,
    ];
  }),
);

// --- 9. Row ledger -------------------------------------------------------------------------
line(`## 9. Row ledger (all ${all.length} financial rows; amounts exactly as stated, never converted or summed)`);
line();
table(
  ["Row", "Actor", "Role", "Capital source", "Instrument", "Amount as stated [qualifier currency]", "Financial history", "Physical history", "Project", "Materials", "Queue priority (fin/phys/row)"],
  all.map((c) => {
    const q = queueRow.get(c.id)!;
    return [
      c.id,
      c.providerJurisdiction ?? "-",
      c.valueRole,
      c.capitalSource,
      c.instrument,
      amountText(c),
      histText(c.financialStatusHistory),
      c.implementationStatusHistory.length ? histText(c.implementationStatusHistory) : implStatus(c),
      c.projectId ?? "-",
      c.materialIds.join(", ") || "-",
      `${q.financial.priority}/${q.implementation.applicable ? q.implementation.priority : "n/a"}/${q.priority}`,
    ];
  }),
);

// --- 10. Status-supporting evidence for rows named in the findings --------------------------
line(`## 10. Source locators behind the current statuses of rows cited in the analysis`);
line();
line(`Locators are copied from \`evidence[].locator\`; "locator not recorded" means the field is null. Evidence entries are listed where their \`supports\` path touches a status history.`);
line();
const findingRowPatterns = [
  // Every financial row id cited in the narrative; a trailing * matches a family of rows.
  "fin-au-alcoa-sojitz-gallium-2025-*",
  "fin-au-cmpti-2025-production-tax-offset",
  "fin-ca-cmrdd-2024-cyclic-materials",
  "fin-ca-g7-2025-ucore-*",
  "fin-ca-pdac-2026-ggt-eip",
  "fin-ca-pdac-2026-wicheeda-flmf",
  "fin-ca-trail-cgf-2026-indication",
  "fin-eu-eib-2025-up-catalyst-loan",
  "fin-us-alcoa-sojitz-gallium-2025-equity",
  "fin-us-army-perpetua-antimony-otia",
  "fin-us-chips-usar-2026-*",
  "fin-us-dod-5n-germanium-2024",
  "fin-us-dod-mp-2025-*",
  "fin-us-dod-perpetua-stibnite-dpa",
  "fin-us-dow-5n-germanium-2025",
  "fin-us-dow-arr-antimony-2025",
  "fin-us-dow-usac-antimony-2026",
  "fin-us-exim-perpetua-stibnite-2026",
  "fin-us-osc-vulcan-reelement-2025-*",
];
const findingRows = all
  .map((c) => c.id)
  .filter((id) => findingRowPatterns.some((p) => (p.endsWith("*") ? id.startsWith(p.slice(0, -1)) : id === p)));
table(
    ["Row", "Supports", "Source", "Source published / accessed", "Locator"],
    findingRows.flatMap((id) => {
      const c = byId.get(id);
      if (!c) return [[id, "UNKNOWN ROW", "-", "-", "-"]];
      return c.evidence
        .filter((e) => /status/i.test(JSON.stringify(e.supports)))
        .map((e) => {
          const src = getSourceById(e.sourceId);
          return [id, JSON.stringify(e.supports), e.sourceId, `${src?.datePublished ?? "no published date"} / ${src?.dateAccessed ?? "-"}`, e.locator ?? "locator not recorded"];
        });
    }),
  );

// --- 11. Control clauses cited in the analysis ---------------------------------------------
line(`## 11. Control-clause status and evidence locators`);
line();
line(`Clauses listed: every clause whose current status has a stated end after ${asOf}, the clauses on antimony and germanium, and the clauses on the two events that carry both commitments and controls. Evidence is listed where its \`supports\` touches \`status\`; "locator not recorded" means the field is null.`);
line();
const clauseIds = new Set<string>([
  ...endingClauses.map(({ m }) => m.id),
  ...controls.filter((m) => m.materialIds.some((x) => x === "antimony" || x === "germanium")).map((m) => m.id),
  ...controls.filter((m) => commitEvents.has(m.eventId)).map((m) => m.id),
]);
table(
  ["Clause", "Issuer / direction", "Status on as-of (current entry: from, until)", "Source", "Source published / accessed", "Locator"],
  sortIds(clauseIds).flatMap((id) => {
    const m = controls.find((x) => x.id === id)!;
    const e = currentControlEntry(m);
    const head = `${controlIssuer(m)} / ${m.direction}`;
    const st = `${controlStatusOn(m, asOf) ?? "none"} (${e.status}, ${e.date ?? "undated"}, ${e.until ?? "no stated end"})`;
    const ev = m.evidence.filter((x) => /status/i.test(JSON.stringify(x.supports)));
    if (!ev.length) return [[id, head, st, "-", "-", "no status evidence entry"]];
    return ev.map((x) => {
      const src = getSourceById(x.sourceId);
      return [id, head, st, x.sourceId, `${src?.datePublished ?? "no published date"} / ${src?.dateAccessed ?? "-"}`, x.locator ?? "locator not recorded"];
    });
  }),
);

process.stdout.write(out.join("\n").trimEnd() + "\n");
