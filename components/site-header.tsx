"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { nav, site } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <Container className="flex h-14 items-center gap-6">
        <Link href="/" className="shrink-0 text-base">
          <Wordmark label={site.shortName} markClassName="h-[1.35rem] w-[1.35rem]" />
        </Link>
        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 border-transparent px-1.5 py-1 font-display text-sm text-muted transition-colors hover:text-foreground",
                  active && "border-accent text-accent",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </Container>
    </header>
  );
}
