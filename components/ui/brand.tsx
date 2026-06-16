import { cn } from "@/lib/utils";

/**
 * The chokepoint mark — original SVG, no image asset. Two supply lines enter
 * from the left and two leave to the right, all necking through a single
 * central node: a supply line pinching through a point. Drawn in currentColor
 * (set to verdigris by callers); crisp down to ~20px.
 */
export function ChokepointMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("h-5 w-5", className)}
    >
      <path d="M3.5 5.5 L12 12 L3.5 18.5" />
      <path d="M20.5 5.5 L12 12 L20.5 18.5" />
      {/* knockout keeps the chokepoint node reading over the converging lines */}
      <circle cx="12" cy="12" r="2.2" fill="var(--bg)" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="3.5" cy="5.5" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18.5" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="5.5" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="18.5" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Header lockup: the chokepoint mark in verdigris beside an Archivo wordmark.
 * `label` defaults to the short name; pass the full name for the footer.
 */
export function Wordmark({
  label,
  className,
  markClassName,
}: {
  label: string;
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ChokepointMark className={cn("text-accent", markClassName)} />
      <span className="font-display font-semibold tracking-tight">{label}</span>
    </span>
  );
}
