import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { formatDateLong } from "@/lib/format";
import { fi002, fi002Screens } from "@/lib/fi002";

/** Exhibit scale in ktpa. Fixed so the four model requirements share one linear axis that starts at zero. */
const SCALE_MAX = 450;
const TICKS = [0, 100, 200, 300, 400] as const;

/**
 * The homepage flagship: FI002's investment question, finding and recommendation beside its central exhibit.
 * Every figure comes from the approved publication (`lib/fi002.ts` and the article); the bars are drawn from
 * `fi002Screens` and are modeled requirements, never production forecasts. Sits on the paper surface so the
 * featured analysis reads as a printed exhibit after the dark masthead.
 */
export function FeaturedCase() {
  return (
    <section
      id="featured-analysis"
      aria-labelledby="featured-analysis-heading"
      className="on-paper border-t border-border-strong bg-paper text-paper-foreground"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-paper-border pb-3">
          <p className="kicker">Featured analysis · Strategy &amp; Finance</p>
          <p className="font-display text-sm text-paper-muted">
            Escondida, Chile · data cutoff <time dateTime={fi002.cutoff}>{formatDateLong(fi002.cutoff)}</time>
          </p>
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16">
          <div className="min-w-0">
            <h2
              id="featured-analysis-heading"
              className="max-w-xl font-display text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-balance sm:text-[2.125rem]"
            >
              <Link href={fi002.path} className="hover:text-paper-accent">
                {fi002.title}
              </Link>
            </h2>
            <p className="mt-5 max-w-xl text-pretty font-display text-[1.0625rem] leading-8 text-paper-foreground/85">
              BHP estimates $5.4–6.3 billion of gross capital for a concentrator to replace Los Colorados at
              Escondida, with first production expected in 2031–32. The financial model tests how much annual
              copper output, preserved or added against a no-build plan, would justify that spending.
            </p>

            <div className="mt-8 grid gap-6 border-t border-paper-border pt-6 sm:grid-cols-2 sm:gap-8">
              <div>
                <h3 className="kicker">Finding</h3>
                <p className="mt-2 font-display text-[0.9375rem] leading-7">
                  At $5.85 billion of base-case capital and a long-term copper price of $10,494/t, the project needs about{" "}
                  <strong className="font-semibold">199 ktpa</strong> of production-equivalent benefit for 20 years.
                  Shorter or later benefit periods and a combined stress case raise the requirement to 275–416 ktpa.
                </p>
              </div>
              <div>
                <h3 className="kicker">Recommendation</h3>
                <p className="mt-2 font-display text-[0.9375rem] leading-7">
                  Keep engineering and permitting moving before construction approval. BHP has reported $0.8 billion
                  of gross pre-commitment funding approved for that preparatory work.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={fi002.path} className="research-button research-button-paper">
                Read the analysis
              </Link>
              <a href={`${fi002.assets}/model.xlsx`} className="research-button-secondary research-button-secondary-paper" download>
                Financial model (.xlsx)
              </a>
              <a href={`${fi002.assets}/report.pdf`} className="font-display text-sm font-semibold text-paper-accent underline underline-offset-4">
                Report (PDF)
              </a>
            </div>
          </div>

          <figure className="m-0 min-w-0" aria-labelledby="featured-exhibit-title">
            <figcaption>
              <p id="featured-exhibit-title" className="font-display text-base font-semibold">
                Annual production-equivalent benefit needed to justify the investment
              </p>
              <p className="mt-1 font-display text-sm text-paper-muted">
                Thousand tonnes of copper a year (ktpa), four model scenarios
              </p>
            </figcaption>

            <ScrollReveal kind="chart" className="mt-6">
              <div className="relative">
                {/* Gridlines share the bar track's coordinates: the track starts after the label column. */}
                <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-[minmax(0,1fr)_3.25rem] gap-x-3 sm:grid-cols-[11rem_minmax(0,1fr)_3.25rem]">
                  <span className="hidden sm:block" />
                  <span className="relative">
                    {TICKS.map((t) => (
                      <span
                        key={t}
                        className="absolute inset-y-0 border-l border-dashed border-paper-border"
                        style={{ left: `${(t / SCALE_MAX) * 100}%` }}
                      />
                    ))}
                  </span>
                </div>
              <ol className="relative m-0 list-none p-0">
                {fi002Screens.map((s, i) => (
                  <li
                    key={s.name}
                    className="relative grid grid-cols-[minmax(0,1fr)_3.25rem] items-center gap-x-3 gap-y-1.5 border-b border-paper-border py-3.5 first:border-t sm:grid-cols-[11rem_minmax(0,1fr)_3.25rem] sm:gap-y-0"
                  >
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <p className={i === 0 ? "font-display text-sm font-semibold" : "font-display text-sm font-medium"}>
                        {s.name}
                      </p>
                      <p className="font-display text-xs leading-5 text-paper-muted">
                        <span>{s.capital}</span> · <span>{s.price}</span> · <span>{s.years}</span>
                      </p>
                    </div>
                    <div aria-hidden className="h-3.5">
                      <span
                        className="exhibit-bar block h-full rounded-[1px]"
                        style={{
                          width: `${(s.exact / SCALE_MAX) * 100}%`,
                          background: i === 0 ? "var(--paper-accent)" : "color-mix(in oklab, var(--paper-accent) 55%, var(--paper))",
                          "--bar-order": i,
                        } as React.CSSProperties}
                      />
                    </div>
                    <p className="tnum text-right font-display text-lg font-semibold leading-none">
                      {s.ktpa}
                      <span className="sr-only"> ktpa</span>
                    </p>
                  </li>
                ))}
              </ol>
              </div>
              <div aria-hidden className="mt-1.5 grid grid-cols-[minmax(0,1fr)_3.25rem] gap-x-3 sm:grid-cols-[11rem_minmax(0,1fr)_3.25rem]">
                <span className="hidden sm:block" />
                <span className="relative h-4 font-display text-[0.6875rem] text-paper-muted">
                  {TICKS.map((t) => (
                    <span key={t} className="tnum absolute -translate-x-1/2 first:translate-x-0" style={{ left: `${(t / SCALE_MAX) * 100}%` }}>
                      {t}
                    </span>
                  ))}
                </span>
              </div>
            </ScrollReveal>

            <p className="mt-5 font-display text-xs leading-5 text-paper-muted">
              Model-derived requirements under stated assumptions, not forecasts of plant output. Base-case capital
              of $5.85 billion is the midpoint of BHP’s range; the combined stress case adds 20% to capital, lowers
              the long-term copper price and delays benefits by two years.{" "}
              <a href={`${fi002.assets}/methodology.md`} className="font-semibold text-paper-accent underline underline-offset-2">
                Methodology
              </a>{" "}
              ·{" "}
              <a href={`${fi002.assets}/evidence-register.csv`} className="font-semibold text-paper-accent underline underline-offset-2">
                Evidence register
              </a>
            </p>
          </figure>
        </div>
      </div>
    </section>
  );
}
