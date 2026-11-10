import type { Frequency, Observation, PriceType, SourceBreak } from "@/lib/markets";

/** Plain, serialisable series data the server page hands to the client explorer. */
export interface MonitorSeries {
  id: string;
  datasetId: string;
  /** Short publisher name for labels, e.g. "World Bank Pink Sheet". */
  sourceShortName: string;
  frequency: Frequency;
  priceType: PriceType;
  materialId: string;
  materialName: string;
  materialHref: string | null;
  /** Other materials priced jointly by this series (NdPr oxide → praseodymium). */
  relatedMaterialNames: string[];
  label: string;
  benchmark: string;
  unit: string;
  unitShort: string;
  currency: string;
  priceBasis: string;
  aggregation: string;
  firstPeriod: string;
  lastPeriod: string;
  sourceBreaks: SourceBreak[];
  /** Number of decimals the source publishes, for display. */
  digits: number;
  obs: Observation[];
}

export interface SeriesStyle {
  color: string;
  dash: string | undefined;
}

/**
 * Six contrast-tested categorical hues. Initial slots retain their existing
 * styling, so saved URLs keep the same colors. Further slots reuse those hues
 * with distinctive dash patterns instead of inventing unreviewed colors.
 */
const PALETTE: readonly SeriesStyle[] = [
  { color: "#3987e5", dash: undefined },
  { color: "#d95926", dash: undefined },
  { color: "#199e70", dash: undefined },
  { color: "#c98500", dash: "7 4" },
  { color: "#d55181", dash: "7 4" },
  { color: "#008300", dash: "7 4" },
];

/** Extra stroke patterns distinguish the same tested hue used by later slots. */
const EXTRA_DASHES = ["2 4", "11 3 2 3", "1 5", "13 4 3 4", "4 2 1 2"] as const;

/** An existing series keeps its style as other series are added or removed. */
export function slotStyle(slot: number): SeriesStyle {
  if (!Number.isInteger(slot) || slot < 0) return { color: "var(--muted)", dash: "2 3" };
  const base = PALETTE[slot % PALETTE.length];
  if (slot < PALETTE.length) return base;
  return {
    color: base.color,
    dash: EXTRA_DASHES[(Math.floor(slot / PALETTE.length) - 1) % EXTRA_DASHES.length],
  };
}

export const PALETTE_HEX = PALETTE.map((p) => p.color);

/** Tile shorthand for the market-only element selector, including an REE group and graphite. */
export const MARKET_SYMBOLS: Record<string, string> = {
  aluminium: "Al", antimony: "Sb", boron: "B", cobalt: "Co", copper: "Cu",
  dysprosium: "Dy", gallium: "Ga", germanium: "Ge", graphite: "C", lead: "Pb",
  lithium: "Li", neodymium: "Nd", nickel: "Ni", niobium: "Nb", palladium: "Pd",
  platinum: "Pt", "rare-earth-elements": "REE", tantalum: "Ta", terbium: "Tb",
  tin: "Sn", tungsten: "W", zinc: "Zn",
};
