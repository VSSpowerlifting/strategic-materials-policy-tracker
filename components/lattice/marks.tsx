import { cn } from "@/lib/utils";
import type { SupplyChainStage } from "@/lib/types";

/** Short column labels for narrow layouts. Presentation only; the full label is `supplyChainStageLabels`. */
export const stageShortLabels: Record<SupplyChainStage, string> = {
  exploration: "Exploration",
  mining: "Mining",
  separation: "Separation",
  processing: "Processing",
  refining: "Refining",
  component_manufacturing: "Components",
  final_manufacturing: "Final mfg.",
  recycling: "Recycling",
  stockpiling: "Stockpiling",
  research_development: "R&D",
  cross_cutting: "Cross-cutting",
};

/** One record kind's fixed encoding: a gold disc, an amber disc, or a cream diamond. Never a money scale. */
export type MarkKind = "commitments" | "controls" | "designations";

const FILL: Record<Exclude<MarkKind, "designations">, string> = {
  commitments: "var(--mark-commitment)",
  controls: "var(--mark-control)",
};

/** Disc radius: area is proportional to the number of records (r ∝ √n), never to an amount of money. */
const radius = (n: number, scale: number, floor: number) => Math.max(floor, 2.4 * Math.sqrt(n) * scale);

function Diamond({ cx, cy, d }: { cx: number; cy: number; d: number }) {
  return (
    <path
      d={`M${cx} ${cy - d}L${cx + d} ${cy}L${cx} ${cy + d}L${cx - d} ${cy}Z`}
      fill="var(--bg)"
      stroke="var(--mark-designation)"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  );
}

/**
 * The marks for one material-and-stage cell: a gold disc for government commitments, an amber disc for control
 * clauses, a diamond for designations. When a disc pair shares a cell they sit side by side; the position
 * implies no link between them. `compact` is the phone size.
 */
export function CellMarks({
  counts,
  compact = false,
  className,
}: {
  counts: { commitments: number; controls: number; designations: number };
  compact?: boolean;
  className?: string;
}) {
  const s = compact ? 0.52 : 1;
  const w = 56 * s;
  const h = 36 * s;
  const cx = w / 2;
  const cy = h / 2 + 1 * s;
  const { commitments: c, controls: k, designations: d } = counts;
  const both = c > 0 && k > 0;
  // Phone marks are drawn on a smaller grid but keep most of their radius so they stay legible.
  const rs = compact ? 0.78 : 1;
  const floor = 1.9;
  const anyDisc = c > 0 || k > 0;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden className={cn("mx-auto block max-w-full", className)}>
      {k > 0 ? <circle cx={both ? cx + 5 * s : cx} cy={both ? cy + 3 * s : cy} r={radius(k, rs, floor)} fill={FILL.controls} /> : null}
      {c > 0 ? <circle cx={both ? cx - 4 * s : cx} cy={both ? cy - 2 * s : cy} r={radius(c, rs, floor)} fill={FILL.commitments} /> : null}
      {d > 0 ? <Diamond cx={anyDisc ? cx + 13 * s : cx} cy={anyDisc ? cy - 9 * s : cy} d={compact ? 3.2 : 4.2} /> : null}
    </svg>
  );
}

/** A small swatch for one kind, for legends and count lines. `onPaper` draws the diamond dark for the cream sections. */
export function KindSwatch({ kind, className, onPaper = false }: { kind: MarkKind; className?: string; onPaper?: boolean }) {
  if (kind === "designations")
    return (
      <svg viewBox="0 0 12 12" aria-hidden className={cn("h-2.5 w-2.5 shrink-0", className)}>
        <path d="M6 1.2 10.8 6 6 10.8 1.2 6Z" fill="none" stroke={onPaper ? "var(--paper-fg)" : "var(--mark-designation)"} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  return <span aria-hidden className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)} style={{ background: FILL[kind] }} />;
}

/** Sample discs for the "area is a number of records" legend. */
export function AreaKey({ samples = [1, 3, 6, 9] }: { samples?: number[] }) {
  return (
    <span className="inline-flex items-center gap-3">
      {samples.map((n) => {
        const r = radius(n, 1, 1.9);
        return (
          <span key={n} className="inline-flex flex-col items-center gap-1">
            <svg width={r * 2 + 2} height={r * 2 + 2} aria-hidden>
              <circle cx={r + 1} cy={r + 1} r={r} fill="none" stroke="var(--muted)" strokeWidth="1" />
            </svg>
            <span className="tnum font-mono text-[10px] text-faint">{n}</span>
          </span>
        );
      })}
    </span>
  );
}
