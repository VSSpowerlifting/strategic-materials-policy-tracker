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
import { controlStatusOn, currentFinancialStatus } from "./capital-control";
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
import type { ControlMeasure, SupplyChainStage } from "./types";

const stageList = (stages: readonly SupplyChainStage[]) => stages.map((s) => supplyChainStageLabels[s]);

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
    if (!c || !project || !event || !c.amount) return [];
    const status = currentFinancialStatus(c);
    return [
      {
        commitment: c,
        project,
        provider: c.provider,
        instrument: financialInstrumentLabels[c.instrument],
        amount: amountView(c)!,
        status: { key: status, label: financialStatusLabels[status], definition: FINANCIAL_STATUS_DEFS[status] },
        /** What the status does and does not establish about payment, from the shared reader interpretation. */
        payment: explainFinancialRecord(c).payment,
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
  const dsgStatus = designation?.statusHistory.at(-1)?.status;
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
    if (!c || !event || !project || !jurisdictionName(event.jurisdiction)) continue;
    entries.push({
      id: c.id,
      lever,
      jurisdiction: jurisdictionName(event.jurisdiction)!,
      date: event.date,
      title: event.titleEn,
      href: `/capital/${c.id}`,
      stages: stageList(project.stages),
      status: financialStatusLabels[currentFinancialStatus(c)],
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
