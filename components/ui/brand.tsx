import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The supplied SMPT lattice mark: a diamond of two offset dot grids, dark amber into light gold, the dots growing
 * toward the lower right. It is the artwork itself (`public/brand/smpt-lattice-mark.png`, cropped from the supplied
 * 8000 × 2000 logo with its transparent background), not a redraw; `next/image` serves it at the size needed.
 */
export function LatticeMark({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/smpt-lattice-mark.png"
      alt=""
      width={480}
      height={424}
      priority={priority}
      className={cn("h-9 w-auto shrink-0 select-none", className)}
    />
  );
}

/**
 * Header and footer lockup: the supplied mark beside the full project name in two tracked capitals lines, set in
 * the supplied logo's gold (`--brand-gold`). The name is live text, so it stays selectable and readable by
 * assistive technology; it is always the full name, so the mark never stands in for it.
 */
export function Wordmark({ className, markClassName, priority = false }: { className?: string; markClassName?: string; priority?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LatticeMark className={markClassName} priority={priority} />
      <span className="font-display text-[0.6875rem] font-medium uppercase leading-[1.25] tracking-[0.12em] text-brand">
        Strategic Materials
        <br />
        Policy Tracker
      </span>
    </span>
  );
}
