import { cn } from "@/lib/utils";

/**
 * Status tones. Colour carries meaning or nothing: `accent` for what is in force or paid, `negative` for what
 * has ended, lapsed or been withdrawn, `ochre` for a caution, a designation or something still pending, and
 * `neutral` for everything else. Ochre is carried by the rule and the label stays in ink, because ochre text
 * falls just short of 4.5:1 on the page.
 */
export type BadgeTone = "neutral" | "accent" | "negative" | "ochre";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-border-strong text-muted",
  accent: "border-accent text-accent",
  negative: "border-negative text-negative",
  ochre: "border-ochre text-foreground",
};

/**
 * Data label — a quiet typographic microlabel, not a coloured chip: a thin squared leading rule and the label,
 * with no fill. Category colour lives only in FramingBadge (the framing-category dimension).
 */
export function Badge({
  accent = false,
  tone,
  className,
  children,
}: {
  /** Shorthand for `tone="accent"`, kept for existing callers. */
  accent?: boolean;
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-5 items-center border-l-2 pl-2 font-display text-xs leading-5",
        TONES[tone ?? (accent ? "accent" : "neutral")],
        className,
      )}
    >
      {children}
    </span>
  );
}
