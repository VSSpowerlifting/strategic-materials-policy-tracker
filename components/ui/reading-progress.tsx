"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Site-level article progress. The research index is excluded by pathname.
 * The track is a fixed overlay; scrolling never moves or resizes content.
 */
export function ReadingProgress() {
  const pathname = usePathname();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!pathname || pathname === "/research" || pathname === "/research/") return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const available = Math.max(0, doc.scrollHeight - window.innerHeight);
      const position = Math.max(0, window.scrollY || doc.scrollTop);
      const progress = available === 0 ? 100 : Math.min(100, Math.max(0, Math.round((position / available) * 100)));
      setPercent(progress);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  if (!pathname || pathname === "/research" || pathname === "/research/") return null;

  return (
    <div
      className="reading-progress"
      role="progressbar"
      aria-label="Article reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <span className="reading-progress-fill" style={{ transform: `scaleX(${percent / 100})` }} />
    </div>
  );
}
