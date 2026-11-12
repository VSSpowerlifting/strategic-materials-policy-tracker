import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { MaterialTile } from "@/components/material-tile";
import { LatticeOverview } from "@/components/lattice/lattice";
import { SupplyChainStrip } from "@/components/home/supply-chain-strip";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getAllMaterials } from "@/lib/data";
import { chainStageCounts } from "@/lib/homepage-chain";
import { buildLatticeModel } from "@/lib/lattice";
import { formatDateLong } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Materials",
  description:
    "Rare earths and adjacent strategic materials, each with its source-linked policy measures, legal controls, public finance and industrial records.",
};

export default function MaterialsPage() {
  const materials = getAllMaterials();
  const model = buildLatticeModel(site.lastUpdated);
  const chain = chainStageCounts(model);
  const asOf = (
    <>as of the <time dateTime={site.lastUpdated}>{formatDateLong(site.lastUpdated)}</time> research snapshot</>
  );

  return (
    <>
      <Container width="wide" className="py-12">
        <PageHeading
          title="Materials"
          lead="Rare earths, the elements named in export controls, and adjacent materials."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {materials.map((m) => (
            <MaterialTile key={m.id} material={m} />
          ))}
        </div>
      </Container>

      <section aria-label="Supply-chain coverage" className="mt-6 border-t border-border">
        <Container width="wide" className="py-10 sm:py-12">
          <ScrollReveal kind="chain"><SupplyChainStrip chain={chain.chain} outside={chain.outside} asOf={asOf} /></ScrollReveal>
        </Container>
      </section>

      <section id="browse" aria-label="Browse by material and stage" className="border-t border-border-strong">
        <Container width="wide" className="py-12 sm:py-16">
          <LatticeOverview
            model={model}
            preferred={{ slug: "gallium", stage: "processing" }}
            intro={
              <>
                <h2 className="font-display text-2xl font-semibold tracking-tight">Browse by material and stage</h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Select a marked cell to open its source-linked records.
                </p>
              </>
            }
          />
        </Container>
      </section>
    </>
  );
}
