"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type MotionKind = "chart" | "cards" | "chain";

/**
 * Progressive enhancement: server HTML and no-JS users see all content.
 * An IntersectionObserver enables a single reveal as the section enters view.
 * Reduced-motion users see the unanimated layout.
 */
export function ScrollReveal({
  kind,
  children,
  className,
}: {
  kind: MotionKind;
  children?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.dataset.motionEntered = "true";
        observer.disconnect();
      },
      { threshold: 0.08, rootMargin: "0px 0px -3% 0px" },
    );
    element.dataset.motionReady = "true";
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("scroll-reveal", className)} data-motion-kind={kind}>
      {children}
    </div>
  );
}
