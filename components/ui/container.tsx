import { cn } from "@/lib/utils";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

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
 * Atlas kicker: the label set against a hairline, no colored bar and no wide-tracked all-caps. `index` is
 * accepted for existing callers but no longer drawn: hand-numbered sections ("01", "05") read as a sequence the
 * pages do not actually follow, and the numbers drifted whenever a section was conditional.
 */
export function AtlasIndex({
  label,
  className,
}: {
  index?: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-3 font-mono text-xs", className)}>
      <span className="text-accent">{label}</span>
      <span aria-hidden className="h-px flex-1 self-center bg-border" />
    </div>
  );
}

/**
 * Standard page heading: breadcrumb trail or atlas kicker / Archivo title / serif lead. Detail pages pass
 * `breadcrumbs`, which replace the kicker so the page's place in its journey is said once.
 */
export function PageHeading({
  eyebrow,
  title,
  lead,
  breadcrumbs,
  className,
}: {
  eyebrow?: string;
  index?: string;
  title: string;
  lead?: React.ReactNode;
  breadcrumbs?: readonly Crumb[];
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      {breadcrumbs?.length ? (
        <Breadcrumbs items={breadcrumbs} className="mb-5" />
      ) : eyebrow ? (
        <AtlasIndex label={eyebrow} className="mb-4" />
      ) : null}
      <h1 className="max-w-4xl font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
        {title}
      </h1>
      {lead ? (
        <p className="mt-5 max-w-3xl text-pretty text-lg leading-8 text-muted">{lead}</p>
      ) : null}
    </div>
  );
}

/** A labelled section under a hairline rule. `index` is accepted but not drawn (see `AtlasIndex`). */
export function Section({
  title,
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
    <section className={cn("scroll-mt-24", className)}>
      {title ? (
        <div className="mb-5 border-b border-border-strong pb-3">
          <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-[1.375rem]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-[0.9375rem] leading-7 text-muted">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
