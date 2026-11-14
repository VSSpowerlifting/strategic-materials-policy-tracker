import Link from "next/link";
import { PhotoPlate } from "@/components/editorial/photo-plate";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { fi002, fi002Screens } from "@/lib/fi002";
import { formatDateLong } from "@/lib/format";

/** Exhibit scale in ktpa. Fixed so the four model requirements share one linear scale that starts at zero. */
const SCALE_MAX = 450;
const TICKS = [0, 100, 200, 300, 400] as const;

/** Homepage labels, in `fi002Screens` order. The article keeps its own selector labels. */
const LABELS = ["Base case", "10 years of benefits", "10 years, starting later", "Cost, price and timing setbacks"] as const;

const tonnes = (ktpa: number) => (ktpa * 1000).toLocaleString("en-US");

/**
 * Splits a screen's published strings into the assumptions the exhibit compares against the base case.
 * `years` is "20 years · 2032–51": the span and the first benefit year.
 */
function assumptionsOf(s: (typeof fi002Screens)[number]) {
  const [span, window] = s.years.split(" · ");
  return { capital: s.capital, price: s.price, span, first: window.slice(0, 4) };
}

const base = assumptionsOf(fi002Screens[0]);

/** One assumption, set in ink and medium weight when it differs from the base case. */
function Assumption({ changed, children }: { changed: boolean; children: React.ReactNode }) {
  return (
    <span className={changed ? "font-medium text-foreground" : undefined}>
      {children}
      {changed ? <span className="sr-only"> (differs from base case)</span> : null}
    </span>
  );
}

/**
 * The homepage flagship: FI002 under its opening plate. The exhibit sets the four capital-recovery
 * scenarios on one zero-based scale, each read against the base case, then states why the requirement
 * rises and what the analysis recommends. Every figure comes from `fi002Screens` (the approved
 * publication's precomputed screens); they are modeled requirements, never production forecasts, and the
 * plant's 230–270 ktpa design output is deliberately not drawn beside them.
 */
export function FeaturedCase() {
  const [, shorter, later, stress] = fi002Screens;
  const [baseScreen] = fi002Screens;

  return (
    <section id="featured-analysis" aria-labelledby="featured-analysis-heading">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <PhotoPlate
          photo="escondida-tailings"
          frame="aspect-[4/3] sm:aspect-[2/1] lg:aspect-[21/9]"
          sizes="(min-width: 1280px) 1216px, 100vw"
          priority
        />

        <div className="title-block mt-12 max-w-3xl sm:mt-16">
          <p className="kicker">Featured analysis · Strategy &amp; Finance</p>
          <h2 id="featured-analysis-heading" className="display-2 mt-4 text-foreground">
            <Link href={fi002.path} className="hover:text-accent">
              {fi002.title}
            </Link>
          </h2>
          <p className="standfirst mt-6">
            BHP estimates that replacing a copper processing plant at Escondida will cost $5.4–6.3 billion. To
            justify the $5.85 billion midpoint, the replacement would need to deliver enough additional yearly
            benefit compared with continuing without it. At assumed prices and costs, our model says that benefit
            must equal the after-tax profit on {tonnes(baseScreen.ktpa)} tonnes of copper in the base case, rising to{" "}
            {tonnes(stress.ktpa)} tonnes under tougher assumptions. Those tonnes describe financial value, not how
            much copper the new plant must produce.
          </p>
        </div>

        <figure className="mx-auto mt-12 max-w-5xl sm:mt-16" aria-labelledby="featured-exhibit-title">
          <figcaption className="border-t border-border-strong pt-5">
            <p id="featured-exhibit-title" className="font-display text-base font-semibold text-foreground sm:text-lg">
              How much yearly value would justify BHP’s investment?
            </p>
            <p className="mt-1.5 max-w-2xl font-display text-sm leading-6 text-muted">
              Each bar shows the amount of copper whose modeled after-tax profit would equal the extra yearly
              benefit needed. Dark text marks assumptions that change from the base case.
            </p>
          </figcaption>

          <ScrollReveal kind="chart" className="mt-6">
            <ol className="m-0 list-none p-0">
              {fi002Screens.map((s, i) => {
                const a = assumptionsOf(s);
                const isBase = i === 0;
                return (
                  <li
                    key={s.name}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2.5 border-t border-border py-5 [grid-template-areas:'label_value'_'bar_bar'_'meta_meta'] sm:grid-cols-[13rem_minmax(0,1fr)_8.5rem] sm:gap-x-6 sm:[grid-template-areas:'label_bar_value'_'meta_bar_value'] lg:grid-cols-[15rem_minmax(0,1fr)_9.5rem]"
                  >
                    <p className="font-display text-[0.9375rem] font-semibold leading-6 text-foreground [grid-area:label] sm:self-end">
                      {LABELS[i]}
                    </p>

                    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-0.5 p-0 font-display text-[0.8125rem] leading-5 text-faint [grid-area:meta] sm:block sm:space-y-0.5">
                      <li>
                        Investment: <Assumption changed={!isBase && a.capital !== base.capital}>{a.capital}</Assumption>
                      </li>
                      <li>
                        Copper price: <Assumption changed={!isBase && a.price !== base.price}>{a.price}</Assumption>
                      </li>
                      <li>
                        Benefits: <Assumption changed={!isBase && a.span !== base.span}>{a.span}</Assumption> starting{" "}
                        <Assumption changed={!isBase && a.first !== base.first}>{a.first}</Assumption>
                      </li>
                    </ul>

                    <div
                      aria-hidden
                      className="featured-track relative h-3 [grid-area:bar] sm:-my-5 sm:h-auto sm:self-stretch"
                    >
                      <span
                        className="exhibit-bar absolute inset-y-0 left-0 block sm:inset-y-auto sm:top-[calc(50%-0.5rem)] sm:h-4"
                        style={{
                          width: `${(s.exact / SCALE_MAX) * 100}%`,
                          background: isBase ? "var(--accent)" : "var(--fg)",
                          "--bar-order": i,
                        } as React.CSSProperties}
                      />
                    </div>

                    <p
                      className={`whitespace-nowrap text-right font-editorial text-[1.625rem] leading-none tnum [grid-area:value] sm:self-center sm:text-[1.875rem] ${
                        isBase ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {tonnes(s.ktpa)}
                      <span className="ml-1.5 font-display text-xs text-faint">t a year</span>
                    </p>
                  </li>
                );
              })}
            </ol>

            <div
              aria-hidden
              className="grid grid-cols-1 border-t border-border-strong pt-2 sm:grid-cols-[13rem_minmax(0,1fr)_8.5rem] sm:gap-x-6 lg:grid-cols-[15rem_minmax(0,1fr)_9.5rem]"
            >
              <div className="relative h-5 font-display text-[0.6875rem] text-faint tnum sm:col-start-2">
                {TICKS.map((t) => (
                  <span
                    key={t}
                    className="absolute top-0"
                    style={{
                      left: `${(t / SCALE_MAX) * 100}%`,
                      transform: t === 0 ? undefined : "translateX(-50%)",
                    }}
                  >
                    {tonnes(t)}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <p className="mt-6 max-w-3xl font-display text-xs leading-5 text-faint">
            These are simplified estimates of the extra value needed to recover the investment, not forecasts of
            plant output. All four use a 10% discount rate, an assumed $4,000/t net cost and a 35% tax adjustment.
            The base case uses the midpoint of BHP’s capital range and its long-term copper price assumption.
            Source: SMPT financial model, research cutoff {formatDateLong(fi002.cutoff)}.
          </p>
        </figure>

        <div className="mx-auto mt-14 grid max-w-5xl gap-10 border-t border-border-strong pt-8 sm:mt-16 md:grid-cols-2 md:gap-12">
          <div>
            <h3 className="label">Why the amount goes up</h3>
            <p className="mt-3 font-display text-[0.9375rem] leading-7 text-foreground">
              With only ten years of benefits instead of twenty, the required annual value rises from the profit on{" "}
              {tonnes(baseScreen.ktpa)} to {tonnes(shorter.ktpa)} tonnes of copper. If those ten years start in
              2034 instead of 2032, the figure rises to {tonnes(later.ktpa)} tonnes. In the last scenario, the
              benefit period is twenty years but starts in 2034, construction costs are 20% higher, and the copper
              price falls to {stress.price}. Together, those setbacks raise the yearly requirement to the profit
              on {tonnes(stress.ktpa)} tonnes.
            </p>
          </div>
          <div>
            <h3 className="label">Recommendation</h3>
            <p className="mt-3 font-display text-[0.9375rem] font-semibold leading-7 text-foreground">
              Continue engineering and permitting before committing the full construction budget.
            </p>
            <p className="mt-2 font-display text-[0.9375rem] leading-7 text-foreground">
              The needed annual benefit more than doubles in the toughest scenario. BHP’s public disclosures do
              not provide a detailed forecast of what the mine would earn without the project or the annual cash
              flows needed to judge the investment. Continuing preparation could protect the replacement schedule
              while BHP addresses those uncertainties. BHP has approved $0.8 billion of gross pre-commitment
              funding for that work.
            </p>
          </div>
        </div>

        <div className="title-block mt-12 max-w-2xl">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={fi002.path} className="research-button">
              Read the analysis
            </Link>
            <a href={`${fi002.assets}/model.xlsx`} className="research-button-secondary" download>
              Financial model (.xlsx)
            </a>
          </div>
          <ul className="mt-6 flex list-none flex-wrap justify-center gap-x-6 gap-y-2 p-0 font-display text-sm text-muted">
            <li>
              <a href={`${fi002.assets}/report.pdf`} className="link-quiet">Report (PDF)</a>
            </li>
            <li>
              <a href={`${fi002.assets}/methodology.md`} className="link-quiet">Methodology</a>
            </li>
            <li>
              <a href={`${fi002.assets}/evidence-register.csv`} className="link-quiet">Evidence register</a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
