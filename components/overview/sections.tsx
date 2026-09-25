/**
 * The overview's reading sections under the lattice: what the record holds, the dated register, and capital and
 * control on the as-of date. Every figure is a count of records of one kind, or the existing per-currency,
 * per-instrument totals from `totalCommitments`; nothing here is added across kinds, currencies or instruments.
 */
import Link from "next/link";
import { JurisdictionTag } from "@/components/labels";
import { CurrencyTotals } from "@/components/intelligence/totals";
import { controlClocks, controlIssuer, controlStatusOn, daysBetween, publicCommitmentRows, totalCommitments } from "@/lib/capital-control";
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getAllProjectDesignations,
  getDatasetSummary,
  getEventById,
} from "@/lib/data";
import { formatDate, formatDateLong } from "@/lib/format";
import { controlStatusLabels, jurisdictionLabels } from "@/lib/labels";
import type { LatticeModel } from "@/lib/lattice";
import { site } from "@/lib/site";
import type { ControlStatus, JurisdictionCode } from "@/lib/types";
import { cn } from "@/lib/utils";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 max-w-xl text-[15px] leading-7 text-paper-muted">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-3xl font-semibold leading-tight text-paper-foreground">{children}</h2>;
}

// --- What the record holds -------------------------------------------------------------------------

export function RecordCounts({ asOf }: { asOf: string }) {
  const s = getDatasetSummary();
  const link = "font-semibold underline decoration-paper-foreground/40 underline-offset-4 hover:decoration-paper-foreground";
  return (
    <p className="mx-auto max-w-6xl px-4 py-7 text-[15px] leading-8 text-paper-foreground sm:px-6 lg:px-8">
      On {formatDateLong(asOf)} the record holds{" "}
      <Link href="/events" className={link}>{s.events} events</Link>,{" "}
      <Link href="/controls" className={link}>{s.controlMeasures} control clauses</Link> and{" "}
      <Link href="/capital" className={link}>{s.financialCommitments} capital rows</Link>, linked to{" "}
      <Link href="/projects" className={link}>{s.projects} projects</Link>,{" "}
      <Link href="/programmes" className={link}>{s.programmes} programmes</Link> and{" "}
      <Link href="/organizations" className={link}>{s.organizations} organizations</Link>, with{" "}
      <Link href="/projects" className={link}>{s.projectDesignations} designations</Link>,{" "}
      <Link href="/framing" className={link}>{s.framingClaims} framing anchors</Link> and{" "}
      <Link href="/sources" className={link}>{s.sources} sources</Link>. Each type is counted on its own.
    </p>
  );
}

// --- Dated register --------------------------------------------------------------------------------

/** "1 capital row, 2 designations": what an event's child rows are, each kind on its own. */
function recordsLine(eventId: string): string | null {
  const capital = getAllFinancialCommitments().filter((c) => c.eventId === eventId).length;
  const clauses = getAllControlMeasures().filter((m) => m.eventId === eventId).length;
  const designations = getAllProjectDesignations().filter((d) => d.eventId === eventId).length;
  const parts = [
    capital ? plural(capital, "capital row") : null,
    clauses ? plural(clauses, "control clause") : null,
    designations ? plural(designations, "designation") : null,
  ].filter(Boolean);
  return parts.length ? `Records ${parts.join(", ")}` : null;
}

type EndDateGroup = { until: string; text: string; days: number };

/** Current statuses that carry a stated end date, grouped by that date: a suspension's stated end is not an observed change. */
function endDateGroups(asOf: string): EndDateGroup[] {
  const byDate = new Map<string, ReturnType<typeof controlClocks>>();
  for (const c of controlClocks(asOf)) {
    const list = byDate.get(c.entry.until!) ?? [];
    list.push(c);
    byDate.set(c.entry.until!, list);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([until, items]) => {
      const byStatus = new Map<ControlStatus, number>();
      for (const i of items) byStatus.set(i.entry.status, (byStatus.get(i.entry.status) ?? 0) + 1);
      const clauses = [...byStatus].map(([s, n]) => `${n} ${controlStatusLabels[s].toLowerCase()} ${n === 1 ? "clause" : "clauses"}`).join(" and ");
      const docs = [...new Set(items.map((i) => getEventById(i.measure.eventId)?.documentNumber ?? getEventById(i.measure.eventId)?.titleEn ?? i.measure.eventId))];
      const total = items.length;
      return {
        until,
        days: daysBetween(asOf, until),
        text: `${clauses} of ${docs.join(" and ")} ${total === 1 ? "carries" : "carry"} this end date.`,
      };
    });
}

export function DatedRegister({ asOf }: { asOf: string }) {
  const groups = endDateGroups(asOf);
  const recent = getAllEvents().filter((e) => e.date <= asOf).slice(0, 4);
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="border-t border-paper-foreground/70 pt-8">
        <SectionTitle>Dated register</SectionTitle>
        <Lead>Newest first. Every entry names the kind of date it carries.</Lead>
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_16rem]">
        <div>
          {groups.length ? (
            <ol className="divide-y divide-dashed divide-paper-border">
              {groups.map((g) => (
                <li key={g.until} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[8.5rem_1fr]">
                  <div>
                    <time dateTime={g.until} className="tnum font-serif text-lg font-semibold text-paper-foreground">{formatDate(g.until)}</time>
                    <p className="mt-0.5 font-display text-xs text-paper-faint">Stated end date</p>
                  </div>
                  <div>
                    <p className="font-serif text-base leading-6 text-paper-foreground">{g.text}</p>
                    <p className="mt-1 text-[13px] leading-5 text-paper-faint">
                      {g.days === 0 ? "On the as-of date." : `${plural(Math.abs(g.days), "day")} ${g.days > 0 ? "after" : "before"} the as-of date.`} Stated in the source, not an observed change.
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          <div className="mt-6 border-t-2 border-paper-accent pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6">
              <h3 className="font-serif text-lg font-semibold text-paper-accent">Record as of {formatDateLong(asOf)}</h3>
              <p className="font-display text-xs text-paper-faint">The date the data was last checked. Nothing later is known to the record.</p>
            </div>
            <ol className="mt-2 divide-y divide-paper-border">
              {recent.map((e) => {
                const line = recordsLine(e.id);
                return (
                  <li key={e.id} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[8.5rem_1fr]">
                    <div>
                      <time dateTime={e.date} className="tnum font-serif text-lg font-semibold text-paper-foreground">{formatDate(e.date)}</time>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 font-display text-xs text-paper-faint">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-paper-foreground" /> Event date
                      </p>
                    </div>
                    <div>
                      <Link href={`/events/${e.id}`} className="font-serif text-base leading-6 text-paper-foreground hover:underline">
                        {e.titleEn}
                      </Link>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-paper-faint">
                        <JurisdictionTag code={e.jurisdiction} />
                        {e.documentNumber ? <span className="font-mono text-xs">{e.documentNumber}</span> : null}
                        {line ? <span>{line}</span> : null}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          <Link href="/timeline" className="mt-5 inline-block font-display text-sm font-semibold text-paper-foreground underline decoration-paper-foreground/40 underline-offset-4 hover:decoration-paper-foreground">
            Open the full register →
          </Link>
        </div>

        <aside className="space-y-6 text-sm leading-6 lg:border-l lg:border-paper-border lg:pl-6">
          <div>
            <h3 className="font-display text-sm font-semibold text-paper-foreground">Two kinds of date on this list</h3>
            <dl className="mt-3 space-y-3 text-paper-muted">
              <div>
                <dt className="font-display font-semibold text-paper-foreground">Event date</dt>
                <dd>When the instrument was issued or announced.</dd>
              </div>
              <div>
                <dt className="font-display font-semibold text-paper-foreground">Stated end date</dt>
                <dd>A date the source gives for the end of a suspension. It is a date the source states, not an observed change.</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-paper-foreground">Not a live feed</h3>
            <p className="mt-1 text-paper-muted">
              {site.monitoringStartedAt
                ? `Prospective monitoring began ${formatDateLong(site.monitoringStartedAt)}.`
                : "Prospective monitoring has not started. Every record was added retrospectively from its sources."}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

// --- Capital and control ---------------------------------------------------------------------------

const STATUS_ORDER: ControlStatus[] = ["in_force", "scheduled", "announced", "suspended", "investigation", "concluded", "expired", "revoked", "not_stated"];

/** One square per clause. Status is carried by pattern as well as tone, and named in text under each group. */
const SQUARE: Record<ControlStatus, string> = {
  in_force: "bg-paper-foreground",
  scheduled: "border-2 border-dashed border-paper-foreground",
  announced: "border-2 border-paper-foreground",
  suspended: "border border-paper-foreground bg-[repeating-linear-gradient(135deg,var(--paper-fg)_0_1.5px,transparent_1.5px_4px)]",
  investigation: "border-2 border-dotted border-paper-foreground",
  concluded: "bg-[#b9b2a3]",
  expired: "border border-paper-faint bg-paper-border",
  revoked: "border border-paper-faint bg-paper-border",
  not_stated: "border border-paper-border",
};

export function ControlSquares({ asOf, gaps }: { asOf: string; gaps: LatticeModel["gaps"] }) {
  const controls = getAllControlMeasures();
  const byIssuer = new Map<JurisdictionCode, Map<ControlStatus, number>>();
  for (const m of controls) {
    const issuer = controlIssuer(m);
    const status = controlStatusOn(m, asOf) ?? "not_stated";
    const row = byIssuer.get(issuer) ?? new Map<ControlStatus, number>();
    row.set(status, (row.get(status) ?? 0) + 1);
    byIssuer.set(issuer, row);
  }
  const issuers = [...byIssuer.entries()].sort(([, a], [, b]) => [...b.values()].reduce((x, y) => x + y, 0) - [...a.values()].reduce((x, y) => x + y, 0));
  return (
    <div>
      <h3 className="font-display text-sm font-semibold text-paper-foreground">Of {controls.length} control clauses</h3>
      <ul className="mt-4 space-y-5">
        {issuers.map(([issuer, statuses]) => {
          const total = [...statuses.values()].reduce((x, y) => x + y, 0);
          return (
            <li key={issuer} className="grid gap-x-4 gap-y-2 sm:grid-cols-[6.5rem_1fr]">
              <div>
                <p className="font-display text-sm font-semibold text-paper-foreground">{jurisdictionLabels[issuer]}</p>
                <p className="font-display text-xs text-paper-faint">{plural(total, "clause")} issued</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {STATUS_ORDER.filter((s) => statuses.has(s)).map((s) => (
                  <div key={s} className="max-w-[13.5rem]">
                    <div className="flex flex-wrap gap-1" role="img" aria-label={`${statuses.get(s)} ${controlStatusLabels[s].toLowerCase()}`}>
                      {Array.from({ length: statuses.get(s)! }, (_, i) => (
                        <span key={i} aria-hidden className={cn("h-3.5 w-3.5", SQUARE[s])} />
                      ))}
                    </div>
                    <p className="mt-1 font-display text-xs text-paper-muted">
                      <span className="tnum font-semibold text-paper-foreground">{statuses.get(s)}</span> {controlStatusLabels[s].toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-[13px] leading-5 text-paper-faint">
        One square is one clause, at its status on {formatDate(asOf)}. {gaps.controls.placed} clauses record a stage and appear on the lattice; {gaps.controls.noStage} do not.
      </p>
    </div>
  );
}

export function PublicCommitments({ gaps }: { gaps: LatticeModel["gaps"] }) {
  const totals = totalCommitments(publicCommitmentRows());
  const indications = gaps.capital.otherRoles.indication ?? 0;
  const apart = [
    indications ? plural(indications, "non-binding indication") : null,
    totals.statusNotStatedIds.length ? `${plural(totals.statusNotStatedIds.length, "row")} with no stated status` : null,
    totals.unquantifiedIds.length ? `${plural(totals.unquantifiedIds.length, "row")} with no amount` : null,
    totals.endedIds.length ? `${plural(totals.endedIds.length, "ended row")}` : null,
  ].filter(Boolean);
  return (
    <div>
      <h3 className="font-display text-sm font-semibold text-paper-foreground">Public commitments that have not ended</h3>
      <div className="mt-4 rounded-xl bg-background p-4 text-foreground sm:p-5">
        <CurrencyTotals totals={totals} />
      </div>
      <p className="mt-4 border-l-2 border-paper-foreground bg-paper-border/40 px-3 py-2 text-[13px] leading-5 text-paper-muted">
        Binding means a contract has been executed or money paid; an executed contract need not have obligated or paid any funds. Not yet binding covers every earlier stage the source states.
      </p>
      <p className="mt-3 text-[13px] leading-5 text-paper-faint">
        Never added across currencies or instruments. &ldquo;Up to&rdquo; and &ldquo;about&rdquo; figures are added only to others with the same wording, and a part is never added to its package.
        {apart.length ? ` Listed apart: ${apart.join(", ")}.` : ""}
      </p>
    </div>
  );
}

export function CapitalAndControl({ asOf, gaps }: { asOf: string; gaps: LatticeModel["gaps"] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="border-t border-paper-foreground/70 pt-8">
        <SectionTitle>Capital and control on {formatDateLong(asOf)}</SectionTitle>
        <Lead>Control clauses by issuer and legal status, and public commitments by currency and instrument. The two are counted apart.</Lead>
      </div>
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.15fr]">
        <ControlSquares asOf={asOf} gaps={gaps} />
        <PublicCommitments gaps={gaps} />
      </div>
    </section>
  );
}
