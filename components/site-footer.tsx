import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";
import { site } from "@/lib/site";
import { formatDateLongUS } from "@/lib/format";

const footerLinks = [
  { href: "/research", label: "Research" },
  { href: "/markets", label: "Markets" },
  { href: "/events", label: "Policy" },
  { href: "/capital", label: "Capital" },
  { href: "/projects", label: "Projects" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border-strong bg-background [main:has([data-flush-footer])+&]:mt-0">
      <Container width="wide" className="py-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div>
            <Wordmark markClassName="h-10" />
            <p className="mt-3 text-sm text-muted">
              Research by <Link href="/about" className="text-foreground underline decoration-border-strong underline-offset-4">Benjamin Yang</Link>
            </p>
          </div>
          <nav aria-label="Footer" className="flex max-w-xl flex-wrap gap-x-5 gap-y-3 font-display text-sm">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-9 flex flex-col justify-between gap-2 border-t border-border pt-5 font-display text-xs text-faint sm:flex-row">
          <p>Records revised <time dateTime={site.revisedOn}>{formatDateLongUS(site.revisedOn)}</time>.</p>
          <p><Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">Sources and methodology</Link></p>
        </div>
      </Container>
    </footer>
  );
}
