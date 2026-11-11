import Link from "next/link";
import { fi002, fi002Screens } from "@/lib/fi002";

/** FI002's published model outputs, not independently generated homepage estimates. */
const scenarioBars = fi002Screens.map((scenario) => ({
  name: scenario.name,
  ktpa: scenario.ktpa,
  share: (scenario.exact / 450) * 100,
}));

export function FeaturedCase() {
  return (
    <section aria-labelledby="featured-case-title" className="border-t border-border-strong">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.11em] text-accent">
            Featured Strategy &amp; Finance research
          </p>
          <span className="text-sm text-muted">Escondida · Chile · November 2026</span>
        </div>

        <div className="mt-7 grid items-start gap-10 lg:grid-cols-[minmax(0,0.83fr)_minmax(0,1.17fr)] lg:gap-14">
          <div className="flex flex-col items-start">
            <h2 id="featured-case-title" className="max-w-xl font-display text-3xl font-semibold leading-[1.13] tracking-tight text-balance sm:text-4xl xl:text-[2.75rem]">
              Evaluating BHP&apos;s $5.85 billion Escondida investment
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">
              What annual production benefit would justify a new concentrator?
              An investment model tests capital spending, copper prices and operating timelines.
            </p>

            <div className="mt-8 w-full max-w-lg border-t border-border-strong pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Research recommendation
              </p>
              <p className="mt-2 text-lg font-medium leading-7 text-foreground">
                Advance engineering and permitting while assessing costed alternatives ahead of a final investment decision.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 font-display text-sm">
              <Link href={fi002.path} className="font-semibold text-accent underline underline-offset-4 hover:text-accent-strong">
                Read the investment case
              </Link>
              <a href={`${fi002.assets}/model.xlsx`} className="text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-current">
                Examine the financial model
              </a>
            </div>
          </div>

          <figure className="min-w-0 rounded-lg border border-border-strong bg-card px-5 py-6 sm:px-7 sm:py-8">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-5">
              <figcaption className="max-w-md">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-accent">FI002 / Investment exhibit</p>
                <h3 className="mt-2 font-display text-xl font-semibold leading-snug sm:text-2xl">
                  Required annual production-equivalent benefit
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Model scenarios · thousand tonnes per year (ktpa)
                </p>
              </figcaption>
              <div className="shrink-0 text-right">
                <span className="block font-display text-2xl font-semibold tabular-nums sm:text-3xl">$5.85bn</span>
                <span className="mt-1 block text-xs text-muted">Base-case capital</span>
              </div>
            </div>

            <div
              className="mt-7 space-y-5"
              role="img"
              aria-label={`Modeled required annual production-equivalent benefit: ${scenarioBars.map((s) => `${s.name} ${s.ktpa} kilotonnes per year`).join("; ")}. The bars share a zero-to-450 kilotonnes-per-year scale.`}
            >
              {scenarioBars.map((scenario, index) => (
                <div key={scenario.name}>
                  <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
                    <span className={index === 0 ? "font-semibold text-foreground" : "text-muted"}>{scenario.name}</span>
                    <span className="shrink-0 font-display font-semibold tabular-nums text-foreground">
                      {scenario.ktpa} <span className="font-normal text-muted">ktpa</span>
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-sm bg-elevated">
                    <span
                      className={index === 0
                        ? "featured-case-bar absolute inset-y-0 left-0 rounded-sm bg-accent"
                        : "featured-case-bar absolute inset-y-0 left-0 rounded-sm bg-[#807153]"}
                      style={{ width: `${scenario.share}%`, animationDelay: `${index * 110}ms` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between text-xs tabular-nums text-muted" aria-hidden="true">
              <span>0</span>
              <span>225</span>
              <span>450 ktpa</span>
            </div>
            <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted">
              Model-derived thresholds for output preserved or added relative to a no-build plan.
              These are requirements under stated assumptions, not forecasts of plant production.
              <Link href={fi002.path} className="ml-1 text-foreground underline decoration-border-strong underline-offset-2 hover:decoration-current">
                Assumptions and sources
              </Link>
            </p>
          </figure>
        </div>
      </div>
    </section>
  );
}
