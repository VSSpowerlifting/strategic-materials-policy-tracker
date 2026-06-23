import Link from "next/link";
import { cn } from "@/lib/utils";
import { getMaterialMeta } from "@/lib/materials-meta";
import type { Material } from "@/lib/types";

type SymbolSize = "sm" | "md" | "lg";

const SYMBOL_SIZE: Record<SymbolSize, string> = {
  sm: "h-12 w-12 rounded",
  md: "h-16 w-16 rounded-md",
  lg: "h-24 w-24 rounded-lg",
};

const SYMBOL_TEXT: Record<SymbolSize, string> = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
};

/**
 * Periodic-style element tile: large mono symbol, small atomic number, the
 * material's oxide hue as a thin frame + a faint matching corner glow. Sober,
 * not gamified — the hue is an accent only.
 */
export function MaterialSymbol({
  id,
  size = "md",
  className,
}: {
  id: string;
  size?: SymbolSize;
  className?: string;
}) {
  const { symbol, atomicNumber, hue } = getMaterialMeta(id);
  return (
    <div
      style={{ borderColor: `${hue}a6` }}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border bg-elevated",
        SYMBOL_SIZE[size],
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute -right-3 -top-3 h-10 w-10 rounded-full opacity-60 blur-xl"
        style={{ background: hue }}
      />
      {atomicNumber ? (
        <span className="absolute right-1 top-0.5 font-mono text-[9px] text-faint">
          {atomicNumber}
        </span>
      ) : null}
      <span
        className={cn("font-mono font-medium leading-none", SYMBOL_TEXT[size])}
        style={{ color: hue }}
      >
        {symbol}
      </span>
    </div>
  );
}

/** Clickable grid tile used on the materials index and the homepage preview. */
export function MaterialTile({ material }: { material: Material }) {
  const { hue } = getMaterialMeta(material.id);
  return (
    <Link
      href={`/materials/${material.slug}`}
      style={{ "--oxide": hue, "--tile-hue": hue } as React.CSSProperties}
      className="oxide-rule plate group flex items-center gap-4 rounded-r-lg p-4 ring-1 ring-border/80 transition-all hover:bg-elevated hover:shadow-[0_0_18px_2px_color-mix(in_oklab,var(--tile-hue)_14%,transparent)]"
    >
      <MaterialSymbol id={material.id} size="md" />
      <div className="min-w-0">
        <h2 className="font-display font-semibold leading-snug tracking-tight text-foreground group-hover:text-accent">
          {material.nameEn}
        </h2>
        {material.nameZh ? (
          <span lang="zh" className="font-mono text-xs text-faint">
            {material.nameZh}
          </span>
        ) : null}
        <div className="tnum mt-0.5 font-mono text-[11px] text-faint">
          {material.eventIds.length} events
        </div>
        {material.grouping ? (
          <div
            className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: hue }}
          >
            {material.grouping}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

/** Large, non-link element-tile header for the material detail page. */
export function MaterialTileHeader({ material }: { material: Material }) {
  const { hue } = getMaterialMeta(material.id);
  return (
    <div
      style={{ "--oxide": hue } as React.CSSProperties}
      className="oxide-rule flex items-center gap-5 pl-5"
    >
      <MaterialSymbol id={material.id} size="lg" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            {material.nameEn}
          </h1>
          {material.nameZh ? (
            <span lang="zh" className="font-mono text-lg text-muted">
              {material.nameZh}
            </span>
          ) : null}
        </div>
        {material.grouping ? (
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-faint">
            {material.grouping}
          </p>
        ) : null}
      </div>
    </div>
  );
}
