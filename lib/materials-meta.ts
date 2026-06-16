/**
 * Presentation-only metadata for the material element tiles — NOT dataset
 * content. Maps each material id to a periodic-style symbol, an atomic number
 * where one applies, and an "oxide" accent hue derived from real
 * rare-earth / mineral colours and desaturated for the graphite base. Used for
 * thin accents and glows only; never as a large fill, never for text contrast.
 */
export type MaterialMeta = {
  symbol: string;
  atomicNumber?: number;
  /** Oxide accent hue (hex). */
  hue: string;
};

const META: Record<string, MaterialMeta> = {
  "rare-earth-elements": { symbol: "REE", hue: "#4FB59E" },
  dysprosium: { symbol: "Dy", atomicNumber: 66, hue: "#C9CBD0" },
  terbium: { symbol: "Tb", atomicNumber: 65, hue: "#BFA94E" },
  neodymium: { symbol: "Nd", atomicNumber: 60, hue: "#8E74B5" },
  praseodymium: { symbol: "Pr", atomicNumber: 59, hue: "#79A86A" },
  gallium: { symbol: "Ga", atomicNumber: 31, hue: "#7FA6C4" },
  germanium: { symbol: "Ge", atomicNumber: 32, hue: "#9AA0A6" },
  graphite: { symbol: "C", atomicNumber: 6, hue: "#6E7378" },
  antimony: { symbol: "Sb", atomicNumber: 51, hue: "#8C9196" },
  tungsten: { symbol: "W", atomicNumber: 74, hue: "#B8702E" },
  "ndfeb-magnets": { symbol: "NdFeB", hue: "#6FB0A0" },
};

const FALLBACK: MaterialMeta = { symbol: "·", hue: "#4FB59E" };

export function getMaterialMeta(id: string): MaterialMeta {
  return META[id] ?? FALLBACK;
}
