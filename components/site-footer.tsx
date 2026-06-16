import Link from "next/link";
import { Container } from "@/components/ui/container";
import { nav, site } from "@/lib/site";
import { formatDate } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t">
      <Container className="py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-md">
            <p className="font-mono text-sm font-semibold">{site.name}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{site.tagline}</p>
            <p className="mt-3 text-xs leading-5 text-faint">
              Scope: policy instruments and official framing across China, the US,
              the EU, and allied states from {site.scopeStart}. This is not a market
              model — no price or supply forecasting. See the{" "}
              <Link className="text-accent hover:underline" href="/methodology">
                methodology
              </Link>{" "}
              and{" "}
              <Link
                className="text-accent hover:underline"
                href="/methodology#sources"
              >
                source &amp; translation policy
              </Link>
              .
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-1.5 text-sm sm:grid-cols-3">
            {nav.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="text-muted hover:text-foreground"
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t pt-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="tnum">
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
