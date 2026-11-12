import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RecordList } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JurisdictionTag } from "@/components/labels";
import {
  ControlStatusBadge,
  ControlStatusTrail,
  EvidenceTable,
  Fact,
  NotStated,
} from "@/components/capital/primitives";
import { ControlRow } from "@/components/capital/rows";
import {
  controlEndPassed,
  controlEntryOn,
  controlStatusOn,
  scheduledControlEntry,
  statusEntriesRecordedElsewhere,
  summarizeControl,
} from "@/lib/capital-control";
import { site } from "@/lib/site";
import {
  getAllControlMeasures,
  getControlMeasureById,
  getEventById,
  getMaterialsByIds,
} from "@/lib/data";
import {
  controlledItemTypeLabels,
  controlDirectionLabels,
  controlEvidenceFieldLabels,
  controlMeasureTypeLabels,
  controlStatusLabels,
  materialAttributionLabels,
  productCodeRoleLabels,
  productCodeSystemLabels,
  supplyChainStageLabels,
  targetScopeLabels,
} from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { ProductCode } from "@/lib/types";

export function generateStaticParams() {
  return getAllControlMeasures().map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = getControlMeasureById(id);
  if (!m) return { title: "Control clause not found" };
  const e = getEventById(m.eventId)!;
  return {
    title: `${controlMeasureTypeLabels[m.measureType]}${m.clause ? ` · ${m.clause}` : ""} — ${e.documentNumber ?? e.titleEn}`,
    description: m.notes ?? e.summary,
  };
}

const hasCjk = (s: string) => /[぀-ヿ㐀-鿿]/.test(s);

export default async function ControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getControlMeasureById(id);
  if (!m) notFound();
  const event = getEventById(m.eventId)!;
  const materials = getMaterialsByIds(m.materialIds);
  // The status in effect on the legal-status date, never a later-dated entry: that one is "scheduled".
  const asOf = site.legalStatusAsOf;
  const current = controlEntryOn(m, asOf) ?? m.statusHistory[0];
  const scheduled = scheduledControlEntry(m, asOf);
  const endPassed = controlEndPassed(m, asOf);
  const all = getAllControlMeasures();
  const modifies = m.modifiesMeasureIds.map((x) => getControlMeasureById(x)!).filter(Boolean);
  const modifiedBy = all.filter((x) => x.modifiesMeasureIds.includes(m.id));
  const siblings = all.filter((x) => x.eventId === m.eventId && x.id !== m.id);
  const codeGroups = m.productCodes.reduce<Record<string, ProductCode[]>>((acc, c) => {
    const k = `${c.system}|${c.role}`;
    (acc[k] ??= []).push(c);
    return acc;
  }, {});

  return (
    <Container className="py-12">
      <Breadcrumbs items={[{ href: "/controls", label: "Controls" }, { label: controlMeasureTypeLabels[m.measureType] }]} />

      <header className="mt-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <JurisdictionTag code={event.jurisdiction} withName />
          <span aria-hidden className="text-faint">·</span>
          <span className="text-muted">{event.issuingBody}</span>
        </div>
        {event.documentNumber ? <p className="mt-3 font-display text-xs text-faint">{event.documentNumber}</p> : null}
        <h1 className="mt-3 page-title">
          {controlMeasureTypeLabels[m.measureType]}
          {m.clause ? <span className="text-muted"> · {m.clause}</span> : null}
        </h1>
        <p className="mt-2 max-w-prose text-lg leading-8 text-muted">
          <Link href={`/events/${event.id}`} className="hover:text-accent">{event.titleEn}</Link>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ControlStatusBadge status={current.status} />
          {current.until ? <span className="font-display text-xs text-muted">until {formatDate(current.until)}</span> : null}
          <Badge>{controlDirectionLabels[m.direction]}</Badge>
        </div>
        {scheduled ? (
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
            Status as of {formatDate(asOf)}. Scheduled, not yet in effect: <ControlStatusBadge status={scheduled.status} /> from {formatDate(scheduled.date!)}
            {scheduled.until ? ` to ${formatDate(scheduled.until)}` : ""}.
          </p>
        ) : endPassed ? (
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
            The stated end date has passed as of {formatDate(asOf)}. Its standing after that date depends on a further instrument; none is recorded, and none is assumed.
          </p>
        ) : null}
        <p className="mt-3 font-mono text-xs text-faint">{m.id}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <Section title="What it covers" description="In the instrument's own words.">
            <div className="border-y border-border-strong py-4">
              {m.productScopeAsStated ? (
                <p lang={hasCjk(m.productScopeAsStated) ? "zh" : "en"} className="text-pretty text-lg leading-relaxed">
                  {m.productScopeAsStated}
                </p>
              ) : (
                <NotStated>The source defines no product scope for this clause.</NotStated>
              )}
              {hasCjk(m.productScopeAsStated ?? "") ? (
                <p className="mt-3 text-xs text-faint">
                  Original-language wording, kept untranslated because it defines legal scope; the notes and the event summary give the English sense.
                </p>
              ) : null}
            </div>
          </Section>

          <Section title="Record">
            <div className="border-y border-border-strong">
              <dl>
                <Fact label="Targeting">
                  {m.targetScopes.length ? m.targetScopes.map((s) => targetScopeLabels[s]).join(", ") : <NotStated>The source does not define its targets</NotStated>}
                </Fact>
                {m.targetJurisdictions.length ? <Fact label="Named jurisdictions">{m.targetJurisdictions.join(", ")}</Fact> : null}
                {m.targetEntities.length ? (
                  <Fact label="Named entities">
                    <ul className="space-y-1">{m.targetEntities.map((e) => <li key={e}>{e}</li>)}</ul>
                  </Fact>
                ) : null}
                {m.targetEndUsersAsStated.length ? (
                  <Fact label="End users">
                    <ul className="space-y-1">{m.targetEndUsersAsStated.map((e) => <li key={e} lang={hasCjk(e) ? "zh" : undefined}>{e}</li>)}</ul>
                  </Fact>
                ) : null}
                {m.targetEndUsesAsStated.length ? (
                  <Fact label="End uses">
                    <ul className="space-y-1">{m.targetEndUsesAsStated.map((e) => <li key={e} lang={hasCjk(e) ? "zh" : undefined}>{e}</li>)}</ul>
                  </Fact>
                ) : null}
                <Fact label="Materials">
                  {materials.length ? (
                    <span className="flex flex-wrap gap-x-3 gap-y-1">
                      {materials.map((x) => (
                        <Link key={x.id} href={`/materials/${x.slug}`} className="link-quiet">{x.nameEn}</Link>
                      ))}
                    </span>
                  ) : null}
                  {m.untrackedMaterialsAsStated.length ? <span className="mt-1 block text-muted">Also names: {m.untrackedMaterialsAsStated.join("; ")}</span> : null}
                  <span className="mt-1 block font-display text-xs text-faint">{materialAttributionLabels[m.materialAttribution]}</span>
                </Fact>
                <Fact label="Items and stages">
                  {m.controlledItemTypes.length ? (
                    <>
                      <span className="flex flex-wrap gap-x-3 gap-y-1">
                        {m.controlledItemTypes.map((t) => <Badge key={t}>{controlledItemTypeLabels[t]}</Badge>)}
                      </span>
                      <span className="mt-1 block text-muted">
                        {m.controlledStages.length
                          ? `Covered items belong to: ${m.controlledStages.map((s) => supplyChainStageLabels[s].toLowerCase()).join(", ")}`
                          : "No stage coded: the covered items are listed in an unread annex or sit outside the tracked materials."}
                      </span>
                      <span className="mt-1 block font-display text-xs text-faint">
                        The supply-chain stage of the covered items; any restriction effect is recorded separately.
                      </span>
                    </>
                  ) : (
                    <NotStated>The clause defines no items of its own</NotStated>
                  )}
                </Fact>
                <Fact label="Legal basis">
                  {m.legalBasisAsStated ? <span lang={hasCjk(m.legalBasisAsStated) ? "zh" : undefined}>{m.legalBasisAsStated}</span> : <NotStated />}
                  {m.legalBasisEventIds.length ? (
                    <span className="mt-1 flex flex-wrap gap-x-3">
                      {m.legalBasisEventIds.map((id) => (
                        <Link key={id} href={`/events/${id}`} className="link-quiet">{getEventById(id)?.titleEn ?? id}</Link>
                      ))}
                    </span>
                  ) : null}
                </Fact>
                {m.modifiesExternalInstruments.length ? (
                  <Fact label="Modifies (outside the corpus)">
                    <ul className="space-y-1">{m.modifiesExternalInstruments.map((x) => <li key={x} lang={hasCjk(x) ? "zh" : undefined}>{x}</li>)}</ul>
                  </Fact>
                ) : null}
              </dl>
            </div>
          </Section>

          <Section title="Status" description={`Listed oldest first. The entry in effect on ${formatDate(asOf)} is marked current; a later-dated entry is marked scheduled. End dates follow the governing source.`}>
            <div className="border-y border-border-strong py-4">
              <ControlStatusTrail entries={m.statusHistory} asOf={asOf} />
              {statusEntriesRecordedElsewhere(m).map(({ entry, event }) => (
                <p key={`${entry.status}-${event.id}`} className="mt-4 border-t pt-4 text-sm leading-6 text-muted">
                  The &ldquo;{controlStatusLabels[entry.status].toLowerCase()}&rdquo; entry is recorded in a separate event:{" "}
                  <Link href={`/events/${event.id}`} className="link-quiet">
                    {event.documentNumber?.split(";")[0] ?? event.titleEn}
                  </Link>{" "}
                  ({formatDate(event.date)}). The event page describes the associated policy action.
                </p>
              ))}
            </div>
          </Section>

          {modifies.length || modifiedBy.length ? (
            <Section title="Linked clauses" description="Clauses this one suspends or modifies, and clauses that act on it.">
              <div className="space-y-4">
                {modifies.length ? (
                  <div>
                    <p className="mb-1 font-display text-xs text-faint">Acts on</p>
                    <RecordList>{modifies.map((x) => <ControlRow key={x.id} m={summarizeControl(x, asOf)} />)}</RecordList>
                  </div>
                ) : null}
                {modifiedBy.length ? (
                  <div>
                    <p className="mb-1 font-display text-xs text-faint">Acted on by</p>
                    <RecordList>{modifiedBy.map((x) => <ControlRow key={x.id} m={summarizeControl(x, asOf)} />)}</RecordList>
                  </div>
                ) : null}
              </div>
            </Section>
          ) : null}

          {m.productCodes.length ? (
            <Section title={`Product codes (${m.productCodes.length})`} description="As printed. A reference code is for convenience; the item description governs.">
              <div className="space-y-4">
                {Object.entries(codeGroups).map(([k, codes]) => (
                  <div key={k} className="border-t border-border-strong pt-3">
                    <p className="font-display text-xs text-faint">
                      {productCodeSystemLabels[codes[0].system]} · {productCodeRoleLabels[codes[0].role]}
                    </p>
                    <p className="tnum mt-2 flex flex-wrap gap-x-3 gap-y-1 font-display text-xs text-muted">
                      {codes.map((c) => <span key={c.code}>{c.code}</span>)}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {m.notes ? (
            <Section title="Notes">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground">{m.notes}</p>
            </Section>
          ) : null}

          <Section title="Evidence" description="Which source supports which field, how directly, and where.">
            <EvidenceTable evidence={m.evidence} fieldLabels={controlEvidenceFieldLabels} />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {siblings.length ? (
            <div className="border-t border-border-strong pt-3">
              <h2 className="mb-2 font-display text-xs text-faint">Other clauses in this event</h2>
              <ul className="space-y-2">
                {siblings.map((x) => (
                  <li key={x.id}>
                    <Link href={`/controls/${x.id}`} className="group block text-sm">
                      <span className="group-hover:text-accent">{controlMeasureTypeLabels[x.measureType]}{x.clause ? ` · ${x.clause}` : ""}</span>
                      <span className="mt-0.5 block"><ControlStatusBadge status={controlStatusOn(x, asOf) ?? x.statusHistory[0].status} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="border-t border-border-strong pt-3 text-sm">
            <h2 className="mb-2 font-display text-xs text-faint">Machine-readable</h2>
            <a href={`/api/v1/control-measures/${m.id}`} className="link-quiet">JSON record with sources</a>
          </div>
        </aside>
      </div>
    </Container>
  );
}
