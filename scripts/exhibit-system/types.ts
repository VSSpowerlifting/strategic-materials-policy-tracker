// Shared types for the SMPT exhibit system.
//
// pptxgenjs is deliberately NOT a repository dependency: it is loaded at build
// time from the bundled runtime (see build-gallery.ts). Renderers only see the
// minimal structural interface below, so every pure module (registry,
// integrity, selection, deck review) type-checks and tests without it.

export type Opts = Record<string, unknown>;

export interface TextRun {
  text: string;
  options?: Opts;
}

export interface ChartSeries {
  name: string;
  /** Category labels (bar/line/area). Omitted for scatter/bubble, where the first series holds X values. */
  labels?: string[];
  values: number[];
  /** Bubble sizes (bubble charts only). */
  sizes?: number[];
}

export interface TableCell {
  text: string;
  options?: Opts;
}

/** The subset of a pptxgenjs slide the renderers use. */
export interface PptxSlide {
  background?: Opts;
  addText(text: string | TextRun[], options: Opts): unknown;
  addShape(shape: string, options: Opts): unknown;
  addChart(type: string, data: ChartSeries[], options: Opts): unknown;
  addTable(rows: TableCell[][], options: Opts): unknown;
  addNotes(notes: string): unknown;
}

/**
 * How an element can be edited once the PPTX is open.
 * - native-chart: a PowerPoint chart with an embedded workbook (Edit Data works).
 * - native-chart-with-helper-series: native chart whose geometry relies on an
 *   unfilled helper series (waterfall floats, duration offsets). Editing data
 *   requires keeping the helper column consistent.
 * - native-shapes: editable geometry and text; values are NOT data-bound.
 * - table: a native PowerPoint table.
 * - text: a native text box.
 * - raster: a bitmap. The system target is zero raster data elements.
 */
export const EDITABILITY_TIERS = [
  "native-chart",
  "native-chart-with-helper-series",
  "native-shapes",
  "table",
  "text",
  "raster",
] as const;
export type EditabilityTier = (typeof EDITABILITY_TIERS)[number];

/** Element-name role prefixes written into every object's `objectName`. */
export const ELEMENT_ROLES = ["frame", "data", "label", "annot", "axis", "legend"] as const;
export type ElementRole = (typeof ELEMENT_ROLES)[number];

export interface ElementRecord {
  name: string;
  role: ElementRole;
  tier: EditabilityTier;
  kind: "chart" | "shape" | "line" | "text" | "table";
}

export interface IntegrityIssue {
  rule: string;
  message: string;
}

export interface Fixture {
  pattern: string;
  classification: "synthetic-demonstration";
  title: string;
  subtitle: string;
  annotation: string;
  source: string;
  /** Strings that must appear verbatim in the rendered slide XML. */
  visual_text: string[];
  /** "split" (default): exhibit left, interpretation panel right. "wide": full-width exhibit, interpretation strip below. */
  layout?: "split" | "wide";
  data: unknown;
}

export interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RenderHelpers {
  /** Content area (inches) the exhibit must stay inside. */
  readonly area: Area;
  /** Native chart; tier inferred from `helper` flag. */
  chart(
    name: string,
    type: string,
    data: ChartSeries[],
    options: Opts,
    helper?: boolean,
  ): void;
  shape(name: string, role: ElementRole, shape: string, options: Opts): void;
  line(name: string, role: ElementRole, options: Opts): void;
  text(name: string, role: ElementRole, text: string | TextRun[], options: Opts): void;
  table(name: string, rows: TableCell[][], options: Opts): void;
  /** pptxgenjs shape-type names (`rect`, `ellipse`, `line`, ...). */
  readonly shapes: Readonly<Record<string, string>>;
  /** pptxgenjs chart-type names (`bar`, `line`, `scatter`, ...). */
  readonly charts: Readonly<Record<string, string>>;
}

export interface Renderer<T = unknown> {
  id: string;
  /** Parse and type-check fixture data; throw on contract violations. */
  parse(data: unknown): T;
  /** Analytical integrity checks on parsed data (pure). */
  check(data: T): IntegrityIssue[];
  /** Draw the exhibit inside the standard frame's content area. */
  render(h: RenderHelpers, data: T, fixture: Fixture): void;
}
