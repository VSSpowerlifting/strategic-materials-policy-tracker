"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  EVIDENCE_JOURNEY_HREF, exploreJourneys, headerNav, isActivePath as isActive, isNavCurrent as isCurrent,
  journeyFor, journeys, sectionFor, sections, site,
} from "@/lib/site";
import { formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";

/**
 * Disclosure state for the menus: closes on Escape (returning focus to the toggle), on a click or focus move
 * outside `container`, and on navigation. A disclosure, not an ARIA menu: the links stay ordinary links in tab
 * order.
 */
function useDisclosure<T extends HTMLElement>(pathname: string) {
  const [open, setOpen] = useState(false);
  const container = useRef<T>(null);
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
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function RecordAsOf({ className }: { className?: string }) {
  return (
    <span className={cn("whitespace-nowrap font-display text-xs text-faint", className)}>
      Revised <time dateTime={site.revisedOn} className="tnum text-muted">{formatDate(site.revisedOn)}</time>
    </span>
  );
}

/** `aria-current` for a link: "page" when it is this page, "true" when it is the section this page sits in. */
const ariaCurrent = (pathname: string, href: string, inSection: boolean) =>
  pathname === href ? ("page" as const) : inSection ? ("true" as const) : undefined;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen, menuBox, menuToggle] = useDisclosure<HTMLDivElement>(pathname);
  const [switchOpen, setSwitchOpen, switchBox, switchToggle] = useDisclosure<HTMLDivElement>(pathname);
  const menuId = useId();
  const switchId = useId();
  const section = sectionFor(pathname);
  const journey = journeyFor(pathname);
  const inEvidence = journey?.href === EVIDENCE_JOURNEY_HREF;
  // The second row: a journey's own views, or the journeys themselves on the Explore entry page.
  const onExploreHub = isActive(pathname, "/explore");
  const hasViewsRow = (!!journey && journey.views.length > 1) || onExploreHub;
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-[2px]">
      <div ref={menuBox}>
        {/* One row, three columns: the name, the four destinations on the centre line, search and menu. */}
        <Container width="wide" className="grid h-16 grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Link href="/" aria-label={`${site.name}, overview`} aria-current={pathname === "/" ? "page" : undefined} className="min-w-0 justify-self-start">
            <Wordmark markClassName="h-7 sm:h-8" priority />
          </Link>

          <nav aria-label="Main" className="hidden items-stretch self-stretch md:flex">
            {sections.map((item) => {
              const current = section === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={ariaCurrent(pathname, item.href, current)}
                  className={cn(
                    "relative flex items-center px-4 font-display text-[0.9375rem] text-muted transition-colors hover:text-foreground lg:px-5",
                    current && "text-foreground after:absolute after:inset-x-4 after:bottom-[-1px] after:h-px after:bg-foreground lg:after:inset-x-5",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 justify-self-end">
            <Link
              href="/search"
              aria-label="Search SMPT"
              aria-current={pathname === "/search" ? "page" : undefined}
              className="inline-flex h-10 items-center gap-2 px-2.5 font-display text-sm text-muted transition-colors hover:text-foreground"
            >
              <SearchIcon />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden border border-border px-1.5 font-mono text-[10px] leading-4 text-faint xl:inline">/</kbd>
            </Link>
            <button
              ref={menuToggle}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex h-10 items-center gap-2 px-2.5 font-display text-sm text-foreground md:hidden"
            >
              <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4">
                {menuOpen ? (
                  <path d="m3.5 3.5 9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                ) : (
                  <path d="M2 5.5h12M2 10.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                )}
              </svg>
              <span className="max-[359px]:sr-only">{menuOpen ? "Close" : "Menu"}</span>
            </button>
          </div>
        </Container>

        {/* Inside a record journey: a switch between journeys, then the current journey's own views. On the
            Explore entry page the row lists the journeys. On narrow screens the views scroll inside the row; the
            scroller clips anything outside it, so the focus ring is drawn inset and a focused view is scrolled
            fully into sight. */}
        {hasViewsRow ? (
          <div className="border-t border-border">
            <Container width="wide" className="flex h-10 items-center gap-4">
              {journey && !inEvidence ? (
                <div ref={switchBox} className="relative shrink-0">
                  <button
                    ref={switchToggle}
                    type="button"
                    aria-expanded={switchOpen}
                    aria-controls={switchId}
                    onClick={() => setSwitchOpen((o) => !o)}
                    className="inline-flex h-10 items-center gap-1.5 font-display text-[0.8125rem] font-medium text-foreground"
                  >
                    {journey.label}
                    <svg viewBox="0 0 10 6" aria-hidden className={cn("h-1.5 w-2.5 transition-transform motion-reduce:transition-none", switchOpen && "rotate-180")}>
                      <path d="m1 1 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <nav
                    id={switchId}
                    aria-label="Explore"
                    hidden={!switchOpen}
                    className="absolute left-0 top-full z-50 w-[min(22rem,calc(100vw-2rem))] border border-border-strong bg-plate py-1 shadow-[0_12px_32px_-12px_rgb(27_30_33/0.28)]"
                  >
                    {exploreJourneys.map((j) => (
                      <Link
                        key={j.href}
                        href={j.href}
                        aria-current={j.href === journey.href ? "true" : undefined}
                        className={cn("block px-4 py-2.5 hover:bg-elevated", j.href === journey.href && "bg-elevated")}
                      >
                        <span className="block font-display text-sm font-medium text-foreground">{j.label}</span>
                        <span className="mt-0.5 block font-display text-xs leading-5 text-muted">{j.question}</span>
                      </Link>
                    ))}
                    <Link href="/explore" className="block border-t border-border px-4 py-2.5 font-display text-sm text-muted hover:bg-elevated hover:text-foreground">
                      All of Explore
                    </Link>
                  </nav>
                </div>
              ) : null}
              {journey && !inEvidence ? <span aria-hidden className="h-4 w-px shrink-0 bg-border-strong" /> : null}
              {journey ? (
                <nav aria-label={`${journey.label} views`} className="-mx-2 flex min-w-0 flex-1 items-stretch self-stretch overflow-x-auto [scrollbar-width:none]">
                  {inEvidence ? (
                    <Link href="/about" className="flex shrink-0 items-center whitespace-nowrap px-2 font-display text-[0.8125rem] text-muted transition-colors hover:text-foreground focus-visible:outline-offset-[-2px]">
                      About
                    </Link>
                  ) : null}
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
                          current && "text-foreground underline decoration-foreground decoration-1 underline-offset-[11px]",
                        )}
                      >
                        {view.label}
                      </Link>
                    );
                  })}
                </nav>
              ) : (
                <nav aria-label="Explore" className="-mx-2 flex min-w-0 flex-1 items-stretch self-stretch overflow-x-auto [scrollbar-width:none]">
                  {exploreJourneys.map((j) => (
                    <Link
                      key={j.href}
                      href={j.href}
                      onFocus={(e) => e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
                      className="flex shrink-0 items-center whitespace-nowrap px-2 font-display text-[0.8125rem] text-muted transition-colors hover:text-foreground focus-visible:outline-offset-[-2px]"
                    >
                      {j.label}
                    </Link>
                  ))}
                </nav>
              )}
              <RecordAsOf className="hidden lg:inline" />
            </Container>
          </div>
        ) : null}

        {/* Below md: the four destinations, with the record journeys listed under Explore, then utilities. The
            menu sits below the sticky bar (4rem) and, inside a journey, the views row (2.5rem), plus their
            borders; its height leaves room for both so its last items can always scroll into view. */}
        <nav
          id={menuId}
          aria-label="Main"
          hidden={!menuOpen}
          className={cn(
            "overflow-y-auto border-t border-border bg-background md:hidden",
            hasViewsRow ? "max-h-[calc(100dvh-6.625rem)]" : "max-h-[calc(100dvh-4.125rem)]",
          )}
        >
          <Container width="wide" className="pb-8 pt-2">
            <ul className="divide-y divide-border">
              <li>
                <Link href="/" onClick={closeMenu} aria-current={pathname === "/" ? "page" : undefined} className="block py-3.5 font-editorial text-xl text-foreground">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/research" onClick={closeMenu} aria-current={ariaCurrent(pathname, "/research", section === "/research")} className="block py-3.5 font-editorial text-xl text-foreground">
                  Research
                </Link>
              </li>
              <li className="py-3.5">
                <Link href="/explore" onClick={closeMenu} aria-current={ariaCurrent(pathname, "/explore", section === "/explore")} className="block font-editorial text-xl text-foreground">
                  Explore
                </Link>
                <ul className="mt-2 grid grid-cols-2 gap-x-4">
                  {exploreJourneys.map((j) => {
                    const current = isCurrent(pathname, headerNav[journeys.findIndex((x) => x.href === j.href)]);
                    return (
                      <li key={j.href}>
                        <Link href={j.href} onClick={closeMenu} aria-current={ariaCurrent(pathname, j.href, current)} className={cn("block py-2 font-display text-[0.9375rem] text-muted", current && "text-foreground")}>
                          {j.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li>
                <Link href="/markets" onClick={closeMenu} aria-current={ariaCurrent(pathname, "/markets", section === "/markets")} className="block py-3.5 font-editorial text-xl text-foreground">
                  Markets
                </Link>
              </li>
              <li className="py-3.5">
                <Link href="/about" onClick={closeMenu} aria-current={ariaCurrent(pathname, "/about", section === "/about")} className="block font-editorial text-xl text-foreground">
                  About
                </Link>
                <ul className="mt-2 grid grid-cols-2 gap-x-4">
                  {(journeys.find((j) => j.href === EVIDENCE_JOURNEY_HREF)?.views ?? []).map((view) => (
                    <li key={view.href}>
                      <Link href={view.href} onClick={closeMenu} aria-current={ariaCurrent(pathname, view.href, isActive(pathname, view.href))} className={cn("block py-2 font-display text-[0.9375rem] text-muted", isActive(pathname, view.href) && "text-foreground")}>
                        {view.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border-strong pt-4 font-display text-sm">
              <Link href="/search" onClick={closeMenu} className="text-muted hover:text-foreground">Search</Link>
              <Link href="/saved" onClick={closeMenu} className="text-muted hover:text-foreground">Saved</Link>
              <RecordAsOf className="w-full" />
            </div>
          </Container>
        </nav>
      </div>
    </header>
  );
}
