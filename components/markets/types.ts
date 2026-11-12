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
 * Six categorical inks for the light plate: graphite, malachite, hematite, lapis, ochre and plum. Each is at
 * least 3.6:1 against the plate (#fdfdfb) and the page (#f6f5f1), and every pair stays apart under protan,
 * deutan and tritan simulation (worst pair ΔE 8.6, OKLab ×100) and in normal vision (worst pair ΔE 15.0),
 * checked with the dataviz palette validator over all pairs. Graphite and malachite are the design system's
 * own inks, so they sit below the validator's chroma band on purpose. Slots 3–5 are dashed, so the six are
 * told apart by stroke as well as hue. A series keeps its slot, so a saved URL keeps its line styles; further
 * slots reuse the same inks with other dash patterns instead of inventing unreviewed colours.
 */
const PALETTE: readonly SeriesStyle[] = [
  { color: "#1b1e21", dash: undefined },
  { color: "#1e6353", dash: undefined },
  { color: "#9a3324", dash: undefined },
  { color: "#4a7fd0", dash: "7 4" },
  { color: "#a27017", dash: "7 4" },
  { color: "#8b4491", dash: "7 4" },
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
