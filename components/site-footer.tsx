import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";
import { nav, site } from "@/lib/site";
import { formatDate } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <Container className="py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-md">
            <Wordmark label={site.name} className="text-sm" />
            <p className="mt-3 text-pretty leading-7 text-muted">{site.tagline}</p>
            <p className="mt-3 text-sm leading-6 text-faint">
              Scope: policy instruments and official framing across China, the US,
              the EU, and allied states from {site.scopeStart}. This is not a market
              model — no price or supply forecasting. See the{" "}
              <Link className="font-display text-accent hover:text-accent-strong" href="/methodology">
                methodology
              </Link>{" "}
              and{" "}
              <Link
                className="font-display text-accent hover:text-accent-strong"
                href="/methodology#sources"
              >
                source &amp; translation policy
              </Link>
              .
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-1.5 font-display text-sm sm:grid-cols-3">
            {nav.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="text-muted transition-colors hover:text-foreground"
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-5 font-display text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="tnum font-mono">
            {site.version} · Last updated {formatDate(site.lastUpdated)}
          </p>
          <p>
            Not legal or compliance advice. Categorical labels only — no synthetic
            risk scores.
          </p>
        </div>
      </Container>
    </footer>
  );
}
