"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { siteMotionScope, siteMotionSelector } from "@/lib/site-motion";

/**
 * Observes editorial sections and explicitly marked directory cards across
 * routes. Works with server-rendered pages and subsequently filtered results.
 * Never alters scroll position, focus, sizing, source data, or the DOM order.
 *
 * Without JS, IntersectionObserver or permission for motion, all text,
 * controls, articles, charts and evidence remain visible.
 */
export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const scope = siteMotionScope(pathname);
    const selector = siteMotionSelector(scope);
    const main = document.getElementById("main-content");
    if (!main || !selector || !("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const tracked = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.dataset.siteMotionEntered = "true";
          observer.unobserve(element);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -4% 0px" },
    );

    const eligible = (el: HTMLElement) => {
      if (tracked.has(el) || el.closest("[data-motion-kind]")) return false;
      if (el.matches("section") && (el.querySelector("section") || el.querySelector("h1"))) return false;
      if (el.matches("article") && el.querySelector("section")) return false;
      if (el.closest("[hidden], [aria-hidden='true']")) return false;
      return true;
    };

    const register = (node: Element) => {
      const matches: HTMLElement[] = [];
      if (node.matches(selector)) matches.push(node as HTMLElement);
      matches.push(...node.querySelectorAll<HTMLElement>(selector));

      for (const element of matches) {
        if (!eligible(element)) continue;
        tracked.add(element);
        if (element.matches('[data-site-motion="card"], a.oxide-rule')) {
          const siblings = [...(element.parentElement?.children ?? [])].filter(
            (item) => item.matches('[data-site-motion="card"], a.oxide-rule'),
          );
          const position = Math.max(0, siblings.indexOf(element));
          element.style.setProperty("--site-motion-delay", `${(position % 5) * 55}ms`);
        }
        element.dataset.siteMotionReady = "true";
        observer.observe(element);
      }
    };

    register(main);
    // Client-side explorers swap results without a route transition. Newly
    // inserted cards join the observer once; surviving cards never replay.
    const mutations = new MutationObserver((changes) => {
      for (const change of changes) {
        for (const node of change.addedNodes) {
          if (node instanceof Element) register(node);
        }
      }
    });
    mutations.observe(main, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
      for (const element of tracked) {
        delete element.dataset.siteMotionReady;
        delete element.dataset.siteMotionEntered;
        element.style.removeProperty("--site-motion-delay");
      }
    };
  }, [pathname]);

  return null;
}
