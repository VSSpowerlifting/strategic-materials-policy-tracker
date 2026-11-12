/**
 * Presentation-only metadata for the material element tiles — NOT dataset
 * content. Maps each material id to a periodic-style symbol, an atomic number
 * where one applies, and an "oxide" accent hue derived from real
 * rare-earth / mineral colours, darkened for the plaster sheet (each at least
 * 3:1 on --bg). Used for thin rules and small marks only; never as a large fill
 * and never as a text colour.
 */
export type MaterialMeta = {
  symbol: string;
  atomicNumber?: number;
  /** Oxide accent hue (hex). */
  hue: string;
};

const META: Record<string, MaterialMeta> = {
  "rare-earth-elements": { symbol: "REE", hue: "#2a7a66" },
  dysprosium: { symbol: "Dy", atomicNumber: 66, hue: "#7a7f87" },
  terbium: { symbol: "Tb", atomicNumber: 65, hue: "#877618" },
  neodymium: { symbol: "Nd", atomicNumber: 60, hue: "#6f4f9e" },
  praseodymium: { symbol: "Pr", atomicNumber: 59, hue: "#4c7d3c" },
  gallium: { symbol: "Ga", atomicNumber: 31, hue: "#3b7096" },
  germanium: { symbol: "Ge", atomicNumber: 32, hue: "#69727a" },
  graphite: { symbol: "C", atomicNumber: 6, hue: "#44484c" },
  lithium: { symbol: "Li", atomicNumber: 3, hue: "#8566a8" },
  cobalt: { symbol: "Co", atomicNumber: 27, hue: "#3a5ca0" },
  nickel: { symbol: "Ni", atomicNumber: 28, hue: "#6c7850" },
  antimony: { symbol: "Sb", atomicNumber: 51, hue: "#5c646b" },
  tungsten: { symbol: "W", atomicNumber: 74, hue: "#a2581a" },
  "ndfeb-magnets": { symbol: "NdFeB", hue: "#35806f" },
};

const FALLBACK: MaterialMeta = { symbol: "·", hue: "#2a7a66" };

export function getMaterialMeta(id: string): MaterialMeta {
  return META[id] ?? FALLBACK;
}
