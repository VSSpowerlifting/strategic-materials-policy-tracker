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
    "Compare how tracked governments explain strategic-material policy measures, with each framing category anchored to a passage in the original source.",
};

// Stable actor order so a given actor sits in a comparable position across every
// category block — the comparison is the point of the page.
/** Quotation cells shown per category before the "Show more" disclosure (two rows at the widest layout). */
const VISIBLE_PER_CATEGORY = 6;

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
        eyebrow="Evidence"
        title="Comparative framing"
        lead="How each government explains its strategic-material measures, grouped by stated rationale. Every category rests on a quoted passage from the original source. A stated rationale is not evidence of a measure’s effect."
      />

      {/* Category legend doubles as the page's contents: each coded category jumps to its block. */}
      <nav aria-label="Framing categories" className="mt-8 overflow-hidden rounded-lg border border-border-strong plate">
        <div className="border-b border-b-border px-4 py-2.5">
          <span className="rail">Categories · coded quotations</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {FRAMING_CATEGORIES.map((c) => {
            const n = counts.get(c) ?? 0;
            const cell = cn(
              "flex min-h-11 items-center justify-between gap-2 border-b border-r border-border px-4 py-2.5",
              n === 0 && "opacity-40",
            );
            return n === 0 ? (
              <div key={c} className={cell} title="Not yet observed in a coded quote">
                <FramingBadge category={c} short />
                <span className="tnum rail text-faint">0</span>
              </div>
            ) : (
              <a key={c} href={`#${c}`} className={cn(cell, "hover:bg-card focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent")}>
                <FramingBadge category={c} short />
                <span className="tnum rail text-faint">{n}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <div className="mt-12 space-y-16">
        {groups.map(({ category, claims }) => {
          const ordered = [...claims].sort(
            (a, b) =>
              (ACTOR_ORDER.get(a.actor) ?? 99) - (ACTOR_ORDER.get(b.actor) ?? 99),
          );
          const renderCell = (f: (typeof ordered)[number]) => {
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
          };
          return (
            <section key={category} id={category} className="scroll-mt-20">
              {/* Category band — color-keyed to its category; analytical infrastructure */}
              <div
                style={{ "--oxide": FRAMING_HUES[category] } as React.CSSProperties}
                className="oxide-rule border-b border-b-border pl-3 pb-3"
              >
                <div className="flex items-baseline gap-4">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {framingCategoryLabels[category]}
                  </h2>
                  <span className="rail tnum ml-auto text-faint">
                    {claims.length} {claims.length === 1 ? "quotation" : "quotations"}
                  </span>
                </div>
              </div>

              {/* Comparative cells — one per actor claim, consistent order. The first rows stay open; the rest of a
                  long category sits behind a disclosure so every category block is reachable without long scrolling. */}
              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {ordered.slice(0, VISIBLE_PER_CATEGORY).map(renderCell)}
              </div>
              {ordered.length > VISIBLE_PER_CATEGORY ? (
                <details className="section-disclosure group mt-5">
                  <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-display text-sm font-medium text-accent hover:text-accent-strong">
                    <span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span>
                    <span className="group-open:hidden">Show {ordered.length - VISIBLE_PER_CATEGORY} more quotations</span>
                    <span className="hidden group-open:inline">Hide {ordered.length - VISIBLE_PER_CATEGORY} quotations</span>
                  </summary>
                  <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {ordered.slice(VISIBLE_PER_CATEGORY).map(renderCell)}
                  </div>
                </details>
              ) : null}
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
        . A framing category is assigned after its supporting quotation is verified.
      </p>
    </Container>
  );
}
