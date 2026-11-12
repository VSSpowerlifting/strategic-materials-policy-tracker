import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";
import { site } from "@/lib/site";
import { formatDateLong } from "@/lib/format";

const footerColumns = [
  {
    label: "Research",
    links: [
      { href: "/research", label: "Library" },
      { href: "/markets", label: "Market Monitor" },
    ],
  },
  {
    label: "Explore",
    links: [
      { href: "/events", label: "Policy actions" },
      { href: "/capital", label: "Financing" },
      { href: "/projects", label: "Industrial projects" },
      { href: "/materials", label: "Materials" },
      { href: "/compare", label: "Compare" },
    ],
  },
  {
    label: "Evidence",
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: "/sources", label: "Sources" },
      { href: "/coverage", label: "Coverage" },
      { href: "/data", label: "Downloads" },
    ],
  },
  {
    label: "About",
    links: [
      { href: "/about", label: "About SMPT" },
      { href: "/search", label: "Search" },
      { href: "/saved", label: "Saved" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-border-strong bg-background [main:has([data-flush-footer])+&]:mt-0">
      <Container width="wide" className="pb-10 pt-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <Wordmark markClassName="h-8" />
            <p className="mt-4 max-w-xs font-display text-sm leading-6 text-muted">
              Research by{" "}
              <Link href="/about" className="link-quiet text-foreground">Benjamin Yang</Link>
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.label}>
                <p className="font-display text-xs text-faint">{column.label}</p>
                <ul className="mt-3 space-y-2.5 font-display text-sm">
                  {column.links.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-foreground hover:text-accent">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-2 border-t border-border pt-5 font-display text-xs leading-5 text-faint sm:flex-row">
          <p>Last revised <time dateTime={site.revisedOn}>{formatDateLong(site.revisedOn)}</time>. Coverage is selective.</p>
          <p>For research use; consult official sources and qualified advisers for legal decisions.</p>
        </div>
      </Container>
    </footer>
  );
}
