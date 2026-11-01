import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { MaterialTile } from "@/components/material-tile";
import { getAllMaterials } from "@/lib/data";

export const metadata: Metadata = {
  title: "Materials",
  description:
    "Explore a bounded set of rare earths and adjacent strategic materials through source-linked policy measures, legal controls, public finance and industrial observations.",
};

export default function MaterialsPage() {
  const materials = getAllMaterials();

  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Bounded set"
        title="Materials"
        lead="Rare earths, the named elements covered by controls, and adjacent strategic materials — including gallium, germanium, graphite, antimony, tungsten and finished magnets. Explore the recorded policies, financing and industrial evidence attached to each; these are bounded research dossiers, not comprehensive global supply-chain models."
      />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((m) => (
          <MaterialTile key={m.id} material={m} />
        ))}
      </div>
    </Container>
  );
}
