import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AmountDetail,
  EvidenceTable,
  FinancialStatusTrail,
  ImplementationStatusTrail,
  OptionLadder,
  SourceMention,
} from "@/components/capital/primitives";
import { RecordReadingGuide } from "@/components/capital/reading-guide";
import { ProviderTag, optionStatusLabel } from "@/components/capital/rows";
import { OrgList, ProgrammeLink, ProjectLink } from "@/components/intelligence/org-link";
import {
  FactNote,
  GroupHeading,
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
import { CommitmentLine, financialStatusTone } from "@/components/record/rows";
import { Container, Section } from "@/components/ui/container";
import {
  childLinks,
  commitmentActor,
  currentFinancialStatus,
  optionState,
  summarizeCommitment,
} from "@/lib/capital-control";
import {
  getAllFinancialCommitments,
  getEventById,
  getFinancialCommitmentById,
  getMaterialsByIds,
} from "@/lib/data";
import { groupDecimal } from "@/lib/decimal";
import { formatDate } from "@/lib/format";
import {
  capitalSourceLabels,
  financialEvidenceFieldLabels,
  financialInstrumentLabels,
  financialRelationshipTypeLabels,
  financialStatusLabels,
  materialAttributionLabels,
  outcomeAttributionLabels,
  outcomeMetricLabels,
  stageAllocationLabels,
  supplyChainStageLabels,
  termKindLabels,
  valueQualifierLabels,
  valueRoleLabels,
} from "@/lib/labels";
import type { ValueQualifier } from "@/lib/types";

export function generateStaticParams() {
  return getAllFinancialCommitments().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getFinancialCommitmentById(id);
  if (!c) return { title: "Financial row not found" };
  const who = c.recipient ?? c.provider ?? id;
  return {
    title: `${who} — ${valueRoleLabels[c.valueRole]}`,
    description: c.amount ? `${c.amount.amountAsStated}. ${c.notes ?? ""}`.trim() : c.notes ?? undefined,
  };
}

const figure = (value: string | null, qualifier: ValueQualifier | null, currency: string | null, unit: string | null) =>
  value === null
    ? null
    : `${qualifier && qualifier !== "exact" ? `${valueQualifierLabels[qualifier].toLowerCase()} ` : ""}${currency ? `${currency} ` : ""}${groupDecimal(value)}${unit ? ` ${unit}` : ""}`;

export default async function CommitmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getFinancialCommitmentById(id);
  if (!c) notFound();
  const event = getEventById(c.eventId)!;
  const materials = getMaterialsByIds(c.materialIds);
  const children = childLinks(c.id);
  const actor = commitmentActor(c);
  const status = currentFinancialStatus(c);
  const statusEntry = c.financialStatusHistory[c.financialStatusHistory.length - 1];
  const option = c.valueRole === "funding_option" ? optionState(c) : null;
  const optionStep = (list: typeof children[number]["commitment"][]) =>
    list.map((e) => ({ id: e.id, label: `${e.amount ? e.amount.amountAsStated : "no amount stated"}` }));
  const title = c.recipient ?? c.provider ?? "Recipient not stated";
  const inChain = c.relationships.length > 0 || children.length > 0;

  const contents = [
    { href: "#amount", label: "Amount" },
    { href: "#status", label: "Status" },
    ...(inChain ? [{ href: "#money-chain", label: "Place in the money chain" }] : []),
    { href: "#reading", label: "Evidence and status" },
    ...(c.terms.length ? [{ href: "#terms", label: "Terms" }] : []),
    ...(c.outcomes.length ? [{ href: "#outcomes", label: "Stated outcomes" }] : []),
    ...(c.notes ? [{ href: "#notes", label: "Notes" }] : []),
    { href: "#evidence", label: "Evidence" },
  ];

  return (
    <Container className="py-12 sm:py-16">
      <RecordTitleBlock
        breadcrumbs={[{ href: "/capital", label: "Financing" }, { label: title }]}
        title={title}
        subtitle={c.project ? <p className="standfirst mt-5 max-w-2xl">{c.project}</p> : null}
        identity={
          <>
            <IdentityItem>
              <ProviderTag code={actor} withName />
            </IdentityItem>
            <IdentityItem>{c.provider ?? "Provider not stated"}</IdentityItem>
            <IdentityItem>
              <RecordId id={c.id} />
            </IdentityItem>
          </>
        }
        status={
          <StatusLine
            label={option ? optionStatusLabel(status, option.exercises.length > 0) : financialStatusLabels[status]}
            tone={option ? "neutral" : financialStatusTone(status)}
          >
            {statusEntry?.date ? (
              <time dateTime={statusEntry.date} className="tnum">
                {formatDate(statusEntry.date)}
              </time>
            ) : (
              <span>Date not stated</span>
            )}
          </StatusLine>
        }
      />

      <RecordFacts label="Key facts" flush>
        <RecordFact label="Value role">{valueRoleLabels[c.valueRole]}</RecordFact>
        <RecordFact label="Instrument">{financialInstrumentLabels[c.instrument]}</RecordFact>
        <RecordFact label="Capital source">{capitalSourceLabels[c.capitalSource]}</RecordFact>
        <RecordFact label="Amount as stated">
          {c.amount ? (
            <>
              “{c.amount.amountAsStated}”<FactNote>{c.amount.currency}</FactNote>
            </>
          ) : (
            <Unknown />
          )}
        </RecordFact>
        <RecordFact label="Provider">
          {c.provider ?? <Unknown />}
          {c.providerOrgIds.length ? (
            <span className="mt-1 block">
              <OrgList ids={c.providerOrgIds} showKind />
            </span>
          ) : null}
        </RecordFact>
        <RecordFact label="Recipient">
          {c.recipient ?? <Unknown />}
          {c.recipientOrgIds.length ? (
            <span className="mt-1 block">
              <OrgList ids={c.recipientOrgIds} showKind />
            </span>
          ) : null}
        </RecordFact>
        <RecordFact label="Legal authority">{c.legalAuthority ?? <Unknown />}</RecordFact>
        <RecordFact label="Programme">{c.programmeId ? <ProgrammeLink id={c.programmeId} /> : <Unknown>None named</Unknown>}</RecordFact>
        <RecordFact label="Project" wide>
          {c.project ?? (c.projectId ? null : <Unknown />)}
          {c.projectId ? (
            <span className="mt-1 block">
              <ProjectLink id={c.projectId} />
            </span>
          ) : null}
          {c.associatedProjectIds?.length ? (
            <span className="mt-2 block text-muted">
              Shared / unallocated financing. The reported amount is associated with several projects and remains outside each individual capital stack.
              {c.associatedProjectIds.map((id) => (
                <span key={id} className="mt-1 block">
                  <ProjectLink id={id} />
                </span>
              ))}
            </span>
          ) : null}
        </RecordFact>
        <RecordFact label="Facility">{c.facility ?? <Unknown />}</RecordFact>
        <RecordFact label="Location">
          {c.locations.length ? (
            c.locations.map((l, i) => (
              <span key={i} className="block">
                {l.asStated ?? l.subnational}
                {l.countryCode ? <span className="ml-2 text-[0.8125rem] text-faint">{l.countryCode}</span> : null}
              </span>
            ))
          ) : (
            <Unknown />
          )}
        </RecordFact>
        <RecordFact label="Stages">
          {c.stages.length ? c.stages.map((s) => supplyChainStageLabels[s]).join(", ") : <Unknown />}
          <FactNote>{stageAllocationLabels[c.stageAllocation]}</FactNote>
        </RecordFact>
        <RecordFact label="Materials" wide>
          {materials.length ? (
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              {materials.map((m) => (
                <Link key={m.id} href={`/materials/${m.slug}`} className="link-quiet">
                  {m.nameEn}
                </Link>
              ))}
            </span>
          ) : null}
          {c.untrackedMaterialsAsStated.length ? (
            <span className="mt-1 block text-muted">Also names: {c.untrackedMaterialsAsStated.join("; ")}</span>
          ) : null}
          <FactNote>{materialAttributionLabels[c.materialAttribution]}</FactNote>
        </RecordFact>
      </RecordFacts>

      <RecordLayout
        contents={contents}
        rail={
          <>
            <RailBlock title="Recorded in">
              <Link href={`/events/${event.id}`} className="link-quiet text-pretty text-foreground">
                {event.titleEn}
              </Link>
              <p className="mt-1 text-[0.8125rem] text-faint">
                <time dateTime={event.date} className="tnum">
                  {formatDate(event.date)}
                </time>
              </p>
            </RailBlock>
            <RailBlock title="Machine-readable">
              <a href={`/api/v1/financial-commitments/${c.id}`} className="link-quiet text-foreground">
                JSON with sources
              </a>
            </RailBlock>
          </>
        }
      >
        <Section id="amount" title="Amount">
          {c.amount ? (
            <div>
              <AmountDetail amount={c.amount} />
              {option ? (
                <div className="mt-5 border-t border-border pt-5">
                  <Qualifier className="mb-4">
                    A <strong className="font-semibold text-foreground">funding option</strong>: a ceiling the recipient may call on
                    under an executed agreement. Its value is displayed separately from committed funding. Any exercise
                    becomes a distinct commitment with its own payment status.
                  </Qualifier>
                  <OptionLadder
                    executed={option.executed ? { date: option.executed.date, sourceId: option.executed.sourceId } : null}
                    exercises={optionStep(option.exercises)}
                    endedExercises={optionStep(option.endedExercises)}
                    disbursements={optionStep(option.disbursements)}
                  />
                </div>
              ) : c.valueRole !== "commitment" ? (
                <Qualifier className="mt-5 border-t border-border pt-5">
                  This figure is a{" "}
                  <strong className="font-semibold text-foreground">{valueRoleLabels[c.valueRole].toLowerCase()}</strong>. Its
                  reported value belongs to a distinct category, separate from recipient commitments.
                </Qualifier>
              ) : null}
            </div>
          ) : (
            <Qualifier>The source states this instrument’s terms but leaves the amount unspecified.</Qualifier>
          )}
        </Section>

        <Section
          id="status"
          title="Status"
          description="Financial and physical progress are separate histories. The last entry is current."
        >
          <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
            <div>
              <GroupHeading className="mb-4">{option ? "Financial: the agreement granting the option" : "Financial"}</GroupHeading>
              <FinancialStatusTrail entries={c.financialStatusHistory} />
            </div>
            <div>
              <GroupHeading className="mb-4">Implementation</GroupHeading>
              {c.implementationStatusHistory.length ? (
                <ImplementationStatusTrail entries={c.implementationStatusHistory} />
              ) : (
                <Qualifier>No source states the physical status of a project for this row.</Qualifier>
              )}
            </div>
          </div>
        </Section>

        {inChain ? (
          <Section
            id="money-chain"
            title="Place in the money chain"
            description="Parent packages and drawn amounts are reconciled to count each underlying instrument once."
          >
            <div className="space-y-8">
              {c.relationships.map((r) => {
                const parent = getFinancialCommitmentById(r.commitmentId);
                return (
                  <div key={`${r.commitmentId}-${r.relationship}`}>
                    <GroupHeading>This row is {financialRelationshipTypeLabels[r.relationship].toLowerCase()}</GroupHeading>
                    {parent ? (
                      <RecordList>
                        <CommitmentLine c={summarizeCommitment(parent)} />
                      </RecordList>
                    ) : null}
                    <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 font-display text-[0.8125rem] leading-5 text-muted">
                      <span>
                        Stated by <SourceMention sourceId={r.sourceId} />
                      </span>
                      {r.locator ? <span>{r.locator}</span> : null}
                    </p>
                    {r.note ? <p className="mt-1 max-w-[38rem] text-[0.875rem] leading-6 text-muted">{r.note}</p> : null}
                  </div>
                );
              })}
              {children.length ? (
                <div>
                  <GroupHeading>Rows that are part of or drawn from this one</GroupHeading>
                  <RecordList>
                    {children.map(({ commitment, relationship }) => (
                      <CommitmentLine
                        key={commitment.id}
                        c={summarizeCommitment(commitment)}
                        relationLabel={financialRelationshipTypeLabels[relationship].toLowerCase() + " this row"}
                      />
                    ))}
                  </RecordList>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        <div id="reading" className="scroll-mt-24">
          <RecordReadingGuide record={c} />
        </div>

        {c.terms.length ? (
          <Section id="terms" title="Terms">
            <RecordList>
              {c.terms.map((t, i) => (
                <li key={i} className="grid gap-x-8 gap-y-1 border-b border-border py-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
                  <div>
                    <h3 className="font-display text-[0.9375rem] font-medium leading-6">{termKindLabels[t.kind]}</h3>
                    <p className="tnum font-display text-[0.9375rem] leading-6 text-foreground">
                      {figure(t.value, t.qualifier, t.currency, t.unit) ?? <span className="text-faint">—</span>}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-pretty text-[0.9375rem] leading-7 text-muted">“{t.asStated}”</p>
                    {t.note ? <p className="mt-1 text-[0.8125rem] leading-5 text-faint">{t.note}</p> : null}
                    <p className="mt-1">
                      <SourceMention sourceId={t.sourceId} />
                    </p>
                  </div>
                </li>
              ))}
            </RecordList>
          </Section>
        ) : null}

        {c.outcomes.length ? (
          <Section
            id="outcomes"
            title="Stated outcomes"
            description="Who says it matters: a company target is not a government commitment."
          >
            <RecordList>
              {c.outcomes.map((o, i) => (
                <li key={i} className="grid gap-x-8 gap-y-1 border-b border-border py-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
                  <div>
                    <h3 className="font-display text-[0.9375rem] font-medium leading-6">{outcomeMetricLabels[o.metric]}</h3>
                    <p className="font-display text-[0.8125rem] leading-5 text-muted">{outcomeAttributionLabels[o.statedBy]}</p>
                    <p className="tnum mt-1 font-display text-[0.9375rem] leading-6 text-foreground">
                      {o.targetDate ?? figure(o.value, o.qualifier, null, o.unit) ?? ""}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-pretty text-[0.9375rem] leading-7 text-muted">“{o.asStated}”</p>
                    {o.note ? <p className="mt-1 text-[0.8125rem] leading-5 text-faint">{o.note}</p> : null}
                    <p className="mt-1">
                      <SourceMention sourceId={o.sourceId} />
                    </p>
                  </div>
                </li>
              ))}
            </RecordList>
          </Section>
        ) : null}

        {c.notes ? (
          <Section id="notes" title="Notes">
            <Prose>{c.notes}</Prose>
          </Section>
        ) : null}

        <Section id="evidence" title="Evidence">
          <EvidenceTable evidence={c.evidence} fieldLabels={financialEvidenceFieldLabels} />
        </Section>
      </RecordLayout>
    </Container>
  );
}
