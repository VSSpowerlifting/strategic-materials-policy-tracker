import { LatticeLegend, LatticeOverview } from "@/components/lattice/lattice";
import { ControlGapNotice, NotPlacedSentence } from "@/components/lattice/not-on-lattice";
import { CapitalAndControl, DatedRegister, RecordCounts } from "@/components/overview/sections";
import { buildLatticeModel } from "@/lib/lattice";
import { formatDateLong } from "@/lib/format";
import { site } from "@/lib/site";
import { datasetJsonLd, jsonLdScript } from "@/lib/structured-data";

/** The node shown before a visitor chooses one (falls back to the first marked cell if it holds nothing). */
const PREFERRED = { slug: "tungsten", stage: "processing" } as const;

export default function Home() {
  const asOf = site.lastUpdated;
  const model = buildLatticeModel(asOf);

  const intro = (
    <>
      <p className="font-display text-xs text-muted">Materials by supply-chain stage</p>
      <h1 className="mt-4 font-serif text-[2rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-4xl">{site.tagline.replace(/\.$/, "")}.</h1>
      <p className="mt-4 text-[15px] leading-7 text-muted">
        A source-linked record of export controls, public money, designations, ownership and offtake around rare earths and strategic materials. The lattice places each record where its
        source puts it.
      </p>
      <LatticeLegend model={model} className="mt-6 hidden md:block" />
      <ControlGapNotice gaps={model.gaps} id="control-gap-desktop" className="mt-6 hidden lg:block" />
      <div className="mt-5 hidden space-y-3 text-[13px] leading-5 text-muted md:block">
        <p>
          A record coded to several stages appears at each, so no row or column is totalled. <NotPlacedSentence gaps={model.gaps} />
        </p>
        <p>
          <strong className="font-semibold text-foreground">A record, not a live feed.</strong> Statuses are shown as of {formatDateLong(asOf)}, when the data was last checked.
          {site.monitoringStartedAt ? "" : " Prospective monitoring has not started."}
        </p>
      </div>
    </>
  );

  return (
    <div data-flush-footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(datasetJsonLd()) }} />
      <section className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-16">
          <LatticeOverview model={model} preferred={PREFERRED} intro={intro} />
          <div className="mt-8 space-y-3 md:hidden">
            <ControlGapNotice gaps={model.gaps} id="control-gap-mobile" />
            <p className="text-xs leading-5 text-muted">
              A record coded to several stages appears at each; nothing is totalled. <NotPlacedSentence gaps={model.gaps} />
            </p>
          </div>
        </div>
      </section>

      <div className="bg-paper text-paper-foreground">
        <RecordCounts asOf={asOf} />
        <DatedRegister asOf={asOf} />
        <CapitalAndControl asOf={asOf} gaps={model.gaps} />
      </div>
    </div>
  );
}
