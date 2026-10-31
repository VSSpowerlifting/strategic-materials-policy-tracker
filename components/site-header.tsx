"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { headerNav, isActivePath as isActive, isNavCurrent as isCurrent, journeys, site } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";

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
        Corpus revised <time dateTime={site.lastUpdated} className="tnum font-semibold text-foreground">{formatDate(site.lastUpdated)}</time>
      </span>
    </span>
  );
}

/** `aria-current` for a link: "page" when it is this page, "true" when it is the section this page sits in. */
const ariaCurrent = (pathname: string, href: string, inSection: boolean) =>
  pathname === href ? ("page" as const) : inSection ? ("true" as const) : undefined;

/** The journey that owns the current route, if any: the one whose header item is marked current. */
const currentJourney = (pathname: string) => {
  const i = headerNav.findIndex((item) => isCurrent(pathname, item));
  return i === -1 ? undefined : journeys[i];
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen, menuBox, menuToggle] = useDisclosure(pathname);
  const menuId = useId();
  const journey = currentJourney(pathname);
  const hasViewsRow = !!journey && journey.views.length > 1;
  const closeMenu = () => setMenuOpen(false);

  // "/" jumps to search from anywhere that is not a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector("dialog:modal")) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      router.push("/search");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <header className="sticky top-0 z-40 border-b border-border-strong bg-background">
      <div ref={menuBox}>
        <Container width="wide" className="flex h-16 items-center gap-5 lg:gap-8">
          {/* Not shrink-0: below 360px the name's tracking tightens to the widest value that keeps two lines at 320px. */}
          <Link href="/" aria-label={`${site.name}, overview`} aria-current={pathname === "/" ? "page" : undefined} className="min-w-0">
            <Wordmark markClassName="h-9 lg:h-11" textClassName="max-[359px]:tracking-[0.01em]" priority />
          </Link>

          <nav aria-label="Main" className="hidden min-w-0 items-stretch gap-1 self-stretch lg:flex">
            {headerNav.map((item) => {
              const current = isCurrent(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={ariaCurrent(pathname, item.href, current)}
                  className={cn(
                    "relative flex items-center whitespace-nowrap px-3 font-display text-[0.9375rem] text-muted transition-colors hover:text-foreground",
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
              aria-current={pathname === "/search" ? "page" : undefined}
              className="hidden h-9 w-48 items-center gap-2 rounded-md border border-border-strong bg-card/60 px-3 font-display text-sm text-muted transition-colors hover:border-accent/50 hover:text-foreground xl:flex"
            >
              <SearchIcon />
              <span className="flex-1">Search the record</span>
              <kbd className="rounded border border-border-strong px-1.5 font-mono text-[10px] text-faint">/</kbd>
            </Link>
            <Link
              href="/search"
              aria-label="Search the record"
              aria-current={pathname === "/search" ? "page" : undefined}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground xl:hidden"
            >
              <SearchIcon />
            </Link>
            <RecordAsOf className="hidden 2xl:inline-flex" />
            <button
              ref={menuToggle}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border-strong px-3 font-display text-sm text-foreground transition-colors hover:bg-elevated max-[399px]:w-9 max-[399px]:px-0 lg:hidden",
                menuOpen && "bg-elevated",
              )}
            >
              <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4">
                <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="max-[399px]:sr-only">Menu</span>
            </button>
          </div>
        </Container>

        {/* The current journey's own views. Shown only inside a journey that has more than one, so the header
            never lists every page at once; on narrow screens the row scrolls inside itself. The scroller clips
            anything outside it, so the focus ring is drawn inset and a focused view is scrolled fully into sight. */}
        {hasViewsRow ? (
          <div className="border-t border-border">
            <Container width="wide" className="flex h-9 items-center gap-6">
              <nav aria-label={`${journey.label} views`} className="-mx-2 flex min-w-0 flex-1 items-stretch self-stretch overflow-x-auto [scrollbar-width:none]">
                {journey.views.map((view) => {
                  const current = isActive(pathname, view.href);
                  return (
                    <Link
                      key={view.href}
                      href={view.href}
                      aria-current={ariaCurrent(pathname, view.href, current)}
                      onFocus={(e) => e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
                      className={cn(
                        "flex shrink-0 items-center whitespace-nowrap px-2 font-display text-[0.8125rem] text-muted transition-colors hover:text-foreground focus-visible:outline-offset-[-2px]",
                        current && "font-semibold text-accent",
                      )}
                    >
                      {view.label}
                    </Link>
                  );
                })}
              </nav>
              <RecordAsOf className="hidden lg:inline-flex 2xl:hidden" />
            </Container>
          </div>
        ) : null}

        {/* Small screens: the overview, the five journeys with the question each answers, then utilities. A
            journey's own views appear in the row above once it is open. */}
        {/* The menu sits below the sticky bar (4rem) and, inside a journey, the views row (2.25rem), plus their
            borders; its height leaves room for both so its last items can always scroll into view. */}
        <nav
          id={menuId}
          aria-label="Main"
          hidden={!menuOpen}
          className={cn(
            "overflow-y-auto border-t border-border lg:hidden",
            hasViewsRow ? "max-h-[calc(100dvh-6.375rem)]" : "max-h-[calc(100dvh-4.125rem)]",
          )}
        >
          <Container width="wide" className="py-4">
            <ul className="divide-y divide-border">
              <li>
                <Link href="/" onClick={closeMenu} aria-current={pathname === "/" ? "page" : undefined} className={cn("block py-3 font-display text-base text-foreground", pathname === "/" && "font-semibold text-accent")}>
                  Overview
                </Link>
              </li>
              {journeys.map((j, i) => {
                const current = isCurrent(pathname, headerNav[i]);
                return (
                  <li key={j.href}>
                    <Link href={j.href} onClick={closeMenu} aria-current={ariaCurrent(pathname, j.href, current)} className="block py-3">
                      <span className={cn("block font-display text-base text-foreground", current && "font-semibold text-accent")}>{j.label}</span>
                      <span className="mt-0.5 block text-sm leading-5 text-muted">{j.question}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-strong pt-4 font-display text-sm">
              <Link href="/search" onClick={closeMenu} className="text-muted hover:text-foreground">Search</Link>
              <Link href="/saved" onClick={closeMenu} className="text-muted hover:text-foreground">Saved</Link>
              <Link href="/about" onClick={closeMenu} className="text-muted hover:text-foreground">About Benjamin Yang</Link>
              <RecordAsOf className="w-full" />
            </div>
          </Container>
        </nav>
      </div>
    </header>
  );
}
