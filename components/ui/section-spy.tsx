"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { readingLine, sectionNavSelector, spyAxis } from "@/lib/section-spy";

/**
 * Marks where the reader is in a long page. For each in-page section list (the "On this page" rail on record
 * pages and the section lists of research publications) the link to the section crossing the reading line gets
 * `aria-current="location"`, and a malachite marker moves along the list's rule to it.
 *
 * It only reads positions: it never scrolls, changes focus or alters the document order. Observation uses
 * IntersectionObserver; there is no scroll listener. It also publishes the sticky header's height as
 * `--site-header-h`, so sticky bars below the header can sit flush with it.
 *
 * Without JavaScript the lists are ordinary links. Under reduced motion the marker moves without a transition.
 */
export function SectionSpy() {
  const pathname = usePathname();

  // The header's height, for sticky bars that sit below it. It changes with the breakpoint and the section row.
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("body > header, header.sticky");
    if (!header || !("ResizeObserver" in window)) return;
    const publish = () =>
      document.documentElement.style.setProperty("--site-header-h", `${Math.round(header.getBoundingClientRect().height)}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(header);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main || !("IntersectionObserver" in window)) return;

    const cleanups: Array<() => void> = [];
    for (const nav of main.querySelectorAll<HTMLElement>(sectionNavSelector)) {
      const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
      const pairs = links
        .map((link) => {
          const id = decodeURIComponent(link.getAttribute("href")!.slice(1));
          return { link, target: id ? document.getElementById(id) : null };
        })
        .filter((p): p is { link: HTMLAnchorElement; target: HTMLElement } => p.target !== null);
      if (pairs.length < 2) continue;
      cleanups.push(track(nav, pairs));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}

type Pair = { link: HTMLAnchorElement; target: HTMLElement };

function track(nav: HTMLElement, pairs: Pair[]): () => void {
  let active: Pair | null = null;
  let observer: IntersectionObserver | null = null;
  let footerObserver: IntersectionObserver | null = null;
  const header = document.querySelector<HTMLElement>("body > header, header.sticky");

  // The marker runs along the list's own rule: a left border on a vertical list, the bottom rule of a single-row
  // bar. A bar that wraps onto several rows has no single rule to run along, so it gets no marker.
  let axis: "x" | "y" = "y";
  let host: HTMLElement | null = null;
  const clearHost = () => {
    if (!host) return;
    delete host.dataset.spyTrack;
    for (const v of ["--spy-on", "--spy-x", "--spy-y", "--spy-w", "--spy-h"]) host.style.removeProperty(v);
    host = null;
  };
  const measureHost = () => {
    clearHost();
    const listHost = pairs[0].link.closest<HTMLElement>("ol, ul");
    axis = spyAxis(pairs.map((p) => p.link.getBoundingClientRect().top));
    host =
      axis === "y" && listHost && nav.contains(listHost) && parseFloat(getComputedStyle(listHost).borderLeftWidth) > 0
        ? listHost
        : axis === "x" && parseFloat(getComputedStyle(nav).borderBottomWidth) > 0
          ? nav
          : null;
    if (host) host.dataset.spyTrack = axis;
  };
  measureHost();
  nav.dataset.spyReady = "true";

  const place = () => {
    if (!host) return;
    if (!active) {
      host.style.setProperty("--spy-on", "0");
      return;
    }
    const h = host.getBoundingClientRect();
    const r = active.link.getBoundingClientRect();
    host.style.setProperty("--spy-on", "1");
    if (axis === "y") {
      host.style.setProperty("--spy-y", `${r.top - h.top}px`);
      host.style.setProperty("--spy-h", `${r.height}px`);
    } else {
      host.style.setProperty("--spy-x", `${r.left - h.left}px`);
      host.style.setProperty("--spy-w", `${r.width}px`);
    }
  };

  const setActive = (next: Pair | null) => {
    if (next === active) return;
    active?.link.removeAttribute("aria-current");
    active = next;
    active?.link.setAttribute("aria-current", "location");
    place();
  };

  const observe = () => {
    observer?.disconnect();
    footerObserver?.disconnect();
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const line = readingLine(window.innerHeight, headerHeight);
    // A one-pixel band at the reading line: the section crossing it is the one being read.
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pair = pairs.find((p) => p.target === entry.target);
          if (!pair) continue;
          if (entry.isIntersecting) setActive(pair);
          // Scrolled back above the first section: nothing is current.
          else if (pair === pairs[0] && entry.boundingClientRect.top > line) setActive(null);
        }
      },
      { rootMargin: `-${line}px 0px -${Math.max(0, window.innerHeight - line - 1)}px 0px`, threshold: 0 },
    );
    for (const p of pairs) observer.observe(p.target);

    // At the end of the page a short last section may never reach the line; the footer coming into view settles it.
    const footer = document.querySelector("footer");
    if (footer) {
      footerObserver = new IntersectionObserver(([entry]) => {
        const lastPair = pairs[pairs.length - 1];
        if (entry?.isIntersecting && lastPair.target.getBoundingClientRect().top < window.innerHeight) setActive(lastPair);
      });
      footerObserver.observe(footer);
    }
  };

  observe();
  let resizeFrame = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      measureHost();
      observe();
      place();
    });
  };
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    cancelAnimationFrame(resizeFrame);
    observer?.disconnect();
    footerObserver?.disconnect();
    active?.link.removeAttribute("aria-current");
    delete nav.dataset.spyReady;
    clearHost();
  };
}
