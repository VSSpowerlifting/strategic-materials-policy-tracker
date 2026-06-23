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
    <figure className="plate flex h-full flex-col overflow-hidden rounded-lg border border-border-strong transition-colors hover:border-accent/40">
      {/* Classification rail — how this passage is coded */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-2.5">
        <span aria-hidden className="h-3 w-[5px] shrink-0 rounded-[1px] bg-accent" />
        <span className="rail">Framing anchor</span>
        <span className="ml-auto inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
          <FramingBadges categories={claim.category} short />
        </span>
      </div>
      {/* Evidence — the quoted passage in the original language is the hero object */}
      <div className="flex-1 border-l-[5px] border-accent px-5 py-4">
        <blockquote
          lang={lang}
          className="text-pretty font-serif text-xl leading-relaxed text-foreground"
        >
          {claim.quoteOriginal}
        </blockquote>
        {isTranslated ? (
          <p className="mt-3 leading-7 text-muted">
            <span className="font-mono text-xs text-accent/70">EN&nbsp;</span>
            {claim.quoteEn}
          </p>
        ) : null}
      </div>
      {/* Provenance rail — where the anchor comes from */}
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border bg-elevated/40 px-5 py-3 font-mono text-xs text-faint">
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
      </figcaption>
      {claim.notes ? (
        <p className="border-t border-border px-5 py-3 text-sm leading-6 text-faint">
          {claim.notes}
        </p>
      ) : null}
    </figure>
  );
}
