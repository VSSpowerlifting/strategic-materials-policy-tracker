import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { LinkCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActorMonogram } from "@/components/actor-monogram";
import { roleLabels } from "@/lib/labels";
import { getAllJurisdictions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Actors",
  description:
    "Jurisdiction profiles for the tracked actors — China, the United States, the EU, Australia, Japan, Canada, the United Kingdom and India — their role in the supply chain, the instruments they use, and how they frame policy.",
};

export default function ActorsPage() {
  const jurisdictions = getAllJurisdictions();

  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Six actors"
        title="Actors"
        lead="The incumbent and the states trying to diversify away from it. Each profile sets out an actor's place in the supply chain, the policy instruments it reaches for, and its framing posture."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {jurisdictions.map((j) => (
          <LinkCard
            key={j.id}
            href={`/actors/${j.code.toLowerCase()}`}
            className="p-5"
          >
            <div className="flex items-center gap-3">
              <ActorMonogram code={j.code} size="md" />
              <h2 className="font-display text-lg font-semibold tracking-tight group-hover:text-accent">
                {j.name}
              </h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {j.roles.map((r) => (
                <Badge key={r}>{roleLabels[r]}</Badge>
              ))}
            </div>
            <p className="mt-3 line-clamp-3 leading-7 text-muted">
              {j.supplyChainPosition}
            </p>
            <div className="tnum mt-3 font-mono text-xs text-faint">
              {j.eventIds.length} {j.eventIds.length === 1 ? "event" : "events"}
            </div>
          </LinkCard>
        ))}
      </div>
    </Container>
  );
}
