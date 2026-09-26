import Link from "next/link";
import { ActorMonogram } from "@/components/actor-monogram";
import { EventListItem } from "@/components/event-card";
import { StatusBadge } from "@/components/labels";
import { Card } from "@/components/ui/card";
import { ExtLink } from "@/components/ui/ext-link";
import { formatDate } from "@/lib/format";
import { jurisdictionLabels, jurisdictionShort } from "@/lib/labels";
import { countWord } from "@/lib/lattice-view";
import type { CitedKind, DossierPayload, EventRow, RelatedItem, SourceCitation } from "@/lib/material-dossier";
import { FoldedList } from "./parts";

function childLine(children: EventRow["children"]): string | null {
  const parts = [
    children.commitments ? countWord(children.commitments, "capital row", "capital rows") : null,
    children.controls ? countWord(children.controls, "control clause", "control clauses") : null,
    children.designations ? countWord(children.designations, "designation", "designations") : null,
  ].filter(Boolean);
  return parts.length ? `Records under this event: ${parts.join(", ")}.` : null;
}

export function EventsSection({ payload }: { payload: DossierPayload }) {
  return (
    <section id="events" className="scroll-mt-24">
      <h2 className="border-b border-border pb-2 font-display text-xl font-semibold">Events ({payload.events.length})</h2>
      {payload.actorStatuses.length ? (
        <div className="mt-4">
          <h3 className="font-display text-base font-semibold">Policy status across actors</h3>
          <p className="mt-1 text-sm leading-6 text-faint">Where each actor&apos;s coded measures on this material currently stand.</p>
          <Card className="mt-3 divide-y divide-border overflow-hidden">
            {payload.actorStatuses.map(({ actor, statuses }) => (
              <div key={actor} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="flex items-center gap-3">
                  <ActorMonogram code={jurisdictionShort[actor]} size="sm" />
                  <span className="font-display text-sm font-medium">{jurisdictionLabels[actor]}</span>
                </span>
                <span className="flex flex-wrap justify-end gap-1">
                  {statuses.map((s) => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </span>
              </div>
            ))}
          </Card>
        </div>
      ) : null}
      {payload.events.length ? (
        <Card className="mt-6 overflow-hidden">
          {payload.events.map((row) => {
            const line = childLine(row.children);
            return (
              <div key={row.event.id} data-event={row.event.id} className="border-b last:border-b-0">
                <EventListItem event={row.event} />
                {line || row.supersededBy ? (
                  <div className="space-y-0.5 px-5 pb-3 text-xs leading-5 text-muted">
                    {line ? <p>{line}</p> : null}
                    {row.supersededBy ? (
                      <p>
                        Superseded by{" "}
                        <Link href={`/events/${row.supersededBy.id}`} className="text-accent hover:text-accent-strong">
                          {row.supersededBy.title}
                        </Link>
                        .
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </Card>
      ) : (
        <p className="mt-4 leading-7 text-muted">No events coded yet.</p>
      )}
    </section>
  );
}

const KIND_LABELS: Record<CitedKind, string> = {
  event: "event",
  capital_row: "capital row",
  control_clause: "control clause",
  designation: "designation",
  project: "project",
  framing_claim: "framing claim on an event",
  material_record: "material record",
  registry_record: "registry record",
};

function CitedBy({ citedBy }: { citedBy: SourceCitation["citedBy"] }) {
  const kinds = [...new Set(citedBy.map((c) => c.kind))];
  return (
    <p className="mt-1 text-xs leading-5 text-faint">
      Cited by:{" "}
      {kinds.map((k, i) => {
        const of = citedBy.filter((c) => c.kind === k);
        const first = of[0];
        return (
          <span key={k}>
            {of.length > 1 ? `${of.length} ` : ""}
            {KIND_LABELS[k]}
            {of.length > 1 ? "s" : ""}
            {first.href ? (
              <>
                {" ("}
                <Link href={first.href} className="text-accent hover:text-accent-strong">
                  {first.label}
                </Link>
                {of.length > 1 ? ", and others" : ""}
                {")"}
              </>
            ) : null}
            {i < kinds.length - 1 ? "; " : ""}
          </span>
        );
      })}
    </p>
  );
}

function NameList({ items }: { items: RelatedItem[] }) {
  return (
    <FoldedList
      items={items}
      limit={5}
      label="Show all"
      className="space-y-1.5"
      render={(i) => (
        <li key={i.id} className="text-sm leading-6">
          <Link href={i.href} className="text-accent hover:text-accent-strong">
            {i.name}
          </Link>
        </li>
      )}
    />
  );
}

export function RelatedSection({ payload }: { payload: DossierPayload }) {
  const r = payload.related;
  return (
    <section id="related" className="scroll-mt-24">
      <h2 className="border-b border-border pb-2 font-display text-xl font-semibold">Cited by these records</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Programmes, organizations and sources named by the events and rows above. Lists show the first five; the rest are behind the disclosure.</p>
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="font-display text-base font-semibold">Programmes ({r.programmes.length})</h3>
          <div className="mt-2">
            <NameList items={r.programmes} />
          </div>
        </div>
        <div>
          <h3 className="font-display text-base font-semibold">Organizations ({r.organizations.length})</h3>
          <div className="mt-2">
            <NameList items={r.organizations} />
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="font-display text-base font-semibold">Sources ({r.sources.length})</h3>
        <p className="mt-1 text-xs leading-5 text-faint">
          Sources cited by the events, by every capital row, control clause, designation and project naming {payload.nameEn}, by framing claims on those events, and by the material record. Registry evidence for organizations and programmes is not counted.
        </p>
        <div className="mt-3">
          <FoldedList
            items={r.sources}
            limit={5}
            label="Show all"
            className="space-y-3"
            render={(s) => (
              <li key={s.source.id} className="rounded-md border border-border bg-card p-3 text-sm">
                <p className="font-display font-semibold leading-snug">{s.source.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">
                  {s.source.publisher}
                  {s.source.datePublished ? `, published ${formatDate(s.source.datePublished)}` : ", publication date not stated"}
                </p>
                <ExtLink href={s.source.url} className="mt-1 block break-all text-xs">
                  {s.source.url}
                </ExtLink>
                <CitedBy citedBy={s.citedBy} />
              </li>
            )}
          />
        </div>
      </div>
      {r.legalBasis.length ? (
        <div className="mt-8">
          <h3 className="font-display text-base font-semibold">Legal-basis events of these clauses</h3>
          <p className="mt-1 text-xs leading-5 text-faint">Named as the legal basis of a control clause. They are not counted among this material&apos;s events unless the event names it.</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6">
            {r.legalBasis.map((b) => (
              <li key={b.id}>
                <Link href={b.href} className="text-accent hover:text-accent-strong">
                  {b.name}
                </Link>
                {b.date ? <span className="text-faint">, {formatDate(b.date)}</span> : null}
                <span className="text-faint">
                  {" "}
                  · legal basis of {countWord(b.clauses, "clause", "clauses")}
                  {b.inMaterialEvents ? "; also one of the events above" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
