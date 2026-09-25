"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { headerNav, navGroups, site } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";

const isActive = (pathname: string, href: string, exact = false) =>
  exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

const isCurrent = (pathname: string, item: (typeof headerNav)[number]) =>
  isActive(pathname, item.href, item.exact) || (item.alsoCurrentFor ?? []).some((h) => isActive(pathname, h));

/**
 * Disclosure state for the small-screen menu: closes on Escape (returning focus to the toggle), on a click or
 * focus move outside `container`, and on navigation. A disclosure, not an ARIA menu: the links stay ordinary
 * links in tab order.
 */
function useDisclosure(pathname: string) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Close on navigation: adjust state during render rather than in an effect.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    const onOutside = (e: Event) => {
      if (container.current && !container.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [open]);

  return [open, setOpen, container, toggle] as const;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5 shrink-0">
      <rect x="2" y="3" width="12" height="10.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function RecordAsOf({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap font-display text-xs text-muted", className)}>
      <CalendarIcon />
      <span>
        Record as of <time dateTime={site.lastUpdated} className="tnum font-semibold text-foreground">{formatDate(site.lastUpdated)}</time>
      </span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen, menuBox, menuToggle] = useDisclosure(pathname);
  const menuId = useId();

  // "/" jumps to search from anywhere that is not a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      router.push("/search");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <header className="sticky top-0 z-40 border-b border-border-strong bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div ref={menuBox}>
        <Container width="wide" className="flex h-16 items-center gap-5 lg:h-[4.5rem] lg:gap-8">
          <Link href="/" aria-label={`${site.name}, overview`} className="shrink-0">
            <Wordmark markClassName="h-9 lg:h-12" priority />
          </Link>

          <nav aria-label="Main" className="hidden min-w-0 items-stretch gap-1 self-stretch lg:flex">
            {headerNav.map((item) => {
              const current = isCurrent(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "relative flex items-center px-3 font-display text-[0.9375rem] text-muted transition-colors hover:text-foreground",
                    current && "font-medium text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3 lg:gap-5">
            <Link
              href="/search"
              className="hidden h-9 w-48 items-center gap-2 rounded-md border border-border-strong bg-card/60 px-3 font-display text-sm text-muted transition-colors hover:border-accent/50 hover:text-foreground xl:flex"
            >
              <SearchIcon />
              <span className="flex-1">Search the record</span>
              <kbd className="rounded border border-border-strong px-1.5 font-mono text-[10px] text-faint">/</kbd>
            </Link>
            <Link
              href="/search"
              aria-label="Search the record"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground xl:hidden"
            >
              <SearchIcon />
            </Link>
            <RecordAsOf className="hidden lg:inline-flex" />
            <button
              ref={menuToggle}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md border border-border-strong px-3 font-display text-sm text-foreground transition-colors hover:bg-elevated lg:hidden",
                menuOpen && "bg-elevated",
              )}
            >
              <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4">
                <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Menu
            </button>
          </div>
        </Container>

        {/* Small screens: what the record is as of, kept in view under the bar. */}
        <div className="border-t border-border lg:hidden">
          <Container width="wide" className="flex h-9 items-center justify-between gap-3">
            <RecordAsOf />
            <span className="font-display text-xs text-faint">Not a live feed</span>
          </Container>
        </div>

        {/* Small screens: the six main links, then every page in its group. */}
        <nav id={menuId} aria-label="Main" hidden={!menuOpen} className="max-h-[calc(100dvh-6.25rem)] overflow-y-auto border-t border-border lg:hidden">
          <Container width="wide" className="py-5">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-0.5 border-b border-border pb-4 sm:grid-cols-3">
              {headerNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(pathname, item) ? "page" : undefined}
                    className={cn(
                      "block rounded px-2 py-2 font-display text-sm text-foreground hover:bg-elevated",
                      isCurrent(pathname, item) && "font-semibold text-accent",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {navGroups.map((g) => (
                <div key={g.label}>
                  <p className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{g.label}</p>
                  <ul className="mt-2 space-y-0.5">
                    {g.items.map((i) => (
                      <li key={i.href}>
                        <Link
                          href={i.href}
                          aria-current={isActive(pathname, i.href) ? "page" : undefined}
                          className={cn(
                            "block rounded px-2 py-1.5 font-display text-sm text-muted hover:bg-elevated hover:text-foreground",
                            isActive(pathname, i.href) && "font-semibold text-accent",
                          )}
                        >
                          {i.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </nav>
      </div>
    </header>
  );
}
