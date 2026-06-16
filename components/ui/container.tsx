import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

/** Standard page heading: eyebrow / title / lead description. */
export function PageHeading({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow ? (
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      {lead ? (
        <p className="mt-4 text-pretty text-base leading-7 text-muted">{lead}</p>
      ) : null}
    </div>
  );
}

/** A labelled section with a hairline rule, used down the long pages. */
export function Section({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("scroll-mt-20", className)}>
      {title ? (
        <div className="mb-4 border-b pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-faint">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
