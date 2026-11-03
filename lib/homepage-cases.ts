/**
 * The three research uses the homepage demonstrates. Each case names records by id only; every title, date,
 * status and amount shown comes from the seed through the public loaders, statuses are read as of
 * `site.lastUpdated`, and a case whose record or source is missing is dropped rather than shown incomplete.
 * Nothing here sums, converts or ranks money.
 */
import {
  getControlMeasureById,
  getEventById,
  getFinancialCommitmentById,
  getJurisdictionById,
  getMaterialsByIds,
  getProjectById,
  getProjectDesignationById,
  getSourceById,
} from "./data";
import { controlStatusOn, financialStatusEntryOn } from "./capital-control";
import { CONTROL_STATUS_DEFS, FINANCIAL_STATUS_DEFS } from "./capital-vocabulary";
import { explainFinancialRecord } from "./financial-reading";
import { amountView } from "./lattice";
import {
  controlStatusLabels,
  designationStatusLabels,
  financialInstrumentLabels,
  financialStatusLabels,
  supplyChainStageLabels,
} from "./labels";
import { site } from "./site";
import type { ControlMeasure, FinancialCommitment, ProjectDesignation, SupplyChainStage } from "./types";

const stageList = (stages: readonly SupplyChainStage[]) => stages.map((s) => supplyChainStageLabels[s]);

/**
 * A commitment's status and payment wording as of `asOf`, not its latest entry: the history is cut at the
 * last entry evidenced by that date, so an entry added after the revision cannot appear under its date.
 * Null when nothing is evidenced by then.
 */
export function financialReadingOn(c: FinancialCommitment, asOf: string) {
  const entry = financialStatusEntryOn(c, asOf);
  if (!entry) return null;
  const history = c.financialStatusHistory.slice(0, c.financialStatusHistory.indexOf(entry) + 1);
  return {
    key: entry.status,
    label: financialStatusLabels[entry.status],
    definition: FINANCIAL_STATUS_DEFS[entry.status],
    payment: explainFinancialRecord({ ...c, financialStatusHistory: history }).payment,
  };
}

/** A designation's status as of `asOf`: the last dated entry on or before it. */
export function designationStatusOn(d: ProjectDesignation, asOf: string) {
  return d.statusHistory.filter((e) => e.date !== null && e.date <= asOf).at(-1)?.status ?? null;
}

function controlStatus(m: ControlMeasure) {
  const status = controlStatusOn(m, site.lastUpdated);
  if (!status) return null;
  const entry = [...m.statusHistory].reverse().find((e) => e.status === status) ?? null;
  return { label: controlStatusLabels[status], definition: CONTROL_STATUS_DEFS[status], from: entry?.date ?? null, until: entry?.until ?? null };
}

/** Case A: one operative clause traced from the measure to its materials and the issuing document, and a later measure that is paused. */
export function getLegalControlCase() {
  const event = getEventById("china-rare-earth-controls-2025-04");
  const control = getControlMeasureById("ctl-cn-ree-2025-04-export-licensing");
  const source = getSourceById("src-mofcom-18");
  const later = getEventById("china-rare-earth-expansion-2025-10");
  const laterControl = getControlMeasureById("ctl-cn-ree-2025-10-foreign-direct-product-licensing");
  const suspension = getEventById("china-rare-earth-suspension-2025-11");
  if (!event || !control || !source || !later || !laterControl || !suspension) return null;
  const status = controlStatus(control);
  const laterStatus = controlStatus(laterControl);
  if (!status || !laterStatus) return null;
  return {
    event,
    control,
    status,
    stages: stageList(control.controlledStages),
    materials: getMaterialsByIds(control.materialIds),
    source,
    later: { event: later, control: laterControl, status: laterStatus, suspension },
  };
}

const FINANCING_ROWS = [
  "fin-au-alcoa-sojitz-gallium-2025-equity",
  "fin-us-exim-perpetua-stibnite-2026",
  "fin-us-dod-perpetua-stibnite-dpa",
] as const;

/** Case B: three rows at three different points between announcement and payment, each with its own status and wording. */
export function getFinancingCase() {
  return FINANCING_ROWS.flatMap((id) => {
    const c = getFinancialCommitmentById(id);
    const project = c?.projectId ? getProjectById(c.projectId) : undefined;
    const event = c ? getEventById(c.eventId) : undefined;
    const reading = c ? financialReadingOn(c, site.lastUpdated) : null;
    if (!c || !project || !event || !c.amount || !reading) return [];
    return [
      {
        commitment: c,
        project,
        provider: c.provider,
        instrument: financialInstrumentLabels[c.instrument],
        amount: amountView(c)!,
        status: { key: reading.key, label: reading.label, definition: reading.definition },
        /** What the status does and does not establish about payment, from the shared reader interpretation. */
        payment: reading.payment,
      },
    ];
  });
}

type TungstenEntry = {
  id: string;
  lever: string;
  jurisdiction: string;
  date: string;
  title: string;
  href: string;
  stages: string[];
  status: string;
  detail: { project: { id: string; name: string } | null; amount: ReturnType<typeof amountView> | null };
};

/**
 * Case C: tungsten records from several governments, ordered by the supply-chain stage they concern (upstream
 * first) and then by date. The order is for reading only; it does not compare or rank the measures.
 */
export function getTungstenCase(): TungstenEntry[] {
  const entries: TungstenEntry[] = [];
  const jurisdictionName = (code: string) => getJurisdictionById(code)?.name ?? null;

  const designation = getProjectDesignationById("dsg-eu-crma-tungsten-west");
  const dsgEvent = designation ? getEventById(designation.eventId) : undefined;
  const dsgProject = designation ? getProjectById(designation.projectId) : undefined;
  const dsgStatus = designation ? designationStatusOn(designation, site.lastUpdated) : null;
  if (designation && dsgEvent && dsgProject && dsgStatus && jurisdictionName(dsgEvent.jurisdiction))
    entries.push({
      id: designation.id,
      lever: "Strategic-project designation",
      jurisdiction: jurisdictionName(dsgEvent.jurisdiction)!,
      date: dsgEvent.date,
      title: dsgEvent.titleEn,
      href: `/events/${dsgEvent.id}`,
      stages: stageList(designation.stages),
      status: designationStatusLabels[dsgStatus],
      detail: { project: { id: dsgProject.id, name: dsgProject.name }, amount: null },
    });

  const finance = [
    { finId: "fin-uk-nwf-2026-tungsten-west-package", lever: "Public investment package" },
    { finId: "fin-jp-jogmec-almt-tungsten-grant", lever: "Grant under a certified supply plan" },
  ];
  for (const { finId, lever } of finance) {
    const c = getFinancialCommitmentById(finId);
    const event = c ? getEventById(c.eventId) : undefined;
    const project = c?.projectId ? getProjectById(c.projectId) : undefined;
    const reading = c ? financialReadingOn(c, site.lastUpdated) : null;
    if (!c || !event || !project || !reading || !jurisdictionName(event.jurisdiction)) continue;
    entries.push({
      id: c.id,
      lever,
      jurisdiction: jurisdictionName(event.jurisdiction)!,
      date: event.date,
      title: event.titleEn,
      href: `/capital/${c.id}`,
      stages: stageList(project.stages),
      status: reading.label,
      detail: { project: { id: project.id, name: project.name }, amount: amountView(c) },
    });
  }

  const control = getControlMeasureById("ctl-cn-tungsten-2025-export-licensing");
  const ctlEvent = control ? getEventById(control.eventId) : undefined;
  const ctlStatus = control ? controlStatus(control) : null;
  if (control && ctlEvent && ctlStatus && jurisdictionName(ctlEvent.jurisdiction))
    entries.push({
      id: control.id,
      lever: "Export licensing",
      jurisdiction: jurisdictionName(ctlEvent.jurisdiction)!,
      date: ctlEvent.date,
      title: ctlEvent.titleEn,
      href: `/controls/${control.id}`,
      stages: stageList(control.controlledStages),
      status: ctlStatus.label,
      detail: { project: null, amount: null },
    });

  return entries;
}
