import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventListItem } from "@/components/event-card";
import { FramingQuote } from "@/components/framing-quote";
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
      <Link href="/actors" className="text-sm text-muted hover:text-foreground">
        ← All actors
      </Link>

      <header className="mt-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 min-w-[3rem] items-center justify-center rounded-md border bg-elevated px-2 font-mono text-lg font-semibold">
            {jurisdiction.code}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            {jurisdiction.name}
          </h1>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {jurisdiction.roles.map((r) => (
            <Badge key={r} tone="slate">
              {roleLabels[r]}
            </Badge>
          ))}
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <Section title="Supply-chain position">
            <p className="max-w-prose text-pretty leading-7 text-foreground/90">
              {jurisdiction.supplyChainPosition}
            </p>
          </Section>

          {jurisdiction.framingPosture ? (
            <Section title="Framing posture">
              <p className="max-w-prose text-pretty leading-7 text-foreground/90">
                {jurisdiction.framingPosture}
              </p>
            </Section>
          ) : null}

          {framing.length > 0 ? (
            <Section
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
                          className="mb-1.5 inline-block text-xs text-faint hover:text-accent"
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

          <Section title={`Events (${events.length})`}>
            {events.length > 0 ? (
              <Card className="overflow-hidden">
                {events.map((e) => (
                  <EventListItem key={e.id} event={e} />
                ))}
              </Card>
            ) : (
              <p className="text-sm text-muted">
                No events coded yet. This actor&apos;s diversification, funding and
                stockpiling measures are part of the planned v1 coverage — see the{" "}
                <Link href="/methodology" className="text-accent hover:underline">
                  methodology
                </Link>{" "}
                for what remains to be coded.
              </p>
            )}
          </Section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Key bodies
            </h2>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {jurisdiction.keyBodies.map((b) => (
                <li key={b} className="flex gap-2">
                  <span aria-hidden className="text-faint">
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
