import { cn } from "@/lib/utils";
import { researchCovers } from "@/lib/photography";
import { PhotoPlate } from "./photo-plate";

/* Named frames, so a page picks a proportion without passing class strings through a content attribute. */
const FRAMES = {
  card: "aspect-[16/9]",
  feature: "aspect-[16/9]",
  banner: "aspect-[4/3] sm:aspect-[2/1] lg:aspect-[21/9]",
} as const;

/**
 * Cover for a publication in the research gallery. The publication is named by `data-cover` (its route
 * segment): the cover is presentation keyed off the entry it sits in, and the registry in
 * `lib/photography.ts` decides whether it is a captioned photograph or a typographic plate.
 */
export function ResearchCover({
  "data-cover": slug,
  "data-frame": frameName = "card",
  "data-caption": caption = "credit",
  sizes = "(min-width: 1024px) 40vw, 100vw",
  priority = false,
  className,
}: {
  "data-cover": string;
  "data-frame"?: keyof typeof FRAMES;
  "data-caption"?: "full" | "credit";
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const cover = researchCovers[slug];
  const frame = FRAMES[frameName];
  if (!cover) return null;
  if (cover.kind === "photo") {
    return <PhotoPlate photo={cover.photo} frame={frame} sizes={sizes} priority={priority} caption={caption} className={className} />;
  }
  const long = cover.mark.length > 3;
  return (
    <div
      aria-hidden
      className={cn("flex flex-col items-center justify-center border border-border bg-elevated text-center", frame, className)}
    >
      <span className="font-display text-xs text-faint">{cover.line}</span>
      <span className={cn("mt-2 font-editorial font-light leading-none text-foreground", long ? "text-[clamp(2rem,5vw,3.5rem)]" : "text-[clamp(4.5rem,11vw,8rem)]")}>
        {cover.mark}
      </span>
    </div>
  );
}
