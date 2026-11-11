"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isActivePath, journeys } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";

const primaryLinks = [
  { href: "/research", label: "Research" },
  { href: "/markets", label: "Markets" },
  { href: "/events", label: "Policy" },
  { href: "/capital", label: "Capital" },
  { href: "/projects", label: "Projects" },
  { href: "/compare", label: "Compare" },
] as const;

const utilityLinks = [
  { href: "/materials", label: "Materials" },
  { href: "/sources", label: "Sources" },
  { href: "/methodology", label: "Methodology" },
  { href: "/data", label: "Downloads & API" },
  { href: "/about", label: "About" },
  { href: "/saved", label: "Saved records" },
] as const;

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-5 w-5">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="m10.5 10.5 3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-5 w-5">
      <path d="M2 4.5h12M2 8h12M2 11.5h12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [seenPath, setSeenPath] = useState(pathname);
  const mobileRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);

  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (moreRef.current) moreRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const outside = (event: MouseEvent | FocusEvent) => {
      if (!mobileRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("mousedown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [menuOpen]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector("dialog:modal")) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      router.push("/search");
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [router]);

  const active = (href: string) => {
    const journey = journeys.find((item) => item.href === href);
    return isActivePath(pathname, href) || !!journey?.views.some((item) => isActivePath(pathname, item.href));
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border-strong bg-background">
      <div ref={mobileRef}>
        <Container width="wide" className="flex h-16 items-center gap-4 lg:gap-7">
          <Link href="/" aria-label="Strategic Materials Policy Tracker home" aria-current={pathname === "/" ? "page" : undefined} className="min-w-0 shrink-0">
            <Wordmark markClassName="h-9 lg:h-10" textClassName="max-[359px]:tracking-[0.01em]" priority />
          </Link>

          <nav aria-label="Main" className="ml-auto hidden h-full items-stretch gap-0.5 lg:flex">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} aria-current={active(link.href) ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center whitespace-nowrap px-2.5 font-display text-sm text-muted transition-colors hover:text-foreground xl:px-3",
                  active(link.href) && "font-semibold text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent",
                )}>
                {link.label}
              </Link>
            ))}
            <details ref={moreRef} className="group relative flex items-center">
              <summary className="cursor-pointer list-item rounded px-3 py-3 font-display text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent">
                More
              </summary>
              <div className="absolute right-0 top-[calc(100%+1px)] z-50 max-h-[75vh] w-[min(39rem,calc(100vw-2rem))] overflow-y-auto rounded-b-lg border border-border-strong bg-background p-6 shadow-xl">
                <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                  {journeys.map((journey) => (
                    <div key={journey.href}>
                      <Link href={journey.href} onClick={() => moreRef.current?.removeAttribute("open")}
                        className="font-display text-sm font-semibold text-foreground hover:text-accent">
                        {journey.label}
                      </Link>
                      <ul className="mt-2 space-y-2">
                        {journey.views.filter((view) => view.href !== journey.href).map((view) => (
                          <li key={view.href}>
                            <Link href={view.href} onClick={() => moreRef.current?.removeAttribute("open")}
                              className="text-sm text-muted hover:text-foreground">{view.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div>
                    <p className="font-display text-sm font-semibold">Other</p>
                    <ul className="mt-2 space-y-2">
                      {utilityLinks.map((link) => (
                        <li key={link.href}>
                          <Link href={link.href} onClick={() => moreRef.current?.removeAttribute("open")}
                            className="text-sm text-muted hover:text-foreground">{link.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </details>
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link href="/search" aria-label="Search records" aria-current={pathname === "/search" ? "page" : undefined}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent">
              <SearchIcon />
            </Link>
            <button ref={menuButtonRef} type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}
              aria-controls="smpt-mobile-menu" onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-strong text-foreground lg:hidden">
              <MenuIcon />
            </button>
          </div>
        </Container>

        <nav id="smpt-mobile-menu" aria-label="Mobile main" hidden={!menuOpen}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border lg:hidden">
          <Container width="wide" className="py-4">
            <Link href="/" onClick={() => setMenuOpen(false)} className="block border-b border-border py-3 font-display text-base">Home</Link>
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                aria-current={active(link.href) ? "page" : undefined}
                className={cn("block border-b border-border py-3 font-display text-base", active(link.href) && "font-semibold text-accent")}>
                {link.label}
              </Link>
            ))}
            <details className="border-b border-border py-3">
              <summary className="cursor-pointer font-display text-base">More sections</summary>
              <div className="grid gap-5 pt-5 sm:grid-cols-2">
                {journeys.map((journey) => (
                  <div key={journey.href}>
                    <p className="font-display text-sm font-semibold text-foreground">{journey.label}</p>
                    <ul className="mt-2 space-y-2">
                      {journey.views.map((view) => (
                        <li key={view.href}>
                          <Link href={view.href} onClick={() => setMenuOpen(false)}
                            className="block py-1 text-sm text-muted hover:text-foreground">{view.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">Other</p>
                  <ul className="mt-2 space-y-2">
                    {utilityLinks.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} onClick={() => setMenuOpen(false)}
                          className="block py-1 text-sm text-muted hover:text-foreground">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          </Container>
        </nav>
      </div>
    </header>
  );
}
