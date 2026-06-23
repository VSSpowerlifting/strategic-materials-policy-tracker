import { FlowTexture } from "@/components/ui/texture";

/**
 * Signature hero band — original SVG, no raster asset and no map. Five
 * diversifying actor nodes on the left feed material-flow lines that neck
 * through a single central processing chokepoint (the incumbent ~90% processor)
 * before fanning out to downstream uses on the right. A breathing halo marks the
 * chokepoint (`.choke-pulse`); the outbound dash drift is `.flow-line`. Both are
 * disabled under prefers-reduced-motion (see globals.css). Verdigris + grey line
 * work on graphite — an analytical instrument, not decoration.
 */

const SOURCES = [
  { code: "US", x: 140, y: 40 },
  { code: "EU", x: 96, y: 110 },
  { code: "CA", x: 84, y: 160 },
  { code: "JP", x: 96, y: 210 },
  { code: "AU", x: 140, y: 280 },
];

const OUTPUTS = [
  { label: "Magnets", x: 940, y: 84 },
  { label: "Semiconductors", x: 968, y: 160 },
  { label: "Defense", x: 940, y: 236 },
];

const CX = 540;
const CY = 160;
const NECK = 70; // flows converge / re-emerge this far from the core

export function HeroMotif({ materials }: { materials?: number }) {
  return (
    <div className="plate relative overflow-hidden rounded-xl border border-border-strong">
      {/* Instrument rail — frames the schematic; the count is a real dataset value */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-2.5">
        <span className="rail">Material-flow chokepoint</span>
        {materials ? <span className="rail tnum">{materials} materials tracked</span> : null}
      </div>
      <div className="relative">
        <FlowTexture />
        <svg
          viewBox="0 0 1080 320"
          className="relative h-auto w-full"
          role="img"
          aria-label="Schematic: five diversifying actors feed material flows through a single processing chokepoint to downstream uses. A concept diagram, not a map."
          fill="none"
        >
          {/* inbound flows converging on the chokepoint */}
          {SOURCES.map((s, i) => (
            <path
              key={s.code}
              d={`M${s.x} ${s.y} Q ${(s.x + CX) / 2 - 40} ${(s.y + CY) / 2} ${CX - NECK} ${CY}`}
              className={i % 2 === 0 ? "stroke-border-strong" : "stroke-muted/50"}
              strokeWidth="1.25"
            />
          ))}

          {/* the neck — every flow pinches through one short segment */}
          <path
            d={`M${CX - NECK} ${CY} L${CX + NECK} ${CY}`}
            className="stroke-accent"
            strokeWidth="1.5"
          />

          {/* outbound flows fanning to downstream uses */}
          {OUTPUTS.map((o) => (
            <path
              key={o.label}
              d={`M${CX + NECK} ${CY} Q ${(CX + o.x) / 2 + 30} ${(CY + o.y) / 2} ${o.x} ${o.y}`}
              className="flow-line stroke-accent/70"
              strokeWidth="1.25"
            />
          ))}

          {/* source nodes — the five diversifying actors */}
          {SOURCES.map((s) => (
            <g key={s.code}>
              <circle cx={s.x} cy={s.y} r="16" className="fill-elevated stroke-border-strong" strokeWidth="1" />
              <text x={s.x} y={s.y + 4} textAnchor="middle" className="fill-muted font-mono text-[12px]">
                {s.code}
              </text>
            </g>
          ))}

          {/* output nodes — downstream uses (labels hidden on the smallest screens) */}
          {OUTPUTS.map((o) => (
            <g key={o.label}>
              <circle cx={o.x} cy={o.y} r="4" className="fill-accent" />
              <text
                x={o.x - 12}
                y={o.y + 4}
                textAnchor="end"
                className="hidden fill-faint font-display text-[13px] sm:inline"
              >
                {o.label}
              </text>
            </g>
          ))}

          {/* the chokepoint: incumbent processor, with a breathing halo */}
          <circle cx={CX} cy={CY} r="46" className="choke-pulse fill-none stroke-accent/35" strokeWidth="1" />
          <circle cx={CX} cy={CY} r="34" className="fill-card stroke-accent/30" strokeWidth="1" />
          <circle cx={CX} cy={CY} r="23" className="fill-accent/10 stroke-accent" strokeWidth="1.5" />
          <text x={CX} y={CY - 1} textAnchor="middle" className="fill-foreground font-display text-[16px] font-semibold">
            CN
          </text>
          <text x={CX} y={CY + 13} textAnchor="middle" className="fill-accent font-mono text-[9px]">
            ~90%
          </text>
          <text x={CX} y={CY + 70} textAnchor="middle" className="fill-faint font-mono text-[11px] uppercase tracking-[0.2em]">
            chokepoint
          </text>
        </svg>
      </div>
    </div>
  );
}
