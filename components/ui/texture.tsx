import { cn } from "@/lib/utils";

/**
 * Faint connective texture for large empty areas — original hand-authored flow
 * lines (NOT a grid; the sibling sites use grids / vertical rules). Stretches
 * to fill its positioned parent, decorative only, very low opacity.
 */
export function FlowTexture({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      preserveAspectRatio="none"
      viewBox="0 0 600 400"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-foreground opacity-[0.05]",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {/* converging contour flows, all bending toward a right-of-centre node */}
      <path d="M-20 70 C 160 40, 300 150, 430 200 S 620 250, 760 210" />
      <path d="M-20 130 C 170 110, 300 175, 430 200 S 640 215, 760 150" />
      <path d="M-20 200 C 180 200, 300 200, 430 200 S 660 200, 760 200" />
      <path d="M-20 270 C 170 290, 300 225, 430 200 S 640 185, 760 250" />
      <path d="M-20 330 C 160 360, 300 250, 430 200 S 620 150, 760 190" />
    </svg>
  );
}
