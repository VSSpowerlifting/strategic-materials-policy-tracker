import { FlowTexture } from "@/components/ui/texture";

/**
 * Signature hero image — original SVG, no raster asset. Five actor nodes on the
 * left feed thin material-flow lines that neck through a single central
 * chokepoint (the incumbent processor) before fanning out to downstream
 * outputs. Verdigris + grey line work on graphite; the dash drift is driven by
 * `.flow-line` in globals.css and is disabled under prefers-reduced-motion.
 */

const SOURCES = [
  { code: "CA", x: 150, y: 52 },
  { code: "US", x: 78, y: 120 },
  { code: "EU", x: 58, y: 190 },
  { code: "JP", x: 86, y: 260 },
  { code: "AU", x: 166, y: 322 },
];

const OUTPUTS = [
  { label: "Magnets", x: 612, y: 88 },
  { label: "Semiconductors", x: 650, y: 182 },
  { label: "Defense", x: 612, y: 276 },
];

const CX = 384;
const CY = 188;

export function HeroMotif() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/60">
      <FlowTexture />
      <svg
        viewBox="0 0 720 376"
        className="relative h-auto w-full"
        role="img"
        aria-label="Schematic: five diversifying actors feeding material flows through a single processing chokepoint to downstream outputs."
        fill="none"
      >
        {/* inbound flows converging on the chokepoint */}
        {SOURCES.map((s, i) => (
          <path
            key={s.code}
            d={`M${s.x} ${s.y} Q ${(s.x + CX) / 2 - 30} ${(s.y + CY) / 2} ${CX - 30} ${CY}`}
            className={i % 2 === 0 ? "stroke-border-strong" : "stroke-muted/50"}
            strokeWidth="1.25"
          />
        ))}
        {/* the neck — flows pinch through one point */}
        <path d={`M${CX - 30} ${CY} L${CX + 30} ${CY}`} className="stroke-accent" strokeWidth="1.5" />

        {/* outbound flows fanning to outputs */}
        {OUTPUTS.map((o) => (
          <path
            key={o.label}
            d={`M${CX + 30} ${CY} Q ${(CX + o.x) / 2 + 20} ${(CY + o.y) / 2} ${o.x} ${o.y}`}
            className="flow-line stroke-accent/70"
            strokeWidth="1.25"
          />
        ))}

        {/* source nodes */}
        {SOURCES.map((s) => (
          <g key={s.code}>
            <circle cx={s.x} cy={s.y} r="13" className="fill-elevated stroke-border-strong" strokeWidth="1" />
            <text
              x={s.x}
              y={s.y + 3.5}
              textAnchor="middle"
              className="fill-muted font-mono text-[10px]"
            >
              {s.code}
            </text>
          </g>
        ))}

        {/* output nodes */}
        {OUTPUTS.map((o) => (
          <g key={o.label}>
            <circle cx={o.x} cy={o.y} r="3.5" className="fill-accent" />
            <text
              x={o.x - 10}
              y={o.y + 3.5}
              textAnchor="end"
              className="fill-faint font-display text-[11px]"
            >
              {o.label}
            </text>
          </g>
        ))}

        {/* the chokepoint: incumbent processor */}
        <circle cx={CX} cy={CY} r="30" className="fill-card stroke-accent/30" strokeWidth="1" />
        <circle cx={CX} cy={CY} r="20" className="fill-accent/10 stroke-accent" strokeWidth="1.5" />
        <text x={CX} y={CY - 1} textAnchor="middle" className="fill-foreground font-display text-[13px] font-semibold">
          CN
        </text>
        <text x={CX} y={CY + 11} textAnchor="middle" className="fill-accent font-mono text-[7.5px]">
          ~90%
        </text>
        <text x={CX} y={CY + 52} textAnchor="middle" className="fill-faint font-mono text-[10px] uppercase tracking-[0.2em]">
          chokepoint
        </text>
      </svg>
    </div>
  );
}
