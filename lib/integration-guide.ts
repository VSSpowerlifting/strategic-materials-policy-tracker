/**
 * Data behind the integration guide at `/data/guide`. Every figure the guide
 * shows is read here from the seed loaders and the counting rules, so the
 * walkthrough cannot drift from the records it describes. Tests assert that
 * each named ID resolves.
 */
import {
  getAllControlMeasures,
  getAllSources,
  getControlMeasureById,
  getEventById,
  getFinancialCommitmentById,
  getSourceById,
} from "./data";
import { addDecimals, controlEntryOn, currentFinancialStatus, scheduledControlEntry, totalCommitments } from "./capital-control";
import { site } from "./site";

export const WALKTHROUGH = {
  eventId: "china-rare-earth-expansion-2025-10",
  measureId: "ctl-cn-ree-2025-10-de-minimis-licensing",
} as const;

export const FINANCING_EXAMPLE = {
  packageId: "fin-us-osc-vulcan-reelement-2025-joint-commitment",
  componentIds: [
    "fin-us-osc-vulcan-reelement-2025-vulcan-elements-loan",
    "fin-us-osc-vulcan-reelement-2025-reelement-loan",
  ],
  authorityId: "fin-us-osc-obbba-2025-lending-authority",
  bindingPeerId: "fin-us-dod-mp-2025-samarium-loan",
} as const;

function must<T>(value: T | undefined | null, what: string): T {
  if (value === undefined || value === null) throw new Error(`integration guide: ${what} not found`);
  return value;
}

export function walkthrough() {
  const event = must(getEventById(WALKTHROUGH.eventId), WALKTHROUGH.eventId);
  const measure = must(getControlMeasureById(WALKTHROUGH.measureId), WALKTHROUGH.measureId);
  const clauses = getAllControlMeasures().filter((m) => m.eventId === event.id);
  const entries = measure.statusHistory.map((e, sequence) => ({
    sequence,
    ...e,
    until: e.until ?? null,
    source: must(getSourceById(e.sourceId), e.sourceId),
    isCurrent: sequence === measure.statusHistory.length - 1,
  }));
  const asOf = site.legalStatusAsOf;
  const inEffect = controlEntryOn(measure, asOf);
  const scheduled = scheduledControlEntry(measure, asOf);
  const latest = entries[entries.length - 1];
  return { event, measure, clauses, entries, asOf, inEffect, scheduled, latest };
}

export function sourceDateGaps() {
  const sources = getAllSources();
  return { total: sources.length, withoutDatePublished: sources.filter((s) => !s.datePublished).length };
}

export function financingExample() {
  const pkg = must(getFinancialCommitmentById(FINANCING_EXAMPLE.packageId), FINANCING_EXAMPLE.packageId);
  const components = FINANCING_EXAMPLE.componentIds.map((id) => must(getFinancialCommitmentById(id), id));
  const authority = must(getFinancialCommitmentById(FINANCING_EXAMPLE.authorityId), FINANCING_EXAMPLE.authorityId);
  const peer = must(getFinancialCommitmentById(FINANCING_EXAMPLE.bindingPeerId), FINANCING_EXAMPLE.bindingPeerId);
  const family = [pkg, ...components];
  const naive = addDecimals(family.map((c) => must(c.amount, `${c.id} amount`).value));
  const counted = totalCommitments(family);
  const withPeer = totalCommitments([...family, peer]);
  const row = (c: typeof pkg) => ({
    id: c.id,
    valueRole: c.valueRole,
    instrument: c.instrument,
    amount: must(c.amount, `${c.id} amount`),
    status: currentFinancialStatus(c),
    relationships: c.relationships.map((r) => ({ relationship: r.relationship, commitmentId: r.commitmentId })),
  });
  return {
    rows: family.map(row),
    authority: row(authority),
    peer: row(peer),
    naive,
    counted,
    withPeer,
  };
}
