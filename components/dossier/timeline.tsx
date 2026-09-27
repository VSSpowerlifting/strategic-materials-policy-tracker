import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { DossierPayload } from "@/lib/material-dossier";
import { Chip } from "./parts";

const DOT = 10;
const LANE = 16;

export function TimelineSection({ payload }: { payload: DossierPayload }) {
  const t = payload.timeline;
  const height = Math.max(1, t.lanes) * LANE + 4;
  return (
    <section id="timeline" className="scroll-mt-24">
      <h2 className="border-b border-border pb-2 font-display text-xl font-semibold">Timeline</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        One dot for each event, placed at its event date as coded. Capital-row and clause status dates are not plotted: a status with no date has no honest position, and an event date is never used in its place.
      </p>
      <div className="mt-5 rounded-lg border border-border bg-card/50 px-4 pb-3 pt-5">
        <div className="relative mx-[6px]" style={{ height }} role="group" aria-label={`${payload.nameEn} events by event date`}>
          {t.points.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              title={`${formatDate(p.date)}: ${p.title}`}
              aria-label={`${formatDate(p.date)}, ${p.actorShort}: ${p.title}`}
              data-event-date={p.date}
              className="absolute rounded-full bg-mark-commitment outline-offset-2 hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              style={{ left: `${p.pct}%`, top: p.lane * LANE + 2, width: DOT, height: DOT, transform: "translateX(-50%)" }}
            />
          ))}
          <span aria-hidden className="absolute inset-y-[-8px] w-px bg-accent" style={{ left: `${t.asOfPct}%` }} data-as-of={t.asOf} />
        </div>
        <div className="relative mx-[6px] mt-1 h-5 border-t border-border-strong" aria-hidden>
          {t.ticks.map((k) => (
            <span
              key={k.year}
              className={`absolute top-1 -translate-x-1/2 font-mono text-[10px] text-faint ${k.phone ? "" : "max-sm:hidden"}`}
              style={{ left: `${k.pct}%` }}
            >
              {k.year}
            </span>
          ))}
        </div>
        <p className="mt-2 flex flex-wrap items-center justify-between gap-x-4 font-display text-xs text-faint">
          <span>Event date (as coded)</span>
          <span>
            <span aria-hidden className="mr-1 inline-block h-3 w-px translate-y-0.5 bg-accent" />
            Gold rule: as of {formatDate(t.asOf)}
          </span>
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted" data-future-note>
        {t.futureDates.length === 0
          ? `No ${payload.nameEn.toLowerCase()} record states a date after the as-of.`
          : `Dates stated after the as-of: ${t.futureDates.map((f) => `${formatDate(f.date)} (${f.source})`).join("; ")}.`}
      </p>
      <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Newest events</h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {t.newest.map((e) => (
          <li key={e.id}>
            <Link href={e.href} className="flex min-h-[44px] flex-col justify-center rounded-md border border-border bg-card px-3 py-2 hover:border-accent/40 hover:bg-elevated">
              <span className="flex items-center gap-2">
                <Chip>{e.actorShort}</Chip>
                <time dateTime={e.date} className="tnum font-mono text-[11px] text-faint">
                  {formatDate(e.date)}
                </time>
              </span>
              <span className="mt-1 text-pretty font-display text-sm font-semibold leading-snug">{e.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
