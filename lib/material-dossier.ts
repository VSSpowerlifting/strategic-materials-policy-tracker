/**
 * The material dossier: one serializable payload per material, derived from the seed data and the lattice
 * model, so Compare and the dossier cannot disagree on a count. Every count is a number of records of one kind;
 * nothing here adds, divides, converts or otherwise computes any money. A row's amount is shown once, at its own
 * value in its own currency and qualifier, and a part of a package is shown inside the package and not added to it.
 *
 * Reads only the seed loaders in `lib/data.ts` (never the private draft files). "As of" is an argument, never
 * the build clock. The lattice places designations, not projects: a project is a registry record with its own
 * stage list, kept apart from the designation that recognizes it.
 */
import { LAYER_KEYS, layerOf } from "./capital-intelligence";
import type { LayerKey } from "./capital-intelligence";
import { controlIssuer, controlStatusOn, currentFinancialStatus, isEnded, legalStanding } from "./capital-control";
import type { LegalStanding } from "./capital-control";
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getAllFramingClaims,
  getAllMaterials,
  getAllOrganizations,
  getAllProgrammes,
  getAllProjectDesignations,
  getAllProjects,
  getAllSources,
} from "./data";
import { formatDate } from "./format";
import {
  controlMeasureTypeLabels,
  controlStatusLabels,
  controlledItemTypeLabels,
  designationStatusLabels,
  financialInstrumentLabels,
  financialStatusLabels,
  jurisdictionLabels,
  jurisdictionShort,
  supplyChainStageLabels,
} from "./labels";
import { amountView, buildLatticeModel, commitmentTitle } from "./lattice";
import type { LatticeModel } from "./lattice";
import { NO_FILTER, cellView } from "./lattice-view";
import { getMaterialMeta } from "./materials-meta";
import { renderableNote } from "./material-notes-review";
import type { Ledger, NoteField } from "./material-notes-review";
import { NO_ITEM_MEASURE_TYPES } from "./types";
import type {
  ControlMeasure,
  FinancialCommitment,
  FramingClaim,
  JurisdictionCode,
  Material,
  Organization,
  PolicyEvent,
  PolicyStatus,
  Programme,
  Project,
  ProjectDesignation,
  ProjectLocation,
  Source,
  SupplyChainStage,
} from "./types";

// --- Input ----------------------------------------------------------------------------------------

/** Everything the dossier reads. Defaults to the seed; a test passes fixtures to reach cases the seed lacks. */
export type DossierData = {
  materials: Material[];
  events: PolicyEvent[];
  framing: FramingClaim[];
  commitments: FinancialCommitment[];
  controls: ControlMeasure[];
  designations: ProjectDesignation[];
  projects: Project[];
  programmes: Programme[];
  organizations: Organization[];
  sources: Source[];
};

export function seedData(): DossierData {
  return {
    materials: getAllMaterials(),
    events: getAllEvents(),
    framing: getAllFramingClaims(),
    commitments: getAllFinancialCommitments(),
    controls: getAllControlMeasures(),
    designations: getAllProjectDesignations(),
    projects: getAllProjects(),
    programmes: getAllProgrammes(),
    organizations: getAllOrganizations(),
    sources: getAllSources(),
  };
}

// --- Payload types --------------------------------------------------------------------------------

export type Counts = { commitments: number; controls: number; designations: number };

export type MoneyText = {
  /** "up to GBP 71 million": the row's own qualifier, currency and figure. */
  text: string;
  qualifier: string | null;
  currency: string;
  value: string;
};

/** A status entry with its own date, labelled as a status date; an undated entry says so and borrows no other date. */
export type StatusLine = { text: string; date: string | null; dated: boolean };

export type RelationshipNote = {
  relation: "part_of" | "drawn_from";
  targetId: string;
  targetTitle: string;
  href: string;
  /** Whether the other row names this material. */
  inSet: boolean;
  /** A part_of link to a row that names the material but under which this row is not nested. */
  alsoParent: boolean;
};

export type CapitalRowView = {
  id: string;
  href: string;
  title: string;
  actorShort: string | null;
  provider: string | null;
  recipient: string | null;
  amount: MoneyText | null;
  /** The source wording of the amount, verbatim, in its own language. */
  asStated: string | null;
  instrument: string;
  status: StatusLine;
  standing: LegalStanding;
  standingLabel: string;
  authority: string | null;
  scope: string;
  notes: RelationshipNote[];
  /** "Part: Equity, GBP 36 million; not added again". Set only on a row shown inside its package. */
  partLabel: string | null;
  parts: CapitalRowView[];
};

export type ControlHistoryLine = { text: string; date: string | null; until: string | null };

export type ControlView = {
  id: string;
  href: string;
  title: string;
  issuerShort: string;
  issuerName: string;
  documentNumber: string | null;
  /** "In force on 23 Sep 2026", or "No status recorded on this date". */
  asOfState: string;
  /** The status entry in effect on the as-of date, with its own date: "In force, status date 4 Feb 2025". */
  entry: string | null;
  history: ControlHistoryLine[];
  items: string | null;
  itemStages: string[];
  legalBasis: { id: string; href: string; title: string }[];
  /** Why the clause sits in the no-stage column; null when it has a stage. */
  noStageReason: string | null;
};

export type DesignationView = {
  id: string;
  projectId: string;
  href: string;
  heading: string;
  asStated: string | null;
  programme: string;
  programmeActor: string;
  status: StatusLine;
  holders: string[];
  materials: string[];
  untracked: string[];
  stages: string[];
  /** The registry project, secondary to the designation. */
  registry: { locations: string[]; sponsors: string[]; stageNote: string | null; /** Materials outside the tracked set that the project record (not the designation) names. */ untracked: string[] };
  noStageReason: string | null;
};

export type StageBlock = {
  id: SupplyChainStage;
  label: string;
  counts: Counts;
  actors: { commitments: string[]; controls: string[]; designations: string[] };
  capital: CapitalRowView[];
  options: CapitalRowView[];
  ended: CapitalRowView[];
  controls: ControlView[];
  designations: DesignationView[];
  /** Nothing of any kind sits at this stage for this material. */
  empty: boolean;
};

export type RegistryProject = {
  id: string;
  href: string;
  name: string;
  locations: string[];
  sponsors: string[];
  stages: string[];
  capitalRows: { id: string; href: string; title: string }[];
  /** "Designated under {programme} for other materials"; empty when the project has no designation at all. */
  designatedElsewhere: string[];
};

export type LayerBlock = {
  key: LayerKey;
  label: string;
  gloss: string;
  /** Rows in this layer, top level and nested, counted once each. */
  count: number;
  live: CapitalRowView[];
  statusNotStated: CapitalRowView[];
  ended: CapitalRowView[];
};

export type Stat = { key: string; label: string; value: number; basis: string; sublabel?: string };

export type TimelinePoint = {
  id: string;
  href: string;
  date: string;
  title: string;
  actorShort: string;
  status: PolicyStatus;
  lane: number;
  /** Position along the axis, 0 to 100. */
  pct: number;
};

export type Timeline = {
  start: string;
  end: string;
  asOf: string;
  asOfPct: number;
  ticks: { year: number; pct: number; phone: boolean }[];
  points: TimelinePoint[];
  lanes: number;
  /** Stated dates after the as-of, from events and every status history; empty means none is stated. */
  futureDates: { date: string; source: string }[];
  newest: { id: string; href: string; title: string; date: string; actorShort: string }[];
};

export type EventRow = {
  event: PolicyEvent;
  children: Counts;
  supersededBy: { id: string; title: string } | null;
};

export type CitedKind = "event" | "capital_row" | "control_clause" | "designation" | "project" | "framing_claim" | "material_record" | "registry_record";

export type SourceCitation = {
  source: Source;
  citedBy: { kind: CitedKind; id: string; href: string | null; label: string }[];
};

export type RelatedItem = { id: string; href: string; name: string };

export type NotesBlock = {
  fields: { field: NoteField; label: string; text: string }[];
  /** Typical end uses: a list with no quantities, exempt from the ledger and shown under the editorial label. */
  downstream: string[];
};

export type DossierPayload = {
  slug: string;
  id: string;
  nameEn: string;
  nameZh: string | null;
  symbol: string;
  asOf: string;
  lede: string;
  metaDescription: string;
  groupNote: { text: string; href: string | null; linkText: string | null } | null;
  stats: Stat[];
  stages: StageBlock[];
  unstaged: { capital: CapitalRowView[]; controls: ControlView[]; designations: DesignationView[] };
  registryProjects: RegistryProject[];
  money: { layers: LayerBlock[]; topLevel: number; nested: number; total: number };
  controls: ControlView[];
  timeline: Timeline;
  actorStatuses: { actor: JurisdictionCode; statuses: PolicyStatus[] }[];
  events: EventRow[];
  related: { programmes: RelatedItem[]; organizations: RelatedItem[]; sources: SourceCitation[]; legalBasis: (RelatedItem & { date: string; clauses: number; inMaterialEvents: boolean })[] };
  notes: NotesBlock;
  links: { capital: string; controls: string };
};

// --- Small helpers --------------------------------------------------------------------------------

const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const COMMITMENT_FAMILY: readonly LayerKey[] = ["public_commitment", "joint_vehicle_commitment", "other_commitment"];

/** Layer wording for the dossier. Its own labels, because a dossier lists rows and never adds them up. */
const LAYER_LABELS: Record<LayerKey, string> = {
  public_commitment: "Public commitments",
  joint_vehicle_commitment: "Joint-vehicle commitments",
  other_commitment: "Other commitments",
  funding_option: "Funding options",
  indication: "Non-binding indications",
  envelope: "Envelopes, appropriations and lending authorities",
  private_financing: "Private financing",
  recipient_own_funds: "Recipient's own funds",
  expected_co_investment: "Expected co-investment",
  total_project_cost: "Cost of the whole project",
};

const LAYER_GLOSSES: Record<LayerKey, string> = {
  public_commitment: "Committed to a recipient by a government or public enterprise, at the status each row states. A contracted row is an executed agreement, which need not mean funds are obligated or paid.",
  joint_vehicle_commitment: "Committed by a vehicle that public and private parties set up together. The public share is not stated.",
  other_commitment: "Committed with private capital, or capital whose source the sources do not state.",
  funding_option: "A ceiling a party may call on under an executed agreement. An option is not committed money until it is exercised.",
  indication: "Non-binding letters of intent or interest that name an amount: possible support, not a commitment, capital or a backer.",
  envelope: "Ceilings that awards are drawn from. An award is never a division of its envelope.",
  private_financing: "Commercial capital raised alongside public money. Never public support.",
  recipient_own_funds: "The recipient's own contribution. Never public support.",
  expected_co_investment: "Money a government expects others to invest. Never a commitment.",
  total_project_cost: "What the whole project costs, whoever pays it. Never support.",
};

const STANDING_LABELS: Record<LegalStanding, string> = {
  binding: "Binding: an agreement is executed, which is not a payment",
  not_yet_binding: "Not yet binding",
  ended: "Ended: withdrawn or lapsed",
  status_not_stated: "Status not stated",
};

const moneyText = (a: NonNullable<ReturnType<typeof amountView>>): MoneyText => ({
  text: `${a.qualifier ? `${a.qualifier} ` : ""}${a.currency} ${a.value}`,
  qualifier: a.qualifier,
  currency: a.currency,
  value: a.value,
});

const dateWithin = (d: string | null | undefined, asOf: string) => !!d && d <= asOf;

function locationText(l: ProjectLocation): string {
  if (l.asStated) return l.asStated;
  return [l.subnational, l.countryCode].filter(Boolean).join(", ") || "Location not stated";
}

// --- Row views ------------------------------------------------------------------------------------

type Ctx = {
  data: DossierData;
  material: Material;
  asOf: string;
  commitmentById: Map<string, FinancialCommitment>;
  orgName: (id: string) => string;
  programmeName: (id: string) => string;
  projectById: Map<string, Project>;
  eventById: Map<string, PolicyEvent>;
  /** Rows that name this material. */
  inSet: Set<string>;
  /** Child row id to the id of the parent it nests under (a part_of parent that names this material). */
  parentOf: Map<string, string>;
};

export function financialStatusLine(c: FinancialCommitment): StatusLine {
  const last = c.financialStatusHistory[c.financialStatusHistory.length - 1];
  const label = financialStatusLabels[last.status];
  return last.date
    ? { text: `${label}, status date ${formatDate(last.date)}`, date: last.date, dated: true }
    : { text: last.status === "not_stated" ? "Status not stated" : `${label}, date not stated`, date: null, dated: false };
}

/** The one scope label a row carries, by precedence. It describes the row and never changes a figure. */
export function scopeLabel(c: FinancialCommitment, materialName: string): string {
  if (c.materialIds.length > 1) return `names ${c.materialIds.length} materials; the amount is not divided`;
  if (c.materialAttribution === "includes_untracked") return "also covers materials outside the tracked set";
  if (c.materialAttribution === "not_stated") return "material attribution not stated";
  return `names ${materialName} only`;
}

function partiesText(ids: readonly string[], fallback: string | null, ctx: Ctx): string | null {
  return ids.length ? ids.map(ctx.orgName).join(", ") : fallback;
}

function notesFor(c: FinancialCommitment, ctx: Ctx): RelationshipNote[] {
  const notes: RelationshipNote[] = [];
  const nestedUnder = ctx.parentOf.get(c.id);
  for (const r of c.relationships) {
    const target = ctx.commitmentById.get(r.commitmentId);
    if (!target) continue;
    if (r.relationship === "part_of" && r.commitmentId === nestedUnder) continue;
    const inSet = ctx.inSet.has(target.id);
    notes.push({
      relation: r.relationship,
      targetId: target.id,
      targetTitle: commitmentTitle(target),
      href: `/capital/${target.id}`,
      inSet,
      alsoParent: r.relationship === "part_of" && inSet,
    });
  }
  return notes;
}

function rowView(c: FinancialCommitment, ctx: Ctx, opts: { parts: CapitalRowView[]; asPart?: boolean; withNotes?: boolean }): CapitalRowView {
  const a = amountView(c);
  const money = a ? moneyText(a) : null;
  const standing = legalStanding(c);
  return {
    id: c.id,
    href: `/capital/${c.id}`,
    title: commitmentTitle(c),
    actorShort: c.providerJurisdiction ? jurisdictionShort[c.providerJurisdiction] : null,
    provider: partiesText(c.providerOrgIds, c.provider, ctx),
    recipient: partiesText(c.recipientOrgIds, c.recipient, ctx),
    amount: money,
    asStated: a ? a.asStated : null,
    instrument: financialInstrumentLabels[c.instrument],
    status: financialStatusLine(c),
    standing,
    standingLabel: STANDING_LABELS[standing],
    authority: c.legalAuthority,
    scope: scopeLabel(c, ctx.material.nameEn),
    notes: opts.withNotes === false ? [] : notesFor(c, ctx),
    partLabel: opts.asPart ? `Part: ${financialInstrumentLabels[c.instrument]}, ${money ? money.text : "no amount stated"}; not added again` : null,
    parts: opts.parts,
  };
}

/** The as-of entry of a control clause: the last dated entry on or before the date, an undated one only after a dated one. */
function controlEntryOn(m: ControlMeasure, asOf: string) {
  let hit: ControlMeasure["statusHistory"][number] | null = null;
  let seenDated = false;
  for (const e of m.statusHistory) {
    if (e.date === null) {
      if (seenDated) hit = e;
      continue;
    }
    if (e.date > asOf) break;
    seenDated = true;
    hit = e;
  }
  return hit;
}

function controlView(m: ControlMeasure, ctx: Ctx, noStage: boolean): ControlView {
  const issuer = controlIssuer(m);
  const event = ctx.eventById.get(m.eventId);
  const status = controlStatusOn(m, ctx.asOf);
  const entry = controlEntryOn(m, ctx.asOf);
  const label = controlMeasureTypeLabels[m.measureType];
  return {
    id: m.id,
    href: `/controls/${m.id}`,
    title: m.clause ? `${label}, ${m.clause}` : label,
    issuerShort: jurisdictionShort[issuer],
    issuerName: jurisdictionLabels[issuer],
    documentNumber: event?.documentNumber ?? null,
    asOfState: status ? `${controlStatusLabels[status]} on ${formatDate(ctx.asOf)}` : "No status recorded on this date",
    entry: entry ? `${controlStatusLabels[entry.status]}, ${entry.date ? `status date ${formatDate(entry.date)}` : "date not stated"}` : null,
    history: m.statusHistory.map((e) => ({
      text: `${controlStatusLabels[e.status]}, ${e.date ? `status date ${formatDate(e.date)}` : "date not stated"}`,
      date: e.date,
      until: e.until ?? null,
    })),
    items: m.controlledItemTypes.length ? m.controlledItemTypes.map((t) => controlledItemTypeLabels[t].toLowerCase()).join(", ") : null,
    itemStages: m.controlledStages.map((s) => supplyChainStageLabels[s]),
    legalBasis: m.legalBasisEventIds.map((id) => ({ id, href: `/events/${id}`, title: ctx.eventById.get(id)?.titleEn ?? id })),
    noStageReason: noStage
      ? NO_ITEM_MEASURE_TYPES.includes(m.measureType)
        ? "By rule: this kind of clause defines no items of its own, so it has no stage."
        : "Records no stage."
      : null,
  };
}

function designationView(d: ProjectDesignation, ctx: Ctx, noStage: boolean): DesignationView {
  const project = ctx.projectById.get(d.projectId);
  let entry: ProjectDesignation["statusHistory"][number] | null = null;
  for (const e of d.statusHistory) if (dateWithin(e.date, ctx.asOf)) entry = e;
  entry ??= d.statusHistory[d.statusHistory.length - 1] ?? null;
  const dStages = [...new Set(d.stages)];
  const pStages = project ? [...new Set(project.stages)] : [];
  const differs = pStages.length > 0 && (pStages.length !== dStages.length || pStages.some((s) => !dStages.includes(s)));
  const named = dStages.length ? `names ${dStages.map((s) => supplyChainStageLabels[s].toLowerCase()).join(", ")} only` : "names no stage";
  const programme = ctx.data.programmes.find((p) => p.id === d.programmeId);
  return {
    id: d.id,
    projectId: d.projectId,
    href: `/projects/${d.projectId}`,
    heading: project?.name ?? d.projectNameAsStated,
    asStated: project && project.name !== d.projectNameAsStated ? d.projectNameAsStated : null,
    programme: programme?.name ?? d.programmeId,
    programmeActor: programme ? jurisdictionLabels[programme.actor] : "",
    status: entry
      ? entry.date
        ? { text: `${designationStatusLabels[entry.status]}, status date ${formatDate(entry.date)}`, date: entry.date, dated: true }
        : { text: `${designationStatusLabels[entry.status]}, date not stated`, date: null, dated: false }
      : { text: "No status recorded", date: null, dated: false },
    holders: d.holderOrgIds.map(ctx.orgName),
    materials: d.materialIds.map((id) => ctx.data.materials.find((m) => m.id === id)?.nameEn ?? id),
    untracked: d.untrackedMaterialsAsStated,
    stages: dStages.map((s) => supplyChainStageLabels[s]),
    registry: {
      locations: (project?.locations ?? []).map(locationText),
      sponsors: (project?.sponsorOrgIds ?? []).map(ctx.orgName),
      untracked: project?.untrackedMaterialsAsStated ?? [],
      stageNote: differs
        ? `Project record codes: ${pStages.map((s) => supplyChainStageLabels[s].toLowerCase()).join(", ")}. Not placed here; this designation ${named}.`
        : null,
    },
    noStageReason: noStage ? "Records no stage." : null,
  };
}

// --- Sources (5.9) --------------------------------------------------------------------------------

/** Every `sourceId` and `sourceIds` value anywhere inside a record: evidence, status histories, relationships, terms, outcomes. */
function collectSourceIds(value: unknown, out: Set<string>): void {
  if (Array.isArray(value)) {
    for (const v of value) collectSourceIds(v, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "sourceId" && typeof v === "string") out.add(v);
      else if (k === "sourceIds" && Array.isArray(v)) for (const s of v) if (typeof s === "string") out.add(s);
      else collectSourceIds(v, out);
    }
  }
}

const KIND_ORDER: CitedKind[] = ["event", "capital_row", "control_clause", "designation", "project", "framing_claim", "material_record", "registry_record"];

function rowsFor(materialId: string, data: DossierData) {
  const named = <T extends { materialIds: string[] }>(rows: T[]) => rows.filter((r) => r.materialIds.includes(materialId));
  return {
    events: data.events.filter((e) => e.affectedMaterialIds.includes(materialId)),
    commitments: named(data.commitments),
    controls: named(data.controls),
    designations: named(data.designations),
    projects: named(data.projects),
  };
}

/**
 * The distinct sources a material's dossier rests on, each with the kinds of record that cite it: the events'
 * own sources, every source inside the commitment, control, designation and project rows naming the material,
 * the framing claims on those events, and the material record's own sources. Organization and programme registry
 * evidence and the sources of legal-basis events are left out unless `includeRegistry` asks for the wider count.
 */
export function sourcesCitedByMaterial(materialId: string, data: DossierData = seedData(), opts: { includeRegistry?: boolean } = {}): SourceCitation[] {
  const material = data.materials.find((m) => m.id === materialId);
  if (!material) return [];
  const rows = rowsFor(materialId, data);
  const sourceById = new Map(data.sources.map((s) => [s.id, s]));
  const cites = new Map<string, SourceCitation["citedBy"]>();
  const add = (sourceId: string, cite: SourceCitation["citedBy"][number]) => {
    const list = cites.get(sourceId) ?? [];
    if (!list.some((c) => c.kind === cite.kind && c.id === cite.id)) list.push(cite);
    cites.set(sourceId, list);
  };
  const cite = (kind: CitedKind, id: string, href: string | null, label: string, record: unknown) => {
    const ids = new Set<string>();
    collectSourceIds(record, ids);
    for (const s of ids) add(s, { kind, id, href, label });
  };
  const eventIds = new Set(rows.events.map((e) => e.id));
  for (const e of rows.events) for (const s of e.sourceIds) add(s, { kind: "event", id: e.id, href: `/events/${e.id}`, label: e.titleEn });
  for (const c of rows.commitments) cite("capital_row", c.id, `/capital/${c.id}`, commitmentTitle(c), c);
  for (const m of rows.controls) cite("control_clause", m.id, `/controls/${m.id}`, m.clause ? `${controlMeasureTypeLabels[m.measureType]}, ${m.clause}` : controlMeasureTypeLabels[m.measureType], m);
  for (const d of rows.designations) cite("designation", d.id, `/projects/${d.projectId}`, d.projectNameAsStated, d);
  for (const p of rows.projects) cite("project", p.id, `/projects/${p.id}`, p.name, p);
  for (const f of data.framing) if (eventIds.has(f.eventId)) add(f.sourceId, { kind: "framing_claim", id: f.id, href: `/events/${f.eventId}`, label: data.events.find((e) => e.id === f.eventId)?.titleEn ?? f.eventId });
  for (const s of material.sourceIds) add(s, { kind: "material_record", id: material.id, href: null, label: material.nameEn });
  if (opts.includeRegistry) {
    const r = relatedIds(rows);
    for (const o of data.organizations) if (r.organizations.has(o.id)) cite("registry_record", o.id, `/organizations/${o.id}`, o.name, o.evidence);
    for (const g of data.programmes) if (r.programmes.has(g.id)) cite("registry_record", g.id, `/programmes/${g.id}`, g.name, g.evidence);
  }
  return [...cites.entries()]
    .filter(([id]) => sourceById.has(id))
    .map(([id, citedBy]) => ({
      source: sourceById.get(id)!,
      citedBy: citedBy.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || byCodePoint(a.id, b.id)),
    }))
    .sort((a, b) => byCodePoint(a.source.id, b.source.id));
}

function relatedIds(rows: ReturnType<typeof rowsFor>) {
  const organizations = new Set<string>();
  const programmes = new Set<string>();
  for (const c of rows.commitments) {
    c.providerOrgIds.forEach((id) => organizations.add(id));
    c.recipientOrgIds.forEach((id) => organizations.add(id));
    if (c.programmeId) programmes.add(c.programmeId);
  }
  for (const p of rows.projects) p.sponsorOrgIds.forEach((id) => organizations.add(id));
  for (const d of rows.designations) {
    d.holderOrgIds.forEach((id) => organizations.add(id));
    programmes.add(d.programmeId);
  }
  return { organizations, programmes };
}

// --- Timeline (5.6) -------------------------------------------------------------------------------

const DAY = 86_400_000;
const dayNumber = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY);
/** The narrowest axis a phone shows: 358 px of track, with dots 10 px wide and 3 px apart at least. */
const MIN_GAP_PCT = (13 / 358) * 100;

function buildTimeline(events: PolicyEvent[], rows: ReturnType<typeof rowsFor>, asOf: string): Timeline {
  const sorted = [...events].sort((a, b) => byCodePoint(a.date, b.date) || byCodePoint(a.id, b.id));
  const latest = sorted.length ? sorted[sorted.length - 1].date : asOf;
  const first = sorted.length ? sorted[0].date : asOf;
  const startYear = Number(first.slice(0, 4));
  const start = `${startYear}-01-01`;
  const end = latest > asOf ? latest : asOf;
  const span = Math.max(1, dayNumber(end) - dayNumber(start));
  const pctOf = (iso: string) => ((dayNumber(iso) - dayNumber(start)) / span) * 100;

  const laneEnds: number[] = [];
  const points: TimelinePoint[] = sorted.map((e) => {
    const pct = pctOf(e.date);
    let lane = laneEnds.findIndex((last) => pct - last >= MIN_GAP_PCT);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = pct;
    return { id: e.id, href: `/events/${e.id}`, date: e.date, title: e.titleEn, actorShort: jurisdictionShort[e.jurisdiction], status: e.policyStatus, lane, pct };
  });

  const endYear = Number(end.slice(0, 4));
  const years = endYear - startYear;
  const step = years <= 4 ? 1 : years <= 8 ? 2 : 4;
  const ticks: Timeline["ticks"] = [];
  for (let y = startYear; y <= endYear; y++) ticks.push({ year: y, pct: pctOf(`${y}-01-01`), phone: (y - startYear) % step === 0 });

  const future: Timeline["futureDates"] = [];
  const see = (date: string | null | undefined, source: string) => {
    if (date && date > asOf) future.push({ date, source });
  };
  for (const e of rows.events) see(e.date, `event ${e.id}`);
  for (const c of rows.commitments) {
    for (const s of c.financialStatusHistory) see(s.date, `capital row ${c.id}`);
    for (const s of c.implementationStatusHistory) see(s.date, `capital row ${c.id}`);
  }
  for (const m of rows.controls)
    for (const s of m.statusHistory) {
      see(s.date, `control clause ${m.id}`);
      see(s.until, `control clause ${m.id}`);
    }
  for (const d of rows.designations) for (const s of d.statusHistory) see(s.date, `designation ${d.id}`);
  future.sort((a, b) => byCodePoint(a.date, b.date) || byCodePoint(a.source, b.source));

  const newest = [...sorted].reverse().slice(0, 6).map((e) => ({ id: e.id, href: `/events/${e.id}`, title: e.titleEn, date: e.date, actorShort: jurisdictionShort[e.jurisdiction] }));
  return { start, end, asOf, asOfPct: pctOf(asOf), ticks, points, lanes: laneEnds.length, futureDates: future, newest };
}

// --- Assembly -------------------------------------------------------------------------------------

/** Group a material's events by actor into distinct statuses, in canonical order. */
function statusByActor(events: PolicyEvent[]) {
  const order: JurisdictionCode[] = ["china", "us", "eu", "australia", "japan", "canada", "uk", "india", "other"];
  const map = new Map<JurisdictionCode, Set<PolicyStatus>>();
  for (const e of events) {
    const set = map.get(e.jurisdiction) ?? new Set<PolicyStatus>();
    set.add(e.policyStatus);
    map.set(e.jurisdiction, set);
  }
  return order.filter((a) => map.has(a)).map((actor) => ({ actor, statuses: [...map.get(actor)!] }));
}

export function buildMaterialDossier(slug: string, asOf: string, model?: LatticeModel, dataArg?: DossierData, ledger?: Ledger): DossierPayload | null {
  const data = dataArg ?? seedData();
  const material = data.materials.find((m) => m.slug === slug);
  if (!material) return null;
  const lattice = model ?? buildLatticeModel(asOf, data.commitments, data.controls, data.designations);
  const rows = rowsFor(material.id, data);

  const commitmentById = new Map(data.commitments.map((c) => [c.id, c]));
  const orgById = new Map(data.organizations.map((o) => [o.id, o]));
  const programmeById = new Map(data.programmes.map((p) => [p.id, p]));
  const projectById = new Map(data.projects.map((p) => [p.id, p]));
  const eventById = new Map(data.events.map((e) => [e.id, e]));
  const inSet = new Set(rows.commitments.map((c) => c.id));

  // A part_of child nests under the first parent that also names this material, at any depth.
  const parentOf = new Map<string, string>();
  for (const c of rows.commitments) {
    const parent = c.relationships.find((r) => r.relationship === "part_of" && inSet.has(r.commitmentId) && r.commitmentId !== c.id);
    if (parent) parentOf.set(c.id, parent.commitmentId);
  }
  const ctx: Ctx = {
    data,
    material,
    asOf,
    commitmentById,
    orgName: (id) => orgById.get(id)?.name ?? id,
    programmeName: (id) => programmeById.get(id)?.name ?? id,
    projectById,
    eventById,
    inSet,
    parentOf,
  };

  const commitmentsNaming = [...rows.commitments].sort((a, b) => byCodePoint(a.id, b.id));
  const childrenOf = new Map<string, FinancialCommitment[]>();
  for (const c of commitmentsNaming) {
    const p = parentOf.get(c.id);
    if (p) childrenOf.set(p, [...(childrenOf.get(p) ?? []), c]);
  }

  // --- Money list: one block per value-role layer, every row at its own amount, nothing computed ---
  const reached = new Set<string>();
  const nestedView = (c: FinancialCommitment, path: Set<string>): CapitalRowView => {
    reached.add(c.id);
    const nextPath = new Set(path).add(c.id);
    const kids = (childrenOf.get(c.id) ?? []).filter((k) => !nextPath.has(k.id)).map((k) => nestedView(k, nextPath));
    return rowView(c, ctx, { parts: kids, asPart: path.size > 0 });
  };
  const treeSize = (r: CapitalRowView): number => 1 + r.parts.reduce((n, p) => n + treeSize(p), 0);
  const currencyKey = (c: FinancialCommitment) => c.amount?.currency ?? "~";
  const topLevelRows = commitmentsNaming.filter((c) => !parentOf.has(c.id));
  const orderedTop = [...topLevelRows].sort((a, b) => byCodePoint(currencyKey(a), currencyKey(b)) || byCodePoint(a.id, b.id));
  const layerMap = new Map<LayerKey, { live: CapitalRowView[]; statusNotStated: CapitalRowView[]; ended: CapitalRowView[]; count: number }>();
  const place = (c: FinancialCommitment) => {
    const view = nestedView(c, new Set());
    const key = layerOf(c);
    const slot = layerMap.get(key) ?? { live: [], statusNotStated: [], ended: [], count: 0 };
    (isEnded(c) ? slot.ended : currentFinancialStatus(c) === "not_stated" ? slot.statusNotStated : slot.live).push(view);
    slot.count += treeSize(view);
    layerMap.set(key, slot);
  };
  for (const c of orderedTop) place(c);
  // A cycle would leave rows unreached; list them rather than lose them.
  for (const c of commitmentsNaming) if (!reached.has(c.id)) place(c);
  const layerBlocks: LayerBlock[] = LAYER_KEYS.filter((k) => layerMap.has(k)).map((key) => ({ key, label: LAYER_LABELS[key], gloss: LAYER_GLOSSES[key], ...layerMap.get(key)! }));
  const nestedCount = commitmentsNaming.filter((c) => parentOf.has(c.id)).length;

  // --- The lattice: placement comes from the model, details from the rows ---
  const grid = (id: string) => commitmentById.get(id);
  const foldedParts = (pkg: FinancialCommitment, present: Set<string>): CapitalRowView[] =>
    commitmentsNaming
      .filter((c) => !present.has(c.id) && c.relationships.some((r) => r.relationship === "part_of" && r.commitmentId === pkg.id))
      .map((c) => rowView(c, ctx, { parts: [], asPart: true, withNotes: false }));
  const capitalCard = (id: string, present: Set<string>): CapitalRowView | null => {
    const c = grid(id);
    return c ? rowView(c, ctx, { parts: foldedParts(c, present) }) : null;
  };
  const controlById = new Map(data.controls.map((m) => [m.id, m]));
  const designationById = new Map(data.designations.map((d) => [d.id, d]));
  const compact = <T,>(xs: (T | null | undefined)[]): T[] => xs.filter((x): x is T => x != null);

  const stages: StageBlock[] = lattice.stages.map((s) => {
    const v = cellView(lattice, material.id, s.id, NO_FILTER);
    const present = new Set(v ? [...v.commitments, ...v.options, ...v.ended].map((r) => r.id) : []);
    const capital = compact((v?.commitments ?? []).map((r) => capitalCard(r.id, present)));
    const options = compact((v?.options ?? []).map((r) => capitalCard(r.id, present)));
    const ended = compact((v?.ended ?? []).map((r) => capitalCard(r.id, present)));
    const controls = compact((v?.controls ?? []).map((r) => controlById.get(r.id))).map((m) => controlView(m, ctx, false));
    const designations = compact((v?.designations ?? []).map((r) => designationById.get(r.id))).map((d) => designationView(d, ctx, false));
    return {
      id: s.id,
      label: s.label,
      counts: v?.counts ?? { commitments: 0, controls: 0, designations: 0 },
      actors: v?.actors ?? { commitments: [], controls: [], designations: [] },
      capital,
      options,
      ended,
      controls,
      designations,
      empty: !capital.length && !options.length && !ended.length && !controls.length && !designations.length,
    };
  });

  const un = lattice.unstaged[material.id];
  const unstaged = {
    capital: compact((un?.commitments ?? []).map((id) => capitalCard(id, new Set(un?.commitments ?? [])))),
    controls: compact((un?.controls ?? []).map((id) => controlById.get(id))).map((m) => controlView(m, ctx, true)),
    designations: compact((un?.designations ?? []).map((id) => designationById.get(id))).map((d) => designationView(d, ctx, true)),
  };

  // --- Registry projects: named by the material, recognized by no designation naming it ---
  const designatedHere = new Set(rows.designations.map((d) => d.projectId));
  const registryProjects: RegistryProject[] = rows.projects
    .filter((p) => !designatedHere.has(p.id))
    .sort((a, b) => byCodePoint(a.id, b.id))
    .map((p) => ({
      id: p.id,
      href: `/projects/${p.id}`,
      name: p.name,
      locations: p.locations.map(locationText),
      sponsors: p.sponsorOrgIds.map(ctx.orgName),
      stages: [...new Set(p.stages)].map((s) => supplyChainStageLabels[s]),
      capitalRows: data.commitments.filter((c) => c.projectId === p.id).map((c) => ({ id: c.id, href: `/capital/${c.id}`, title: commitmentTitle(c) })),
      designatedElsewhere: [...new Set(data.designations.filter((d) => d.projectId === p.id).map((d) => ctx.programmeName(d.programmeId)))],
    }));

  // --- Controls block ---
  const controlsNaming = [...rows.controls].sort((a, b) => byCodePoint(a.id, b.id));
  const controls = controlsNaming.map((m) => controlView(m, ctx, false));

  // --- Events ---
  const events = [...rows.events].sort((a, b) => byCodePoint(b.date, a.date) || byCodePoint(a.id, b.id));
  const childCounts = (eventId: string): Counts => ({
    commitments: rows.commitments.filter((c) => c.eventId === eventId).length,
    controls: rows.controls.filter((m) => m.eventId === eventId).length,
    designations: rows.designations.filter((d) => d.eventId === eventId).length,
  });
  const eventRows: EventRow[] = events.map((e) => ({
    event: e,
    children: childCounts(e.id),
    supersededBy: e.supersededByEventId ? { id: e.supersededByEventId, title: eventById.get(e.supersededByEventId)?.titleEn ?? e.supersededByEventId } : null,
  }));

  // --- Related ---
  const rel = relatedIds(rows);
  const programmesList: RelatedItem[] = data.programmes
    .filter((p) => rel.programmes.has(p.id))
    .map((p) => ({ id: p.id, href: `/programmes/${p.id}`, name: p.name }))
    .sort((a, b) => byCodePoint(a.name, b.name));
  const organizationsList: RelatedItem[] = data.organizations
    .filter((o) => rel.organizations.has(o.id))
    .map((o) => ({ id: o.id, href: `/organizations/${o.id}`, name: o.name }))
    .sort((a, b) => byCodePoint(a.name, b.name));
  const sources = sourcesCitedByMaterial(material.id, data);
  const eventIdSet = new Set(events.map((e) => e.id));
  const legalIds = [...new Set(controlsNaming.flatMap((m) => m.legalBasisEventIds))].sort(byCodePoint);
  const legalBasis = legalIds.map((id) => {
    const e = eventById.get(id);
    return { id, href: `/events/${id}`, name: e?.titleEn ?? id, date: e?.date ?? "", clauses: controlsNaming.filter((m) => m.legalBasisEventIds.includes(id)).length, inMaterialEvents: eventIdSet.has(id) };
  });

  // --- Stats: counts only, never added across kinds ---
  const capitalRowsN = commitmentsNaming.filter((c) => COMMITMENT_FAMILY.includes(layerOf(c))).length;
  const partsN = commitmentsNaming.filter((c) => COMMITMENT_FAMILY.includes(layerOf(c)) && c.relationships.some((r) => r.relationship === "part_of")).length;
  const stats: Stat[] = [
    { key: "events", label: "Events", value: events.length, basis: "by event date" },
    { key: "clauses", label: "Control clauses", value: rows.controls.length, basis: `status on ${formatDate(asOf)}` },
    { key: "capital", label: "Capital rows", value: capitalRowsN, basis: "a count of rows, not of money", sublabel: `${partsN} of them ${partsN === 1 ? "is a part" : "are parts"} of a package` },
    { key: "designations", label: "Designations", value: rows.designations.length, basis: "standing, not money" },
    {
      key: "projects",
      label: "Projects",
      value: rows.projects.length,
      basis: "registry records",
      sublabel: `${registryProjects.length} with no designation`,
    },
  ];
  for (const key of LAYER_KEYS) {
    if (COMMITMENT_FAMILY.includes(key)) continue;
    const n = commitmentsNaming.filter((c) => layerOf(c) === key).length;
    if (n) stats.push({ key: `layer:${key}`, label: LAYER_LABELS[key], value: n, basis: "listed apart from capital rows" });
  }
  stats.push(
    { key: "programmes", label: "Programmes", value: programmesList.length, basis: "named by these rows" },
    { key: "organizations", label: "Organizations", value: organizationsList.length, basis: "named by these rows" },
    { key: "sources", label: "Sources", value: sources.length, basis: "cited by these records" },
  );

  // --- Header, notes, group note ---
  const oldest = [...events].sort((a, b) => byCodePoint(a.date, b.date) || byCodePoint(a.id, b.id))[0];
  const newestEvent = events[0];
  const lede = oldest && newestEvent
    ? `Records coded to ${material.nameEn}, from ${oldest.titleEn} (${formatDate(oldest.date)}) to the latest event on ${formatDate(newestEvent.date)}. Shared stage codes are not findings.`
    : `Records coded to ${material.nameEn}. Shared stage codes are not findings.`;
  const noteFields: { field: NoteField; label: string }[] = [
    { field: "statusSummary", label: "Status summary" },
    { field: "chinaPositionNote", label: "China's position" },
    { field: "diversificationNote", label: "Diversification" },
  ];
  const noteBlocks = noteFields.flatMap(({ field, label }) => {
    const text = renderableNote(material.slug, field, ledger, data.materials);
    return text === null ? [] : [{ field, label, text }];
  });
  const groupNote: DossierPayload["groupNote"] =
    material.grouping === "rare earth elements"
      ? material.slug === "rare-earth-elements"
        ? { text: "This dossier lists the rows that name the rare-earth group as a whole. A row that names only one element is on that element's dossier, and a row can name both.", href: null, linkText: null }
        : { text: `Some records name the rare-earth group as a whole rather than ${material.nameEn}. They are on the rare-earth dossier and are not repeated here.`, href: "/materials/rare-earth-elements", linkText: "Open the rare earth elements dossier" }
      : null;

  return {
    slug: material.slug,
    id: material.id,
    nameEn: material.nameEn,
    nameZh: material.nameZh ?? null,
    symbol: getMaterialMeta(material.id).symbol,
    asOf,
    lede,
    metaDescription: noteBlocks.find((n) => n.field === "statusSummary")?.text ?? lede,
    groupNote,
    stats,
    stages,
    unstaged,
    registryProjects,
    money: { layers: layerBlocks, topLevel: topLevelRows.length, nested: nestedCount, total: commitmentsNaming.length },
    controls,
    timeline: buildTimeline(events, rows, asOf),
    actorStatuses: statusByActor(events),
    events: eventRows,
    related: { programmes: programmesList, organizations: organizationsList, sources, legalBasis },
    notes: { fields: noteBlocks, downstream: material.downstreamIndustries },
    links: { capital: `/capital?material=${material.id}`, controls: `/controls?material=${material.id}` },
  };
}
