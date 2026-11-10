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

/** Most lines plotted at once. A seventh would need a generated hue, which breaks the palette. */
export const MAX_PLOTTED = 6;

/**
 * Categorical hues in fixed order, validated against the dark surface (#1a1814)
 * with the dataviz palette script: lightness band, chroma floor, adjacent-pair
 * CVD separation ≥ 8 ΔE and ≥ 3:1 contrast all pass. Slots 4–6 are also dashed,
 * and every line carries a direct label, so identity never rests on hue alone.
 */
const PALETTE: readonly SeriesStyle[] = [
  { color: "#3987e5", dash: undefined },
  { color: "#d95926", dash: undefined },
  { color: "#199e70", dash: undefined },
  { color: "#c98500", dash: "7 4" },
  { color: "#d55181", dash: "7 4" },
  { color: "#008300", dash: "7 4" },
];

/** Style for a colour slot. A slot is kept by a series for as long as it stays selected. */
export function slotStyle(slot: number): SeriesStyle {
  return PALETTE[slot] ?? { color: "var(--muted)", dash: "2 3" };
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
