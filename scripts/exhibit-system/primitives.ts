// Shared slide frame, design tokens and the recording helper factory.
//
// Geometry follows the accepted Archivo master (create_master.py): 13.333 x 7.5 in,
// dark top bar, gold-toned section label, 26pt assertion title, 13pt measure
// subtitle, hairline rules at y = 2.47 and 6.91, 10pt source footer.
// No pptxgenjs import: the slide object is passed in.

import type {
  Area,
  ChartSeries,
  ElementRecord,
  ElementRole,
  Fixture,
  Opts,
  PptxSlide,
  RenderHelpers,
  TableCell,
  TextRun,
} from "./types";

export const FONT = "Archivo";

/** Colour tokens (hex without '#'), matching EXHIBIT_AND_CHART_RULES v2.0 and the master. */
export const C = {
  dark: "12110F",
  paper: "F5F3EE",
  ink: "1B1915",
  accent: "7A5510", // single highlighted result
  muted: "5B5548",
  border: "D8D3C7",
  soft: "E9E5DC",
  neutral: "8A8375", // default data mark
  neutralLight: "C9C3B5", // secondary / comparison mark
  neutralDark: "4A453B",
  gold: "C8993E",
  white: "FFFFFF",
} as const;

export const SLIDE_W = 13.333;
export const SLIDE_H = 7.5;

const LEFT = 0.62;
const RIGHT_EDGE = 12.67;
const CONTENT_TOP = 2.62;

export const SPLIT_AREA: Area = { x: LEFT, y: CONTENT_TOP, w: 8.75, h: 4.15 };
export const WIDE_AREA: Area = { x: LEFT, y: CONTENT_TOP, w: RIGHT_EDGE - LEFT, h: 3.42 };

/**
 * Type scale in points, from Presentation Standard v2 (type ranges) and the accepted master.
 * The assertion title stays at the master's 26 pt; the standard's 28-34 pt range is a known
 * deviation recorded in the exhibit-system README.
 */
export const TYPE = {
  title: 26,
  subtitle: 14,
  body: 16, // interpretation panel (split layout)
  strip: 15, // interpretation strip (wide layout)
  label: 12, // preferred data label
  axis: 11,
  dense: 11, // smallest exhibit text: axis ticks, legends, dense node labels
  footnote: 10, // source line, badges, kicker-style headings
} as const;

/**
 * Smallest permitted size by element role. makeHelpers refuses anything smaller, so a
 * renderer (or a research spec) cannot ship type below the standard's floors.
 */
export const MIN_PT: Readonly<Record<ElementRole, number>> = {
  frame: TYPE.footnote,
  annot: TYPE.footnote,
  data: TYPE.dense,
  label: TYPE.dense,
  axis: TYPE.dense,
  legend: TYPE.dense,
};

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Every explicit font size on an element: the base option, per-run or per-cell overrides, chart *FontSize keys. */
export function fontSizesOf(kind: "text" | "chart" | "table", options: Opts, content?: unknown): number[] {
  const out: number[] = [];
  const push = (v: unknown) => {
    const n = num(v);
    if (n !== undefined) out.push(n);
  };
  if (kind === "chart") {
    for (const [k, v] of Object.entries(options)) if (k.endsWith("FontSize")) push(v);
    return out;
  }
  push(options.fontSize);
  if (kind === "text" && Array.isArray(content)) {
    for (const r of content as TextRun[]) push(r.options?.fontSize);
  }
  if (kind === "table" && Array.isArray(content)) {
    for (const row of content as TableCell[][]) for (const c of row) push(c.options?.fontSize);
  }
  return out;
}

export const SYNTHETIC_NOTICE = "Synthetic demonstration data — not an SMPT finding";

/** Research output is always draft; technical QC cannot authorize publication. */
export const DRAFT_BADGE = "DRAFT · REVIEW GATES PENDING";

export interface FrameSpec {
  label: string;
  slideNumber: number;
  fixture: Fixture;
}

/** Element-recording helper factory. Every object gets a role-prefixed `objectName`. */
export function makeHelpers(
  slide: PptxSlide,
  area: Area,
  records: ElementRecord[],
  shapeTypes: Readonly<Record<string, string>>,
  chartTypes: Readonly<Record<string, string>>,
): RenderHelpers {
  const used = new Set<string>();
  const nm = (role: ElementRole, name: string) => {
    const full = `${role}:${name}`;
    if (used.has(full)) throw new Error(`duplicate element name ${full}`);
    used.add(full);
    return full;
  };
  const sized = (objectName: string, role: ElementRole, sizes: number[]): number | undefined => {
    if (!sizes.length) return undefined;
    const min = Math.min(...sizes);
    if (min < MIN_PT[role]) {
      throw new Error(`type below the ${MIN_PT[role]} pt floor for role "${role}": ${objectName} uses ${min} pt`);
    }
    return min;
  };
  return {
    area,
    shapes: shapeTypes,
    charts: chartTypes,
    chart(name, type, data: ChartSeries[], options: Opts, helper = false) {
      const objectName = nm("data", name);
      const minPt = sized(objectName, "data", fontSizesOf("chart", options));
      slide.addChart(type, data, { ...options, objectName, altText: options.altText ?? name });
      records.push({
        name: objectName,
        role: "data",
        tier: helper ? "native-chart-with-helper-series" : "native-chart",
        kind: "chart",
        ...(minPt === undefined ? {} : { minPt }),
      });
    },
    shape(name, role, shape, options) {
      const objectName = nm(role, name);
      slide.addShape(shape, { ...options, objectName });
      records.push({ name: objectName, role, tier: "native-shapes", kind: "shape" });
    },
    line(name, role, options) {
      const objectName = nm(role, name);
      slide.addShape(shapeTypes.line, { ...options, objectName });
      records.push({ name: objectName, role, tier: "native-shapes", kind: "line" });
    },
    text(name, role, text: string | TextRun[], options) {
      const objectName = nm(role, name);
      const minPt = sized(objectName, role, fontSizesOf("text", options, text));
      slide.addText(text, { fontFace: FONT, color: C.ink, margin: 0, ...options, objectName });
      records.push({ name: objectName, role, tier: "text", kind: "text", ...(minPt === undefined ? {} : { minPt }) });
    },
    table(name, rows: TableCell[][], options) {
      const objectName = nm("data", name);
      const minPt = sized(objectName, "data", fontSizesOf("table", options, rows));
      slide.addTable(rows, { fontFace: FONT, color: C.ink, ...options, objectName });
      records.push({ name: objectName, role: "data", tier: "table", kind: "table", ...(minPt === undefined ? {} : { minPt }) });
    },
  };
}

/**
 * Draws the standard exhibit frame and returns the content area.
 * The frame itself is recorded with role `frame` / `annot`.
 */
export function drawFrame(h: RenderHelpers, spec: FrameSpec): void {
  const f = spec.fixture;
  const wide = f.layout === "wide";
  h.shape("top-bar", "frame", h.shapes.rect, {
    x: 0, y: 0, w: SLIDE_W, h: 0.12, fill: { color: C.dark }, line: { color: C.dark, width: 0 },
  });
  h.text("section-label", "frame", spec.label, {
    x: LEFT, y: 0.35, w: 8.6, h: 0.3, fontSize: 11, bold: true, color: C.accent, charSpacing: 1,
  });
  const synthetic = f.classification === "synthetic-demonstration";
  if (synthetic) {
    h.text("synthetic-badge", "frame", "SYNTHETIC DEMONSTRATION DATA", {
      x: 8.9, y: 0.35, w: 2.9, h: 0.3, fontSize: TYPE.footnote, bold: true, color: C.muted, align: "right", charSpacing: 1,
    });
  } else {
    h.text("draft-badge", "frame", DRAFT_BADGE, {
      x: 8.9, y: 0.35, w: 2.9, h: 0.3, fontSize: TYPE.footnote, bold: true, color: C.accent, align: "right", charSpacing: 1,
    });
  }
  h.text("slide-number", "frame", String(spec.slideNumber), {
    x: 12.0, y: 0.35, w: 0.67, h: 0.3, fontSize: 11, color: C.muted, align: "right",
  });
  h.text("title", "frame", f.title, {
    x: LEFT, y: 0.84, w: 12.05, h: 1.14, fontSize: TYPE.title, bold: true, color: C.ink, valign: "top", fit: "none",
  });
  h.text("subtitle", "frame", f.subtitle, {
    x: LEFT, y: 2.02, w: 12.05, h: 0.38, fontSize: TYPE.subtitle, color: C.muted, valign: "top",
  });
  for (const [n, y] of [["rule-top", 2.47], ["rule-bottom", 6.91]] as const) {
    h.shape(n, "frame", h.shapes.rect, {
      x: LEFT, y, w: 12.05, h: 0.015, fill: { color: C.border }, line: { color: C.border, width: 0 },
    });
  }
  h.text("source-footer", "frame", synthetic ? `Source: ${f.source} · ${SYNTHETIC_NOTICE}` : `Source: ${f.source}`, {
    x: LEFT, y: 7.0, w: 12.05, h: 0.32, fontSize: TYPE.footnote, color: C.muted, valign: "top",
  });

  if (wide) {
    const y = WIDE_AREA.y + WIDE_AREA.h + 0.16;
    h.shape("interpretation-bar", "annot", h.shapes.rect, {
      x: LEFT, y, w: 0.05, h: 0.62, fill: { color: C.accent }, line: { color: C.accent, width: 0 },
    });
    h.text("interpretation", "annot", [
      { text: "INTERPRETATION  ", options: { bold: true, color: C.accent, fontSize: TYPE.footnote, charSpacing: 1 } },
      { text: f.annotation, options: { color: C.ink, fontSize: TYPE.strip } },
    ], { x: LEFT + 0.2, y, w: 11.85, h: 0.62, valign: "middle" });
  } else {
    const x = 9.62;
    h.shape("interpretation-bar", "annot", h.shapes.rect, {
      x, y: CONTENT_TOP, w: 0.05, h: 1.1, fill: { color: C.accent }, line: { color: C.accent, width: 0 },
    });
    h.text("interpretation-heading", "annot", "INTERPRETATION", {
      x: x + 0.2, y: CONTENT_TOP, w: 2.85, h: 0.26, fontSize: TYPE.footnote, bold: true, color: C.accent, charSpacing: 1,
    });
    h.text("interpretation", "annot", f.annotation, {
      x: x + 0.2, y: CONTENT_TOP + 0.34, w: 2.85, h: 3.8, fontSize: TYPE.body, color: C.ink, valign: "top",
      paraSpaceAfter: 4,
    });
  }
}

export function contentArea(f: Fixture): Area {
  return f.layout === "wide" ? WIDE_AREA : SPLIT_AREA;
}

/** Standard native-chart options: Archivo, ink/muted, no gridlines, no legend, no chart border. */
export function chartDefaults(area: Area, extra: Opts = {}): Opts {
  return {
    x: area.x,
    y: area.y,
    w: area.w,
    h: area.h,
    plotArea: { fill: { color: C.paper } },
    chartArea: { fill: { color: C.paper }, roundedCorners: false },
    catAxisLabelFontFace: FONT,
    catAxisLabelFontSize: TYPE.axis,
    catAxisLabelColor: C.ink,
    valAxisLabelFontFace: FONT,
    valAxisLabelFontSize: TYPE.axis,
    valAxisLabelColor: C.muted,
    catAxisLineShow: true,
    catAxisLineColor: C.border,
    valAxisLineShow: false,
    valGridLine: { style: "none" },
    catGridLine: { style: "none" },
    showLegend: false,
    legendFontFace: FONT,
    legendFontSize: TYPE.dense,
    legendColor: C.ink,
    dataLabelFontFace: FONT,
    dataLabelFontSize: TYPE.label,
    dataLabelColor: C.ink,
    titleFontFace: FONT,
    ...extra,
  };
}

/** Horizontal hairline across a span (a zero-height rect renders more reliably than a connector). */
export function hairline(h: RenderHelpers, name: string, role: ElementRole, x: number, y: number, w: number, color: string = C.border): void {
  h.shape(name, role, h.shapes.rect, { x, y, w, h: 0.012, fill: { color }, line: { color, width: 0 } });
}

/** Vertical hairline. */
export function vline(h: RenderHelpers, name: string, role: ElementRole, x: number, y: number, hh: number, color: string = C.border): void {
  h.shape(name, role, h.shapes.rect, { x, y, w: 0.012, h: hh, fill: { color }, line: { color, width: 0 } });
}

/** Linear scale helper. */
export function scale(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}

/** Deterministic number formatting: one numeric grammar (decimal point, comma thousands, U+2212 minus). */
export function fmt(v: number, dp = 0, opts: { sign?: boolean; suffix?: string; prefix?: string } = {}): string {
  const abs = Math.abs(v);
  const fixed = abs.toFixed(dp);
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = dec ? `${grouped}.${dec}` : grouped;
  const neg = v < 0 && Number(fixed) !== 0;
  const sign = neg ? "−" : opts.sign && Number(fixed) !== 0 ? "+" : "";
  return `${sign}${opts.prefix ?? ""}${body}${opts.suffix ?? ""}`;
}

/** Number format code for native chart labels with the given decimals. */
export function formatCode(dp: number, suffix = ""): string {
  const base = dp > 0 ? `#,##0.${"0".repeat(dp)}` : "#,##0";
  return suffix ? `${base}"${suffix}"` : base;
}

/** Small colour-keyed legend chip + label, laid out left to right. Returns next x. */
export function legendItem(
  h: RenderHelpers,
  name: string,
  x: number,
  y: number,
  label: string,
  style: { fill?: string; line?: string; dash?: string },
  width = 1.8,
): number {
  h.shape(`${name}-key`, "legend", h.shapes.rect, {
    x, y: y + 0.06, w: 0.22, h: 0.14,
    fill: style.fill ? { color: style.fill } : { color: C.paper, transparency: 100 },
    line: { color: style.line ?? style.fill ?? C.ink, width: 1, dashType: style.dash ?? "solid" },
  });
  h.text(`${name}-label`, "legend", label, { x: x + 0.3, y, w: width - 0.3, h: 0.26, fontSize: TYPE.dense, color: C.ink });
  return x + width;
}

/** Smallest "nice" axis maximum (1, 2, 2.5, 5 × 10^k) at or above v. */
export function niceMax(v: number): number {
  if (!(v > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (m * p >= v - 1e-9) return m * p;
  }
  return 10 * p;
}
