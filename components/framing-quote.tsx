import { ExtLink } from "@/components/ui/ext-link";
import { ConfidenceBadge, FramingBadges } from "@/components/labels";
import { enSourceLabels } from "@/lib/labels";
import type { FramingClaim, Source } from "@/lib/types";

const hasCJK = (s: string) => /[㐀-鿿]/.test(s);

/**
 * The signature element: a framing classification anchored to a quoted passage
 * in the original language, with its translation and full provenance. A framing
 * label is never shown without this anchor.
 */
export function FramingQuote({
  claim,
  source,
}: {
  claim: FramingClaim;
  source?: Source;
}) {
  const isTranslated = claim.quoteEn.trim() !== claim.quoteOriginal.trim();
  const lang = hasCJK(claim.quoteOriginal) ? "zh" : undefined;

  return (
    <figure className="overflow-hidden rounded-lg border bg-card">
      <div className="border-l-2 border-accent/60 px-5 py-4">
        <blockquote
          lang={lang}
          className="text-pretty text-lg leading-relaxed text-foreground"
        >
          {claim.quoteOriginal}
        </blockquote>
        {isTranslated ? (
          <p className="mt-3 text-sm leading-7 text-muted">
            <span className="text-faint">EN&nbsp;</span>
            {claim.quoteEn}
          </p>
        ) : null}
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-5 py-3 text-xs text-faint">
        <FramingBadges categories={claim.category} short />
        {source ? (
          <>
            <span aria-hidden>·</span>
            <ExtLink href={source.url}>{source.publisher}</ExtLink>
            <ConfidenceBadge confidence={source.confidence} />
          </>
        ) : null}
        <span aria-hidden>·</span>
        <span>{enSourceLabels[claim.quoteEnSource]}</span>
      </figcaption>
      {claim.notes ? (
        <p className="border-t px-5 py-3 text-xs leading-5 text-faint">{claim.notes}</p>
      ) : null}
    </figure>
  );
}
