import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { DossierPayload } from "@/lib/material-dossier";

export function DossierHeader({ payload }: { payload: DossierPayload }) {
  const sections = [
    { href: "#supply-chain", label: "Supply chain" },
    { href: "#records", label: "Records by stage" },
    { href: "#capital-controls", label: "Capital and controls" },
    { href: "#timeline", label: "Timeline" },
    { href: "#events", label: "Events" },
    { href: "#related", label: "Cited by" },
    ...(payload.notes.fields.length || payload.notes.downstream.length ? [{ href: "#notes", label: "Editorial notes" }] : []),
  ];
  return (
    <header>
      <nav aria-label="Breadcrumb" className="font-display text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/materials" className="hover:text-foreground">
              Materials
            </Link>
          </li>
          <li aria-hidden className="text-faint">
            ›
          </li>
          <li aria-current="page" className="text-foreground">
            {payload.nameEn}
          </li>
        </ol>
      </nav>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{payload.nameEn}</h1>
        {payload.nameZh ? (
          <span lang="zh" className="font-serif text-2xl text-muted">
            {payload.nameZh}
          </span>
        ) : null}
        <span className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-xs text-faint" title="Symbol, for identification only">
          {payload.symbol}
        </span>
      </div>
      <p className="mt-4 max-w-3xl text-pretty text-lg leading-8 text-foreground/90">{payload.lede}</p>
      <p className="mt-2 font-display text-xs text-faint">
        Record as of <time dateTime={payload.asOf}>{formatDate(payload.asOf)}</time>. Counts are records of one kind at a time and are never added together.
      </p>
      {payload.groupNote ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          {payload.groupNote.text}{" "}
          {payload.groupNote.href ? (
            <Link href={payload.groupNote.href} className="text-accent hover:text-accent-strong">
              {payload.groupNote.linkText}
            </Link>
          ) : null}
        </p>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-4" aria-label={`${payload.nameEn} record counts`}>
        {payload.stats.map((s) => (
          <div key={s.key} className="bg-card p-4" data-stat={s.key}>
            <dt className="font-display text-xs text-muted">{s.label}</dt>
            <dd className="mt-1">
              <span className="tnum font-display text-3xl font-semibold leading-none text-foreground">{s.value}</span>
              <span className="mt-1.5 block text-xs leading-5 text-faint">{s.basis}</span>
              {s.sublabel ? <span className="block text-xs leading-5 text-faint">{s.sublabel}</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      <nav aria-label="On this page" className="mt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">On this page</p>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 font-display text-sm">
          {sections.map((s) => (
            <li key={s.href}>
              <a href={s.href} className="inline-flex min-h-8 items-center text-accent hover:text-accent-strong">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
