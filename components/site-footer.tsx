import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";
import { nav, secondaryNav, site } from "@/lib/site";
import { formatDateLong } from "@/lib/format";

/** "v0.6-capital-intelligence" → "0.6". */
const versionNumber = /^v?(\d+\.\d+)/.exec(site.version)?.[1] ?? site.version;

/**
 * Footer. Pages that end in a full-bleed section mark their root with `data-flush-footer`, which removes the
 * space above the footer so the two meet.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border-strong bg-background [main:has([data-flush-footer])+&]:mt-0">
      <Container width="wide" className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <div>
            <Wordmark markClassName="h-12" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">Method</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <li>Categorical labels only, never an invented score.</li>
              <li>Amounts stay in the source&apos;s currency and are never converted.</li>
              <li>Unknown fields stay empty or &ldquo;not yet coded&rdquo;, never guessed.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">Data</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Every record type as CSV and JSON, with its source links.</p>
            <p className="mt-2 space-y-1 font-mono text-xs leading-6 text-muted">
              <Link href="/data" className="block hover:text-foreground">/api/export/dataset.json</Link>
              <Link href="/data" className="block hover:text-foreground">/api/v1/ routes for each record type</Link>
            </p>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">Coverage</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Counts per government measure how deeply this project has researched it, not how much that government has done.
            </p>
          </div>
        </div>

        <nav aria-label="All pages" className="mt-10 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border pt-6 font-display text-sm">
          {[...nav, ...secondaryNav].map((i) => (
            <Link key={i.href} href={i.href} className="text-muted transition-colors hover:text-foreground">
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 font-display text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            Version {versionNumber}. Data as of {formatDateLong(site.lastUpdated)}.{" "}
            {site.monitoringStartedAt ? `Prospective monitoring began ${formatDateLong(site.monitoringStartedAt)}.` : "Prospective monitoring has not started."}
          </p>
          <p>
            <Link href="/methodology" className="hover:text-foreground">Methodology</Link>
            {" · "}
            <Link href="/coverage" className="hover:text-foreground">Coverage</Link>
            {" · "}
            <Link href="/data" className="hover:text-foreground">Downloads and API</Link>
          </p>
        </div>
        <p className="mt-3 font-display text-xs text-faint">Not legal or compliance advice.</p>
      </Container>
    </footer>
  );
}
