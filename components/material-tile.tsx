import Link from "next/link";
import { cn } from "@/lib/utils";
import { getMaterialMeta } from "@/lib/materials-meta";
import type { Material } from "@/lib/types";

type SymbolSize = "sm" | "md" | "lg";

const SYMBOL_SIZE: Record<SymbolSize, string> = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

const SYMBOL_TEXT: Record<SymbolSize, string> = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
};

/**
 * Periodic-style element tile: the symbol in ink on the plate surface, a small
 * atomic number, and the material's hue as one flat rule along the foot. The
 * hue identifies; it never carries text.
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
      className={cn(
        "relative flex shrink-0 items-center justify-center border border-border-strong bg-plate",
        SYMBOL_SIZE[size],
        className,
      )}
    >
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: hue }} />
      {atomicNumber ? (
        <span className="absolute right-1 top-0.5 font-display text-[9px] text-faint">
          {atomicNumber}
        </span>
      ) : null}
      <span
        className={cn("font-mono font-medium leading-none text-foreground", SYMBOL_TEXT[size])}
      >
        {symbol}
      </span>
    </div>
  );
}

/** Clickable grid tile used on the materials index and the homepage preview. */
export function MaterialTile({ material }: { material: Material }) {
  return (
    <Link
      data-site-motion="card"
      href={`/materials/${material.slug}`}
      className="group flex items-center gap-4 border border-border bg-plate p-4 transition-colors hover:border-border-strong hover:bg-elevated"
    >
      <MaterialSymbol id={material.id} size="md" />
      <div className="min-w-0">
        <h2 className="font-display font-semibold leading-snug tracking-tight text-foreground group-hover:text-accent">
          {material.nameEn}
        </h2>
        {material.nameZh ? (
          <span lang="zh" className="font-display text-xs text-faint">
            {material.nameZh}
          </span>
        ) : null}
        <div className="tnum mt-0.5 font-display text-xs text-faint">
          {material.eventIds.length} events
        </div>
        {material.grouping ? (
          <div className="mt-0.5 font-display text-xs text-muted">{material.grouping}</div>
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
            <span lang="zh" className="font-display text-lg text-muted">
              {material.nameZh}
            </span>
          ) : null}
        </div>
        {material.grouping ? (
          <p className="mt-1 font-display text-xs text-faint">
            {material.grouping}
          </p>
        ) : null}
      </div>
    </div>
  );
}
