import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { FramingQuote } from "@/components/framing-quote";
import { SourceCard } from "@/components/source-ref";
import { EventLine } from "@/components/event-card";
import {
  JurisdictionTag,
  MechanismBadges,
  SectorBadges,
  StatusBadge,
} from "@/components/labels";
import { enSourceLabels, jurisdictionShort } from "@/lib/labels";
import {
  getAllEvents,
  getEventById,
  getFramingByEvent,
  getJurisdictionById,
  getMaterialsByIds,
  getRelatedEvents,
  getSourceById,
  getSourcesByIds,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { CiteBlock } from "@/components/cite-block";
import { SaveEventButton } from "@/components/save-event-button";
import { plainCitation } from "@/lib/citation";
import { eventJsonLd, jsonLdScript } from "@/lib/structured-data";

export function generateStaticParams() {
  return getAllEvents().map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) return { title: "Event not found" };
  return { title: event.titleEn, description: event.summary };
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 border-b border-border py-2.5 last:border-b-0">
      <dt className="font-display text-xs uppercase tracking-[0.12em] text-faint">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const framing = getFramingByEvent(event.id);
  const sources = getSourcesByIds(event.sourceIds);
  const materials = getMaterialsByIds(event.affectedMaterialIds);
  const jurisdiction = getJurisdictionById(event.jurisdiction);
  const related = getRelatedEvents(event);
  const actorHref = `/actors/${jurisdictionShort[event.jurisdiction].toLowerCase()}`;
  let sectionNo = 0;
  const nextSectionIndex = () => String(++sectionNo).padStart(2, "0");
  const showOriginalTitle =
    event.titleOriginalLang !== "en" && event.titleOriginal !== "Not yet coded";

  return (
    <Container className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(eventJsonLd(event, sources)) }}
      />
      <Link
        href="/events"
        className="font-display text-sm text-muted hover:text-foreground"
      >
        ← All events
      </Link>

      <header className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <time className="tnum font-mono text-faint">{formatDate(event.date)}</time>
          <Link href={actorHref} className="hover:opacity-80">
            <JurisdictionTag code={event.jurisdiction} withName />
          </Link>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span className="text-muted">{event.issuingBody}</span>
        </div>
        {event.documentNumber ? (
          <p className="mt-3 font-mono text-xs text-faint">{event.documentNumber}</p>
        ) : null}
        <h1 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight">
          {event.titleEn}
        </h1>
        {showOriginalTitle ? (
          <p lang="zh" className="mt-2 text-lg leading-relaxed text-muted">
            {event.titleOriginal}
          </p>
        ) : null}
        {event.titleEnSource !== "na" ? (
          <p className="mt-2 text-xs text-faint">
            English title: {enSourceLabels[event.titleEnSource].toLowerCase()}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={event.policyStatus} />
          <MechanismBadges mechanisms={event.mechanism} />
        </div>
        <div className="mt-4">
          <SaveEventButton eventId={event.id} />
        </div>
      </header>

      {/*
        Section numbers are assigned in render order rather than hard-coded.
        "Related events" is conditional, so a record with none used to display
        04 then 06 — a gap that reads like a missing section. That is now
        routine rather than rare: an instrument naming no material has no
        related events either, since relatedness is derived from shared
        materials. JSX evaluates siblings in source order, so the counter
        below is deterministic for this server-rendered page.
      */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <Section index={nextSectionIndex()} title="Summary">
            <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">
              {event.summary}
            </p>
          </Section>

          <Section index={nextSectionIndex()} title="Analytical significance">
            <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">
              {event.analyticalSignificance}
            </p>
          </Section>

          <Section
            index={nextSectionIndex()}
            title="Framing anchors"
            description="Official framing, classified only from quoted passages."
          >
            {framing.length > 0 ? (
              <div className="grid gap-4">
                {framing.map((f) => (
                  <FramingQuote
                    key={f.id}
                    claim={f}
                    source={getSourceById(f.sourceId)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-5">
                <p className="text-sm leading-6 text-muted">
                  Framing:{" "}
                  <span className="font-mono text-faint">Not yet coded.</span> No
                  framing category is assigned because this record does not yet carry
                  a verified quoted passage from the primary source. Per the
                  methodology, a framing label is never inferred from context alone.
                </p>
              </Card>
            )}
          </Section>

          <Section index={nextSectionIndex()} title="Affected materials">
            {materials.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {materials.map((m) => (
                  <Link
                    key={m.id}
                    href={`/materials/${m.slug}`}
                    className="group inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm transition-colors hover:border-border-strong hover:bg-elevated"
                  >
                    <span className="group-hover:text-accent">{m.nameEn}</span>
                    {m.nameZh ? (
                      <span lang="zh" className="font-mono text-xs text-faint">
                        {m.nameZh}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              // Saying this out loud matters. An empty section would read as
              // "not coded yet", when in fact the empty scope is the finding.
              // Two different findings produce it — a framework instrument that
              // names no material, and an instrument whose materials fall
              // outside the tracked set — so the copy states the fact both
              // share and sends the reader to the summary for which one it is.
              // Either way no material is inferred onto the record.
              <Card className="px-4 py-3 text-sm leading-6 text-muted">
                No tracked material is coded for this record — either the instrument
                names no material of its own, or the minerals it names fall outside
                this database&apos;s material set. The summary above says which. Nothing
                is inferred here from the measures issued under it.
              </Card>
            )}
          </Section>

          {related.length > 0 ? (
            <Section
              index={nextSectionIndex()}
              title="Related events"
              description="Events touching the same materials."
            >
              <Card className="px-4 py-1">
                {related.map((e) => (
                  <EventLine key={e.id} event={e} />
                ))}
              </Card>
            </Section>
          ) : null}

          <Section index={nextSectionIndex()} title={`Sources (${sources.length})`}>
            <div className="grid gap-3">
              {sources.map((s) => (
                <SourceCard key={s.id} source={s} />
              ))}
            </div>
          </Section>

          <Section index={nextSectionIndex()} title="Citation">
            <CiteBlock
              plain={plainCitation(event)}
              eventId={event.id}
              primaryUrls={sources.map((s) => s.url)}
            />
          </Section>
        </div>

        {/* At a glance */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <h2 className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              At a glance
            </h2>
            <dl>
              <MetaRow label="Status">
                <StatusBadge status={event.policyStatus} />
              </MetaRow>
              <MetaRow label="Mechanism">
                <MechanismBadges mechanisms={event.mechanism} />
              </MetaRow>
              <MetaRow label="Sectors">
                {event.affectedSectors.length ? (
                  <SectorBadges sectors={event.affectedSectors} />
                ) : (
                  <span className="text-faint">—</span>
                )}
              </MetaRow>
              <MetaRow label="Issuer">
                {jurisdiction ? (
                  <Link href={actorHref} className="text-accent hover:underline">
                    {jurisdiction.name}
                  </Link>
                ) : (
                  event.issuingBody
                )}
              </MetaRow>
              <MetaRow label="Doc no.">
                {event.documentNumber ? (
                  <span className="font-mono text-xs">{event.documentNumber}</span>
                ) : (
                  <span className="font-mono text-xs text-faint">Not yet coded</span>
                )}
              </MetaRow>
              <MetaRow label="Sources">
                <span className="tnum">{sources.length}</span>
              </MetaRow>
            </dl>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
