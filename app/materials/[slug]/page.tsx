import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { EventListItem } from "@/components/event-card";
import { SourceList } from "@/components/source-ref";
import { MaterialTileHeader } from "@/components/material-tile";
import { ActorMonogram } from "@/components/actor-monogram";
import { StatusBadge } from "@/components/labels";
import { jurisdictionLabels, jurisdictionShort } from "@/lib/labels";
import { getMaterialMeta } from "@/lib/materials-meta";
import {
  getAllMaterials,
  getEventsByMaterial,
  getMaterialBySlug,
  getSourcesByIds,
} from "@/lib/data";
import type { JurisdictionCode, PolicyEvent, PolicyStatus } from "@/lib/types";

export function generateStaticParams() {
  return getAllMaterials().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const material = getMaterialBySlug(slug);
  if (!material) return { title: "Material not found" };
  return {
    title: material.nameEn,
    description: material.statusSummary,
  };
}

/** Group a material's events by actor → distinct statuses, in canonical order. */
function statusByActor(events: PolicyEvent[]) {
  const order: JurisdictionCode[] = [
    "china",
    "us",
    "eu",
    "australia",
    "japan",
    "canada",
    "other",
  ];
  const map = new Map<JurisdictionCode, Set<PolicyStatus>>();
  for (const e of events) {
    const set = map.get(e.jurisdiction) ?? new Set<PolicyStatus>();
    set.add(e.policyStatus);
    map.set(e.jurisdiction, set);
  }
  return order
    .filter((a) => map.has(a))
    .map((actor) => ({ actor, statuses: [...map.get(actor)!] }));
}

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const material = getMaterialBySlug(slug);
  if (!material) notFound();

  const events = getEventsByMaterial(material.id);
  const sources = getSourcesByIds(material.sourceIds);
  const actorStatuses = statusByActor(events);
  const { hue } = getMaterialMeta(material.id);

  return (
    <Container className="py-12">
      <Link
        href="/materials"
        className="font-display text-sm text-muted hover:text-foreground"
      >
        ← All materials
      </Link>

      <header className="mt-6">
        <MaterialTileHeader material={material} />
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          {/* China position callout — anchored by the material's oxide hue. */}
          <div
            className="rounded-lg border border-border bg-elevated/40 p-5"
            style={{ borderLeft: `3px solid ${hue}` }}
          >
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              China&apos;s position
            </h2>
            <p className="mt-2 text-pretty leading-7 text-foreground/90">
              {material.chinaPositionNote}
            </p>
          </div>

          <Section index="01" title="In policy">
            <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">
              {material.statusSummary}
            </p>
          </Section>

          {material.diversificationNote ? (
            <Section index="02" title="Diversification">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">
                {material.diversificationNote}
              </p>
            </Section>
          ) : null}

          {actorStatuses.length > 0 ? (
            <Section
              index="03"
              title="Policy status across actors"
              description="Where each actor's coded measures on this material currently stand."
            >
              <Card className="divide-y divide-border overflow-hidden">
                {actorStatuses.map(({ actor, statuses }) => (
                  <div
                    key={actor}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <span className="flex items-center gap-3">
                      <ActorMonogram code={jurisdictionShort[actor]} size="sm" />
                      <span className="font-display text-sm font-medium">
                        {jurisdictionLabels[actor]}
                      </span>
                    </span>
                    <span className="flex flex-wrap justify-end gap-1">
                      {statuses.map((s) => (
                        <StatusBadge key={s} status={s} />
                      ))}
                    </span>
                  </div>
                ))}
              </Card>
            </Section>
          ) : null}

          <Section index="04" title={`Events (${events.length})`}>
            {events.length > 0 ? (
              <Card className="overflow-hidden">
                {events.map((e) => (
                  <EventListItem key={e.id} event={e} />
                ))}
              </Card>
            ) : (
              <p className="leading-7 text-muted">No events coded yet.</p>
            )}
          </Section>

          {sources.length > 0 ? (
            <Section index="05" title={`Sources (${sources.length})`}>
              <SourceList sources={sources} />
            </Section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Downstream industries
            </h2>
            <ul className="space-y-1.5 leading-6 text-foreground/90">
              {material.downstreamIndustries.map((d) => (
                <li key={d} className="flex gap-2">
                  <span aria-hidden className="text-accent">
                    ·
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
