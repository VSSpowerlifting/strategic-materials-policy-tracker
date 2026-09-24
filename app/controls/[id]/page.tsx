import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
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
import { currentControlEntry, statusEntriesRecordedElsewhere, summarizeControl } from "@/lib/capital-control";
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
  const current = currentControlEntry(m);
  const all = getAllControlMeasures();
  const modifies = m.modifiesMeasureIds.map((x) => getControlMeasureById(x)!).filter(Boolean);
  const modifiedBy = all.filter((x) => x.modifiesMeasureIds.includes(m.id));
  const siblings = all.filter((x) => x.eventId === m.eventId && x.id !== m.id);
  const codeGroups = m.productCodes.reduce<Record<string, ProductCode[]>>((acc, c) => {
    const k = `${c.system}|${c.role}`;
    (acc[k] ??= []).push(c);
    return acc;
  }, {});
  let n = 0;
  const next = () => String(++n).padStart(2, "0");

  return (
    <Container className="py-12">
      <Link href="/controls" className="font-display text-sm text-muted hover:text-foreground">
        ← Controls
      </Link>

      <header className="mt-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <JurisdictionTag code={event.jurisdiction} withName />
          <span aria-hidden className="text-faint">·</span>
          <span className="text-muted">{event.issuingBody}</span>
        </div>
        {event.documentNumber ? <p className="mt-3 font-mono text-xs text-faint">{event.documentNumber}</p> : null}
        <h1 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight">
          {controlMeasureTypeLabels[m.measureType]}
          {m.clause ? <span className="text-muted"> · {m.clause}</span> : null}
        </h1>
        <p className="mt-2 max-w-prose text-lg leading-8 text-muted">
          <Link href={`/events/${event.id}`} className="hover:text-accent">{event.titleEn}</Link>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ControlStatusBadge status={current.status} />
          {current.until ? <span className="font-mono text-[11px] text-muted">until {formatDate(current.until)}</span> : null}
          <Badge>{controlDirectionLabels[m.direction]}</Badge>
        </div>
        <p className="mt-3 font-mono text-xs text-faint">{m.id}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <Section index={next()} title="What it covers" description="In the instrument's own words.">
            <Card className="p-5">
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
            </Card>
          </Section>

          <Section index={next()} title="Record">
            <Card className="px-5 py-1">
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
                        <Link key={x.id} href={`/materials/${x.slug}`} className="text-accent hover:text-accent-strong">{x.nameEn}</Link>
                      ))}
                    </span>
                  ) : null}
                  {m.untrackedMaterialsAsStated.length ? <span className="mt-1 block text-muted">Also names: {m.untrackedMaterialsAsStated.join("; ")}</span> : null}
                  <span className="mt-1 block font-mono text-[11px] text-faint">{materialAttributionLabels[m.materialAttribution]}</span>
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
                      <span className="mt-1 block font-mono text-[11px] text-faint">
                        Where the items belong, not a claim that the clause restricts that stage.
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
                        <Link key={id} href={`/events/${id}`} className="text-accent hover:text-accent-strong">{getEventById(id)?.titleEn ?? id}</Link>
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
            </Card>
          </Section>

          <Section index={next()} title="Status" description="Oldest first; the last entry is current. A stated end date is shown, never extended by inference.">
            <Card className="p-5">
              <ControlStatusTrail entries={m.statusHistory} />
              {statusEntriesRecordedElsewhere(m).map(({ entry, event }) => (
                <p key={`${entry.status}-${event.id}`} className="mt-4 border-t pt-4 text-sm leading-6 text-muted">
                  The &ldquo;{controlStatusLabels[entry.status].toLowerCase()}&rdquo; entry is recorded in a separate event:{" "}
                  <Link href={`/events/${event.id}`} className="text-accent hover:text-accent-strong">
                    {event.documentNumber?.split(";")[0] ?? event.titleEn}
                  </Link>{" "}
                  ({formatDate(event.date)}). That event is not a control measure of its own; see its page for what it does.
                </p>
              ))}
            </Card>
          </Section>

          {modifies.length || modifiedBy.length ? (
            <Section index={next()} title="Linked clauses" description="Clauses this one suspends or modifies, and clauses that act on it.">
              <div className="space-y-4">
                {modifies.length ? (
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Acts on</p>
                    <Card className="overflow-hidden">{modifies.map((x) => <ControlRow key={x.id} m={summarizeControl(x)} />)}</Card>
                  </div>
                ) : null}
                {modifiedBy.length ? (
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Acted on by</p>
                    <Card className="overflow-hidden">{modifiedBy.map((x) => <ControlRow key={x.id} m={summarizeControl(x)} />)}</Card>
                  </div>
                ) : null}
              </div>
            </Section>
          ) : null}

          {m.productCodes.length ? (
            <Section index={next()} title={`Product codes (${m.productCodes.length})`} description="As printed. A reference code is for convenience; the item description governs.">
              <div className="space-y-4">
                {Object.entries(codeGroups).map(([k, codes]) => (
                  <Card key={k} className="p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                      {productCodeSystemLabels[codes[0].system]} · {productCodeRoleLabels[codes[0].role]}
                    </p>
                    <p className="tnum mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted">
                      {codes.map((c) => <span key={c.code}>{c.code}</span>)}
                    </p>
                  </Card>
                ))}
              </div>
            </Section>
          ) : null}

          {m.notes ? (
            <Section index={next()} title="Notes">
              <p className="max-w-prose text-pretty text-lg leading-8 text-foreground/90">{m.notes}</p>
            </Section>
          ) : null}

          <Section index={next()} title="Evidence" description="Which source supports which field, how directly, and where.">
            <EvidenceTable evidence={m.evidence} fieldLabels={controlEvidenceFieldLabels} />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {siblings.length ? (
            <Card className="p-4">
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Other clauses in this event</h2>
              <ul className="space-y-2">
                {siblings.map((x) => (
                  <li key={x.id}>
                    <Link href={`/controls/${x.id}`} className="group block text-sm">
                      <span className="group-hover:text-accent">{controlMeasureTypeLabels[x.measureType]}{x.clause ? ` · ${x.clause}` : ""}</span>
                      <span className="mt-0.5 block"><ControlStatusBadge status={currentControlEntry(x).status} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          <Card className="p-4 text-sm">
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Machine-readable</h2>
            <a href={`/api/v1/control-measures/${m.id}`} className="text-accent hover:text-accent-strong">JSON record with sources</a>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
