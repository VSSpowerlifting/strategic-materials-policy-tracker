import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import {
  AmountDetail,
  CapitalSourceBadge,
  EvidenceTable,
  Fact,
  FinancialStatusBadge,
  FinancialStatusTrail,
  ImplementationStatusTrail,
  InstrumentBadge,
  NotStated,
  OptionLadder,
  SourceMention,
  ValueRoleBadge,
} from "@/components/capital/primitives";
import { CommitmentRow, ProviderTag, optionStatusLabel } from "@/components/capital/rows";
import { OrgList, ProgrammeLink, ProjectLink } from "@/components/intelligence/org-link";
import { Badge } from "@/components/ui/badge";
import {
  childLinks,
  commitmentActor,
  currentFinancialStatus,
  optionState,
  summarizeCommitment,
} from "@/lib/capital-control";
import { groupDecimal } from "@/lib/decimal";
import {
  getAllFinancialCommitments,
  getEventById,
  getFinancialCommitmentById,
  getMaterialsByIds,
} from "@/lib/data";
import {
  financialEvidenceFieldLabels,
  financialRelationshipTypeLabels,
  materialAttributionLabels,
  outcomeAttributionLabels,
  outcomeMetricLabels,
  stageAllocationLabels,
  supplyChainStageLabels,
  termKindLabels,
  valueQualifierLabels,
  valueRoleLabels,
} from "@/lib/labels";
import { formatDate } from "@/lib/format";
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
  const option = c.valueRole === "funding_option" ? optionState(c) : null;
  const optionStep = (list: typeof children[number]["commitment"][]) =>
    list.map((e) => ({ id: e.id, label: `${e.amount ? e.amount.amountAsStated : "no amount stated"}` }));
  // Numbered in render order so a skipped optional section leaves no gap.
  let n = 0;
  const next = () => String(++n).padStart(2, "0");

  return (
    <Container className="py-12">
      <Link href="/capital" className="font-display text-sm text-muted hover:text-foreground">
        ← Capital
      </Link>

      <header className="mt-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <ProviderTag code={actor} withName />
          <span aria-hidden className="text-faint">·</span>
          <span className="text-muted">{c.provider ?? "Provider not stated"}</span>
        </div>
        <h1 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight">
          {c.recipient ?? c.provider ?? "Recipient not stated"}
        </h1>
        {c.project ? <p className="mt-2 max-w-prose text-lg leading-8 text-muted">{c.project}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ValueRoleBadge role={c.valueRole} />
          <InstrumentBadge instrument={c.instrument} />
          <CapitalSourceBadge source={c.capitalSource} />
          {option ? (
            <Badge>{optionStatusLabel(status, option.exercises.length > 0)}</Badge>
          ) : (
            <FinancialStatusBadge status={status} />
          )}
        </div>
        <p className="mt-3 font-mono text-xs text-faint">{c.id}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <Section index={next()} title="Amount">
            {c.amount ? (
              <Card className="p-5">
                <AmountDetail amount={c.amount} />
                {option ? (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-3 text-sm leading-6 text-muted">
                      A <strong className="font-semibold text-foreground">funding option</strong>: a ceiling the recipient may call on
                      under an executed agreement. An executed option is not committed money, so this figure is never added to any
                      total. An exercise would be recorded as its own commitment drawn from this row, with its own payment status.
                    </p>
                    <OptionLadder
                      executed={option.executed ? { date: option.executed.date, sourceId: option.executed.sourceId } : null}
                      exercises={optionStep(option.exercises)}
                      disbursements={optionStep(option.disbursements)}
                    />
                  </div>
                ) : c.valueRole !== "commitment" ? (
                  <p className="mt-3 border-t pt-3 text-sm leading-6 text-muted">
                    This figure is a <strong className="font-semibold text-foreground">{valueRoleLabels[c.valueRole].toLowerCase()}</strong>, not money
                    committed to a recipient. It is never added to commitments or to other roles.
                  </p>
                ) : null}
              </Card>
            ) : (
              <Card className="p-5 text-sm leading-6 text-muted">
                No amount is stated for this instrument. Its terms below are what the source commits to; no value is estimated.
              </Card>
            )}
          </Section>

          {c.relationships.length || children.length ? (
            <Section
              index={next()}
              title="Place in the money chain"
              description="A figure is never counted together with a figure it is part of or drawn from."
            >
              <div className="space-y-4">
                {c.relationships.map((r) => {
                  const parent = getFinancialCommitmentById(r.commitmentId);
                  return (
                    <div key={`${r.commitmentId}-${r.relationship}`}>
                      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                        This row is {financialRelationshipTypeLabels[r.relationship].toLowerCase()}
                      </p>
                      {parent ? (
                        <Card className="overflow-hidden">
                          <CommitmentRow c={summarizeCommitment(parent)} />
                        </Card>
                      ) : null}
                      <p className="mt-1 text-xs text-faint">
                        Stated by <SourceMention sourceId={r.sourceId} />
                        {r.locator ? ` · ${r.locator}` : ""}
                        {r.note ? ` — ${r.note}` : ""}
                      </p>
                    </div>
                  );
                })}
                {children.length ? (
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                      Rows that are part of or drawn from this one
                    </p>
                    <Card className="overflow-hidden">
                      {children.map(({ commitment, relationship }) => (
                        <CommitmentRow
                          key={commitment.id}
                          c={summarizeCommitment(commitment)}
                          relationLabel={financialRelationshipTypeLabels[relationship].toLowerCase() + " this row"}
                        />
                      ))}
                    </Card>
                  </div>
                ) : null}
              </div>
            </Section>
          ) : null}

          <Section index={next()} title="Record">
            <Card className="px-5 py-1">
              <dl>
                <Fact label="Provider">
                  {c.provider ?? <NotStated />}
                  {c.providerOrgIds.length ? <span className="mt-1 block"><OrgList ids={c.providerOrgIds} showKind /></span> : null}
                </Fact>
                <Fact label="Legal authority">{c.legalAuthority ?? <NotStated />}</Fact>
                <Fact label="Programme">{c.programmeId ? <ProgrammeLink id={c.programmeId} /> : <NotStated>None named</NotStated>}</Fact>
                <Fact label="Recipient">
                  {c.recipient ?? <NotStated />}
                  {c.recipientOrgIds.length ? <span className="mt-1 block"><OrgList ids={c.recipientOrgIds} showKind /></span> : null}
                </Fact>
                <Fact label="Project">
                  {c.project ?? (c.projectId ? null : <NotStated />)}
                  {c.projectId ? <span className="mt-1 block"><ProjectLink id={c.projectId} /> <span className="font-mono text-[11px] text-faint">capital stack →</span></span> : null}
                </Fact>
                <Fact label="Facility">{c.facility ?? <NotStated />}</Fact>
                <Fact label="Location">
                  {c.locations.length ? (
                    c.locations.map((l, i) => (
                      <span key={i} className="block">
                        {l.asStated ?? l.subnational}
                        {l.countryCode ? <span className="ml-2 font-mono text-xs text-faint">{l.countryCode}</span> : null}
                      </span>
                    ))
                  ) : (
                    <NotStated />
                  )}
                </Fact>
                <Fact label="Stages">
                  {c.stages.length ? c.stages.map((s) => supplyChainStageLabels[s]).join(", ") : <NotStated />}
                  <span className="mt-1 block font-mono text-[11px] text-faint">{stageAllocationLabels[c.stageAllocation]}</span>
                </Fact>
                <Fact label="Materials">
                  {materials.length ? (
                    <span className="flex flex-wrap gap-x-3 gap-y-1">
                      {materials.map((m) => (
                        <Link key={m.id} href={`/materials/${m.slug}`} className="text-accent hover:text-accent-strong">
                          {m.nameEn}
                        </Link>
                      ))}
                    </span>
                  ) : null}
                  {c.untrackedMaterialsAsStated.length ? (
                    <span className="mt-1 block text-muted">Also names: {c.untrackedMaterialsAsStated.join("; ")}</span>
                  ) : null}
                  <span className="mt-1 block font-mono text-[11px] text-faint">{materialAttributionLabels[c.materialAttribution]}</span>
                </Fact>
              </dl>
            </Card>
          </Section>

          <Section index={next()} title="Status" description="Financial and physical progress are separate histories. The last entry is current.">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-5">
                <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                  {option ? "Financial · the agreement granting the option" : "Financial"}
                </h3>
                <FinancialStatusTrail entries={c.financialStatusHistory} />
              </Card>
              <Card className="p-5">
                <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Implementation</h3>
                {c.implementationStatusHistory.length ? (
                  <ImplementationStatusTrail entries={c.implementationStatusHistory} />
                ) : (
                  <p className="text-sm text-muted">No source states the physical status of a project for this row.</p>
                )}
              </Card>
            </div>
          </Section>

          {c.terms.length ? (
            <Section index={next()} title="Terms" description="Operative terms as the source words them.">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-card font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                      <th scope="col" className="px-3 py-2 font-normal">Term</th>
                      <th scope="col" className="px-3 py-2 font-normal">Figure</th>
                      <th scope="col" className="px-3 py-2 font-normal">As stated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.terms.map((t, i) => (
                      <tr key={i} className="border-b align-top last:border-b-0">
                        <td className="px-3 py-3 font-display">{termKindLabels[t.kind]}</td>
                        <td className="tnum whitespace-nowrap px-3 py-3 font-mono text-xs">{figure(t.value, t.qualifier, t.currency, t.unit) ?? "—"}</td>
                        <td className="px-3 py-3 text-muted">
                          “{t.asStated}”
                          {t.note ? <span className="mt-1 block text-xs text-faint">{t.note}</span> : null}
                          <span className="mt-1 block"><SourceMention sourceId={t.sourceId} /></span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : null}

          {c.outcomes.length ? (
            <Section index={next()} title="Stated outcomes" description="Who says it matters: a company target is not a government commitment.">
              <div className="grid gap-3">
                {c.outcomes.map((o, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-display font-semibold">{outcomeMetricLabels[o.metric]}</span>
                      <span className="font-mono text-[11px] text-muted">{outcomeAttributionLabels[o.statedBy]}</span>
                    </div>
                    <p className="tnum mt-1 font-mono text-sm">
                      {o.targetDate ?? figure(o.value, o.qualifier, null, o.unit) ?? ""}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted">“{o.asStated}”</p>
                    {o.note ? <p className="mt-1 text-xs text-faint">{o.note}</p> : null}
                    <p className="mt-1"><SourceMention sourceId={o.sourceId} /></p>
                  </Card>
                ))}
              </div>
            </Section>
          ) : null}

          {c.notes ? (
            <Section index={next()} title="Notes">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">{c.notes}</p>
            </Section>
          ) : null}

          <Section index={next()} title="Evidence" description="Every populated field names the source that states it, how directly, and where.">
            <EvidenceTable evidence={c.evidence} fieldLabels={financialEvidenceFieldLabels} />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">From the event</h2>
            <Link href={`/events/${event.id}`} className="font-display font-semibold leading-snug hover:text-accent">
              {event.titleEn}
            </Link>
            <p className="mt-1 font-mono text-xs text-faint">{formatDate(event.date)}</p>
          </Card>
          <Card className="p-4 text-sm">
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Machine-readable</h2>
            <a href={`/api/v1/financial-commitments/${c.id}`} className="text-accent hover:text-accent-strong">
              JSON record with sources
            </a>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
