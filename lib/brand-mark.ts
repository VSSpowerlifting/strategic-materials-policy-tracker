/**
 * Stratellar mark geometry: the "Marker Bed".
 *
 * Two identical bed sequences sit either side of a slanted fault. The right block is thrown up by one marker
 * pitch, so the thin marker bed (the accent) can be correlated across the break. This file is the single source
 * for the mark: the React component, the generated SVG masters, the icons and the social artwork all draw from
 * it (`components/ui/brand.tsx`, `scripts/brand/build-brand-assets.mjs`). Change the numbers here and rebuild.
 */

export type MarkRole = "bed" | "marker";
export type MarkShape = { d: string; role: MarkRole };
export type MarkGeometry = { width: number; height: number; shapes: MarkShape[] };

type MarkSpec = {
  /** Overall width in mark units. */
  width: number;
  /** Bed thicknesses, top to bottom, the same on both sides of the fault. */
  beds: number[];
  /** Index of the marker bed. */
  marker: number;
  /** Space between beds. */
  gap: number;
  /** Vertical throw: how far the right block sits above the left. */
  throw: number;
  /** Width of the fault gap. */
  fault: number;
  /** Horizontal lean of the fault across the full height. */
  slant: number;
  /** Where the fault sits across the width, 0 to 1. Defaults to the centre; wide artwork bands move it. */
  faultAt?: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

/** Builds a marker-bed figure. The mark itself is `MARK`; wider bands for covers use the same construction. */
export function markerBed(spec: MarkSpec): MarkGeometry {
  const section = spec.beds.reduce((a, b) => a + b, 0) + spec.gap * (spec.beds.length - 1);
  const height = section + spec.throw;
  const centre = spec.width * (spec.faultAt ?? 0.5);
  const faultAt = (y: number) => centre + spec.slant * (0.5 - y / height);
  const shapes: MarkShape[] = [];
  for (const side of ["left", "right"] as const) {
    let y = side === "left" ? spec.throw : 0;
    spec.beds.forEach((thickness, index) => {
      const top = y;
      const bottom = y + thickness;
      const role: MarkRole = index === spec.marker ? "marker" : "bed";
      const d =
        side === "left"
          ? `M0 ${round(top)}H${round(faultAt(top) - spec.fault / 2)}L${round(faultAt(bottom) - spec.fault / 2)} ${round(bottom)}H0Z`
          : `M${round(faultAt(top) + spec.fault / 2)} ${round(top)}H${spec.width}V${round(bottom)}H${round(faultAt(bottom) + spec.fault / 2)}Z`;
      shapes.push({ d, role });
      y = bottom + spec.gap;
    });
  }
  return { width: spec.width, height: round(height), shapes };
}

/** The mark. Use at 24 px and above. */
export const MARK: MarkGeometry = markerBed({
  width: 60,
  beds: [16, 8, 16],
  marker: 1,
  gap: 5,
  throw: 13,
  fault: 4.5,
  slant: 7,
});

/** Two-bed reduction for 12 to 23 px (favicons, dense interface chrome). Same construction, fewer beds. */
export const MARK_SMALL: MarkGeometry = markerBed({
  width: 60,
  beds: [22, 10],
  marker: 1,
  gap: 7,
  throw: 22,
  fault: 5.5,
  slant: 6,
});
