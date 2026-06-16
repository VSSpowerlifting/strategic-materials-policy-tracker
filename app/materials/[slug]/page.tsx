import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventListItem } from "@/components/event-card";
import { SourceList } from "@/components/source-ref";
import {
  getAllMaterials,
  getEventsByMaterial,
  getMaterialBySlug,
  getSourcesByIds,
} from "@/lib/data";

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

  return (
    <Container className="py-12">
      <Link href="/materials" className="text-sm text-muted hover:text-foreground">
        ← All materials
      </Link>

      <header className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{material.nameEn}</h1>
          {material.nameZh ? (
            <span lang="zh" className="font-mono text-xl text-muted">
              {material.nameZh}
            </span>
          ) : null}
        </div>
        {material.grouping ? (
          <Badge tone="neutral" className="mt-3">
            {material.grouping}
          </Badge>
        ) : null}
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          {/* China position callout — the fact that anchors most events. */}
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.05] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
              China&apos;s position
            </h2>
            <p className="mt-2 text-pretty leading-7 text-foreground/90">
              {material.chinaPositionNote}
            </p>
          </div>

          <Section title="In policy">
            <p className="max-w-prose text-pretty leading-7 text-foreground/90">
              {material.statusSummary}
            </p>
          </Section>

          {material.diversificationNote ? (
            <Section title="Diversification">
              <p className="max-w-prose text-pretty leading-7 text-foreground/90">
                {material.diversificationNote}
              </p>
            </Section>
          ) : null}

          <Section title={`Events (${events.length})`}>
            {events.length > 0 ? (
              <Card className="overflow-hidden">
                {events.map((e) => (
                  <EventListItem key={e.id} event={e} />
                ))}
              </Card>
            ) : (
              <p className="text-sm text-muted">No events coded yet.</p>
            )}
          </Section>

          {sources.length > 0 ? (
            <Section title={`Sources (${sources.length})`}>
              <SourceList sources={sources} />
            </Section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Downstream industries
            </h2>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {material.downstreamIndustries.map((d) => (
                <li key={d} className="flex gap-2">
                  <span aria-hidden className="text-faint">
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
