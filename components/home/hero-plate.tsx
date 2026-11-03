/**
 * A static drafting mark for the empty space above "Scope and freshness": the aside's left rule continued
 * upward with reference ticks, a few broken arcs and unlabelled nodes. It is decoration only. Nothing in it
 * stands for a record, a stage or a relationship, and it carries no text. Hidden below `lg`, where the
 * column stacks and there is no spare space.
 */
export function HeroPlate() {
  const line = { vectorEffect: "non-scaling-stroke", fill: "none" } as const;
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 400 220"
      preserveAspectRatio="xMinYMax meet"
      className="pointer-events-none absolute bottom-full left-0 mb-8 hidden h-52 w-full lg:block"
    >
      <g stroke="var(--border-strong)" strokeWidth="1">
        {/* The aside's rule, continued upward and broken, with reference ticks. */}
        <path {...line} d="M0.5 220V156M0.5 140V84M0.5 70V36" />
        <path {...line} d="M0.5 196h6M0.5 172h4M0.5 124h6M0.5 100h4M0.5 52h6" />

        {/* Broken concentric arcs, open toward the lower left. */}
        <path {...line} opacity="0.9" d="M262.4 86.3A40 40 0 0 1 338.6 110.4" />
        <path {...line} opacity="0.7" d="M236.6 70.4A70 70 0 0 1 360.6 65M367.6 81.9A70 70 0 0 1 363.4 129.6" />
        <path {...line} opacity="0.45" d="M221.4 44.9A96 96 0 0 1 394.6 83.3" />

        {/* Connectors with gaps; they join nothing in particular. */}
        <path {...line} opacity="0.8" d="M168 150L214 126M228 119L294 102" />
        <path {...line} opacity="0.6" d="M303 106L326 140M332 150L344 170" />
        <path {...line} opacity="0.5" strokeDasharray="2 5" d="M92 192L162 154" />

        {/* Registration marks. */}
        <path {...line} opacity="0.7" d="M48 24v10M43 29h10M376 196v10M371 201h10" />
      </g>

      <g>
        <circle cx="300" cy="100" r="3.5" fill="var(--bg)" stroke="var(--brand-gold)" strokeOpacity="0.6" strokeWidth="1" />
        <circle cx="166" cy="152" r="2.25" fill="var(--border-strong)" />
        <circle cx="346" cy="174" r="2.25" fill="var(--border-strong)" />
        <circle cx="244" cy="40" r="1.5" fill="var(--border-strong)" />
        <circle cx="88" cy="194" r="2" fill="var(--brand-gold)" fillOpacity="0.4" />
      </g>
    </svg>
  );
}
