import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatDateLong } from "@/lib/format";
import { photographs, type Photograph, type PhotographId } from "@/lib/photography";

/**
 * A registered photograph with its caption. The caption is part of the plate, not an option: it names what is
 * in frame, the place, the date, the catalogue number and the credit, and (in the `full` form) states what
 * the image does not show. `frame` sets the frame's aspect ratio with utility classes so it can change by
 * breakpoint; the image is cropped to it around the photograph's registered `focus`.
 */
export function PhotoPlate({
  photo,
  frame = "aspect-[16/9]",
  sizes = "100vw",
  priority = false,
  caption = "full",
  className,
}: {
  photo: PhotographId;
  frame?: string;
  sizes?: string;
  priority?: boolean;
  caption?: "full" | "credit";
  className?: string;
}) {
  const p: Photograph = photographs[photo];
  return (
    <figure className={cn("m-0", className)}>
      <div className={cn("photo-plate", frame)}>
        <Image
          src={p.src}
          alt={p.alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={p.src.startsWith("https://")}
          style={{ objectFit: "cover", objectPosition: p.focus }}
        />
      </div>
      <figcaption className="plate-caption">
        <span>
          {p.shows}, {p.place}, <time dateTime={p.acquired}>{p.dateLabel ?? formatDateLong(p.acquired)}</time>.
          {caption === "full" && p.limits ? ` ${p.limits}` : null}
        </span>
        <span>
          <a href={p.sourceUrl} className="link-quiet">{p.photoId}</a>. {p.credit}.{" "}
          <a href={p.rights.url} className="link-quiet" rel="license">Rights</a>.
        </span>
      </figcaption>
    </figure>
  );
}
