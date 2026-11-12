import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { InstrumentsPanel } from "@/components/capital/instruments-panel";
import { commitmentActor, controlIssuer } from "@/lib/capital-control";
import { getAllControlMeasures, getAllFinancialCommitments } from "@/lib/data";
import { RecordList } from "@/components/ui/card";
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
  const commitments = getAllFinancialCommitments().filter((c) => commitmentActor(c) === actor);
  const controls = getAllControlMeasures().filter((m) => controlIssuer(m) === actor);

  return (
    <Container className="py-12">
      <Breadcrumbs
        items={[
          { href: "/events", label: "Government action" },
          { href: "/actors", label: "Governments" },
          { label: jurisdiction.name },
        ]}
      />

      <header className="mt-6">
        <div className="flex items-center gap-4">
          <ActorMonogram code={jurisdiction.code} size="lg" />
          <div>
            <h1 className="page-title">
              {jurisdiction.name}
            </h1>
            <p className="mt-1 font-display text-xs text-faint">
              {jurisdiction.code}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
          {jurisdiction.roles.map((r) => (
            <Badge key={r}>{roleLabels[r]}</Badge>
          ))}
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <Section title="Supply-chain position">
            <p className="max-w-prose text-pretty text-lg leading-8 text-foreground">
              {jurisdiction.supplyChainPosition}
            </p>
          </Section>

          {jurisdiction.framingPosture ? (
            <Section title="Framing posture">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground">
                {jurisdiction.framingPosture}
              </p>
            </Section>
          ) : null}

          {framing.length > 0 ? (
            <Section
              title={`Framing anchors (${framing.length})`}
            >
              <div className="grid gap-4">
                {framing.map((f) => {
                  const ev = getEventById(f.eventId);
                  return (
                    <div key={f.id}>
                      {ev ? (
                        <Link
                          href={`/events/${ev.id}`}
                          className="mb-1.5 inline-block font-display text-xs text-faint hover:text-accent"
                        >
                          On: {ev.titleEn}
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
              <RecordList>
                {events.map((e) => (
                  <EventListItem key={e.id} event={e} />
                ))}
              </RecordList>
            ) : (
              <p className="leading-7 text-muted">
                No events coded yet. This actor&apos;s diversification, funding and
                stockpiling measures are part of the planned v1 coverage — see the{" "}
                <Link href="/methodology" className="link-quiet">
                  methodology
                </Link>{" "}
                for what remains to be coded.
              </p>
            )}
          </Section>

          {commitments.length || controls.length ? (
            <Section
              title="Capital and control"
              description="Financial instruments this actor provides and control clauses it issues."
            >
              <InstrumentsPanel
                commitments={commitments}
                controls={controls}
                capitalHref={`/capital?actor=${actor}`}
                controlsHref={`/controls?issuer=${actor}`}
              />
            </Section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="border-t border-border-strong pt-3">
            <h2 className="mb-3 font-display text-xs font-semibold text-muted">
              Key bodies
            </h2>
            <ul className="space-y-1.5 leading-6 text-foreground">
              {jurisdiction.keyBodies.map((b) => (
                <li key={b} className="flex gap-2">
                  <span aria-hidden className="text-faint">
                    ·
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}
