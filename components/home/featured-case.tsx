import Link from "next/link";
import { PhotoPlate } from "@/components/editorial/photo-plate";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { fi002, fi002Screens } from "@/lib/fi002";

/** Exhibit scale in ktpa. Fixed so the four model requirements share one linear scale that starts at zero. */
const SCALE_MAX = 450;

/**
 * The homepage flagship: FI002 under its opening plate, as a centred title block over the four model
 * requirements. Every figure comes from the approved publication (`lib/fi002.ts` and the article); the
 * numerals and bars are drawn from `fi002Screens` and are modeled requirements, never production forecasts.
 * The photograph is the registered Escondida plate and carries its own caption, which says what it shows.
 */
export function FeaturedCase() {
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
            BHP estimates $5.4–6.3 billion of gross capital for a concentrator to replace Los Colorados at
            Escondida, with first production expected in 2031–32. The financial model tests how much annual
            copper output, preserved or added against a no-build plan, would justify that spending.
          </p>
        </div>

        <figure className="mx-auto mt-12 max-w-5xl sm:mt-16" aria-labelledby="featured-exhibit-title">
          <figcaption className="text-center">
            <p id="featured-exhibit-title" className="font-display text-[0.9375rem] font-semibold text-foreground">
              Annual production-equivalent benefit needed to justify the investment
            </p>
            <p className="mt-1 font-display text-sm text-muted">
              Thousand tonnes of copper a year (ktpa), four model scenarios
            </p>
          </figcaption>

          <ScrollReveal kind="chart" className="mt-8">
            <ol className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-10 p-0 lg:grid-cols-4 lg:gap-x-10">
              {fi002Screens.map((s, i) => {
                const [span, window] = s.years.split(" · ");
                return (
                  <li key={s.name} className="min-w-0">
                    <div aria-hidden className="h-[3px] bg-elevated">
                      <span
                        className="exhibit-bar block h-full"
                        style={{
                          width: `${(s.exact / SCALE_MAX) * 100}%`,
                          background: i === 0 ? "var(--accent)" : "var(--fg)",
                          "--bar-order": i,
                        } as React.CSSProperties}
                      />
                    </div>
                    <p className="label mt-4">{s.name}</p>
                    <p className={i === 0 ? "figure-xl mt-2 text-accent" : "figure-xl mt-2 text-foreground"}>
                      {s.ktpa}
                      <span className="sr-only"> ktpa</span>
                    </p>
                    <ul className="mt-4 list-none p-0 font-display text-xs leading-5 text-faint">
                      <li>{s.capital} capital</li>
                      <li>{s.price} long-term copper</li>
                      <li>
                        {span}, {window}
                      </li>
                    </ul>
                  </li>
                );
              })}
            </ol>
          </ScrollReveal>

          <p className="mx-auto mt-10 max-w-3xl text-center font-display text-xs leading-5 text-faint">
            Model-derived requirements under stated assumptions, not forecasts of plant output. Base-case capital
            of $5.85 billion is the midpoint of BHP’s range; the combined stress case adds 20% to capital, lowers
            the long-term copper price and delays benefits by two years.
          </p>
        </figure>

        <div className="title-block mt-12 max-w-2xl">
          <p className="label">Recommendation</p>
          <p className="mt-2 font-display text-[0.9375rem] leading-7 text-foreground">
            Keep engineering and permitting moving before construction approval. BHP has reported $0.8 billion
            of gross pre-commitment funding approved for that preparatory work.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
