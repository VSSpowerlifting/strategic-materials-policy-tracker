import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { LinkCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        eyebrow="Bounded set"
        title="Materials"
        lead="Rare earths as the spine, the named REEs that drive the controls, and the adjacent chokepoints — gallium, germanium, graphite, antimony, tungsten, and finished magnets. Each entry is a China-policy view, not a global supply-chain model."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {materials.map((m) => (
          <LinkCard key={m.id} href={`/materials/${m.slug}`} className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-medium group-hover:text-accent">
                {m.nameEn}
              </h2>
              {m.nameZh ? (
                <span lang="zh" className="shrink-0 font-mono text-sm text-faint">
                  {m.nameZh}
                </span>
              ) : null}
            </div>
            {m.grouping ? (
              <Badge tone="neutral" className="mt-2">
                {m.grouping}
              </Badge>
            ) : null}
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
              {m.statusSummary}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
              <span className="tnum">{m.eventIds.length} events</span>
              <span aria-hidden>·</span>
              <span className="truncate">
                {m.downstreamIndustries.slice(0, 3).join(" · ")}
              </span>
            </div>
          </LinkCard>
        ))}
      </div>
    </Container>
  );
}
