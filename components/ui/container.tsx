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
    <div className={cn("flex items-baseline gap-3 font-display text-xs", className)}>
      <span className="text-accent">{label}</span>
      <span aria-hidden className="h-px flex-1 self-center bg-border" />
    </div>
  );
}

/**
 * Standard page heading: breadcrumb trail or atlas kicker / Archivo title (the shared `.page-title` scale) / lead. Detail pages pass
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
      <h1 className="page-title max-w-4xl font-display text-balance font-semibold tracking-tight">
        {title}
      </h1>
      {lead ? (
        <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted sm:text-[1.0625rem] sm:leading-8">{lead}</p>
      ) : null}
    </div>
  );
}

/**
 * A labelled section under a hairline rule. `index` is accepted but not drawn (see `AtlasIndex`).
 *
 * `collapsed` turns the section into a native disclosure: the heading, an optional record `count` and the
 * description stay visible in the summary, and the body opens on demand. Use it for secondary groupings that
 * a reader does not need on first pass; never to hide a qualifier that changes how a visible figure reads.
 */
export function Section({
  id,
  title,
  description,
  count,
  collapsed = false,
  children,
  className,
}: {
  id?: string;
  title?: string;
  index?: string;
  description?: React.ReactNode;
  count?: number;
  collapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const heading = title ? (
    <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-[1.375rem]">
      {title}
      {count !== undefined ? (
        <span className="tnum ml-2 align-baseline font-display text-base font-normal text-faint">{count}</span>
      ) : null}
    </h2>
  ) : null;
  const desc = description ? (
    <p className="mt-1.5 max-w-3xl text-[0.9375rem] leading-7 text-muted">{description}</p>
  ) : null;

  if (collapsed && title) {
    const noun = count === 1 ? "record" : "records";
    return (
      <section id={id} className={cn("scroll-mt-24", className)}>
        <div className="border-b border-border-strong pb-3">
          {heading}
          {desc}
        </div>
        <details className="section-disclosure group">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-display text-sm font-medium text-accent hover:text-accent-strong">
            <span aria-hidden className="inline-block transition-transform group-open:rotate-90 motion-reduce:transition-none">
              ›
            </span>
            <span className="group-open:hidden">{count !== undefined ? `Show ${count} ${noun}` : "Show"}</span>
            <span className="hidden group-open:inline">{count !== undefined ? `Hide ${count} ${noun}` : "Hide"}</span>
          </summary>
          <div className="pb-2 pt-3">{children}</div>
        </details>
      </section>
    );
  }

  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      {title ? (
        <div className="mb-5 border-b border-border-strong pb-3">
          {heading}
          {desc}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * In-page contents for long directory pages: one line of jump links, wrapping on small screens. Each `href` must
 * point at an `id` on the same page.
 */
export function PageContents({ items, className }: { items: readonly { href: string; label: string }[]; className?: string }) {
  return (
    <nav aria-label="On this page" className={cn("font-display text-sm", className)}>
      <p className="text-xs text-faint">On this page</p>
      <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
        {items.map((i) => (
          <li key={i.href}>
            <a href={i.href} className="text-muted underline decoration-border-strong underline-offset-4 hover:text-accent hover:decoration-accent">
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
