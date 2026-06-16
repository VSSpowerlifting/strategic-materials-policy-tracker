import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading } from "@/components/ui/container";
import { FramingQuote } from "@/components/framing-quote";
import { FramingBadge, JurisdictionTag } from "@/components/labels";
import { framingCategoryLabels } from "@/lib/labels";
import { FRAMING_CATEGORIES } from "@/lib/types";
import {
  getAllFramingClaims,
  getEventById,
  getFramingGroupedByCategory,
  getSourceById,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Comparative framing",
  description:
    "How China, the US and the EU justify their materials policy — grouped by framing category, each label anchored to a quoted passage in the original language.",
};

export default function FramingPage() {
  const groups = getFramingGroupedByCategory();
  const all = getAllFramingClaims();
  const counts = new Map<string, number>();
  for (const c of FRAMING_CATEGORIES) {
    counts.set(
      c,
      all.filter((f) => f.category.includes(c)).length,
    );
  }

  return (
    <Container className="py-12">
      <PageHeading
        eyebrow="The signature view"
        title="Comparative framing"
        lead="Every government reaches for the language of security — but they do not mean the same thing. Beijing frames control as national security and non-proliferation; Washington and Brussels frame access as economic security and supply-chain resilience. Each label below is assigned only from a quoted passage, never inferred from context."
      />

      {/* Category reference strip */}
      <div className="mt-8 flex flex-wrap gap-2">
        {FRAMING_CATEGORIES.map((c) => {
          const n = counts.get(c) ?? 0;
          return (
            <span
              key={c}
              className={n === 0 ? "opacity-40" : undefined}
              title={n === 0 ? "Not yet observed in a coded quote" : undefined}
            >
              <FramingBadge category={c} short />
              <span className="tnum ml-1 align-middle text-[11px] text-faint">
                {n}
              </span>
            </span>
          );
        })}
      </div>

      <div className="mt-12 space-y-14">
        {groups.map(({ category, claims }) => (
          <section key={category} className="scroll-mt-20">
            <div className="mb-1 flex items-center gap-3">
              <FramingBadge category={category} />
              <span className="tnum text-xs text-faint">
                {claims.length} {claims.length === 1 ? "anchor" : "anchors"}
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              {framingCategoryLabels[category]}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {claims.map((f) => {
                const ev = getEventById(f.eventId);
                return (
                  <div key={f.id}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <JurisdictionTag code={f.actor} withName />
                      {ev ? (
                        <Link
                          href={`/events/${ev.id}`}
                          className="truncate text-xs text-faint hover:text-accent"
                        >
                          {ev.titleEn} →
                        </Link>
                      ) : null}
                    </div>
                    <FramingQuote claim={f} source={getSourceById(f.sourceId)} />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-14 max-w-prose text-sm leading-6 text-faint">
        Categories are multi-select: a single passage can carry more than one label
        when the text supports it. Definitions for every category are on the{" "}
        <Link href="/methodology#labels" className="text-accent hover:underline">
          methodology page
        </Link>
        . Framing that has not yet been anchored to a verified quote is left
        uncoded rather than guessed.
      </p>
    </Container>
  );
}
