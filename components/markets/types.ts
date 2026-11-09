import type { Observation } from "@/lib/markets";

/** Plain, serialisable series data the server page hands to the client monitor. */
export interface MonitorSeries {
  id: string;
  materialId: string;
  materialName: string;
  materialHref: string | null;
  label: string;
  benchmark: string;
  unit: string;
  currency: string;
  priceBasis: string;
  aggregation: string;
  firstPeriod: string;
  lastPeriod: string;
  obs: Observation[];
}

export interface SeriesStyle {
  color: string;
  dash: string | undefined;
}

/**
 * Colour follows the entity, never its rank or the current filter. Each line
 * also carries a direct label, and nickel is dashed, so identity never rests
 * on colour alone.
 */
const STYLES: Record<string, SeriesStyle> = {
  "wb-aluminum": { color: "var(--mark-designation)", dash: undefined },
  "wb-copper": { color: "var(--accent)", dash: undefined },
  "wb-nickel": { color: "var(--mark-control)", dash: "6 4" },
};

const FALLBACK: SeriesStyle = { color: "var(--muted)", dash: "2 3" };

export function seriesStyle(id: string): SeriesStyle {
  return STYLES[id] ?? FALLBACK;
}
