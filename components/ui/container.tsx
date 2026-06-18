import { cn } from "@/lib/utils";

/**
 * Page width. `default` is the workhorse measure; `wide` is for the framing
 * matrix and the homepage hero; `narrow` keeps long-form reading comfortable.
 */
type Width = "default" | "wide" | "narrow";

const WIDTHS: Record<Width, string> = {
  default: "max-w-6xl",
  wide: "max-w-7xl",
  narrow: "max-w-3xl",
};

export function Container({
  className,
  width = "default",
  children,
}: {
  className?: string;
  width?: Width;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", WIDTHS[width], className)}>
      {children}
    </div>
  );
}

/**
 * Atlas index marker: a JetBrains Mono numeral set against the label, no
 * colored bar and no wide-tracked all-caps. Reads like a reference atlas and is
 * deliberately unlike the sibling sites' accent-bar eyebrow.
 */
export function AtlasIndex({
  index,
  label,
  className,
}: {
  index?: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-3 font-mono text-xs", className)}>
      {index ? <span className="tnum text-faint">{index}</span> : null}
      <span className="text-accent">{label}</span>
      <span aria-hidden className="h-px flex-1 self-center bg-border" />
    </div>
  );
}

/** Standard page heading: atlas kicker / Archivo title / serif lead. */
export function PageHeading({
  eyebrow,
  index,
  title,
  lead,
  className,
}: {
  eyebrow?: string;
  index?: string;
  title: string;
  lead?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      {eyebrow ? <AtlasIndex index={index} label={eyebrow} className="mb-4" /> : null}
      <h1 className="max-w-4xl font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
        {title}
      </h1>
      {lead ? (
        <p className="mt-5 max-w-3xl text-pretty text-lg leading-8 text-muted">{lead}</p>
      ) : null}
    </div>
  );
}

/** A labelled section with the atlas index + a hairline rule. */
export function Section({
  title,
  index,
  description,
  children,
  className,
}: {
  title?: string;
  index?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("scroll-mt-20", className)}>
      {title ? (
        <div className="mb-4 border-b border-border pb-2">
          <div className="flex items-end gap-3">
            {index ? (
              <span className="tnum font-display text-2xl font-bold leading-none text-foreground">
                {index}
              </span>
            ) : null}
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                {title}
              </h2>
              {description ? (
                <p className="mt-0.5 text-sm leading-6 text-faint">{description}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </section>
  );
}
