import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventListItem } from "@/components/event-card";
import { FramingQuote } from "@/components/framing-quote";
import { ActorMonogram } from "@/components/actor-monogram";
import { roleLabels } from "@/lib/labels";
import {
  getAllFramingClaims,
  getAllJurisdictions,
  getEventById,
  getEventsByActor,
  getJurisdictionByCode,
  getSourceById,
} from "@/lib/data";
import type { JurisdictionCode } from "@/lib/types";

export function generateStaticParams() {
  return getAllJurisdictions().map((j) => ({ code: j.code.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const j = getJurisdictionByCode(code);
  if (!j) return { title: "Actor not found" };
  return { title: `${j.name} — actor profile`, description: j.supplyChainPosition };
}

export default async function ActorPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const jurisdiction = getJurisdictionByCode(code);
  if (!jurisdiction) notFound();

  const actor = jurisdiction.id as JurisdictionCode;
  const events = getEventsByActor(actor);
  const framing = getAllFramingClaims().filter((f) => f.actor === actor);

  return (
    <Container className="py-12">
      <Link
        href="/actors"
        className="font-display text-sm text-muted hover:text-foreground"
      >
        ← All actors
      </Link>

      <header className="mt-6">
        <div className="flex items-center gap-4">
          <ActorMonogram code={jurisdiction.code} size="lg" />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {jurisdiction.name}
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-faint">
              {jurisdiction.code} · actor dossier
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {jurisdiction.roles.map((r) => (
            <Badge key={r} tone="slate">
              {roleLabels[r]}
            </Badge>
          ))}
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <Section index="01" title="Supply-chain position">
            <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">
              {jurisdiction.supplyChainPosition}
            </p>
          </Section>

          {jurisdiction.framingPosture ? (
            <Section index="02" title="Framing posture">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">
                {jurisdiction.framingPosture}
              </p>
            </Section>
          ) : null}

          {framing.length > 0 ? (
            <Section
              index="03"
              title={`Framing anchors (${framing.length})`}
              description="How this actor justifies its policy, in its own words."
            >
              <div className="grid gap-4">
                {framing.map((f) => {
                  const ev = getEventById(f.eventId);
                  return (
                    <div key={f.id}>
                      {ev ? (
                        <Link
                          href={`/events/${ev.id}`}
                          className="mb-1.5 inline-block font-mono text-xs text-faint hover:text-accent"
                        >
                          On: {ev.titleEn} →
                        </Link>
                      ) : null}
                      <FramingQuote claim={f} source={getSourceById(f.sourceId)} />
                    </div>
                  );
                })}
              </div>
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
              <p className="leading-7 text-muted">
                No events coded yet. This actor&apos;s diversification, funding and
                stockpiling measures are part of the planned v1 coverage — see the{" "}
                <Link href="/methodology" className="font-display text-accent hover:text-accent-strong">
                  methodology
                </Link>{" "}
                for what remains to be coded.
              </p>
            )}
          </Section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Key bodies
            </h2>
            <ul className="space-y-1.5 leading-6 text-foreground/90">
              {jurisdiction.keyBodies.map((b) => (
                <li key={b} className="flex gap-2">
                  <span aria-hidden className="text-accent">
                    ·
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
