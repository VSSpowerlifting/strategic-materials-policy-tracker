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
    <figure className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex-1 border-l-[3px] border-accent px-5 py-4">
        <blockquote
          lang={lang}
          className="text-pretty text-lg leading-relaxed text-foreground"
        >
          {claim.quoteOriginal}
        </blockquote>
        {isTranslated ? (
          <p className="mt-3 leading-7 text-muted">
            <span className="font-mono text-xs text-accent">EN&nbsp;</span>
            {claim.quoteEn}
          </p>
        ) : null}
      </div>
      <figcaption className="border-t border-border px-5 py-3 font-mono text-xs text-faint">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <FramingBadges categories={claim.category} short />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {source ? (
            <>
              <ExtLink href={source.url} className="font-mono">
                {source.publisher}
              </ExtLink>
              <ConfidenceBadge confidence={source.confidence} />
              <span className="text-border-strong" aria-hidden>/</span>
            </>
          ) : null}
          <span>{enSourceLabels[claim.quoteEnSource]}</span>
        </div>
      </figcaption>
      {claim.notes ? (
        <p className="border-t border-border px-5 py-3 text-sm leading-6 text-faint">
          {claim.notes}
        </p>
      ) : null}
    </figure>
  );
}
