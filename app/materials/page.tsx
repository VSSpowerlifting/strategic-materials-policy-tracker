import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { MaterialTile } from "@/components/material-tile";
import { getAllMaterials } from "@/lib/data";

export const metadata: Metadata = {
  title: "Materials",
  description:
    "A bounded, rare-earth-centred material set and how each appears in the policy contest — China's position, downstream industries, and diversification efforts.",
};

export default function MaterialsPage() {
  const materials = getAllMaterials();

  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Bounded set"
        title="Materials"
        lead="Rare earths as the spine, the named REEs that drive the controls, and the adjacent chokepoints — gallium, germanium, graphite, antimony, tungsten, and finished magnets. Each entry is a China-policy view, not a global supply-chain model."
      />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((m) => (
          <MaterialTile key={m.id} material={m} />
        ))}
      </div>
    </Container>
  );
}
