"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { navGroups, primaryNav, site } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/brand";

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

/** Groups with only the items not already inline on desktop. */
const moreGroups = navGroups
  .map((g) => ({ label: g.label, items: g.items.filter((i) => !i.primary && i.href !== "/search") }))
  .filter((g) => g.items.length);

/**
 * Disclosure state for one toggle: closes on Escape (returning focus to the
 * toggle), on a click or focus move outside `container`, and on navigation.
 * A disclosure, not an ARIA menu: the links stay ordinary links in tab order.
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

function NavLink({ href, label, pathname, className }: { href: string; label: string; pathname: string; className?: string }) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "whitespace-nowrap rounded px-2 py-1 font-display text-sm text-muted transition-colors hover:bg-elevated hover:text-foreground",
        active && "bg-elevated font-semibold text-accent",
        className,
      )}
    >
      {label}
    </Link>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={cn("h-3 w-3 transition-transform motion-reduce:transition-none", open && "rotate-180")}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen, moreBox, moreToggle] = useDisclosure(pathname);
  const [menuOpen, setMenuOpen, menuBox, menuToggle] = useDisclosure(pathname);
  const moreId = useId();
  const menuId = useId();
  const moreActive = moreGroups.some((g) => g.items.some((i) => isActive(pathname, i.href)));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div ref={menuBox}>
        <Container className="flex h-14 items-center gap-4 lg:gap-6">
          <Link href="/" className="shrink-0 text-base">
            <Wordmark label={site.shortName} markClassName="h-[1.35rem] w-[1.35rem]" />
          </Link>
          <span className="hidden font-mono text-[10px] text-faint sm:block">{site.scopeStart}–</span>
          <span className="mx-1 hidden h-4 w-px shrink-0 bg-border lg:block" aria-hidden />

          {/* Desktop: the primary set inline, the rest under "More". */}
          <nav aria-label="Main" className="hidden min-w-0 items-center gap-1 lg:flex">
            {primaryNav.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} />
            ))}
            <div ref={moreBox} className="relative">
              <button
                ref={moreToggle}
                type="button"
                aria-expanded={moreOpen}
                aria-controls={moreId}
                onClick={() => setMoreOpen((o) => !o)}
                className={cn(
                  "inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-1 font-display text-sm text-muted transition-colors hover:bg-elevated hover:text-foreground",
                  (moreOpen || moreActive) && "bg-elevated text-foreground",
                  moreActive && "font-semibold text-accent",
                )}
              >
                More
                <Chevron open={moreOpen} />
              </button>
              <div
                id={moreId}
                hidden={!moreOpen}
                className="absolute right-0 top-full mt-2 w-[26rem] rounded-lg border border-border-strong bg-card p-4"
              >
                <div className="grid grid-cols-3 gap-4">
                  {moreGroups.map((g) => (
                    <div key={g.label}>
                      <p className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{g.label}</p>
                      <ul className="mt-2 space-y-0.5">
                        {g.items.map((i) => (
                          <li key={i.href}>
                            <NavLink {...i} pathname={pathname} className="block" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <NavLink href="/search" label="Search" pathname={pathname} />
            <button
              ref={menuToggle}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded border border-border-strong px-2.5 py-1 font-display text-sm text-foreground transition-colors hover:bg-elevated lg:hidden",
                menuOpen && "bg-elevated",
              )}
            >
              Menu
              <Chevron open={menuOpen} />
            </button>
          </div>
        </Container>

        {/* Small screens: every group in one in-flow panel, Capital & Control second. */}
        <nav
          id={menuId}
          aria-label="Main"
          hidden={!menuOpen}
          className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-border lg:hidden"
        >
          <Container className="grid grid-cols-2 gap-x-6 gap-y-5 py-5 sm:grid-cols-4">
            {navGroups.map((g) => (
              <div key={g.label}>
                <p className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{g.label}</p>
                <ul className="mt-2 space-y-0.5">
                  {g.items.map((i) => (
                    <li key={i.href}>
                      <NavLink href={i.href} label={i.label} pathname={pathname} className="block py-1.5" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Container>
        </nav>
      </div>
    </header>
  );
}
