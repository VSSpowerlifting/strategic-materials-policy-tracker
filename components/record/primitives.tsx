/**
 * Shared anatomy of a record-detail page (event, financial row, project, material): a centred title block
 * closed by the sheet rule, a definition grid of facts, then a left-aligned reading column with a narrow rail.
 * Presentation only: every figure, status and date is handed in already derived.
 */
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { PageContents } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export type StatusTone = "accent" | "negative" | "ochre" | "neutral";

const TONE: Record<StatusTone, string> = {
  accent: "text-accent",
  negative: "text-negative",
  ochre: "text-ochre",
  neutral: "text-foreground",
};

/**
 * The record's current status, said once: the status label, then the dated detail the page already holds.
 * It is the title block's one emphasised line, so nothing else in the block is set in colour.
 */
export function StatusLine({
  label,
  tone = "neutral",
  prefix,
  children,
}: {
  label: React.ReactNode;
  tone?: StatusTone;
  /** What kind of status this is, when the bare label could be misread (e.g. an attributed activity report). */
  prefix?: string;
  children?: React.ReactNode;
}) {
  return (
    <p
      data-record-status
      className="mt-8 inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-4 gap-y-1 border-y border-border-strong px-4 py-2.5 font-display text-[0.9375rem] leading-6 text-muted"
    >
      {prefix ? <span>{prefix}</span> : null}
      <strong className={cn("font-semibold", TONE[tone])}>{label}</strong>
      {children}
    </p>
  );
}

/** One identifying item under the title: a date, an issuer, a record id. Items are spaced, never dot-joined. */
export function IdentityItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <li className={cn("min-w-0", className)}>{children}</li>;
}

/** The record identifier, in the one place mono is used. */
export function RecordId({ id }: { id: string }) {
  return <span className="font-mono text-[0.8125rem] text-faint [overflow-wrap:anywhere]">{id}</span>;
}

export function RecordTitleBlock({
  breadcrumbs,
  device,
  title,
  subtitle,
  identity,
  status,
  children,
}: {
  breadcrumbs: readonly Crumb[];
  /** A restrained typographic device above the title (an element symbol on a material dossier). */
  device?: React.ReactNode;
  title: string;
  /** Original-language title, a project line or a standfirst. */
  subtitle?: React.ReactNode;
  /** `IdentityItem`s: the one-line identification. */
  identity?: React.ReactNode;
  status?: React.ReactNode;
  /** A single action that belongs with the title (save, download). */
  children?: React.ReactNode;
}) {
  return (
    <header className="title-block settle">
      <Breadcrumbs items={breadcrumbs} className="mb-7 [&_ol]:justify-center" />
      {device}
      <h1 className="page-title max-w-4xl text-foreground">{title}</h1>
      {subtitle}
      {identity ? (
        <ul className="mt-6 flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1.5 font-display text-[0.9375rem] leading-6 text-muted">
          {identity}
        </ul>
      ) : null}
      {status}
      {children ? <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">{children}</div> : null}
      <hr className="sheet-rule mt-10 w-full" data-centre="" />
    </header>
  );
}

/** The record's facts as a definition grid. An unknown stays in the grid, in its own words. */
export function RecordFacts({
  label,
  flush = false,
  className,
  children,
}: {
  /** Accessible name, e.g. "Record facts". */
  label: string;
  /** Directly under the title block: the sheet rule is the grid's top rule, so the grid draws none of its own. */
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // Each cell rules its own foot, so a short last row would leave a part-width line; the cells overlap the
    // grid's own bottom rule by a pixel and the grid closes on one full-width hairline.
    <dl
      aria-label={label}
      className={cn("fact-grid overflow-hidden border-b border-border [&>div]:-mb-px", flush ? "mt-0" : "mt-10", className)}
      style={flush ? { borderTop: 0 } : undefined}
    >
      {children}
    </dl>
  );
}

export function RecordFact({
  label,
  wide = false,
  children,
  ...rest
}: {
  label: string;
  /** Spans two grid columns from the small breakpoint, for lists and quoted wording. */
  wide?: boolean;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "className">) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")} {...rest}>
      <dt>{label}</dt>
      <dd className="[overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/** A field the sources leave open. Always rendered: an unknown is a finding, not an omission. */
export function Unknown({ children = "Not stated" }: { children?: React.ReactNode }) {
  return <span className="text-faint">{children}</span>;
}

/** A second line inside a fact: how an attribution or allocation was made. */
export function FactNote({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-[0.8125rem] leading-5 text-muted">{children}</span>;
}

/** Reading text at the body measure. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("max-w-[38rem] text-pretty text-[1.0625rem] leading-8 text-foreground", className)}>{children}</p>;
}

/** A qualifier that changes how the lines beside it read: body measure, quiet, never collapsed. */
export function Qualifier({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("max-w-[38rem] text-pretty text-[0.9375rem] leading-7 text-muted", className)}>{children}</p>;
}

/** A quiet hairline list: one rule above, one under each item, no boxes. */
export function RecordList({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ul aria-label={label} className={cn("border-t border-border", className)}>
      {children}
    </ul>
  );
}

/** A small heading over a group inside a section (a sub-list, one of two timelines). */
export function GroupHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("label mb-3", className)}>{children}</h3>;
}

/** A titled block in the right rail. A `div`, so the first `section h2` on the page is a body heading. */
export function RailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="label border-b border-border pb-2">{title}</h2>
      <div className="mt-3 font-display text-sm leading-6">{children}</div>
    </div>
  );
}

/**
 * Body grid: the reading column and a narrow rail at desktop, one column below it. The in-page contents sit in
 * the rail at desktop and as one wrapping line above the body on smaller screens; only one is displayed.
 */
export function RecordLayout({
  contents,
  mobileContents = true,
  rail,
  children,
}: {
  contents?: readonly { href: string; label: string }[];
  /** False when a block above the body already carries the section links on small screens. */
  mobileContents?: boolean;
  rail?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-12 lg:mt-16">
      {contents?.length && mobileContents ? <PageContents items={contents} className="mb-12 lg:hidden" /> : null}
      <div className="grid gap-x-14 gap-y-14 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* The site header with its section row is taller than the shared sections' scroll margin, so anchors in the body clear it here. */}
        <div className="min-w-0 space-y-14 [&_[id]]:scroll-mt-32">{children}</div>
        <aside
          aria-label="Contents and related records"
          className="space-y-8 lg:sticky lg:top-32 lg:max-h-[calc(100vh-9.5rem)] lg:self-start lg:overflow-y-auto"
        >
          {contents?.length ? (
            <nav aria-label="On this page" className="hidden font-display text-sm lg:block">
              <p className="label border-b border-border pb-2">On this page</p>
              <ul className="mt-3 space-y-1.5">
                {contents.map((i) => (
                  <li key={i.href}>
                    <a href={i.href} className="text-muted hover:text-accent">
                      {i.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          {rail}
        </aside>
      </div>
    </div>
  );
}
