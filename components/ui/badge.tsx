import { cn } from "@/lib/utils";

/**
 * Strata data label — a quiet typographic microlabel, not a colored chip.
 * A thin squared leading rule + mono text in the muted-grey ramp; the verdigris
 * accent is reserved for the few statuses that genuinely need emphasis. Category
 * colour lives only in FramingBadge (the framing-category dimension), so the
 * multicolour pale-pill look is gone everywhere else.
 */
export function Badge({
  accent = false,
  className,
  children,
}: {
  accent?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border-l-2 pl-1.5 font-mono text-[11px] leading-none",
        accent ? "border-accent text-accent" : "border-border-strong text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
