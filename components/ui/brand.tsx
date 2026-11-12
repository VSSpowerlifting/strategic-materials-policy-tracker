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
 * Header and footer lockup: the supplied mark beside the full project name, set in the editorial serif in ink.
 * The name is live text, so it stays selectable and readable by assistive technology; it is always the full
 * name, so the mark never stands in for it. Below `lg` it breaks into two lines to keep the header to one row.
 */
export function Wordmark({
  className,
  markClassName,
  textClassName,
  priority = false,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LatticeMark className={markClassName} priority={priority} />
      <span className={cn("font-editorial text-[0.9375rem] leading-[1.15] text-brand sm:text-[1.0625rem]", textClassName)}>
        Strategic Materials <br className="lg:hidden" />
        Policy Tracker
      </span>
    </span>
  );
}
