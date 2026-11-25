import { MARK, MARK_SMALL, type MarkGeometry } from "@/lib/brand-mark";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The Stratellar mark, the "Marker Bed": two bed sequences either side of a fault, the right block thrown up so
 * the thin marker bed (the accent) can be matched across the break. Geometry comes from `lib/brand-mark.ts`, the
 * same source the generated logo files use, so the site and the artwork cannot drift.
 *
 * The beds take the current text colour and the marker takes the accent, so the mark follows whatever surface
 * it sits on. Pass `small` below 24 px: it is the two-bed reduction drawn for favicons and dense chrome.
 * The mark is decorative beside the name; give it a `title` only where it stands alone.
 */
export function Mark({
  className,
  small = false,
  title,
  markerClassName = "text-accent",
}: {
  className?: string;
  small?: boolean;
  title?: string;
  /** Colour of the marker bed. Defaults to the accent; pass a lighter tone on a dark ground. */
  markerClassName?: string;
}) {
  const geometry: MarkGeometry = small ? MARK_SMALL : MARK;
  return (
    <svg
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={cn("h-8 w-auto shrink-0 select-none", className)}
    >
      {geometry.shapes.map((shape) => (
        <path
          key={shape.d}
          d={shape.d}
          fill="currentColor"
          className={shape.role === "marker" ? markerClassName : undefined}
        />
      ))}
    </svg>
  );
}

/**
 * The lockup: the mark beside the name, set in the editorial serif. The name is live text, so it stays
 * selectable and readable by assistive technology. `descriptor` adds the line under the name; use it where the
 * name appears without other context (the footer, a cover), not in the header, where the navigation does that job.
 */
export function Wordmark({
  className,
  markClassName,
  textClassName,
  descriptor = false,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  descriptor?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3 text-brand", className)}>
      <Mark className={markClassName} />
      <span className="flex flex-col">
        <span className={cn("font-editorial text-[1.375rem] font-medium leading-none tracking-[0.004em] sm:text-2xl", textClassName)}>
          {site.name}
        </span>
        {descriptor ? (
          <span className="mt-1.5 font-display text-[0.6875rem] font-medium leading-none text-muted">
            {site.descriptor}
          </span>
        ) : null}
      </span>
    </span>
  );
}
