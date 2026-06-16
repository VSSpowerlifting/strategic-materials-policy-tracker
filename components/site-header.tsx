"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { nav, site } from "@/lib/site";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <Container className="flex h-14 items-center gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-[3px] bg-accent" aria-hidden />
          <span className="font-mono text-sm font-semibold tracking-tight">
            {site.shortName}
          </span>
        </Link>
        <nav className="-mx-1 flex items-center gap-0.5 overflow-x-auto">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-elevated hover:text-foreground",
                  active && "bg-elevated text-foreground",
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
