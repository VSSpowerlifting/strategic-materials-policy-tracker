import { controlBriefHref, type ControlBriefCase } from "./control-brief-cases";
import { buildFeedDatasets, type FeedMeasure, type FeedSource, type FeedStatusEntry } from "./controls-feed";
import { readControlsArchive } from "./controls-release-archive";
import { isIsoDate } from "./controls-review-overlay";
import { standing, type Standing } from "./controls-standing";
import { formatDate } from "./format";
import {
  controlDirectionLabels,
  controlMeasureTypeLabels,
  controlStatusLabels,
  jurisdictionLabels,
  productCodeRoleLabels,
  targetScopeLabels,
} from "./labels";
import { site } from "./site";
import type {
  ControlDirection,
  ControlMeasureType,
  ControlStatus,
  JurisdictionCode,
  ProductCode,
  TargetScope,
} from "./types";

const releases = new Map<string, ReturnType<typeof loadRelease>>();

function loadRelease(date: string) {
  const { manifest, rows, contents } = readControlsArchive(date);
  // Normalize the verified public archive without a review overlay or a candidate release.
  const datasets = buildFeedDatasets({ manifest, rows, contents });
  return { manifest, datasets };
}

function publicRelease(date: string) {
  const existing = releases.get(date);
  if (existing) return existing;
  const release = loadRelease(date);
  releases.set(date, release);
  return release;
}

export type BriefDates = { from: string; to: string };
type DateInput = { from?: string | string[]; to?: string | string[] };

export const comparisonMethod = "Each comparison date uses status sources published by that day and preserved in this release. The comparison uses calendar days and reflects the archive’s later editorial curation.";
export const briefUse = "Research reference. Transaction applicability requires case-specific verification. Commercial integration and redistribution require separate permission.";

function resolveDates(input: DateInput, item: ControlBriefCase, firstDate: string, cutoff: string) {
  const { from = item.defaultDates.from, to = item.defaultDates.to } = input;
  if (!isIsoDate(from) || !isIsoDate(to) || from < firstDate || to > cutoff || from >= to) return null;
  return { from, to };
}

export function briefQuery({ from, to }: BriefDates) {
  return new URLSearchParams({ from, to }).toString();
}

const labelForStatus = (status: string) => controlStatusLabels[status as ControlStatus] ?? status;

export function standingLabel(state: Standing) {
  if (state.basis === "undated_only") return "Start unresolved";
  if (state.state === "not_recorded") return "No recorded standing";
  if (state.state === "unresolved") return "Standing unresolved";
  return labelForStatus(state.state);
}

export function statusDates(entry: Pick<FeedStatusEntry, "effectiveFrom" | "effectiveThrough" | "takesEffectOn">) {
  if (entry.effectiveFrom && entry.effectiveThrough) {
    return `${formatDate(entry.effectiveFrom)} through ${formatDate(entry.effectiveThrough)}`;
  }
  if (entry.effectiveThrough) return `Start undetermined. Stated end ${formatDate(entry.effectiveThrough)}`;
  if (entry.takesEffectOn) return `Stated start ${formatDate(entry.takesEffectOn)}`;
  if (entry.effectiveFrom) return `From ${formatDate(entry.effectiveFrom)}`;
  return "Effective date undetermined";
}

function describeScope(measure: FeedMeasure) {
  const direction = controlDirectionLabels[measure.direction as ControlDirection];
  const target = measure.targetJurisdictions.length
    ? measure.targetJurisdictions.map((id) => jurisdictionLabels[id as JurisdictionCode]).join(", ")
    : measure.targetScopes.map((id) => targetScopeLabels[id as TargetScope]).join(", ");
  return { direction, target: target || "Target not coded" };
}

export function buildControlBrief(item: ControlBriefCase, input: DateInput = {}) {
  const { manifest, datasets } = publicRelease(item.release);
  const cutoff = manifest.asOf;
  const instrument = datasets["instruments.json"].find((row) =>
    row.instrumentId === item.instrumentId && row.reviewState === "published");
  if (!instrument) throw new Error(`Missing published instrument for ${item.slug}`);
  const dates = resolveDates(input, item, instrument.eventDate, cutoff);
  if (!dates) return { valid: false as const, firstDate: instrument.eventDate, cutoff };
  const feed = { datasets, legalStatusCutoff: cutoff };
  const measures = datasets["measures.json"].filter((row) =>
    row.instrumentId === instrument.instrumentId && row.reviewState === "published");
  if (!measures.length) throw new Error(`Missing published clauses for ${item.slug}`);

  const sourceById = new Map(datasets["sources.json"].filter((s) =>
    s.reviewState === "published" && s.sourceType === "official").map((s) => [s.sourceId, s]));
  const entries = new Map<string, FeedStatusEntry>();
  const sources = new Map<string, FeedSource & { documentNumber: string | null }>();
  const timeline = new Map<string, { key: string; status: string; statement: string; sourceId: string; clauses: string[] }>();
  const rows = measures.map((measure) => {
    const id = measure.measureId;
    const history = datasets["status-entries.json"].filter((row) => row.measureId === id && row.reviewState === "published");
    for (const entry of history) {
      const source = sourceById.get(entry.sourceId);
      if (!source) throw new Error(`Missing official status source for ${entry.entryId}`);
      // An instrument's primary citation can identify the notice. Shared citations alone do not identify an event.
      const event = datasets["instruments.json"].find((row) =>
        row.reviewState === "published" && row.sourceIds[0] === source.sourceId);
      sources.set(source.sourceId, {
        ...source,
        documentNumber: event?.documentNumber ?? null,
      });
      entries.set(entry.entryId, entry);
      const key = [entry.effectiveFrom, entry.status, entry.effectiveThrough, entry.takesEffectOn, entry.sourceId].join("|");
      const eventLabel = entry.status === "not_stated" ? "Start unresolved" : labelForStatus(entry.status);
      const existing = timeline.get(key);
      const statement = statusDates(entry);
      if (existing) existing.clauses.push(measure.clauseLabel ?? id);
      else timeline.set(key, { key, status: eventLabel, statement, sourceId: source.sourceId, clauses: [measure.clauseLabel ?? id] });
    }

    const before = standing(feed, id, dates.from, { vintage: dates.from });
    const after = standing(feed, id, dates.to, { vintage: dates.to });
    const statusSources = new Set(history.map((h) => h.sourceId));
    const evidence = datasets["evidence.json"].filter((row) => row.measureId === id
      && statusSources.has(row.sourceId) && row.reviewState === "published");
    return {
      id,
      clause: measure.clauseLabel ?? controlMeasureTypeLabels[measure.measureType as ControlMeasureType],
      type: controlMeasureTypeLabels[measure.measureType as ControlMeasureType],
      ...describeScope(measure),
      materialIds: measure.materialIds,
      codes: measure.productCodes.map(({ code, role }) => `${code} (${productCodeRoleLabels[role as ProductCode["role"]].toLowerCase()})`),
      before,
      after,
      evidence,
    };
  }).sort((a, b) => a.clause.localeCompare(b.clause, "en", { numeric: true, ignorePunctuation: true }));

  const summary = new Map<string, { before: Standing; after: Standing; count: number }>();
  for (const { before, after } of rows) {
    // Entry IDs identify individual clauses. Group identical readings across clauses by their source and date window.
    const keyFor = (state: Standing) => {
      const entry = state.entryId ? entries.get(state.entryId) : undefined;
      return [state.state, state.basis, state.sourceId, entry?.effectiveFrom, entry?.effectiveThrough, entry?.takesEffectOn, entry?.evidenceLevel].join("|");
    };
    const key = `${keyFor(before)} -> ${keyFor(after)}`;
    const group = summary.get(key);
    if (group) group.count += 1;
    else summary.set(key, { before, after, count: 1 });
  }
  return {
    valid: true as const,
    item,
    dates,
    firstDate: instrument.eventDate,
    cutoff,
    manifest,
    rows,
    entries,
    sources,
    timeline: [...timeline].sort(([a], [b]) => {
      const [aDate] = a.split("|");
      const [bDate] = b.split("|");
      return (aDate || "9999").localeCompare(bDate || "9999");
    }).map(([, row]) => ({ ...row, clauses: row.clauses.sort((a, b) => a.localeCompare(b, "en", { numeric: true })) })),
    summary: [...summary.values()].sort((a, b) => b.count - a.count),
    statusChanges: rows.filter((row) => row.before.state !== row.after.state).length,
    sourceChanges: rows.filter((row) => row.before.sourceId !== row.after.sourceId).length,
  };
}

export type ControlBrief = Extract<ReturnType<typeof buildControlBrief>, { valid: true }>;

export function changeSummary(brief: ControlBrief) {
  const { rows, statusChanges, sourceChanges } = brief;
  const standing = statusChanges === 0
    ? `All ${rows.length} clauses kept the same recorded standing.`
    : `Recorded standing changed for ${statusChanges} of ${rows.length} clauses.`;
  const source = sourceChanges === 0
    ? "The supporting notices stayed the same."
    : `The supporting notice changed for ${sourceChanges === 1 ? "1 clause" : `${sourceChanges} clauses`}.`;
  return `${standing} ${source}`;
}

export function renderControlBrief(brief: ControlBrief) {
  const { item, dates, cutoff, manifest, entries, sources } = brief;
  const describeState = (state: Standing) => {
    const entry = state.entryId ? entries.get(state.entryId) : undefined;
    return [standingLabel(state), entry && statusDates(entry), entry?.evidenceLevel, state.sourceId, state.entryId]
      .filter(Boolean).join(" | ");
  };
  return [
    `Stratellar | Controls change brief`,
    `${item.title} — ${item.instrumentLabel}`,
    `Comparison dates: ${dates.from} to ${dates.to}`,
    `Instrument: ${item.instrumentId} | Event date: ${brief.firstDate}`,
    `Evidence cutoff and archived snapshot: ${cutoff}`,
    `Source corpus version: ${manifest.sourceDatasetVersion}`,
    `Controls snapshot version: ${manifest.datasetVersion}`,
    `Reproduce: ${site.url}${controlBriefHref(item)}?${briefQuery(dates)}`,
    "",
    changeSummary(brief),
    comparisonMethod,
    "",
    "Scope",
    item.scope,
    "",
    "Clause comparison",
    "Each clause also lists citations from the full archived record.",
    "",
    ...brief.rows.flatMap((row) => [
      `${row.clause} | ${row.type} | ${row.direction} | ${row.target}`,
      `Clause record: ${row.id} | ${site.url}/controls/${row.id}`,
      ...(row.materialIds.length ? [`Material IDs: ${row.materialIds.join(", ")}`] : []),
      ...(row.codes.length ? [`Product codes: ${row.codes.join(", ")}`] : []),
      `  ${dates.from}  ${describeState(row.before)}`,
      `  ${dates.to}  ${describeState(row.after)}`,
      ...row.evidence.filter((ref) => ref.locator).map((ref) =>
        `  ${ref.sourceId} | ${ref.locator} | ${ref.supports.join(", ")} | ${ref.evidenceLevel}`),
      "",
    ]),
    "Instrument history in this release (includes entries after the selected dates)",
    ...brief.timeline.map((row) => `${row.status} | ${row.statement} | ${row.clauses.join(", ")} | ${row.sourceId}`),
    "",
    "Primary sources",
    ...[...sources.values()].flatMap((source) => [
      `${source.sourceId} | ${source.documentNumber ?? source.publisher}`,
      `  Published: ${source.datePublished ?? "undated"} | Archived source access: ${source.dateAccessed}`,
      `  ${source.url}`,
    ]),
    "",
    "For further investigation",
    ...item.reviewQuestions.map((question) => `- ${question}`),
    "",
    briefUse,
    "",
  ].join("\n");
}
