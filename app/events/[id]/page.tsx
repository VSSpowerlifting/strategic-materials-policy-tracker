import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CiteBlock } from "@/components/cite-block";
import { CapitalFlowExhibit } from "@/components/exhibits/capital-flow";
import { FramingQuote } from "@/components/framing-quote";
import { JurisdictionTag, POLICY_STATUS_TONE } from "@/components/labels";
import {
  FactNote,
  IdentityItem,
  Prose,
  Qualifier,
  RailBlock,
  RecordFact,
  RecordFacts,
  RecordId,
  RecordLayout,
  RecordList,
  RecordTitleBlock,
  StatusLine,
  Unknown,
} from "@/components/record/primitives";
import { ControlLine, DesignationLine, InstrumentLines } from "@/components/record/rows";
import { SaveEventButton } from "@/components/save-event-button";
import { SourceCard } from "@/components/source-ref";
import { Container, Section } from "@/components/ui/container";
import { buildCapitalFlowModel } from "@/lib/capital-flow";
import { controlStatusesRecordedIn, summarizeControl } from "@/lib/capital-control";
import { plainCitation } from "@/lib/citation";
import {
  getAllEvents,
  getControlMeasuresByEvent,
  getEventById,
  getFinancialCommitmentsByEvent,
  getFramingByEvent,
  getJurisdictionById,
  getMaterialsByIds,
  getProjectDesignationsByEvent,
  getRelatedEvents,
  getSourceById,
  getSourcesByIds,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  controlStatusLabels,
  enSourceLabels,
  jurisdictionShort,
  mechanismLabels,
  policyStatusLabels,
  sectorLabels,
} from "@/lib/labels";
import { site } from "@/lib/site";
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
  const commitments = getFinancialCommitmentsByEvent(event.id);
  const controls = getControlMeasuresByEvent(event.id);
  const designations = getProjectDesignationsByEvent(event.id);
  const recordedStatuses = controlStatusesRecordedIn(event.id);
  const actorHref = `/actors/${jurisdictionShort[event.jurisdiction].toLowerCase()}`;
  const titleCoded = event.titleOriginal !== "Not yet coded";
  const showOriginalTitle = event.titleOriginalLang !== "en" && titleCoded;
  const hasInstruments = commitments.length > 0 || controls.length > 0;
  // The exhibit draws only where commitment rows name both parties; the rail lists it only then.
  const hasFlowExhibit = Boolean(buildCapitalFlowModel(event.id)?.hasIdentifiedParties);

  const contents = [
    { href: "#summary", label: "Summary" },
    { href: "#significance", label: "Analytical significance" },
    { href: "#framing", label: "Framing anchors" },
    ...(hasFlowExhibit ? [{ href: "#financing-status", label: "Financing status" }] : []),
    ...(hasInstruments ? [{ href: "#instruments", label: "Instruments" }] : []),
    ...(recordedStatuses.length ? [{ href: "#recorded-status", label: "Control status recorded" }] : []),
    ...(designations.length ? [{ href: "#designations", label: "Projects recognized" }] : []),
    { href: "#sources", label: "Sources" },
    { href: "#cite", label: "Citation" },
  ];

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(eventJsonLd(event, sources)) }}
      />

      <RecordTitleBlock
        breadcrumbs={[{ href: "/events", label: "Policy actions" }, { label: event.titleEn }]}
        title={event.titleEn}
        subtitle={
          showOriginalTitle ? (
            <p lang="zh" className="mt-4 max-w-3xl font-display text-lg leading-relaxed text-muted">
              {event.titleOriginal}
            </p>
          ) : null
        }
        identity={
          <>
            <IdentityItem>
              <time dateTime={event.date} className="tnum">
                {formatDate(event.date)}
              </time>
            </IdentityItem>
            <IdentityItem>
              <Link href={actorHref} className="hover:text-accent">
                <JurisdictionTag code={event.jurisdiction} withName />
              </Link>
            </IdentityItem>
            <IdentityItem>
              <RecordId id={event.id} />
            </IdentityItem>
          </>
        }
        status={<StatusLine prefix="Policy status" label={policyStatusLabels[event.policyStatus]} tone={POLICY_STATUS_TONE[event.policyStatus]} />}
      >
        <SaveEventButton eventId={event.id} />
      </RecordTitleBlock>

      <RecordFacts label="Key facts" flush>
        <RecordFact label="Jurisdiction">
          {jurisdiction ? (
            <Link href={actorHref} className="link-quiet">
              {jurisdiction.name}
            </Link>
          ) : (
            jurisdictionShort[event.jurisdiction]
          )}
        </RecordFact>
        <RecordFact label="Issuing authority">{event.issuingBody}</RecordFact>
        <RecordFact label="Document number">{event.documentNumber ? event.documentNumber : <Unknown>Not yet coded</Unknown>}</RecordFact>
        <RecordFact label="Mechanism" wide>
          {event.mechanism.map((m) => mechanismLabels[m]).join(", ")}
        </RecordFact>
        <RecordFact label="Sectors" wide>
          {event.affectedSectors.length ? event.affectedSectors.map((s) => sectorLabels[s]).join(", ") : <Unknown>—</Unknown>}
        </RecordFact>
        <RecordFact label="Affected materials" wide>
          {materials.length > 0 ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {materials.map((m) => (
                <li key={m.id}>
                  <Link href={`/materials/${m.slug}`} className="link-quiet">
                    {m.nameEn}
                  </Link>
                  {m.nameZh ? (
                    <span lang="zh" className="ml-1.5 text-[0.8125rem] text-faint">
                      {m.nameZh}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            // The empty scope is itself the finding, and two different findings produce it: an instrument that
            // names no material, and one whose materials fall outside the tracked set. The line states what both
            // share and sends the reader to the summary; no material is inferred onto the record.
            <span className="text-muted">
              The material field is empty because the instrument either specifies no materials of its own or names
              minerals outside this dataset. The summary identifies the applicable scope.
            </span>
          )}
        </RecordFact>
        {event.titleOriginalLang !== "en" && !titleCoded ? (
          <RecordFact label="Original-language title">
            <Unknown>Not yet coded</Unknown>
          </RecordFact>
        ) : null}
        {event.titleEnSource !== "na" ? (
          <RecordFact label="English title">{enSourceLabels[event.titleEnSource]}</RecordFact>
        ) : null}
        <RecordFact label="Sources">
          <a href="#sources" className="link-quiet tnum">
            {sources.length}
          </a>
        </RecordFact>
        {hasInstruments ? (
          <RecordFact label="Instruments">
            <a href="#instruments" className="link-quiet tnum">
              {commitments.length} financial, {controls.length} control
            </a>
          </RecordFact>
        ) : null}
      </RecordFacts>

      <RecordLayout
        contents={contents}
        rail={
          related.length > 0 ? (
            <RailBlock title="Events on the same materials">
              <ul className="space-y-3">
                {related.map((e) => (
                  <li key={e.id}>
                    <p className="flex flex-wrap items-baseline gap-x-2 text-[0.8125rem] leading-5 text-faint">
                      <time dateTime={e.date} className="tnum">
                        {formatDate(e.date)}
                      </time>
                      <JurisdictionTag code={e.jurisdiction} />
                    </p>
                    <Link href={`/events/${e.id}`} className="link-quiet text-pretty text-foreground">
                      {e.titleEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </RailBlock>
          ) : null
        }
      >
        <Section id="summary" title="Summary">
          <Prose>{event.summary}</Prose>
        </Section>

        <Section id="significance" title="Analytical significance">
          <Prose>{event.analyticalSignificance}</Prose>
        </Section>

        <Section id="framing" title="Framing anchors">
          {framing.length > 0 ? (
            <div className="grid gap-6">
              {framing.map((f) => (
                <FramingQuote key={f.id} claim={f} source={getSourceById(f.sourceId)} />
              ))}
            </div>
          ) : (
            <Qualifier>
              Framing: <span className="text-faint">Not yet coded.</span> A verified quotation from the primary source is
              still needed before assigning a framing category.
            </Qualifier>
          )}
        </Section>

        {/* Drawn only where the event holds commitment rows with identified parties; otherwise it renders nothing. */}
        <CapitalFlowExhibit eventId={event.id} density="summary" id="financing-status" />

        {hasInstruments ? (
          <Section id="instruments" title="Instruments in this event">
            <InstrumentLines commitments={commitments} controls={controls} />
          </Section>
        ) : null}

        {recordedStatuses.length ? (
          <Section
            id="recorded-status"
            title="Control status this event records"
            description="This event's source records a status of a control measure coded under another event."
          >
            <RecordList>
              {recordedStatuses.map(({ measure, entry }) => (
                <ControlLine key={`${measure.id}-${entry.status}`} m={summarizeControl(measure, site.legalStatusAsOf)}>
                  <FactNote>
                    Status stated: {controlStatusLabels[entry.status].toLowerCase()}
                    {entry.date ? `, ${formatDate(entry.date)}` : ""}
                  </FactNote>
                </ControlLine>
              ))}
            </RecordList>
          </Section>
        ) : null}

        {designations.length ? (
          <Section
            id="designations"
            title="Projects recognized"
            count={designations.length}
            description="Project designations confer standing under a scheme. Any financing appears separately under financing."
          >
            <RecordList>
              {designations.map((d) => (
                <DesignationLine key={d.id} d={d} showProject />
              ))}
            </RecordList>
          </Section>
        ) : null}

        <Section id="sources" title="Sources" count={sources.length}>
          <div className="grid gap-4">
            {sources.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        </Section>

        <section id="cite" className="scroll-mt-24">
          <CiteBlock plain={plainCitation(event)} eventId={event.id} primaryUrls={sources.map((s) => s.url)} />
        </section>
      </RecordLayout>
    </Container>
  );
}
