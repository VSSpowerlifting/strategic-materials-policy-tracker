import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Container, PageHeading } from "@/components/ui/container";
import { FramingQuote } from "@/components/framing-quote";
import { FramingBadge } from "@/components/labels";
import { ActorMonogram } from "@/components/actor-monogram";
import {
  framingCategoryLabels,
  jurisdictionLabels,
  jurisdictionShort,
  FRAMING_HUES,
} from "@/lib/labels";
import { FRAMING_CATEGORIES, JURISDICTIONS } from "@/lib/types";
import type { JurisdictionCode } from "@/lib/types";
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

// Stable actor order so a given actor sits in a comparable position across every
// category block — the comparison is the point of the page.
const ACTOR_ORDER = new Map<JurisdictionCode, number>(
  JURISDICTIONS.map((j, i) => [j, i]),
);

export default function FramingPage() {
  const groups = getFramingGroupedByCategory();
  const all = getAllFramingClaims();
  const counts = new Map<string, number>();
  for (const c of FRAMING_CATEGORIES) {
    counts.set(c, all.filter((f) => f.category.includes(c)).length);
  }

  return (
    <Container width="wide" className="py-12">
      <PageHeading
        index="—"
        eyebrow="The signature view"
        title="Comparative framing"
        lead="Every government reaches for the language of security — but they do not mean the same thing. Beijing frames control as national security and non-proliferation; Washington and Brussels frame access as economic security and supply-chain resilience. Each label below is assigned only from a quoted passage, never inferred from context."
      />

      {/* Category legend — a structured register, not a badge cloud */}
      <div className="mt-8 overflow-hidden rounded-lg border border-border-strong plate">
        <div className="border-b border-b-border px-4 py-2.5">
          <span className="rail">Categories in this dataset</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {FRAMING_CATEGORIES.map((c) => {
            const n = counts.get(c) ?? 0;
            return (
              <div
                key={c}
                className={cn(
                  "flex items-center justify-between gap-2 border-b border-r border-border px-4 py-2.5",
                  n === 0 && "opacity-40",
                )}
                title={n === 0 ? "Not yet observed in a coded quote" : undefined}
              >
                <FramingBadge category={c} short />
                <span className="tnum rail text-faint">{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 space-y-16">
        {groups.map(({ category, claims }, gi) => {
          const ordered = [...claims].sort(
            (a, b) =>
              (ACTOR_ORDER.get(a.actor) ?? 99) - (ACTOR_ORDER.get(b.actor) ?? 99),
          );
          return (
            <section key={category} className="scroll-mt-20">
              {/* Category band — color-keyed to its category; analytical infrastructure */}
              <div
                style={{ "--oxide": FRAMING_HUES[category] } as React.CSSProperties}
                className="oxide-rule border-b border-b-border pl-3 pb-3"
              >
                <div className="flex items-end gap-4">
                  <span className="tnum font-display text-3xl font-bold leading-none text-foreground">
                    {String(gi + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-muted">
                    {framingCategoryLabels[category]}
                  </h2>
                  <span className="rail tnum ml-auto text-faint">
                    {claims.length} {claims.length === 1 ? "anchor" : "anchors"}
                  </span>
                </div>
              </div>

              {/* Comparative cells — one per actor claim, consistent order */}
              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {ordered.map((f) => {
                  const ev = getEventById(f.eventId);
                  return (
                    <div key={f.id} className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2.5">
                          <ActorMonogram code={jurisdictionShort[f.actor]} size="sm" />
                          <span className="font-display text-sm font-semibold tracking-tight">
                            {jurisdictionLabels[f.actor]}
                          </span>
                        </span>
                        {ev ? (
                          <Link
                            href={`/events/${ev.id}`}
                            className="max-w-[8rem] truncate font-mono text-[11px] text-faint hover:text-accent"
                            title={ev.titleEn}
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
          );
        })}
      </div>

      <p className="mt-16 max-w-prose leading-7 text-faint">
        Categories are multi-select: a single passage can carry more than one label
        when the text supports it. Definitions for every category are on the{" "}
        <Link href="/methodology#labels" className="font-display text-accent hover:text-accent-strong">
          methodology page
        </Link>
        . Framing that has not yet been anchored to a verified quote is left
        uncoded rather than guessed.
      </p>
    </Container>
  );
}
