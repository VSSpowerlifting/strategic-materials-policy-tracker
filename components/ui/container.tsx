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
 * Standard page heading, drawn as a centred title block: breadcrumb trail, serif title (the shared
 * `.page-title` scale), lead, then a sheet rule with a centre tick that the page body hangs from. Detail pages
 * pass `breadcrumbs` so the page's place in its journey is said once. `eyebrow` is accepted for existing callers
 * but no longer drawn: the header already names the section, and a label above every title said it twice.
 * `align="start"` keeps the block on the left edge for pages whose heading shares a row with controls.
 */
export function PageHeading({
  title,
  lead,
  breadcrumbs,
  align = "centre",
  className,
}: {
  eyebrow?: string;
  index?: string;
  title: string;
  lead?: React.ReactNode;
  breadcrumbs?: readonly Crumb[];
  align?: "centre" | "start";
  className?: string;
}) {
  const centred = align === "centre";
  return (
    <header className={cn(centred && "title-block", className)}>
      {breadcrumbs?.length ? (
        <Breadcrumbs items={breadcrumbs} className={cn("mb-6", centred && "[&_ol]:justify-center")} />
      ) : null}
      <h1 className="page-title max-w-4xl text-foreground">{title}</h1>
      {lead ? (
        <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted sm:text-[1.0625rem] sm:leading-8">{lead}</p>
      ) : null}
      <hr className="sheet-rule mt-10 w-full" data-centre={centred ? "" : undefined} />
    </header>
  );
}

/**
 * A labelled section under a hairline rule. `index` is accepted but not drawn (see `AtlasIndex`).
 *
 * `collapsed` turns the section into a native disclosure: the heading, an optional record `count` and the
 * description stay visible in the summary, and the body opens on demand. Use it for secondary groupings that
 * a reader does not need on first pass; never to hide a qualifier that changes how a visible figure reads.
 */
/**
 * `description` is always shown whole: it carries the qualifiers a reader needs to interpret the section. `note`
 * is an optional, page-authored disclosure for supplementary explanation, with a label that says what it holds
 * ("Counting rules", "How days are counted"). Nothing is split automatically.
 */
export type SectionNote = { label: string; body: React.ReactNode };

export function Section({
  id,
  title,
  description,
  note,
  count,
  collapsed = false,
  children,
  className,
}: {
  id?: string;
  title?: string;
  index?: string;
  description?: React.ReactNode;
  note?: SectionNote;
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
  const desc = description || note ? (
    <>
      {description ? <p className="mt-1.5 max-w-3xl text-[0.9375rem] leading-7 text-muted">{description}</p> : null}
      {note ? (
        <details className="max-w-3xl">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-display text-sm text-foreground [&::-webkit-details-marker]:hidden">
            <span className="link-quiet">{note.label}</span>
          </summary>
          <p className="pb-2 text-sm leading-6 text-muted">{note.body}</p>
        </details>
      ) : null}
    </>
  ) : null;

  if (collapsed && title) {
    const noun = count === 1 ? "item" : "items";
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
