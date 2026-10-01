/**
 * The model behind the /interplay chronology: which dated status changes are
 * plotted, how each reads in words, how same-bucket marks are laid out, and how
 * the text list groups them. The chart and the list both read from here, so the
 * picture and its text equivalent cannot drift apart.
 */
import { controlStatusLabels, financialStatusLabels } from "@/lib/labels";
import { instrumentChronology } from "@/lib/capital-control";
import type { InstrumentMark } from "@/lib/capital-control";
import { JURISDICTIONS } from "@/lib/types";
import type { JurisdictionCode } from "@/lib/types";

export const CHRONOLOGY_FROM = "2022-07-01";
export const CHRONOLOGY_TO = "2027-01-01";
/** Chart geometry shared with the layout: viewBox width and the left label gutter. */
export const CHRONOLOGY_W = 1000;
export const CHRONOLOGY_LABEL = 132;

/** Marks that share an actor, kind and month fan out in a grid so none hides another. */
export const CHRONOLOGY_COLS = 6;
export const CHRONOLOGY_COL_STEP = 5;

const dayNum = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;

/** Linear date to chart-x scale. */
export function chronologyX(from = CHRONOLOGY_FROM, to = CHRONOLOGY_TO) {
  const a = dayNum(from);
  const b = dayNum(to);
  const x0 = CHRONOLOGY_LABEL + 10;
  const x1 = CHRONOLOGY_W - 14;
  return (iso: string) => x0 + ((dayNum(iso) - a) / (b - a)) * (x1 - x0);
}

/** The status changes the chronology chart plots; the text list covers exactly these. */
export function plottedMarks(from = CHRONOLOGY_FROM, to = CHRONOLOGY_TO): InstrumentMark[] {
  return instrumentChronology().filter((m) => m.date >= from && m.date <= to);
}

/** A mark's status in words, so a funding option or indication never reads as committed money. */
export function markStatusText(m: InstrumentMark): string {
  if (m.kind === "control") return controlStatusLabels[m.status as never];
  const s = String(financialStatusLabels[m.status as never]).toLowerCase();
  if (m.valueRole === "funding_option") return `funding option; agreement ${s}, not committed money`;
  if (m.valueRole === "indication") return `non-binding indication; ${s}, not a commitment`;
  return financialStatusLabels[m.status as never];
}

export type PlacedMark = InstrumentMark & {
  /** Index within its actor, kind and month bucket. */
  n: number;
  /** Size of that bucket. */
  count: number;
  col: number;
  row: number;
  /** Horizontal offset from the date's x, centred so the bucket averages on its date. */
  dx: number;
};

export function placeMarks(marks: InstrumentMark[]): PlacedMark[] {
  const key = (m: InstrumentMark) => `${m.jurisdiction}|${m.kind}|${m.date.slice(0, 7)}`;
  const size = new Map<string, number>();
  for (const m of marks) size.set(key(m), (size.get(key(m)) ?? 0) + 1);
  const seen = new Map<string, number>();
  return marks.map((m) => {
    const k = key(m);
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    const count = size.get(k) ?? 1;
    const col = n % CHRONOLOGY_COLS;
    const cols = Math.min(count, CHRONOLOGY_COLS);
    return { ...m, n, count, col, row: Math.floor(n / CHRONOLOGY_COLS), dx: (col - (cols - 1) / 2) * CHRONOLOGY_COL_STEP };
  });
}

export type ChronologyLane = {
  jurisdiction: JurisdictionCode;
  changes: number;
  /** One entry per distinct record: its dated status history, oldest first. */
  records: Record<InstrumentMark["kind"], InstrumentMark[][]>;
};

/** Plotted changes grouped by actor, then kind, then record (records ordered by first change). */
export function chronologyLanes(marks: InstrumentMark[]): ChronologyLane[] {
  return JURISDICTIONS.filter((j) => marks.some((m) => m.jurisdiction === j)).map((jurisdiction) => {
    const mine = marks.filter((m) => m.jurisdiction === jurisdiction);
    const group = (kind: InstrumentMark["kind"]) => {
      const byId = new Map<string, InstrumentMark[]>();
      for (const m of mine) if (m.kind === kind) byId.set(m.id, [...(byId.get(m.id) ?? []), m]);
      return [...byId.values()];
    };
    return { jurisdiction, changes: mine.length, records: { capital: group("capital"), control: group("control") } };
  });
}
